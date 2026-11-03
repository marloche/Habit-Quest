export type Schedule =
  | { kind: 'daily' }
  | { kind: 'days'; days: number[] } // 0 = Sunday
  | { kind: 'weekly'; times: number }
  | { kind: 'once'; day: string }; // a planned one-off quest, on that day only

export type Habit = {
  id: string;
  name: string;
  icon: string;
  tiny?: string;
  schedule: Schedule;
  created: string; // day key
  archived?: string; // day key; not due from this day on
  focus?: number; // focus timer length in minutes; finishing it checks the quest
};

export type Mark = 'full' | 'tiny';
export type Log = Record<string, Record<string, Mark>>; // day key -> habit id -> mark

export type Settings = { rolloverHour: number; muted: boolean; lastBackup?: string; wakeLock?: boolean };

export type Slot = 'hat' | 'weapon' | 'cape' | 'pet';

// What you bought (and the price you paid, so retuning prices never rewrites the past),
// what you wear, and which chests you've opened with what came out.
export type Wardrobe = {
  owned: Record<string, { day: string; paid: number }>;
  worn: Partial<Record<Slot, string>>;
  opened: Record<string, { day: string; gold?: number; item?: string }>;
};

export type Mood = 1 | 2 | 3 | 4 | 5; // awful, low, ok, good, great
export type Journal = Record<string, { mood: Mood; text?: string }>; // day key -> entry

export type Focus = Record<string, number>; // day key -> minutes focused

export type State = { v: 5; settings: Settings; habits: Habit[]; log: Log; wardrobe: Wardrobe; journal: Journal; focus: Focus; lastOpened?: string };
