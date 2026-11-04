import { addDays, daysBetween, weekStart } from './day';
import { expected, isActive, type Score } from './score';
import { progressOf, tierGold, trackValues, trophiesOf, type Progress } from './achievements';
import { ITEMS } from './items';
import { journalGold } from './journal';
import type { Habit, Log, Mark, State, Wardrobe } from './types';

// Weekly boss: each boss has its own HP, and your hits scale so it falls once you've done a fair share of the week's
// expected checks: 65% for the first boss, rising 1% per win to 75%. Few quests hit hard, many hit lighter, and a few
// misses still win at any quest count. Losing costs nothing.
export const bossShare = (beaten: number) => Math.min(0.75, 0.65 + 0.01 * beaten);
export const BOSS_GOLD = 50;
export const BOSS_HITS: Record<Mark, number> = { full: 1, tiny: 0.5 };
// The ladder: each win brings the next, meaner boss; a lost week brings the same one back for a rematch.
// After the last, the ladder repeats as ELITE laps (art recolored in the UI), each lap half again as tough.
export const BOSSES = ['Slime', 'Cave Rat', 'Bat Swarm', 'Skeleton', 'Goblin Raider', 'Orc Brute', 'Wraith', 'Dark Knight', 'Troll', 'Lich', 'Demon Lord', 'Elder Dragon'];
export const BOSS_HP = [120, 180, 240, 320, 400, 500, 600, 700, 820, 950, 1080, 1200];
const LAP = ['', 'Elite', 'Elite II', 'Elite III', 'Elite IV', 'Elite V'];

// Fight length in weeks: one week each until the last three, which take 2, 3 and 4 (a month at most). Gold and chests
// pay per week of the fight, so long fights don't starve your income.
export const BOSS_WEEKS = [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4];

// tier: index into BOSSES; lap: 0 for the first climb, 1+ for elite laps. week: the fight's first Monday; end: its last
// day. hit: what one full check deals in this fight.
export type Boss = {
  week: string; end: string; weeks: number; name: string; tier: number; lap: number; hp: number; hit: number; dmg: number;
  won: boolean; wonOn?: string; reach: boolean; daysLeft: number;
};

export function bossName(beaten: number) {
  const tier = beaten % BOSSES.length;
  const lap = Math.floor(beaten / BOSSES.length);
  return { tier, lap, name: lap ? `${LAP[lap] ?? `Elite ${lap}`} ${BOSSES[tier]}` : BOSSES[tier] };
}

// A fight starts on a Monday (week) and lasts BOSS_WEEKS of its boss. reach: false once even checking everything left
// can't land enough hits before it ends. wonOn: the day the last needed hit landed; the next boss comes the Monday after.
export function bossOf(habits: Habit[], log: Log, week: string, today: string, beaten = 0): Boss | undefined {
  const who = bossName(beaten);
  const weeks = BOSS_WEEKS[who.tier];
  const end = addDays(week, weeks * 7 - 1);
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(week, i));
  const want = days.reduce((n, d) => n + habits.reduce((m, h) => m + expected(h, d), 0), 0);
  if (!want) return undefined;
  const need = Math.max(1, Math.round(bossShare(beaten) * want)); // nearest whole check, so one quest isn't held to 6 of 7
  let hits = 0;
  let open = 0; // checks still possible from today on: what's due and not yet done
  let wonOn: string | undefined;
  for (const d of days) {
    for (const h of habits) {
      const m = log[d]?.[h.id];
      if (m && d <= today && isActive(h, d)) hits += BOSS_HITS[m]; // planned quests hit too, without making it tougher
      else if (d >= today && (expected(h, d) > 0 || (h.schedule.kind === 'once' && h.schedule.day === d))) open++;
    }
    if (!wonOn && hits >= need) wonOn = d; // compared in hits, so rounding the HP shown can't cost a win
  }
  const won = !!wonOn;
  const hp = Math.round(BOSS_HP[who.tier] * (1 + 0.5 * who.lap));
  const dmg = won ? hp : Math.min(hp - 1, Math.round((hp * hits) / need));
  return { week, ...who, weeks, end, hp, hit: Math.round(hp / need), dmg, won, wonOn, reach: won || hits + open >= need, daysLeft: daysBetween(today, end) };
}

// Wounds on the boss art: none until a quarter of its HP is gone, then stages 1-3 at 25 / 50 / 75%; a beaten boss shows the worst.
export const woundStage = (b: Pick<Boss, 'dmg' | 'hp' | 'won'>) => (b.won ? 3 : Math.min(3, Math.floor((4 * b.dmg) / b.hp)));

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
  let bossGold = 0;
  let boss: Boss | undefined;
  for (let w = weekStart(start); w <= today; ) {
    const b = bossOf(state.habits, state.log, w, today, wins); // wins so far pick this fight's boss
    boss = b;
    if (b?.won) {
      wins++;
      bossGold += BOSS_GOLD * b.weeks;
      for (let i = 1; i <= b.weeks; i++) earnedChests.push({ id: i === 1 ? `b-${w}` : `b-${w}-${i}`, why: `Beat ${b.name}` });
    }
    // An empty week has no boss; a win ends the fight early; a loss ends with its window, then a rematch.
    w = !b ? addDays(w, 7) : b.wonOn ? addDays(weekStart(b.wonOn), 7) : addDays(b.end, 1);
  }
  for (const [d, awards] of Object.entries(sc.awards))
    for (const [id, a] of Object.entries(awards))
      if (a.milestone) earnedChests.push({ id: `m-${d}-${id}`, why: `${a.streak}-${sc.habits[id].unit} streak` });

  const { opened, owned } = state.wardrobe;
  const chestGold = earnedChests.reduce((n, c) => n + (opened[c.id]?.gold ?? 0), 0);
  const achievements = progressOf(trackValues(state, sc, wins));
  const earned = sc.gold + bossGold + chestGold + tierGold(achievements) + journalGold(state.journal, today);
  const spent = Object.values(owned).reduce((n, o) => n + o.paid, 0);
  return {
    earned, spent, balance: earned - spent, wins, boss, chests: earnedChests.filter((c) => !opened[c.id]),
    achievements, trophies: trophiesOf(achievements),
  };
}
