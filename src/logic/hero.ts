import { addDays, daysBetween, weekStart } from './day';
import { expected, isActive, type Score } from './score';
import { progressOf, tierGold, trackValues, trophiesOf, type Progress } from './achievements';
import { ITEMS } from './items';
import { journalGold } from './journal';
import type { Habit, Log, Mark, State, Wardrobe } from './types';

// Weekly boss: HP is 70% of the week's expected checks x 10, so a few misses still win. Losing costs nothing.
export const BOSS_SHARE = 0.7;
export const BOSS_GOLD = 50;
export const BOSS_DAMAGE: Record<Mark, number> = { full: 10, tiny: 5 };
// The ladder: each win brings the next, meaner boss; a lost week brings the same one back for a rematch.
// After the last, the ladder repeats as ELITE laps (art recolored in the UI).
export const BOSSES = ['Slime', 'Cave Rat', 'Bat Swarm', 'Skeleton', 'Goblin Raider', 'Orc Brute', 'Wraith', 'Dark Knight', 'Troll', 'Lich', 'Demon Lord', 'Elder Dragon'];
const LAP = ['', 'Elite', 'Elite II', 'Elite III', 'Elite IV', 'Elite V'];

// tier: index into BOSSES; lap: 0 for the first climb, 1+ for elite laps.
export type Boss = { week: string; name: string; tier: number; lap: number; hp: number; dmg: number; won: boolean; daysLeft: number };

export function bossName(beaten: number) {
  const tier = beaten % BOSSES.length;
  const lap = Math.floor(beaten / BOSSES.length);
  return { tier, lap, name: lap ? `${LAP[lap] ?? `Elite ${lap}`} ${BOSSES[tier]}` : BOSSES[tier] };
}

export function bossOf(habits: Habit[], log: Log, week: string, today: string, beaten = 0): Boss | undefined {
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
  return { week, ...bossName(beaten), hp, dmg: Math.min(dmg, hp), won: dmg >= hp, daysLeft: daysBetween(today, addDays(week, 6)) };
}

// Chests come from streak milestones and boss wins: 25% a chest-only item you don't own yet, else 50-150 gold.
export const CHEST_ITEM_CHANCE = 0.25;
export type Chest = { id: string; why: string };

// FNV-1a: a chest's roll comes from its id, so reloading or re-importing can't re-roll it.
const roll = (s: string) => {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 2 ** 32;
};

export function chestLoot(id: string, w: Wardrobe): { gold?: number; item?: string } {
  const pool = ITEMS.filter((i) => i.chest && !w.owned[i.id]);
  if (pool.length && roll(id) < CHEST_ITEM_CHANCE) return { item: pool[Math.floor(roll(`${id}:item`) * pool.length)].id };
  return { gold: 50 + Math.floor(roll(`${id}:gold`) * 101) };
}

export type HeroState = {
  earned: number; spent: number; balance: number; wins: number; boss?: Boss; chests: Chest[];
  achievements: Progress[]; trophies: string[];
};

// Gold you can spend: checks + boss wins + opened chests + achievement tiers, minus what you paid. It can go negative if you untick
// past days after buying; you keep your items and can't buy until it's positive again. A chest that's no longer
// earned (its milestone was unticked) stops paying its gold, but an item it gave stays.
export function heroOf(state: State, sc: Score, today: string): HeroState {
  const start = state.habits.reduce((m, h) => (h.created < m ? h.created : m), today);
  const earnedChests: Chest[] = [];
  let wins = 0;
  let boss: Boss | undefined;
  for (let w = weekStart(start); w <= today; w = addDays(w, 7)) {
    const b = bossOf(state.habits, state.log, w, today, wins); // wins so far pick this week's boss
    if (b?.won) {
      wins++;
      earnedChests.push({ id: `b-${w}`, why: `Beat ${b.name}` });
    }
    if (w === weekStart(today)) boss = b;
  }
  for (const [d, awards] of Object.entries(sc.awards))
    for (const [id, a] of Object.entries(awards))
      if (a.milestone) earnedChests.push({ id: `m-${d}-${id}`, why: `${a.streak}-${sc.habits[id].unit} streak` });

  const { opened, owned } = state.wardrobe;
  const chestGold = earnedChests.reduce((n, c) => n + (opened[c.id]?.gold ?? 0), 0);
  const achievements = progressOf(trackValues(state, sc, wins));
  const earned = sc.gold + wins * BOSS_GOLD + chestGold + tierGold(achievements) + journalGold(state.journal, today);
  const spent = Object.values(owned).reduce((n, o) => n + o.paid, 0);
  return {
    earned, spent, balance: earned - spent, wins, boss, chests: earnedChests.filter((c) => !opened[c.id]),
    achievements, trophies: trophiesOf(achievements),
  };
}
