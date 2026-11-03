import { daysBetween } from './logic/day';
import { emptyWardrobe, SLOTS } from './logic/items';
import { FOCUS_MAX } from './logic/focus';
import { JOURNAL_MAX } from './logic/journal';
import type { Settings, State } from './logic/types';

export const KEY = 'habit-quest';

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// A clean slate: no quests yet, so the app opens on the welcome goal picker. NEW GAME keeps your settings.
export function fresh(settings: Settings = { rolloverHour: 4, muted: false }): State {
  return {
    v: 5,
    settings,
    habits: [],
    log: {},
    wardrobe: emptyWardrobe(),
    journal: {},
    focus: {},
  };
}

const isDay = (x: unknown) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const isInt = (x: unknown, min: number, max: number) => Number.isInteger(x) && (x as number) >= min && (x as number) <= max;
const optional = (x: unknown, check: (v: unknown) => boolean) => x === undefined || check(x);

function validSchedule(s: any) {
  if (s?.kind === 'daily') return true;
  if (s?.kind === 'days') return Array.isArray(s.days) && s.days.length > 0 && s.days.every((d: unknown) => isInt(d, 0, 6));
  if (s?.kind === 'weekly') return isInt(s.times, 1, 7);
  if (s?.kind === 'once') return isDay(s.day);
  return false;
}

const isId = (x: unknown) => typeof x === 'string' && /^[\w-]{1,80}$/.test(x);
const isRecord = (x: unknown) => !!x && typeof x === 'object' && !Array.isArray(x);
const entriesOk = (x: unknown, ok: (k: string, v: any) => boolean) => isRecord(x) && Object.entries(x as object).every(([k, v]) => ok(k, v));

const validWardrobe = (w: any) =>
  isRecord(w) &&
  entriesOk(w.owned, (k, v) => isId(k) && isRecord(v) && isDay(v.day) && isInt(v.paid, 0, 1e6)) &&
  entriesOk(w.worn, (k, v) => (SLOTS as string[]).includes(k) && isId(v)) &&
  entriesOk(w.opened, (k, v) => isId(k) && isRecord(v) && isDay(v.day) && optional(v.gold, (g) => isInt(g, 0, 1e6)) && optional(v.item, isId));

const validJournal = (j: unknown) =>
  entriesOk(j, (k, v) => isDay(k) && isRecord(v) && isInt(v.mood, 1, 5) && optional(v.text, (t) => typeof t === 'string' && t.length <= JOURNAL_MAX));

const validHabit = (h: any) =>
  /^[\w-]{1,40}$/.test(h?.id) && typeof h.name === 'string' && typeof h.icon === 'string' && isDay(h.created) &&
  optional(h.archived, isDay) && optional(h.tiny, (t) => typeof t === 'string') && validSchedule(h.schedule) &&
  optional(h.focus, (m) => isInt(m, 1, FOCUS_MAX));

const validFocus = (f: unknown) => entriesOk(f, (k, v) => isDay(k) && isInt(v, 0, 1440));

// Trust boundary: imported files and old saves go through here. Anything the renderer reads must be checked,
// because an invalid save is stored before the first render and would crash every launch after.
export function parseState(text: string): State {
  const x = JSON.parse(text);
  const s = x?.settings;
  const ok =
    x && isInt(x.v, 1, 5) &&
    (x.v < 3 || validWardrobe(x.wardrobe)) && (x.v < 4 || validJournal(x.journal)) && (x.v < 5 || validFocus(x.focus)) &&
    s && isInt(s.rolloverHour, 0, 23) && typeof s.muted === 'boolean' && optional(s.lastBackup, isDay) &&
    optional(s.wakeLock, (w) => typeof w === 'boolean') &&
    optional(x.lastOpened, isDay) &&
    Array.isArray(x.habits) && x.habits.every(validHabit) &&
    x.log && typeof x.log === 'object' && !Array.isArray(x.log) &&
    Object.entries(x.log).every(([d, marks]) => isDay(d) && marks && typeof marks === 'object' &&
      Object.values(marks).every((m) => m === 'full' || m === 'tiny'));
  if (!ok) throw new Error('Not a Habit Quest save file');
  // v1 -> v2 added planned quests (old data is valid as is); v2 -> v3 added the wardrobe; v3 -> v4 the journal;
  // v4 -> v5 focus minutes (quest timers and the wake setting are optional fields).
  if (x.v < 3) x.wardrobe = emptyWardrobe();
  if (x.v < 4) x.journal = {};
  if (x.v < 5) x.focus = {};
  x.v = 5;
  return x as State;
}

export function load(): State {
  const raw = localStorage.getItem(KEY);
  if (!raw) return fresh();
  try {
    return parseState(raw);
  } catch {
    // Never silently overwrite a save we can't read: park it for manual recovery.
    localStorage.setItem(`${KEY}-unreadable-${Date.now()}`, raw);
    return fresh();
  }
}

export const save = (s: State) => localStorage.setItem(KEY, JSON.stringify(s));

export const BACKUP_DAYS = 7;

// Days since the last export, or undefined if there's nothing worth backing up yet.
export function backupAge(s: State, today: string): number | undefined {
  if (!Object.keys(s.log).length) return undefined;
  return s.settings.lastBackup ? daysBetween(s.settings.lastBackup, today) : Infinity;
}

export async function exportFile(s: State, today: string) {
  const file = new File([JSON.stringify(s, null, 1)], `Habit-Quest-${today}.json`, { type: 'application/json' });
  // iPhone home-screen apps handle the share sheet (Save to Files) better than downloads.
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] });
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
