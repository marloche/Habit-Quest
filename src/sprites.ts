import { CLASSIC, EYES, HAIRS, OUTFITS, SKINS } from './logic/look.ts'; // .ts: scripts/make-icons.mjs loads this file in plain Node
import type { Look } from './logic/types';
import { compose } from './hero32.ts';
import { GARBS32, ITEM32, PETS32, TRIMS32, type Layer32 } from './art32.ts';

// Pixel art as rows of palette letters ('.' = transparent), rendered to crisp SVG.
export const PAL: Record<string, string> = {
  k: '#1a1c2c', p: '#5d275d', r: '#b13e53', o: '#ef7d57', y: '#ffcd75', l: '#a7f070', g: '#38b764', G: '#257179',
  n: '#29366f', b: '#3b5dc9', c: '#41a6f6', C: '#73eff7', w: '#f4f4f4', s: '#94b0c2', S: '#566c86', d: '#333c57',
  f: '#e8b796', v: '#9b5fc0', e: '#8a5a36', E: '#5c3a28', u: '#f08ca0', // u: blush, on the hero and the pets
};

export const COIN = ['..yyyy..', '.yyoyyy.', 'yyyoyyyy', 'yyyoyyyy', 'yyyoyyyy', 'yyyoyyyy', '.yyoyyy.', '..yyyy..'];

export const ICONS: Record<string, string[]> = {
  sword: ['......ws', '.....wsS', '....wsS.', '.y.wsS..', '..ySS...', '..ry....', '.r..y...', 'r.......'],
  book: ['........', '.bbbbbb.', '.bwwwwb.', '.bwkkwb.', '.bwwwwb.', '.bwkkwb.', '.bbbbbb.', '........'],
  drop: ['...cc...', '...cc...', '..cCcc..', '..cCcc..', '.cCcccc.', '.cCcccc.', '.ccccbc.', '..cbbc..'],
  heart: ['........', '.rr..rr.', 'rorrrrrr', 'rorrrrrr', 'rrrrrrrr', '.rrrrrr.', '..rrrr..', '...rr...'],
  star: ['...yy...', '...yy...', 'yyyyyyyy', '.yyyyyy.', '..yyyy..', '..yyyy..', '.yy..yy.', '.y....y.'],
  moon: ['...yyy..', '..yy....', '.yy.....', '.yy.....', '.yy.....', '.yy.....', '..yy....', '...yyy..'],
  leaf: ['.....gg.', '...gggg.', '..gggGg.', '.ggGgg..', '.gGggg..', '.Gggg...', 'G.......', '........'],
  dumbbell: ['........', 'SS....SS', 'SS....SS', 'SSssssSS', 'SS....SS', 'SS....SS', '........', '........'],
  pen: ['.....www', '....wwsw', '....wsw.', '...wsw..', '..ks....', '.nkn....', 'nbbbn...', 'nnnnn...'], // a quill in an ink pot, so it can't pass for the sword
  apple: ['....g...', '...g....', '.rrrrr..', 'rrwrrrr.', 'rwrrrrr.', 'rrrrrrr.', 'rrrrrrr.', '.rr.rr..'],
  coin: COIN,
};

// An epic quest's crest: a shield in its color (a palette letter) with its icon on a dark field.
const SHIELD = ['kkkkkkkkkkkk', 'kAAAAAAAAAAk', ...Array(8).fill('kAddddddddAk'), 'kAAAAAAAAAAk', '.kAAAAAAAAk.', '..kAAAAAAk..', '...kAAAAk...', '....kAAk....', '.....kk.....'];
export const crestRows = (iconName: string, color: string) =>
  SHIELD.map((row, y) => [...row].map((ch, x) => {
    const px = y >= 2 && y < 10 && x >= 2 && x < 10 ? (ICONS[iconName] ?? ICONS.star)[y - 2][x - 2] : '.';
    return px !== '.' ? px : ch === 'A' ? color : ch;
  }).join(''));
export const crest = (iconName: string, color: string, size = 32, label = '') => svg(crestRows(iconName, color), size, label);

export const CHEST = ['........', '.oooooo.', 'oooooooo', 'yyyyyyyy', 'oooyyooo', 'oooyyooo', 'oooooooo', '.oooooo.'];

// Mood faces 1-5 (awful to great); 'm' is the mood's own color.
export const MOOD_COLOR = ['#b13e53', '#ef7d57', '#ffcd75', '#a7f070', '#38b764'];
const face = (a: string, b: string) => ['..mmmm..', '.mmmmmm.', 'mmkmmkmm', 'mmmmmmmm', a, b, '.mmmmmm.', '..mmmm..'];
const FACES = [
  face('mmkkkkmm', 'mkmmmmkm'),
  face('mmmkkmmm', 'mmkmmkmm'),
  face('mmmmmmmm', 'mmkkkkmm'),
  face('mmkmmkmm', 'mmmkkmmm'),
  face('mkmmmmkm', 'mmkkkkmm'),
];
export const moodFace = (mood: number, size = 24) => svg(FACES[mood - 1], size, '', { ...PAL, m: MOOD_COLOR[mood - 1] });

export const HOURGLASS = ['oooooooo', '.CyyyyC.', '..CyyC..', '...CC...', '...CC...', '..CyyC..', '.CyyyyC.', 'oooooooo'];

export const SUNRISE = ['...yy...', '.y.yy.y.', '..yyyy..', 'y.yyyy.y', '.yyyyyy.', 'oooooooo', 'rrrrrrrr', '........'];
export const CALENDAR = ['.S....S.', 'rrrrrrrr', 'wwwwwwww', 'wgwgwgww', 'wwwwwwww', 'wgwgwgww', 'wwwwwwww', '........'];

export const FLAME = ['...o....', '...oo...', '..ooy...', '..oyyo..', '.ooyyoo.', '.oyyyyo.', '.oyyyyo.', '..oyyo..'];

// Your colors stay yours; each tier adds trim on top (TRIMS32 in art32.ts) so the hero still visibly grows.
const TIERS: { from: number; title: string }[] = [
  { from: 1, title: 'Squire' },
  { from: 5, title: 'Knight' },
  { from: 10, title: 'Champion' },
  { from: 20, title: 'Legend' }, // and glowing eyes (hero below)
];

export const tierOf = (level: number) => [...TIERS].reverse().find((t) => level >= t.from)!;
export const nextTier = (level: number) => TIERS.find((t) => t.from > level);
// "MARLO THE SQUIRE", or just "SQUIRE" without a name.
export const titleOf = (level: number, look?: Look) => (look?.name ? `${look.name} the ${tierOf(level).title}` : tierOf(level).title);

export function svg(rows: string[], size: number, label = '', pal: Record<string, string> = PAL): string {
  let rects = '';
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const ch = row[x];
      let w = 1;
      while (row[x + w] === ch) w++;
      if (ch !== '.') rects += `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${pal[ch]}"/>`;
      x += w;
    }
  });
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  // size is the height; wide art (a hero with a pet) keeps its pixels square.
  return `<svg ${a11y} viewBox="0 0 ${rows[0].length} ${rows.length}" width="${(size * rows[0].length) / rows.length}" height="${size}" shape-rendering="crispEdges">${rects}</svg>`;
}

export const icon = (name: string, size = 24) => svg(ICONS[name] ?? ICONS.star, size);

// Pets stand right of the hero, from column 32.
export const petOf = (worn: string[]) => worn.find((id) => PETS32[id]);

function stamp32(grid: string[][], l: Layer32) {
  l.rows.forEach((row, y) =>
    row && [...row].forEach((ch, x) => {
      if (ch !== '.' && grid[y] && x < grid[y].length && (!l.behind || grid[y][x] === '.')) grid[y][x] = ch;
    }));
}

const hex2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
const rgb = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const shade = (c: string, k: number) => '#' + rgb(c).map((v) => hex2(v * k)).join('');
const mix = (a: string, b: string, t: number) => '#' + rgb(a).map((v, i) => hex2(v + (rgb(b)[i] - v) * t)).join('');

// The hero's own colors: skin, hair and eyes with their shades, outfit, blush.
export function lookPal(look: Look, glow = false): Record<string, string> {
  const s = SKINS[look.skin].c, h = HAIRS[look.hair].c, outfit = OUTFITS[look.outfit];
  return {
    ...PAL, f: s, F: shade(s, 0.85), x: shade(s, 0.7), h, H: shade(h, 0.68), j: mix(h, '#ffffff', 0.35), z: mix(s, shade(h, 0.6), 0.6),
    A: outfit.c, a: outfit.d!, Q: glow ? '#73eff7' : shade(EYES[look.eye ?? 0].c, 0.62), X: '#a0404a',
  };
}

// noPet: leave the pet's space empty, for a pet drawn on its own on top.
export function hero(level: number, size = 64, worn: string[] = [], look: Look = CLASSIC, noPet = false) {
  const t = tierOf(level);
  const ids = worn.filter((id) => ITEM32[id]);
  const width = ids.some((id) => PETS32[id]) ? 48 : 32;
  const shown = noPet ? ids.filter((id) => !PETS32[id]) : ids;
  const grid = compose(look, GARBS32[look.garb ?? 0] ?? GARBS32[0], width, shown.some((id) => ITEM32[id].cover));
  for (const l of TRIMS32[t.title]) stamp32(grid, l);
  for (const id of shown) stamp32(grid, ITEM32[id]);
  return svg(grid.map((r) => r.join('')), size, `Level ${level} ${titleOf(level, look)}`, lookPal(look, t.title === 'Legend'));
}

// Just the head and shoulders, bigger, for the hair and face pickers.
export function heroHead(look: Look, size = 48) {
  const grid = compose(look, GARBS32[look.garb ?? 0] ?? GARBS32[0]);
  return svg(grid.slice(0, 26).map((r) => r.join('')), size, '', lookPal(look));
}
