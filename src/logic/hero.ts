import type { Score } from './score';
import type { State } from './types';

export type HeroState = { earned: number; spent: number; balance: number };

// Gold you can spend: everything earned minus what you paid. It can go negative if you untick past days
// after buying; you keep your items and can't buy until it's positive again.
export function heroOf(state: State, sc: Score): HeroState {
  const earned = sc.gold;
  const spent = Object.values(state.wardrobe.owned).reduce((n, o) => n + o.paid, 0);
  return { earned, spent, balance: earned - spent };
}
