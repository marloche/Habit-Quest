import { describe, expect, it } from 'vitest';
import { clock, focusedMinutes, focusStats, isOver, MINUTE, minutesText, parseTimer, timeLeft, type Timer } from './focus';

const t: Timer = { habit: 'h', day: '2026-11-03', start: 1_000_000, end: 1_000_000 + 20 * MINUTE };

describe('focus timer', () => {
  it('counts down from its end time and reports whole minutes focused', () => {
    expect(timeLeft(t, t.start + 90_500)).toBe(20 * MINUTE - 90_500);
    expect(clock(timeLeft(t, t.start + 90_500))).toBe('18:30');
    expect(clock(timeLeft(t, t.start))).toBe('20:00');
    expect(focusedMinutes(t, t.start + 7.9 * MINUTE)).toBe(7);
    expect(isOver(t, t.end - 1)).toBe(false);
    expect(isOver(t, t.end)).toBe(true);
    expect(focusedMinutes(t, t.end + 60 * MINUTE)).toBe(20); // reopened long after: capped at the timer length
    expect(timeLeft(t, t.end + 5)).toBe(0);
  });
  it('reads back only a sane stored timer', () => {
    expect(parseTimer(JSON.stringify(t))).toEqual(t);
    expect(parseTimer(null)).toBeUndefined();
    expect(parseTimer('nope')).toBeUndefined();
    expect(parseTimer(JSON.stringify({ ...t, end: t.start }))).toBeUndefined();
    expect(parseTimer(JSON.stringify({ ...t, end: t.start + 181 * MINUTE }))).toBeUndefined();
    expect(parseTimer(JSON.stringify({ ...t, day: 'today' }))).toBeUndefined();
  });
  it('sums minutes for today, this week (from Monday) and all time', () => {
    const f = { '2026-10-30': 30, '2026-11-02': 20, '2026-11-03': 25 };
    expect(focusStats(f, '2026-11-03')).toEqual({ today: 25, week: 45, total: 75 });
    expect(minutesText(45)).toBe('45m');
    expect(minutesText(125)).toBe('2h05');
  });
});
