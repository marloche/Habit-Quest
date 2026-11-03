import { describe, expect, it } from 'vitest';
import { addDays, dayKey, dayLabel, lateCutoffLabel, lateWindowOpen, rolloverMovesBack, weekStart, weekday } from './day';

describe('late window for yesterday', () => {
  it('is open from the rollover until 8 hours later', () => {
    expect(lateWindowOpen(new Date(2026, 10, 3, 4, 0), 4)).toBe(true);
    expect(lateWindowOpen(new Date(2026, 10, 3, 11, 59), 4)).toBe(true);
    expect(lateWindowOpen(new Date(2026, 10, 3, 12, 0), 4)).toBe(false);
    expect(lateWindowOpen(new Date(2026, 10, 3, 23, 0), 4)).toBe(false);
  });
  it('closes again after midnight while the old day is still running', () => {
    expect(lateWindowOpen(new Date(2026, 10, 4, 1, 0), 4)).toBe(false); // still Nov 3, opened 21h ago
  });
  it('labels the cut-off', () => {
    expect(lateCutoffLabel(4)).toBe('12:00 PM');
    expect(lateCutoffLabel(0)).toBe('8:00 AM');
    expect(lateCutoffLabel(6)).toBe('2:00 PM');
  });
});

describe('dayLabel', () => {
  it('formats a day key for the header', () => {
    expect(dayLabel('2026-11-03')).toBe('TUE NOV 3');
    expect(dayLabel('2027-01-01')).toBe('FRI JAN 1');
  });
});

describe('rolloverMovesBack', () => {
  it('blocks a change that would reopen yesterday', () => {
    expect(rolloverMovesBack(new Date(2026, 10, 3, 5, 0), 4, 6)).toBe(true);
  });
  it('allows changes that keep or advance the day', () => {
    expect(rolloverMovesBack(new Date(2026, 10, 3, 7, 0), 4, 6)).toBe(false);
    expect(rolloverMovesBack(new Date(2026, 10, 3, 5, 0), 6, 4)).toBe(false);
    expect(rolloverMovesBack(new Date(2026, 10, 3, 2, 0), 4, 6)).toBe(false); // already yesterday under both
  });
});

describe('dayKey rollover', () => {
  it('counts 1 AM as the previous day with a 4 AM rollover', () => {
    expect(dayKey(new Date(2026, 10, 3, 1, 0), 4)).toBe('2026-11-02');
    expect(dayKey(new Date(2026, 10, 3, 3, 59), 4)).toBe('2026-11-02');
    expect(dayKey(new Date(2026, 10, 3, 4, 0), 4)).toBe('2026-11-03');
  });
  it('crosses month and year boundaries', () => {
    expect(dayKey(new Date(2027, 0, 1, 2, 0), 4)).toBe('2026-12-31');
    expect(dayKey(new Date(2026, 2, 1, 0, 30), 4)).toBe('2026-02-28');
  });
  it('rollover 0 means midnight', () => {
    expect(dayKey(new Date(2026, 10, 3, 0, 0), 0)).toBe('2026-11-03');
  });
});

describe('day math', () => {
  it('adds days across DST and months', () => {
    expect(addDays('2026-03-07', 2)).toBe('2026-03-09');
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
  });
  it('finds weekdays and Monday week starts', () => {
    expect(weekday('2026-11-03')).toBe(2); // Tuesday
    expect(weekStart('2026-11-03')).toBe('2026-11-02');
    expect(weekStart('2026-11-08')).toBe('2026-11-02'); // Sunday closes the Monday week
  });
});
