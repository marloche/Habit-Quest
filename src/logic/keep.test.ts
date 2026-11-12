import { describe, expect, it } from 'vitest';
import { rainy, skyOf } from './keep';

describe('the Keep window', () => {
  it('follows the hour: dawn, day, dusk, night', () => {
    expect([0, 4, 5, 7, 8, 17, 18, 20, 21, 23].map(skyOf)).toEqual(['night', 'night', 'dawn', 'dawn', 'day', 'day', 'dusk', 'dusk', 'night', 'night']);
  });
  it('rains in 3-hour spells, the same for the same spell, about one in four', () => {
    expect(rainy(new Date(2026, 10, 12, 9, 0))).toBe(rainy(new Date(2026, 10, 12, 11, 59)));
    let wet = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) if (rainy(new Date(2026, 0, 1, i * 3))) wet++;
    expect(wet / n).toBeGreaterThan(0.2);
    expect(wet / n).toBeLessThan(0.3);
  });
});
