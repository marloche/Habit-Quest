import { describe, expect, it } from 'vitest';
import { GOALS, goalsFromText, IDEAS, ideaToHabit, suggest } from './suggest';
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
