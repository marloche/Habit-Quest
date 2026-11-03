import type { Habit, State } from './logic/types';

const KEY = 'habit-quest';

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

// Trust boundary: imported files and old saves go through here.
export function parseState(text: string): State {
  const x = JSON.parse(text);
  const ok =
    x && x.v === 1 &&
    x.settings && typeof x.settings.rolloverHour === 'number' &&
    Array.isArray(x.habits) &&
    x.habits.every((h: any) => /^[\w-]{1,40}$/.test(h.id) && typeof h.name === 'string' && isDay(h.created) &&
      ['daily', 'days', 'weekly'].includes(h.schedule?.kind)) &&
    x.log && typeof x.log === 'object' &&
    Object.entries(x.log).every(([d, marks]) => isDay(d) && Object.values(marks as object).every((m) => m === 'full' || m === 'tiny'));
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
