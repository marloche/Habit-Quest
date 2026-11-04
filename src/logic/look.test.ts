import { describe, expect, it } from 'vitest';
import { CLASSIC, GARBS, PARTS, PRESETS, randomLook, sameLook } from './look';
import { BODY, GARB_ROWS, HEADS, hero } from '../sprites';
import type { Look } from './types';

const inRange = (l: Look) =>
  (Object.keys(PARTS) as (keyof Look)[]).every((k) => (k === 'garb' && l[k] === undefined) || (Number.isInteger(l[k]) && l[k]! >= 0 && l[k]! < PARTS[k]));

describe('hero look', () => {
  it('has a head for every hair style, each 7 rows of 16, over a 16-wide body', () => {
    expect(HEADS.length).toBe(PARTS.style);
    for (const h of HEADS) expect(h.length === 7 && h.every((r) => r.length === 16), h.join('|')).toBe(true);
    expect(BODY.length + 7).toBe(16);
    expect(BODY.every((r) => r.length === 16)).toBe(true);
  });
  it('has an outfit shape for every name, 9 rows of 16, with the hands always at columns 4 and 11', () => {
    expect(GARB_ROWS.length).toBe(GARBS.length);
    expect(GARB_ROWS[0]).toBe(BODY); // the tunic is today's body, so the app icon can't change
    for (const [i, g] of GARB_ROWS.entries()) {
      expect(g.length === 9 && g.every((r) => r.length === 16), GARBS[i]).toBe(true);
      expect([g[1][4], g[1][11], g[2][4], g[2][11]], GARBS[i]).toEqual(['f', 'f', 'f', 'f']);
    }
  });
  it('has 11 distinct presets, all valid, each class in its own outfit shape after the classic squire', () => {
    expect(PRESETS.length).toBe(11);
    expect(PRESETS.every((p) => inRange(p.look))).toBe(true);
    expect(sameLook(PRESETS[0].look, CLASSIC)).toBe(true);
    expect(PRESETS.every((p, i) => PRESETS.every((q, j) => i === j || !sameLook(p.look, q.look)))).toBe(true);
    const shapes = PRESETS.slice(1).map((p) => p.look.garb);
    expect(shapes.every((g) => g && g > 0)).toBe(true);
    expect(new Set(shapes).size).toBe(shapes.length);
  });
  it('treats a look saved before outfit shapes as the tunic', () => {
    const old: Look = { skin: 1, style: 0, hair: 0, outfit: 0 };
    expect(sameLook(old, { ...old, garb: 0 })).toBe(true);
    expect(hero(1, 64, [], old)).toBe(hero(1, 64, [], { ...old, garb: 0 }));
    expect(hero(1, 64, [], old)).not.toBe(hero(1, 64, [], { ...old, garb: 1 }));
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
