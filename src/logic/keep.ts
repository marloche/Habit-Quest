// The Keep's window and weather. Pure, so the picture and the sound always agree.

export type Sky = 'dawn' | 'day' | 'dusk' | 'night';

// By the local hour: dawn 5-7, day 8-17, dusk 18-20, night 21-4.
export const skyOf = (hour: number): Sky => (hour < 5 || hour >= 21 ? 'night' : hour < 8 ? 'dawn' : hour < 18 ? 'day' : 'dusk');
export const isNight = (hour: number) => skyOf(hour) === 'night';

// Rain comes in 3-hour spells, about one in four, the same on every screen and every device. FNV-1a over the spell's key.
export function rainy(d: Date): boolean {
  const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${Math.floor(d.getHours() / 3)}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
  return (h >>> 0) % 4 === 0;
}

// The church bell tolls the hour: 1-12 times.
export const tolls = (hour: number) => hour % 12 || 12;
