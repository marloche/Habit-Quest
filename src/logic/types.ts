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

export type Bg = 'auto' | 'castle' | 'dungeon' | 'forest' | 'hell' | 'plain'
  | 'snow' | 'harbor' | 'grove' | 'desert' | 'aurora' | 'lair' | 'storm' | 'isles';

// Display fields are optional; scene.ts fills in the defaults.
export type Settings = {
  rolloverHour: number; muted: boolean; lastBackup?: string; wakeLock?: boolean;
  bg?: Bg; bgStrength?: number; bgAnim?: boolean; bossArt?: boolean;
  music?: boolean; ambience?: boolean;
  sfxPct?: number; musicPct?: number; ambPct?: number; // volume sliders, 0-100
  sfxVol?: number; musicVol?: number; ambVol?: number; // the old LOW / MEDIUM / HIGH (1-3); a slider replaces it once moved
};

export type Slot = 'hat' | 'armor' | 'weapon' | 'cape' | 'pet';

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

// Hero appearance, each part an index into the lists in look.ts. Optional: a save without one draws the classic hero.
// garb: the outfit's shape (GARBS); optional because looks saved before it existed have none, and draw the tunic.
export type Look = { skin: number; style: number; hair: number; outfit: number; garb?: number };

// A long-term goal. Progress is worked out like everything else: from ticked chapters, logged amounts, or the
// log of linked quests from the epic's start. "Finished" is never stored, so unticking can take it back.
// at: the amount (count / links) that reaches this chapter; missing means evenly spaced. done: day ticked (chapters mode).
export type Chapter = { name: string; at?: number; done?: string; note?: string };
export type EpicBy = 'chapters' | 'count' | 'links';
export type Epic = {
  id: string; name: string; icon: string; color: number; // color: index into EPIC_COLORS
  why?: string; due?: string; created: string;
  guardian: number; // index into the boss LADDER
  by: EpicBy; target?: number; unit?: string; links?: string[];
  logs?: Record<string, number>; // day key -> amount logged that day (count mode)
  chapters: Chapter[];
  status: 'active' | 'inn' | 'retired'; main?: boolean;
  ended?: string; // day it was retired; progress after it doesn't count
};

export type State = { v: 6; settings: Settings; habits: Habit[]; log: Log; wardrobe: Wardrobe; journal: Journal; focus: Focus; epics: Epic[]; look?: Look; lastOpened?: string };
