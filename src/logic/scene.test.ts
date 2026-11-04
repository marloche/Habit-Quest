import { describe, expect, it } from 'vitest';
import { BGS, DAY_SCENES, display, NIGHT_SCENES, sceneFor } from './scene';

describe('background scene', () => {
  it('AUTO is the village by day and the castle at night', () => {
    expect(sceneFor('auto', 6)).toBe('castle');
    expect(sceneFor('auto', 7)).toBe('forest');
    expect(sceneFor('auto', 18)).toBe('forest');
    expect(sceneFor('auto', 19)).toBe('castle');
    expect(sceneFor('hell', 12)).toBe('hell');
  });
  it('AUTO turns to the next scene of its pool each day, and between them the pools hold every scene once', () => {
    expect(sceneFor('auto', 12, 1)).toBe(DAY_SCENES[1]);
    expect(sceneFor('auto', 22, 3)).toBe(NIGHT_SCENES[3]);
    expect(sceneFor('auto', 12, DAY_SCENES.length)).toBe(DAY_SCENES[0]);
    expect(sceneFor('auto', 12, -1)).toBe(DAY_SCENES[DAY_SCENES.length - 1]);
    const pooled = [...DAY_SCENES, ...NIGHT_SCENES];
    expect(new Set(pooled).size).toBe(pooled.length);
    expect(pooled.sort()).toEqual(BGS.filter((b) => b !== 'auto' && b !== 'plain').sort());
  });
  it('fills in defaults, with animation off when reduced motion is asked for', () => {
    const s = { rolloverHour: 4, muted: false };
    expect(display(s, false)).toEqual({ bg: 'auto', strength: 2, anim: true, bossArt: true });
    expect(display(s, true).anim).toBe(false);
    expect(display({ ...s, bgAnim: true }, true).anim).toBe(true);
  });
});
