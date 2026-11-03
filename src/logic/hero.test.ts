import { describe, expect, it } from 'vitest';
import { addDays } from './day';
import { BOSS_GOLD, BOSSES, bossOf, chestLoot, heroOf } from './hero';
import { buyBlock, emptyWardrobe, itemById, ITEMS, wornIds } from './items';
import { score } from './score';
import { BOSS_ART, ITEM_ART, PAL } from '../sprites';
import type { Habit, Log, Mark, State } from './types';

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

describe('chest loot', () => {
  it('is fixed per chest, 50-150 gold or a chest item about a quarter of the time', () => {
    const w = emptyWardrobe();
    expect(chestLoot('b-2026-11-02', w)).toEqual(chestLoot('b-2026-11-02', w));
    const loot = Array.from({ length: 2000 }, (_, i) => chestLoot(`m-${i}`, w));
    const items = loot.filter((l) => l.item).length / loot.length;
    expect(items).toBeGreaterThan(0.2);
    expect(items).toBeLessThan(0.3);
    expect(loot.every((l) => (l.item ? itemById(l.item)!.chest : l.gold! >= 50 && l.gold! <= 150))).toBe(true);
  });
  it('gives only gold once every chest item is owned', () => {
    const w = emptyWardrobe();
    for (const i of ITEMS.filter((x) => x.chest)) w.owned[i.id] = { day: MON, paid: 0 };
    expect(Array.from({ length: 200 }, (_, i) => chestLoot(`c${i}`, w)).every((l) => l.gold)).toBe(true);
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
    expect(heroOf(s, score(s, MON), MON).balance).toBe(5 - 50);
  });
});

describe('weekly boss', () => {
  const day = (n: number) => addDays(MON, n);
  const week = (marks: Mark[]): Log => Object.fromEntries(marks.map((m, i) => [day(i), { h: m }]));
  it('has 70% of the week as HP and falls with a few misses', () => {
    const b = bossOf([daily], week(['full', 'full', 'full', 'full', 'full']), MON, day(6))!;
    expect(b.hp).toBe(49);
    expect(b.won).toBe(true);
    expect(bossOf([daily], week(['full', 'full', 'full', 'full']), MON, day(6))!.won).toBe(false);
  });
  it('takes half damage from tiny checks and full damage from plans, which add no HP', () => {
    const plan: Habit = { ...daily, id: 'p', schedule: { kind: 'once', day: day(1) } };
    const b = bossOf([daily, plan], { ...week(['tiny', 'tiny']), [day(1)]: { h: 'tiny', p: 'full' } }, MON, day(1))!;
    expect([b.hp, b.dmg, b.daysLeft]).toEqual([49, 20, 5]);
  });
  it('only counts days a quest existed, and skips empty weeks', () => {
    expect(bossOf([{ ...daily, created: day(2) }], {}, MON, day(2))!.hp).toBe(35);
    expect(bossOf([daily], {}, addDays(MON, -7), day(0))).toBeUndefined();
  });
  it('has art for every boss', () => {
    expect(BOSSES.every((n) => BOSS_ART[n]?.length === 8)).toBe(true);
  });
  it('rotates the roster weekly', () => {
    const names = [0, 7, 14].map((n) => bossOf([daily], {}, day(n), day(n))!.name);
    expect(new Set(names).size).toBe(3);
  });
  it('gives a chest per win and per streak milestone; opened ones pay out while still earned', () => {
    const marks = week(['full', 'full', 'full', 'full', 'full', 'full', 'full']); // a win and a 7-day milestone
    const w = emptyWardrobe();
    let s = state(marks, w);
    let hs = heroOf(s, score(s, day(6)), day(6));
    expect(hs.chests.map((c) => c.id).sort()).toEqual([`b-${MON}`, `m-${day(6)}-h`]);
    w.opened[`b-${MON}`] = { day: day(6), gold: 100 };
    hs = heroOf(s, score(s, day(6)), day(6));
    expect(hs.chests.map((c) => c.why)).toEqual(['7-day streak']);
    expect(hs.balance).toBe(35 + BOSS_GOLD + 100);
    s = state({}, w); // untick the whole week: the win and its chest gold are gone
    expect(heroOf(s, score(s, day(6)), day(6)).balance).toBe(0);
  });
  it('pays 50 gold per win into the balance', () => {
    const s = state(week(['full', 'full', 'full', 'full', 'full']));
    const hs = heroOf(s, score(s, day(8)), day(8));
    expect(hs.wins).toBe(1);
    expect(hs.balance).toBe(25 + BOSS_GOLD);
    expect(hs.boss!.week).toBe(day(7));
  });
});
