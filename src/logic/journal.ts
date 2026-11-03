import { daySummary } from './score';
import type { Habit, Journal, Log } from './types';

export const MOODS = ['AWFUL', 'LOW', 'OK', 'GOOD', 'GREAT']; // mood 1-5
export const JOURNAL_GOLD = 2;
export const JOURNAL_MAX = 140;

// An entry is a mood with an optional line; each day up to today with one pays a little gold.
export const journalGold = (j: Journal, today: string) => Object.keys(j).filter((d) => d <= today).length * JOURNAL_GOLD;

export const moodName = (avg: number) => MOODS[Math.round(avg) - 1];

type Avg = { avg: number; days: number } | undefined;

// Average mood on days every due quest got done vs the rest. Rest days count for neither; it's a fact, never a score.
export function moodLink(habits: Habit[], log: Log, j: Journal, today: string): { all: Avg; other: Avg } {
  const sums = { all: [0, 0], other: [0, 0] };
  for (const [d, e] of Object.entries(j)) {
    const status = d <= today && daySummary(habits, log, d).status;
    if (!status || status === 'rest') continue;
    const s = sums[status === 'all' ? 'all' : 'other'];
    s[0] += e.mood;
    s[1]++;
  }
  const avg = ([total, days]: number[]): Avg => (days ? { avg: total / days, days } : undefined);
  return { all: avg(sums.all), other: avg(sums.other) };
}
