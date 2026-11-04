import type { Score } from './score';
import { isPlanned } from './score';
import { itemById, ITEMS } from './items';
import { weekStart } from './day';
import type { State } from './types';

// Twelve tracks, three tiers each. Worked out from your history like everything else, so unticking days can
// lose a tier, its gold, and its trophy. Trophies live on the items (items.ts), at tier II or III.
export type Track = { id: string; name: string; unit: string; tiers: [number, number, number] };

export const TIER_GOLD = [25, 75, 200];

export const TRACKS: Track[] = [
  { id: 'streak', name: 'STREAK', unit: 'day best streak', tiers: [7, 30, 100] },
  { id: 'perfect', name: 'PERFECT', unit: 'day perfect run', tiers: [3, 14, 30] },
  { id: 'checks', name: 'CHECKS', unit: 'checks', tiers: [50, 250, 1000] },
  { id: 'tiny', name: 'TINY HERO', unit: 'tiny checks', tiers: [10, 50, 200] },
  { id: 'comeback', name: 'COMEBACK', unit: 'comebacks', tiers: [1, 10, 30] },
  { id: 'boss', name: 'BOSS SLAYER', unit: 'bosses beaten', tiers: [1, 5, 20] },
  { id: 'level', name: 'LEVEL', unit: 'level', tiers: [5, 10, 20] },
  { id: 'planner', name: 'PLANNER', unit: 'plans done', tiers: [5, 25, 100] },
  { id: 'collector', name: 'COLLECTOR', unit: 'items owned', tiers: [3, 12, 34] },
  { id: 'treasure', name: 'TREASURE', unit: 'chests opened', tiers: [1, 10, 30] },
  // Showing up, counted so that more quests don't make them faster: only more days do.
  { id: 'days', name: 'SHOW UP', unit: 'days shown up', tiers: [30, 100, 365] },
  { id: 'weeks', name: 'FULL WEEKS', unit: 'weeks with a check every day', tiers: [4, 12, 40] },
];

export const trophyAt = (track: string, tier: number) => ITEMS.find((i) => i.trophy?.track === track && i.trophy.tier === tier);

export type Progress = { track: Track; value: number; tier: number };

// The number each track measures. bossWins comes from heroOf, which calls this.
export function trackValues(state: State, sc: Score, bossWins: number): Record<string, number> {
  const planned = new Set(state.habits.filter(isPlanned).map((h) => h.id));
  const stats = state.habits.filter((h) => !isPlanned(h)).map((h) => sc.habits[h.id]);
  const awards = Object.values(sc.awards).flatMap((day) => Object.entries(day));
  const shown = Object.keys(sc.awards).filter((d) => Object.keys(sc.awards[d]).length);
  const perWeek: Record<string, number> = {};
  for (const d of shown) perWeek[weekStart(d)] = (perWeek[weekStart(d)] ?? 0) + 1;
  return {
    streak: Math.max(0, ...stats.filter((s) => s.unit === 'day').map((s) => s.best)),
    perfect: sc.bestPerfect,
    checks: awards.length,
    tiny: stats.reduce((n, s) => n + s.tiny, 0),
    comeback: awards.filter(([, a]) => a.comeback).length,
    boss: bossWins,
    level: sc.level,
    planner: awards.filter(([id]) => planned.has(id)).length,
    collector: Object.keys(state.wardrobe.owned).filter((id) => itemById(id) && !itemById(id)!.trophy).length,
    treasure: Object.keys(state.wardrobe.opened).length,
    days: shown.length,
    weeks: Object.values(perWeek).filter((n) => n === 7).length,
  };
}

export const progressOf = (values: Record<string, number>): Progress[] =>
  TRACKS.map((track) => ({ track, value: values[track.id] ?? 0, tier: track.tiers.filter((t) => (values[track.id] ?? 0) >= t).length }));

export const tierGold = (ps: Progress[]) => ps.reduce((n, p) => n + TIER_GOLD.slice(0, p.tier).reduce((a, b) => a + b, 0), 0);

export const trophiesOf = (ps: Progress[]) =>
  ITEMS.filter((i) => i.trophy && (ps.find((p) => p.track.id === i.trophy!.track)?.tier ?? 0) >= i.trophy.tier).map((i) => i.id);
