import { describe, expect, it } from 'vitest';
import { addDays } from './day';
import { BOSS_GOLD, BOSS_HP, BOSS_WEEKS, BOSSES, bossName, bossOf, bossShare, chestLoot, heroOf, woundStage } from './hero';
import { expected, isActive } from './score';
import { TRACKS } from './achievements';
import { buyBlock, emptyWardrobe, itemById, ITEMS, wornIds } from './items';
import { score } from './score';
import { ITEM_ART, PAL } from '../sprites';
import { ELITE_PALS, LADDER, wounded } from '../bosses';
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
  it('keeps weapons held beside the hand and clear of the pet, and armor off the hands', () => {
    for (const i of ITEMS.filter((x) => x.slot === 'weapon')) {
      const art = ITEM_ART[i.id];
      expect(art.x + art.rows[0].length, i.id).toBeLessThanOrEqual(16); // pets start at column 16
      const at = (r: number, c: number) => art.rows[r - art.y]?.[c - art.x] ?? '.';
      expect([8, 9].some((r) => [11, 12, 13].some((c) => at(r, c) !== '.')), i.id).toBe(true); // something in or next to the hand
    }
    for (const i of ITEMS.filter((x) => x.slot === 'armor')) {
      const art = ITEM_ART[i.id];
      for (const [r, c] of [[8, 4], [8, 11], [9, 4], [9, 11]]) expect(art.rows[r - art.y]?.[c - art.x] ?? '.', i.id).toBe('.');
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
    expect(buyBlock(itemById('flame-crown')!, 99, 9999, w)).toBe('Trophy: Keep one quest going 100 days in a row (STREAK III).');
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
  it('needs about 65% of the week from the first boss, and falls with a few misses', () => {
    const b = bossOf([daily], week(['full', 'full', 'full', 'full', 'full']), MON, day(6))!;
    expect([b.hp, b.dmg, b.won]).toEqual([120, 120, true]);
    expect(bossOf([daily], week(['full', 'full', 'full', 'full']), MON, day(6))!.won).toBe(false);
  });
  it('has its own HP up the ladder, tougher each elite lap, while your hits scale to your week', () => {
    expect(BOSS_HP.length).toBe(BOSSES.length);
    expect(BOSS_HP.every((hp, i) => i === 0 || hp > BOSS_HP[i - 1])).toBe(true);
    const few = bossOf([daily], {}, MON, MON, 0)!;
    const many = bossOf(Array.from({ length: 12 }, (_, i) => ({ ...daily, id: `d${i}` })), {}, MON, MON, 0)!;
    expect([few.hp, many.hp]).toEqual([120, 120]);
    expect(few.hit).toBeGreaterThan(many.hit * 10);
    expect(bossOf([daily], {}, MON, MON, 11)!.hp).toBe(1200);
    expect(bossOf([daily], {}, MON, MON, 12)!.hp).toBe(180); // Elite Slime: half again
  });
  it('asks the same fair share of the week at any quest count, schedule mix or ladder step, capped at 75%', () => {
    const q = (id: string, schedule: Habit['schedule'], created = MON): Habit => ({ ...daily, id, schedule, created });
    const dailies = (n: number) => Array.from({ length: n }, (_, i) => q(`d${i}`, { kind: 'daily' }));
    const mixes: Habit[][] = [
      dailies(1), dailies(3), dailies(6), dailies(12),
      [...dailies(2), q('w1', { kind: 'weekly', times: 3 }), q('w2', { kind: 'weekly', times: 3 })],
      [...dailies(1), q('late', { kind: 'daily' }, day(3))], // one added on Thursday counts only from Thursday
      [...dailies(1), { ...q('gone', { kind: 'daily' }), archived: day(3) }], // one archived on Thursday stops counting
    ];
    for (const beaten of [0, 5, 9, 11, 40]) {
      for (const habits of mixes) {
        // Check off quests one at a time, only where they are active, until the boss falls, across its whole fight.
        const days = Array.from({ length: bossOf(habits, {}, MON, MON, beaten)!.weeks * 7 }, (_, i) => day(i));
        const last = days[days.length - 1];
        const want = days.reduce((n, d) => n + habits.reduce((m, h) => m + expected(h, d), 0), 0);
        const log: Log = {};
        let checks = 0;
        for (const d of days)
          for (const h of habits) {
            if (bossOf(habits, log, MON, last, beaten)!.won) break;
            if (!isActive(h, d)) continue;
            log[d] = { ...log[d], [h.id]: 'full' };
            checks++;
          }
        const share = checks / want;
        expect(bossOf(habits, log, MON, last, beaten)!.won, `${want} checks, ${beaten} beaten`).toBe(true);
        expect(share, `${want} checks, ${beaten} beaten`).toBeGreaterThanOrEqual(0.6);
        expect(share, `${want} checks, ${beaten} beaten`).toBeLessThanOrEqual(0.8);
      }
    }
    expect(bossShare(0)).toBe(0.65);
    expect(bossShare(10)).toBe(0.75);
    expect(bossShare(500)).toBe(0.75);
  });
  it('gives the last three bosses longer fights, a month at most, elite laps too', () => {
    expect(BOSS_WEEKS.length).toBe(BOSSES.length);
    expect([0, 8, 9, 10, 11, 23].map((n) => bossOf([daily], {}, MON, MON, n)!.weeks)).toEqual([1, 1, 2, 3, 4, 4]);
    const dragon = bossOf([daily], {}, MON, MON, 11)!;
    expect([dragon.end, dragon.daysLeft]).toEqual([day(27), 27]);
  });
  it('says out of reach once checking everything left cannot win, and counts today as still open', () => {
    expect(bossOf([daily], {}, MON, MON)!.reach).toBe(true);
    expect(bossOf([daily], {}, MON, day(3))!.reach).toBe(false); // 4 days left, 5 hits needed
    expect(bossOf([daily], week(['full']), MON, day(3))!.reach).toBe(true);
    expect(bossOf([daily], {}, MON, day(4), 9)!.reach).toBe(true); // Lich: 10 days left for 10 hits
    expect(bossOf([daily], {}, MON, day(7), 9)!.reach).toBe(false);
  });
  it('pays gold and a chest per week of a long fight, starts the next one the Monday after a win, and BOSS SLAYER III at 12', () => {
    const all = (n: number): Log => Object.fromEntries(Array.from({ length: n }, (_, i) => [day(i), { h: 'full' }]));
    let s = state(all(120));
    const lich = heroOf(s, score(s, day(70)), day(70)).boss!;
    expect([lich.name, lich.week, lich.weeks]).toEqual(['Lich', day(63), 2]);
    const hs = heroOf(s, score(s, day(119)), day(119));
    expect(hs.wins).toBe(12);
    const won = hs.chests.filter((c) => c.id.startsWith('b-')).map((c) => c.id);
    expect(won.length).toBe(9 + 2 + 3 + 4);
    expect(won).toContain(`b-${day(63)}-2`); // Lich, won day 72: Demon Lord starts day 77
    expect(won).toContain(`b-${day(77)}-3`);
    expect(won).toContain(`b-${day(98)}-4`);
    expect([hs.boss!.name, hs.boss!.week]).toEqual(['Elite Slime', day(119)]);
    expect(hs.achievements.find((p) => p.track.id === 'boss')!.tier).toBe(3);
    expect(TRACKS.find((t) => t.id === 'boss')!.tiers).toEqual([1, 5, 12]);
    s = state(all(63)); // stop after the Troll: the Lich gets away, then comes back fresh
    expect(heroOf(s, score(s, day(80)), day(80)).boss!).toMatchObject({ name: 'Lich', week: day(77), dmg: 0 });
  });
  it('takes half damage from tiny checks and full damage from plans, which add no HP', () => {
    const plan: Habit = { ...daily, id: 'p', schedule: { kind: 'once', day: day(1) } };
    const b = bossOf([daily, plan], { ...week(['tiny', 'tiny']), [day(1)]: { h: 'tiny', p: 'full' } }, MON, day(1))!;
    expect([b.hp, b.dmg, b.daysLeft]).toEqual([120, 48, 5]); // 2 hits of the 5 needed
    expect(bossOf([daily], {}, MON, MON)!.hit).toBe(24);
  });
  it('only counts days a quest existed, and skips empty weeks', () => {
    const late = [{ ...daily, created: day(2) }];
    expect(bossOf(late, { [day(2)]: { h: 'full' }, [day(3)]: { h: 'full' } }, MON, day(6))!.won).toBe(false);
    expect(bossOf(late, { [day(2)]: { h: 'full' }, [day(3)]: { h: 'full' }, [day(4)]: { h: 'full' } }, MON, day(6))!.won).toBe(true);
    expect(bossOf([daily], {}, addDays(MON, -7), day(0))).toBeUndefined();
  });
  it('shows wounds in three stages as HP drops, the same every time, growing on the boss itself', () => {
    expect([0, 29, 30, 59, 60, 89, 90, 119].map((dmg) => woundStage({ dmg, hp: 120, won: false }))).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect(woundStage({ dmg: 0, hp: 120, won: true })).toBe(3);
    for (const b of LADDER) {
      const at = (s: number) => wounded(b.art, s, b.name);
      expect(at(0)).toBe(b.art);
      expect(at(2)).toEqual(wounded(b.art, 2, b.name));
      const hurt = (s: number) => new Set(at(s).flatMap((r, y) => [...r].map((c, x) => (c !== b.art[y][x] ? `${x},${y}` : '')).filter(Boolean)));
      const [one, two, three] = [hurt(1), hurt(2), hurt(3)];
      expect(one.size, b.name).toBeGreaterThan(0);
      expect([...one].every((p) => two.has(p)) && [...two].every((p) => three.has(p)), b.name).toBe(true);
      expect(three.size, b.name).toBeGreaterThan(one.size);
      expect([...three].every((p) => { const [x, y] = p.split(',').map(Number); return b.art[y][x] !== '.'; }), b.name).toBe(true);
    }
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
