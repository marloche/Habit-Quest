import type { Bg } from './logic/types';

// Background scenes, painted procedurally onto a small canvas (one canvas pixel = 3-5 screen pixels) so they fit
// any screen shape. Moving bits are a few tiny DOM sparks animated with CSS transforms, so nothing repaints per frame.
type Kind = 'flame' | 'twinkle' | 'ember' | 'smoke' | 'glow';
type Spark = { x: number; y: number; k: Kind; w?: number; h?: number };
type P = { W: number; H: number; rnd: () => number; rect: (x: number, y: number, w: number, h: number, c: string) => void; ctx: CanvasRenderingContext2D; sparks: Spark[] };

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
};

const banner = (p: P, x: number, y: number, h: number, c: string) => {
  p.rect(x, y, 3, h, c);
  p.rect(x + 1, y + 2, 1, 1, '#ffcd75');
  p.rect(x + 1, y + h - 1, 1, 1, '#1a1c2c'); // notched tail
};

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
    for (let y = base - h + 4; y < base - 4; y += 6) if (rnd() < 0.7) rect(x + 2 + Math.floor(rnd() * (w - 5)), y, 1, 2, '#ffcd75');
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
  for (let i = 0; i < Math.max(2, W / 40); i++)
    sprite(p, Math.floor(rnd() * (W - 8)), hz - 10 - Math.floor(rnd() * 6), DEMON, { k: '#1a0f16', y: '#ef7d57' });
  ridge(p, hz + 6, 5, '#1f0f18', 0.11, 2, 0.04);
  const lava = Math.round(H * 0.68);
  const lh = Math.max(6, Math.round(H * 0.07));
  for (const fx of [Math.round(W * 0.18), Math.round(W * 0.78)]) {
    rect(fx, hz + 4, 3, lava - hz - 4, '#ef7d57');
    rect(fx + 1, hz + 4, 1, lava - hz - 4, '#ffcd75');
    glowAt(p, fx + 1, lava - 4, 10, '#ef7d57');
  }
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

const PAINT: Record<Exclude<Bg, 'auto' | 'plain'>, (p: P) => void> = { castle, dungeon, forest, hell };

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
    return `<i class="spark s-${s.k}" style="left:${s.x * px}px;top:${s.y * px}px;${size}--t:${(-r() * 6).toFixed(2)}s;--d:${(2 + r() * 4).toFixed(2)}s"></i>`;
  }).join('');
}
