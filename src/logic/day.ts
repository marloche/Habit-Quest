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
// A later rollover can turn "today" back into yesterday, which would reopen yesterday's quests.
export const rolloverMovesBack = (now: Date, from: number, to: number) => dayKey(now, to) < dayKey(now, from);

export const daysBetween = (a: string, b: string) => Math.round((toUTC(b) - toUTC(a)) / 864e5);
