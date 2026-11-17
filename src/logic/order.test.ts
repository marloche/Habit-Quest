import { describe, expect, it } from 'vitest';
import { reorder } from './order';
import type { Habit } from './types';

const q = (id: string, extra: Partial<Habit> = {}): Habit => ({ id, name: id, icon: 'star', schedule: { kind: 'daily' }, created: '2026-11-16', ...extra });
const ids = (hs: Habit[]) => hs.map((h) => h.id);
// a, b, c, d are shown in EDIT QUESTS; x is archived and p is a one-off plan, both hidden there.
const list = [q('a'), q('x', { archived: '2026-11-10' }), q('b'), q('p', { schedule: { kind: 'once', day: '2026-11-20' } }), q('c'), q('d')];

describe('quest order', () => {
  it('moves a quest straight to the top; hidden quests keep their slots', () => {
    expect(ids(reorder(list, 'c', 0))).toEqual(['c', 'x', 'a', 'p', 'b', 'd']);
  });
  it('moves a quest to any spot, up or down, by its place among the shown quests', () => {
    expect(ids(reorder(list, 'a', 2))).toEqual(['b', 'x', 'c', 'p', 'a', 'd']);
    expect(ids(reorder(list, 'd', 1))).toEqual(['a', 'x', 'd', 'p', 'b', 'c']);
  });
  it('one step matches the old arrow swap, skipping hidden quests', () => {
    expect(ids(reorder(list, 'b', 0))).toEqual(['b', 'x', 'a', 'p', 'c', 'd']);
    expect(ids(reorder(list, 'b', 2))).toEqual(['a', 'x', 'c', 'p', 'b', 'd']);
  });
  it('clamps past the ends, and leaves the list alone for no move or an unknown id', () => {
    expect(ids(reorder(list, 'a', 99))).toEqual(['b', 'x', 'c', 'p', 'd', 'a']);
    expect(ids(reorder(list, 'd', -5))).toEqual(['d', 'x', 'a', 'p', 'b', 'c']);
    expect(reorder(list, 'a', 0)).toBe(list);
    expect(reorder(list, 'nope', 0)).toBe(list);
    expect(reorder(list, 'x', 0)).toBe(list); // an archived quest isn't in the shown list
  });
});
