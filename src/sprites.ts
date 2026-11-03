// Pixel art as rows of palette letters ('.' = transparent), rendered to crisp SVG.
export const PAL: Record<string, string> = {
  k: '#1a1c2c', p: '#5d275d', r: '#b13e53', o: '#ef7d57', y: '#ffcd75', l: '#a7f070', g: '#38b764', G: '#257179',
  n: '#29366f', b: '#3b5dc9', c: '#41a6f6', C: '#73eff7', w: '#f4f4f4', s: '#94b0c2', S: '#566c86', d: '#333c57',
  f: '#e8b796',
};

export const ICONS: Record<string, string[]> = {
  sword: ['......ws', '.....wsS', '....wsS.', '.y.wsS..', '..ySS...', '..ry....', '.r..y...', 'r.......'],
  book: ['........', '.bbbbbb.', '.bwwwwb.', '.bwkkwb.', '.bwwwwb.', '.bwkkwb.', '.bbbbbb.', '........'],
  drop: ['...cc...', '...cc...', '..cCcc..', '..cCcc..', '.cCcccc.', '.cCcccc.', '.ccccbc.', '..cbbc..'],
  heart: ['........', '.rr..rr.', 'rorrrrrr', 'rorrrrrr', 'rrrrrrrr', '.rrrrrr.', '..rrrr..', '...rr...'],
  star: ['...yy...', '...yy...', 'yyyyyyyy', '.yyyyyy.', '..yyyy..', '..yyyy..', '.yy..yy.', '.y....y.'],
  moon: ['...yyy..', '..yy....', '.yy.....', '.yy.....', '.yy.....', '.yy.....', '..yy....', '...yyy..'],
  leaf: ['.....gg.', '...gggg.', '..gggGg.', '.ggGgg..', '.gGggg..', '.Gggg...', 'G.......', '........'],
  dumbbell: ['........', 'SS....SS', 'SS....SS', 'SSssssSS', 'SS....SS', 'SS....SS', '........', '........'],
  pen: ['......ww', '.....wwk', '....wwk.', '...wwk..', '..wwk...', '..yk....', '.yk.....', 'k.......'],
  apple: ['....g...', '...g....', '.rrrrr..', 'rrwrrrr.', 'rwrrrrr.', 'rrrrrrr.', 'rrrrrrr.', '.rr.rr..'],
};

export const FLAME = ['...o....', '...oo...', '..ooy...', '..oyyo..', '.ooyyoo.', '.oyyyyo.', '.oyyyyo.', '..oyyo..'];
export const COIN = ['..yyyy..', '.yyoyyy.', 'yyyoyyyy', 'yyyoyyyy', 'yyyoyyyy', 'yyyoyyyy', '.yyoyyy.', '..yyyy..'];

// h = hair/helmet, A/a = armor and its shade; swapped per level tier so the hero visibly grows.
export const HERO = [
  '......kkkk......',
  '.....khhhhk.....',
  '....khhhhhhk....',
  '....kffffffk....',
  '....kfkffkfk....',
  '....kffffffk....',
  '.....kffffk.....',
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

const TIERS = [
  { from: 1, title: 'Squire', h: '#ef7d57', A: '#38b764', a: '#257179' },
  { from: 5, title: 'Knight', h: '#94b0c2', A: '#3b5dc9', a: '#29366f' },
  { from: 10, title: 'Champion', h: '#ffcd75', A: '#b13e53', a: '#5d275d' },
  { from: 20, title: 'Legend', h: '#ffcd75', A: '#73eff7', a: '#41a6f6' },
];

export const tierOf = (level: number) => [...TIERS].reverse().find((t) => level >= t.from)!;

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
  return `<svg ${a11y} viewBox="0 0 ${rows[0].length} ${rows.length}" width="${size}" height="${size}" shape-rendering="crispEdges">${rects}</svg>`;
}

export const icon = (name: string, size = 24) => svg(ICONS[name] ?? ICONS.star, size);

export function hero(level: number, size = 64) {
  const t = tierOf(level);
  return svg(HERO, size, `Level ${level} ${t.title}`, { ...PAL, h: t.h, A: t.A, a: t.a });
}
