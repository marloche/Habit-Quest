import { canon, merge, sharedOf, withShared, type Shared } from './logic/merge';
import type { State } from './logic/types';
import { parseState } from './store';

// Keeps devices in step through one file in a private GitHub repo you own. The only network call the app makes
// besides loading itself. Pulls on open, on coming back to the screen and every minute while shown; pushes a few
// seconds after a change. Offline, changes wait and merge on the next sync.

const CFG_KEY = 'habit-quest-sync'; // repo + token: this device only, never in an export
const BASE_KEY = 'habit-quest-sync-base'; // the copy both sides last agreed on
const AT_KEY = 'habit-quest-sync-at'; // when this device last changed its progress
const FILE = 'habit-quest.json';
const API = 'https://api.github.com';

type Cfg = { repo: string; token: string; last?: number };
type Remote = { shared: Shared; savedAt: number; sha: string };
export type SyncStatus = { on: boolean; repo?: string; state: 'idle' | 'syncing' | 'ok' | 'offline' | 'error'; msg?: string; last?: number };

let hooks: { get: () => State; apply: (s: State) => void; changed: () => void } | undefined;
const status: SyncStatus = { on: false, state: 'idle' };
let busy = false;
let again = false;
let applying = false;
let timer = 0;

const read = <T>(k: string): T | undefined => {
  try {
    return JSON.parse(localStorage.getItem(k) ?? 'null') ?? undefined;
  } catch {
    return undefined;
  }
};
const cfg = () => read<Cfg>(CFG_KEY);

export const syncStatus = (): SyncStatus => ({ ...status, on: !!cfg(), repo: cfg()?.repo, last: cfg()?.last });

// GitHub sends file contents as base64 of UTF-8 bytes; journal lines can hold any character.
const toB64 = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const fromB64 = (b: string) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

class SyncError extends Error {}

async function api(c: Cfg, path: string, init: RequestInit = {}) {
  let res: Response;
  try {
    res = await fetch(`${API}/repos/${c.repo}${path}`, {
      ...init,
      cache: 'no-cache', // revalidates every time (GitHub says "cache 60s"), cheaply via ETag
      headers: { Authorization: `Bearer ${c.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...init.headers },
    });
  } catch {
    throw new SyncError('offline');
  }
  if (res.status === 401) throw new SyncError('The sync token was refused (expired or revoked). Paste a new one in SETUP > SYNC.');
  if (res.status === 403) throw new SyncError("The token can't write to that repo, or GitHub is limiting requests. Check its Contents permission.");
  return res;
}

const isRepo = (r: string) => /^[\w.-]+\/[\w.-]+$/.test(r);

// The remote copy, checked like an imported file: it is built into a full save and validated before use.
async function pull(c: Cfg, local: State): Promise<Remote | undefined> {
  const res = await api(c, `/contents/${FILE}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new SyncError(`GitHub answered ${res.status}.`);
  const body = await res.json();
  let doc: Shared & { v?: number; savedAt?: number };
  try {
    doc = JSON.parse(fromB64(body.content));
  } catch {
    throw new SyncError('The saved copy on GitHub is unreadable. Nothing was changed.');
  }
  if ((doc.v ?? 0) > local.v) throw new SyncError('Another device runs a newer version. Reopen this app to update it.');
  const { v: _v, savedAt, ...shared } = doc;
  try {
    parseState(JSON.stringify(withShared(local, shared as Shared)));
  } catch {
    throw new SyncError('The saved copy on GitHub failed the save check. Nothing was changed.');
  }
  return { shared: shared as Shared, savedAt: Number(savedAt) || 0, sha: body.sha };
}

async function push(c: Cfg, shared: Shared, savedAt: number, sha?: string) {
  const content = toB64(JSON.stringify({ v: 6, savedAt, ...shared }));
  const res = await api(c, `/contents/${FILE}`, { method: 'PUT', body: JSON.stringify({ message: 'Habit Quest sync', content, ...(sha ? { sha } : {}) }) });
  if (res.status === 409 || res.status === 422) return false; // someone pushed in between: pull and merge again
  if (!res.ok) throw new SyncError(`GitHub answered ${res.status}.`);
  return true;
}

export async function syncNow(): Promise<void> {
  const c = cfg();
  if (!c || !hooks) return;
  if (busy) {
    again = true;
    return;
  }
  busy = true;
  setState('syncing');
  try {
    for (let tries = 0; ; tries++) {
      const remote = await pull(c, hooks.get());
      // Read this device's state only now: anything tapped while the pull was on its way is included.
      const local = hooks.get();
      const mine = sharedOf(local);
      const at = read<number>(AT_KEY) ?? 0;
      const merged = remote ? merge(read<Shared>(BASE_KEY), mine, remote.shared, at >= remote.savedAt) : mine;
      const savedAt = Math.max(at, remote?.savedAt ?? 0);
      try {
        parseState(JSON.stringify(withShared(local, merged)));
      } catch {
        throw new SyncError('The two copies could not be joined safely. Nothing was changed.');
      }
      if (canon(merged) !== canon(mine)) {
        applying = true;
        hooks.apply(withShared(local, merged));
        applying = false;
      }
      if (!remote || canon(merged) !== canon(remote.shared)) {
        if (!(await push(c, merged, savedAt, remote?.sha))) {
          if (tries < 3) continue;
          throw new SyncError('Another device kept saving at the same time. Will try again shortly.');
        }
      }
      localStorage.setItem(BASE_KEY, JSON.stringify(merged));
      localStorage.setItem(CFG_KEY, JSON.stringify({ ...c, last: Date.now() }));
      setState('ok');
      break;
    }
  } catch (e) {
    applying = false;
    if (e instanceof SyncError && e.message === 'offline') setState('offline', 'Offline. Changes wait here and sync when you are back online.');
    else setState('error', e instanceof SyncError ? e.message : 'Sync failed. Will try again shortly.');
  } finally {
    busy = false;
    if (again) {
      again = false;
      void syncNow();
    }
  }
}

function setState(s: SyncStatus['state'], msg?: string) {
  status.state = s;
  status.msg = msg;
  hooks?.changed();
}

// Called after every save. Marks this device's progress as changed (for "later save wins") and syncs soon.
export function noteSave() {
  if (applying || !cfg()) return;
  localStorage.setItem(AT_KEY, JSON.stringify(Date.now()));
  clearTimeout(timer);
  timer = window.setTimeout(() => void syncNow(), 4000);
}

// Checks the repo before saving the token: it must exist, be private (the journal is in there), and be writable.
// join: asked when GitHub already holds a save, before the two are joined; false cancels.
export async function connect(repo: string, token: string, join: (theirs: Shared) => boolean): Promise<string | undefined> {
  repo = repo.trim().replace(/^https:\/\/github\.com\//, '').replace(/\.git$|\/$/g, '');
  token = token.trim();
  if (!isRepo(repo)) return 'Repo should look like yourname/habit-quest-save.';
  if (!token) return 'Paste the token.';
  const c = { repo, token };
  const bad = await check(c, async () => {
    const theirs = hooks && (await pull(c, hooks.get()));
    return theirs && !join(theirs.shared) ? 'Not connected.' : undefined;
  });
  if (bad) return bad;
  localStorage.setItem(CFG_KEY, JSON.stringify(c));
  localStorage.removeItem(BASE_KEY); // first sync joins both sides
  await syncNow();
  return undefined;
}

async function check(c: Cfg, more?: () => Promise<string | undefined>): Promise<string | undefined> {
  try {
    const res = await api(c, '');
    if (res.status === 404) return "Repo not found, or the token can't see it.";
    if (!res.ok) return `GitHub answered ${res.status}.`;
    const r = await res.json();
    if (!r.private) return 'That repo is public. Use a private one: your journal is in the save.';
    if (!r.permissions?.push) return "The token can't write to that repo. Give it Contents: read and write.";
    return await more?.();
  } catch (e) {
    return e instanceof SyncError ? (e.message === 'offline' ? "Can't reach GitHub. Check your connection." : e.message) : 'Could not check the repo.';
  }
}

// A token expired: swap it and carry on where sync left off (the agreed copy is kept, so nothing gets re-joined).
export async function replaceToken(token: string): Promise<string | undefined> {
  const old = cfg();
  token = token.trim();
  if (!old) return 'Sync is off.';
  if (!token) return 'Paste the token.';
  const c = { ...old, token };
  const bad = await check(c);
  if (bad) return bad;
  localStorage.setItem(CFG_KEY, JSON.stringify(c));
  await syncNow();
  return undefined;
}

export function disconnect() {
  [CFG_KEY, BASE_KEY, AT_KEY].forEach((k) => localStorage.removeItem(k));
  setState('idle');
}

export function initSync(h: NonNullable<typeof hooks>) {
  hooks = h;
  const due = () => document.visibilityState === 'visible' && void syncNow();
  document.addEventListener('visibilitychange', due);
  addEventListener('focus', due); // a PC window brought to the front
  addEventListener('online', due);
  setInterval(due, 60_000);
  due();
}
