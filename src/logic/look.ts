import type { Look } from './types';

// Saves store each part as an index into these lists, so only ever append to them.
export type Swatch = { name: string; c: string; d?: string }; // d: the darker shade (outfits)

export const SKINS: Swatch[] = [
  { name: 'Porcelain', c: '#f7dcc4' },
  { name: 'Peach', c: '#e8b796' },
  { name: 'Tan', c: '#d49a6a' },
  { name: 'Bronze', c: '#b0764a' },
  { name: 'Brown', c: '#8a5536' },
  { name: 'Deep', c: '#5c3a28' },
];

export const STYLES = ['Short', 'Long', 'Ponytail', 'Spiky', 'Bun', 'Bald'];

export const HAIRS: Swatch[] = [
  { name: 'Ginger', c: '#ef7d57' },
  { name: 'Brown', c: '#7a4b2a' },
  { name: 'Black', c: '#3a2e40' },
  { name: 'Blonde', c: '#ffcd75' },
  { name: 'White', c: '#f4f4f4' },
  { name: 'Red', c: '#b13e53' },
  { name: 'Blue', c: '#41a6f6' },
  { name: 'Purple', c: '#9b5fc0' },
];

export const OUTFITS: Swatch[] = [
  { name: 'Moss', c: '#38b764', d: '#257179' },
  { name: 'Royal', c: '#3b5dc9', d: '#29366f' },
  { name: 'Crimson', c: '#b13e53', d: '#5d275d' },
  { name: 'Frost', c: '#73eff7', d: '#41a6f6' },
  { name: 'Ember', c: '#ef7d57', d: '#b13e53' },
  { name: 'Steel', c: '#94b0c2', d: '#566c86' },
  { name: 'Arcane', c: '#9b5fc0', d: '#5d275d' },
  { name: 'Shadow', c: '#566c86', d: '#333c57' },
];

export const PARTS: Record<keyof Look, number> = { skin: SKINS.length, style: STYLES.length, hair: HAIRS.length, outfit: OUTFITS.length };

// The original hero; saves without a look draw this.
export const CLASSIC: Look = { skin: 1, style: 0, hair: 0, outfit: 0 };

export const PRESETS: { name: string; look: Look }[] = [
  { name: 'Squire', look: CLASSIC },
  { name: 'Ranger', look: { skin: 2, style: 2, hair: 1, outfit: 5 } },
  { name: 'Mage', look: { skin: 0, style: 1, hair: 4, outfit: 6 } },
  { name: 'Paladin', look: { skin: 3, style: 0, hair: 3, outfit: 1 } },
  { name: 'Rogue', look: { skin: 4, style: 3, hair: 2, outfit: 7 } },
  { name: 'Bard', look: { skin: 1, style: 4, hair: 5, outfit: 2 } },
  { name: 'Monk', look: { skin: 5, style: 5, hair: 2, outfit: 4 } },
  { name: 'Valkyrie', look: { skin: 0, style: 1, hair: 3, outfit: 3 } },
];

export const sameLook = (a: Look, b: Look) => (Object.keys(PARTS) as (keyof Look)[]).every((k) => a[k] === b[k]);

export const randomLook = (r = Math.random): Look => ({
  skin: Math.floor(r() * PARTS.skin),
  style: Math.floor(r() * PARTS.style),
  hair: Math.floor(r() * PARTS.hair),
  outfit: Math.floor(r() * PARTS.outfit),
});
