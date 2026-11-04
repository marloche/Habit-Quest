import type { Bg, Settings } from './types';

export const BGS: Bg[] = ['auto', 'castle', 'dungeon', 'forest', 'hell', 'plain', 'snow', 'harbor', 'grove', 'desert', 'aurora', 'lair', 'storm', 'isles'];
export const BG_NAMES: Partial<Record<Bg, string>> = { forest: 'VILLAGE', snow: 'FROST PASS', grove: 'GROVE', lair: 'DRAGON LAIR', isles: 'SKY ISLES' };
// AUTO's pools: a day scene from DAY_FROM, a night scene from NIGHT_FROM, a different one each day.
export const DAY_SCENES: Exclude<Bg, 'auto'>[] = ['forest', 'snow', 'harbor', 'desert', 'isles'];
export const NIGHT_SCENES: Exclude<Bg, 'auto'>[] = ['castle', 'aurora', 'grove', 'storm', 'dungeon', 'lair', 'hell'];
export const DAY_FROM = 7;
export const NIGHT_FROM = 19;

// AUTO follows your clock, and day (a day count, e.g. days since 1970) turns each pool once a day.
export function sceneFor(bg: Bg, hour: number, day = 0): Exclude<Bg, 'auto'> {
  if (bg !== 'auto') return bg;
  const pool = hour >= DAY_FROM && hour < NIGHT_FROM ? DAY_SCENES : NIGHT_SCENES;
  return pool[((day % pool.length) + pool.length) % pool.length];
}

// Display settings with their defaults filled in; animation starts off when the device asks for reduced motion.
export const display = (s: Settings, reducedMotion: boolean) => ({
  bg: s.bg ?? 'auto',
  strength: s.bgStrength ?? 2,
  anim: s.bgAnim ?? !reducedMotion,
  bossArt: s.bossArt ?? true,
});
