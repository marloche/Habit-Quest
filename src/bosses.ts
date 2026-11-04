// The boss ladder: each boss you beat brings a bigger, meaner one. Grids grow from 8 to 24 pixels for more detail.
// Front-facing bosses are drawn as a left half and mirrored; extras (weapons, wisps) are stamped on top.

type Extra = { x: number; y: number; rows: string[] };

const mirror = (half: string[]) => half.map((r) => r + [...r].reverse().join(''));

function stamp(rows: string[], extras: Extra[]) {
  const grid = rows.map((r) => r.split(''));
  for (const e of extras)
    e.rows.forEach((row, dy) => [...row].forEach((ch, dx) => {
      if (ch !== '.' && grid[e.y + dy]?.[e.x + dx] !== undefined) grid[e.y + dy][e.x + dx] = ch;
    }));
  return grid.map((r) => r.join(''));
}

const SLIME = ['........', '...gg...', '..glgg..', '.gggggg.', '.gkggkg.', 'gggggggg', 'gggggggg', '.GGGGGG.'];

const RAT = [
  '..........',
  '..........',
  '..ss......',
  '.sSSs.....',
  'sSrSSSss..',
  'kSSSSSSSs.',
  '.sSSSSSSSo',
  '..sSSSSSso',
  '..S.S.S.o.',
  '........o.',
];

const BAT = ['v.....v', 'vv.k.vv', 'vpkkkpv', '.vrkrv.', '..k.k..'];
const BATLET = ['v.k.v', 'vkrkv', '..k..'];
const BATS = stamp(Array(10).fill('..........'), [
  { x: 0, y: 0, rows: BATLET },
  { x: 5, y: 1, rows: BATLET },
  { x: 2, y: 4, rows: BAT },
]);

const SKELETON = stamp(mirror([
  '....ww',
  '...www',
  '...wkw',
  '...www',
  '....wk',
  '.....w',
  '..wwww',
  '..w.wk',
  '..w.ww',
  '....wk',
  '....w.',
  '...ww.',
]), [
  { x: 5, y: 1, rows: ['k', 'k'] }, // cracked skull
  { x: 10, y: 0, rows: ['.S', '.S', '.S', '.S', '.S', 'ooo', '.w'] }, // rusty sword
]);

const GOBLIN = stamp(mirror([
  '....pp',
  '...ppp',
  'g..pgg',
  'gg.gyg',
  '.ggggg',
  '...gwk',
  '....gg',
  '..pppp',
  '.gpppp',
  '.g.ppp',
  '...gg.',
  '..kk..',
]), [{ x: 10, y: 5, rows: ['w', 's', 's', 'o'] }]);

const ORC = stamp(mirror([
  '....GGG',
  '...GGGG',
  '...GrGG',
  '...GGGG',
  '...GwGk',
  '....GGG',
  '.SSSSSS',
  'GSSsSSS',
  'GSSSSSS',
  'G.SSSSS',
  '..ddddd',
  '..GGG..',
  '..GGG..',
  '.kkkk..',
]), [{ x: 11, y: 1, rows: ['s.s', 'ooo', 'sos', 'ooo', '.o.', '.o.', '.o.', '.G.'] }]);

const WRAITH = stamp(mirror([
  '.....dd',
  '....ddd',
  '...ddkk',
  '...dkCk',
  '...dkkk',
  '..dddkk',
  '..ddddd',
  '.ddpppp',
  '.ddpppp',
  'ddpppnp',
  'dppppnp',
  'd.ppnpp',
  '..p.n.p',
  '.p...p.',
]), [
  { x: 0, y: 6, rows: ['C', '.', 'C'] },
  { x: 13, y: 9, rows: ['C', '.', 'C'] },
]);

const DARK_KNIGHT = stamp(mirror([
  '.....SSS',
  '....SSSS',
  '....SSsS',
  '....Skrr',
  '....SSSS',
  '....SSSS',
  '..kkSSSS',
  '.kssSSsS',
  '.ksSSSSS',
  '.kSSSSyS',
  '.kSSSSSS',
  'kk.SSSSd',
  'k..SSS.d',
  'k..SSS..',
  '...dSS..',
  '..dddd..',
]), [{ x: 13, y: 1, rows: ['.w.', '.w.', '.w.', '.w.', '.w.', '.w.', 'ysy', '.d.', '.d.'] }]);

const TROLL = stamp(mirror([
  '........',
  '.....GGG',
  '....GGGG',
  '...GGyGG',
  '...GGGGG',
  '..GGwGkk',
  '..lGGGGG',
  '.GGGGGGG',
  'GGlGGGGG',
  'GGGGGlGG',
  'GG.GGGGG',
  'G..GGGGG',
  '...GGGoo',
  '...GGG.o',
  '..GGG...',
  '.GGGG...',
]), [{ x: 0, y: 0, rows: ['.SSS', 'SsSS', 'SSSS', '.SS.'] }]); // a boulder ready to throw

const LICH = stamp(mirror([
  '....y.y.',
  '....yyyy',
  '....wwww',
  '...wwwww',
  '...wwlkw',
  '...wwwwk',
  '....wkwk',
  '..pppwww',
  '.ppppppp',
  '.pnppppp',
  'ppnpppyp',
  'ppnppppp',
  'p.npppnp',
  '..nppnpp',
  '..pnppnp',
  '.pp.pp.p',
]), [{ x: 0, y: 0, rows: ['.l.', 'lyl', '.l.', '.S.', '.S.', '.S.', '.S.', '.S.', '.S.', '.S.', '.S.', '.S.', '.S.', '.S.', '.S.', '.S.'] }]);

const DEMON = stamp(mirror([
  'w.........',
  'ws........',
  '.ws.......',
  '..ws..rrrr',
  '...srrrrrr',
  '....rryrrr',
  '....rrrrrr',
  '....rrkwkw',
  'p....rrrrr',
  'pp..rrrrrr',
  'ppp.rrrrrr',
  'pppprrrrpr',
  'ppprrrrrrr',
  'pp.rrrrrrr',
  'p..rrkkkkk',
  '...rrrr.rr',
  '...rrr..rr',
  '..oo.o..o.',
  '.oyyoyooyo',
  'oyyyyyyyyy',
]), []);

const DRAGON = stamp(mirror([
  'r...........',
  'rr..........',
  'rrr.........',
  'rrrr.....w..',
  'prrrr....ww.',
  'pprrrr...rrr',
  'ppprrrr.rrry',
  'pppprrrrrrrr',
  'ppppprrrrrrr',
  '.ppppprrrrkw',
  '..pppprrrrrw',
  '...ppprrrrrr',
  '....pprrryyy',
  '.....prrryyy',
  '......rrrryy',
  '......rrrrry',
  '.....rrr.rrr',
  '....rrr..rrr',
  '...wrr....rr',
  '..........oo',
  '.........oyy',
  '........oyyy',
  '.......ooyyy',
  '......oyyyyy',
]), []);

// Battle damage over the art. Strokes come from the boss's name, so a reload shows the same wounds, and each stage keeps
// the last one's and adds longer ones (scratches, then cracks). Dark marks on light pixels, red on dark, only on the boss.
const DARK = new Set(['k', 'd', 'p', 'n', 'E', 'G', 'S', 'r']);
export function wounded(art: string[], stage: number, name: string) {
  if (!stage) return art;
  const grid = art.map((r) => r.split(''));
  const filled: [number, number][] = [];
  art.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && filled.push([x, y])));
  let h = 2166136261;
  for (const c of name) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 2 ** 32);
  const per = Math.ceil(art.length / 12); // 1 for the 8-pixel slime, 2 for the 24-pixel dragon
  const strokes = [0, 2, 4, 6][stage] * per;
  for (let i = 0; i < strokes; i++) {
    const [x0, y0] = filled[Math.floor(rnd() * filled.length)];
    const dx = rnd() < 0.5 ? -1 : 1;
    const len = i < 2 * per ? 2 : i < 4 * per ? 3 : 4;
    for (let j = 0; j < len; j++) {
      const ch = art[y0 + j]?.[x0 + dx * j];
      if (ch && ch !== '.') grid[y0 + j][x0 + dx * j] = DARK.has(ch) ? (ch === 'r' ? 'k' : 'r') : 'k';
    }
  }
  return grid.map((r) => r.join(''));
}

export type BossArt = { name: string; title: string; art: string[] };

export const LADDER: BossArt[] = [
  { name: 'Slime', title: 'Puddle of Goo', art: SLIME },
  { name: 'Cave Rat', title: 'Gnawer of Crumbs', art: RAT },
  { name: 'Bat Swarm', title: 'Shrieking Cloud', art: BATS },
  { name: 'Skeleton', title: 'Rattling Guard', art: SKELETON },
  { name: 'Goblin Raider', title: 'Knife in the Dark', art: GOBLIN },
  { name: 'Orc Brute', title: 'Skull Crusher', art: ORC },
  { name: 'Wraith', title: 'Hollow Whisper', art: WRAITH },
  { name: 'Dark Knight', title: 'Oathbreaker', art: DARK_KNIGHT },
  { name: 'Troll', title: 'Bridge Tyrant', art: TROLL },
  { name: 'Lich', title: 'Crown of Bones', art: LICH },
  { name: 'Demon Lord', title: 'Lord of Cinders', art: DEMON },
  { name: 'Elder Dragon', title: 'World Burner', art: DRAGON },
];

// After the dragon the ladder repeats as ELITE recolors with a glow, alternating frost and void each lap.
export const ELITE_PALS: Record<string, string>[] = [
  { r: '#3b5dc9', p: '#29366f', o: '#41a6f6', y: '#73eff7', g: '#41a6f6', G: '#29366f', l: '#73eff7', v: '#73eff7', d: '#29366f' },
  { r: '#5d275d', p: '#1a1c2c', o: '#9b5fc0', y: '#a7f070', g: '#9b5fc0', G: '#5d275d', l: '#a7f070', w: '#94b0c2', v: '#a7f070' },
];
