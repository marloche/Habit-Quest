import { describe, expect, it } from 'vitest';
import { progressOf, tierGold, TRACKS, trackValues, trophiesOf, trophyAt } from './achievements';
import { addDays } from './day';
import { emptyWardrobe, ITEMS } from './items';
import { score } from './score';
import type { Habit, Log, State } from './types';

const MON = '2026-11-02';
const day = (n: number) => addDays(MON, n);
const daily: Habit = { id: 'h', name: 'h', icon: 'star', schedule: { kind: 'daily' }, created: MON };
const plan: Habit = { id: 'p', name: 'p', icon: 'star', schedule: { kind: 'once', day: day(1) }, created: MON };
const state = (log: Log, habits = [daily]): State => ({ v: 5, settings: { rolloverHour: 4, muted: false }, habits, log, wardrobe: emptyWardrobe(), journal: {}, focus: {} });

describe('achievement tracks', () => {
  it('have rising tiers, and every trophy sits on a real track tier with its unlock spelled out', () => {
    for (const t of TRACKS) expect(t.tiers[0] < t.tiers[1] && t.tiers[1] < t.tiers[2], t.id).toBe(true);
    expect(new Set(TRACKS.map((t) => t.id)).size).toBe(TRACKS.length);
    const trophies = ITEMS.filter((i) => i.trophy);
    expect(trophies.length).toBe(12);
    for (const i of trophies) {
      const t = TRACKS.find((x) => x.id === i.trophy!.track)!;
      expect(t, i.id).toBeDefined();
      expect(i.trophy!.how, i.id).toContain(`(${t.name} ${i.trophy!.tier === 2 ? 'II' : 'III'})`);
      expect(trophyAt(t.id, i.trophy!.tier)?.id, i.id).toBe(i.id); // one trophy per track tier
    }
    expect(trophies.some((i) => i.trophy!.track === 'checks')).toBe(false); // raw volume never wins a trophy
    expect(TRACKS.find((t) => t.id === 'collector')!.tiers[2]).toBe(ITEMS.filter((i) => !i.trophy).length); // III = own them all
  });
  it('count days shown up and weeks with a check every day', () => {
    // Week 1: every day, tiny counts. Week 2: Tuesday missed.
    const log: Log = Object.fromEntries([0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13].map((i) => [day(i), { h: i === 3 ? 'tiny' : 'full' }]));
    const s = state(log);
    expect(trackValues(s, score(s, day(13)), 0)).toMatchObject({ days: 13, weeks: 1 });
  });
  it('keep a trophy earned through a later missed day', () => {
    const log: Log = Object.fromEntries([...Array.from({ length: 30 }, (_, i) => i), 31].map((i) => [day(i), { h: 'full' }])); // 30 in a row, a miss, back
    const s = state(log);
    expect(trophiesOf(progressOf(trackValues(s, score(s, day(31)), 0)))).toContain('sun-circlet');
  });
  it('measure checks, tiny checks, comebacks, plans and streaks from the log', () => {
    // Mon full, Tue tiny + plan done, Wed missed, Thu full (a comeback), Fri full.
    const log: Log = { [day(0)]: { h: 'full' }, [day(1)]: { h: 'tiny', p: 'full' }, [day(3)]: { h: 'full' }, [day(4)]: { h: 'full' } };
    const s = state(log, [daily, plan]);
    const v = trackValues(s, score(s, day(4)), 0);
    expect(v).toMatchObject({ checks: 5, tiny: 1, comeback: 1, planner: 1, streak: 2, perfect: 2, boss: 0, collector: 0, treasure: 0 });
  });
  it('count tiers reached, pay 25/75/200 per tier, and grant tier III trophies', () => {
    const ps = progressOf({ streak: 100, checks: 260, tiny: 9 });
    expect(ps.find((p) => p.track.id === 'streak')!.tier).toBe(3);
    expect(ps.find((p) => p.track.id === 'checks')!.tier).toBe(2);
    expect(ps.find((p) => p.track.id === 'tiny')!.tier).toBe(0);
    expect(tierGold(ps)).toBe(300 + 100);
    expect(trophiesOf(ps)).toEqual(['sun-circlet', 'flame-crown']);
    expect(trophiesOf(progressOf({ streak: 30, days: 365 }))).toEqual(['sun-circlet', 'loyal-hound', 'wise-owl']);
  });
  it('are lost again when the history behind them is unticked', () => {
    const week: Log = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((i) => [day(i), { h: 'full' }]));
    const full = state(week);
    const streak = (s: State) => progressOf(trackValues(s, score(s, day(6)), 0)).find((p) => p.track.id === 'streak')!.tier;
    expect(streak(full)).toBe(1);
    expect(streak(state({ ...week, [day(3)]: {} }))).toBe(0);
  });
});
