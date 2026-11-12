// 32px outfits, tier trims and wardrobe art for the hero in hero32.ts. Rows are full 32-wide grid rows
// (null = untouched); most are drawn as a 16-column left half and mirrored. Hands sit at row 25, columns 8-9 and 22-23.
// A = outfit color, a = its shade; other letters are palette colors (sprites.ts).

type Rows = (string | null)[];
export type Layer32 = { rows: Rows; behind?: true; cover?: true };

const M = (l: string) => l + [...l].reverse().join('');
const at = (y0: number, rows: string[], mirror = true): Rows => {
  const out: Rows = Array(32).fill(null);
  rows.forEach((r, i) => (out[y0 + i] = mirror ? M(r) : r));
  return out;
};
// Recolor cells of some rows, for the asymmetric touches (a bandolier, a two-tone doublet).
const paint = (rows: Rows, cells: [number, number, string][]): Rows => {
  const out = rows.map((r) => (r ? [...r] : null));
  for (const [x, y, c] of cells) if (out[y]) out[y]![x] = c;
  return out.map((r) => (r ? r.join('') : null));
};

const NECK = '............kfff';
const LEGS = (p: string, b: string) => [`.........kk${p}${p}${p}kk`, `..........k${p}${p}${p}k.`, `.........k${b}${b}${b}${b}k.`, '.........kkkkkk.'];

// ---------- outfits (GARBS order) ----------
const TUNIC = at(19, [NECK,
  '.........kkAAaAf', '........kAAAAAaA', '.......kAAkAAAAA', '.......kAAkAAAAA', '.......kaAkAAAAA', '.......kffkaAAAA',
  '........kkkEEEEy', '.........kAAAAAA', ...LEGS('a', 'E')]);

const ROBE = at(19, [NECK,
  '.........kkAAAaa', '........kAAAAAaA', '.......kAAkAAAaA', '.......kAAkAAAaA', '......kAAAkAAAaA', '......kaffkAAAaA',
  '.......kkkkyyyyy', '.........kAAAAaA', '.........kAAAAaA', '........kAAAAAaA', '........kaaaaaaa', '........kkkkkkkk']);

const LEATHERS = paint(at(19, [NECK,
  '.........kkAAAAA', '........kAAAAAAA', '.......kAAkAAAAA', '.......kAAkAAAAA', '.......kaakAAAAA', '.......kffkaAAAA',
  '........kkkEEEEE', '.........kaaaaaa', ...LEGS('a', 'E')]),
  [[12, 20, 'E'], [13, 20, 'E'], [13, 21, 'E'], [14, 21, 'E'], [14, 22, 'E'], [15, 22, 'E'], [15, 23, 'E'], [16, 23, 'E'],
    [16, 24, 'E'], [17, 24, 'E'], [17, 25, 'E'], [18, 25, 'E'], [14, 26, 'y'], [15, 26, 'y']]);

const TABARD = at(19, [NECK,
  '.........kkSSAAA', '........kSSsAwwA', '.......kssksAwwA', '.......kssksAAAA', '.......kssksAwwA', '.......kffksAwwA',
  '........kkkyyyyy', '.........ksAAwwA', ...LEGS('S', 'S')]);

const JERKIN = at(19, [NECK,
  '.........kkaaaAA', '........kaaaaAAk', '.......kaakaaAAA', '.......kaakaaAAk', '.......kaakaaAAA', '.......kffkaaAAk',
  '........kkkkkkkS', '.........kaaaaaa', ...LEGS('d', 'E')]);

// Two-tone: the right half swaps the outfit color and its shade.
const DOUBLET = ((): Rows => {
  const rows = at(19, [NECK,
    '.........kkAAAAA', '........kAAAAAAA', '.......kAAkAAAAA', '.......kAAkAAAAA', '.......kaakaaaaa', '.......kffkaaaaa',
    '........kkkkkkky', '.........kAaAaAa', '.........kkAaAkk', '..........kAaAk.', '.........kEEEEk.', '.........kkkkkk.']);
  return rows.map((r, y) => (r && y >= 20 && y <= 29 ? r.slice(0, 16) + [...r.slice(16)].map((c) => (c === 'A' ? 'a' : c === 'a' ? 'A' : c)).join('') : r));
})();

const WRAP = at(19, [NECK,
  '.........kkAAAff', '........kAAAAAff', '.......kAAkAAAAf', '.......kAAkAAAAA', '.......kAAkAAAAA', '.......kffkAAAAA',
  '........kkkooooo', '.........kAAAAAA', '.........kkaaakk', '..........kaAak.', '.........kffffk.', '.........kkkkkk.']);

const SCALE = at(19, [NECK,
  '.........kkyyyyy', '........kAaAaAaA', '.......kAAkaAaAa', '.......kAAkAaAaA', '.......kaakaAaAa', '.......kffkAaAaA',
  '........kkkyyyyy', '.........kaAaAaA', ...LEGS('S', 'S')]);

const BONE_ROBE = at(19, [NECK,
  '.........kkAAAAA', '........kAAwwwwA', '.......kAAkAAAAA', '.......kAAkAwwwA', '......kAAAkAAAAA', '......kaffkAAwwA',
  '.......kkkkvvvvv', '.........kAAAAAA', '.........kAAAAAA', '........kAAAAAAA', '........kaaaaaaa', '........kkkkkkkk']);

const LEAF_ROBE = at(19, [NECK,
  '.........glgAAAA', '........kglAAAgA', '.......kAAkAAGAA', '.......kAAkAgAAA', '......kAAAkAAAGA', '......kaffkAAAAA',
  '.......kkkkgGgGg', '.........kAAAAAA', '.........kAAAGAA', '........kAAAAAAA', '........kGlGlGlG', '........kkkkkkkk']);

const SAILOR = at(19, [NECK,
  '.........kkwwwww', '........kAAAAwwA', '.......kwwkwwwww', '.......kAAkAAAAA', '.......kwwkwwwww', '.......kffkAAAAA',
  '........kkkrrrrr', '.........kdddddd', ...LEGS('d', 'E')]);

export const GARBS32: Rows[] = [TUNIC, ROBE, LEATHERS, TABARD, JERKIN, DOUBLET, WRAP, SCALE, BONE_ROBE, LEAF_ROBE, SAILOR];

// ---------- tier trims ----------
const pads = (m: string, hi: string): Layer32 => ({ rows: at(19, ['........kkkk....', `.......k${hi}${m}${m}k....`, `.......k${m}${m}${m}${m}k...`]) });
const BELT32: Layer32 = { rows: at(26, ['...........yyyyo']) };
export const TRIMS32: Record<string, Layer32[]> = {
  Squire: [],
  Knight: [pads('S', 's')],
  Champion: [pads('o', 'y'), BELT32],
  Legend: [pads('y', 'C'), BELT32], // and glowing eyes (sprites.ts)
};

// ---------- headwear that hides the hair above the brow ----------
// A hood: crown, a brim over the brow, sides down past the cheeks to the shoulders; the face shows through.
const hood = (m: string, s: string, hi: string, brim: string): Layer32 => ({
  cover: true,
  rows: at(1, [
    '..........kkkkkk', `........kk${m.repeat(6)}`, `.......k${m.repeat(8)}`, `......k${m.repeat(9)}`, `.....k${m.repeat(3)}${hi}${m.repeat(6)}`,
    `.....k${m.repeat(10)}`, `....k${m.repeat(4)}${brim}`, ...Array(8).fill(`....k${m.repeat(3)}${s}.......`),
    `....k${m.repeat(4)}${s}......`, `.....k${m.repeat(4)}${s}${s}....`, `.....k${m.repeat(5)}${s}${s}...`, `....k${m.repeat(8)}...`, '.....kkkkkkkk...',
  ]),
});

export const ITEM32: Record<string, Layer32> = {
  'ranger-hood': hood('g', 'G', 'l', 'GGGGGGG'),
  'bone-cowl': hood('p', 'k', 'v', 'wpwwpww'),
  'astral-hood': { cover: true, rows: paint(hood('n', 'b', 'b', 'CCCCCCC').rows, [[15, 1, 'y'], [16, 1, 'y'], [15, 2, 'y'], [16, 2, 'y'], [14, 2, 'y'], [17, 2, 'y']]) },
  'knight-helm': {
    cover: true,
    rows: at(0, [
      '..............rr', '..........kkkkrr', '........kkSSSSSS', '.......kSSsssSSS', '......kSSssSSSSS', '.....kSSsSSSSSSS',
      '.....kSSSSSSSSSS', '.....kSSSSSSSSSS', '.....kSyyyyyyyyy', '.....kSSk......S', '.....kSSk......S', '.....kSSk......S',
      '.....kSSk......S', '.....kSSk......S', '.....kSSk.......', '.....kSSk.......', '......kSk.......', '.......k........',
    ]),
  },
  'dragon-helm': {
    cover: true,
    rows: at(0, [
      '..l.............', '..ll......kkkkkk', '...ll...kkgggggg', '....llkgggGggggg', '.....lkggGggyggg', '.....kgggggggggg',
      '.....kgGgGgGgGgG', '.....kgggggggggg', '.....kGGGGGGGGGG', '.....kggk...w...', '.....kggk.......', '.....kggk.......',
      '.....kggk.......', '.....kggk.......', '.....kggk.......', '......kgk.......', '.......k........',
    ]),
  },
  tricorn: {
    cover: true,
    rows: at(1, [
      '..........kkkkkk', '...kk...kkdddddd', '..kdyk.kdddddddd', '..kddykddddddwdd', '..kdddydddddddww', '...kddddyyyyyyyy',
      '....kkdddddddddd', '......kkkkkkkkkk',
    ]),
  },
  'winged-helm': {
    cover: true,
    rows: at(1, [
      '..........kkkkkk', 'kw......kkSSSSSS', 'kww....kSSsssSSS', '.kww..kSSssSSSSS', '.kwww.kSsSSSSSSS', '..kwwwkSSSSSSSSS',
      '...kwwkSSSSSSSSS', '....kwkyyyyyyyyy', '.....kk.........',
    ]),
  },
};
