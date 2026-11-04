import { CLASSIC, HAIRS, OUTFITS, SKINS } from './logic/look.ts'; // .ts: scripts/make-icons.mjs loads this file in plain Node
import type { Look } from './logic/types';

// Pixel art as rows of palette letters ('.' = transparent), rendered to crisp SVG.
export const PAL: Record<string, string> = {
  k: '#1a1c2c', p: '#5d275d', r: '#b13e53', o: '#ef7d57', y: '#ffcd75', l: '#a7f070', g: '#38b764', G: '#257179',
  n: '#29366f', b: '#3b5dc9', c: '#41a6f6', C: '#73eff7', w: '#f4f4f4', s: '#94b0c2', S: '#566c86', d: '#333c57',
  f: '#e8b796', v: '#9b5fc0',
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

export const FLAME = ['...o....', '...oo...', '..ooy...', '..oyyo..', '.ooyyoo.', '.oyyyyo.', '.oyyyyo.', '..oyyo..'];

// f = skin, h = hair, A/a = outfit and its shade: all come from your look. Head rows 0-6 per hair style (STYLES order).
const SHORT = ['......kkkk......', '.....khhhhk.....', '....khhhhhhk....'];
const FACE = ['....kffffffk....', '....kfkffkfk....', '....kffffffk....', '.....kffffk.....'];
export const HEADS = [
  [...SHORT, ...FACE],
  [...SHORT, '...khffffffhk...', '...khfkffkfhk...', '...khffffffhk...', '...khhffffhhk...'],
  [SHORT[0], SHORT[1], '....khhhhhhkk...', '....kffffffkhk..', '....kfkffkfkhk..', '....kffffffk.hk.', '.....kffffk..k..'],
  ['....hh.h..hh....', '...khhhhhhhhk...', '..hkhhhhhhhhkh..', ...FACE], // uneven tips, or blonde reads as a crown
  ['......khhk......', SHORT[1], SHORT[2], ...FACE],
  ['................', SHORT[0], '....kkffffkk....', ...FACE],
];
export const BODY = [
  '....kAAAAAAk....',
  '...kfAAaaAAfk...',
  '...kfAAAAAAfk...',
  '....kAAAAAAk....',
  '....kaaaaaak....',
  '....kAAkkAAk....',
  '....kAAkkAAk....',
  '....kkk..kkk....',
  '................',
];

// Your colors stay yours; each tier adds trim on top so the hero still visibly grows.
const pads = (a: string, b: string): Layer => ({ x: 3, y: 7, rows: [`${a}${b}......${b}${a}`] });
const BELT: Layer = { x: 5, y: 11, rows: ['yyooyy'] };
const TIERS: { from: number; title: string; trim: Layer[] }[] = [
  { from: 1, title: 'Squire', trim: [] },
  { from: 5, title: 'Knight', trim: [pads('S', 's')] },
  { from: 10, title: 'Champion', trim: [pads('o', 'y'), BELT] },
  { from: 20, title: 'Legend', trim: [pads('y', 'C'), BELT, { x: 6, y: 4, rows: ['C..C'] }] },
];

export const tierOf = (level: number) => [...TIERS].reverse().find((t) => level >= t.from)!;
export const nextTier = (level: number) => TIERS.find((t) => t.from > level);

// Wardrobe art, drawn onto the hero at (x, y). Capes go behind the body; pets sit to the right (x 16-23).
type Layer = { x: number; y: number; rows: string[]; behind?: true };
const cape = (m: string, s: string, t: string): Layer => ({
  x: 1, y: 7, behind: true,
  rows: [`..${m.repeat(10)}..`, `.${m.repeat(12)}.`, `.${m.repeat(12)}.`, m.repeat(14), m.repeat(14),
    `${m}${s}${m.repeat(10)}${s}${m}`, `${m}${s}${m.repeat(10)}${s}${m}`, `${t}${t}.${t.repeat(8)}.${t}${t}`],
});
export const ITEM_ART: Record<string, Layer> = {
  'leaf-crown': { x: 4, y: 0, rows: ['.g.gg.g.', 'gGgGGgGg'] },
  'wizard-hat': { x: 4, y: 0, rows: ['...bb...', '..bbyb..', 'bbbbbbbb'] },
  'horned-helm': { x: 3, y: 0, rows: ['w........w', 'ww.SSSS.ww', '.wSssssSw.', '..SSSSSS..'] },
  'gold-crown': { x: 4, y: 0, rows: ['y..yy..y', 'yyyyyyyy', 'yryyyyry'] },
  halo: { x: 5, y: 0, rows: ['.CCCC.', 'C....C'] },
  'wood-sword': { x: 13, y: 2, rows: ['.o.', '.o.', '.o.', '.o.', '.o.', 'kok', '.k.', '.k.'] },
  staff: { x: 13, y: 1, rows: ['.c.', 'cCc', '.c.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.', '.o.'] },
  bow: { x: 13, y: 4, rows: ['.ow', 'o.w', 'o.w', 'o.w', 'o.w', 'o.w', '.ow'] },
  'flame-blade': { x: 13, y: 1, rows: ['.o.', 'oyo', '.yo', 'oy.', '.yo', 'oy.', '.y.', 'kyk', '.k.', '.k.'] },
  'crystal-staff': { x: 13, y: 1, rows: ['CwC', 'wCw', 'CwC', '.s.', '.s.', '.s.', '.s.', '.s.', '.s.', '.s.', '.s.', '.s.'] },
  'red-cape': cape('r', 'p', 'p'),
  'royal-cape': cape('b', 'n', 'y'),
  'starry-cape': cape('n', 'w', 'C'),
  'shadow-cape': cape('p', 'k', 'r'),
  slime: { x: 16, y: 8, rows: ['........', '........', '...gg...', '..glgg..', '.gkggkg.', '.gggggg.', 'gggggggg', '.GGGGGG.'] },
  cat: { x: 16, y: 8, rows: ['........', '.o....o.', '.oo..oo.', '.oooooo.', '.okooko.', '.oooooo.', '..oooo.o', '..o..oo.'] },
  'baby-dragon': { x: 16, y: 8, rows: ['.....ll.', '....lgkl', '.y..gggl', 'yy.ggg..', '.yggggg.', '..gglgg.', '..gg.gg.', '..l...l.'] },
  'flame-crown': { x: 4, y: 0, rows: ['.o..o..o', 'oyooyooy', 'yyyyyyyy'] },
  dragonslayer: { x: 13, y: 0, rows: ['.w.', '.w.', 'wCw', '.w.', '.w.', '.w.', '.w.', 'ryr', '.r.', '.r.', '.y.'] },
  'champion-cape': cape('w', 'y', 'y'),
  'wise-owl': { x: 16, y: 8, rows: ['........', '.s....s.', '.ssssss.', '.ykssyk.', '.ssooss.', '.swwwws.', '.swwwws.', '..o..o..'] },
  phoenix: { x: 16, y: 8, rows: ['...o....', '..oyo...', '.oykoo..', 'o.oyyoo.', '..ooyyo.', '.r.oyo..', 'r..ro...', '..r.r...'] },
};

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

export function hero(level: number, size = 64, worn: string[] = [], look: Look = CLASSIC) {
  const t = tierOf(level);
  const layers = worn.map((id) => ITEM_ART[id]).filter(Boolean);
  const width = layers.some((l) => l.x + l.rows[0].length > 16) ? 24 : 16;
  const grid = [...HEADS[look.style], ...BODY].map((row) => row.padEnd(width, '.').split(''));
  const outfit = OUTFITS[look.outfit];
  const pal = { ...PAL, f: SKINS[look.skin].c, h: HAIRS[look.hair].c, A: outfit.c, a: outfit.d! };
  for (const l of [...t.trim, ...layers])
    l.rows.forEach((row, dy) =>
      [...row].forEach((ch, dx) => {
        const cell = grid[l.y + dy];
        if (ch !== '.' && cell && (!l.behind || cell[l.x + dx] === '.')) cell[l.x + dx] = ch;
      }));
  return svg(grid.map((r) => r.join('')), size, `Level ${level} ${t.title}`, pal);
}
