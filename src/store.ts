import { daysBetween } from './logic/day';
import type { Habit, State } from './logic/types';

export const KEY = 'habit-quest';

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function fresh(today: string): State {
  const h = (name: string, icon: string, tiny?: string): Habit => ({ id: newId(), name, icon, tiny, schedule: { kind: 'daily' }, created: today });
  return {
    v: 1,
    settings: { rolloverHour: 4, muted: false },
    habits: [h('Workout', 'dumbbell', '1 pushup'), h('Read 20 min', 'book', 'Read 1 page'), h('Drink water', 'drop')],
    log: {},
  };
}

const isDay = (x: unknown) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const isInt = (x: unknown, min: number, max: number) => Number.isInteger(x) && (x as number) >= min && (x as number) <= max;
const optional = (x: unknown, check: (v: unknown) => boolean) => x === undefined || check(x);

function validSchedule(s: any) {
  if (s?.kind === 'daily') return true;
  if (s?.kind === 'days') return Array.isArray(s.days) && s.days.length > 0 && s.days.every((d: unknown) => isInt(d, 0, 6));
  if (s?.kind === 'weekly') return isInt(s.times, 1, 7);
  return false;
}

const validHabit = (h: any) =>
  /^[\w-]{1,40}$/.test(h?.id) && typeof h.name === 'string' && typeof h.icon === 'string' && isDay(h.created) &&
  optional(h.archived, isDay) && optional(h.tiny, (t) => typeof t === 'string') && validSchedule(h.schedule);

// Trust boundary: imported files and old saves go through here. Anything the renderer reads must be checked,
// because an invalid save is stored before the first render and would crash every launch after.
export function parseState(text: string): State {
  const x = JSON.parse(text);
  const s = x?.settings;
  const ok =
    x && x.v === 1 &&
    s && isInt(s.rolloverHour, 0, 23) && typeof s.muted === 'boolean' && optional(s.lastBackup, isDay) &&
    optional(x.lastOpened, isDay) &&
    Array.isArray(x.habits) && x.habits.every(validHabit) &&
    x.log && typeof x.log === 'object' && !Array.isArray(x.log) &&
    Object.entries(x.log).every(([d, marks]) => isDay(d) && marks && typeof marks === 'object' &&
      Object.values(marks).every((m) => m === 'full' || m === 'tiny'));
  if (!ok) throw new Error('Not a Habit Quest save file');
  return x as State;
}

export function load(today: string): State {
  const raw = localStorage.getItem(KEY);
  if (!raw) return fresh(today);
  try {
    return parseState(raw);
  } catch {
    // Never silently overwrite a save we can't read: park it for manual recovery.
    localStorage.setItem(`${KEY}-unreadable-${Date.now()}`, raw);
    return fresh(today);
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
