import { describe, expect, it } from 'vitest';
import { progressOf, tierGold, TRACKS, trackValues, trophiesOf } from './achievements';
import { addDays } from './day';
import { emptyWardrobe, itemById, ITEMS } from './items';
import { score } from './score';
import type { Habit, Log, State } from './types';

const MON = '2026-11-02';
const day = (n: number) => addDays(MON, n);
const daily: Habit = { id: 'h', name: 'h', icon: 'star', schedule: { kind: 'daily' }, created: MON };
const plan: Habit = { id: 'p', name: 'p', icon: 'star', schedule: { kind: 'once', day: day(1) }, created: MON };
const state = (log: Log, habits = [daily]): State => ({ v: 4, settings: { rolloverHour: 4, muted: false }, habits, log, wardrobe: emptyWardrobe(), journal: {} });

describe('achievement tracks', () => {
  it('have rising tiers, and every trophy is a real trophy item', () => {
    for (const t of TRACKS) expect(t.tiers[0] < t.tiers[1] && t.tiers[1] < t.tiers[2], t.id).toBe(true);
    for (const t of TRACKS.filter((x) => x.trophy)) expect(itemById(t.trophy!)?.trophy, t.id).toBe(t.name);
    expect(TRACKS.find((t) => t.id === 'collector')!.tiers[2]).toBe(ITEMS.filter((i) => !i.trophy).length); // III = own them all
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
    expect(trophiesOf(ps)).toEqual(['flame-crown']);
  });
  it('are lost again when the history behind them is unticked', () => {
    const week: Log = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((i) => [day(i), { h: 'full' }]));
    const full = state(week);
    const streak = (s: State) => progressOf(trackValues(s, score(s, day(6)), 0)).find((p) => p.track.id === 'streak')!.tier;
    expect(streak(full)).toBe(1);
    expect(streak(state({ ...week, [day(3)]: {} }))).toBe(0);
  });
});
