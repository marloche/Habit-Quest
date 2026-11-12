import { daySummary } from './score';
import type { Entry, Habit, Journal, JournalDay, Log, Mood } from './types';

export const MOODS = ['AWFUL', 'LOW', 'OK', 'GOOD', 'GREAT']; // mood 1-5
export const JOURNAL_GOLD = 2;
export const JOURNAL_MAX = 140; // the day in a word (a line, really)
export const ENTRY_MAX = 10_000;
export const ENTRIES_MAX = 50; // per day
export const STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// An entry is a mood with an optional line; each day up to today with one pays a little gold.
export const journalGold = (j: Journal, today: string) => Object.keys(j).filter((d) => d <= today).length * JOURNAL_GOLD;

export const moodName = (avg: number) => MOODS[Math.round(avg) - 1];

type Avg = { avg: number; days: number } | undefined;

// Average mood on days every due quest got done vs the rest. Rest days count for neither; it's a fact, never a score.
export function moodLink(habits: Habit[], log: Log, j: Journal, today: string): { all: Avg; other: Avg } {
  const sums = { all: [0, 0], other: [0, 0] };
  for (const [d, e] of Object.entries(j)) {
    const status = d <= today && daySummary(habits, log, d).status;
    if (!status || status === 'rest') continue;
    const s = sums[status === 'all' ? 'all' : 'other'];
    s[0] += e.mood;
    s[1]++;
  }
  const avg = ([total, days]: number[]): Avg => (days ? { avg: total / days, days } : undefined);
  return { all: avg(sums.all), other: avg(sums.other) };
}

const pad = (n: number) => String(n).padStart(2, '0');

// Local wall-clock time, minute precision: the stamp an entry keeps forever.
export const stamp = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

// 'YYYY-MM-DDTHH:MM' -> '9:41 PM'
export function clockOf(at: string) {
  const [h, m] = at.slice(11).split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}

export type Sealed = { day: JournalDay } | { error: 'mood' | 'empty' | 'full' };

// Seals a new entry into the day. The day's first entry needs a mood: pass it, or have one already.
export function sealEntry(cur: JournalDay | undefined, entry: Entry, mood?: Mood): Sealed {
  const text = entry.text.trim().slice(0, ENTRY_MAX);
  if (!text) return { error: 'empty' };
  const m = mood ?? cur?.mood;
  if (!m) return { error: 'mood' };
  const entries = cur?.entries ?? [];
  if (entries.length >= ENTRIES_MAX) return { error: 'full' };
  return { day: { ...cur, mood: m, entries: [...entries, { ...entry, text }] } };
}

// Rewrites an entry's text; its time stays. Blank text is not an edit (DELETE is its own two-tap action).
export function editEntry(cur: JournalDay, id: string, text: string): JournalDay {
  const t = text.trim().slice(0, ENTRY_MAX);
  if (!t) return cur;
  return { ...cur, entries: (cur.entries ?? []).map((e) => (e.id === id ? { ...e, text: t } : e)) };
}

// Drops an entry; the mood and word stay, so the day's gold is never taken back.
export function dropEntry(cur: JournalDay, id: string): JournalDay {
  const entries = (cur.entries ?? []).filter((e) => e.id !== id);
  const { entries: _, ...rest } = cur;
  return entries.length ? { ...rest, entries } : rest;
}

// A page you can read back: one per entry, or one for a day that has only its word (the calendar-era journal).
export type Page = { day: string; mood: Mood; word?: string; entry?: Entry };

// Every page up to today, newest first.
export function pages(j: Journal, today: string): Page[] {
  const out: Page[] = [];
  for (const day of Object.keys(j).filter((d) => d <= today).sort().reverse()) {
    const { mood, text: word, entries } = j[day];
    const base = { day, mood, ...(word ? { word } : {}) };
    // Newest first; two sealed in the same minute keep the order they were sealed in.
    const order = (entries ?? []).map((e, i) => ({ e, i })).sort((a, b) => (a.e.at < b.e.at ? 1 : a.e.at > b.e.at ? -1 : b.i - a.i));
    if (order.length) for (const { e: entry } of order) out.push({ ...base, entry });
    else if (word) out.push(base);
  }
  return out;
}

export const pageId = (p: Page) => p.entry?.id ?? `day:${p.day}`;

// Pages grouped by month ('YYYY-MM'), keeping newest-first order.
export function byMonth(ps: Page[]): [string, Page[]][] {
  const out: [string, Page[]][] = [];
  for (const p of ps) {
    const m = p.day.slice(0, 7);
    if (out.at(-1)?.[0] !== m) out.push([m, []]);
    out.at(-1)![1].push(p);
  }
  return out;
}
