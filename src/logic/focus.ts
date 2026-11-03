import { weekStart } from './day';
import type { Focus } from './types';

export const FOCUS_MAX = 180; // minutes
export const MINUTE = 60_000;

// A running timer keeps its end time, not a countdown, so locking the phone or reloading can't lose it.
// day: the quest day it was started on, which is the day its check counts for.
export type Timer = { habit: string; day: string; start: number; end: number };

export const timeLeft = (t: Timer, now: number) => Math.max(0, t.end - now);
export const isOver = (t: Timer, now: number) => now >= t.end;
export const focusedMinutes = (t: Timer, now: number) => Math.max(0, Math.floor((Math.min(now, t.end) - t.start) / MINUTE));

export function clock(ms: number) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// The timer lives in its own storage key (it's temporary), so check what comes back.
export function parseTimer(raw: string | null): Timer | undefined {
  try {
    const t = JSON.parse(raw ?? 'null');
    const ok = t && typeof t.habit === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.day) &&
      Number.isFinite(t.start) && Number.isFinite(t.end) && t.end > t.start && t.end - t.start <= FOCUS_MAX * MINUTE;
    return ok ? { habit: t.habit, day: t.day, start: t.start, end: t.end } : undefined;
  } catch {
    return undefined;
  }
}

export function focusStats(f: Focus, today: string) {
  const week = weekStart(today);
  let total = 0;
  let thisWeek = 0;
  for (const [d, m] of Object.entries(f)) {
    total += m;
    if (d >= week && d <= today) thisWeek += m;
  }
  return { today: f[today] ?? 0, week: thisWeek, total };
}

export const minutesText = (m: number) => (m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`);
