import { describe, expect, it } from 'vitest';
import { heroOf } from './hero';
import { buyBlock, emptyWardrobe, itemById, ITEMS, wornIds } from './items';
import { score } from './score';
import { ITEM_ART, PAL } from '../sprites';
import type { Habit, Log, State } from './types';

const MON = '2026-11-02';
const daily: Habit = { id: 'h', name: 'h', icon: 'star', schedule: { kind: 'daily' }, created: MON };
const state = (log: Log, wardrobe = emptyWardrobe()): State => ({ v: 3, settings: { rolloverHour: 4, muted: false }, habits: [daily], log, wardrobe });

describe('catalogue', () => {
  it('has unique ids and sells only non-chest items', () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
    expect(ITEMS.filter((i) => i.chest).every((i) => i.price === 0)).toBe(true);
    expect(ITEMS.filter((i) => !i.chest).every((i) => i.price > 0)).toBe(true);
  });
});

describe('item art', () => {
  it('exists for every item, with even rows that stay on the 24x16 canvas', () => {
    for (const i of ITEMS) {
      const art = ITEM_ART[i.id];
      expect(art, i.id).toBeDefined();
      expect(new Set(art.rows.map((r) => r.length)).size, i.id).toBe(1);
      expect(art.x + art.rows[0].length, i.id).toBeLessThanOrEqual(24);
      expect(art.y + art.rows.length, i.id).toBeLessThanOrEqual(16);
      expect(art.rows.join('').replace(/\./g, ''), i.id).toMatch(new RegExp(`^[${Object.keys(PAL).join('')}]+$`));
    }
  });
});

describe('buying', () => {
  const crown = itemById('gold-crown')!;
  const leaf = itemById('leaf-crown')!;
  it('needs the level, the gold, and not owning it already', () => {
    const w = emptyWardrobe();
    expect(buyBlock(crown, 9, 1000, w)).toBe('Reach level 10 first.');
    expect(buyBlock(leaf, 1, 59, w)).toBe('Need 1 more gold.');
    expect(buyBlock(leaf, 1, 60, w)).toBe('');
    expect(buyBlock(itemById('halo')!, 50, 9999, w)).toBe('Found only in chests.');
    w.owned[leaf.id] = { day: MON, paid: 60 };
    expect(buyBlock(leaf, 1, 999, w)).toBe('owned');
  });
  it('skips worn ids the catalogue no longer has', () => {
    expect(wornIds({ ...emptyWardrobe(), worn: { hat: 'leaf-crown', pet: 'unicorn' } })).toEqual(['leaf-crown']);
  });
});

describe('gold balance', () => {
  it('is earned minus paid, and may go negative after unticking', () => {
    const w = emptyWardrobe();
    w.owned['wood-sword'] = { day: MON, paid: 50 };
    const s = state({ [MON]: { h: 'full' } }, w);
    expect(heroOf(s, score(s, MON)).balance).toBe(5 - 50);
  });
});
