import { describe, expect, it } from 'vitest';
import { CLASSIC, PARTS, PRESETS, randomLook, sameLook } from './look';
import { BODY, HEADS, hero } from '../sprites';
import type { Look } from './types';

const inRange = (l: Look) => (Object.keys(PARTS) as (keyof Look)[]).every((k) => Number.isInteger(l[k]) && l[k] >= 0 && l[k] < PARTS[k]);

describe('hero look', () => {
  it('has a head for every hair style, each 7 rows of 16, over a 16-wide body', () => {
    expect(HEADS.length).toBe(PARTS.style);
    for (const h of HEADS) expect(h.length === 7 && h.every((r) => r.length === 16), h.join('|')).toBe(true);
    expect(BODY.length + 7).toBe(16);
    expect(BODY.every((r) => r.length === 16)).toBe(true);
  });
  it('has 8 distinct presets, all valid, starting with the classic squire', () => {
    expect(PRESETS.length).toBe(8);
    expect(PRESETS.every((p) => inRange(p.look))).toBe(true);
    expect(sameLook(PRESETS[0].look, CLASSIC)).toBe(true);
    expect(PRESETS.every((p, i) => PRESETS.every((q, j) => i === j || !sameLook(p.look, q.look)))).toBe(true);
  });
  it('random looks are always valid, at both ends of the range', () => {
    expect(inRange(randomLook(() => 0))).toBe(true);
    expect(inRange(randomLook(() => 0.9999))).toBe(true);
  });
  it('draws with your colors and adds tier trim', () => {
    const red = { ...CLASSIC, hair: 5 };
    expect(hero(1, 64, [], red)).toContain('#b13e53');
    expect(hero(1, 64)).toBe(hero(1, 64, [], CLASSIC));
    expect(hero(20, 64)).toContain('#73eff7'); // Legend's glowing eyes
    expect(hero(1, 64)).not.toContain('#73eff7');
  });
});
