import type { Habit, Schedule } from './types';

// Offline quest ideas: no network, so the app only knows the goals written here.
export type Goal = { id: string; name: string; icon: string; words: string[] };
export type Idea = { goal: string; name: string; tiny: string; icon: string; schedule: Schedule; focus?: number };
export type Budget = 5 | 15 | 30; // minutes a day; 30 means "30 or more"

const daily: Schedule = { kind: 'daily' };
const weekly = (times: number): Schedule => ({ kind: 'weekly', times });

// words: stems matched against the start of each typed word ("exercis" matches exercise, exercising).
export const GOALS: Goal[] = [
  { id: 'fitness', name: 'FITNESS', icon: 'dumbbell', words: ['fit', 'gym', 'exercis', 'workout', 'run', 'jog', 'strong', 'muscle', 'walk', 'sport', 'cardio', 'lift', 'yoga', 'stretch', 'active', 'swim', 'bike', 'weight'] },
  { id: 'sleep', name: 'SLEEP', icon: 'moon', words: ['sleep', 'bed', 'tired', 'rest', 'insomnia', 'wake', 'morning', 'night', 'energy'] },
  { id: 'mind', name: 'MIND', icon: 'leaf', words: ['stress', 'anxi', 'calm', 'mental', 'medit', 'mindful', 'relax', 'happ', 'mood', 'grateful', 'gratitude', 'peace', 'depress', 'burnout', 'overwhelm'] },
  { id: 'learning', name: 'LEARNING', icon: 'book', words: ['learn', 'study', 'read', 'book', 'language', 'spanish', 'french', 'german', 'japanese', 'english', 'chinese', 'korean', 'italian', 'course', 'school', 'exam', 'skill', 'code', 'coding', 'program', 'math'] },
  { id: 'focus', name: 'FOCUS', icon: 'sword', words: ['focus', 'work', 'productiv', 'procrastinat', 'career', 'job', 'deep', 'distract', 'task', 'disciplin', 'plan', 'goal'] },
  { id: 'health', name: 'HEALTH', icon: 'apple', words: ['health', 'eat', 'diet', 'food', 'water', 'hydrat', 'nutrition', 'veg', 'sugar', 'cook', 'vitamin', 'teeth', 'weight'] },
  { id: 'home', name: 'HOME', icon: 'star', words: ['home', 'clean', 'tidy', 'mess', 'chore', 'house', 'apartment', 'room', 'laundry', 'declutter', 'organi'] },
  { id: 'social', name: 'SOCIAL', icon: 'heart', words: ['friend', 'family', 'social', 'lonely', 'people', 'relationship', 'partner', 'connect', 'kind', 'parent', 'kids'] },
  { id: 'money', name: 'MONEY', icon: 'coin', words: ['money', 'save', 'saving', 'budget', 'spend', 'debt', 'financ', 'invest', 'cash', 'frugal', 'rich'] },
  { id: 'creative', name: 'CREATIVE', icon: 'pen', words: ['creat', 'art', 'draw', 'paint', 'writ', 'music', 'guitar', 'piano', 'instrument', 'photo', 'design', 'sing', 'craft', 'novel', 'poem'] },
];

const idea = (goal: string, icon: string, name: string, tiny: string, schedule: Schedule = daily, focus?: number): Idea => ({ goal, name, tiny, icon, schedule, focus });

// Each goal's list starts with its best first quest, since pre-ticks take from the top.
export const IDEAS: Idea[] = [
  idea('fitness', 'dumbbell', 'Workout', '1 pushup', weekly(3), 30),
  idea('fitness', 'dumbbell', 'Walk 20 min', 'Walk to the corner', daily, 20),
  idea('fitness', 'dumbbell', 'Stretch 10 min', '1 stretch', daily, 10),
  idea('fitness', 'dumbbell', '50 squats', '5 squats'),
  idea('fitness', 'dumbbell', 'Go for a run', 'Put on running shoes', weekly(2), 30),
  idea('fitness', 'dumbbell', 'Take the stairs', '1 flight'),
  idea('sleep', 'moon', 'Lights out by 11 PM', 'In bed by midnight'),
  idea('sleep', 'moon', 'No screens before bed', '5 min screen-free in bed'),
  idea('sleep', 'moon', 'Same wake-up time', 'Up within 15 min of it'),
  idea('sleep', 'moon', 'Wind-down routine', '1 slow breath in bed', daily, 15),
  idea('sleep', 'drop', 'No caffeine after 2 PM', 'No coffee after 5 PM'),
  idea('sleep', 'star', 'Make the bed', 'Straighten the pillow'),
  idea('mind', 'leaf', 'Meditate 10 min', '3 slow breaths', daily, 10),
  idea('mind', 'pen', 'Write 3 gratitudes', 'Write 1 gratitude'),
  idea('mind', 'pen', 'Journal 5 min', 'Write 1 sentence', daily, 5),
  idea('mind', 'leaf', 'Walk outside, no phone', 'Step outside 1 min', daily, 15),
  idea('mind', 'moon', 'Phone away at 9 PM', 'Phone away 10 min'),
  idea('mind', 'heart', 'Breathing break', '1 slow breath'),
  idea('learning', 'book', 'Read 20 min', 'Read 1 page', daily, 20),
  idea('learning', 'book', 'Language practice', '1 flashcard', daily, 15),
  idea('learning', 'sword', 'Practice a skill', '5 min of practice', weekly(4), 30),
  idea('learning', 'book', 'Watch a lesson', '5 min of a lesson', weekly(3), 30),
  idea('learning', 'pen', 'Write what you learned', '1 line'),
  idea('learning', 'book', 'Review flashcards', '5 cards', daily, 10),
  idea('focus', 'sword', 'Deep work block', '10 min on the hardest task', daily, 45),
  idea('focus', 'pen', 'Plan tomorrow', 'Write 1 task', daily, 5),
  idea('focus', 'sword', 'Most important task first', 'Start it for 2 min', daily, 25),
  idea('focus', 'moon', 'Phone in another room', '15 min without phone'),
  idea('focus', 'pen', 'Clear the inbox', 'Clear 5 emails', weekly(3), 15),
  idea('focus', 'book', 'Weekly review', 'Look at next week', weekly(1), 30),
  idea('health', 'drop', 'Drink water', '1 glass'),
  idea('health', 'apple', 'Eat a vegetable', '1 bite'),
  idea('health', 'apple', 'Cook at home', 'Make a snack', weekly(3)),
  idea('health', 'drop', 'No sugary drinks', 'One less soda'),
  idea('health', 'heart', 'Take vitamins', 'Put them by the sink'),
  idea('health', 'star', 'Floss', '1 tooth'),
  idea('home', 'star', 'Tidy 10 min', 'Put 1 thing away', daily, 10),
  idea('home', 'drop', 'Dishes before bed', 'Wash 1 dish'),
  idea('home', 'star', 'Declutter one spot', 'Toss 1 item', weekly(3), 15),
  idea('home', 'drop', 'Laundry', 'Start a load', weekly(2)),
  idea('home', 'leaf', 'Water the plants', '1 plant', weekly(2)),
  idea('home', 'star', 'Take out the trash', 'Empty 1 bin', weekly(2)),
  idea('social', 'heart', 'Text a friend', 'Send 1 emoji'),
  idea('social', 'heart', 'Call family', '2-minute call', weekly(2)),
  idea('social', 'heart', 'Compliment someone', '1 kind word'),
  idea('social', 'pen', 'Reply to messages', 'Reply to 1', daily, 10),
  idea('social', 'star', 'Plan a hangout', 'Message 1 person', weekly(1)),
  idea('social', 'apple', 'Family dinner', 'Sit together 10 min', weekly(3)),
  idea('money', 'coin', 'Log spending', 'Log 1 purchase', daily, 5),
  idea('money', 'coin', 'No-spend day', 'Skip 1 impulse buy', weekly(3)),
  idea('money', 'coin', 'Check the budget', 'Open the bank app', weekly(1), 15),
  idea('money', 'coin', 'Move money to savings', 'Move $1', weekly(1)),
  idea('money', 'apple', 'Pack lunch', 'Pack a snack', weekly(3)),
  idea('creative', 'pen', 'Draw 15 min', 'Draw 1 line', daily, 15),
  idea('creative', 'pen', 'Write 200 words', 'Write 1 sentence', daily, 20),
  idea('creative', 'star', 'Practice an instrument', 'Play 1 scale', daily, 20),
  idea('creative', 'sword', 'Work on a project', 'Open the project file', weekly(3), 30),
  idea('creative', 'star', 'Take a photo', 'Snap 1 photo'),
  idea('creative', 'pen', 'Sketch an idea', '1 doodle'),
];

// Goals named in free text, in GOALS order. Each typed word is checked against each goal's stems.
export function goalsFromText(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  return GOALS.filter((g) => words.some((w) => g.words.some((s) => w.startsWith(s)))).map((g) => g.id);
}

const PRE_TICKED: Record<Budget, number> = { 5: 2, 15: 3, 30: 5 };
const MAX_FOCUS: Record<Budget, number> = { 5: 0, 15: 15, 30: Infinity };

// Ideas for the chosen goals, taken in turn from each goal so the pre-ticked ones spread across them.
// Quests you already have are left out; timers longer than the time budget are dropped.
export function suggest(goals: string[], budget: Budget, have: Habit[]): { idea: Idea; on: boolean }[] {
  const owned = new Set(have.filter((h) => !h.archived).map((h) => h.name.toLowerCase()));
  const lists = goals.map((g) => IDEAS.filter((i) => i.goal === g && !owned.has(i.name.toLowerCase())));
  const out: Idea[] = [];
  for (let n = 0; lists.some((l) => l[n]); n++) for (const l of lists) if (l[n]) out.push(l[n]);
  return out.map((i, n) => ({
    idea: { ...i, focus: i.focus && i.focus <= MAX_FOCUS[budget] ? i.focus : undefined },
    on: n < PRE_TICKED[budget],
  }));
}

export const ideaToHabit = (i: Idea, id: string, today: string): Habit => ({
  id, name: i.name, tiny: i.tiny, icon: i.icon, schedule: i.schedule, created: today, ...(i.focus ? { focus: i.focus } : {}),
});
