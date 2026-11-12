import type { Look, LookPart } from './types';

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

export const STYLES = ['Short', 'Long', 'Ponytail', 'Spiky', 'Bun', 'Bald', 'Wolf cut', 'Mullet', 'Curtains', 'Undercut', 'Braid', 'Long wavy',
  'Pigtails', 'Twin tails', 'Afro', 'Big curls', 'Locs', 'Mohawk', 'Buzz', 'Bob', 'Bedhead', 'Side part'];

// Dot eyes take this color, darkened (sprites.ts).
export const EYES: Swatch[] = [
  { name: 'Brown', c: '#7a4b2a' },
  { name: 'Hazel', c: '#a08040' },
  { name: 'Green', c: '#38b764' },
  { name: 'Blue', c: '#3b5dc9' },
  { name: 'Gray', c: '#7a8a9a' },
  { name: 'Amber', c: '#e09a30' },
  { name: 'Violet', c: '#9b5fc0' },
  { name: 'Ruby', c: '#b13e53' },
];
export const FACES = ['Calm', 'Grin', 'Determined', 'Sleepy'];
export const BEARDS = ['None', 'Stubble', 'Beard', 'Mustache', 'Goatee'];
export const MARKS = ['None', 'Freckles', 'Scar', 'War paint'];

export const NAME_MAX = 12;
export const validName = (n: unknown) => typeof n === 'string' && n.length >= 1 && n.length <= NAME_MAX && n.trim() === n && !/[\x00-\x1f]/.test(n);
// Typed text to a name, or undefined to clear it.
export const cleanName = (t: string) => t.replace(/\s+/g, ' ').replace(/[\x00-\x1f]/g, '').trim().slice(0, NAME_MAX).trim() || undefined;

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
  { name: 'Leather', c: '#8a5a36', d: '#5c3a28' },
  { name: 'Ivory', c: '#e8dcc0', d: '#b8a37a' },
  { name: 'Midnight', c: '#29366f', d: '#1a1c2c' },
  { name: 'Forest', c: '#257179', d: '#1a4b50' },
];

// Outfit shapes (GARBS in sprites.ts); the outfit color paints whichever one you wear.
export const GARBS = ['Tunic', 'Robe', 'Leathers', 'Tabard', 'Jerkin', 'Doublet', 'Wrap', 'Scale', 'Bone robe', 'Leaf robe', 'Sailor'];

export const PARTS: Record<LookPart, number> = {
  skin: SKINS.length, style: STYLES.length, hair: HAIRS.length, outfit: OUTFITS.length, garb: GARBS.length,
  eye: EYES.length, beard: BEARDS.length, mark: MARKS.length, face: FACES.length,
};
// The parts every saved look has; the rest came later and may be missing.
export const CORE = { skin: 1, style: 1, hair: 1, outfit: 1 };

// The original hero; saves without a look draw this.
export const CLASSIC: Look = { skin: 1, style: 0, hair: 0, outfit: 0 };

export const PRESETS: { name: string; look: Look }[] = [
  { name: 'Squire', look: CLASSIC },
  { name: 'Ranger', look: { skin: 2, style: 2, hair: 1, outfit: 8, garb: 2 } },
  { name: 'Mage', look: { skin: 0, style: 1, hair: 4, outfit: 6, garb: 1 } },
  { name: 'Paladin', look: { skin: 3, style: 0, hair: 3, outfit: 1, garb: 3 } },
  { name: 'Rogue', look: { skin: 4, style: 3, hair: 2, outfit: 7, garb: 4 } },
  { name: 'Bard', look: { skin: 1, style: 4, hair: 5, outfit: 2, garb: 5 } },
  { name: 'Monk', look: { skin: 5, style: 5, hair: 2, outfit: 4, garb: 6 } },
  { name: 'Valkyrie', look: { skin: 0, style: 1, hair: 3, outfit: 5, garb: 7 } },
  { name: 'Necromancer', look: { skin: 0, style: 5, hair: 2, outfit: 10, garb: 8 } },
  { name: 'Druid', look: { skin: 4, style: 1, hair: 5, outfit: 11, garb: 9 } },
  { name: 'Pirate', look: { skin: 2, style: 2, hair: 2, outfit: 2, garb: 10 } },
];

// A look without a garb wears the tunic (garb 0), so it matches a preset that says garb 0 or nothing.
export const sameLook = (a: Look, b: Look) => (Object.keys(PARTS) as LookPart[]).every((k) => (a[k] ?? 0) === (b[k] ?? 0));

export const randomLook = (r = Math.random): Look => ({
  skin: Math.floor(r() * PARTS.skin),
  style: Math.floor(r() * PARTS.style),
  hair: Math.floor(r() * PARTS.hair),
  outfit: Math.floor(r() * PARTS.outfit),
  garb: Math.floor(r() * PARTS.garb),
  eye: Math.floor(r() * PARTS.eye),
  beard: r() < 0.7 ? 0 : Math.floor(r() * PARTS.beard), // most random heroes are clean-shaven
  mark: Math.floor(r() * PARTS.mark),
  face: Math.floor(r() * PARTS.face),
});
