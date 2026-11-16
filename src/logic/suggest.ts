import { defaultGuardian, EPIC_COLORS } from './epic';
import type { Epic, EpicBy, Habit, Schedule } from './types';

// Offline quest ideas: no network, so the app only knows the goals written here.
export type Goal = { id: string; name: string; icon: string; words: string[] };
export type Idea = { goal: string; name: string; tiny: string; icon: string; schedule: Schedule; focus?: number };
export type Budget = 5 | 15 | 30; // minutes a day; 30 means "30 or more"

const daily: Schedule = { kind: 'daily' };
const weekly = (times: number): Schedule => ({ kind: 'weekly', times });

// words: stems matched against the start of each typed word ("exercis" matches exercise, exercising).
// A stem must not catch a common word meant for another goal (e.g. "care" would catch "career").
export const GOALS: Goal[] = [
  { id: 'fitness', name: 'FITNESS', icon: 'dumbbell', words: ['fit', 'gym', 'exercis', 'workout', 'run', 'jog', 'strong', 'muscle', 'walk', 'sport', 'cardio', 'lift', 'yoga', 'stretch', 'active', 'swim', 'bike', 'weight'] },
  { id: 'calisthenics', name: 'CALISTHENICS', icon: 'monke', words: ['calisthenic', 'bodyweight', 'push', 'pull', 'chin', 'plank', 'handstand', 'pistol', 'monke', 'gymnast'] }, // "pull-ups" types as pull + ups
  { id: 'meditation', name: 'MEDITATION', icon: 'lotus', words: ['medit', 'mindful', 'breath', 'zen', 'still', 'lotus', 'buddh'] },
  { id: 'sleep', name: 'SLEEP', icon: 'moon', words: ['sleep', 'bed', 'tired', 'rest', 'insomnia', 'wake', 'morning', 'night', 'energy'] },
  { id: 'mind', name: 'MIND', icon: 'leaf', words: ['stress', 'anxi', 'calm', 'mental', 'relax', 'happ', 'mood', 'grateful', 'gratitude', 'peace', 'depress', 'burnout', 'overwhelm', 'therap', 'emotion', 'feel'] },
  { id: 'outdoors', name: 'OUTDOORS', icon: 'pine', words: ['outdoor', 'outside', 'nature', 'hike', 'hiking', 'park', 'garden', 'sunlight', 'fresh', 'tree', 'camp', 'trail', 'bird', 'grass', 'forest'] },
  { id: 'selfcare', name: 'SELF-CARE', icon: 'soap', words: ['self', 'skin', 'pamper', 'groom', 'hygien', 'shower', 'nap', 'hair'] }, // not "spa" (spanish) or "bath" (bathroom)
  { id: 'learning', name: 'LEARNING', icon: 'book', words: ['learn', 'study', 'read', 'book', 'language', 'spanish', 'french', 'german', 'japanese', 'english', 'chinese', 'korean', 'italian', 'course', 'school', 'exam', 'skill', 'code', 'coding', 'program', 'math', 'cert', 'podcast'] },
  { id: 'focus', name: 'FOCUS', icon: 'sword', words: ['focus', 'work', 'productiv', 'procrastinat', 'career', 'job', 'deep', 'distract', 'task', 'disciplin', 'plan', 'goal'] },
  { id: 'detox', name: 'DIGITAL DETOX', icon: 'nophone', words: ['phone', 'screen', 'detox', 'scroll', 'doom', 'tiktok', 'instagram', 'youtube', 'internet', 'addict', 'offline', 'digital', 'notification'] }, // not "app" (apple, apartment)
  { id: 'health', name: 'HEALTH', icon: 'apple', words: ['health', 'eat', 'diet', 'food', 'water', 'hydrat', 'nutrition', 'veg', 'sugar', 'cook', 'vitamin', 'teeth', 'weight', 'protein', 'fruit'] },
  { id: 'home', name: 'HOME', icon: 'star', words: ['home', 'clean', 'tidy', 'mess', 'chore', 'house', 'apartment', 'room', 'laundry', 'declutter', 'organi', 'vacuum', 'dish'] },
  { id: 'social', name: 'SOCIAL', icon: 'heart', words: ['friend', 'family', 'social', 'lonely', 'people', 'relationship', 'partner', 'connect', 'parent', 'kids', 'club'] },
  { id: 'kindness', name: 'KINDNESS', icon: 'gift', words: ['kind', 'volunteer', 'donat', 'charit', 'help', 'giving', 'neighbo', 'communit', 'generous', 'thank'] },
  { id: 'money', name: 'MONEY', icon: 'coin', words: ['money', 'save', 'saving', 'budget', 'spend', 'debt', 'financ', 'invest', 'cash', 'frugal', 'rich', 'subscription'] },
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
  idea('fitness', 'dumbbell', '10,000 steps', '1,000 steps'),
  idea('fitness', 'dumbbell', 'Yoga session', '1 sun salutation', weekly(3), 20),
  idea('fitness', 'dumbbell', 'Swim laps', 'Get in the pool', weekly(2), 30),
  idea('fitness', 'dumbbell', 'Mobility routine', '1 hip opener', daily, 10),
  // Basics first (the pre-ticks), then skill practice.
  idea('calisthenics', 'monke', 'Push-ups: 3 sets', '1 push-up', daily, 10),
  idea('calisthenics', 'monke', 'Pull-ups: 3 sets', '10 s dead hang', weekly(3), 15),
  idea('calisthenics', 'monke', 'Plank 1 min', 'Plank 10 s'),
  idea('calisthenics', 'monke', 'Dips: 3 sets', '1 dip', weekly(3), 10),
  idea('calisthenics', 'monke', 'Hollow body hold', 'Hold 10 s', weekly(4)),
  idea('calisthenics', 'monke', 'Hanging leg raises', '1 knee raise', weekly(3), 10),
  idea('calisthenics', 'monke', 'Handstand practice', '1 wall kick-up', weekly(3), 15),
  idea('calisthenics', 'monke', 'L-sit practice', 'Tuck hold 5 s', weekly(3), 10),
  idea('calisthenics', 'monke', 'Pistol squat practice', '1 assisted pistol', weekly(2), 10),
  idea('calisthenics', 'monke', 'Muscle-up practice', '3 high pull-ups', weekly(2), 15),
  idea('meditation', 'lotus', 'Meditate 10 min', '3 slow breaths', daily, 10),
  idea('meditation', 'lotus', 'Box breathing', '1 round of 4-4-4-4', daily, 5),
  idea('meditation', 'lotus', 'Body scan', 'Scan head to toe once', daily, 10),
  idea('meditation', 'lotus', 'Loving-kindness', 'Wish 1 person well', daily, 10),
  idea('meditation', 'lotus', 'Mindful walk', '10 slow, noticed steps', daily, 15),
  idea('meditation', 'lotus', 'Mindful meal', '3 slow bites'),
  idea('meditation', 'lotus', 'A breath before the phone', '1 breath before you unlock it'),
  idea('meditation', 'lotus', 'Mindful listening', 'Name 3 sounds', weekly(3), 5),
  idea('meditation', 'lotus', 'Noting practice', 'Note 5 thoughts', weekly(3), 10),
  idea('meditation', 'lotus', 'Candle gazing', 'Watch a flame 1 min', weekly(3), 5),
  idea('sleep', 'moon', 'Lights out by 11 PM', 'In bed by midnight'),
  idea('sleep', 'moon', 'No screens before bed', '5 min screen-free in bed'),
  idea('sleep', 'moon', 'Same wake-up time', 'Up within 15 min of it'),
  idea('sleep', 'moon', 'Wind-down routine', '1 slow breath in bed', daily, 15),
  idea('sleep', 'drop', 'No caffeine after 2 PM', 'No coffee after 5 PM'),
  idea('sleep', 'star', 'Make the bed', 'Straighten the pillow'),
  idea('sleep', 'moon', 'Dim the lights at 9 PM', 'Turn off 1 lamp'),
  idea('sleep', 'moon', 'Cool, dark bedroom', 'Close the curtains'),
  idea('sleep', 'apple', 'No late snacks', 'Kitchen closed 1 h before bed'),
  idea('sleep', 'book', 'Read before sleep', '1 page in bed', daily, 15),
  idea('mind', 'pen', 'Write 3 gratitudes', 'Write 1 gratitude'),
  idea('mind', 'pen', 'Journal 5 min', 'Write 1 sentence', daily, 5),
  idea('mind', 'leaf', 'Walk outside, no phone', 'Step outside 1 min', daily, 15),
  idea('mind', 'heart', 'Name your feeling', '1 word for how you feel'),
  idea('mind', 'pen', 'Worry window', 'Write 1 worry down', daily, 10),
  idea('mind', 'star', 'Celebrate a small win', 'Say 1 win out loud'),
  idea('mind', 'heart', 'Self-compassion break', 'Hand on your heart, 1 breath'),
  idea('mind', 'leaf', 'Reframe a harsh thought', 'Notice 1 harsh thought'),
  idea('mind', 'star', 'Do one thing for fun', '5 min of something fun', daily, 15),
  idea('mind', 'heart', 'Tell someone how you are', 'Text 1 honest line', weekly(2)),
  idea('outdoors', 'pine', 'Morning sunlight', 'Open the blinds, look out', daily, 10),
  idea('outdoors', 'pine', 'Touch grass', 'Stand on grass 1 min'),
  idea('outdoors', 'pine', 'Go for a hike', 'Walk a trail 10 min', weekly(1), 60),
  idea('outdoors', 'apple', 'Eat lunch outside', 'Eat 1 bite outside', weekly(3)),
  idea('outdoors', 'pine', 'Visit a park', 'Walk past a park', weekly(2), 30),
  idea('outdoors', 'leaf', 'Garden 15 min', 'Pull 1 weed', weekly(3), 15),
  idea('outdoors', 'star', 'Watch the sunset', 'Look at the sky 1 min', weekly(3)),
  idea('outdoors', 'moon', 'Stargaze', 'Find 1 star', weekly(1), 15),
  idea('outdoors', 'pine', 'Bike somewhere', 'Pump the tires', weekly(2), 30),
  idea('outdoors', 'pine', 'Spot a bird', 'Listen for 1 bird'),
  idea('selfcare', 'soap', 'Skincare routine', 'Wash your face'),
  idea('selfcare', 'soap', 'Shower before bed', 'Wash your hands and face'),
  idea('selfcare', 'star', 'Get dressed for the day', 'Change out of pajamas'),
  idea('selfcare', 'soap', 'Take a bath', 'Warm water on your hands', weekly(1), 30),
  idea('selfcare', 'moon', 'Nap 20 min', 'Close your eyes 5 min', weekly(2), 20),
  idea('selfcare', 'heart', 'Hobby hour for me', '5 min of a hobby', weekly(2), 60),
  idea('selfcare', 'soap', 'Moisturize', 'Lotion on your hands'),
  idea('selfcare', 'soap', 'Fresh sheets', 'Swap the pillowcases', weekly(1)),
  idea('selfcare', 'soap', 'Do your hair', 'Brush your hair'),
  idea('selfcare', 'pen', 'Book that appointment', 'Find the phone number', weekly(1)),
  idea('learning', 'book', 'Read 20 min', 'Read 1 page', daily, 20),
  idea('learning', 'book', 'Language practice', '1 flashcard', daily, 15),
  idea('learning', 'book', 'Study session', 'Open your notes', daily, 30),
  idea('learning', 'book', 'Watch a lesson', '5 min of a lesson', weekly(3), 30),
  idea('learning', 'book', 'Review flashcards', '5 cards', daily, 10),
  idea('learning', 'sword', 'Practice a skill', '5 min of practice', weekly(4), 30),
  idea('learning', 'pen', 'Write what you learned', '1 line'),
  idea('learning', 'book', 'Listen to a podcast', '5 min of an episode', weekly(3), 20),
  idea('learning', 'pen', 'Learn a new word', 'Look up 1 word'),
  idea('learning', 'star', 'Teach someone', 'Explain 1 idea out loud', weekly(1)),
  idea('focus', 'sword', 'Deep work block', '10 min on the hardest task', daily, 45),
  idea('focus', 'pen', 'Plan tomorrow', 'Write 1 task', daily, 5),
  idea('focus', 'sword', 'Most important task first', 'Start it for 2 min', daily, 25),
  idea('focus', 'moon', 'Phone in another room', '15 min without phone'),
  idea('focus', 'pen', 'Clear the inbox', 'Clear 5 emails', weekly(3), 15),
  idea('focus', 'book', 'Weekly review', 'Look at next week', weekly(1), 30),
  idea('focus', 'pen', 'Time-block the day', 'Block 1 hour', daily, 5),
  idea('focus', 'sword', 'Do the dreaded task', '2 minutes on it', daily, 15),
  idea('focus', 'star', 'Close all tabs', 'Close 5 tabs'),
  idea('focus', 'star', 'Clear the desk', 'Take 1 thing off it'),
  idea('detox', 'nophone', 'Phone away at 9 PM', 'Phone away 10 min'),
  idea('detox', 'nophone', 'Screen time under 2 h', 'Check your screen time'),
  idea('detox', 'nophone', 'No phone at meals', 'Phone face down at 1 meal'),
  idea('detox', 'nophone', 'App-free first hour', 'No phone 10 min after waking'),
  idea('detox', 'nophone', 'Unfollow 5 accounts', 'Unfollow 1', weekly(1)),
  idea('detox', 'nophone', 'Grayscale phone', 'Grayscale for 1 h'),
  idea('detox', 'nophone', 'Turn off notifications', 'Mute 1 app', weekly(1)),
  idea('detox', 'nophone', 'Offline afternoon', '30 min offline', weekly(1), 60),
  idea('detox', 'nophone', 'Delete a time-waster app', 'Move it off the home screen', weekly(1)),
  idea('detox', 'nophone', 'No phone in bed', 'Charge it across the room'),
  idea('health', 'drop', 'Drink water', '1 glass'),
  idea('health', 'apple', 'Eat a vegetable', '1 bite'),
  idea('health', 'apple', 'Cook at home', 'Make a snack', weekly(3)),
  idea('health', 'drop', 'No sugary drinks', 'One less soda'),
  idea('health', 'heart', 'Take vitamins', 'Put them by the sink'),
  idea('health', 'star', 'Floss', '1 tooth'),
  idea('health', 'apple', 'Eat fruit', '1 piece of fruit'),
  idea('health', 'apple', 'Protein at breakfast', '1 egg or a yogurt'),
  idea('health', 'heart', 'Stand up every hour', 'Stand up once'),
  idea('health', 'apple', 'Meal prep', 'Chop 1 vegetable', weekly(1), 45),
  idea('home', 'star', 'Tidy 10 min', 'Put 1 thing away', daily, 10),
  idea('home', 'drop', 'Dishes before bed', 'Wash 1 dish'),
  idea('home', 'star', 'Declutter one spot', 'Toss 1 item', weekly(3), 15),
  idea('home', 'drop', 'Laundry', 'Start a load', weekly(2)),
  idea('home', 'leaf', 'Water the plants', '1 plant', weekly(2)),
  idea('home', 'star', 'Take out the trash', 'Empty 1 bin', weekly(2)),
  idea('home', 'drop', 'Wipe the kitchen', 'Wipe 1 counter'),
  idea('home', 'star', 'Vacuum', '1 room', weekly(2), 15),
  idea('home', 'drop', 'Clean the bathroom', 'Wipe the sink', weekly(1), 20),
  idea('home', 'star', 'Reset the room before bed', 'Put 3 things back'),
  idea('social', 'heart', 'Text a friend', 'Send 1 emoji'),
  idea('social', 'heart', 'Call family', '2-minute call', weekly(2)),
  idea('social', 'pen', 'Reply to messages', 'Reply to 1', daily, 10),
  idea('social', 'star', 'Plan a hangout', 'Message 1 person', weekly(1)),
  idea('social', 'apple', 'Family dinner', 'Sit together 10 min', weekly(3)),
  idea('social', 'heart', 'Voice note a friend', 'Send a 10 s voice note', weekly(2)),
  idea('social', 'star', 'Join a club or class', 'Look up 1 group', weekly(1)),
  idea('social', 'pen', 'Remember birthdays', 'Add 1 birthday to the calendar', weekly(1)),
  idea('social', 'star', 'Game night', 'Invite 1 person', weekly(1), 60),
  idea('social', 'heart', 'Ask a real question', 'Ask how someone really is'),
  idea('kindness', 'gift', 'Compliment someone', '1 kind word'),
  idea('kindness', 'gift', 'Write a thank-you note', 'Text 1 thank-you', weekly(2)),
  idea('kindness', 'gift', 'Volunteer', 'Look up 1 place to help', weekly(1), 60),
  idea('kindness', 'gift', 'Donate something', 'Put 1 item in a donate bag', weekly(1)),
  idea('kindness', 'gift', 'Help a neighbor', 'Offer 1 hand', weekly(1)),
  idea('kindness', 'leaf', 'Pick up litter', 'Pick up 1 piece', weekly(2)),
  idea('kindness', 'gift', 'Random act of kindness', 'Hold a door'),
  idea('kindness', 'heart', 'Check on someone', 'Send 1 how-are-you'),
  idea('kindness', 'star', 'Leave a good review', 'Rate 1 small business', weekly(1)),
  idea('kindness', 'gift', 'Give to a cause', 'Give $1', weekly(1)),
  idea('money', 'coin', 'Log spending', 'Log 1 purchase', daily, 5),
  idea('money', 'coin', 'No-spend day', 'Skip 1 impulse buy', weekly(3)),
  idea('money', 'coin', 'Check the budget', 'Open the bank app', weekly(1), 15),
  idea('money', 'coin', 'Move money to savings', 'Move $1', weekly(1)),
  idea('money', 'apple', 'Pack lunch', 'Pack a snack', weekly(3)),
  idea('money', 'coin', 'Cancel a subscription', 'Find 1 you forgot', weekly(1)),
  idea('money', 'coin', 'Wait 24 h before buying', 'Leave 1 thing in the cart'),
  idea('money', 'coin', 'Pay bills on time', 'Check 1 due date', weekly(1)),
  idea('money', 'coin', 'Read about money', 'Read 1 article', weekly(2), 15),
  idea('money', 'coin', 'Sell something unused', 'Snap 1 photo of it', weekly(1)),
  idea('creative', 'pen', 'Draw 15 min', 'Draw 1 line', daily, 15),
  idea('creative', 'pen', 'Write 200 words', 'Write 1 sentence', daily, 20),
  idea('creative', 'star', 'Practice an instrument', 'Play 1 scale', daily, 20),
  idea('creative', 'sword', 'Work on a project', 'Open the project file', weekly(3), 30),
  idea('creative', 'star', 'Take a photo', 'Snap 1 photo'),
  idea('creative', 'pen', 'Sketch an idea', '1 doodle'),
  idea('creative', 'pen', 'Paint or color', '1 color swatch', weekly(2), 30),
  idea('creative', 'star', 'Craft with your hands', 'Fold 1 paper crane', weekly(2), 30),
  idea('creative', 'heart', 'Sing a song', 'Sing 1 chorus'),
  idea('creative', 'star', 'Share your work', 'Show 1 person', weekly(1)),
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
// chapters: [name, amount that reaches it, what the step means]; chapters-mode ideas have no amounts.
export type IdeaChapter = [string, number?, string?];
export type EpicIdea = { goal: string; name: string; icon: string; why: string; by: EpicBy; target?: number; unit?: string; link?: string; chapters: IdeaChapter[] };

const linked = (goal: string, icon: string, name: string, why: string, link: string, target: number, chapters: [string, number, string][]): EpicIdea =>
  ({ goal, name, icon, why, by: 'links', target, link, chapters });
const counted = (goal: string, icon: string, name: string, why: string, target: number, unit: string, chapters: [string, number, string][]): EpicIdea =>
  ({ goal, name, icon, why, by: 'count', target, unit, chapters });
const story = (goal: string, icon: string, name: string, why: string, chapters: [string, string][]): EpicIdea =>
  ({ goal, name, icon, why, by: 'chapters', chapters: chapters.map(([c, about]) => [c, undefined, about]) });

export const EPIC_IDEAS: EpicIdea[] = [
  linked('fitness', 'dumbbell', 'Run a 5K', 'Cross a finish line', 'Go for a run', 24, [
    ['First run', 1, 'Any pace, any distance. Just go.'], ['1 km nonstop', 8, 'Slow is fine. No walking breaks.'],
    ['3 km', 16, 'Add a little each week.'], ['5K day', 24, 'Run the full 5K, race or solo.']]),
  counted('fitness', 'dumbbell', 'Train for a half marathon', 'Run 21 km in one go', 300, 'km', [
    ['First 50 km', 50, 'Easy runs. Build the habit first.'], ['Long runs', 150, 'One long run a week, 1 km longer each time.'],
    ['Taper', 250, 'Shorter runs. Let the legs rest.'], ['Race day', 300, '21.1 km. Start slow, finish strong.']]),
  linked('calisthenics', 'monke', '30 days of push-ups', 'Stronger every day', 'Push-ups: 3 sets', 30, [
    ['A week', 7, 'Any reps count, even 1.'], ['Two weeks', 14, 'Try one more rep than on day 1.'], ['30 days', 30, 'Test your max and compare.']]),
  story('calisthenics', 'monke', 'First muscle-up', 'Over the bar', [
    ['Strict pull-ups', '8 clean reps, chin over the bar.'], ['Explosive pulls', 'Pull to the chest, 3 sets of 3, fast up.'],
    ['Straight-bar dips', '10 dips on top of the bar.'], ['Transition drills', 'Low-bar or band-assisted muscle-ups.'], ['First muscle-up', 'One rep over the bar. Film it!']]),
  linked('meditation', 'lotus', 'Meditate 100 days', 'A calmer mind', 'Meditate 10 min', 100, [
    ['First week', 7, 'Same time, same spot each day.'], ['A month', 30, 'Try a 15 min sit once a week.'],
    ['Halfway', 50, 'Notice what has changed.'], ['100 days', 100, 'Sit for 20 min to celebrate.']]),
  counted('meditation', 'lotus', '1,000 minutes of stillness', 'Small sits add up', 1000, 'minutes', [
    ['100 minutes', 100, 'Short sits count.'], ['250 minutes', 250, 'Try a body scan or a mindful walk.'],
    ['500 minutes', 500, 'Halfway: try one 30 min sit.'], ['1,000 minutes', 1000, 'About 17 hours of practice.']]),
  linked('sleep', 'moon', 'Fix my sleep', 'Wake up rested', 'Lights out by 11 PM', 30, [
    ['First week', 7, 'Lights out by 11 most nights.'], ['Two weeks', 14, 'Notice how mornings feel.'], ['A full month', 30, 'This is your new normal.']]),
  linked('sleep', 'moon', 'Become an early riser', 'Own the morning', 'Same wake-up time', 60, [
    ['15 mornings', 15, 'Same time, weekends too.'], ['30 mornings', 30, 'Use the extra time for you.'], ['60 mornings', 60, 'Mornings are yours now.']]),
  linked('mind', 'pen', 'Fill a gratitude journal', 'Notice the good', 'Write 3 gratitudes', 50, [
    ['10 pages', 10, 'Small things count.'], ['25 pages', 25, 'Name a person each time.'], ['Last page', 50, 'Read it all back.']]),
  story('mind', 'heart', 'A kinder inner voice', 'Talk to yourself like a friend', [
    ['Notice', 'Catch harsh thoughts. No fixing yet.'], ['Name it', 'Say what the feeling is.'], ['Reframe', 'Ask: what would I tell a friend?'],
    ['Practice', 'Do it daily for two weeks.'], ['Own it', 'Kind by default.']]),
  linked('outdoors', 'pine', '30 days of sunlight', 'Wake up with the sun', 'Morning sunlight', 30, [
    ['A week', 7, 'Within an hour of waking.'], ['Two weeks', 14, 'Try it without sunglasses.'], ['30 days', 30, 'Notice how you sleep now.']]),
  counted('outdoors', 'pine', 'Hike 50 km', 'Find the trails near you', 50, 'km', [
    ['First trail', 5, 'Pick an easy, short trail.'], ['20 km', 20, 'Try a trail you have never walked.'],
    ['35 km', 35, 'A longer one with a view.'], ['50 km', 50, 'Plan a big day hike.']]),
  linked('selfcare', 'soap', 'A month of self-care', 'Look after the body you live in', 'Skincare routine', 30, [
    ['A week', 7, 'Morning or night, just pick one.'], ['Two weeks', 14, 'Add a second step.'], ['A month', 30, 'Your skin will show it.']]),
  story('selfcare', 'soap', 'Reset day', 'One day just for you', [
    ['Plan it', 'Pick a date and guard it.'], ['Rest', 'Sleep in. No alarms.'], ['Pamper', 'Bath, skincare, comfy clothes.'],
    ['Do a joy', 'One hobby, no guilt.'], ['Reflect', 'Write down what felt good.']]),
  counted('learning', 'book', 'Read 12 books', 'A book a month', 12, 'books', [
    ['First book', 1, 'Pick something fun, not a chore.'], ['Quarter shelf', 3, 'Mix fiction and non-fiction.'], ['Halfway', 6, 'Try a genre you usually skip.'],
    ['Nine down', 9, 'Recommend one to a friend.'], ['Twelve!', 12, 'Pick your favorite of the year.']]),
  linked('learning', 'book', 'Learn a language basics', 'Hold a first chat', 'Language practice', 90, [
    ['Greetings', 15, 'Hello, thanks, sorry, numbers.'], ['Ordering food', 45, 'Menus, prices, asking for things.'], ['First chat', 90, 'A 5 minute talk with a speaker.']]),
  story('focus', 'sword', 'Finish a big project', 'See it shipped', [
    ['Plan', 'Write the goal and the steps.'], ['Draft', 'A rough first version. No polish.'], ['Build', 'Make it real.'],
    ['Polish', 'Fix the rough edges.'], ['Ship it', 'Put it out. Done beats perfect.']]),
  linked('focus', 'sword', '50 deep work blocks', 'Do the work that matters', 'Deep work block', 50, [
    ['10 blocks', 10, 'Same time each day works best.'], ['25 blocks', 25, 'Try one 90 min block.'], ['50 blocks', 50, 'Look at what you built.']]),
  linked('detox', 'nophone', 'Phone-free evenings', 'Get your nights back', 'Phone away at 9 PM', 30, [
    ['A week', 7, 'Charge it outside the bedroom.'], ['Two weeks', 14, 'Fill the time with something you like.'], ['30 days', 30, 'Check how you sleep now.']]),
  counted('detox', 'nophone', 'Win back 30 hours', 'Time from scrolling, back to you', 30, 'hours', [
    ['5 hours', 5, 'Track the time you did not scroll.'], ['15 hours', 15, 'Spend some of it on a hobby.'], ['30 hours', 30, 'A whole weekend, won back.']]),
  linked('health', 'drop', 'Hydration hero', 'Drink water every day', 'Drink water', 60, [
    ['A week', 7, 'Keep a bottle in sight.'], ['A month', 30, 'A glass with each meal.'], ['Two months', 60, 'You will not need reminders.']]),
  linked('health', 'apple', 'Cook 30 meals at home', 'Eat better, spend less', 'Cook at home', 30, [
    ['10 meals', 10, 'Simple meals count.'], ['20 meals', 20, 'Learn one new recipe.'], ['30 meals', 30, 'Cook for someone else.']]),
  story('home', 'star', 'Declutter the home', 'A home that feels light', [
    ['Kitchen', 'Toss expired food and doubles.'], ['Bedroom', 'Clear every surface.'], ['Closet', "Donate what you didn't wear this year."],
    ['Bathroom', 'Old products out.'], ['Garage', 'Keep, donate or toss. Nothing in between.']]),
  linked('home', 'star', 'A tidy month', 'Come home to calm', 'Tidy 10 min', 30, [
    ['A week', 7, 'Same 10 min each day.'], ['Two weeks', 14, 'Tame one messy hot spot.'], ['A month', 30, 'Notice how home feels.']]),
  counted('social', 'heart', 'Reconnect with 10 friends', 'Keep the people who matter', 10, 'friends', [
    ['First hello', 1, 'Start with the easiest one.'], ['Five friends', 5, 'Try a call, not just a text.'], ['Ten friends', 10, 'Meet one in person.']]),
  linked('social', 'heart', 'Family dinner season', 'Time around the table', 'Family dinner', 24, [
    ['6 dinners', 6, 'No phones at the table.'], ['12 dinners', 12, 'Everyone shares one thing.'], ['24 dinners', 24, 'Cook one together.']]),
  counted('kindness', 'gift', '52 acts of kindness', 'One a week for a year', 52, 'acts', [
    ['10 acts', 10, 'Small ones count.'], ['26 acts', 26, 'Halfway: try one for a stranger.'], ['52 acts', 52, 'A whole year of good.']]),
  linked('kindness', 'gift', 'Volunteer 12 times', 'Show up for others', 'Volunteer', 12, [
    ['First shift', 1, 'Try a one-off event.'], ['Six shifts', 6, 'Find a place you like.'], ['Twelve shifts', 12, "You're a regular now."]]),
  counted('money', 'coin', 'Save $1,000', 'A safety cushion', 1000, '$', [
    ['$250', 250, 'Set up an automatic transfer.'], ['$500', 500, 'Halfway. Keep it in its own account.'],
    ['$750', 750, 'Cut one subscription to speed up.'], ['$1,000', 1000, 'A real cushion. Well done.']]),
  linked('money', 'coin', 'No-spend challenge', 'Spend on purpose', 'No-spend day', 30, [
    ['10 days', 10, 'Plan meals ahead.'], ['20 days', 20, 'Note what you wanted and skipped.'], ['30 days', 30, 'Add up what you saved.']]),
  story('creative', 'pen', 'Write a short story', 'Finish what I start', [
    ['Idea', 'One line: who wants what.'], ['Outline', 'Beginning, middle, end.'], ['First draft', 'Get it all down. Messy is fine.'],
    ['Edit', 'Cut what does not help.'], ['The end', 'Share it with someone.']]),
  linked('creative', 'pen', 'Fill a sketchbook', 'Draw without fear', 'Draw 15 min', 60, [
    ['15 pages', 15, 'Draw what is in front of you.'], ['30 pages', 30, 'Try a new tool.'], ['Last page', 60, 'Flip back through from page 1.']]),
];

// A new epic from an idea, color by goal. linkId: your quest that moves it (links mode).
export function epicFromIdea(i: EpicIdea, id: string, today: string, linkId?: string): Epic {
  const e: Epic = {
    id, name: i.name, icon: i.icon, why: i.why, color: Math.max(0, GOALS.findIndex((g) => g.id === i.goal)) % EPIC_COLORS.length,
    created: today, guardian: 0, by: i.by, status: 'active',
    chapters: i.chapters.map(([name, at, about]) => ({ name, ...(at !== undefined ? { at } : {}), ...(about ? { about } : {}) })),
    ...(i.target !== undefined ? { target: i.target } : {}), ...(i.unit ? { unit: i.unit } : {}), ...(linkId ? { links: [linkId] } : {}),
  };
  return { ...e, guardian: defaultGuardian(e) };
}
