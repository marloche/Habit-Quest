import { describe, expect, it } from 'vitest';
import { backupAge, parseState } from './store';
import { emptyWardrobe } from './logic/items';
import type { State } from './logic/types';

describe('backupAge', () => {
  const s = (log: object, lastBackup?: string) => ({ v: 5, settings: { rolloverHour: 4, muted: false, lastBackup }, habits: [], log, wardrobe: emptyWardrobe(), journal: {}, focus: {} }) as State;
  it('is undefined while there is nothing to back up', () => {
    expect(backupAge(s({}), '2026-11-03')).toBeUndefined();
  });
  it('is Infinity when never backed up, else days since', () => {
    expect(backupAge(s({ '2026-11-01': {} }), '2026-11-03')).toBe(Infinity);
    expect(backupAge(s({ '2026-11-01': {} }, '2026-10-25'), '2026-11-03')).toBe(9);
  });
});

const good = {
  v: 5,
  settings: { rolloverHour: 4, muted: false, wakeLock: true },
  habits: [{ id: 'abc-1', name: 'Read', icon: 'book', schedule: { kind: 'daily' }, created: '2026-11-01', focus: 20 }],
  log: { '2026-11-01': { 'abc-1': 'full' } },
  wardrobe: {
    owned: { 'leaf-crown': { day: '2026-11-01', paid: 60 }, halo: { day: '2026-11-02', paid: 0 } },
    worn: { hat: 'leaf-crown' },
    opened: { 'b-2026-10-26': { day: '2026-11-02', item: 'halo' }, 'm-2026-11-01-abc-1': { day: '2026-11-02', gold: 80 } },
  },
  journal: { '2026-11-01': { mood: 4, text: 'Good run' }, '2026-11-02': { mood: 2 } },
  focus: { '2026-11-01': 20 },
};

describe('parseState', () => {
  it('round-trips a valid save exactly', () => {
    const text = JSON.stringify(good);
    expect(JSON.stringify(parseState(text))).toBe(text);
  });
  it('rejects ids that could break out of HTML attributes', () => {
    const evil = { ...good, habits: [{ ...good.habits[0], id: 'x"><img src=x onerror=alert(1)>' }] };
    expect(() => parseState(JSON.stringify(evil))).toThrow();
  });
  it('rejects schedules and settings the renderer would crash on', () => {
    const habit = (schedule: object) => ({ ...good, habits: [{ ...good.habits[0], schedule }] });
    expect(() => parseState(JSON.stringify(habit({ kind: 'days' })))).toThrow();
    expect(() => parseState(JSON.stringify(habit({ kind: 'days', days: [] })))).toThrow();
    expect(() => parseState(JSON.stringify(habit({ kind: 'days', days: [1, 9] })))).toThrow();
    expect(() => parseState(JSON.stringify(habit({ kind: 'weekly', times: 0 })))).toThrow();
    expect(() => parseState(JSON.stringify(habit({ kind: 'weekly', times: '3' })))).toThrow();
    expect(() => parseState(JSON.stringify({ ...good, settings: { rolloverHour: 4 } }))).toThrow();
    expect(() => parseState(JSON.stringify({ ...good, habits: [{ ...good.habits[0], archived: 'soon' }] }))).toThrow();
    expect(() => parseState(JSON.stringify({ ...good, habits: [{ ...good.habits[0], icon: 3 }] }))).toThrow();
    expect(() => parseState(JSON.stringify({ ...good, log: { '2026-11-01': null } }))).toThrow();
  });
  it('accepts every schedule kind and optional fields', () => {
    const habits = [
      { ...good.habits[0], id: 'a', schedule: { kind: 'days', days: [0, 6] }, tiny: '1 page', archived: '2026-11-02' },
      { ...good.habits[0], id: 'b', schedule: { kind: 'weekly', times: 3 } },
      { ...good.habits[0], id: 'c', schedule: { kind: 'once', day: '2026-11-06' } },
    ];
    const s = { ...good, habits, lastOpened: '2026-11-02', settings: { ...good.settings, lastBackup: '2026-11-01' } };
    expect(() => parseState(JSON.stringify(s))).not.toThrow();
    expect(() => parseState(JSON.stringify({ ...good, habits: [{ ...good.habits[0], schedule: { kind: 'once', day: 'friday' } }] }))).toThrow();
  });
  it('migrates v1-v4 saves to v5 with an empty wardrobe, journal and focus, touching nothing else', () => {
    const { wardrobe, journal, focus: _, ...old } = good;
    const want = { ...old, v: 5, wardrobe: emptyWardrobe(), journal: {}, focus: {} };
    expect(parseState(JSON.stringify({ ...old, v: 1 }))).toEqual(want);
    expect(parseState(JSON.stringify({ ...old, v: 2 }))).toEqual(want);
    expect(parseState(JSON.stringify({ ...old, v: 3, wardrobe }))).toEqual({ ...want, wardrobe });
    expect(parseState(JSON.stringify({ ...old, v: 4, wardrobe, journal }))).toEqual({ ...want, wardrobe, journal });
    expect(() => parseState(JSON.stringify({ ...good, v: 6 }))).toThrow();
  });
  it('rejects broken focus minutes, quest timers and wake settings', () => {
    expect(() => parseState(JSON.stringify({ ...good, focus: undefined }))).toThrow();
    expect(() => parseState(JSON.stringify({ ...good, focus: { '2026-11-01': -1 } }))).toThrow();
    expect(() => parseState(JSON.stringify({ ...good, focus: { '2026-11-01': 2000 } }))).toThrow();
    expect(() => parseState(JSON.stringify({ ...good, habits: [{ ...good.habits[0], focus: 0 }] }))).toThrow();
    expect(() => parseState(JSON.stringify({ ...good, habits: [{ ...good.habits[0], focus: 181 }] }))).toThrow();
    expect(() => parseState(JSON.stringify({ ...good, settings: { ...good.settings, wakeLock: 'yes' } }))).toThrow();
  });
  it('rejects a broken journal', () => {
    const j = (journal: unknown) => JSON.stringify({ ...good, journal });
    expect(() => parseState(j(undefined))).toThrow();
    expect(() => parseState(j({ '2026-11-01': { mood: 6 } }))).toThrow();
    expect(() => parseState(j({ '2026-11-01': { text: 'no mood' } }))).toThrow();
    expect(() => parseState(j({ today: { mood: 3 } }))).toThrow();
    expect(() => parseState(j({ '2026-11-01': { mood: 3, text: 'x'.repeat(141) } }))).toThrow();
  });
  it('rejects a broken wardrobe', () => {
    const w = (wardrobe: object) => JSON.stringify({ ...good, wardrobe: { ...good.wardrobe, ...wardrobe } });
    expect(() => parseState(JSON.stringify({ ...good, wardrobe: undefined }))).toThrow();
    expect(() => parseState(w({ owned: { cat: { day: '2026-11-01', paid: -5 } } }))).toThrow();
    expect(() => parseState(w({ worn: { shoes: 'cat' } }))).toThrow();
    expect(() => parseState(w({ worn: { hat: '"><b>' } }))).toThrow();
    expect(() => parseState(w({ opened: { x: { day: 'today' } } }))).toThrow();
  });
  it('rejects unknown marks, bad dates and other files', () => {
    expect(() => parseState(JSON.stringify({ ...good, log: { '2026-11-01': { 'abc-1': 'cheat' } } }))).toThrow();
    expect(() => parseState(JSON.stringify({ ...good, log: { yesterday: {} } }))).toThrow();
    expect(() => parseState('{"hello":"world"}')).toThrow();
    expect(() => parseState('not json')).toThrow();
  });
});
