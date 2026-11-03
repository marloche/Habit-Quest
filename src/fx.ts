import { hero } from './sprites';
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

export function shake() {
  document.body.classList.remove('shake');
  void document.body.offsetWidth; // restart the animation
  document.body.classList.add('shake');
}

export function toast(text: string) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = text;
  layer().append(el);
  setTimeout(() => el.remove(), 3500);
}

type Banner = { title: string; sub: string; level?: number; onShow?: () => void };
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
  el.className = 'banner';
  el.setAttribute('aria-label', `${b.title}. ${b.sub}. Tap to close.`);
  el.innerHTML = `${b.level ? `<div class="banner-hero">${hero(b.level, 128)}</div>` : ''}<div class="banner-title">${esc(b.title)}</div><div class="banner-sub">${esc(b.sub)}</div>`;
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
  setTimeout(close, 2600);
}
