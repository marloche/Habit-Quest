import type { Bg, Settings } from './types';

export const BGS: Bg[] = ['auto', 'castle', 'dungeon', 'forest', 'hell', 'plain'];
export const DAY_FROM = 7;
export const NIGHT_FROM = 19;

// AUTO follows your clock: the village by day, the castle at night.
export const sceneFor = (bg: Bg, hour: number): Exclude<Bg, 'auto'> =>
  bg !== 'auto' ? bg : hour >= DAY_FROM && hour < NIGHT_FROM ? 'forest' : 'castle';

// Display settings with their defaults filled in; animation starts off when the device asks for reduced motion.
export const display = (s: Settings, reducedMotion: boolean) => ({
  bg: s.bg ?? 'auto',
  strength: s.bgStrength ?? 2,
  anim: s.bgAnim ?? !reducedMotion,
  bossArt: s.bossArt ?? true,
});
