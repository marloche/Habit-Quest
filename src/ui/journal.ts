import { weekdayName } from '../logic/day';
import { byMonth, clockOf, ENTRY_MAX, JOURNAL_MAX, MOODS, pageId, pages, type Page } from '../logic/journal';
import type { State } from '../logic/types';
import { moodFace, svg } from '../sprites';
import { esc } from './html';

// The Keep: a dusty library lit by one candle, an antique book open on the reading desk.
// view: write (a fresh page, or an entry being edited), archive (every page by month), read (one page, turn to the next).
// draft: the unsealed page, kept per device in its own key so a reload or a sync never loses it.
export type Draft = { day: string; at: string; text: string; word?: string; id?: string };
export type KeepUi = { view: 'write' | 'archive' | 'read'; draft: Draft; reading?: string; arming?: string; fx?: 'seal' | 'next' | 'prev' };

const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthName = (d: string) => MONTH[Number(d.slice(5, 7)) - 1];
const titleCase = (s: string) => s[0] + s.slice(1).toLowerCase();

// Palette for the room's props: candle wax, flame, brass, oak, ink.
const P: Record<string, string> = {
  k: '#120a05', w: '#f4ead2', W: '#fff6d5', y: '#ffcd75', o: '#ef7d57', r: '#b13e53', s: '#c9b48a', S: '#8a7450',
  g: '#d9a441', G: '#f2d38a', B: '#3a2412', x: '#9a8a6a',
};
const art = (rows: string[], size: number) => svg(rows, size, '', P);
const flip = (rows: string[], h: boolean, v = false) => {
  const r = rows.map((x) => (h ? [...x].reverse().join('') : x));
  return v ? r.reverse() : r;
};

const FLAME = ['...W...', '..WyW..', '..yyy..', '.yyoyy.', '.yoroy.', '..yoy..', '...k...'];
const CANDLE = ['..kkkkk..', '..kwwwk..', '..kWwwk..', '.kwwwwwk.', '..kwwwk..', '..kwwwk..', '..kWwwk..', '..kwwwk..', '..kwwwk..', 'kkkkkkkkk', 'kgggggggk', '.kgGgggk.', 'kkkkkkkkk'];
const QUILL = ['..........ww', '........wwsw', '.......wwsw.', '......wwsw..', '.....wwsw...', '....wwsw....', '...wsw......', '..ws........', '.kk.........', 'kk..........'];
const INK = ['..kkk..', '.kSsSk.', 'kkkkkkk', 'kBBBBBk', 'kBkkkBk', 'kBBBBBk', 'kkkkkkk'];
const GLASS = ['kgggggk', '.kwwwk.', '.kyyyk.', '..kyk..', '..kwk..', '.kwywk.', '.kyyyk.', 'kgggggk'];
const CORNER = ['ggggg', 'gGGgk', 'gG...', 'gg...', 'gk...'];
const WEB = ['xx.....x', '.x.x..x.', '..xx.x..', 'xxxxx...', '..x.x...', '.x..x...', 'x...x...', '....x...'];

// A seeded generator, so the shelves and the ragged page edges look the same on every visit.
function seeded(seed: number) {
  return () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
}

// Three oak shelves of worn leather books with gilt bands and dust on top; tiled sideways to fill any width.
const SHELF = (() => {
  const rnd = seeded(7);
  const W = 125, H = 84, rects: string[] = [];
  const BOOK = ['#5e1e1e', '#2e4a2a', '#3a2a4a', '#6b4a1e', '#1f3048', '#4a1e2a', '#5a5a3a', '#7a3a1a', '#2a2a2a'];
  const R = (x: number, y: number, w: number, h: number, c: string) => rects.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`);
  R(0, 0, W, H, '#2a180c');
  for (let x = 0; x < W; x += 21) R(x, 0, 1, H, '#1c1008');
  for (const sy of [26, 54, 82]) {
    let x = 2;
    while (x < W - 3) {
      if (rnd() < 0.07) {
        x += 4;
        continue;
      }
      const w = 3 + Math.floor(rnd() * 3), h = 15 + Math.floor(rnd() * 8), c = BOOK[Math.floor(rnd() * BOOK.length)];
      const lean = rnd() < 0.06;
      const y = sy - h;
      R(x, y, w, h, c);
      R(x, y, 1, h, 'rgba(255,255,255,.08)');
      R(x + w - 1, y, 1, h, 'rgba(0,0,0,.35)');
      if (rnd() < 0.8) {
        R(x, y + 2, w, 1, '#b8862e');
        R(x, y + h - 3, w, 1, '#b8862e');
      }
      if (rnd() < 0.4) R(x + 1, y + 5, w - 2, 3, '#c9b48a');
      R(x, y, w, 1, 'rgba(200,190,160,.35)');
      x += w + (lean ? 2 : 0);
    }
    R(0, sy, W, 3, '#6b4226');
    R(0, sy, W, 1, '#8a5a36');
    R(0, sy + 3, W, 1, '#140a04');
  }
  // Double quotes inside (encoded), single quotes around: it sits in a double-quoted style attribute.
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" shape-rendering="crispEdges">${rects.join('')}</svg>`;
  return `url('data:image/svg+xml,${encodeURIComponent(doc)}')`;
})();

// Ragged deckle edges: the page's outer side and its top and bottom get small random notches.
function deckle(outer: 'l' | 'r', seed: number) {
  const rnd = seeded(seed);
  const n = 40;
  const top: string[] = [], bot: string[] = [], edge: string[] = [];
  for (let i = 0; i <= 20; i++) {
    top.push(`${i * 5}% ${(rnd() * 0.8).toFixed(2)}%`);
    bot.push(`${100 - i * 5}% ${(100 - rnd() * 0.8).toFixed(2)}%`);
  }
  for (let i = 0; i <= n; i++) edge.push(`${outer === 'l' ? (rnd() * 1.6).toFixed(2) : (100 - rnd() * 1.6).toFixed(2)}% ${(i / n) * 100}%`);
  return outer === 'l' ? `polygon(${top.join(',')},${bot.join(',')},${edge.reverse().join(',')})` : `polygon(${top.join(',')},${edge.join(',')},${bot.join(',')})`;
}
const EDGE_L = deckle('l', 11);
const EDGE_R = deckle('r', 23);

const DUST = [8, 19, 30, 14, 41, 25, 5].map((x, i) => `<i style="left:${x}%;top:${55 + (i % 3) * 12}%;animation-delay:${i * 1.2}s"></i>`).join('');

function room(sub: string, book: string, controls: string) {
  return `<div class="keep">
    <h2 class="sr-only">JOURNAL</h2>
    <div class="lib" style="background-image:${SHELF}" aria-hidden="true">
      <div class="web">${art(WEB, 32)}</div><div class="haze"></div><div class="dust">${DUST}</div>
    </div>
    <div class="plaque"><b>The Keep</b><small>${sub}</small></div>
    <div class="desk">
      <div class="props" aria-hidden="true">
        <div class="candle"><div class="flame">${art(FLAME, 28)}</div>${art(CANDLE, 52)}</div>
        <div class="ink">${art(INK, 28)}</div>
        <div class="glass">${art(GLASS, 32)}</div>
      </div>
      <div class="book">
        <div class="cover" aria-hidden="true"></div>
        <div class="corner tl" aria-hidden="true">${art(CORNER, 20)}</div><div class="corner tr" aria-hidden="true">${art(flip(CORNER, true), 20)}</div>
        <div class="corner bl" aria-hidden="true">${art(flip(CORNER, false, true), 20)}</div><div class="corner br" aria-hidden="true">${art(flip(CORNER, true, true), 20)}</div>
        <div class="clasp" aria-hidden="true"></div><div class="stack l" aria-hidden="true"></div><div class="stack r" aria-hidden="true"></div>
        <div class="spread">${book}</div>
      </div>
      <div class="keep-ctl">${controls}</div>
    </div>
  </div>`;
}

const leftPage = (inner: string) => `<div class="paper page l" style="clip-path:${EDGE_L}"><div class="gutter"></div>${inner}</div>`;
const rightPage = (inner: string, cls = '') => `<div class="paper page r ${cls}" style="clip-path:${EDGE_R}"><div class="gutter"></div>${inner}</div>`;
const FLOURISH = '<div class="flour" aria-hidden="true">~ ✠ ~</div>';

// The date block on a left page: big day number, month and weekday in blackletter, then the time.
const dated = (day: string, time: string) => `
  <div class="kdate">${Number(day.slice(8))}<small>${monthName(day).slice(0, 3)} · ${titleCase(weekdayName(day))}</small></div>
  <div class="ktime">${time}</div>${FLOURISH}`;

function moodColumn(day: string, mood: number | undefined, live: boolean) {
  const faces = MOODS.map((name, i) => {
    const on = mood === i + 1;
    if (!live) return `<span class="kmood${on ? ' on' : ''}" ${on ? `role="img" aria-label="Mood ${name.toLowerCase()}"` : 'aria-hidden="true"'}>${moodFace(i + 1, 18)}</span>`;
    return `<button class="kmood${on ? ' on' : ''}" data-action="keep-mood" data-day="${day}" data-mood="${i + 1}" aria-pressed="${on}" aria-label="Mood ${name.toLowerCase()}">${moodFace(i + 1, 18)}</button>`;
  });
  return `<div class="kmoods${mood ? ' picked' : ''}" ${live ? 'role="group" aria-label="How was the day?"' : ''}>${faces.join('')}</div>`;
}

const brass = (action: string, label: string, aria = '', extra = '') =>
  `<button class="brass" data-action="${action}" ${aria ? `aria-label="${aria}"` : ''} ${extra}>${label}</button>`;

function writeView(state: State, ui: KeepUi) {
  const d = ui.draft;
  const day = state.journal[d.day];
  const editing = d.id ? day?.entries?.find((e) => e.id === d.id) : undefined;
  const word = d.word ?? day?.text ?? '';
  const left = leftPage(`${dated(d.day, clockOf(d.at))}${moodColumn(d.day, day?.mood, true)}${day ? '' : '<div class="khint">pick a mood</div>'}`);
  const right = rightPage(`
    <label class="kword"><small>THE DAY IN A WORD</small>
      <input id="keep-word" data-keep="word" maxlength="${JOURNAL_MAX}" value="${esc(word)}" placeholder="one word" autocomplete="off"></label>
    <textarea id="keep-text" class="lines" data-keep="text" maxlength="${ENTRY_MAX}" aria-label="${editing ? 'Edit the entry' : 'New entry'}, ${clockOf(d.at)}"
      placeholder="${editing ? '' : 'Dip the quill…'}">${esc(d.text)}</textarea>
    <div class="quill" aria-hidden="true">${art(QUILL, 30)}</div>
    ${ui.fx === 'seal' ? '<div class="stamp-mark" aria-hidden="true">✠</div><div class="turn paper" aria-hidden="true"></div>' : ''}`);
  const controls = `
    ${editing ? brass('keep-cancel', 'CANCEL', 'Cancel the edit') : brass('keep-archive', 'ARCHIVE', 'Open the archive')}
    <button class="seal" data-action="keep-seal" aria-label="${editing ? 'Seal the changes' : 'Seal the entry'}"><span aria-hidden="true">✠</span><small>${editing ? 'RESEAL' : 'SEAL'}</small></button>`;
  const sub = `${weekdayName(d.day).slice(0, 3)} ${Number(d.day.slice(8))} ${monthName(d.day).slice(0, 3).toUpperCase()} · ${editing ? 'EDITING' : 'NEW ENTRY'}`;
  return room(sub, left + right + '<div class="ribbon" aria-hidden="true"></div>', controls);
}

const snippet = (t: string) => {
  const s = t.replace(/\s+/g, ' ').trim();
  return s.length > 70 ? `${s.slice(0, 70)}…` : s;
};

function archiveView(state: State, today: string) {
  const ps = pages(state.journal, today);
  const months = byMonth(ps);
  const first = ps.at(-1)?.day;
  const left = leftPage(`
    <div class="kdate">${ps.length}<small>${ps.length === 1 ? 'page' : 'pages'}</small></div>
    ${first ? `<div class="ktime">SINCE ${monthName(first).slice(0, 3).toUpperCase()} ${first.slice(0, 4)}</div>` : ''}${FLOURISH}`);
  const list = months.map(([m, items]) => `
    <h3 class="kmonth">${monthName(`${m}-01`)}${m.slice(0, 4) === today.slice(0, 4) ? '' : ` ${m.slice(0, 4)}`}</h3>
    <ul class="kentries">${items.map((p) => `
      <li><button class="kentry" data-action="keep-read" data-page="${esc(pageId(p))}">
        <span class="kd">${Number(p.day.slice(8))}</span>
        <span class="kt">${p.entry ? clockOf(p.entry.at) : 'THE DAY IN A WORD'}<em>${esc(snippet(p.entry?.text ?? p.word ?? ''))}</em></span>
        ${moodFace(p.mood, 12)}</button></li>`).join('')}</ul>`).join('');
  const right = rightPage(list || '<p class="kempty">No pages yet.<br>The book waits for its first entry.</p>', 'scroll');
  return room(`ARCHIVE · ${ps.length} ${ps.length === 1 ? 'PAGE' : 'PAGES'}`, left + right, brass('keep-write', 'NEW PAGE', 'Write a new entry'));
}

function readView(state: State, today: string, ui: KeepUi) {
  const ps = pages(state.journal, today);
  const i = ps.findIndex((p) => pageId(p) === ui.reading);
  const p: Page | undefined = ps[i];
  if (!p) return archiveView(state, today);
  const left = leftPage(`${dated(p.day, p.entry ? clockOf(p.entry.at) : '')}${moodColumn(p.day, p.mood, false)}`);
  // The first letter is a red illuminated capital (CSS ::first-letter, so the text reads as one word).
  const body = p.entry ? esc(p.entry.text) : '<span class="muted-ink">No entry this day; only its word.</span>';
  const turn = ui.fx === 'next' || ui.fx === 'prev' ? `<div class="turn paper ${ui.fx}" aria-hidden="true"></div>` : '';
  const right = rightPage(`
    ${p.word ? `<div class="kword read"><small>THE DAY IN A WORD</small>${esc(p.word)}</div>` : ''}
    <div class="lines read${p.entry ? ' illum' : ''}" tabindex="0" role="region" aria-label="Entry">${body}</div>${turn}`, 'scroll');
  const id = pageId(p);
  const armed = ui.arming === id;
  const controls = `
    ${brass('keep-turn', '◀', 'Newer page', `data-dir="-1" ${i > 0 ? '' : 'disabled'}`)}
    ${brass('keep-archive', 'ARCHIVE', 'Back to the archive')}
    ${brass('keep-edit', 'EDIT', p.entry ? 'Edit this entry' : 'Edit the day’s word', `data-page="${esc(id)}"`)}
    ${brass('keep-delete', armed ? 'SURE?' : 'DELETE', armed ? 'Tap again to delete' : p.entry ? 'Delete this entry' : 'Delete the day’s word', `data-page="${esc(id)}"${armed ? ' data-armed="1"' : ''}`)}
    ${brass('keep-turn', '▶', 'Older page', `data-dir="1" ${i < ps.length - 1 ? '' : 'disabled'}`)}`;
  return room(`${weekdayName(p.day).slice(0, 3)} ${Number(p.day.slice(8))} ${monthName(p.day).slice(0, 3).toUpperCase()} · READING`, left + right, controls);
}

export function journalView(state: State, today: string, ui: KeepUi) {
  if (ui.view === 'archive') return archiveView(state, today);
  if (ui.view === 'read') return readView(state, today, ui);
  return writeView(state, ui);
}
