import { describe, expect, it } from 'vitest';
import { parseState } from './store';

const good = {
  v: 1,
  settings: { rolloverHour: 4, muted: false },
  habits: [{ id: 'abc-1', name: 'Read', icon: 'book', schedule: { kind: 'daily' }, created: '2026-11-01' }],
  log: { '2026-11-01': { 'abc-1': 'full' } },
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
    ];
    const s = { ...good, habits, lastOpened: '2026-11-02', settings: { ...good.settings, lastBackup: '2026-11-01' } };
    expect(() => parseState(JSON.stringify(s))).not.toThrow();
  });
  it('rejects unknown marks, bad dates and other files', () => {
    expect(() => parseState(JSON.stringify({ ...good, log: { '2026-11-01': { 'abc-1': 'cheat' } } }))).toThrow();
    expect(() => parseState(JSON.stringify({ ...good, log: { yesterday: {} } }))).toThrow();
    expect(() => parseState('{"hello":"world"}')).toThrow();
    expect(() => parseState('not json')).toThrow();
  });
});
