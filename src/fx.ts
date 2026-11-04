import type { Look } from './logic/types';
import { hero, ICONS, svg } from './sprites';
import { esc } from './ui/html';

// Effects live in #fx, outside #app, so re-renders don't cut them off.
const layer = () => document.getElementById('fx')!;

export function floatText(from: Element | null, text: string, cls = '') {
  const r = from?.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = `float ${cls}`;
  el.textContent = text;
  el.style.left = `${r ? r.left + r.width / 2 : innerWidth / 2}px`;
  el.style.top = `${r ? r.top : innerHeight / 2}px`;
  layer().append(el);
  setTimeout(() => el.remove(), 1200);
}

// A few pixel hearts float up from a petted pet.
export function hearts(from: Element) {
  const r = from.getBoundingClientRect();
  for (let i = 0; i < 3; i++) {
    const el = document.createElement('div');
    el.className = 'heart juice';
    el.innerHTML = svg(ICONS.heart, 12 + (i % 2) * 4);
    el.style.left = `${r.left + r.width * (0.2 + 0.3 * i)}px`;
    el.style.top = `${r.top + 8}px`;
    el.style.setProperty('--dx', `${(i - 1) * 10}px`);
    el.style.animationDelay = `${i * 0.12}s`;
    layer().append(el);
    setTimeout(() => el.remove(), 1400);
  }
}

export function shake() {
  document.body.classList.remove('shake');
  void document.body.offsetWidth; // restart the animation
  document.body.classList.add('shake');
}

let toastFreeAt = 0;

// Toasts queue up instead of drawing on top of each other.
export function toast(text: string) {
  const wait = Math.max(0, toastFreeAt - Date.now());
  toastFreeAt = Date.now() + wait + 3600;
  setTimeout(() => {
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.textContent = text;
    layer().append(el);
    setTimeout(() => el.remove(), 3500);
  }, wait);
}

// prize: a trophy won with this banner, named in the rarity font (tier 2 = EPIC, 3 = LEGENDARY).
// reveal: an EPIC or LEGENDARY trophy gets the big show: light rays, and it waits for a tap instead of closing itself.
type Banner = { title: string; sub: string; level?: number; worn?: string[]; look?: Look; prize?: { name: string; tier: number }; reveal?: boolean; onShow?: () => void };
const queue: Banner[] = [];
let showing = false;

// Banners play one at a time, so quick check-offs don't stack celebrations on top of each other.
export function banner(b: Banner) {
  queue.push(b);
  if (!showing) next();
}

function next() {
  const b = queue.shift();
  showing = !!b;
  if (!b) return;
  const el = document.createElement('button');
  el.className = b.reveal ? `banner reveal t${b.prize?.tier ?? 2}` : 'banner';
  el.setAttribute('aria-label', `${b.title}. ${b.sub}.${b.prize ? ` Trophy: ${b.prize.name}.` : ''} Tap to close.`);
  el.innerHTML = `${b.reveal ? '<div class="rays juice"></div>' : ''}${b.level ? `<div class="banner-hero">${hero(b.level, 128, b.worn, b.look)}</div>` : ''}<div class="banner-title">${esc(b.title)}</div><div class="banner-sub">${esc(b.sub)}</div>${
    b.prize ? `<div class="banner-prize rare t${b.prize.tier}">${esc(b.prize.name)}</div>` : ''}`;
  let done = false;
  const close = () => {
    if (done) return;
    done = true;
    el.remove();
    setTimeout(next, 150);
  };
  el.addEventListener('click', close);
  layer().append(el);
  b.onShow?.();
  setTimeout(close, b.reveal ? 9000 : 2600);
}
