import type { Score } from './score';
import { isPlanned } from './score';
import { itemById } from './items';
import type { State } from './types';

// Ten tracks, three tiers each. Worked out from your history like everything else, so unticking days can
// lose a tier, its gold, and (tier III) its trophy.
export type Track = { id: string; name: string; unit: string; tiers: [number, number, number]; trophy?: string };

export const TIER_GOLD = [25, 75, 200];

export const TRACKS: Track[] = [
  { id: 'streak', name: 'STREAK', unit: 'day best streak', tiers: [7, 30, 100], trophy: 'flame-crown' },
  { id: 'perfect', name: 'PERFECT', unit: 'day perfect run', tiers: [3, 14, 30], trophy: 'champion-cape' },
  { id: 'checks', name: 'CHECKS', unit: 'checks', tiers: [50, 250, 1000], trophy: 'wise-owl' },
  { id: 'tiny', name: 'TINY HERO', unit: 'tiny checks', tiers: [10, 50, 200] },
  { id: 'comeback', name: 'COMEBACK', unit: 'comebacks', tiers: [1, 10, 30] },
  { id: 'boss', name: 'BOSS SLAYER', unit: 'bosses beaten', tiers: [1, 5, 20], trophy: 'dragonslayer' },
  { id: 'level', name: 'LEVEL', unit: 'level', tiers: [5, 10, 20] },
  { id: 'planner', name: 'PLANNER', unit: 'plans done', tiers: [5, 25, 100] },
  { id: 'collector', name: 'COLLECTOR', unit: 'items owned', tiers: [3, 8, 18] },
  { id: 'treasure', name: 'TREASURE', unit: 'chests opened', tiers: [1, 10, 30] },
];

export type Progress = { track: Track; value: number; tier: number };

// The number each track measures. bossWins comes from heroOf, which calls this.
export function trackValues(state: State, sc: Score, bossWins: number): Record<string, number> {
  const planned = new Set(state.habits.filter(isPlanned).map((h) => h.id));
  const stats = state.habits.filter((h) => !isPlanned(h)).map((h) => sc.habits[h.id]);
  const awards = Object.values(sc.awards).flatMap((day) => Object.entries(day));
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
  };
}

export const progressOf = (values: Record<string, number>): Progress[] =>
  TRACKS.map((track) => ({ track, value: values[track.id] ?? 0, tier: track.tiers.filter((t) => (values[track.id] ?? 0) >= t).length }));

export const tierGold = (ps: Progress[]) => ps.reduce((n, p) => n + TIER_GOLD.slice(0, p.tier).reduce((a, b) => a + b, 0), 0);

export const trophiesOf = (ps: Progress[]) => ps.filter((p) => p.tier === 3 && p.track.trophy).map((p) => p.track.trophy!);
