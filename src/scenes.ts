import type { Bg } from './logic/types';

// Background scenes, painted procedurally onto a small canvas (one canvas pixel = 3-5 screen pixels) so they fit
// any screen shape. Moving bits are DOM sparks animated with CSS transforms and opacity, so nothing repaints per
// frame and a hidden tab costs nothing. A spark can carry its own painted sprite (img), e.g. a ship that bobs.
type Kind = 'flame' | 'twinkle' | 'ember' | 'smoke' | 'glow' | 'fall' | 'rain' | 'wander' | 'glide' | 'bob' | 'breathe' | 'sweep' | 'flash' | 'sway' | 'circle' | 'shoot' | 'haze' | 'halo' | 'flicker' | 'blink' | 'flap';
// dx, dy: travel in scene pixels; c: color; d: seconds per loop (randomized a little unless t is fixed too); t: start offset.
type Spark = { x: number; y: number; k: Kind; w?: number; h?: number; img?: string; dx?: number; dy?: number; c?: string; d?: number; t?: number };
type P = { W: number; H: number; rnd: () => number; rect: (x: number, y: number, w: number, h: number, c: string) => void; ctx: CanvasRenderingContext2D; sparks: Spark[] };

// Paints a small sprite layer for a spark, with the same tools as the scene.
function layer(p: P, w: number, h: number, draw: (q: P) => void): string {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const rect = (x: number, y: number, rw: number, rh: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(rw), Math.round(rh));
  };
  draw({ W: w, H: h, ctx, rect, rnd: p.rnd, sparks: [] });
  return canvas.toDataURL();
}

// mulberry32: a seeded random, so a scene looks the same on every launch.
const seeded = (a: number) => () => {
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
};

// Horizontal color bands with a one-pixel checker seam between them.
function sky(p: P, cs: string[], y0: number, y1: number) {
  const bh = (y1 - y0) / cs.length;
  cs.forEach((c, i) => p.rect(0, y0 + i * bh, p.W, bh + 1, c));
  for (let i = 1; i < cs.length; i++) {
    const y = Math.round(y0 + i * bh);
    for (let x = 0; x < p.W; x += 2) {
      p.rect(x, y - 1, 1, 1, cs[i]);
      p.rect(x + 1, y, 1, 1, cs[i - 1]);
    }
  }
}

// A rolling silhouette from y down to the bottom; jag adds random spikes.
function ridge(p: P, y: number, amp: number, c: string, f: number, seed: number, jag = 0) {
  for (let x = 0; x < p.W; x++) {
    const top = y - amp * (Math.sin(x * f + seed) * 0.6 + Math.sin(x * f * 2.3 + seed * 2) * 0.4) - (p.rnd() < jag ? p.rnd() * amp * 2 : 0);
    p.rect(x, top, 1, p.H - top, c);
  }
}

function disc(p: P, cx: number, cy: number, r: number, c: string) {
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.round(Math.sqrt(r * r - dy * dy));
    p.rect(cx - w, cy + dy, w * 2 + 1, 1, c);
  }
}

// A triangle pointing up: roofs, pines, spires.
function tri(p: P, cx: number, top: number, half: number, h: number, c: string) {
  for (let i = 0; i < h; i++) {
    const w = Math.round(((i + 1) / h) * half);
    p.rect(cx - w, top + i, w * 2 + 1, 1, c);
  }
}

function sprite(p: P, x: number, y: number, rows: string[], pal: Record<string, string>, s = 1) {
  rows.forEach((row, dy) => [...row].forEach((ch, dx) => ch !== '.' && p.rect(x + dx * s, y + dy * s, s, s, pal[ch])));
}

// A soft round light that flickers or pulses over a lamp, window, fire or sun (d: seconds per pulse).
const halo = (p: P, x: number, y: number, r: number, c: string, d = 2.4) => p.sparks.push({ x: x - r, y: y - r, k: 'halo', w: r * 2 + 1, h: r * 2 + 1, c, d });

// A bird or bat crossing the sky, wings flapping; dx is its travel (negative: right to left).
function flyer(p: P, rows: string[], c: string, x: number, y: number, dx: number, d: number) {
  const img = layer(p, rows[0].length, rows.length, (q) => sprite(q, 0, 0, rows, { k: c, w: c }));
  p.sparks.push({ x, y, k: 'flap', w: rows[0].length, h: rows.length, img, dx, d });
}

// A small cloud drifting right to left, slowly.
function drifter(p: P, y: number, d: number, pal: Record<string, string>) {
  const img = layer(p, 14, 5, (q) => sprite(q, 0, 0, CLOUD, pal));
  p.sparks.push({ x: p.W + 2, y, k: 'glide', w: 14, h: 5, img, dx: -(p.W + 20), d });
}

function glowAt(p: P, x: number, y: number, r: number, c: string) {
  p.ctx.globalAlpha = 0.12;
  disc(p, x, y, r, c);
  disc(p, x, y, Math.round(r * 0.6), c);
  p.ctx.globalAlpha = 1;
}

const torch = (p: P, x: number, y: number) => {
  glowAt(p, x, y, 14, '#ef7d57');
  p.rect(x - 1, y + 2, 3, 1, '#566c86');
  p.rect(x, y + 3, 1, 3, '#566c86');
  p.rect(x - 1, y - 1, 3, 3, '#ef7d57'); // the flame when animation is off
  p.rect(x, y, 1, 2, '#ffcd75');
  p.sparks.push({ x: x - 1, y: y - 2, k: 'flame' });
  halo(p, x, y, 9, '#ef7d57', 1.4);
};

const banner = (p: P, x: number, y: number, h: number, c: string) => {
  p.rect(x, y, 3, h, c);
  p.rect(x + 1, y + 2, 1, 1, '#ffcd75');
  p.rect(x + 1, y + h - 1, 1, 1, '#1a1c2c'); // notched tail
};

const BAT = ['k.....k', 'kk.k.kk', '.kkkkk.', '...k...'];
const RAT = ['.....kk', 'kkkkkkk', '..k..k.'];
const SKULL = ['.www.', 'wkwkw', 'wwwww', '.w.w.'];
const RIBS = ['.s.s.s.', 's.s.s.s', '.s.s.s.'];
const BONE = ['w...w', '.www.', 'w...w'];
const DEMON = ['k.....k', 'kk...kk', '.kkkkk.', '.kykyk.', '..kkk..', '.kkkkk.', 'k.kkk.k', '..k.k..', '..k.k..'];
const BONES = { w: '#f4f4f4', s: '#94b0c2', k: '#1a1c2c' };

function castle(p: P) {
  const { W, H, rnd, rect } = p;
  const hz = Math.round(H * 0.62);
  sky(p, ['#1a1c2c', '#1f2142', '#252a52', '#29366f'], 0, hz);
  for (let i = 0; i < (W * hz) / 80; i++) {
    const x = Math.floor(rnd() * W);
    const y = Math.floor(rnd() * hz * 0.8);
    rect(x, y, 1, 1, rnd() < 0.3 ? '#f4f4f4' : '#94b0c2');
    if (i % 7 === 0) p.sparks.push({ x, y, k: 'twinkle' });
  }
  const mx = Math.round(W * 0.8);
  const my = Math.round(H * 0.1);
  disc(p, mx, my, 6, '#f4f4f4');
  rect(mx - 2, my - 1, 2, 2, '#94b0c2');
  rect(mx + 2, my + 2, 1, 1, '#94b0c2');
  ridge(p, hz, 5, '#20243f', 0.07, 1);
  ridge(p, hz + 5, 3, '#181a2e', 0.12, 3);
  for (let i = 0; i < 2; i++) flyer(p, BAT, '#0b0c14', W + 4, my - 4 + i * 6, -(W + 16), 14 + i * 5);

  const cw = Math.min(Math.round(W * 0.72), 120);
  const cx = Math.round((W - cw) / 2);
  const base = hz + 8;
  const top = base - 16;
  rect(cx, top, cw, 16, '#333c57');
  for (let y = top + 2; y < base; y += 3) for (let x = cx + ((y / 3) % 2 ? 0 : 2); x < cx + cw; x += 4) rect(x, y, 1, 1, '#262b44');
  for (let x = cx; x < cx + cw; x += 3) rect(x, top - 2, 2, 2, '#333c57');
  const tower = (x: number, w: number, h: number) => {
    rect(x, base - h, w, h, '#3b4466');
    rect(x + w - 2, base - h, 2, h, '#2d3450');
    tri(p, x + Math.floor(w / 2), base - h - 9, Math.ceil(w / 2) + 1, 9, '#5d275d');
    tri(p, x + Math.floor(w / 2) - 1, base - h - 8, Math.floor(w / 4), 7, '#b13e53');
    rect(x + Math.floor(w / 2), base - h - 14, 1, 5, '#94b0c2');
    rect(x + Math.floor(w / 2) + 1, base - h - 14, 3, 2, '#b13e53');
    for (let y = base - h + 4; y < base - 4; y += 6)
      if (rnd() < 0.7) {
        const wx = x + 2 + Math.floor(rnd() * (w - 5));
        rect(wx, y, 1, 2, '#ffcd75');
        if (rnd() < 0.5) p.sparks.push({ x: wx, y, k: 'flicker', w: 1, h: 2, c: '#ffcd75', d: 5 });
      }
  };
  tower(cx - 3, 12, 30);
  tower(cx + cw - 9, 12, 30);
  tower(cx + Math.round(cw / 2) - 10, 20, 38);
  for (let x = cx + 14; x < cx + cw - 14; x += 10) if (Math.abs(x - (cx + cw / 2)) > 14) banner(p, x, top + 1, 7, '#b13e53');
  const gx = cx + Math.round(cw / 2) - 4;
  disc(p, gx + 4, base - 8, 4, '#1a1c2c');
  rect(gx, base - 8, 9, 8, '#1a1c2c');
  for (let x = gx + 1; x < gx + 9; x += 2) rect(x, base - 10, 1, 10, '#566c86');
  torch(p, gx - 3, base - 9);
  torch(p, gx + 11, base - 9);

  rect(0, base, W, H - base, '#141a26');
  for (let y = base; y < H; y++) {
    const w = 9 + (y - base) * 1.2;
    rect(gx + 4 - w / 2, y, w, 1, '#262b44');
  }
  for (let i = 0; i < W / 3; i++) rect(Math.floor(rnd() * W), base + Math.floor(rnd() * (H - base)), 1, 1, '#257179');
}

function dungeon(p: P) {
  const { W, H, rnd, rect } = p;
  const floor = Math.round(H * 0.8);
  rect(0, 0, W, floor, '#1a1c2c');
  const stones = ['#333c57', '#2d3450', '#38415e', '#2a3049'];
  for (let y = 0, row = 0; y < floor; y += 5, row++)
    for (let x = row % 2 ? -4 : 0; x < W; x += 8) {
      rect(x, y, 7, 4, stones[Math.floor(rnd() * stones.length)]);
      if (rnd() < 0.3) rect(x, y, 2, 1, '#566c86');
      if (rnd() < 0.07) rect(x + 1, y + 3, 4, 1, '#257179');
      if (rnd() < 0.05) rect(x + 3, y + 1, 1, 2, '#1a1c2c');
    }
  for (let i = 0, n = Math.max(2, Math.floor(W / 30)); i < n; i++) {
    const x = Math.floor(rnd() * W);
    const len = 8 + Math.floor(rnd() * floor * 0.3);
    for (let y = 0; y < len; y++) rect(x + (y % 4 < 2 ? 0 : 1), y, 1, 1, y % 2 ? '#566c86' : '#94b0c2');
    rect(x - 1, len, 4, 2, '#566c86');
    p.sparks.push({ x: x + 1, y: len + 2, k: 'fall', dy: floor - len - 2, c: '#73eff7', d: 2.5 + rnd() * 3 });
  }
  const dw = 18;
  const dx = Math.round(W / 2 - dw / 2);
  disc(p, dx + dw / 2, floor - 22, dw / 2, '#0f1019');
  rect(dx, floor - 22, dw + 1, 22, '#0f1019');
  for (let x = dx + 1; x < dx + dw; x += 3) rect(x, floor - 30, 1, 30, '#566c86');
  for (let y = floor - 26; y < floor; y += 4) rect(dx, y, dw + 1, 1, '#566c86');
  const n = Math.max(2, Math.floor(W / 45));
  for (let i = 1; i <= n; i++) {
    const x = Math.round((W * i) / (n + 1));
    if (Math.abs(x - W / 2) > 16) torch(p, x, Math.round(floor * 0.42));
  }
  rect(0, floor, W, H - floor, '#262b44');
  for (let y = floor; y < H; y += 6) rect(0, y, W, 1, '#1a1c2c');
  for (let y = floor, r = 0; y < H; y += 6, r++) for (let x = r % 2 ? 5 : 0; x < W; x += 10) rect(x, y, 1, 6, '#1a1c2c');
  sprite(p, Math.round(W * 0.15), floor + 2, SKULL, BONES);
  sprite(p, Math.round(W * 0.8), floor + 4, BONE, BONES);
  const rat = layer(p, 7, 3, (q) => sprite(q, 0, 0, RAT, { k: '#566c86' }));
  p.sparks.push({ x: -8, y: floor - 1, k: 'glide', w: 7, h: 3, img: rat, dx: W + 16, d: 22 });
}

function forest(p: P) {
  const { W, H, rnd, rect } = p;
  const hz = Math.round(H * 0.58);
  sky(p, ['#3b5dc9', '#41a6f6', '#5cc8f6', '#73eff7', '#b7f4ec'], 0, hz);
  disc(p, Math.round(W * 0.2), Math.round(H * 0.1), 5, '#ffcd75');
  for (let i = 0; i < Math.max(2, W / 50); i++) {
    const cx = Math.floor(rnd() * W);
    const cy = Math.floor(H * 0.06 + rnd() * hz * 0.35);
    disc(p, cx, cy, 3, '#f4f4f4');
    disc(p, cx + 4, cy - 1, 4, '#f4f4f4');
    disc(p, cx + 9, cy, 3, '#f4f4f4');
    rect(cx - 3, cy + 3, 16, 1, '#c2d3df');
  }
  for (let i = 0; i < 3; i++) drifter(p, Math.round(H * 0.04 + rnd() * hz * 0.3), 70 + rnd() * 40, { w: '#f4f4f4', s: '#c2d3df' });
  for (let i = 0; i < 2; i++) flyer(p, GULL, '#29366f', W + 4, Math.round(H * (0.14 + i * 0.07)), -(W + 16), 22 + i * 7);
  for (let x = -10; x < W + 10; x += 22 + Math.floor(rnd() * 12)) {
    const h = 14 + Math.floor(rnd() * 12);
    tri(p, x, hz - h, h, h, '#566c86');
    tri(p, x, hz - h, 3, 3, '#f4f4f4');
  }
  ridge(p, hz - 2, 3, '#257179', 0.09, 2);
  const pine = (x: number, base: number, h: number) => {
    rect(x, base - 2, 1, 3, '#5d275d');
    for (let i = 0; i < 3; i++) tri(p, x, base - h + i * Math.round(h / 4), 2 + i, Math.round(h / 3), i % 2 ? '#38b764' : '#257179');
  };
  for (let x = 0; x < W; x += 3 + Math.floor(rnd() * 4)) pine(x, hz + 2, 9 + Math.floor(rnd() * 7));
  rect(0, hz + 2, W, H - hz - 2, '#38b764');
  for (let y = hz + 4; y < H; y += 5) for (let x = (y * 3) % 7; x < W; x += 7) rect(x, y, 2, 1, '#2e9e57');
  for (let i = 0; i < W / 2; i++) rect(Math.floor(rnd() * W), hz + 4 + Math.floor(rnd() * (H - hz - 4)), 1, 1, ['#ffcd75', '#b13e53', '#f4f4f4'][i % 3]);
  const py = hz + 10;
  for (let y = py; y < H; y++) {
    const w = 3 + (y - py) * 0.5;
    rect(W / 2 - w / 2 + Math.sin(y * 0.15) * 4, y, w, 1, '#d9b26c');
  }
  const hut = (x: number, y: number) => {
    rect(x, y, 14, 9, '#7a4b2a');
    rect(x, y, 14, 1, '#5d3a20');
    rect(x + 5, y + 3, 4, 6, '#1a1c2c');
    rect(x + 1, y + 2, 3, 3, '#29366f');
    rect(x + 10, y + 2, 3, 3, '#29366f');
    tri(p, x + 7, y - 8, 9, 8, '#ffcd75');
    for (let i = 2; i < 8; i += 2) rect(x + 7 - i, y - 8 + i, i * 2 + 1, 1, '#ef7d57');
    rect(x + 10, y - 9, 2, 4, '#566c86');
    p.sparks.push({ x: x + 10, y: y - 11, k: 'smoke' }, { x: x + 11, y: y - 11, k: 'smoke' });
  };
  hut(Math.round(W * 0.12), hz + 8);
  if (W > 90) hut(Math.round(W * 0.72), hz + 12);
  if (W > 200) hut(Math.round(W * 0.4) - 20, hz + 5);
}

function hell(p: P) {
  const { W, H, rnd, rect } = p;
  const hz = Math.round(H * 0.5);
  sky(p, ['#1a1c2c', '#2a1430', '#5d275d', '#8a2f4a', '#b13e53'], 0, hz);
  for (let i = 0; i < (W * hz) / 120; i++) rect(Math.floor(rnd() * W), Math.floor(rnd() * hz), 1, 1, rnd() < 0.5 ? '#ef7d57' : '#ffcd75');
  ridge(p, hz - 4, 8, '#2a1420', 0.05, 5, 0.08);
  const big = Math.round(W / 2 - 7);
  sprite(p, big, hz - 30, DEMON, { k: '#140a10', y: '#ffcd75' }, 2);
  for (const ex of [4, 8]) p.sparks.push({ x: big + ex, y: hz - 24, k: 'blink', w: 2, h: 2, c: '#140a10', d: 6, t: -1 });
  for (let i = 0; i < Math.max(2, W / 40); i++)
    sprite(p, Math.floor(rnd() * (W - 8)), hz - 10 - Math.floor(rnd() * 6), DEMON, { k: '#1a0f16', y: '#ef7d57' });
  ridge(p, hz + 6, 5, '#1f0f18', 0.11, 2, 0.04);
  const lava = Math.round(H * 0.68);
  const lh = Math.max(6, Math.round(H * 0.07));
  for (const fx of [Math.round(W * 0.18), Math.round(W * 0.78)]) {
    rect(fx, hz + 4, 3, lava - hz - 4, '#ef7d57');
    rect(fx + 1, hz + 4, 1, lava - hz - 4, '#ffcd75');
    glowAt(p, fx + 1, lava - 4, 10, '#ef7d57');
    halo(p, fx + 1, lava - 4, 8, '#ffcd75', 1.8);
  }
  for (let i = 0; i < 3; i++) p.sparks.push({ x: Math.floor(rnd() * W * 0.6), y: lava - 4 - i * 3, k: 'haze', w: Math.round(W * 0.4), h: 1, c: '#ef7d57', d: 3 });
  glowAt(p, W / 2, lava, Math.round(W * 0.35), '#b13e53');
  rect(0, lava, W, lh, '#ef7d57');
  rect(0, lava, W, 1, '#b13e53');
  rect(0, lava + lh - 1, W, 1, '#b13e53');
  for (let i = 0; i < W / 2; i++) rect(Math.floor(rnd() * W), lava + 1 + Math.floor(rnd() * (lh - 2)), 2 + Math.floor(rnd() * 3), 1, '#ffcd75');
  p.sparks.push({ x: 0, y: lava - 3, k: 'glow', w: W, h: lh + 6 });
  for (let i = 0; i < Math.min(18, W / 6); i++) p.sparks.push({ x: Math.floor(rnd() * W), y: lava - 1, k: 'ember' });
  rect(0, lava + lh, W, H - lava - lh, '#24141c');
  for (let y = lava + lh; y < H; y += 4) for (let x = Math.floor(rnd() * 6); x < W; x += 6 + Math.floor(rnd() * 6)) rect(x, y, 3, 1, '#1a0f16');
  const fy = lava + lh + 3;
  for (let x = 4; x < W - 8; x += 16 + Math.floor(rnd() * 14)) {
    const pick = rnd();
    sprite(p, x, fy + Math.floor(rnd() * Math.max(1, H - fy - 8)), pick < 0.4 ? SKULL : pick < 0.7 ? RIBS : BONE, BONES);
  }
}

// A 45-degree mountain with a lit left face, a shaded right face and an optional ragged snow cap.
function peak(p: P, x: number, base: number, h: number, lit: string, dark: string, cap?: [string, string]) {
  const top = base - h;
  const capH = Math.round(h * 0.3);
  for (let i = 0; i < h; i++) {
    const snowy = cap && i < capH;
    p.rect(x - i - 1, top + i, i + 1, 1, snowy ? cap[0] : lit);
    p.rect(x, top + i, i + 1, 1, snowy ? cap[1] : dark);
  }
  if (cap) for (let j = -capH; j <= capH; j += 2) if (p.rnd() < 0.6) p.rect(x + j, top + capH, 1, 1 + Math.floor(p.rnd() * 3), j < 0 ? cap[0] : cap[1]);
}

// A pine in tiers, with snow resting on the left of each tier when snowy.
function pine(p: P, x: number, base: number, h: number, c: string, snowy = false) {
  p.rect(x, base - 2, 1, 3, '#2b2433');
  for (let i = 0; i < 3; i++) {
    const top = base - h + i * Math.round(h / 4);
    const th = Math.round(h / 3);
    tri(p, x, top, 2 + i, th, c);
    if (snowy) p.rect(x - 2 - i, top + th - 1, 3 + i, 1, '#f4f4f4');
  }
  if (snowy) p.rect(x, base - h, 1, 1, '#f4f4f4');
}

const GULL = ['.ww.ww.', 'w..w..w'];
const SHIP = [
  '.......r........',
  '.......m........',
  '......sm.s......',
  '.....ssm.ss.....',
  '....sssm.sss....',
  '...ssssm.sssS...',
  '..sssssm.ssSSS..',
  '.......m........',
  'hHHHHHHHHHHHHHh.',
  '.hhhhhhhhhhhhh..',
  '..hhwhhwhhwhh...',
  '...hhhhhhhhh....',
];
const VULTURE = ['k.....k', '.kk.kk.', '...k...'];
const CAMEL = ['..kk.....', '..k.kk.k.', '.k.kkkkk.', 'kk..kkk..', '...k.k.k.', '...k.k.k.'];
const CLOUD = ['....wwww......', '..wwwwwwww.ww.', '.wwwwwwwwwwwww', 'wwwwwwwwwwwwww', '.ssssssssssss.'];

function snow(p: P) {
  const { W, H, rnd, rect } = p;
  const hz = Math.round(H * 0.6);
  sky(p, ['#333c57', '#566c86', '#94b0c2', '#c2d3df'], 0, hz);
  const sx = Math.round(W * 0.72);
  const sy = Math.round(H * 0.12);
  glowAt(p, sx, sy, 14, '#f4f4f4');
  disc(p, sx, sy, 4, '#f4f4f4');
  for (let i = 0; i < 2; i++) drifter(p, Math.round(H * 0.05 + rnd() * hz * 0.25), 80 + rnd() * 40, { w: '#c2d3df', s: '#94b0c2' });
  for (let x = -30; x < W + 30; x += 30 + Math.floor(rnd() * 22)) peak(p, x, hz, 30 + Math.floor(rnd() * 22), '#566c86', '#333c57', ['#f4f4f4', '#c2d3df']);
  for (let x = -20; x < W + 20; x += 20 + Math.floor(rnd() * 16)) peak(p, x, hz + 4, 12 + Math.floor(rnd() * 8), '#94b0c2', '#566c86', ['#f4f4f4', '#c2d3df']);
  rect(0, hz + 2, W, H - hz - 2, '#f4f4f4');
  for (let x = 0; x < W; x += 3 + Math.floor(rnd() * 4)) pine(p, x, hz + 4, 8 + Math.floor(rnd() * 7), '#1a4b50', true);
  // drifts: soft blue shadow lines across the snow
  for (let k = 0, n = Math.floor((H - hz) / 9); k < n; k++)
    for (let x = 0; x < W; x++) rect(x, hz + 12 + k * 9 + Math.round(Math.sin(x * 0.06 + k * 2) * 2), 1, 1, '#c2d3df');
  // frozen pond
  const ly = hz + Math.round((H - hz) * 0.45);
  const lw = Math.round(W * 0.28);
  const lx = Math.round(W * 0.22);
  for (let dy = -3; dy <= 3; dy++) {
    const w = Math.round(lw * Math.sqrt(1 - (dy / 4) ** 2));
    rect(lx - w, ly + dy, w * 2, 1, '#94b0c2');
  }
  for (let i = 0; i < 4; i++) rect(lx - lw / 2 + i * 7, ly - 2 + i, 4, 1, '#f4f4f4');
  // cabin: windows light the snow, smoke from the chimney
  const cx = Math.round(W * 0.66);
  const cy = hz + Math.round((H - hz) * 0.32);
  glowAt(p, cx + 3, cy - 4, 8, '#ffcd75');
  glowAt(p, cx + 12, cy - 4, 8, '#ffcd75');
  rect(cx, cy - 9, 16, 9, '#7a4b2a');
  for (let r = cy - 8; r < cy; r += 2) rect(cx, r, 16, 1, '#5d3a20');
  rect(cx + 6, cy - 6, 4, 6, '#2b2433');
  rect(cx + 2, cy - 7, 3, 3, '#ffcd75');
  rect(cx + 11, cy - 7, 3, 3, '#ffcd75');
  for (const wx of [cx + 3, cx + 12]) halo(p, wx, cy - 6, 6, '#ffcd75', 2);
  rect(cx + 12, cy - 19, 2, 6, '#566c86');
  rect(cx + 12, cy - 20, 2, 1, '#f4f4f4');
  tri(p, cx + 8, cy - 17, 10, 8, '#5d3a20');
  tri(p, cx + 8, cy - 18, 10, 7, '#f4f4f4');
  rect(cx - 2, cy - 10, 21, 1, '#c2d3df');
  rect(cx - 1, cy, 18, 1, '#c2d3df');
  p.sparks.push({ x: cx + 12, y: cy - 22, k: 'smoke' }, { x: cx + 13, y: cy - 22, k: 'smoke' });
  // footprints up to the door, a fence, and big pines framing the view
  for (let y = H - 2, i = 0; y > cy + 2; y -= 3, i++) {
    const x = cx + 8 + Math.round(Math.sin(y * 0.08) * 6) + (i % 2 ? 2 : 0);
    rect(x, y, 1, 1, '#94b0c2');
  }
  const fy = cy + Math.round((H - cy) * 0.3);
  for (let x = 0; x < Math.round(W * 0.45); x += 5) {
    rect(x, fy - 4, 1, 5, '#5d3a20');
    rect(x, fy - 5, 1, 1, '#f4f4f4');
  }
  rect(0, fy - 3, Math.round(W * 0.45), 1, '#7a4b2a');
  rect(0, fy - 1, Math.round(W * 0.45), 1, '#7a4b2a');
  pine(p, 4, H - 4, Math.round(Math.min(32, H * 0.14)), '#1a4b50', true);
  pine(p, W - 6, H - 2, Math.round(Math.min(38, H * 0.17)), '#1a4b50', true);
  pine(p, W - 16, H - 10, Math.round(Math.min(24, H * 0.11)), '#1a4b50', true);
  const n = Math.min(90, Math.round((W * H) / 400));
  for (let i = 0; i < n; i++) {
    const near = i % 3 === 0;
    p.sparks.push({ x: Math.floor(rnd() * (W + 10)) - 10, y: -2, k: 'fall', dx: near ? 12 : 5, dy: H + 4, c: '#f4f4f4', d: near ? 7 : 13 });
  }
}

function harbor(p: P) {
  const { W, H, rnd, rect } = p;
  const hz = Math.round(H * 0.56);
  sky(p, ['#29366f', '#5d275d', '#b13e53', '#ef7d57', '#ffcd75'], 0, hz);
  for (let i = 0; i < Math.max(3, W / 30); i++) {
    const cx = Math.floor(rnd() * W);
    const cy = Math.floor(H * 0.06 + rnd() * hz * 0.55);
    const len = 12 + Math.floor(rnd() * 26);
    rect(cx, cy, len, 2, '#5d275d');
    rect(cx + 3, cy + 2, len - 6, 1, '#ef7d57');
  }
  const sx = Math.round(W * 0.38);
  glowAt(p, sx, hz, 28, '#ffcd75');
  disc(p, sx, hz, 9, '#ffcd75');
  disc(p, sx, hz, 5, '#f4f4f4');
  ridge(p, hz - 1, 3, '#5d275d', 0.05, 2);
  // a far ship on the horizon
  sprite(p, Math.round(W * 0.08), hz - 9, SHIP, { r: '#3b2340', m: '#3b2340', s: '#3b2340', S: '#3b2340', h: '#3b2340', H: '#3b2340', w: '#ef7d57' });
  const sea = hz + 2;
  rect(0, sea, W, H - sea, '#29366f');
  for (let y = sea + 1; y < H; y += 3) for (let x = (y * 7) % 11; x < W; x += 9 + ((x + y) % 5)) rect(x, y, 3 + ((x * y) % 3), 1, '#3b5dc9');
  // the sun's path on the water
  for (let y = sea; y < H; y += 2) {
    const w = 3 + (y - sea) * 0.1 + rnd() * 4;
    rect(sx - w / 2 + (rnd() - 0.5) * 3, y, w, 1, y % 4 ? '#ef7d57' : '#ffcd75');
  }
  for (let i = 0; i < 12; i++) p.sparks.push({ x: Math.round(sx - 7 + rnd() * 14), y: sea + 2 + Math.floor(rnd() * (H - sea - 4)), k: 'twinkle', w: 2, h: 1, c: '#ffcd75' });
  // lighthouse on the rocks, its beam sweeping the bay
  const lx = Math.round(W * 0.85);
  const lb = sea + 8;
  for (let i = 0; i < 5; i++) disc(p, lx - 10 + i * 5, lb + 1, 3 + (i % 2) * 2, i % 2 ? '#333c57' : '#262b44');
  for (let i = 0; i < 22; i++) {
    const w = 5 + Math.round((i / 22) * 3);
    const x0 = lx - Math.floor(w / 2);
    rect(x0, lb - 22 + i, w, 1, Math.floor(i / 4) % 2 ? '#b13e53' : '#f4f4f4');
    rect(x0 + w - 1, lb - 22 + i, 1, 1, Math.floor(i / 4) % 2 ? '#5d275d' : '#c2d3df');
  }
  rect(lx - 4, lb - 23, 9, 1, '#333c57');
  rect(lx - 3, lb - 28, 7, 5, '#333c57');
  rect(lx - 2, lb - 27, 5, 3, '#ffcd75');
  tri(p, lx, lb - 32, 4, 4, '#b13e53');
  glowAt(p, lx, lb - 26, 10, '#ffcd75');
  halo(p, lx, lb - 26, 7, '#ffcd75', 2);
  const bw = Math.round(W * 0.55);
  p.sparks.push({ x: lx - bw, y: lb - 29, k: 'sweep', w: bw, h: 7, d: 8 });
  // the pier and its lamp
  const py = sea + Math.round((H - sea) * 0.4);
  const pw = Math.round(W * 0.3);
  glowAt(p, pw - 3, py - 11, 8, '#ffcd75');
  for (let x = 2; x < pw; x += 6) rect(x, py + 2, 2, 9, '#2b2433');
  rect(0, py, pw, 2, '#7a4b2a');
  rect(0, py + 2, pw, 1, '#5d3a20');
  rect(pw - 3, py - 10, 1, 10, '#262b44');
  rect(pw - 4, py - 12, 3, 2, '#ffcd75');
  halo(p, pw - 3, py - 11, 6, '#ffcd75', 2.6);
  const streak = layer(p, 24, 3, (q) => { q.rect(0, 0, 24, 2, '#5d275d'); q.rect(3, 2, 18, 1, '#ef7d57'); });
  for (let i = 0; i < 2; i++) p.sparks.push({ x: W + 2, y: Math.round(H * (0.08 + i * 0.12)), k: 'glide', w: 24, h: 3, img: streak, dx: -(W + 30), d: 90 + i * 30 });
  const ship = layer(p, 16, 12, (q) => sprite(q, 0, 0, SHIP, { r: '#b13e53', m: '#5d3a20', s: '#f4f4f4', S: '#c2d3df', h: '#7a4b2a', H: '#d9b26c', w: '#ffcd75' }));
  const shx = Math.round(W * 0.52);
  const shy = sea + Math.round((H - sea) * 0.16);
  rect(shx - 2, shy + 12, 20, 1, '#94b0c2');
  p.sparks.push({ x: shx, y: shy, k: 'bob', w: 16, h: 12, img: ship, d: 3 });
  const gull = layer(p, 7, 2, (q) => sprite(q, 0, 0, GULL, { w: '#f4f4f4' }));
  for (let i = 0; i < 3; i++) p.sparks.push({ x: W + 2, y: Math.round(H * (0.1 + i * 0.09)), k: 'glide', w: 7, h: 2, img: gull, dx: -(W + 14), d: 24 + i * 6 });
}

function grove(p: P) {
  const { W, H, rnd, rect } = p;
  const hz = Math.round(H * 0.66);
  sky(p, ['#141a26', '#1a1c2c', '#182634', '#1a3340'], 0, hz);
  for (let i = 0; i < (W * hz) / 140; i++) {
    const x = Math.floor(rnd() * W);
    const y = Math.floor(rnd() * hz * 0.6);
    rect(x, y, 1, 1, rnd() < 0.3 ? '#f4f4f4' : '#94b0c2');
    if (i % 8 === 0) p.sparks.push({ x, y, k: 'twinkle' });
  }
  const mx = Math.round(W * 0.18);
  const my = Math.round(H * 0.09);
  disc(p, mx, my, 5, '#f4f4f4');
  disc(p, mx + 2, my - 1, 5, '#141a26');
  // far canopy, then a row of trunks under the near canopy
  for (let x = -6; x < W + 6; x += 6 + Math.floor(rnd() * 6)) disc(p, x, hz - 16 - Math.floor(rnd() * 8), 6 + Math.floor(rnd() * 5), '#16323c');
  rect(0, hz - 16, W, 16, '#16323c');
  for (let x = 2; x < W; x += 8 + Math.floor(rnd() * 5)) rect(x, hz - 14, 2, 14, '#101820');
  for (let x = -4; x < W + 4; x += 5 + Math.floor(rnd() * 5)) disc(p, x, hz - 16, 4 + Math.floor(rnd() * 3), '#1a4b50');
  rect(0, hz, W, H - hz, '#122a30');
  for (let y = hz + 3; y < H; y += 4) for (let x = (y * 5) % 9; x < W; x += 9) rect(x, y, 1, 2, '#1a4b50');
  // mist along the treeline
  p.ctx.globalAlpha = 0.25;
  for (let i = 0; i < 3; i++) rect(0, hz - 3 + i * 2, W, 2, '#73eff7');
  p.ctx.globalAlpha = 1;
  // the old tree: flared roots, a glowing hollow, a huge canopy with hanging vines
  const tx = Math.round(W / 2);
  const tb = hz + Math.round((H - hz) * 0.35);
  const th = Math.round(H * 0.3);
  const s = Math.min(1.4, Math.max(0.8, Math.min(W / 110, H / 150))); // canopy scale: grows with the screen, never buries the trunk
  for (let i = 0; i < th; i++) {
    const w = 6 + (i > th - 8 ? Math.round((i - (th - 8)) ** 1.5) : 0);
    rect(tx - w, tb - th + i, w * 2, 1, '#2b2433');
    rect(tx - w, tb - th + i, 2, 1, '#3a3048');
    if (i % 5 === 2) rect(tx - 2 + (i % 3), tb - th + i, 1, 3, '#1f1a28');
  }
  const hy = tb - Math.round(th * 0.4);
  glowAt(p, tx, hy, 10, '#73eff7');
  for (let dy = -3; dy <= 3; dy++) rect(tx - Math.round(2 * Math.sqrt(1 - (dy / 4) ** 2)), hy + dy, Math.round(4 * Math.sqrt(1 - (dy / 4) ** 2)) + 1, 1, '#73eff7');
  rect(tx - 1, hy - 1, 1, 2, '#f4f4f4');
  p.sparks.push({ x: tx - 5, y: hy - 6, k: 'glow', w: 11, h: 12, c: '#73eff7' });
  const cy = tb - th - 4;
  const crown = [[-17, 4, 12], [16, 5, 11], [0, -8, 16], [-9, -3, 12], [9, -2, 12]];
  // lumpy silhouette: small clumps round the rim of each mass, so it reads as leaves, not circles
  for (const [dx, dy, r] of crown) for (let a = 0; a < 6.28; a += 0.7) disc(p, tx + dx * s + Math.cos(a) * r * s, cy + dy * s + Math.sin(a) * r * s * 0.8, Math.round(r * s * 0.35), '#16323c');
  for (const [dx, dy, r] of crown) disc(p, tx + dx * s, cy + dy * s, r * s, '#1a4b50');
  for (const [dx, dy, r] of [[-12, -7, 7], [2, -15, 8], [12, -5, 6], [-20, 1, 4]]) for (let a = 0; a < 6.28; a += 1.2) disc(p, tx + (dx + Math.cos(a) * r * 0.5) * s, cy + (dy + Math.sin(a) * r * 0.4) * s, Math.round(r * s * 0.55), '#257179');
  for (let i = 0; i < 70 * s; i++) rect(tx - 26 * s + Math.floor(rnd() * 52 * s), cy - 20 * s + Math.floor(rnd() * 30 * s), 1, 1, i % 4 ? '#38b764' : '#a7f070');
  for (let x = Math.round(tx - 24 * s); x < tx + 24 * s; x += 2 + Math.floor(rnd() * 3)) {
    const len = 4 + Math.floor(rnd() * 14);
    rect(x, cy + 10 * s, 1, len, '#257179');
    rect(x, cy + 10 * s + len, 1, 1, '#a7f070');
  }
  const ox = Math.round(tx + 15 * s);
  const oy = Math.round(cy + 2 * s);
  rect(ox - 2, oy - 1, 5, 3, '#16323c');
  rect(ox - 1, oy, 1, 1, '#ffcd75');
  rect(ox + 1, oy, 1, 1, '#ffcd75');
  p.sparks.push({ x: ox - 1, y: oy, k: 'blink', w: 3, h: 1, c: '#16323c', d: 5 });
  // a path of glowing stones to the tree
  for (let y = H - 3, i = 0; y > tb + 2; y -= 4, i++) {
    const x = tx + Math.round(Math.sin(y * 0.07) * 8);
    rect(x - 2, y, 4, 2, '#333c57');
    if (i % 2 === 0) rect(x - 1, y, 2, 1, '#73eff7');
  }
  // glowing mushrooms in the grass
  for (let i = 0, n = Math.max(4, Math.floor(W / 16)); i < n; i++) {
    const x = Math.floor(rnd() * W);
    const y = hz + 6 + Math.floor(rnd() * (H - hz - 10));
    const c = i % 2 ? '#73eff7' : '#a7f070';
    glowAt(p, x, y - 3, 6, c);
    rect(x, y - 3, 1, 3, '#c2d3df');
    rect(x - 2, y - 4, 5, 1, c);
    rect(x - 1, y - 5, 3, 1, c);
    rect(x - 1, y - 4, 1, 1, '#f4f4f4');
    p.sparks.push({ x: x - 4, y: y - 8, k: 'glow', w: 9, h: 8, c });
  }
  for (let i = 0, n = Math.min(32, Math.round(W / 4)); i < n; i++)
    p.sparks.push({ x: Math.floor(rnd() * W), y: hz - 34 + Math.floor(rnd() * (H - hz + 30)), k: 'wander', c: rnd() < 0.6 ? '#a7f070' : '#ffcd75', d: 7 });
}

function desert(p: P) {
  const { W, H, rnd, rect } = p;
  const hz = Math.round(H * 0.56);
  sky(p, ['#3b5dc9', '#41a6f6', '#73eff7', '#b7f4ec', '#f2e6c4'], 0, hz);
  const sx = Math.round(W * 0.22);
  const sy = Math.round(H * 0.11);
  glowAt(p, sx, sy, 18, '#ffcd75');
  disc(p, sx, sy, 7, '#ffcd75');
  disc(p, sx, sy, 5, '#f4f4f4');
  halo(p, sx, sy, 13, '#ffcd75', 4);
  for (let i = 0; i < 2; i++) drifter(p, Math.round(H * 0.04 + rnd() * hz * 0.2), 100 + rnd() * 40, { w: '#f4f4f4', s: '#e6eef4' });
  // far mesas in the haze
  for (let x = Math.floor(rnd() * 20); x < W; x += 40 + Math.floor(rnd() * 40)) {
    const w = 14 + Math.floor(rnd() * 18);
    const h = 6 + Math.floor(rnd() * 6);
    rect(x, hz - h, w, h + 2, '#e2c48e');
    rect(x + 1, hz - h, w - 2, 1, '#f2d49b');
  }
  const pyramid = (x: number, base: number, h: number, lit: string, dark: string, line: [string, string]) => {
    for (let i = 0; i < h; i++) {
      p.rect(x - i - 1, base - h + i, i + 1, 1, i % 3 === 2 ? line[0] : lit);
      p.rect(x, base - h + i, i + 1, 1, i % 3 === 2 ? line[1] : dark);
    }
  };
  pyramid(Math.round(W * 0.86), hz + 1, Math.min(16, Math.round(W * 0.12)), '#ecd3a0', '#c9ab78', ['#e2c48e', '#b89a68']);
  pyramid(Math.round(W * 0.64), hz + 3, Math.min(34, Math.round(W * 0.26)), '#f2d49b', '#b0884a', ['#d9b26c', '#8a6a3a']);
  const camel = layer(p, 9, 6, (q) => sprite(q, 0, 0, CAMEL, { k: '#8a6a3a' }));
  for (let i = 0; i < 3; i++) p.sparks.push({ x: W + 4, y: hz - 3, k: 'glide', w: 9, h: 6, img: camel, dx: -(W + 24), d: 80, t: -20 - i * 3.5 });
  // dunes, each crest lit on the sun side
  ridge(p, hz + 3, 3, '#d9b26c', 0.03, 1);
  ridge(p, hz + 12, 6, '#b0884a', 0.025, 4);
  ridge(p, hz + 13, 6, '#f2d49b', 0.025, 4.5);
  ridge(p, hz + 28, 7, '#d9b26c', 0.02, 2);
  ridge(p, hz + 29, 7, '#f2d49b', 0.02, 2.4);
  for (let k = 0, n = Math.floor((H - hz - 30) / 6); k < n; k++)
    for (let x = 0; x < W; x += 2) rect(x, hz + 36 + k * 6 + Math.round(Math.sin(x * 0.09 + k) * 1.5), 2, 1, '#d9b26c');
  // oasis with palms
  const ox = Math.round(W * 0.24);
  const oy = hz + 20;
  for (let dy = -2; dy <= 2; dy++) {
    const w = Math.round(12 * Math.sqrt(1 - (dy / 3) ** 2));
    rect(ox - w, oy + dy, w * 2, 1, dy < 0 ? '#73eff7' : '#41a6f6');
  }
  for (let x = ox - 13; x < ox + 13; x += 3) rect(x, oy - 4 + (x % 2), 1, 3, '#38b764');
  const palm = (x: number, base: number, h: number, lean: number) => {
    let tx = x;
    for (let i = 0; i < h; i++) {
      tx = x + Math.round(Math.sin((i / h) * 1.2) * lean);
      p.rect(tx, base - i, 2, 1, i % 2 ? '#7a4b2a' : '#5d3a20');
    }
    const ty = base - h;
    for (const [ax, ay] of [[-1, 0.1], [1, 0.1], [-0.8, -0.5], [0.8, -0.5], [0, -1]]) {
      for (let j = 0; j < 8; j++) p.rect(tx + 1 + Math.round(ax * j), ty + Math.round(ay * j + j * j * 0.07), 2, 1, j > 5 ? '#257179' : '#38b764');
    }
    p.rect(tx, ty + 1, 1, 1, '#5d3a20');
    p.rect(tx + 2, ty + 1, 1, 1, '#5d3a20');
  };
  palm(ox - 8, oy - 2, 22, 3);
  palm(ox + 7, oy - 1, 16, -3);
  palm(ox - 1, oy, 12, 2);
  // broken columns in the foreground, shaded toward the viewer
  const fx = Math.round(W * 0.74);
  const fy = hz + Math.round((H - hz) * 0.72);
  for (let dx = -14; dx < 26; dx++) rect(fx + dx, fy + 1, 1, 2, '#b0884a'); // shadow
  for (const [dx, h] of [[0, 22], [11, 12]]) {
    rect(fx + dx, fy - h, 6, h, '#f2d49b');
    rect(fx + dx + 4, fy - h, 2, h, '#b0884a');
    for (let y = fy - h + 3; y < fy; y += 4) rect(fx + dx + 1, y, 1, 2, '#d9b26c');
    rect(fx + dx - 1, fy - h - 1, 5, 1, '#d9b26c');
    rect(fx + dx + 3, fy - h - 2, 2, 1, '#d9b26c');
    rect(fx + dx - 1, fy - 2, 8, 2, '#d9b26c');
  }
  rect(fx - 13, fy - 5, 10, 5, '#f2d49b');
  rect(fx - 13, fy - 1, 10, 1, '#b0884a');
  disc(p, fx - 13, fy - 3, 2, '#d9b26c');
  // heat haze, blowing sand, and a vulture circling
  for (let i = 0; i < 6; i++) p.sparks.push({ x: Math.floor(rnd() * W * 0.7), y: hz - 6 + i * 3, k: 'haze', w: Math.round(W * 0.3), h: 1, c: '#f2e6c4', d: 3 });
  for (let i = 0; i < 16; i++) p.sparks.push({ x: -4, y: hz + 4 + Math.floor(rnd() * (H - hz - 6)), k: 'fall', w: 3, h: 1, dx: W + 8, dy: Math.round(rnd() * 6 - 3), c: '#f2d49b', d: 4 });
  const vulture = layer(p, 7, 3, (q) => sprite(q, 0, 0, VULTURE, { k: '#333c57' }));
  p.sparks.push({ x: Math.round(W * 0.68), y: Math.round(H * 0.16), k: 'circle', w: 7, h: 3, img: vulture, dx: 10, d: 16 });
}

// Aurora curtain: a bright lower hem with rays fading upward, striped so it reads as light, not a band.
function curtain(q: P, seed: number, cols: [string, string, string], a: number) {
  for (let x = 0; x < q.W; x++) {
    const hem = q.H * 0.75 + Math.sin(x * 0.045 + seed) * q.H * 0.18 + Math.sin(x * 0.13 + seed * 2) * q.H * 0.05;
    const len = q.H * (0.3 + 0.25 * Math.abs(Math.sin(x * 0.07 + seed)));
    const ray = 0.5 + 0.5 * Math.sin(x * 0.9 + seed) ** 2;
    for (let i = 0; i < len; i++) {
      q.ctx.globalAlpha = a * ray * (1 - i / len);
      q.rect(x, hem - i, 1, 1, i < 2 ? cols[0] : i < len * 0.45 ? cols[1] : cols[2]);
    }
  }
  q.ctx.globalAlpha = 1;
}

function aurora(p: P) {
  const { W, H, rnd, rect } = p;
  const hz = Math.round(H * 0.58);
  sky(p, ['#141a26', '#1a1c2c', '#1f2142', '#252a52'], 0, hz);
  for (let i = 0; i < (W * hz) / 70; i++) {
    const x = Math.floor(rnd() * W);
    const y = Math.floor(rnd() * hz);
    rect(x, y, 1, 1, rnd() < 0.3 ? '#f4f4f4' : '#566c86');
    if (i % 9 === 0) p.sparks.push({ x, y, k: 'twinkle' });
  }
  // the lights stay above the peaks: sparks draw over the canvas, so the curtains end where the mountains begin
  const tallest = 34;
  const ah = Math.max(24, hz - tallest);
  const green = layer(p, W + 8, ah, (q) => curtain(q, 1, ['#a7f070', '#38b764', '#257179'], 0.8));
  const teal = layer(p, W + 8, ah, (q) => curtain(q, 4, ['#73eff7', '#41a6f6', '#5d275d'], 0.5));
  p.sparks.push({ x: -4, y: 0, k: 'sway', w: W + 8, h: ah, img: teal, d: 13 });
  p.sparks.push({ x: -4, y: 2, k: 'sway', w: W + 8, h: ah - 2, img: green, d: 9 });
  for (let i = 0; i < 2; i++) p.sparks.push({ x: Math.round(W * (0.15 + rnd() * 0.5)), y: Math.round(H * (0.04 + rnd() * 0.12)), k: 'shoot', w: 5, h: 1, dx: 30, dy: 10, d: 14 + i * 9 });
  for (let x = -24; x < W + 24; x += 24 + Math.floor(rnd() * 18)) peak(p, x, hz + 2, Math.min(tallest - 2, 18 + Math.floor(rnd() * 16)), '#262b44', '#1a1c2c', ['#94b0c2', '#566c86']);
  // the lake mirrors the lights
  const lk = hz + 2;
  const lb = Math.round(H * 0.8);
  rect(0, lk, W, lb - lk, '#141a26');
  const mirror = layer(p, W + 8, lb - lk, (q) => {
    q.ctx.translate(0, q.H);
    q.ctx.scale(1, -1);
    curtain(q, 1, ['#a7f070', '#38b764', '#257179'], 0.22);
  });
  p.sparks.push({ x: -4, y: lk, k: 'sway', w: W + 8, h: lb - lk, img: mirror, d: 9 });
  for (let y = lk + 2; y < lb; y += 3) for (let x = (y * 5) % 13; x < W; x += 13) rect(x, y, 5, 1, '#1f2142');
  // snowy shore with rocks, pines, and a camp
  rect(0, lb, W, H - lb, '#566c86');
  for (let x = 0; x < W; x += 2) rect(x, lb, 2, 1 + (x % 3 === 0 ? 1 : 0), '#94b0c2');
  for (let i = 0; i < (W * (H - lb)) / 30; i++) rect(Math.floor(rnd() * W), lb + 3 + Math.floor(rnd() * (H - lb - 3)), 1, 1, rnd() < 0.5 ? '#94b0c2' : '#333c57');
  for (let i = 0; i < W / 18; i++) {
    const x = Math.floor(rnd() * W);
    const y = lb + 6 + Math.floor(rnd() * (H - lb - 6));
    disc(p, x, y, 2, '#262b44');
    rect(x - 1, y - 2, 2, 1, '#94b0c2');
  }
  for (let x = 2; x < W; x += 5 + Math.floor(rnd() * 9)) if (Math.abs(x - W * 0.7) > 14) pine(p, x, lb + 2, 10 + Math.floor(rnd() * 8), '#141a26');
  pine(p, 5, H - 2, Math.round(Math.min(34, (H - lb) * 0.9)), '#141a26');
  pine(p, W - 5, H - 1, Math.round(Math.min(40, (H - lb) * 1.05)), '#141a26');
  const cx = Math.round(W * 0.7);
  glowAt(p, cx + 8, lb + 4, 12, '#ef7d57');
  tri(p, cx, lb - 6, 6, 9, '#b13e53');
  tri(p, cx, lb - 2, 2, 5, '#5d275d');
  rect(cx + 6, lb + 4, 4, 1, '#5d3a20');
  rect(cx + 7, lb + 2, 2, 2, '#ef7d57');
  p.sparks.push({ x: cx + 7, y: lb + 1, k: 'flame' });
  halo(p, cx + 8, lb + 2, 9, '#ef7d57', 1.3);
  p.sparks.push({ x: cx + 8, y: lb - 2, k: 'smoke', d: 6 });
}

// An ellipse, filled row by row.
function blob(p: P, cx: number, cy: number, rx: number, ry: number, c: string) {
  for (let dy = -ry; dy <= ry; dy++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2)));
    p.rect(cx - w, cy + dy, w * 2 + 1, 1, c);
  }
}

// Light that falls off in six soft steps instead of two hard rings.
function softGlow(p: P, x: number, y: number, r: number, c: string) {
  p.ctx.globalAlpha = 0.05;
  for (let i = 6; i > 0; i--) disc(p, x, y, Math.round((r * i) / 6), c);
  p.ctx.globalAlpha = 1;
}

// The sleeping dragon (62x36), built from shapes: a dark outline pass first, then the fills on top.
// Head rests on the left, wing folded on its back, tail curled round the front.
function dragon(q: P) {
  const wing = (o: number, c: string) => {
    for (let y = 6 - o; y <= 18; y++) {
      const t = Math.max(0, (y - 6) / 12);
      q.rect(36 - 9 * t - o, y, 23 * t + 1 + o * 2, 1, c);
    }
  };
  const shapes = (o: number, body: string) => {
    for (const [x, y, r] of [[52, 22, 5], [55, 27, 4], [51, 31, 3], [43, 32, 3], [35, 32, 2], [28, 31, 2]]) disc(q, x, y, r + o, body);
    blob(q, 38, 20, 17 + o, 10 + o, body);
    for (const [x, y, r] of [[24, 20, 6], [19, 23, 5], [14, 26, 4]]) disc(q, x, y, r + o, body);
    blob(q, 9, 27, 7 + o, 4 + o, body);
    blob(q, 3, 28, 3 + o, 2 + o, body);
    blob(q, 18, 32, 3 + o, 2 + o, body);
  };
  wing(1, '#5d275d');
  shapes(1, '#5d275d');
  shapes(0, '#b13e53');
  for (let dy = -4; dy <= 4; dy++) {
    const w = Math.round(13 * Math.sqrt(1 - (dy / 4.5) ** 2));
    q.rect(40 - w, 26 + dy, w * 2 + 1, 1, dy % 2 ? '#d9566b' : '#ef7d57'); // banded belly scales
  }
  for (let x = 24; x < 36; x++) q.rect(x, Math.round(20 - 10 * Math.sqrt(1 - ((x - 38) / 17) ** 2)) + 1, 1, 1, '#d9566b');
  wing(0, '#8a2f4a');
  for (const bx of [27, 35, 43, 50]) for (let i = 0; i <= 12; i++) q.rect(Math.round(36 + ((bx - 36) * i) / 12), 6 + i, 1, 1, '#5d275d');
  for (const [a, b] of [[28, 34], [36, 42], [44, 49]]) for (let x = a; x <= b; x++) q.rect(x, 18 - Math.round(Math.sin(((x - a) / (b - a)) * Math.PI) * 2), 1, 1, '#5d275d'); // scalloped hem
  for (const x of [52, 56, 22, 18]) q.rect(x, x > 40 ? 16 + (x - 52) : 14 + (22 - x), 2, 2, '#ffcd75');
  q.rect(13, 22, 1, 2, '#f4f4f4');
  q.rect(14, 20, 1, 2, '#f4f4f4');
  q.rect(15, 19, 1, 1, '#c2d3df');
  q.rect(7, 25, 3, 1, '#1a1c2c');
  q.rect(1, 27, 1, 1, '#1a1c2c');
  q.rect(1, 30, 10, 1, '#5d275d');
  for (const x of [16, 18, 20]) q.rect(x, 34, 1, 1, '#f4f4f4');
}

function lair(p: P) {
  const { W, H, rnd, rect } = p;
  rect(0, 0, W, H, '#1a1c2c');
  // rough rock: overlapping lumps in three shades, a few with a lit edge
  for (let i = 0; i < (W * H) / 12; i++) {
    const x = Math.floor(rnd() * W);
    const y = Math.floor(rnd() * H);
    const r = 1 + Math.floor(rnd() * 3);
    const c = rnd();
    disc(p, x, y, r, c < 0.45 ? '#20243f' : c < 0.85 ? '#1a1c2c' : '#262b44');
    if (c > 0.94) rect(x - r, y - r, r + 1, 1, '#333c57');
  }
  const floor = Math.round(H * 0.84);
  const cx = Math.round(W / 2);
  const half = Math.round(Math.min(W * 0.44, 80));
  const mh = Math.round(Math.min(H * 0.13, 26));
  softGlow(p, cx, floor - mh, Math.round(Math.min(W, H) * 0.8), '#ffcd75');
  softGlow(p, cx, floor - mh, Math.round(Math.min(W, H) * 0.4), '#ef7d57');
  // dark cave walls closing in at the sides
  for (let y = 0; y < H; y++) {
    const w = Math.round(W * 0.1 + Math.sin(y * 0.08) * 4 + Math.sin(y * 0.21) * 2);
    rect(0, y, w, 1, '#0f1019');
    rect(W - w, y, w, 1, '#0f1019');
  }
  for (let x = 2; x < W; x += 5 + Math.floor(rnd() * 6)) {
    const len = 4 + Math.floor(rnd() * 14);
    for (let i = 0; i < len; i++) {
      const w = Math.round((1 - i / len) * 2);
      rect(x - w, i, w * 2 + 1, 1, '#262b44');
      rect(x - w, i, 1, 1, '#333c57');
    }
    if (rnd() < 0.3) p.sparks.push({ x, y: len, k: 'twinkle', c: '#73eff7' });
  }
  torch(p, Math.round(W * 0.16), Math.round(H * 0.42));
  torch(p, Math.round(W * 0.84), Math.round(H * 0.42));
  // the hoard: a mound of coins with gems, a sword, and the bones of those who came for it
  rect(0, floor, W, H - floor, '#141a26');
  for (let i = 0; i < W / 2; i++) rect(Math.floor(rnd() * W), floor + 1 + Math.floor(rnd() * (H - floor - 1)), 2, 1, '#20243f');
  for (let x = cx - half; x <= cx + half; x++) {
    const h = Math.round(mh * (1 - ((x - cx) / half) ** 2));
    rect(x, floor - h, 1, h + 2, '#d9b26c');
    rect(x, floor - h, 1, 1, '#ffcd75');
  }
  for (let x = cx - half - 8; x < cx + half + 8; x += 2) if (rnd() < 0.5) rect(x, floor + 1 + Math.floor(rnd() * 4), 1, 1, rnd() < 0.7 ? '#d9b26c' : '#ffcd75');
  for (let i = 0; i < half * 3; i++) {
    const x = cx - half + Math.floor(rnd() * half * 2);
    const top = floor - Math.round(mh * (1 - ((x - cx) / half) ** 2));
    rect(x, top + 1 + Math.floor(rnd() * Math.max(1, floor - top)), 1, 1, ['#ffcd75', '#ef7d57', '#f4f4f4', '#ffcd75', '#b13e53', '#73eff7', '#a7f070'][i % 7]);
  }
  rect(cx + half - 12, floor - 16, 1, 11, '#c2d3df');
  rect(cx + half - 14, floor - 7, 5, 1, '#ffcd75');
  rect(cx + half - 12, floor - 17, 1, 1, '#f4f4f4');
  sprite(p, cx - half - 4, floor + 2, SKULL, BONES);
  sprite(p, cx + half + 2, floor + 3, BONE, BONES);
  const dx = cx - 31;
  const dy = floor - mh - 26;
  p.sparks.push({ x: dx, y: dy, k: 'breathe', w: 62, h: 36, img: layer(p, 62, 36, dragon), d: 4 });
  p.sparks.push({ x: dx, y: dy + 25, k: 'smoke', d: 5 }, { x: dx + 1, y: dy + 26, k: 'smoke', d: 6 });
  for (let i = 0; i < 16; i++) {
    const x = cx - half + 4 + Math.floor(rnd() * (half * 2 - 8));
    const top = floor - Math.round(mh * (1 - ((x - cx) / half) ** 2));
    p.sparks.push({ x, y: top + 1 + Math.floor(rnd() * 4), k: 'twinkle', c: '#f4f4f4', d: 3 });
  }
  for (let i = 0; i < 10; i++) p.sparks.push({ x: cx - half + Math.floor(rnd() * half * 2), y: floor - 4, k: 'ember' });
  halo(p, cx, floor - mh, Math.round(half * 0.8), '#ffcd75', 5);
  for (let i = 0; i < 2; i++) flyer(p, BAT, '#333c57', -8, Math.round(H * (0.18 + i * 0.08)), W + 16, 16 + i * 6);
}

function storm(p: P) {
  const { W, H, rnd, rect } = p;
  const base = Math.round(H * 0.7);
  sky(p, ['#1a1c2c', '#262b44', '#333c57', '#3b4466'], 0, base); // lighter toward the town's glow
  // dark cloud banks, nearer ones lower and darker, each a band of billows with a lit rim; sky shows between them
  const band = Math.round(H * 0.06);
  for (const [y0, r, c, edge] of [[0.08, 5, '#20243f', '#333c57'], [0.19, 6, '#1a1c2c', '#333c57'], [0.3, 7, '#141a26', '#566c86']] as const) {
    const y = Math.round(H * y0);
    const top = y0 < 0.1 ? 0 : y - band;
    rect(0, top, W, y - top, c);
    for (let x = -r; x < W + r; x += r + Math.floor(rnd() * r)) {
      const rr = r - 2 + Math.floor(rnd() * 4);
      const cy = y + Math.floor(rnd() * 3);
      disc(p, x, cy + 1, rr, edge);
      disc(p, x, cy, rr, c);
      if (top) disc(p, x + 3, top, rr - 1, c); // lumpy tops too
    }
  }
  for (let i = 0; i < 3; i++) drifter(p, Math.round(H * (0.06 + i * 0.1)), 40 + rnd() * 20, { w: '#262b44', s: '#1a1c2c' });
  const bolt = layer(p, 24, Math.round(base * 0.7), (q) => {
    let x = 12;
    for (let y = 0; y < q.H; y += 2) {
      x += Math.round((q.rnd() - 0.5) * 4);
      q.rect(x - 1, y, 3, 2, '#73eff7');
      q.rect(x, y, 1, 2, '#f4f4f4');
      if (y === Math.round(q.H * 0.4)) for (let j = 0, bx = x; j < 10; j++) q.rect((bx += 1), y + j, 1, 1, '#f4f4f4');
    }
  });
  p.sparks.push({ x: Math.round(W * 0.28), y: 0, k: 'flash', w: 24, h: Math.round(base * 0.7), img: bolt, d: 11, t: -4 });
  ridge(p, base - 22, 4, '#1a1c2c', 0.05, 3);
  // the village: timber houses, a few windows still lit
  const lit: [number, number][] = [];
  const house = (x: number, w: number, h: number, roof: string) => {
    const top = base - h;
    rect(x, top, w, h, '#333c57');
    rect(x, top, 1, h, '#1a1c2c');
    rect(x + w - 1, top, 1, h, '#1a1c2c');
    rect(x, top + Math.round(h / 2), w, 1, '#1a1c2c');
    tri(p, x + Math.floor(w / 2), top - Math.round(w / 2), Math.ceil(w / 2) + 1, Math.round(w / 2), roof);
    rect(x + w - 4, top - Math.round(w / 2) - 2, 2, 5, '#262b44');
    for (let wy = top + 2; wy < base - 3; wy += Math.round(h / 2))
      for (let wx = x + 2; wx < x + w - 3; wx += 5) {
        const on = rnd() < 0.45;
        rect(wx, wy, 2, 3, on ? '#ffcd75' : '#1a1c2c');
        if (on) lit.push([wx, wy]);
        if (on && rnd() < 0.35) p.sparks.push({ x: wx, y: wy, k: 'flicker', w: 2, h: 3, c: '#ffcd75', d: 4 });
      }
  };
  for (let x = -3; x < W; ) {
    const w = 11 + Math.floor(rnd() * 8);
    if (Math.abs(x + w / 2 - W * 0.72) < 8) {
      // the chapel: tall, with a spire and a round lit window
      rect(x, base - 34, 10, 34, '#333c57');
      tri(p, x + 5, base - 48, 6, 14, '#29366f');
      disc(p, x + 5, base - 26, 2, '#ffcd75');
      lit.push([x + 5, base - 26]);
      x += 12;
      continue;
    }
    house(x, w, 12 + Math.floor(rnd() * 10), rnd() < 0.5 ? '#29366f' : '#5d275d');
    x += w + 1;
  }
  for (const [x, y] of lit) glowAt(p, x + 1, y + 1, 4, '#ffcd75');
  // the wet street, with the windows mirrored in it
  rect(0, base, W, H - base, '#1f2142');
  for (let y = base + 2, r = 0; y < H; y += 3, r++) for (let x = r % 2 ? 2 : 0; x < W; x += 5) rect(x, y, 3, 1, '#262b44');
  for (let i = 0; i < W / 25; i++) {
    const x = Math.floor(rnd() * W);
    const y = base + 5 + Math.floor(rnd() * (H - base - 8));
    rect(x - 6, y, 12, 1, '#29366f');
    rect(x - 4, y + 1, 8, 1, '#29366f');
  }
  p.ctx.globalAlpha = 0.35;
  for (const [x] of lit) for (let y = base + 1; y < Math.min(H, base + 16); y += 2) rect(x, y, 2, 1, '#ffcd75');
  p.ctx.globalAlpha = 1;
  const lx = Math.round(W * 0.3);
  glowAt(p, lx, base - 12, 10, '#ffcd75');
  rect(lx, base - 11, 1, 11, '#141a26');
  rect(lx - 1, base - 13, 3, 2, '#ffcd75');
  p.sparks.push({ x: 0, y: 0, k: 'flash', w: W, h: H, c: 'rgb(194 211 223 / .22)', d: 11, t: -4 });
  for (let i = 0, n = Math.min(80, Math.round((W * H) / 350)); i < n; i++)
    p.sparks.push({ x: Math.floor(rnd() * (W + H * 0.3)), y: -4, k: 'rain', dx: -Math.round(H * 0.3), dy: H + 8, c: '#94b0c2', d: 0.9 });
  for (let i = 0; i < 12; i++) p.sparks.push({ x: Math.floor(rnd() * W), y: base + 2 + Math.floor(rnd() * (H - base - 3)), k: 'twinkle', w: 2, h: 1, c: '#94b0c2', d: 1 });
}

// A floating island, painted into its own layer so it can drift.
function island(q: P, top: 'tree' | 'house') {
  const { W, H, rect, rnd } = q;
  const cx = W / 2;
  for (let r = 8; r < H; r++) {
    const w = Math.round((W / 2) * (1 - (r - 8) / (H - 8)) ** 0.8 + (rnd() < 0.3 ? 1 : 0));
    rect(cx - w, r, w * 2, 1, '#566c86');
    rect(cx - w, r, 2, 1, '#94b0c2');
    rect(cx + w - 3, r, 3, 1, '#333c57');
  }
  rect(0, 6, W, 3, '#7a4b2a');
  rect(0, 5, W, 2, '#38b764');
  rect(1, 4, W - 2, 1, '#a7f070');
  for (let x = 3; x < W - 3; x += 4) rect(x, 9, 1, 2 + Math.floor(rnd() * 4), '#5d3a20');
  if (top === 'tree') {
    rect(W * 0.3, 0, 2, 5, '#5d3a20');
    disc(q, Math.round(W * 0.3) + 1, 0, 4, '#38b764');
    disc(q, Math.round(W * 0.3), -1, 2, '#a7f070');
  }
  if (top === 'house') {
    rect(cx - 4, 0, 8, 5, '#d9b26c');
    rect(cx - 1, 2, 2, 3, '#5d3a20');
    rect(cx - 5, -1, 10, 1, '#b13e53');
  }
}

function isles(p: P) {
  const { W, H, rnd, rect } = p;
  const ct = Math.round(H * 0.76);
  sky(p, ['#3b5dc9', '#41a6f6', '#5cc8f6', '#73eff7', '#b7f4ec'], 0, ct);
  const sx = Math.round(W * 0.82);
  const sy = Math.round(H * 0.08);
  glowAt(p, sx, sy, 16, '#ffcd75');
  disc(p, sx, sy, 5, '#ffcd75');
  disc(p, sx, sy, 3, '#f4f4f4');
  halo(p, sx, sy, 11, '#ffcd75', 4);
  // hazy islands far off
  for (let i = 0; i < Math.max(3, W / 40); i++) {
    const x = Math.round(W * (0.15 + rnd() * 0.7));
    const y = Math.floor(H * 0.22 + rnd() * H * 0.45);
    const w = 3 + Math.floor(rnd() * 4);
    p.ctx.globalAlpha = 0.55;
    rect(x - w, y - 1, w * 2, 2, '#73eff7');
    for (let r = 1; r < w; r++) {
      const rw = Math.max(1, Math.round(w * (1 - r / w) + (r % 2 ? 0 : 1)));
      rect(x - rw, y + r, rw * 2, 1, '#94b0c2');
    }
    p.ctx.globalAlpha = 1;
  }
  // the sea of clouds below
  for (let y = ct - 4, row = 0; y < H; y += 5, row++)
    for (let x = row % 2 ? -4 : 2; x < W + 8; x += 9 + Math.floor(rnd() * 6)) {
      const r = 4 + Math.floor(rnd() * 4);
      disc(p, x, y + 2, r, '#c2d3df');
      disc(p, x, y, r, '#f4f4f4');
    }
  rect(0, ct + 8, W, H - ct - 8, '#f4f4f4');
  for (let y = ct + 10; y < H; y += 6) for (let x = (y * 3) % 11; x < W; x += 11) rect(x, y, 6, 1, '#e6eef4');
  const big = Math.min(64, Math.round(W * 0.5));
  const isl: [number, number, number, number, 'tree' | 'house', number][] = [
    [Math.round(W * 0.1), Math.round(H * 0.3), big, 30, 'house', 6],
    [Math.round(W * 0.6), Math.round(H * 0.48), Math.round(big * 0.55), 18, 'tree', 7],
    [Math.round(W * 0.68), Math.round(H * 0.16), Math.round(big * 0.3), 11, 'tree', 5],
  ];
  for (const [x, y, w, h, top, d] of isl) {
    const img = layer(p, w, h + 6, (q) => {
      q.ctx.translate(0, 6);
      island({ ...q, H: h }, top);
    });
    p.sparks.push({ x, y: y - 6, k: 'bob', w, h: h + 6, img, d });
  }
  // a waterfall pouring off the big island into the clouds
  const fx = Math.round(W * 0.1 + big - 5);
  const fy = Math.round(H * 0.3) + 6;
  rect(fx - 1, fy, 4, ct - fy, '#73eff7');
  rect(fx, fy, 1, ct - fy, '#f4f4f4');
  rect(fx + 2, fy, 1, ct - fy, '#41a6f6');
  for (let y = fy + 3; y < ct; y += 5) rect(fx - 1, y, 1, 2, '#f4f4f4');
  for (let i = 0; i < 12; i++) p.sparks.push({ x: fx - 1 + Math.floor(rnd() * 4), y: fy, k: 'fall', dy: ct - fy, c: '#f4f4f4', d: 1.6 });
  disc(p, fx + 1, ct, 5, '#f4f4f4');
  const cloud = layer(p, 14, 5, (q) => sprite(q, 0, 0, CLOUD, { w: '#f4f4f4', s: '#c2d3df' }));
  for (let i = 0; i < 5; i++) p.sparks.push({ x: W + 2, y: Math.round(H * (0.05 + rnd() * 0.6)), k: 'glide', w: 14, h: 5, img: cloud, dx: -(W + 20), d: 50 + rnd() * 40 });
  for (let i = 0; i < 3; i++) flyer(p, GULL, '#29366f', W + 2, Math.round(H * (0.2 + i * 0.07)), -(W + 14), 30 + i * 8);
}

const PAINT: Record<Exclude<Bg, 'auto' | 'plain'>, (p: P) => void> = { castle, dungeon, forest, hell, snow, harbor, grove, desert, aurora, lair, storm, isles };

// Paints the scene into el (a fixed, full-screen layer) at px screen pixels per scene pixel.
export function mountScene(el: HTMLElement, scene: Exclude<Bg, 'auto'>, px: number, strength: number, anim: boolean) {
  el.innerHTML = '';
  el.style.backgroundImage = '';
  el.className = anim ? '' : 'still';
  el.style.setProperty('--p', `${px}px`);
  el.style.setProperty('--dim', String([0.7, 0.45, 0.2][strength - 1]));
  if (scene === 'plain') return;
  const W = Math.ceil(innerWidth / px);
  const H = Math.ceil(innerHeight / px);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const p: P = {
    W, H, ctx, sparks: [], rnd: seeded(7),
    rect: (x, y, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    },
  };
  PAINT[scene](p);
  el.style.backgroundImage = `url(${canvas.toDataURL()})`;
  el.style.backgroundSize = `${W * px}px ${H * px}px`;
  const r = seeded(11);
  el.innerHTML = p.sparks.map((s) => {
    const size = s.w ? `width:${s.w * px}px;height:${s.h! * px}px;` : '';
    const img = s.img ? `background-image:url(${s.img});` : '';
    const vars = `${s.dx ? `--dx:${s.dx * px}px;` : ''}${s.dy ? `--dy:${s.dy * px}px;` : ''}${s.c ? `--c:${s.c};` : ''}`;
    const d = s.d === undefined ? 2 + r() * 4 : s.t === undefined ? s.d * (0.8 + r() * 0.4) : s.d;
    const t = s.t ?? (s.d === undefined ? -r() * 6 : -r() * d);
    return `<i class="spark s-${s.k}" style="left:${s.x * px}px;top:${s.y * px}px;${size}${img}${vars}--t:${t.toFixed(2)}s;--d:${d.toFixed(2)}s"></i>`;
  }).join('');
}
