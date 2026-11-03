import { describe, expect, it } from 'vitest';
import { addDays } from './day';
import { atRisk, COMEBACK, daySummary, levelOf, momentumAt, score, XP, xpForLevel } from './score';
import { emptyWardrobe } from './items';
import type { Habit, Log, Mark, Schedule, State } from './types';

const MON = '2026-11-02';
const habit = (schedule: Schedule = { kind: 'daily' }, created = MON, id = 'h'): Habit => ({ id, name: id, icon: 'star', schedule, created });
const logOf = (days: string[], id = 'h', mark: Mark = 'full'): Log => Object.fromEntries(days.map((d) => [d, { [id]: mark }]));
const state = (habits: Habit[], log: Log): State => ({ v: 5, settings: { rolloverHour: 4, muted: false }, habits, log, wardrobe: emptyWardrobe(), journal: {}, focus: {} });
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

describe('momentum inside score()', () => {
  it('matches momentumAt for every award on random long histories', () => {
    let seed = 42;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    const schedules: Schedule[] = [{ kind: 'daily' }, { kind: 'days', days: [1, 3, 5] }, { kind: 'weekly', times: 3 }, { kind: 'weekly', times: 5 }];
    for (let run = 0; run < 5; run++) {
      const habits = schedules.map((s, i) => ({ ...habit(s, day(Math.floor(rand() * 40)), `h${i}`), ...(rand() < 0.3 ? { archived: day(150 + i) } : {}) }));
      const log: Log = {};
      for (let i = 0; i < 200; i++) {
        for (const h of habits) if (rand() < 0.7) (log[day(i)] ??= {})[h.id] = rand() < 0.2 ? 'tiny' : 'full';
      }
      const today = day(199);
      const s = score(state(habits, log), today);
      for (const [d, awards] of Object.entries(s.awards)) {
        for (const [id, a] of Object.entries(awards)) {
          const want = Math.round(XP[log[d][id]] * momentumAt(habits, log, d) * (a.comeback ? COMEBACK : 1)) + a.milestone;
          expect(a.xp, `${d} ${id}`).toBe(want);
        }
      }
      expect(s.momentum).toBe(momentumAt(habits, log, today));
    }
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

describe('atRisk', () => {
  it('lists due, unfinished quests with a 3+ streak', () => {
    const a = habit(undefined, MON, 'a'); // 3-day streak, not done today -> at risk
    const b = habit(undefined, MON, 'b'); // 2-day streak -> not yet
    const c = habit(undefined, MON, 'c'); // done today -> safe
    const log: Log = {
      [day(0)]: { a: 'full', c: 'full' },
      [day(1)]: { a: 'full', b: 'full', c: 'full' },
      [day(2)]: { a: 'full', b: 'full', c: 'full' },
      [day(3)]: { c: 'full' },
    };
    const st = state([a, b, c], log);
    expect(atRisk(st, score(st, day(3)), day(3)).map((h) => h.id)).toEqual(['a']);
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
  it("keep the XP of a check made on the archive day", () => {
    const h = { ...habit(), archived: day(1) };
    const s = score(state([h], logOf([day(0), day(1)])), day(1));
    expect(s.awards[day(1)].h.xp).toBeGreaterThan(0);
    expect(s.xp).toBe(s.awards[day(0)].h.xp + s.awards[day(1)].h.xp);
  });
  it('keep the XP of a quest archived the day it was made', () => {
    const h = { ...habit(), archived: day(0) };
    expect(score(state([h], logOf([day(0)])), day(0)).xp).toBe(10);
  });
});

describe('planned quests', () => {
  const plan = (d: string, id = 'p') => habit({ kind: 'once', day: d }, MON, id);
  it('pay out on their day only, with no streak', () => {
    const s = score(state([plan(day(2))], { [day(2)]: { p: 'full' }, [day(3)]: { p: 'full' } }), day(3));
    expect(s.awards[day(2)].p.xp).toBe(XP.full);
    expect(s.awards[day(3)]).toBeUndefined();
    expect(s.habits.p.streak).toBe(0);
  });
  it('never lower momentum or break a perfect day when missed', () => {
    const daily = habit();
    const done = logOf([day(0), day(1), day(2)]);
    const without = score(state([daily], done), day(3));
    const withMiss = score(state([daily, plan(day(1))], done), day(3));
    expect(withMiss.momentum).toBe(without.momentum);
    expect(withMiss.perfect).toBe(without.perfect);
    expect(withMiss.habits.p.comebackReady).toBe(false);
  });
});

describe('daySummary', () => {
  it('counts due quests, that day\'s plans and weekly checks', () => {
    const habits = [habit(), habit({ kind: 'weekly', times: 2 }, MON, 'w'), habit({ kind: 'once', day: day(1) }, MON, 'p')];
    expect(daySummary(habits, {}, day(0))).toEqual({ total: 1, done: 0, status: 'none' });
    expect(daySummary(habits, { [day(1)]: { h: 'full' } }, day(1))).toEqual({ total: 2, done: 1, status: 'some' });
    expect(daySummary(habits, { [day(2)]: { h: 'tiny', w: 'full' } }, day(2))).toEqual({ total: 2, done: 2, status: 'all' });
    expect(daySummary(habits, {}, addDays(MON, -1)).status).toBe('rest');
  });
});
