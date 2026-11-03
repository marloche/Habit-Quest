import type { Slot, Wardrobe } from './types';

// level: locked until then. chest: never sold, only found in chests.
export type Item = { id: string; slot: Slot; name: string; price: number; level?: number; chest?: true };

export const SLOTS: Slot[] = ['hat', 'weapon', 'cape', 'pet'];

export const ITEMS: Item[] = [
  { id: 'leaf-crown', slot: 'hat', name: 'Leaf crown', price: 60 },
  { id: 'wizard-hat', slot: 'hat', name: 'Wizard hat', price: 150 },
  { id: 'horned-helm', slot: 'hat', name: 'Horned helm', price: 250 },
  { id: 'gold-crown', slot: 'hat', name: 'Gold crown', price: 400, level: 10 },
  { id: 'halo', slot: 'hat', name: 'Halo', price: 0, chest: true },
  { id: 'wood-sword', slot: 'weapon', name: 'Wooden sword', price: 50 },
  { id: 'staff', slot: 'weapon', name: 'Staff', price: 150 },
  { id: 'bow', slot: 'weapon', name: 'Bow', price: 200 },
  { id: 'flame-blade', slot: 'weapon', name: 'Flame blade', price: 400, level: 10 },
  { id: 'crystal-staff', slot: 'weapon', name: 'Crystal staff', price: 0, chest: true },
  { id: 'red-cape', slot: 'cape', name: 'Red cape', price: 120 },
  { id: 'royal-cape', slot: 'cape', name: 'Royal cape', price: 300, level: 5 },
  { id: 'starry-cape', slot: 'cape', name: 'Starry cape', price: 500, level: 20 },
  { id: 'shadow-cape', slot: 'cape', name: 'Shadow cape', price: 0, chest: true },
  { id: 'slime', slot: 'pet', name: 'Slime', price: 300 },
  { id: 'cat', slot: 'pet', name: 'Cat', price: 450 },
  { id: 'baby-dragon', slot: 'pet', name: 'Baby dragon', price: 800, level: 10 },
  { id: 'phoenix', slot: 'pet', name: 'Phoenix', price: 0, chest: true },
];

export const itemById = (id: string) => ITEMS.find((i) => i.id === id);

export const emptyWardrobe = (): Wardrobe => ({ owned: {}, worn: {}, opened: {} });

// Why an item can't be bought right now, or '' if it can.
export function buyBlock(item: Item, level: number, balance: number, w: Wardrobe): string {
  if (w.owned[item.id]) return 'owned';
  if (item.chest) return 'Found only in chests.';
  if (item.level && level < item.level) return `Reach level ${item.level} first.`;
  if (balance < item.price) return `Need ${item.price - balance} more gold.`;
  return '';
}

// Worn items that still exist in the catalogue, in drawing order.
export const wornIds = (w: Wardrobe) => SLOTS.map((s) => w.worn[s]).filter((id): id is string => !!id && !!itemById(id));
