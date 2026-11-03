import { addDays, daysBetween, weekStart } from './day';
import { expected, isActive, type Score } from './score';
import type { Habit, Log, Mark, State } from './types';

// Weekly boss: HP is 70% of the week's expected checks x 10, so a few misses still win. Losing costs nothing.
export const BOSS_SHARE = 0.7;
export const BOSS_GOLD = 50;
export const BOSS_DAMAGE: Record<Mark, number> = { full: 10, tiny: 5 };
export const BOSSES = ['Slime King', 'Goblin', 'Skeleton', 'Wraith', 'Dragon'];
const EPOCH = '2026-01-05'; // a Monday; the roster rotates one boss per week from here

export type Boss = { week: string; name: string; hp: number; dmg: number; won: boolean; daysLeft: number };

export function bossOf(habits: Habit[], log: Log, week: string, today: string): Boss | undefined {
  let want = 0;
  let dmg = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(week, i);
    for (const h of habits) {
      want += expected(h, d);
      const m = log[d]?.[h.id];
      if (m && d <= today && isActive(h, d)) dmg += BOSS_DAMAGE[m]; // planned quests hit too, without adding HP
    }
  }
  const hp = Math.round(10 * BOSS_SHARE * want);
  if (!hp) return undefined;
  const n = Math.floor(daysBetween(EPOCH, week) / 7) % BOSSES.length;
  return { week, name: BOSSES[(n + BOSSES.length) % BOSSES.length], hp, dmg: Math.min(dmg, hp), won: dmg >= hp, daysLeft: daysBetween(today, addDays(week, 6)) };
}

export type HeroState = { earned: number; spent: number; balance: number; wins: number; boss?: Boss };

// Gold you can spend: checks + boss wins, minus what you paid. It can go negative if you untick past days
// after buying; you keep your items and can't buy until it's positive again.
export function heroOf(state: State, sc: Score, today: string): HeroState {
  const start = state.habits.reduce((m, h) => (h.created < m ? h.created : m), today);
  let wins = 0;
  let boss: Boss | undefined;
  for (let w = weekStart(start); w <= today; w = addDays(w, 7)) {
    const b = bossOf(state.habits, state.log, w, today);
    if (b?.won) wins++;
    if (w === weekStart(today)) boss = b;
  }
  const earned = sc.gold + wins * BOSS_GOLD;
  const spent = Object.values(state.wardrobe.owned).reduce((n, o) => n + o.paid, 0);
  return { earned, spent, balance: earned - spent, wins, boss };
}
