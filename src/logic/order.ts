import { isPlanned } from './score';
import type { Habit } from './types';

// Quest order is the order of state.habits. EDIT QUESTS shows only the active, repeating quests; archived ones and
// one-off plans are in the same array but hidden there, so they keep their slots and only the shown quests move.
// The EDIT list and reorder() share this rule, so a place on screen is the same place here.
export const inEditList = (h: Habit) => !h.archived && !isPlanned(h);

// Moves a quest to position `to` among the shown quests (0 = top), clamped to the list. Unknown ids change nothing.
export function reorder(habits: Habit[], id: string, to: number): Habit[] {
  const list = habits.filter(inEditList);
  const from = list.findIndex((h) => h.id === id);
  const at = Math.max(0, Math.min(list.length - 1, to));
  if (from < 0 || at === from) return habits;
  const [h] = list.splice(from, 1);
  list.splice(at, 0, h);
  let n = 0;
  return habits.map((x) => (inEditList(x) ? list[n++] : x));
}
