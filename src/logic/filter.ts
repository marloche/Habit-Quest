import type { Habit } from './types';

// The quest list's icon filter. '' means ALL.

// Icons your listed quests use, in list order, each once.
export const iconsInUse = (habits: Habit[]): string[] => [...new Set(habits.map((h) => h.icon))];

// Splits the list by the picked icon. A filter whose icon no quest uses any more shows everything,
// so a stale pick can never empty the list.
export function byIcon(habits: Habit[], pick: string): { shown: Habit[]; hidden: Habit[]; active: string } {
  if (!pick || !habits.some((h) => h.icon === pick)) return { shown: habits, hidden: [], active: '' };
  return { shown: habits.filter((h) => h.icon === pick), hidden: habits.filter((h) => h.icon !== pick), active: pick };
}
