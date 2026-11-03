import { describe, expect, it } from 'vitest';
import { addDays } from './day';
import { heroOf } from './hero';
import { emptyWardrobe } from './items';
import { JOURNAL_GOLD, journalGold, moodLink, moodName } from './journal';
import { score } from './score';
import type { Habit, Journal, State } from './types';

const MON = '2026-11-02';
const day = (n: number) => addDays(MON, n);
const daily: Habit = { id: 'h', name: 'h', icon: 'star', schedule: { kind: 'daily' }, created: MON };

describe('journal', () => {
  it('pays gold per day with an entry, not for future days, and adds it to the balance', () => {
    const j: Journal = { [day(0)]: { mood: 3 }, [day(1)]: { mood: 5, text: 'yay' }, [day(9)]: { mood: 1 } };
    expect(journalGold(j, day(1))).toBe(2 * JOURNAL_GOLD);
    const s: State = { v: 4, settings: { rolloverHour: 4, muted: false }, habits: [], log: {}, wardrobe: emptyWardrobe(), journal: j };
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
