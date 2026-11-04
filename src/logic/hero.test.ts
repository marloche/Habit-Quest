import { describe, expect, it } from 'vitest';
import { addDays } from './day';
import { BOSS_GOLD, BOSSES, bossName, bossOf, chestLoot, heroOf } from './hero';
import { buyBlock, emptyWardrobe, itemById, ITEMS, wornIds } from './items';
import { score } from './score';
import { ITEM_ART, PAL } from '../sprites';
import { ELITE_PALS, LADDER } from '../bosses';
import type { Habit, Log, Mark, State } from './types';

const MON = '2026-11-02';
const daily: Habit = { id: 'h', name: 'h', icon: 'star', schedule: { kind: 'daily' }, created: MON };
const state = (log: Log, wardrobe = emptyWardrobe()): State => ({ v: 5, settings: { rolloverHour: 4, muted: false }, habits: [daily], log, wardrobe, journal: {}, focus: {} });

describe('catalogue', () => {
  it('has unique ids and sells only shop items; chest finds and trophies are free', () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
    expect(ITEMS.filter((i) => i.chest || i.trophy).every((i) => i.price === 0)).toBe(true);
    expect(ITEMS.filter((i) => !i.chest && !i.trophy).every((i) => i.price > 0)).toBe(true);
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
    expect(wornIds({ ...emptyWardrobe(), worn: { hat: 'leaf-crown', pet: 'unicorn' } }, [])).toEqual(['leaf-crown']);
  });
  it('shows a worn trophy only while it is earned', () => {
    const w = { ...emptyWardrobe(), worn: { hat: 'flame-crown' as const } };
    expect(wornIds(w, [])).toEqual([]);
    expect(wornIds(w, ['flame-crown'])).toEqual(['flame-crown']);
    expect(buyBlock(itemById('flame-crown')!, 99, 9999, w)).toBe('Trophy: reach STREAK tier III.');
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
  it('has square art for every boss on the ladder, growing as it climbs, in known colors', () => {
    expect(LADDER.map((b) => b.name)).toEqual(BOSSES);
    const colors = new RegExp(`^[${Object.keys(PAL).join('')}]+$`);
    for (const b of LADDER) {
      expect(b.art.every((r) => r.length === b.art.length), b.name).toBe(true);
      expect(b.art.join('').replace(/\./g, ''), b.name).toMatch(colors);
    }
    expect(LADDER.every((b, i) => i === 0 || b.art.length >= LADDER[i - 1].art.length)).toBe(true);
    expect(ELITE_PALS.every((p) => Object.keys(p).every((k) => k in PAL))).toBe(true);
  });
  it('climbs one boss per win, then repeats as elite laps', () => {
    expect(bossName(0)).toEqual({ tier: 0, lap: 0, name: 'Slime' });
    expect(bossName(11).name).toBe('Elder Dragon');
    expect(bossName(12)).toEqual({ tier: 0, lap: 1, name: 'Elite Slime' });
    expect(bossName(25)).toEqual({ tier: 1, lap: 2, name: 'Elite II Cave Rat' });
    expect(bossName(12 * 9).name).toBe('Elite 9 Slime');
  });
  it('brings a meaner boss after a win and a rematch after a loss', () => {
    const five = ['full', 'full', 'full', 'full', 'full'] as Mark[];
    const log = { ...week(five), ...Object.fromEntries(five.map((m, i) => [day(14 + i), { h: m }])) }; // win, lose, win
    const s = state(log);
    const names = [6, 13, 20, 27].map((n) => heroOf(s, score(s, day(n)), day(n)).boss!.name);
    expect(names).toEqual(['Slime', 'Cave Rat', 'Cave Rat', 'Bat Swarm']);
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
    expect(hs.balance).toBe(35 + BOSS_GOLD + 100 + 4 * 25); // tier I of streak, perfect, boss and treasure
    s = state({}, w); // untick the whole week: the win and its chest gold are gone; opening it still counts for TREASURE
    expect(heroOf(s, score(s, day(6)), day(6)).balance).toBe(25);
  });
  it('pays 50 gold per win into the balance', () => {
    const s = state(week(['full', 'full', 'full', 'full', 'full']));
    const hs = heroOf(s, score(s, day(8)), day(8));
    expect(hs.wins).toBe(1);
    expect(hs.balance).toBe(25 + BOSS_GOLD + 2 * 25); // tier I of boss and perfect
    expect(hs.boss!.week).toBe(day(7));
  });
});
