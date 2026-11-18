// 32px outfits, tier trims and wardrobe art for the hero in hero32.ts. Rows are full 32-wide grid rows
// (null = untouched); most are drawn as a 16-column left half and mirrored. Hands sit at row 25, columns 8-9 and 22-23.
// A = outfit color, a = its shade; other letters are palette colors (sprites.ts).

type Rows = (string | null)[];
// back: more rows drawn behind the body (only into empty cells), for a cape that hangs behind but lies over the shoulders.
export type Layer32 = { rows: Rows; behind?: true; cover?: true; back?: Rows };

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

// Lay a mirrored left half over some rows; its '.' cells keep what's there.
const over = (base: Rows, y0: number, half: string[]): Rows =>
  base.map((r, y) => {
    const h = half[y - y0];
    if (h === undefined) return r;
    const row = [...(r ?? '.'.repeat(32))];
    [...M(h)].forEach((c, x) => c !== '.' && (row[x] = c));
    return row.join('');
  });
// Keep a highlight on the left side only, so the light comes from one place.
const lit = (rows: Rows, hi: string, base: string): Rows => rows.map((r) => (r ? r.slice(0, 16) + r.slice(16).replaceAll(hi, base) : r));

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
// Both hug the head (rows 3-18, columns 5-26) one pixel out, so they read as worn rather than perched on top.
// A hood: a rounded crown, a shaded rim around the face, closing under the chin into a collar at the neck.
const hood = (m: string, s: string, hi: string, rim: string): Layer32 => ({
  cover: true,
  rows: lit(at(1, [
    '..........kkkkkk', `........kk${m.repeat(6)}`, `.......k${m}${m}${hi}${m.repeat(5)}`, `......k${m}${hi}${m.repeat(7)}`,
    `.....k${m}${hi}${m.repeat(8)}`, `.....k${m.repeat(10)}`, `....k${m.repeat(11)}`, `....k${m.repeat(4)}${rim.repeat(7)}`,
    `....k${m}${m}${rim}${s.repeat(8)}`, ...Array(4).fill(`....k${m}${m}${s}........`), ...Array(2).fill(`....k${m}${m}${m}${s}.......`),
    `.....k${m}${m}${m}${s}......`, `......k${m}${m}${m}${s}.....`, `.......k${m}${m}${m}kkkkk`, `........k${m.repeat(7)}`,
  ]), hi, m),
});

// A helm: a dome with one shine, a band at the brow, cheek guards over the ears; the face stays open.
const helm = (m: string, s: string, hi: string, band: string): Rows => lit(at(1, [
  '..........kkkkkk', `........kk${m.repeat(6)}`, `.......k${m}${hi}${hi}${m.repeat(5)}`, `......k${m}${hi}${m.repeat(7)}`,
  `.....k${m}${hi}${m.repeat(8)}`, `.....k${m.repeat(10)}`, `....k${s}${m.repeat(10)}`, `....k${band.repeat(11)}`,
  `....k${s}${s}kkkkkkkkk`, ...Array(4).fill(`....k${m}${s}k........`), ...Array(2).fill(`.....k${s}k........`), '......kk........',
]), hi, m);

// Art at a spot, not mirrored: weapons, pets, anything one-sided.
const place = (x: number, y: number, rows: string[], width = 32): Rows => {
  const out: Rows = Array(32).fill(null);
  rows.forEach((r, i) => (out[y + i] = ('.'.repeat(x) + r).padEnd(width, '.').slice(0, width)));
  return out;
};

// ---------- hats that sit on the hair ----------
const HATS: Record<string, Layer32> = {
  'leaf-crown': { rows: at(1, ['.........g..g...', '........gGggGgg.', '.......kGgGgGgGg']) },
  bandana: {
    rows: place(6, 4, [
      '....kkkkkkkkkkkk....',
      '..kkrrrrrrrrrrrrkk..',
      '.krrrrwrrrrrrwrrrrk.',
      '.krprrrrrrprrrrrprrkkk',
      '..kkkkkkkkkkkkkkkkrrrk',
      '..................kprk',
      '...................krrk',
      '....................kk',
    ]),
  },
  'wizard-hat': {
    cover: true,
    rows: place(0, 0, [
      '...................kkkk.........',
      '.................kkbbbbk........',
      '..............kkkbbbbbbyk.......',
      '..........kkkkbbbbbbbbbk........',
      '........kbbbbbbbybbbbbbk........',
      '.......kbbbbbbbbbbbbbbbbk.......',
      '......kyyyyyyyyyyyyyyyyyyk......',
      '.kknnnnnnnnnnnnnnnnnnnnnnnnnnkk.',
      '..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..',
    ]),
  },
  'horned-helm': { cover: true, rows: paint(over(helm('s', 'S', 'w', 'e'), 0, [
    '.k..............', 'kwk.............', 'kwk.............', 'kswk............', '.kswk...........', '..kswk..........', '...kkk..........',
  ]), [[9, 8, 'y'], [13, 8, 'y'], [18, 8, 'y'], [22, 8, 'y']]) },
  'gold-crown': { rows: at(0, ['.........y..y..y', '........kyy.yy.y', '........kyyyyyyy', '........kyrywyry', '........kooooooo', '.........kkkkkkk']) },
  'flame-crown': { rows: at(0, ['.........o..r..o', '........koy.oy.o', '........kyyoyyoy', '........kyyyyyyy', '........krrrrrrr', '.........kkkkkkk']) },
  halo: { rows: at(0, ['..........wCCCCC', '........CC......', '..........CCCCCC']) },
  'sun-circlet': { rows: at(2, ['..............yy', '...........y.yoo', '............yooo', '......yyyyyyyooo', '......kkkkkkkkyy']) },
  'laurel-wreath': { rows: at(2, ['........lgGgGgyy', '......lgG.......', '.....gGl........', '....lGg.........', '....gG..........', '....G...........']) },
};

// ---------- armor, over the outfit and under the weapon ----------
// Pauldrons e (highlight h) cap the arms a pixel wider than the sleeve; the chest has rim m, fill f, a shine w and an emblem g.
const plate = (e: string, h: string, m: string, f: string, w: string, g: string): Layer32 => ({
  rows: at(20, [
    `.......kkkkk${m}${m}${m}${m}`, `......k${e}${h}${h}${e}k${f}${f}${f}${f}`, `......k${e}${e}${e}${e}k${w}${f}${f}${f}`,
    `.......kkkkk${f}${w}${f}${f}`, `..........k${m}${f}${f}${f}${g}`, `...........k${m}${f}${f}${f}`,
  ]),
});
const ARMOR: Record<string, Layer32> = {
  'leather-vest': { rows: at(20, ['........kkkk....', '.......keEEek...', '.......kkkkkeeE.', '..........keeeE.', '..........keeEy.', '..........keeE..']) },
  chainmail: { rows: at(20, ['.......kkkkkkSsS', '......kSsSsSksSs', '......ksSsSsksSs', '.......kkkkkkSsS', '..........ksSsSs', '..........kSsSsS', '..........ksSsSs']) },
  breastplate: plate('S', 's', 'S', 's', 'w', 's'),
  'gilded-plate': plate('o', 'y', 'o', 'y', 'w', 'r'),
  dragonscale: { rows: paint(plate('G', 'g', 'G', 'g', 'l', 'G').rows, [[13, 22, 'G'], [18, 22, 'G'], [14, 24, 'G'], [17, 24, 'G'], [13, 25, 'G'], [18, 25, 'G'], [7, 22, 'l'], [24, 22, 'l']]) },
  'valkyrie-mail': { rows: over(plate('s', 'w', 'S', 's', 'w', 'C').rows, 18, ['.....k..........', '.....kCk........', '......kCk.......']) },
  'bone-mail': { rows: paint(plate('w', 'w', 'p', 'k', 'k', 'v').rows, [[8, 22, 'k'], [10, 22, 'k'], [21, 22, 'k'], [23, 22, 'k'],
    ...[12, 13, 14, 17, 18, 19].flatMap((x) => [[x, 22, 'w'], [x, 24, 'w']] as [number, number, string][])]) },
  'astral-vestment': { rows: paint(plate('n', 'b', 'n', 'b', 'C', 'y').rows, [[9, 22, 'y'], [22, 22, 'y'], [14, 22, 'y'], [17, 22, 'y']]) },
  'slayers-cuirass': { rows: over(plate('r', 'o', 'd', 'd', 'S', 'w').rows, 19, ['......k.........', '......kk........']) },
  'rover-coat': {
    rows: at(20, ['......kyyykrrryw', '.......krrkrrryw', '.......krrkrrrrw', '.......krrkrrryw', '.......kppkrrrrw',
      '..........krrryw', '..........krrrrw', '..........krrrk.', '..........kkkk..']),
  },
  'steadfast-mantle': { rows: at(19, ['...........kkkkk', '.......kklgwwwww', '......kgwwwwwwyy', '.......kgwwwwwwy', '........kkkggggg']) },
};

// ---------- weapons, held in the right hand (columns 22-23, row 25); grips at columns 24-25 ----------
// Blades are 3px (columns 23-25: edge e, then b twice) inside a dark outline; the grip leaves the hand uncovered.
const sword = (top: number, e: string, b: string, g: string, h: string, p: string): Layer32 => ({
  rows: place(21, top, [`...k...`, `..k${e}k..`, ...Array(22 - top - 2).fill(`.k${e}${b}${b}k.`), `k${g.repeat(5)}k`,
    `...${h}${h}k.`, `...${h}${h}k.`, `...${h}${h}k.`, `...${p}${p}..`]),
});
const staff = (head: string[], shaft: string): Layer32 => ({ rows: place(23, 2, [...head, ...Array(30 - head.length).fill(`.${shaft}.`)]) });
const WEAPONS: Record<string, Layer32> = {
  'wood-sword': sword(10, 'o', 'e', 'E', 'p', 'k'),
  dagger: sword(17, 'w', 's', 'y', 'o', 'k'),
  'flame-blade': { rows: paint(sword(8, 'y', 'o', 'r', 'r', 'y').rows, [[22, 10, 'o'], [26, 12, 'r'], [22, 14, 'r'], [26, 16, 'o'], [22, 18, 'o'], [26, 20, 'r'], [27, 11, 'y'], [21, 17, 'y']]) },
  'second-wind': { rows: paint(sword(8, 'w', 'c', 'y', 'r', 'y').rows, [[27, 7, 'C'], [28, 6, 'C'], [21, 11, 'C'], [28, 14, 'C']]) },
  'starforged-blade': { rows: paint(sword(8, 'w', 's', 'y', 'v', 'y').rows, [[24, 5, 'y'], [23, 6, 'y'], [24, 6, 'y'], [25, 6, 'y'], [24, 7, 'y'], [27, 12, 'C'], [21, 17, 'C']]) },
  dragonslayer: {
    rows: place(21, 4, [
      '..kwwk..', ...Array(17).fill('.kwsSk..'), 'kryyyyrk', '...rr...', '...rr...', '...rr...', '..kyyk..',
    ]),
  },
  mace: { rows: place(22, 8, ['...S..', '..SsS.', '.SswsS', '..SsS.', '...S..', ...Array(13).fill('..oe..'), '..kk..']) },
  staff: staff(['.cc.', 'cCCc', 'cCCc', '.cc.'].map((r) => r), 'oe'),
  'crystal-staff': staff(['.CC.', 'CwwC', 'CwCC', 'wCCw', '.CC.'], 'sS'),
  'rune-spear': staff(['.ww.', '.Cw.', 'CwwC', 'CwCC', '.CC.', '.kk.', '.oc.', '.oe.', '.co.', '.oe.', '.oc.'], 'oe'),
  scythe: { rows: place(24, 1, ['oeSSSSs.', 'oe...sSs', 'oe.....s', ...Array(27).fill('oe......')], 32) },
  'battle-axe': { rows: place(24, 6, ['oe.....', 'oeSS...', 'oeSsS..', 'oeSssSk', 'oeSsswk', 'oeSssSk', 'oeSsS..', 'oeSS...', ...Array(14).fill('oe.....')]) },
  flail: { rows: place(24, 6, ['....S..', '...SsS.', '..SswsS', '...SsS.', '....S..', '...k...', '...k...', '..k....', '..k....', '.k.....', 'oe.....', ...Array(10).fill('oe.....'), 'kk.....']) },
  lute: {
    rows: place(21, 10, ['......kk.', '......oe.', '......oe.', '.....oe..', '.....oe..', '.....oe..', '....oe...', '....oe...', '....oe...', '...oooo..', '..oooooo.',
      '.oooookoo', '.ooookkoo', '.oooookoo', '.oooooooo', '..oooooo.', '...oooo..']),
  },
  bow: { rows: place(24, 11, ['.sko.', '.s.oo', '.s..o', ...Array(6).fill('.s..o'), '.s.pp', '.s.pp', ...Array(6).fill('.s..o'), '.s.oo', '.sko.']) },
  crossbow: { rows: place(22, 19, ['........S.', '........s.', '........s.', '........s.', '.oooooooos', 'pk......s.', '........s.', '........s.', '........S.']) },
};

// ---------- capes: over the shoulders, hanging down the back ----------
// The front lies over the shoulders with a clasp t at the collar; the back hangs a little past the arms down to the ankles.
const cape = (m: string, s: string, t: string, hem = t): Layer32 => ({
  rows: at(19, ['..........kk....', `........kk${m}${m}${m}${m}${t}${t}`, `.......k${m}${m}${m}${m}k...`, `.....k${m}${s}k.......`, `.....k${m}k........`]),
  back: at(19, ['..........kk....', `........k${m.repeat(7)}`, `.......k${m.repeat(8)}`, ...Array(2).fill(`.....k${m.repeat(10)}`),
    `.....k${s}${m.repeat(9)}`, ...Array(4).fill(`....k${m}${s}${m.repeat(9)}`), `...k${m}${m}${s}${m.repeat(9)}`, `...k${hem.repeat(12)}`,
    '....kkkkkkkkkkkk']),
});
// Trophy capes: a trim down the outer edge and a deep collar band, so they read grander than any shop cape.
const robe = (m: string, s: string, t: string): Layer32 => {
  const c = cape(m, s, t);
  return {
    rows: over(c.rows, 19, ['.........kkk....', `........k${t.repeat(7)}`, `.......k${t.repeat(5)}k..`]),
    back: over(c.back!, 22, ['.....kT', '.....kT', '.....kT', '....kT', '....kT', '....kT', '....kT', '...kT', '...k' + 'T'.repeat(12)].map((r) => r.replaceAll('T', t))),
  };
};
const fur = cape('S', 's', 'w');
const royal = cape('b', 'n', 'y');
const starry = cape('n', 'b', 'y', 'C');
const shadow = cape('p', 'k', 'r', 'p');
const CAPES: Record<string, Layer32> = {
  'traveler-cloak': cape('G', 'g', 'e', 'S'),
  'red-cape': cape('r', 'p', 'y', 'p'),
  'fur-mantle': { ...fur, rows: over(fur.rows, 19, ['.........kwk....', '........kwwwwwww', '.......kwwwwwk..']) },
  'royal-cape': { ...royal, rows: over(royal.rows, 20, ['........kwwkwwyy', '.......kwkwwwk..']) },
  'starry-cape': { ...starry, back: paint(starry.back!, [[6, 23, 'w'], [25, 25, 'w'], [7, 27, 'y'], [24, 28, 'y'], [6, 29, 'w']]) },
  'shadow-cape': { ...shadow, back: paint(shadow.back!, [[6, 30, 'k'], [25, 30, 'k'], [3, 30, '.'], [4, 30, '.'], [27, 30, '.'], [28, 30, '.'], [9, 30, 'k'], [22, 30, 'k']]) },
  'moonlit-cape': robe('n', 'b', 's'),
  'champion-cape': robe('w', 's', 'y'),
  'ember-cape': robe('r', 'p', 'o'),
};

// ---------- wings: on the back, behind the cape ----------
const wing = (half: string[], y0: number, map: Record<string, string>): Layer32 => ({
  behind: true,
  rows: at(y0, half.map((r) => r.padEnd(16, '.').replace(/[A-Z]/g, (c) => map[c] ?? c))),
});
// Feathered: rows of feathers fanning up and out from the shoulder blades. A main, B shade, C tips.
const FEATHER = ['.kk.............', 'kAAk............', 'kAAAkk..........', 'kAAAAAk.........', 'kBAAAAAk........', 'kBAAAAAAk.......',
  '.kBAAAAAAk......', '.kBABAAAAAk.....', '..kBABAAAAAk....', '..kBBBABAAAk....', '...kBABABAAk....', '...kCkCkCkAk....', '....k.k.k.kk....'];
// Gossamer: a big upper wing and a small lower one. A fill, B veins, C spots.
const GOSSAMER = ['..kkk...........', '.kAAAkk.........', 'kABAAAAk........', 'kAABAAAAk.......', 'kACABAAAAk......', '.kAAABAAAAk.....',
  '..kAAAABAAk.....', '...kkAAAABk.....', '....kAAAAAk.....', '...kABAAAk......', '...kAABAk.......', '....kACk........', '.....kk.........'];
const WINGS: Record<string, Layer32> = {
  'fairy-wings': wing(GOSSAMER, 11, { A: 'C', B: 'w', C: 'w' }),
  'feather-cape': wing(FEATHER, 11, { A: 'w', B: 's', C: 'c' }),
  'butterfly-wings': wing(GOSSAMER, 11, { A: 'v', B: 'p', C: 'y' }),
  'phoenix-wings': wing(FEATHER, 11, { A: 'o', B: 'r', C: 'y' }),
  'dragonwing-cape': {
    behind: true,
    rows: at(12, ['k...............', 'pk..............', 'pvk.............', 'pvvk............', 'pvvpk...........', 'pvvppk..........', 'pvvpppk.........', 'pvvppppkkkkkkkkk',
      'pvvpppppppppppp', 'pvvvpppppppppppp', '.pvvpppppppppppp', '.pvvpppppppppppp', '.pvppppppppppppp', '..pvpppppppppppp', '..pvpppppppppppp', '...pkppppppppppp',
      '...k.kppppppppkp', '......kkkkkkkk.k', '................'].map((r) => r.padEnd(16, 'p').slice(0, 16))),
  },
};

// ---------- pets: 20x20, beside the hero from column 32, feet on the bottom row ----------
export const PET = 20;
// Chibi pets: a left half (10 wide) mirrored, sitting on the bottom row. eye [row, col]: two 2x2 eyes with a
// sparkle top-left; extra: one-sided touches like a tail, as [row, col, color] in the same rows.
const pet = (half: string[], eye: [number, number], extra: [number, number, string][] = [], hl = 'w'): string[] => {
  const top = PET - half.length;
  const g = [...Array(top).fill('.'.repeat(10)), ...half].map((h) => [...M(h)]);
  const y = top + eye[0], c = eye[1];
  for (const [x, w] of [[c, c + 1], [18 - c, 19 - c]]) (g[y][x] = hl, g[y][w] = 'k', g[y + 1][x] = 'k', g[y + 1][w] = 'k');
  for (const [r, x, ch] of extra) g[top + r][x] = ch;
  return g.map((r) => r.join(''));
};
// Side-on pets face left, toward the hero: rows up to 20 wide, sitting on the bottom row.
const side = (rows: string[]): string[] => {
  for (const r of rows) if (r.length > PET) throw new Error(`pet row too wide: ${r}`);
  return [...Array(PET - rows.length).fill(''), ...rows].map((r) => r.padEnd(PET, '.'));
};
export const PETS32: Record<string, string[]> = {
  frog: pet(['...kkkk...', '..kggggk..', '..kgEEgkkk', '.kggEEgggg', '.kgggggggg', 'kgguuggggg', 'kggggggkgg', 'kGggggggkk', '.kGggggggg',
    '.kGgllllll', 'kGGGkGllll', '.kkkk.kkkk'], [2, 4]),
  slime: pet(['......kkkk', '....kkgggg', '...kgggggg', '..kggggggg', '..kggggggg', '.kggEEgggg', '.kggEEgggg', 'kgguuggkgg', 'kgggggggkk',
    'kGgggggggg', 'kGGggggggg', '.kkkkkkkkk'], [5, 4], [[1, 6, 'l'], [1, 7, 'l'], [2, 4, 'l'], [2, 5, 'w'], [3, 3, 'l']]),
  // Sitting, face turned to you: tall ears, white cheeks, slim body, big white-tipped tail.
  fox: side([
    '.k......k',
    '.kok..kok',
    '.kuokkouk',
    'kooooooook',
    'kowkoowkok',
    'kokkookkok',
    'kwwuwwuwwk',
    '.kwwwkwwk',
    '..kwwwwk.........kk',
    '...kowwok.......kwwk',
    '..koowwook.....kowwk',
    '..koowwoook...kooowk',
    '..kooowooook.kooook',
    '..koooooooookoooook',
    '..kokooookoooooook',
    '..kkkkkkkkkkkkkkk',
  ]),
  cat: pet(['.k........', '.kok......', '.kuokkkkkk', '.koooooror', 'kooooooooo', 'kooEEooooo', 'kooEEooooo', 'kouuooooko', 'kooooooook',
    '.koooooooo', '..kkoowwww', '..kowwwwww', '..kowwwwww', '..kooowwww', '..kkkkkkkk'], [5, 3],
    [[8, 19, 'k'], [9, 18, 'k'], [9, 19, 'o'], [10, 18, 'o'], [10, 19, 'k'], [11, 18, 'k']]),
  'little-ghost': pet(['......kkkk', '....kkwwww', '...kwwwwww', '..kwwwwwww', '..kwwwwwww', '.kwwEEwwww', '.kwwEEwwww', '.kwuuwwwww',
    'kwwwwwwwwk', 'kwwwwwwwww', 'kswwwwwwww', 'kswwwwwwww', 'kwwskwwwsk', '.kk.kkk.kk'], [5, 4], [], 'C'),
  // Side-on: two little horns swept back, a round snout, wing up on its back, tail curling behind.
  'baby-dragon': side([
    '.......kk',
    '...kk.kyk',
    '..kykkkyk..kk',
    '.kgggggkk.kGGk',
    'kggggggggkGGGk',
    '.kggwkgggkGGGk',
    'kkggkkgggkGGk',
    'klllguggggkGk',
    '.kkkggggggggk',
    '...kggllllggggk..kk',
    '...kggllllggggkkkgk',
    '....kgllllgggggggk',
    '....kggkkkkggkkkkk',
    '....kGGk...kGGk',
    '....kkkk...kkkk',
  ]),
  // Side-on: eagle head with a hooked beak, wing raised, lion body and a tufted tail.
  griffin: side([
    '...kkkk.....kk',
    '..kwwwwk...kwsk',
    '.kwwwwwwk.kwssk',
    '.kwwkkwwwkwsssk',
    'kyywkkwwwkwsssk',
    'koyywuwwwwkssk',
    '.kkwwwwwyyyyyyk',
    '...kwwyyyyyyyyyk.k',
    '....kyyyyyyyyyyykyk',
    '....kyyyyyyyyyyk.ok',
    '....kyykkkyykkyk.k',
    '....kook...kook',
    '....kkkk...kkkk',
  ]),
  // Side-on and perched: flame crest, wing folded on its side, a long flame tail.
  phoenix: side([
    '...r.r',
    '...ryr',
    '..kkykk',
    '.kyyyyyk',
    'kyyywkyyk',
    'ooyykkyyyk',
    '.kyuyyyyyk',
    '..kyyyoooook',
    '..kyyoorrrrok',
    '..kyyyorrrrrok',
    '...kyyyooooorrk',
    '....kkyyyyokrrrr',
    '.....kk.kk..rorr.r',
    '.....o..o....rryr',
    '..............r.r',
  ]),
  // Side-on: floppy ear, red collar with a gold tag, tail up and wagging.
  // A sitting puppy: big head, floppy ears, red collar with a gold tag, tail wagging.
  'loyal-hound': side([
    '..kkkkkkk',
    '.ksssssssk',
    'kSsssssssSk',
    'kSswksswkSk',
    'kSskksskkSk',
    'kSuwwkwwuSk',
    '.kSwwwwwSk',
    '..kkrrykk',
    '..kssssssk......kk',
    '..ksswwsssk....ksk',
    '..ksswwssssk..ksk',
    '..ksswwsssssksk',
    '..kssssssssssk',
    '..kswwksssssk',
    '..kkkkkkkkkk',
  ]),
  'wise-owl': pet(['.kk.......', '.kSk..kkkk', '.kSskkSsss', 'kSssssssss', 'ksswwwwsss', 'kswwEEwwss', 'kswwEEwwss', 'ksswwwwsso',
    'kSsuusssso', 'kSswwwwwww', 'kSswwSwwww', '.kSswwwwww', '..kSswwwww', '...kkkkkkk', '.....oo...'], [5, 4]),
  // Side-on: a tall patterned shell and a big round head poking out toward you.
  'steady-turtle': side([
    '........kkkkkk',
    '......kkgyyyygkk',
    '.kkkk.kgyggggggygk',
    'kllllkGgyggyyggygGk',
    'kllwklGgyggyyggyGGk',
    'kllkkuGGgyyggyyGGGk',
    'kkllllkGGGGGGGGGGk',
    '.kkkkkGGGGGGGGGGGGkk',
    '....kllk.....kllk',
    '....kllk.....kllk',
    '....kkkk.....kkkk',
  ]),
};
const PETS: Record<string, Layer32> = Object.fromEntries(
  Object.entries(PETS32).map(([id, rows]) => [id, { rows: place(32, 32 - PET, rows, 32 + PET) }]),
);

export const ITEM32: Record<string, Layer32> = {
  ...HATS,
  ...ARMOR,
  ...WEAPONS,
  ...CAPES,
  ...WINGS,
  ...PETS,
  'ranger-hood': hood('g', 'G', 'l', 'G'),
  'bone-cowl': { cover: true, rows: paint(hood('d', 'k', 'S', 'w').rows, [[15, 3, 'w'], [16, 3, 'w'], [14, 4, 'w'], [15, 4, 'k'], [16, 4, 'k'], [17, 4, 'w'],
    [14, 5, 'w'], [15, 5, 'w'], [16, 5, 'w'], [17, 5, 'w'], [15, 6, 'k'], [16, 6, 'k'], [15, 19, 'v'], [16, 19, 'v']]) },
  'astral-hood': { cover: true, rows: paint(hood('n', 'b', 'b', 'C').rows, [[15, 3, 'y'], [16, 3, 'y'], [14, 4, 'y'], [15, 4, 'w'], [16, 4, 'w'], [17, 4, 'y'],
    [15, 5, 'y'], [16, 5, 'y'], [9, 6, 'w'], [22, 4, 'C'], [15, 19, 'y'], [16, 19, 'y']]) },
  'knight-helm': { cover: true, rows: paint(over(helm('s', 'S', 'w', 'y'), 0, ['............rrrr', '..........kkkrrr', '..............rr']),
    [[14, 1, 'r'], [17, 1, 'r'], [8, 10, 'S'], [8, 11, 'S'], [23, 10, 'S'], [23, 11, 'S']]) },
  'dragon-helm': { cover: true, rows: paint(over(helm('g', 'G', 'l', 'G'), 0, [
    '..............l.', '.kk...........k.', 'klgk............', '.klgk...........', '..klgk..........', '...kkk..........',
  ]), [[9, 7, 'y'], [10, 7, 'y'], [21, 7, 'y'], [22, 7, 'y'], [9, 9, 'w'], [12, 9, 'w'], [19, 9, 'w'], [22, 9, 'w'], [15, 3, 'l'], [16, 3, 'l']]) },
  tricorn: {
    cover: true,
    rows: at(1, [
      '..........kkkkkk', '...kk...kkdddddd', '..kdyk.kdddddddd', '..kddykddddddwdd', '..kdddydddddddww', '...kddddyyyyyyyy',
      '....kkdddddddddd', '......kkkkkkkkkk',
    ]),
  },
  'winged-helm': { cover: true, rows: paint(over(helm('s', 'S', 'w', 'y'), 1, [
    'k...............', 'kwk.............', 'kwwk............', '.kwwk...........', '.kswwk..........', '..kswwk.........', '...kssk.........', '....kk..........',
  ]), [[15, 8, 'C'], [16, 8, 'C']]) },
};
