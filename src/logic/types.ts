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
};

export type Mark = 'full' | 'tiny';
export type Log = Record<string, Record<string, Mark>>; // day key -> habit id -> mark

export type Settings = { rolloverHour: number; muted: boolean; lastBackup?: string };

export type State = { v: 2; settings: Settings; habits: Habit[]; log: Log; lastOpened?: string };
