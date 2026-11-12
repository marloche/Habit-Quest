import { describe, expect, it } from 'vitest';
import { chapterAt, defaultGuardian, dueNote, epicGold, epicProgress, epicsFinished, epicsOfHabit, mainEpic, toReach, CHAPTER_GOLD, FINISH_GOLD, QUICK_GOLD } from './epic';
import { addDays } from './day';
import type { Epic, Log } from './types';

const D = '2026-11-01';
const day = (n: number) => addDays(D, n);
const base: Epic = { id: 'e', name: 'Run', icon: 'heart', color: 0, created: D, guardian: 0, by: 'links', target: 4, links: ['run'], chapters: [], status: 'active' };
const ep = (patch: Partial<Epic>): Epic => ({ ...base, ...patch });

describe('linked progress', () => {
  it('counts checks of linked quests from the epic start only, tiny as 1', () => {
    const log: Log = { [day(-1)]: { run: 'full' }, [day(0)]: { run: 'tiny', read: 'full' }, [day(2)]: { run: 'full' } };
    const p = epicProgress(ep({}), log);
    expect(p.value).toBe(2);
    expect(p.pct).toBe(0.5);
    expect(p.finished).toBeUndefined();
  });
  it('counts every linked quest on a day, and finishes on the day the target is hit', () => {
    const log: Log = { [day(0)]: { run: 'full', walk: 'full' }, [day(20)]: { run: 'full', walk: 'tiny' } };
    const p = epicProgress(ep({ links: ['run', 'walk'] }), log);
    expect(p.value).toBe(4);
    expect(p.finished).toBe(day(20));
  });
  it('loses the finish when a check is unticked', () => {
    const log: Log = { [day(0)]: { run: 'full' }, [day(1)]: { run: 'full' }, [day(2)]: { run: 'full' }, [day(3)]: {} };
    expect(epicProgress(ep({ target: 3 }), log).finished).toBe(day(2));
    delete log[day(2)].run;
    expect(epicProgress(ep({ target: 3 }), log).finished).toBeUndefined();
  });
});

describe('chapters', () => {
  it('space chapters evenly when no amount is set, and record the day each was reached', () => {
    const e = ep({ target: 10, chapters: [{ name: 'a' }, { name: 'b', at: 3 }, { name: 'c' }] });
    expect([0, 1, 2].map((i) => chapterAt(e, i))).toEqual([3, 3, 10]);
    const log: Log = {};
    for (let i = 0; i < 4; i++) log[day(i)] = { run: 'full' };
    const p = epicProgress(e, log);
    expect(p.reached).toEqual([day(2), day(2), undefined]);
  });
  it('in chapters mode, progress is chapters ticked, in any order', () => {
    const e = ep({ by: 'chapters', target: undefined, chapters: [{ name: 'Kitchen' }, { name: 'Closet', done: day(3) }, { name: 'Garage' }] });
    const p = epicProgress(e, {});
    expect([p.value, p.goal, p.reached[1], p.finished]).toEqual([1, 3, day(3), undefined]);
    const all = epicProgress({ ...e, chapters: e.chapters.map((c, i) => ({ ...c, done: day(30 - i) })) }, {});
    expect(all.finished).toBe(day(30));
  });
});

describe('count mode', () => {
  it('sums logged amounts, decimals too', () => {
    const e = ep({ by: 'count', target: 10, unit: 'km', logs: { [day(0)]: 2.5, [day(5)]: 3.2, [day(-3)]: 99 } });
    expect(epicProgress(e, {}).value).toBe(5.7);
  });
  it('a chapter ticked by hand needs just what is missing to reach it', () => {
    const chapters = Array.from({ length: 12 }, (_, i) => ({ name: `Videos ${i * 10 + 1}-${i * 10 + 10}` }));
    const e = ep({ by: 'count', target: 120, unit: 'videos', chapters, logs: { [day(0)]: 23 } });
    expect(chapterAt(e, 2)).toBe(30); // evenly spaced: every 10
    expect(toReach(e, {}, 2)).toBe(7);
    expect(toReach(e, {}, 11)).toBe(97);
    expect(toReach(e, {}, 1)).toBe(0); // already reached
    expect(toReach(ep({ ...e, logs: { [day(0)]: 23.4 } }), {}, 2)).toBe(6.6);
    // logging it reaches the chapter, and only that far
    const after = epicProgress(ep({ ...e, logs: { [day(0)]: 30 } }), {});
    expect(after.reached.filter(Boolean)).toHaveLength(3);
    expect(toReach(ep({ by: 'chapters', chapters }), {}, 0)).toBe(0); // only amount epics
    expect(toReach(e, {}, 12)).toBe(0); // no such chapter
  });
});

describe('gold', () => {
  const log: Log = { [day(0)]: { run: 'full' }, [day(20)]: { run: 'full' } };
  it('pays per chapter reached and on finish', () => {
    const e = ep({ target: 2, chapters: [{ name: 'a', at: 1 }, { name: 'b', at: 2 }] });
    expect(epicProgress(e, log).gold).toBe(2 * CHAPTER_GOLD + FINISH_GOLD);
  });
  it('pays less for a finish in under two weeks', () => {
    const quick = { [day(0)]: { run: 'full' }, [day(13)]: { run: 'full' } } as Log;
    expect(epicProgress(ep({ target: 2 }), quick).gold).toBe(QUICK_GOLD);
    expect(epicProgress(ep({ target: 2 }), { ...quick, [day(13)]: {}, [day(14)]: { run: 'full' } }).gold).toBe(FINISH_GOLD);
  });
  it('a retired epic keeps the chapters it reached, and nothing after it ended counts', () => {
    const e = ep({ target: 3, status: 'retired', ended: day(10), chapters: [{ name: 'a', at: 1 }, { name: 'b', at: 2 }] });
    const p = epicProgress(e, log);
    expect([p.value, p.gold, p.finished]).toEqual([1, CHAPTER_GOLD, undefined]);
  });
  it('adds up across epics, and counts the finished ones', () => {
    const es = [ep({ target: 2 }), ep({ id: 'x', target: 9 })];
    expect(epicGold(es, log)).toBe(FINISH_GOLD);
    expect(epicsFinished(es, log)).toBe(1);
  });
});

describe('main quest and tags', () => {
  const log: Log = { [day(0)]: { run: 'full' } };
  it('is the chosen main, else the first active, skipping the INN, retired and finished', () => {
    const done = ep({ id: 'done', target: 1 });
    const inn = ep({ id: 'inn', status: 'inn' });
    const a = ep({ id: 'a' });
    const b = ep({ id: 'b', main: true });
    expect(mainEpic([done, inn, a, b], log)?.id).toBe('b');
    expect(mainEpic([done, inn, a], log)?.id).toBe('a');
    expect(mainEpic([done, inn], log)).toBeUndefined();
  });
  it('tags a quest with the open epics it feeds, INN included', () => {
    const es = [ep({ id: 'a', status: 'inn' }), ep({ id: 'b', links: ['read'] }), ep({ id: 'c', status: 'retired' })];
    expect(epicsOfHabit(es, log, 'run').map((e) => e.id)).toEqual(['a']);
  });
});

describe('guardian and target date', () => {
  it('picks a bigger guardian for a longer road', () => {
    expect(defaultGuardian({ by: 'links', created: D, target: 20, chapters: [] })).toBe(0);
    expect(defaultGuardian({ by: 'links', created: D, target: 100, chapters: [] })).toBe(3);
    expect(defaultGuardian({ by: 'count', created: D, due: addDays(D, 365), chapters: [] })).toBe(11);
    expect(defaultGuardian({ by: 'count', created: D, due: addDays(D, 9999), chapters: [] })).toBe(11);
  });
  it('a missed date is a note, not a penalty', () => {
    const e = ep({ due: day(3) });
    expect(dueNote(e, day(0))).toBe('3 days to go');
    expect(dueNote(e, day(3))).toBe('Target day is today');
    expect(dueNote(e, day(9))).toBe('Past the target date. No rush.');
    expect(dueNote(ep({}), day(0))).toBeUndefined();
  });
});
