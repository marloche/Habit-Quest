import { describe, expect, it } from 'vitest';
import { BEARDS, CLASSIC, cleanName, FACES, GARBS, MARKS, PARTS, PRESETS, randomLook, sameLook, STYLES, validName } from './look';
import { hero, heroHead, titleOf } from '../sprites';
import * as art from '../hero32';
import { GARBS32, ITEM32, PETS32 } from '../art32';
import type { Look, LookPart } from './types';

const OPTIONAL = ['garb', 'eye', 'beard', 'mark', 'face'];
const inRange = (l: Look) =>
  (Object.keys(PARTS) as LookPart[]).every((k) => (OPTIONAL.includes(k) && l[k] === undefined) || (Number.isInteger(l[k]) && l[k]! >= 0 && l[k]! < PARTS[k]));
const rowsOk = (rows: (string | null)[]) => rows.every((r) => r === null || r === undefined || r.length === art.W);

describe('hero look', () => {
  it('has art for every hair style, expression, facial hair and mark, all 32 wide', () => {
    expect(art.HAIRS.map((h) => h.name)).toEqual(STYLES);
    expect(art.EXPRESSIONS.map((e) => e.name)).toEqual(FACES);
    expect(art.BEARDS.map((b) => b.name)).toEqual(BEARDS);
    expect(art.MARKS.map((m) => m.name)).toEqual(MARKS);
    for (const h of art.HAIRS) expect(rowsOk(h.front) && rowsOk(h.back), h.name).toBe(true);
    for (const b of art.BEARDS) expect(rowsOk(b.rows), b.name).toBe(true);
    expect(rowsOk(art.HEAD)).toBe(true);
  });
  it('draws every option and every item with known colors only', () => {
    const looks: Look[] = [];
    for (const [k, n] of Object.entries(PARTS)) for (let i = 0; i < n; i++) looks.push({ ...CLASSIC, [k]: i });
    for (const l of looks) expect(hero(1, 64, [], l), JSON.stringify(l)).not.toContain('undefined');
    for (const id of Object.keys(ITEM32)) expect(hero(20, 64, [id]), id).not.toContain('undefined');
    expect(heroHead(CLASSIC)).not.toContain('undefined');
  });
  it('has a 32px outfit for every name, 32 wide, with the hands at row 25, columns 8-9 and 22-23', () => {
    expect(GARBS32.length).toBe(GARBS.length);
    for (const [i, g] of GARBS32.entries()) {
      expect(rowsOk(g), GARBS[i]).toBe(true);
      expect([8, 9, 22, 23].map((x) => g[25]![x]), GARBS[i]).toEqual(['f', 'f', 'f', 'f']);
    }
    for (const [id, rows] of Object.entries(PETS32)) expect(rows.length === 16 && rows.every((r) => r.length === 16), id).toBe(true);
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
  it('draws a look saved before outfit shapes and face options like the first of each', () => {
    const old: Look = { skin: 1, style: 0, hair: 0, outfit: 0 };
    const full = { ...old, garb: 0, eye: 0, beard: 0, mark: 0, face: 0 };
    expect(sameLook(old, full)).toBe(true);
    expect(hero(1, 64, [], old)).toBe(hero(1, 64, [], full));
    expect(hero(1, 64, [], old)).not.toBe(hero(1, 64, [], { ...old, garb: 1 }));
    expect(hero(1, 64, [], old)).not.toBe(hero(1, 64, [], { ...old, beard: 2 }));
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
  it('a helmet hides the hair above the brow', () => {
    const spiky = { ...CLASSIC, style: 3 };
    expect(hero(1, 64, ['knight-helm'], spiky)).not.toBe(hero(1, 64, [], spiky));
  });
});

describe('hero name', () => {
  it('cleans what you type, up to 12 characters', () => {
    expect(cleanName('  Marlo  ')).toBe('Marlo');
    expect(cleanName('Sir   Mochi\tthe')).toBe('Sir Mochi th');
    expect(cleanName('   ')).toBeUndefined();
    expect(validName(cleanName('a very long hero name indeed'))).toBe(true);
  });
  it('reads NAME the RANK, or just the rank', () => {
    expect(titleOf(1)).toBe('Squire');
    expect(titleOf(5, { ...CLASSIC, name: 'Marlo' })).toBe('Marlo the Knight');
    expect(hero(1, 64, [], { ...CLASSIC, name: 'Marlo' })).toContain('Marlo the Squire');
  });
});
