import { describe, expect, it } from 'vitest';
import { byIcon, iconsInUse } from './filter';
import type { Habit } from './types';

const q = (id: string, icon: string): Habit => ({ id, name: id, icon, schedule: { kind: 'daily' }, created: '2026-11-16' });
const list = [q('a', 'sword'), q('b', 'heart'), q('c', 'sword'), q('d', 'monke')];

describe('the icon filter', () => {
  it('lists the icons in use, in list order, once each', () => {
    expect(iconsInUse(list)).toEqual(['sword', 'heart', 'monke']);
    expect(iconsInUse([])).toEqual([]);
  });
  it('shows only the picked icon and counts the rest as hidden', () => {
    const r = byIcon(list, 'sword');
    expect(r.shown.map((h) => h.id)).toEqual(['a', 'c']);
    expect(r.hidden.map((h) => h.id)).toEqual(['b', 'd']);
    expect(r.active).toBe('sword');
  });
  it('shows everything for ALL, or when no quest uses the picked icon any more', () => {
    expect(byIcon(list, '')).toEqual({ shown: list, hidden: [], active: '' });
    expect(byIcon(list, 'apple')).toEqual({ shown: list, hidden: [], active: '' });
  });
});
