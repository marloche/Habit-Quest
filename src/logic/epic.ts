import { daysBetween } from './day';
import type { Epic, Log } from './types';

// Epic quests: long-term goals. Everything here is derived from the epic and the log, like the rest of the score.
export const EPIC_COLORS = ['r', 'o', 'y', 'g', 'b', 'C', 'v', 's']; // palette letters for the crest
export const GUARDIANS = 12; // the boss ladder (bosses.ts); the guardian waits at the end of the road
export const CHAPTERS_MAX = 12;
export const NAME_MAX = 40;
export const WHY_MAX = 140;
export const NOTE_MAX = 140;
export const UNIT_MAX = 16;
export const AMOUNT_MAX = 1e6;

export const CHAPTER_GOLD = 25;
export const FINISH_GOLD = 150;
// Finishing faster than this pays less, so a quick throwaway epic isn't a gold farm.
export const QUICK_DAYS = 14;
export const QUICK_GOLD = 50;

// How much finishes it: the target, or every chapter in chapters mode.
export const goalOf = (e: Epic) => (e.by === 'chapters' ? e.chapters.length : e.target ?? 0);

// The amount that reaches chapter i. Chapters without one are spaced evenly along the road.
export const chapterAt = (e: Epic, i: number) =>
  e.by === 'chapters' ? i + 1 : e.chapters[i].at ?? Math.max(1, Math.round((goalOf(e) * (i + 1)) / e.chapters.length));

const counts = (e: Epic, d: string) => d >= e.created && (!e.ended || d <= e.ended);

// [day, amount added that day], in day order. Linked checks count from the epic's start; a tiny check counts as 1.
function steps(e: Epic, log: Log): [string, number][] {
  if (e.by === 'count') return Object.entries(e.logs ?? {}).filter(([d]) => counts(e, d)).sort(([a], [b]) => (a < b ? -1 : 1));
  if (e.by === 'chapters') {
    const per: Record<string, number> = {};
    for (const c of e.chapters) if (c.done && counts(e, c.done)) per[c.done] = (per[c.done] ?? 0) + 1;
    return Object.entries(per).sort(([a], [b]) => (a < b ? -1 : 1));
  }
  const links = e.links ?? [];
  return Object.keys(log).filter((d) => counts(e, d)).sort()
    .map((d): [string, number] => [d, links.filter((id) => log[d][id]).length]).filter(([, n]) => n > 0);
}

export type EpicProgress = {
  value: number; goal: number; pct: number;
  reached: (string | undefined)[]; // the day each chapter was reached
  finished?: string; // the day it was finished
  gold: number;
};

export function epicProgress(e: Epic, log: Log): EpicProgress {
  const goal = goalOf(e);
  const reached: (string | undefined)[] = e.chapters.map(() => undefined);
  let value = 0;
  let finished: string | undefined;
  for (const [d, n] of steps(e, log)) {
    value += n;
    if (e.by !== 'chapters') e.chapters.forEach((_, i) => { if (!reached[i] && value >= chapterAt(e, i)) reached[i] = d; });
    if (!finished && goal > 0 && value >= goal) finished = d;
  }
  if (e.by === 'chapters') e.chapters.forEach((c, i) => { if (c.done && counts(e, c.done)) reached[i] = c.done; });
  value = Math.round(value * 10) / 10; // logged amounts can have one decimal
  const chapterGold = reached.filter(Boolean).length * CHAPTER_GOLD;
  const finishGold = finished ? (daysBetween(e.created, finished) < QUICK_DAYS ? QUICK_GOLD : FINISH_GOLD) : 0;
  return { value, goal, pct: goal ? Math.min(1, value / goal) : 0, reached, finished, gold: chapterGold + finishGold };
}

export const epicGold = (epics: Epic[], log: Log) => epics.reduce((n, e) => n + epicProgress(e, log).gold, 0);
export const epicsFinished = (epics: Epic[], log: Log) => epics.filter((e) => epicProgress(e, log).finished).length;

// Still on the road: not finished, not retired. At the INN it's resting, but linked checks keep counting.
export const isOpen = (e: Epic, log: Log) => e.status !== 'retired' && !epicProgress(e, log).finished;

// The one on the QUEST screen: the chosen main quest, else the first active one.
export function mainEpic(epics: Epic[], log: Log): Epic | undefined {
  const active = epics.filter((e) => e.status === 'active' && isOpen(e, log));
  return active.find((e) => e.main) ?? active[0];
}

// Open epics a quest feeds, for the crest tag on its row.
export const epicsOfHabit = (epics: Epic[], log: Log, habitId: string) =>
  epics.filter((e) => e.by === 'links' && e.links?.includes(habitId) && isOpen(e, log));

// A guardian that matches the length: a month per step up the ladder, from Slime to Elder Dragon.
export function defaultGuardian(e: Pick<Epic, 'by' | 'created' | 'due' | 'target' | 'chapters'>): number {
  const days = e.due ? daysBetween(e.created, e.due)
    : e.by === 'links' ? e.target ?? 30
    : e.by === 'chapters' ? e.chapters.length * 14
    : 60;
  return Math.max(0, Math.min(GUARDIANS - 1, Math.floor(days / 30)));
}

// Days left to the target date. A missed date is just a note, never a penalty.
export function dueNote(e: Epic, today: string): string | undefined {
  if (!e.due) return undefined;
  const left = daysBetween(today, e.due);
  return left > 0 ? `${left} day${left === 1 ? '' : 's'} to go` : left === 0 ? 'Target day is today' : 'Past the target date. No rush.';
}
