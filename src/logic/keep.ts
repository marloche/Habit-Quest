// The Keep's window and weather. Pure, so every screen and device shows the same sky.

export type Sky = 'dawn' | 'day' | 'dusk' | 'night';

// By the local hour: dawn 5-7, day 8-17, dusk 18-20, night 21-4.
export const skyOf = (hour: number): Sky => (hour < 5 || hour >= 21 ? 'night' : hour < 8 ? 'dawn' : hour < 18 ? 'day' : 'dusk');

// Rain comes in 3-hour spells, about one in four, the same on every screen and every device. FNV-1a over the spell's key.
export function rainy(d: Date): boolean {
  const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${Math.floor(d.getHours() / 3)}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
  return (h >>> 0) % 4 === 0;
}
