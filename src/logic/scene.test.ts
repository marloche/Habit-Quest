import { describe, expect, it } from 'vitest';
import { display, sceneFor } from './scene';

describe('background scene', () => {
  it('AUTO is the village by day and the castle at night', () => {
    expect(sceneFor('auto', 6)).toBe('castle');
    expect(sceneFor('auto', 7)).toBe('forest');
    expect(sceneFor('auto', 18)).toBe('forest');
    expect(sceneFor('auto', 19)).toBe('castle');
    expect(sceneFor('hell', 12)).toBe('hell');
  });
  it('fills in defaults, with animation off when reduced motion is asked for', () => {
    const s = { rolloverHour: 4, muted: false };
    expect(display(s, false)).toEqual({ bg: 'auto', strength: 2, anim: true, bossArt: true });
    expect(display(s, true).anim).toBe(false);
    expect(display({ ...s, bgAnim: true }, true).anim).toBe(true);
  });
});
