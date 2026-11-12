import type { State } from './types';

// Sync between devices. The part both devices share: progress, plus the new-day hour (it decides which day a check
// counts for). Sound, display, screen-on and backup date stay per device.
export type Shared = Pick<State, 'habits' | 'log' | 'wardrobe' | 'journal' | 'focus' | 'epics' | 'look'> & { rolloverHour: number };

export const sharedOf = (s: State): Shared => ({
  habits: s.habits, log: s.log, wardrobe: s.wardrobe, journal: s.journal, focus: s.focus, epics: s.epics,
  ...(s.look ? { look: s.look } : {}), rolloverHour: s.settings.rolloverHour,
});

// This device's state with the shared part replaced; per-device settings are kept.
export function withShared(s: State, sh: Shared): State {
  const { rolloverHour, look, ...rest } = sh;
  const next: State = { ...s, ...rest, settings: { ...s.settings, rolloverHour } };
  if (look) next.look = look;
  else delete next.look;
  return next;
}

// JSON with sorted keys, so two equal values always compare equal whatever order their fields were written in.
export const canon = (x: unknown): string => JSON.stringify(x, (_, v) =>
  v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1))) : v);

const same = (a: unknown, b: unknown) => canon(a) === canon(b);

type Rec = Record<string, unknown>;

// Three-way: whichever side changed an item since the base wins (a delete is a change too). Both changed it
// differently: the side that saved later wins.
function pick<T>(b: T | undefined, l: T | undefined, r: T | undefined, localLater: boolean): T | undefined {
  if (same(l, r)) return l;
  if (same(l, b)) return r;
  if (same(r, b)) return l;
  return localLater ? l : r;
}

function mergeMap<T>(b: Rec | undefined, l: Rec | undefined, r: Rec | undefined, cell: (b?: T, l?: T, r?: T) => T | undefined) {
  const out: Record<string, T> = {};
  for (const k of new Set([...Object.keys(l ?? {}), ...Object.keys(r ?? {})])) {
    const v = cell(b?.[k] as T, l?.[k] as T, r?.[k] as T);
    if (v !== undefined) out[k] = v;
  }
  return out;
}

// Lists of things with ids (quests, epics): merged item by item; the order comes from whichever side reordered.
function mergeList<T extends { id: string }>(b: T[], l: T[], r: T[], localLater: boolean): T[] {
  const byId = (xs: T[]) => Object.fromEntries(xs.map((x) => [x.id, x]));
  const items = mergeMap<T>(byId(b), byId(l), byId(r), (bi, li, ri) => pick(bi, li, ri, localLater));
  const ids = (xs: T[]) => xs.map((x) => x.id);
  const first = same(ids(l), ids(b)) ? r : l;
  const order = [...ids(first), ...ids(first === l ? r : l)];
  return [...new Set(order)].filter((id) => items[id]).map((id) => items[id]);
}

const EMPTY: Shared = { habits: [], log: {}, wardrobe: { owned: {}, worn: {}, opened: {} }, journal: {}, focus: {}, epics: [], rolloverHour: 4 };

// base: the copy both sides last agreed on; none on the very first sync, when the two are simply joined together.
// localLater: this device saved after the other one, so it wins items both changed.
export function merge(base: Shared | undefined, local: Shared, remote: Shared, localLater: boolean): Shared {
  const b = base ?? EMPTY;
  const p = <T>(bv?: T, lv?: T, rv?: T) => pick(bv, lv, rv, localLater);
  const log = mergeMap<Rec>(b.log, local.log, remote.log, (bd, ld, rd) => {
    const day = mergeMap(bd, ld, rd, p);
    return Object.keys(day).length ? day : undefined;
  });
  // Focus minutes add up: 20 here and 25 there since the base is 45 more. Without a base the two may share
  // history (one was imported from the other), so the larger wins instead of doubling it.
  const focus = mergeMap<number>(b.focus, local.focus, remote.focus, (bm, lm, rm) => {
    const v = base ? (lm ?? 0) + (rm ?? 0) - (bm ?? 0) : Math.max(lm ?? 0, rm ?? 0);
    return v > 0 ? Math.min(1440, v) : undefined;
  });
  const w = (k: keyof Shared['wardrobe']) => mergeMap(b.wardrobe[k], local.wardrobe[k], remote.wardrobe[k], p);
  const look = p(b.look, local.look, remote.look);
  // shortcut: an epic edited on both devices between syncs keeps only the later edit (amounts logged on the other are lost); merge its logs if that bites.
  return {
    habits: mergeList(b.habits, local.habits, remote.habits, localLater),
    log: log as Shared['log'],
    wardrobe: { owned: w('owned'), worn: w('worn'), opened: w('opened') } as Shared['wardrobe'],
    journal: mergeMap(b.journal, local.journal, remote.journal, p) as Shared['journal'],
    focus,
    epics: mergeList(b.epics, local.epics, remote.epics, localLater),
    ...(look ? { look } : {}),
    rolloverHour: p(b.rolloverHour, local.rolloverHour, remote.rolloverHour) ?? local.rolloverHour,
  };
}
