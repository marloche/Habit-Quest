import { describe, expect, it } from 'vitest';
import type { Settings } from './types';
import { gainOf, pctOf } from './volume';

const base: Settings = { rolloverHour: 4, muted: false };

describe('volume sliders', () => {
  it('start where the old MEDIUM was', () => {
    expect([pctOf(base, 'sfxPct'), pctOf(base, 'musicPct'), pctOf(base, 'ambPct')]).toEqual([79, 84, 84]);
    expect(gainOf(base, 'musicPct')).toBeCloseTo(0.7, 1);
    expect(gainOf(base, 'sfxPct')).toBeCloseTo(1, 1);
  });
  it('carry over an old LOW / HIGH', () => {
    expect(pctOf({ ...base, sfxVol: 1, musicVol: 3, ambVol: 1 }, 'sfxPct')).toBe(56);
    expect(pctOf({ ...base, musicVol: 3 }, 'musicPct')).toBe(100);
    expect(pctOf({ ...base, ambVol: 1 }, 'ambPct')).toBe(63);
  });
  it('use the slider once it is set, from silent to the old HIGH', () => {
    expect(pctOf({ ...base, musicVol: 3, musicPct: 20 }, 'musicPct')).toBe(20);
    expect(gainOf({ ...base, musicPct: 0 }, 'musicPct')).toBe(0);
    expect(gainOf({ ...base, musicPct: 100 }, 'musicPct')).toBe(1);
    expect(gainOf({ ...base, sfxPct: 100 }, 'sfxPct')).toBe(1.6);
    expect(gainOf({ ...base, ambPct: 50 }, 'ambPct')).toBe(0.25);
  });
});
