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
  it('rejects unknown marks, bad dates and other files', () => {
    expect(() => parseState(JSON.stringify({ ...good, log: { '2026-11-01': { 'abc-1': 'cheat' } } }))).toThrow();
    expect(() => parseState(JSON.stringify({ ...good, log: { yesterday: {} } }))).toThrow();
    expect(() => parseState('{"hello":"world"}')).toThrow();
    expect(() => parseState('not json')).toThrow();
  });
});
