import { addDays, daysBetween, weekday, weekStart } from './day';
import type { Habit, Log, Mark, State } from './types';

export const XP: Record<Mark, number> = { full: 10, tiny: 5 };
export const GOLD: Record<Mark, number> = { full: 5, tiny: 2 };
export const COMEBACK = 1.5;
export const MOMENTUM_DAYS = 14;
export const MILESTONES: Record<number, number> = { 7: 50, 30: 150, 100: 500 };

export const xpForLevel = (l: number) => 25 * l * (l - 1);

export function levelOf(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const floor = xpForLevel(level);
  return { level, progress: (xp - floor) / (xpForLevel(level + 1) - floor) };
}

export const isPlanned = (h: Habit) => h.schedule.kind === 'once';

export const isActive = (h: Habit, day: string) =>
  h.schedule.kind === 'once' ? day === h.schedule.day : day >= h.created && (!h.archived || day < h.archived);

// Weekly quests run in blocks of 1-4 weeks (bedsheets: once every 2). A block starts on a Monday, lined up on the
// schedule's `from` or, without one, the creation week; with 1-week blocks that's simply every Monday.
export const everyOf = (h: Habit) => (h.schedule.kind === 'weekly' ? h.schedule.every ?? 1 : 1);
export function blockStart(h: Habit, day: string): string {
  const n = 7 * everyOf(h);
  const anchor = h.schedule.kind === 'weekly' && h.schedule.from ? h.schedule.from : weekStart(h.created);
  return addDays(anchor, Math.floor(daysBetween(anchor, weekStart(day)) / n) * n);
}
export const blockEnd = (h: Habit, day: string) => addDays(blockStart(h, day), 7 * everyOf(h) - 1);

// Expected completions on a day in sevenths, so weekly quotas (times/7 a day) stay exact (halves and quarters for
// longer blocks are exact in floating point too).
function expected7(h: Habit, day: string): number {
  if (!isActive(h, day)) return 0;
  const s = h.schedule;
  if (s.kind === 'once') return 0; // plans slip: a planned quest pays out, but missing one never drags momentum
  if (s.kind === 'daily') return 7;
  if (s.kind === 'days') return s.days.includes(weekday(day)) ? 7 : 0;
  if (s.from && day < s.from) return 0; // "starts next week": nothing expected before the first block
  return s.times / (s.every ?? 1);
}

// A multi-week quest whose first block hasn't started yet (it waits with the rest days until then).
export const notStarted = (h: Habit, day: string) => h.schedule.kind === 'weekly' && !!h.schedule.from && day < h.schedule.from;

// Expected completions on a day; weekly habits spread their quota evenly.
export const expected = (h: Habit, day: string) => expected7(h, day) / 7;

export const isDue = (h: Habit, day: string) => h.schedule.kind !== 'weekly' && expected7(h, day) === 7;

const done = (h: Habit, log: Log, day: string) => (isActive(h, day) && log[day]?.[h.id] ? 1 : 0);

// Each habit's checks count up to what it expected, so over-delivering one habit can't hide skipping another.
function momentumOf(want7: number[], got: number[]): number {
  let w = 0;
  let g = 0;
  want7.forEach((want, i) => {
    w += want;
    g += Math.min(7 * got[i], want);
  });
  return w ? Math.round((1 + g / w) * 100) / 100 : 1;
}

// 1 + share of expected checks done in the 14 days before `day`, so x1.0 to x2.0.
export function momentumAt(habits: Habit[], log: Log, day: string): number {
  const want7 = habits.map(() => 0);
  const got = habits.map(() => 0);
  for (let i = 1; i <= MOMENTUM_DAYS; i++) {
    const d = addDays(day, -i);
    habits.forEach((h, j) => {
      want7[j] += expected7(h, d);
      got[j] += done(h, log, d);
    });
  }
  return momentumOf(want7, got);
}

// Quests that belong on a day's checklist: due ones, that day's plans, and any weekly quest checked that day.
export const onDay = (h: Habit, log: Log, day: string) =>
  isActive(h, day) && (isDue(h, day) || isPlanned(h) || (h.schedule.kind === 'weekly' && !!log[day]?.[h.id]));

export function daySummary(habits: Habit[], log: Log, day: string) {
  const list = habits.filter((h) => onDay(h, log, day));
  const done = list.filter((h) => log[day]?.[h.id]).length;
  const status = !list.length ? 'rest' : done === list.length ? 'all' : done ? 'some' : 'none';
  return { total: list.length, done, status } as const;
}

export const RISK_STREAK = 3;

// A quest in a block of 2+ weeks is closing in its last 2 days while short of its count (the "due by SUN" nudge).
export const closing = (h: Habit, sc: Score, today: string) =>
  h.schedule.kind === 'weekly' && everyOf(h) > 1 && isActive(h, today) && !notStarted(h, today) &&
  daysBetween(today, blockEnd(h, today)) < 2 && sc.habits[h.id].weekCount < h.schedule.times;

// Quests due today (or closing their block), not done yet, carrying a streak worth protecting.
export const atRisk = (state: State, sc: Score, today: string) =>
  state.habits.filter((h) => ((isDue(h, today) && !state.log[today]?.[h.id]) || closing(h, sc, today)) && sc.habits[h.id].streak >= RISK_STREAK);

export type Award = { xp: number; gold: number; comeback: boolean; milestone: number; streak: number };
export type HabitStats = {
  streak: number;
  best: number;
  unit: 'day' | 'week';
  comebackReady: boolean;
  weekCount: number; // checks so far in the current block (a week, or 2-4 weeks)
  full: number;
  tiny: number;
};
export type Score = {
  xp: number;
  gold: number;
  level: number;
  progress: number;
  momentum: number;
  habits: Record<string, HabitStats>;
  awards: Record<string, Record<string, Award>>;
  perfect: number;
  bestPerfect: number;
};

// Replays the whole log in one pass, O(days x habits); momentum uses a rolling 14-day window.
export function score(state: State, today: string): Score {
  const { habits, log } = state;
  const awards: Score['awards'] = {};
  const stats: Record<string, HabitStats> = {};
  const missed: Record<string, boolean> = {};
  let xp = 0;
  let gold = 0;
  let perfect = 0;
  let bestPerfect = 0;

  for (const h of habits) {
    stats[h.id] = { streak: 0, best: 0, unit: h.schedule.kind === 'weekly' ? 'week' : 'day', comebackReady: false, weekCount: 0, full: 0, tiny: 0 };
    missed[h.id] = false;
  }

  // The window for the first day is empty: nothing is active before the earliest quest was created.
  const want7 = habits.map(() => 0);
  const got = habits.map(() => 0);
  const slide = (d: string, sign: number) =>
    habits.forEach((h, i) => {
      want7[i] += sign * expected7(h, d);
      got[i] += sign * done(h, log, d);
    });
  let momentumToday = 1;

  const start = habits.reduce((m, h) => (h.created < m ? h.created : m), today);
  for (let d = start; d <= today; d = addDays(d, 1)) {
    const momentum = momentumOf(want7, got);
    momentumToday = momentum;
    let dueCount = 0;
    let doneCount = 0;

    for (const h of habits) {
      const mark = log[d]?.[h.id];
      // A check made on the archive day itself still pays out; the quest just isn't due that day.
      if (!isActive(h, d) && !(mark && d === h.archived && d >= h.created)) continue;
      const st = stats[h.id];
      let milestone = 0;

      if (h.schedule.kind === 'weekly') {
        // A new block settles the last one; the block holding the creation day is never held against you.
        const every = everyOf(h);
        if (d === blockStart(h, d) && d !== h.created) {
          if (st.weekCount < h.schedule.times && blockStart(h, h.created) !== addDays(d, -7 * every)) {
            st.streak = 0;
            missed[h.id] = true;
          }
          st.weekCount = 0;
        }
        if (mark) {
          st.weekCount++;
          if (st.weekCount === h.schedule.times) {
            // The streak counts weeks, so a 2-week block adds 2 ("4w" = two blocks running); a milestone it jumps past still pays.
            const before = st.streak;
            st.streak += every;
            milestone = Object.entries(MILESTONES).reduce((sum, [at, bonus]) => (+at > before && +at <= st.streak ? sum + bonus : sum), 0);
          }
        }
      } else if (isDue(h, d)) {
        dueCount++;
        if (mark) {
          doneCount++;
          st.streak++;
          milestone = MILESTONES[st.streak] ?? 0;
        } else if (d !== today) {
          st.streak = 0;
          missed[h.id] = true;
        }
      }

      if (mark) {
        const comeback = missed[h.id];
        missed[h.id] = false;
        const award = {
          xp: Math.round(XP[mark] * momentum * (comeback ? COMEBACK : 1)) + milestone,
          gold: GOLD[mark],
          comeback,
          milestone,
          streak: st.streak,
        };
        (awards[d] ??= {})[h.id] = award;
        xp += award.xp;
        gold += award.gold;
        st[mark]++;
      }
      st.best = Math.max(st.best, st.streak);
    }

    if (dueCount && doneCount === dueCount) perfect++;
    else if (dueCount && d !== today) perfect = 0;
    bestPerfect = Math.max(bestPerfect, perfect);

    slide(d, 1);
    slide(addDays(d, -MOMENTUM_DAYS), -1);
  }

  for (const h of habits) stats[h.id].comebackReady = missed[h.id];
  return { xp, gold, ...levelOf(xp), momentum: momentumToday, habits: stats, awards, perfect, bestPerfect };
}
