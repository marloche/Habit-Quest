import { describe, expect, it } from 'vitest';
import { EPIC_IDEAS, epicFromIdea, GOALS, goalsFromText, IDEAS, ideaToHabit, suggest } from './suggest';
import { CHAPTERS_MAX, NAME_MAX, WHY_MAX } from './epic';
import { fresh, parseState } from '../store';
import { ICONS } from '../sprites';
import type { Habit } from './types';

describe('quest ideas', () => {
  it('fit the quest form: known goal and icon, names and tiny versions within 40 chars, no repeats', () => {
    const goals = new Set(GOALS.map((g) => g.id));
    for (const i of IDEAS) {
      expect(goals.has(i.goal), i.name).toBe(true);
      expect(ICONS[i.icon], i.name).toBeDefined();
      expect(i.name.length <= 40 && i.tiny.length <= 40, i.name).toBe(true);
    }
    expect(new Set(IDEAS.map((i) => i.name.toLowerCase())).size).toBe(IDEAS.length);
    for (const g of GOALS) expect(IDEAS.filter((i) => i.goal === g.id).length, g.id).toBeGreaterThanOrEqual(5);
    expect(ICONS[GOALS[0].icon]).toBeDefined();
  });
  it('shows money as a gold coin', () => {
    expect(GOALS.find((g) => g.id === 'money')!.icon).toBe('coin');
    const money = IDEAS.filter((i) => i.goal === 'money' && i.name !== 'Pack lunch');
    expect(money.every((i) => i.icon === 'coin')).toBe(true);
  });
  it('maps typed intentions to goals by word stems', () => {
    expect(goalsFromText('I want to learn Spanish and sleep better')).toEqual(['sleep', 'learning']);
    expect(goalsFromText('Less stress, more exercising')).toEqual(['fitness', 'mind']);
    expect(goalsFromText('save money')).toEqual(['money']);
    expect(goalsFromText('xyz')).toEqual([]);
  });
  it('pre-ticks by time budget, alternating goals, and trims timers to the budget', () => {
    const five = suggest(['fitness', 'learning'], 5, []);
    expect(five.filter((s) => s.on).map((s) => s.idea.name)).toEqual(['Workout', 'Read 20 min']);
    expect(five.every((s) => s.idea.focus === undefined)).toBe(true);
    const fifteen = suggest(['fitness', 'learning'], 15, []);
    expect(fifteen.filter((s) => s.on).length).toBe(3);
    expect(fifteen.find((s) => s.idea.name === 'Stretch 10 min')!.idea.focus).toBe(10);
    expect(fifteen.find((s) => s.idea.name === 'Workout')!.idea.focus).toBeUndefined();
    expect(suggest(['fitness'], 30, []).filter((s) => s.on).length).toBe(5);
    expect(suggest(['fitness'], 30, [])[0].idea.focus).toBe(30);
  });
  it('leaves out quests you already have, and builds a normal quest from an idea', () => {
    const have: Habit[] = [{ id: 'a', name: 'workout', icon: 'star', schedule: { kind: 'daily' }, created: '2026-11-03' }];
    expect(suggest(['fitness'], 15, have)[0].idea.name).toBe('Walk 20 min');
    const h = ideaToHabit(suggest(['fitness'], 30, [])[0].idea, 'x', '2026-11-03');
    expect(h).toEqual({ id: 'x', name: 'Workout', tiny: '1 pushup', icon: 'dumbbell', schedule: { kind: 'weekly', times: 3 }, created: '2026-11-03', focus: 30 });
    expect('focus' in ideaToHabit(suggest(['health'], 30, [])[0].idea, 'y', '2026-11-03')).toBe(false);
  });
});

describe('epic quest ideas', () => {
  it('fit the epic form, two per goal, linked to real quest ideas, chapters climbing to the target', () => {
    const goals = new Set(GOALS.map((g) => g.id));
    for (const i of EPIC_IDEAS) {
      expect(goals.has(i.goal) && !!ICONS[i.icon], i.name).toBe(true);
      expect(i.name.length <= NAME_MAX && i.why.length <= WHY_MAX, i.name).toBe(true);
      expect(i.chapters.length >= 1 && i.chapters.length <= CHAPTERS_MAX, i.name).toBe(true);
      if (i.by === 'links') expect(IDEAS.some((q) => q.name === i.link), i.name).toBe(true);
      if (i.by !== 'chapters') {
        const ats = i.chapters.map(([, at]) => at!);
        expect(ats.every((a, n) => a > 0 && a <= i.target! && (n === 0 || a > ats[n - 1])), i.name).toBe(true);
      }
    }
    for (const g of GOALS) expect(EPIC_IDEAS.filter((i) => i.goal === g.id).length, g.id).toBe(2);
    expect(new Set(EPIC_IDEAS.map((i) => i.name)).size).toBe(EPIC_IDEAS.length);
  });
  it('become valid epics that load from a save', () => {
    const epics = EPIC_IDEAS.map((i, n) => epicFromIdea(i, `e${n}`, '2026-11-04', i.by === 'links' ? 'abc-1' : undefined));
    const s = parseState(JSON.stringify({ ...fresh(), epics }));
    expect(s.epics).toEqual(epics);
    expect(epics[0].links).toEqual(['abc-1']);
    expect(epics.find((e) => e.name === 'Save $1,000')!.guardian).toBe(2); // no date: a count epic defaults to two months
  });
});
