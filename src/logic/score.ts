import { addDays, weekday, weekStart } from './day';
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

export const isActive = (h: Habit, day: string) => day >= h.created && (!h.archived || day < h.archived);

// Expected completions on a day; weekly habits spread their quota evenly.
export function expected(h: Habit, day: string): number {
  if (!isActive(h, day)) return 0;
  const s = h.schedule;
  if (s.kind === 'daily') return 1;
  if (s.kind === 'days') return s.days.includes(weekday(day)) ? 1 : 0;
  return s.times / 7;
}

export const isDue = (h: Habit, day: string) => h.schedule.kind !== 'weekly' && expected(h, day) === 1;

// 1 + share of expected checks done in the 14 days before `day`, so x1.0 to x2.0.
export function momentumAt(habits: Habit[], log: Log, day: string): number {
  let want = 0;
  let got = 0;
  for (const h of habits) {
    let w = 0;
    let g = 0;
    for (let i = 1; i <= MOMENTUM_DAYS; i++) {
      const d = addDays(day, -i);
      w += expected(h, d);
      if (isActive(h, d) && log[d]?.[h.id]) g++;
    }
    want += w;
    got += Math.min(g, w);
  }
  return want ? Math.round((1 + got / want) * 100) / 100 : 1;
}

export type Award = { xp: number; gold: number; comeback: boolean; milestone: number; streak: number };
export type HabitStats = {
  streak: number;
  best: number;
  unit: 'day' | 'week';
  comebackReady: boolean;
  weekCount: number;
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

// Replays the whole log. shortcut: O(days x habits x 14), fine for years of data; cache per day if it ever lags.
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

  const start = habits.reduce((m, h) => (h.created < m ? h.created : m), today);
  for (let d = start; d <= today; d = addDays(d, 1)) {
    const momentum = momentumAt(habits, log, d);
    let dueCount = 0;
    let doneCount = 0;

    for (const h of habits) {
      const mark = log[d]?.[h.id];
      // A check made on the archive day itself still pays out; the quest just isn't due that day.
      if (!isActive(h, d) && !(mark && d === h.archived && d >= h.created)) continue;
      const st = stats[h.id];
      let milestone = 0;

      if (h.schedule.kind === 'weekly') {
        // A new week settles the last one; the creation week is never held against you.
        if (weekday(d) === 1 && d !== h.created) {
          if (st.weekCount < h.schedule.times && weekStart(h.created) !== addDays(d, -7)) {
            st.streak = 0;
            missed[h.id] = true;
          }
          st.weekCount = 0;
        }
        if (mark) {
          st.weekCount++;
          if (st.weekCount === h.schedule.times) {
            st.streak++;
            milestone = MILESTONES[st.streak] ?? 0;
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
  }

  for (const h of habits) stats[h.id].comebackReady = missed[h.id];
  return { xp, gold, ...levelOf(xp), momentum: momentumAt(habits, log, today), habits: stats, awards, perfect, bestPerfect };
}
