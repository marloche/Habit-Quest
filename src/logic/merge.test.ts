import { describe, expect, it } from 'vitest';
import { canon, merge, sharedOf, withShared, type Shared } from './merge';
import { fresh } from '../store';
import type { Habit } from './types';

const h = (id: string, name = id): Habit => ({ id, name, icon: 'star', schedule: { kind: 'daily' }, created: '2026-11-01' });
const base: Shared = {
  ...sharedOf(fresh()),
  habits: [h('a'), h('b')],
  log: { '2026-11-01': { a: 'full' } },
  journal: { '2026-11-01': { mood: 3 } },
  focus: { '2026-11-01': 10 },
};
const edit = (f: (s: Shared) => void) => {
  const s = structuredClone(base);
  f(s);
  return s;
};

describe('sync merge', () => {
  it('keeps checks made on both devices', () => {
    const pc = edit((s) => (s.log['2026-11-02'] = { a: 'full' }));
    const phone = edit((s) => (s.log['2026-11-02'] = { b: 'tiny' }));
    expect(merge(base, pc, phone, true).log['2026-11-02']).toEqual({ a: 'full', b: 'tiny' });
  });
  it('carries an undo over: the side that changed wins, deletes included', () => {
    const phone = edit((s) => delete s.log['2026-11-01']);
    expect(merge(base, base, phone, true).log).toEqual({});
    expect(merge(base, phone, base, false).log).toEqual({});
  });
  it('lets the later save win when both changed the same thing', () => {
    const pc = edit((s) => (s.journal['2026-11-01'] = { mood: 5 }));
    const phone = edit((s) => (s.journal['2026-11-01'] = { mood: 1, text: 'meh' }));
    expect(merge(base, pc, phone, true).journal['2026-11-01'].mood).toBe(5);
    expect(merge(base, pc, phone, false).journal['2026-11-01'].mood).toBe(1);
  });
  it('adds up focus minutes from both devices', () => {
    const pc = edit((s) => (s.focus['2026-11-01'] = 30));
    const phone = edit((s) => (s.focus['2026-11-01'] = 35));
    expect(merge(base, pc, phone, true).focus['2026-11-01']).toBe(55);
  });
  it('joins two devices on the first sync without doubling shared history', () => {
    const pc = edit((s) => (s.log['2026-11-02'] = { a: 'full' }));
    const phone = edit((s) => (s.log['2026-11-03'] = { b: 'full' }));
    const m = merge(undefined, pc, phone, true);
    expect(Object.keys(m.log).sort()).toEqual(['2026-11-01', '2026-11-02', '2026-11-03']);
    expect(m.focus['2026-11-01']).toBe(10);
    expect(m.habits.map((x) => x.id)).toEqual(['a', 'b']);
  });
  it('merges quests by id and keeps the reorder from the side that made it', () => {
    const pc = edit((s) => s.habits.reverse());
    const phone = edit((s) => {
      s.habits.push(h('c'));
      s.habits[0].name = 'Renamed';
    });
    const m = merge(base, pc, phone, true);
    expect(m.habits.map((x) => x.id)).toEqual(['b', 'a', 'c']);
    expect(m.habits.find((x) => x.id === 'a')!.name).toBe('Renamed');
  });
  it('wipes everywhere after NEW GAME on one device', () => {
    const pc = sharedOf(fresh());
    const m = merge(base, pc, base, true);
    expect(m.habits).toEqual([]);
    expect(m.log).toEqual({});
  });
  it('shares the new-day hour and progress, but not sound or display settings', () => {
    const mine = { ...fresh({ rolloverHour: 4, muted: true, musicPct: 20, bg: 'storm' }), lastOpened: '2026-11-02' };
    const theirs = { ...base, rolloverHour: 6 };
    const next = withShared(mine, theirs);
    expect(next.settings).toEqual({ rolloverHour: 6, muted: true, musicPct: 20, bg: 'storm' });
    expect(next.habits.length).toBe(2);
    expect(next.lastOpened).toBe('2026-11-02');
    expect(canon(sharedOf(next))).toBe(canon(theirs));
  });
  it('compares values whatever order their fields were written in', () => {
    expect(canon({ a: 1, b: { c: 2, d: 3 } })).toBe(canon({ b: { d: 3, c: 2 }, a: 1 }));
  });
});
