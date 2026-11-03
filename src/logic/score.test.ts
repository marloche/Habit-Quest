import { describe, expect, it } from 'vitest';
import { addDays } from './day';
import { levelOf, momentumAt, score, xpForLevel } from './score';
import type { Habit, Log, Mark, Schedule, State } from './types';

const MON = '2026-11-02';
const habit = (schedule: Schedule = { kind: 'daily' }, created = MON, id = 'h'): Habit => ({ id, name: id, icon: 'star', schedule, created });
const logOf = (days: string[], id = 'h', mark: Mark = 'full'): Log => Object.fromEntries(days.map((d) => [d, { [id]: mark }]));
const state = (habits: Habit[], log: Log): State => ({ v: 1, settings: { rolloverHour: 4, muted: false }, habits, log });
const day = (n: number) => addDays(MON, n);

describe('levels', () => {
  it('follows 25*L*(L-1) total XP', () => {
    expect(xpForLevel(2)).toBe(50);
    expect(levelOf(0).level).toBe(1);
    expect(levelOf(49).level).toBe(1);
    expect(levelOf(50).level).toBe(2);
    expect(levelOf(150).level).toBe(3);
    expect(levelOf(2250).level).toBe(10);
    expect(levelOf(75).progress).toBeCloseTo(0.25);
  });
});

describe('daily streaks', () => {
  it('resets on a miss and grants a comeback bonus on return', () => {
    const s = score(state([habit()], logOf([day(0), day(1), day(3), day(4)])), day(4));
    expect(s.habits.h.streak).toBe(2);
    expect(s.habits.h.best).toBe(2);
    expect(s.awards[day(3)].h.comeback).toBe(true);
    expect(s.awards[day(4)].h.comeback).toBe(false);
  });
  it('does not break the streak for today while it is still open', () => {
    const s = score(state([habit()], logOf([day(0), day(1)])), day(2));
    expect(s.habits.h.streak).toBe(2);
    expect(s.habits.h.comebackReady).toBe(false);
  });
  it('flags comeback after a missed yesterday', () => {
    const s = score(state([habit()], logOf([day(0)])), day(2));
    expect(s.habits.h.streak).toBe(0);
    expect(s.habits.h.comebackReady).toBe(true);
  });
  it('skips non-scheduled weekdays', () => {
    const h = habit({ kind: 'days', days: [1, 3, 5] }); // Mon Wed Fri
    const s = score(state([h], logOf([day(0), day(2), day(4), day(7)])), day(8));
    expect(s.habits.h.streak).toBe(4);
  });
  it('lets the tiny version keep the streak for half the base XP', () => {
    const s = score(state([habit()], { [day(0)]: { h: 'full' }, [day(1)]: { h: 'tiny' } }), day(1));
    expect(s.habits.h.streak).toBe(2);
    expect(s.awards[day(0)].h.xp).toBe(10);
    expect(s.awards[day(1)].h.xp).toBe(10); // 5 base x2.0 momentum (1 of 1 expected checks done)
  });
  it('adds the 7-day milestone bonus', () => {
    const days = Array.from({ length: 7 }, (_, i) => day(i));
    const s = score(state([habit()], logOf(days)), day(6));
    expect(s.awards[day(6)].h.milestone).toBe(50);
    expect(s.awards[day(6)].h.xp).toBe(70);
  });
});

describe('momentum', () => {
  it('starts at x1 and reaches x2 after 14 perfect days', () => {
    const days = Array.from({ length: 14 }, (_, i) => day(i));
    const h = habit();
    expect(momentumAt([h], {}, day(0))).toBe(1);
    expect(momentumAt([h], logOf(days), day(14))).toBe(2);
  });
  it('one miss in 14 days only dents it', () => {
    const days = Array.from({ length: 14 }, (_, i) => day(i)).filter((d) => d !== day(5));
    expect(momentumAt([habit()], logOf(days), day(14))).toBe(1.93);
  });
  it('a comeback check stacks x1.5 on momentum', () => {
    const s = score(state([habit()], logOf([day(0), day(2)])), day(2));
    expect(s.awards[day(2)].h.xp).toBe(Math.round(10 * 1.5 * 1.5)); // 1 of 2 days done -> x1.5
  });
});

describe('N times per week', () => {
  const h = habit({ kind: 'weekly', times: 3 });
  it('counts streaks in weeks that hit the quota', () => {
    const s = score(state([h], logOf([day(0), day(1), day(2), day(7), day(9), day(11), day(14)])), day(15));
    expect(s.habits.h.unit).toBe('week');
    expect(s.habits.h.streak).toBe(2);
    expect(s.habits.h.weekCount).toBe(1);
  });
  it('resets after a short week and gives a comeback', () => {
    const s = score(state([h], logOf([day(0), day(1), day(2), day(7), day(14)])), day(14));
    expect(s.habits.h.streak).toBe(0);
    expect(s.awards[day(14)].h.comeback).toBe(true);
  });
  it('never holds a partial creation week against you', () => {
    const late = habit({ kind: 'weekly', times: 3 }, day(5)); // created Saturday
    const s = score(state([late], logOf([day(5), day(7), day(8), day(9)])), day(9));
    expect(s.habits.h.streak).toBe(1);
    expect(s.awards[day(7)].h.comeback).toBe(false);
  });
});

describe('perfect days', () => {
  it('needs every due habit, tiny counts, weekly habits are ignored', () => {
    const a = habit(undefined, MON, 'a');
    const b = habit(undefined, MON, 'b');
    const w = habit({ kind: 'weekly', times: 2 }, MON, 'w');
    const log: Log = {
      [day(0)]: { a: 'full', b: 'tiny' },
      [day(1)]: { a: 'full' },
      [day(2)]: { a: 'full', b: 'full' },
      [day(3)]: { a: 'full', b: 'full' },
    };
    const s = score(state([a, b, w], log), day(4));
    expect(s.perfect).toBe(2);
    expect(s.bestPerfect).toBe(2);
  });
});

describe('archived habits', () => {
  it('stop being due but keep their history XP', () => {
    const h = { ...habit(), archived: day(2) };
    const s = score(state([h], logOf([day(0), day(1)])), day(5));
    expect(s.habits.h.comebackReady).toBe(false);
    expect(s.xp).toBeGreaterThan(0);
  });
});
