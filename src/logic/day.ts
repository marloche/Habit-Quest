// Day keys are 'YYYY-MM-DD'. Date math runs in UTC so DST never shifts a day.
const pad = (n: number) => String(n).padStart(2, '0');

export function dayKey(now: Date, rolloverHour: number): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getHours() < rolloverHour ? 1 : 0));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const toUTC = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export const addDays = (k: string, n: number) => new Date(toUTC(k) + n * 864e5).toISOString().slice(0, 10);
export const weekday = (k: string) => new Date(toUTC(k)).getUTCDay(); // 0 = Sunday
export const weekStart = (k: string) => addDays(k, -((weekday(k) + 6) % 7)); // Monday
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const weekdayName = (k: string) => WEEKDAYS[weekday(k)];
export const dayLabel = (k: string) => `${weekdayName(k)} ${MONTHS[Number(k.slice(5, 7)) - 1]} ${Number(k.slice(8))}`;

// Forgotten checks for yesterday can be logged for this long after the new day starts (noon with a 4 AM rollover).
// Short on purpose: long enough to fix a forgotten tap, too short to make logging-the-next-day a habit.
export const LATE_HOURS = 8;

export function lateWindowOpen(now: Date, rolloverHour: number): boolean {
  const [y, m, d] = dayKey(now, rolloverHour).split('-').map(Number);
  return now.getTime() - new Date(y, m - 1, d, rolloverHour).getTime() < LATE_HOURS * 36e5;
}

export function lateCutoffLabel(rolloverHour: number): string {
  const h = rolloverHour + LATE_HOURS;
  return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`;
}

// From 6 PM until the day rolls over: late enough that an unfinished quest is a real risk.
export const isEvening = (now: Date, rolloverHour: number) => now.getHours() >= 18 || now.getHours() < rolloverHour;

// A later rollover can turn "today" back into yesterday, which would reopen yesterday's quests.
export const rolloverMovesBack = (now: Date, from: number, to: number) => dayKey(now, to) < dayKey(now, from);

export const daysBetween = (a: string, b: string) => Math.round((toUTC(b) - toUTC(a)) / 864e5);
