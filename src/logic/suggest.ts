import { defaultGuardian, EPIC_COLORS } from './epic';
import type { Epic, EpicBy, Habit, Schedule } from './types';

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

// Epic quest ideas, two per goal. link: the quest idea whose checks move it (added for you if you don't have it).
// chapters: [name, amount that reaches it]; chapters-mode ideas have no amounts.
export type EpicIdea = { goal: string; name: string; icon: string; why: string; by: EpicBy; target?: number; unit?: string; link?: string; chapters: [string, number?][] };

const linked = (goal: string, icon: string, name: string, why: string, link: string, target: number, chapters: [string, number][]): EpicIdea =>
  ({ goal, name, icon, why, by: 'links', target, link, chapters });
const counted = (goal: string, icon: string, name: string, why: string, target: number, unit: string, chapters: [string, number][]): EpicIdea =>
  ({ goal, name, icon, why, by: 'count', target, unit, chapters });
const story = (goal: string, icon: string, name: string, why: string, chapters: string[]): EpicIdea =>
  ({ goal, name, icon, why, by: 'chapters', chapters: chapters.map((c) => [c]) });

export const EPIC_IDEAS: EpicIdea[] = [
  linked('fitness', 'dumbbell', 'Run a 5K', 'Cross a finish line', 'Go for a run', 24, [['First run', 1], ['1 km nonstop', 8], ['3 km', 16], ['5K day', 24]]),
  counted('fitness', 'dumbbell', 'Train for a half marathon', 'Run 21 km in one go', 300, 'km', [['First 50 km', 50], ['Long runs', 150], ['Taper', 250], ['Race day', 300]]),
  linked('sleep', 'moon', 'Fix my sleep', 'Wake up rested', 'Lights out by 11 PM', 30, [['First week', 7], ['Two weeks', 14], ['A full month', 30]]),
  linked('sleep', 'moon', 'Become an early riser', 'Own the morning', 'Same wake-up time', 60, [['15 mornings', 15], ['30 mornings', 30], ['60 mornings', 60]]),
  linked('mind', 'leaf', 'Meditate 100 days', 'A calmer mind', 'Meditate 10 min', 100, [['First week', 7], ['A month', 30], ['Halfway', 50], ['100 days', 100]]),
  linked('mind', 'pen', 'Fill a gratitude journal', 'Notice the good', 'Write 3 gratitudes', 50, [['10 pages', 10], ['25 pages', 25], ['Last page', 50]]),
  counted('learning', 'book', 'Read 12 books', 'A book a month', 12, 'books', [['First book', 1], ['Quarter shelf', 3], ['Halfway', 6], ['Nine down', 9], ['Twelve!', 12]]),
  linked('learning', 'book', 'Learn a language basics', 'Hold a first chat', 'Language practice', 90, [['Greetings', 15], ['Ordering food', 45], ['First chat', 90]]),
  story('focus', 'sword', 'Finish a big project', 'See it shipped', ['Plan', 'Draft', 'Build', 'Polish', 'Ship it']),
  linked('focus', 'sword', '50 deep work blocks', 'Do the work that matters', 'Deep work block', 50, [['10 blocks', 10], ['25 blocks', 25], ['50 blocks', 50]]),
  linked('health', 'drop', 'Hydration hero', 'Drink water every day', 'Drink water', 60, [['A week', 7], ['A month', 30], ['Two months', 60]]),
  linked('health', 'apple', 'Cook 30 meals at home', 'Eat better, spend less', 'Cook at home', 30, [['10 meals', 10], ['20 meals', 20], ['30 meals', 30]]),
  story('home', 'star', 'Declutter the home', 'A home that feels light', ['Kitchen', 'Bedroom', 'Closet', 'Bathroom', 'Garage']),
  linked('home', 'star', 'A tidy month', 'Come home to calm', 'Tidy 10 min', 30, [['A week', 7], ['Two weeks', 14], ['A month', 30]]),
  counted('social', 'heart', 'Reconnect with 10 friends', 'Keep the people who matter', 10, 'friends', [['First hello', 1], ['Five friends', 5], ['Ten friends', 10]]),
  linked('social', 'heart', 'Family dinner season', 'Time around the table', 'Family dinner', 24, [['6 dinners', 6], ['12 dinners', 12], ['24 dinners', 24]]),
  counted('money', 'coin', 'Save $1,000', 'A safety cushion', 1000, '$', [['$250', 250], ['$500', 500], ['$750', 750], ['$1,000', 1000]]),
  linked('money', 'coin', 'No-spend challenge', 'Spend on purpose', 'No-spend day', 30, [['10 days', 10], ['20 days', 20], ['30 days', 30]]),
  story('creative', 'pen', 'Write a short story', 'Finish what I start', ['Idea', 'Outline', 'First draft', 'Edit', 'The end']),
  linked('creative', 'pen', 'Fill a sketchbook', 'Draw without fear', 'Draw 15 min', 60, [['15 pages', 15], ['30 pages', 30], ['Last page', 60]]),
];

// A new epic from an idea, color by goal. linkId: your quest that moves it (links mode).
export function epicFromIdea(i: EpicIdea, id: string, today: string, linkId?: string): Epic {
  const e: Epic = {
    id, name: i.name, icon: i.icon, why: i.why, color: Math.max(0, GOALS.findIndex((g) => g.id === i.goal)) % EPIC_COLORS.length,
    created: today, guardian: 0, by: i.by, status: 'active',
    chapters: i.chapters.map(([name, at]) => (at === undefined ? { name } : { name, at })),
    ...(i.target !== undefined ? { target: i.target } : {}), ...(i.unit ? { unit: i.unit } : {}), ...(linkId ? { links: [linkId] } : {}),
  };
  return { ...e, guardian: defaultGuardian(e) };
}
