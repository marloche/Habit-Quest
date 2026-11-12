import { describe, expect, it } from 'vitest';
import { addDays } from './day';
import { heroOf } from './hero';
import { emptyWardrobe } from './items';
import { byMonth, clockOf, dropEntry, editEntry, ENTRIES_MAX, ENTRY_MAX, JOURNAL_GOLD, journalGold, moodLink, moodName, pageId, pages, sealEntry, stamp } from './journal';
import { score } from './score';
import type { Entry, Habit, Journal, State } from './types';

const MON = '2026-11-02';
const day = (n: number) => addDays(MON, n);
const daily: Habit = { id: 'h', name: 'h', icon: 'star', schedule: { kind: 'daily' }, created: MON };

describe('journal', () => {
  it('pays gold per day with an entry, not for future days, and adds it to the balance', () => {
    const j: Journal = { [day(0)]: { mood: 3 }, [day(1)]: { mood: 5, text: 'yay' }, [day(9)]: { mood: 1 } };
    expect(journalGold(j, day(1))).toBe(2 * JOURNAL_GOLD);
    const s: State = { v: 6, settings: { rolloverHour: 4, muted: false }, habits: [], log: {}, wardrobe: emptyWardrobe(), journal: j, focus: {}, epics: [] };
    expect(heroOf(s, score(s, day(1)), day(1)).balance).toBe(2 * JOURNAL_GOLD);
  });
  it('averages mood on all-done days vs the rest, skipping rest days and the future', () => {
    const log = { [day(0)]: { h: 'full' as const }, [day(1)]: { h: 'full' as const } };
    const j: Journal = { [day(0)]: { mood: 5 }, [day(1)]: { mood: 4 }, [day(2)]: { mood: 2 }, [addDays(MON, -3)]: { mood: 1 }, [day(5)]: { mood: 1 } };
    const link = moodLink([daily], log, j, day(2)); // day -3 is before the quest existed: a rest day
    expect(link.all).toEqual({ avg: 4.5, days: 2 });
    expect(link.other).toEqual({ avg: 2, days: 1 });
    expect(moodName(link.all!.avg)).toBe('GREAT');
    expect(moodLink([daily], {}, {}, day(2))).toEqual({ all: undefined, other: undefined });
  });
});

describe('the Keep', () => {
  const e = (id: string, at: string, text = id): Entry => ({ id, at, text });
  it('stamps local time to the minute and reads it back as a clock', () => {
    expect(stamp(new Date(2026, 10, 2, 21, 5, 59))).toBe('2026-11-02T21:05');
    expect(clockOf('2026-11-02T21:05')).toBe('9:05 PM');
    expect(clockOf('2026-11-02T00:30')).toBe('12:30 AM');
    expect(clockOf('2026-11-02T12:00')).toBe('12:00 PM');
  });
  it('needs a mood for the first entry, then takes more', () => {
    expect(sealEntry(undefined, e('a', '2026-11-02T08:00'))).toEqual({ error: 'mood' });
    expect(sealEntry(undefined, e('a', '2026-11-02T08:00', '   '), 3)).toEqual({ error: 'empty' });
    const first = sealEntry(undefined, e('a', '2026-11-02T08:00', '  Dawn.  '), 3);
    expect(first).toEqual({ day: { mood: 3, entries: [e('a', '2026-11-02T08:00', 'Dawn.')] } });
    const second = sealEntry({ mood: 3, text: 'calm' }, e('b', '2026-11-02T22:00'));
    expect(second).toEqual({ day: { mood: 3, text: 'calm', entries: [e('b', '2026-11-02T22:00')] } });
    const full = { mood: 3 as const, entries: Array.from({ length: ENTRIES_MAX }, (_, i) => e(`x${i}`, '2026-11-02T08:00')) };
    expect(sealEntry(full, e('z', '2026-11-02T09:00'))).toEqual({ error: 'full' });
    expect(sealEntry(undefined, e('a', '2026-11-02T08:00', 'x'.repeat(ENTRY_MAX + 5)), 3)).toMatchObject({ day: { entries: [{ text: 'x'.repeat(ENTRY_MAX) }] } });
  });
  it('edits keep the time; deletes keep the mood and word', () => {
    const d = { mood: 4 as const, text: 'w', entries: [e('a', '2026-11-02T08:00'), e('b', '2026-11-02T09:00')] };
    expect(editEntry(d, 'a', ' new ').entries![0]).toEqual(e('a', '2026-11-02T08:00', 'new'));
    expect(editEntry(d, 'a', '  ')).toBe(d);
    expect(dropEntry(d, 'a').entries).toEqual([e('b', '2026-11-02T09:00')]);
    expect(dropEntry(dropEntry(d, 'a'), 'b')).toEqual({ mood: 4, text: 'w' });
  });
  it('lists pages newest first, by month, skipping mood-only days and the future', () => {
    const j: Journal = {
      '2026-10-30': { mood: 2, text: 'rain' },
      '2026-10-31': { mood: 3 },
      '2026-11-01': { mood: 5, entries: [e('a', '2026-11-01T08:00'), e('b', '2026-11-01T23:10')] },
      '2026-11-09': { mood: 4, entries: [e('f', '2026-11-09T08:00')] },
    };
    const ps = pages(j, '2026-11-02');
    expect(ps.map(pageId)).toEqual(['b', 'a', 'day:2026-10-30']);
    expect(ps[2]).toEqual({ day: '2026-10-30', mood: 2, word: 'rain' });
    expect(byMonth(ps).map(([m, p]) => [m, p.length])).toEqual([['2026-11', 2], ['2026-10', 1]]);
    const same: Journal = { '2026-11-01': { mood: 3, entries: [e('x', '2026-11-01T08:00'), e('y', '2026-11-01T08:00'), e('z', '2026-11-01T08:00')] } };
    expect(pages(same, '2026-11-02').map(pageId)).toEqual(['z', 'y', 'x']);
  });
});
