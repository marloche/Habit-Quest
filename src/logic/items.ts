import type { Slot, Wardrobe } from './types';

// level: locked until then. chest: never sold, only found in chests.
// trophy: never sold; wearable while that achievement track sits at that tier (2 = EPIC, 3 = LEGENDARY). how: the unlock, in plain words.
export type Trophy = { track: string; tier: 2 | 3; how: string };
export type Item = { id: string; slot: Slot; name: string; price: number; level?: number; chest?: true; trophy?: Trophy };

export const SLOTS: Slot[] = ['hat', 'weapon', 'cape', 'pet'];

// Ids are stored in saves: only ever add, never rename. Array order is display order; chest items keep theirs (chest loot picks by it).
export const ITEMS: Item[] = [
  { id: 'leaf-crown', slot: 'hat', name: 'Leaf crown', price: 60 },
  { id: 'bandana', slot: 'hat', name: 'Bandana', price: 80 },
  { id: 'wizard-hat', slot: 'hat', name: 'Wizard hat', price: 150 },
  { id: 'ranger-hood', slot: 'hat', name: 'Ranger hood', price: 180 },
  { id: 'horned-helm', slot: 'hat', name: 'Horned helm', price: 250 },
  { id: 'knight-helm', slot: 'hat', name: 'Knight helm', price: 320, level: 5 },
  { id: 'gold-crown', slot: 'hat', name: 'Gold crown', price: 400, level: 10 },
  { id: 'dragon-helm', slot: 'hat', name: 'Dragon helm', price: 600, level: 20 },
  { id: 'halo', slot: 'hat', name: 'Halo', price: 0, chest: true },
  { id: 'wood-sword', slot: 'weapon', name: 'Wooden sword', price: 50 },
  { id: 'dagger', slot: 'weapon', name: 'Dagger', price: 80 },
  { id: 'staff', slot: 'weapon', name: 'Staff', price: 150 },
  { id: 'lute', slot: 'weapon', name: 'Lute', price: 180 },
  { id: 'bow', slot: 'weapon', name: 'Bow', price: 200 },
  { id: 'battle-axe', slot: 'weapon', name: 'Battle axe', price: 320, level: 5 },
  { id: 'flame-blade', slot: 'weapon', name: 'Flame blade', price: 400, level: 10 },
  { id: 'rune-spear', slot: 'weapon', name: 'Rune spear', price: 600, level: 20 },
  { id: 'crystal-staff', slot: 'weapon', name: 'Crystal staff', price: 0, chest: true },
  { id: 'traveler-cloak', slot: 'cape', name: 'Traveler cloak', price: 80 },
  { id: 'red-cape', slot: 'cape', name: 'Red cape', price: 120 },
  { id: 'fur-mantle', slot: 'cape', name: 'Fur mantle', price: 200 },
  { id: 'royal-cape', slot: 'cape', name: 'Royal cape', price: 300, level: 5 },
  { id: 'feather-cape', slot: 'cape', name: 'Feather cape', price: 380, level: 10 },
  { id: 'starry-cape', slot: 'cape', name: 'Starry cape', price: 500, level: 20 },
  { id: 'dragonwing-cape', slot: 'cape', name: 'Dragonwing cape', price: 650, level: 20 },
  { id: 'shadow-cape', slot: 'cape', name: 'Shadow cape', price: 0, chest: true },
  { id: 'frog', slot: 'pet', name: 'Frog', price: 150 },
  { id: 'slime', slot: 'pet', name: 'Slime', price: 300 },
  { id: 'fox', slot: 'pet', name: 'Fox', price: 350 },
  { id: 'cat', slot: 'pet', name: 'Cat', price: 450 },
  { id: 'little-ghost', slot: 'pet', name: 'Little ghost', price: 550, level: 5 },
  { id: 'baby-dragon', slot: 'pet', name: 'Baby dragon', price: 800, level: 10 },
  { id: 'griffin', slot: 'pet', name: 'Griffin', price: 1000, level: 20 },
  { id: 'phoenix', slot: 'pet', name: 'Phoenix', price: 0, chest: true },
  // Trophies reward showing up over time, never volume: each track is a best-ever or a running total, so a miss can't take one back.
  { id: 'sun-circlet', slot: 'hat', name: 'Sun circlet', price: 0, trophy: { track: 'streak', tier: 2, how: 'Keep one quest going 30 days in a row (STREAK II).' } },
  { id: 'laurel-wreath', slot: 'hat', name: 'Laurel wreath', price: 0, trophy: { track: 'weeks', tier: 2, how: 'Check something off every day of a week, 12 weeks in all (FULL WEEKS II).' } },
  { id: 'flame-crown', slot: 'hat', name: 'Flame crown', price: 0, trophy: { track: 'streak', tier: 3, how: 'Keep one quest going 100 days in a row (STREAK III).' } },
  { id: 'second-wind', slot: 'weapon', name: 'Second Wind', price: 0, trophy: { track: 'comeback', tier: 2, how: 'Come back after a missed day, 10 times (COMEBACK II).' } },
  { id: 'dragonslayer', slot: 'weapon', name: 'Dragonslayer', price: 0, trophy: { track: 'boss', tier: 3, how: 'Beat 20 weekly bosses (BOSS SLAYER III).' } },
  { id: 'starforged-blade', slot: 'weapon', name: 'Starforged blade', price: 0, trophy: { track: 'weeks', tier: 3, how: 'Check something off every day of a week, 40 weeks in all (FULL WEEKS III).' } },
  { id: 'moonlit-cape', slot: 'cape', name: 'Moonlit cape', price: 0, trophy: { track: 'perfect', tier: 2, how: 'Finish every quest 14 days in a row (PERFECT II).' } },
  { id: 'champion-cape', slot: 'cape', name: 'Champion cape', price: 0, trophy: { track: 'perfect', tier: 3, how: 'Finish every quest 30 days in a row (PERFECT III).' } },
  { id: 'ember-cape', slot: 'cape', name: 'Ember cape', price: 0, trophy: { track: 'comeback', tier: 3, how: 'Come back after a missed day, 30 times (COMEBACK III).' } },
  { id: 'loyal-hound', slot: 'pet', name: 'Loyal hound', price: 0, trophy: { track: 'days', tier: 2, how: 'Show up on 100 different days; any check counts, tiny too (SHOW UP II).' } },
  { id: 'wise-owl', slot: 'pet', name: 'Wise owl', price: 0, trophy: { track: 'days', tier: 3, how: 'Show up on 365 different days; any check counts, tiny too (SHOW UP III).' } },
  { id: 'steady-turtle', slot: 'pet', name: 'Steady turtle', price: 0, trophy: { track: 'tiny', tier: 3, how: 'Do the tiny version 200 times: small still counts (TINY HERO III).' } },
];

export const itemById = (id: string) => ITEMS.find((i) => i.id === id);

export const RARITY = { 2: 'EPIC', 3: 'LEGENDARY' } as const;

export const emptyWardrobe = (): Wardrobe => ({ owned: {}, worn: {}, opened: {} });

// Why an item can't be bought right now, or '' if it can.
export function buyBlock(item: Item, level: number, balance: number, w: Wardrobe): string {
  if (w.owned[item.id]) return 'owned';
  if (item.chest) return 'Found only in chests.';
  if (item.trophy) return `Trophy: ${item.trophy.how}`;
  if (item.level && level < item.level) return `Reach level ${item.level} first.`;
  if (balance < item.price) return `Need ${item.price - balance} more gold.`;
  return '';
}

// Worn items that still exist in the catalogue, in drawing order; a trophy shows only while it's earned.
export const wornIds = (w: Wardrobe, trophies: string[]) =>
  SLOTS.map((s) => w.worn[s]).filter((id): id is string => !!id && !!itemById(id) && (!itemById(id)!.trophy || trophies.includes(id)));
