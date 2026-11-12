// The 32px hero: head, dot-eye face, 22 hairstyles (STYLES order in logic/look.ts) and the face options.
// Mask chars: '#' hair (shaded automatically), h / H / j hair base / shade / shine, z stubble, k outline.
// Skin f / F (shade) / x (freckle), eyes Q, blush u, scar X. The body and wardrobe are drawn on top in sprites.ts.
import type { Look } from './logic/types';

type Grid = string[][];
type Rows = (string | null)[];

export const W = 32;
const M = (l: string) => l + [...l].reverse().join(''); // mirror a 16-col left half
const rowsFrom = (y0: number, rows: string[], mirror = true): Rows => {
  const out: Rows = Array(W).fill(null);
  rows.forEach((r, i) => (out[y0 + i] = mirror ? M(r) : r));
  return out;
};

// ---------- head ----------
export const HEAD = rowsFrom(3, [
  '..........kkkkkk', // y3
  '........kkffffff',
  '.......kffffffff',
  '......kfffffffff',
  '......kfffffffff',
  '......kfffffffff',
  '......kfffffffff',
  '.....kkfffffffff', // y10 ear
  '.....kFfffffffff',
  '.....kFfffffffff',
  '.....kkfffffffff',
  '......kfffffffff',
  '......kFffffffff',
  '.......kFfffffff',
  '........kkFFffff',
  '..........kkkkkk', // y18
]);

// ---------- body ----------
// The tunic at 32px; hands at row 25, columns 8-9 and 22-23. The other outfits are still upscaled 16px art.
export const TUNIC = rowsFrom(19, [
  '............kfff', // y19 neck
  '.........kkkAAAA',
  '........kAAAAAAA',
  '.......kAAkAAAAA',
  '.......kAAkAAAAA',
  '.......kAAkAAAAA',
  '.......kffkAAAAA', // y25 hands
  '.......kkkkaaaaa', // belt
  '........kkAAAAAA',
  '..........kaaak.',
  '..........kaaak.',
  '.........kEEEEk.',
  '.........kkkkkk.', // y31
]);

// ---------- face ----------
// Dot eyes at cols 10-11 and 20-21, tinted by eye color; blush is always on.
const put = (grid: Grid, x: number, y: number, s: string) => [...s].forEach((c, i) => c !== '.' && grid[y] && (grid[y][x + i] = c));
const blush = (g: Grid) => { put(g, 9, 15, 'uu'); put(g, 21, 15, 'uu'); };
const dots = (g: Grid) => { for (const x of [10, 20]) { put(g, x, 12, 'QQ'); put(g, x, 13, 'QQ'); } blush(g); };
export const EXPRESSIONS: { name: string; draw: (g: Grid) => void }[] = [
  { name: 'Calm', draw: (g: Grid) => { dots(g); put(g, 15, 16, 'kk'); } },
  { name: 'Grin', draw: (g: Grid) => { for (const x of [9, 19]) { put(g, x + 1, 12, 'QQ'); put(g, x, 13, 'Q'); put(g, x + 3, 13, 'Q'); } blush(g); put(g, 14, 16, 'kwwk'); put(g, 15, 17, 'kk'); } },
  { name: 'Determined', draw: (g: Grid) => { dots(g); put(g, 9, 10, 'HH'); put(g, 11, 11, 'H'); put(g, 21, 10, 'HH'); put(g, 20, 11, 'H'); put(g, 14, 16, 'kkkk'); } },
  { name: 'Sleepy', draw: (g: Grid) => { for (const x of [10, 20]) put(g, x - 1, 13, 'QQQ'); blush(g); put(g, 15, 16, 'kk'); } },
];

export const MARKS: { name: string; draw: (g: Grid) => void }[] = [
  { name: 'None', draw: () => undefined },
  { name: 'Freckles', draw: (g: Grid) => { for (const [x, y] of [[8, 14], [10, 14], [12, 15], [19, 15], [21, 14], [23, 14]]) put(g, x, y, 'x'); } },
  { name: 'Scar', draw: (g: Grid) => { put(g, 23, 14, 'X'); put(g, 22, 15, 'X'); put(g, 21, 16, 'X'); put(g, 21, 15, 'X'); put(g, 23, 16, 'X'); } },
  { name: 'War paint', draw: (g: Grid) => { put(g, 9, 14, 'bbb'); put(g, 20, 14, 'bbb'); put(g, 9, 15, 'b'); put(g, 22, 15, 'b'); put(g, 15, 5, 'bb'); put(g, 15, 6, 'bb'); } },
];

// Facial hair: masks over the jaw (drawn after the face, before the front hair).
export const BEARDS: { name: string; rows: Rows; stubble?: true }[] = [
  { name: 'None', rows: [] },
  { name: 'Stubble', stubble: true, rows: [] },
  { name: 'Beard', rows: rowsFrom(12, [
    '......#.........', // y12 sideburn
    '......##........',
    '......###.......',
    '......####..####',
    '......########..',
    '......##########',
    '.......#########',
    '........########',
    '..........######',
  ]) },
  { name: 'Mustache', rows: rowsFrom(15, ['...........#####', '...........##...']) },
  { name: 'Goatee', rows: rowsFrom(17, ['..............##', '.............###', '.............###', '..............##']) },
];

// ---------- hair ----------
const DOME = ['..........######', '........########', '.......#########', '......##########', '.....###########', '.....###########'];
type Hair = { name: string; front: Rows; back: Rows; texture?: 'curl' | 'locs' };
const hair = (name: string, front: Rows, back: Rows = [], opts: { texture?: 'curl' | 'locs' } = {}): Hair => ({ name, front, back, ...opts });

export const HAIRS: Hair[] = [
  hair('Short', rowsFrom(1, [...DOME, '.....###########', '.....##.##.###.#', '.....##.........'])),
  hair('Long',
    rowsFrom(1, [...DOME, '.....###########', '.....###########', ...Array(11).fill('.....###........'), '......##........']),
    rowsFrom(4, [...Array(19).fill('....############'), '.....###########', '......##########'])),
  hair('Ponytail', rowsFrom(1, [...DOME, '.....###########', '.....##.#....###', '.....#..........']),
    rowsFrom(4, ['........................####....', '.........................####...', '.........................rr###..', ...Array(10).fill('..........................####..'), '..........................###...', '...........................##...'], false)),
  hair('Spiky', rowsFrom(0, ['........#...#..#', '.......##..##.##', '......####.#####', '.....###########', '....############', '.....###########', '....############', '.....###########', '.....##.#.##.#.#', '.....#.....#....'])),
  hair('Bun', rowsFrom(0, ['.............###', '............####', '............####', '................', '..........######', '........########', '.......#########', '......##########', '......##########', '......#.#.......'])),
  hair('Bald', []),
  hair('Wolf cut',
    rowsFrom(0, ['..........#..#..', '.........###.###', '.......#########', '......##########', '.....###########', '....############', '....############', '....############', '....###.##.#.##.', '....###..#....#.', '...####.........', '...###..........', '..####..........', '...###..........', '..###...........', '...##...........', '...#............']),
    rowsFrom(4, [...Array(13).fill('...#############'), '..##############', '..#.##.#########', '.....#..#.......'])),
  hair('Mullet', rowsFrom(1, [...DOME, '.....###########', '.....##.###.####', '.....#..........']),
    rowsFrom(12, [...Array(8).fill('.....###########'), '.....###########', '.....#.#.#......'])),
  hair('Curtains', rowsFrom(1, ['..........######', '........########', '.......########H', '......#########H', '.....##########H', '.....##########H', '.....##########.', '.....#######....', '.....#####......', '.....####.......', '.....###........', '.....##.........'])),
  hair('Undercut', rowsFrom(1, [
    '...........###########..........',
    '.........##############.........',
    '........################........',
    '......kzz################.......',
    '......kzzz################......',
    '......kzzzz###############......',
    '......kzzzzz###############.....',
    '......kzzzzzz##############.....',
    '......kzz...........########....',
    '.....................#######....',
    '......................#####.....',
    '.......................###......',
  ], false)),
  hair('Braid', rowsFrom(1, [
    ...DOME.map(M), M('.....##########H'), M('.....##########.'), M('.....###........'),
    ...Array(4).fill(M('.....###........')),
    '.....###........................',
    '.....####.......................',
    '.....hhHH.......................',
    '.....HHhh.......................',
    '.....hhHH.......................',
    '.....HHhh.......................',
    '.....hhHH.......................',
    '.....HHhh.......................',
    '.....hhHH.......................',
    '.....HHhh.......................',
    '.....hhHH.......................',
    '.....HHhh.......................',
    '.....hhHH.......................',
    '......rr........................',
    '......hh........................',
    '.....h..h.......................',
  ], false)),
  hair('Long wavy',
    rowsFrom(1, [...DOME, '.....###########', '.....###########', '....####........', '.....###........', '....###.........', '...####.........', '....###.........', '.....###........', '....###.........', '...####.........', '....###.........', '.....###........', '....###.........', '...##...........']),
    rowsFrom(4, [...Array(17).fill('...#############'), '..##############', '...#############', '..###.##########', '...#..#.........'])),
  hair('Pigtails', rowsFrom(1, [...DOME, '.....##########H', '.....###########', '.....#..........']),
    rowsFrom(9, ['...rr...........', '..####..........', ...Array(9).fill('..####..........'), '..###...........', '...#............'])),
  hair('Twin tails', rowsFrom(1, [...DOME, '.....##########H', '.....###########', '.....##.........']),
    rowsFrom(2, ['....rr..........', '...####.........', '..#####.........', '.#####..........', ...Array(18).fill('.####...........'), '..###...........', '..##............'])),
  hair('Afro', rowsFrom(0, ['.......##.###.##', '....############', '...#############', '..##############', '.###############', '.###############', '.###############', '################', '######..........', '.#####..........', '.#####..........', '.#####..........', '.#####..........', '..####..........', '..###...........', '...#............']), [], { texture: 'curl' }),
  hair('Big curls', rowsFrom(1, [...DOME.map((r) => r.replace('.....#', '....##')), '....############', '....####.##.##.#', '...####.........', '..#####.........', '..####..........', '..#####.........', '..####..........', '..#####.........', '..####..........', '...####.........', '..####..........', '...##...........']),
    rowsFrom(4, [...Array(18).fill('..##############'), '...#############', '..##.##.##......']), { texture: 'curl' }),
  hair('Locs', rowsFrom(1, [...DOME, '....############', '....###.##..#.##', '...####..#..#..#', ...Array(12).fill('...#####........'), '...#.#.#........']),
    rowsFrom(4, [...Array(20).fill('...#############'), '...#.#.#.#.#.#.#']), { texture: 'locs' }),
  hair('Mohawk', rowsFrom(0, ['..............#.', '..............##', '.............###', '..............##', '.......zzzzzzz##', '......kzzzzzzz##', '......kzzzzzzz##', '......kzzzzzzz##', '.......zzzzzzzzz'])),
  hair('Buzz', rowsFrom(4, ['..........hhhhhh', '........hhhhhhhh', '.......hhhhhhhhh', '.......hHhHhHhHh', '......kH........'])),
  hair('Bob', rowsFrom(1, [...DOME.map((r) => r.replace('.....#', '....##')), '....############', '....############', ...Array(6).fill('....###.........'), '....####........', '.....###........'])),
  hair('Bedhead', rowsFrom(0, [
    '..........#......#....#.........',
    '.........##..#..##...##.........',
    '........###########..###........',
    '.......################.#.......',
    '.....###################........',
    '....######################......',
    '.....######################.....',
    '.....######################.....',
    '....##.###.##.#####.##.###.#....',
    '.....#.#..#.......#..#..#.##....',
    '....##.......................#..',
  ], false)),
  hair('Side part', rowsFrom(1, [
    '..........############..........',
    '........################........',
    '.......####H############........',
    '......#####H#############.......',
    '.....######H##############......',
    '.....######################.....',
    '.....######################.....',
    '.....##.......############......',
    '.....##...........#########.....',
    '......................#####.....',
  ], false)),
];

// ---------- composer ----------
const isHair = (c: string) => c === '#' || c === 'h' || c === 'H' || c === 'j';

function drawMask(grid: Grid, rows: Rows, opts: { texture?: string } = {}, fromY = 0) {
  const m = rows.map((r) => (r ? [...r] : null));
  const at = (x: number, y: number) => m[y]?.[x] ?? '.';
  const cells: [number, number, string][] = [];
  m.forEach((r, y) => y >= fromY && r?.forEach((c, x) => c !== '.' && cells.push([x, y, c])));
  for (const [x, y, c] of cells) {
    let ch = c;
    if (c === '#') {
      ch = 'h';
      if (!isHair(at(x, y + 1))) ch = 'H';
      else if ((!isHair(at(x, y - 1)) || !isHair(at(x, y - 2))) && x >= 9 && x <= 14) ch = 'j';
      else if (!opts.texture && y >= 5 && x % 3 === 1 && isHair(at(x, y + 1)) && isHair(at(x, y - 2))) ch = 'H';
      if (opts.texture === 'curl' && ch === 'h') { const cy = y % 3, cx = (x + (Math.floor(y / 3) % 2) * 2) % 3; ch = cy === 2 && cx !== 0 ? 'H' : cy === 0 && cx === 1 ? 'j' : 'h'; }
      if (opts.texture === 'locs' && ch === 'h') ch = x % 3 === 2 ? 'H' : x % 3 === 0 && y % 4 === 0 ? 'j' : 'h';
    }
    grid[y][x] = ch;
  }
  // outline only against empty background, so bangs over the face don't get black edges
  for (const [x, y] of cells)
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy;
      if (grid[Y]?.[X] === '.' && at(X, Y) === '.') grid[Y][X] = 'k';
    }
}

function drawPlain(grid: Grid, rows: Rows) {
  rows.forEach((r, y) => r && [...r].forEach((c, x) => c !== '.' && (grid[y][x] = c)));
}

// body: the outfit as 32-wide rows (null = nothing); hatted: a helmet or hood hides the hair above the brow.
export function compose(look: Look, body: Rows, width = W, hatted = false): Grid {
  const grid: Grid = Array.from({ length: W }, () => Array(width).fill('.'));
  const style = HAIRS[look.style] ?? HAIRS[0];
  if (style.back.length) drawMask(grid, style.back, style);
  drawPlain(grid, body);
  drawPlain(grid, HEAD);
  EXPRESSIONS[look.face ?? 0].draw(grid);
  MARKS[look.mark ?? 0].draw(grid);
  const beard = BEARDS[look.beard ?? 0];
  if (beard.stubble)
    for (let y = 14; y <= 17; y++) for (let x = 7; x <= 24; x++) if ((grid[y][x] === 'f' || grid[y][x] === 'F') && (y >= 15 || x <= 8 || x >= 23)) grid[y][x] = 'z';
  if (beard.rows.length) drawMask(grid, beard.rows);
  if (style.front.length) drawMask(grid, style.front, style, hatted ? 9 : 0);
  return grid;
}

