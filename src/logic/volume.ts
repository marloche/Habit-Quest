import type { Settings } from './types';

// Volume sliders run 0-100%. Gain is the square of the slider, which matches how loud it sounds to the ear and gives the
// quiet end fine steps. 100% is the old HIGH. Saves from before the sliders kept LOW / MEDIUM / HIGH (1-3), which carry over.
export type VolKey = 'sfxPct' | 'musicPct' | 'ambPct';
const TOP: Record<VolKey, number> = { sfxPct: 1.6, musicPct: 1, ambPct: 1 };
const OLD = {
  sfxPct: ['sfxVol', [0.5, 1, 1.6]],
  musicPct: ['musicVol', [0.4, 0.7, 1]],
  ambPct: ['ambVol', [0.4, 0.7, 1]],
} as const;

export function pctOf(s: Settings, k: VolKey): number {
  const set = s[k];
  if (set !== undefined) return set;
  const [old, gains] = OLD[k];
  return Math.round(Math.sqrt(gains[(s[old] ?? 2) - 1] / TOP[k]) * 100);
}

export const gainOf = (s: Settings, k: VolKey) => TOP[k] * (pctOf(s, k) / 100) ** 2;
