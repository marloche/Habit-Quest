import { dayLabel, daysBetween } from '../logic/day';
import {
  AMOUNT_MAX, CHAPTER_GOLD, CHAPTERS_MAX, chapterAt, dueNote, EPIC_COLORS, epicProgress, epicsOfHabit, FINISH_GOLD, mainEpic,
  NAME_MAX, QUICK_DAYS, QUICK_GOLD, UNIT_MAX, WHY_MAX, type EpicProgress,
} from '../logic/epic';
import { isPlanned } from '../logic/score';
import { EPIC_IDEAS, GOALS } from '../logic/suggest';
import type { Epic, Habit, Look, State } from '../logic/types';
import { LADDER } from '../bosses';
import { crest, hero, ICONS, icon, PAL, svg } from '../sprites';
import { CHECK, esc } from './html';

// list: which tab of the EPIC QUESTS screen; open: the epic shown in full (defaults to the main one on ACTIVE).
export type EpicUi = { list: 'active' | 'inn' | 'hall'; open?: string };

const FLAG = ['.kyyyy..', '.kyyyyy.', '.kyyyy..', '.k......', '.k......', '.k......', '.k......', 'kkk.....'];
const GREY_FLAG = FLAG.map((r) => r.replace(/y/g, 's'));
const TREE = ['...gg...', '..gggg..', '.ggGggg.', 'gggggGgg', '.gGgggg.', '..gggg..', '...ee...', '...ee...'];

const short = (d: string) => dayLabel(d).slice(4); // 'NOV 4'
const num = (n: number) => String(Math.round(n * 10) / 10);
export const unitOf = (e: Epic) => (e.by === 'links' ? 'checks' : e.by === 'chapters' ? 'chapters' : e.unit || '');
const amount = (e: Epic, p: EpicProgress) => `${num(p.value)}/${num(p.goal)} ${unitOf(e)}`.trim();
const crestOf = (e: Epic, size = 32, label = '') => crest(e.icon, EPIC_COLORS[e.color], size, label);
const nextChapter = (e: Epic, p: EpicProgress) => p.reached.findIndex((d) => !d);

export const listOf = (e: Epic, p: EpicProgress): EpicUi['list'] => (p.finished || e.status === 'retired' ? 'hall' : e.status === 'inn' ? 'inn' : 'active');

// The main quest on the QUEST screen, under the boss bar; tapping it opens EPIC QUESTS.
export function epicStrip(state: State) {
  const e = mainEpic(state.epics, state.log);
  if (!e) return '';
  const p = epicProgress(e, state.log);
  const n = nextChapter(e, p);
  const side = state.epics.filter((x) => x !== e && listOf(x, epicProgress(x, state.log)) === 'active').length;
  const ch = e.chapters.length ? ` - CH ${Math.min(e.chapters.length, p.reached.filter(Boolean).length + 1)}/${e.chapters.length}` : '';
  const next = n >= 0 ? ` - ${esc(e.chapters[n].name.toUpperCase())}` : '';
  return `<button class="mq" data-action="epic-open" data-id="${e.id}" aria-label="Main quest ${esc(e.name)}, ${amount(e, p)}. Open epic quests">
      ${crestOf(e, 40)}
      <span class="mq-main">
        <span class="small gold">MAIN QUEST${ch}</span>
        <span class="mq-name">${esc(e.name.toUpperCase())}</span>
        <span class="bar epic"><div style="width:${Math.round(p.pct * 100)}%"></div></span>
        <span class="small muted">${amount(e, p)}${next}${side ? ` - +${side} side` : ''}</span>
      </span>
      <span class="mq-go" aria-hidden="true">&gt;</span>
    </button>`;
}

// The small crest tag on a quest row that feeds an open epic.
export const epicTags = (state: State, habitId: string) =>
  epicsOfHabit(state.epics, state.log, habitId).map((e) => `<span class="etag">${crestOf(e, 10)}${esc(e.name.toUpperCase())}</span>`).join('');

// The road from START to the guardian, bottom to top, with a flag per chapter and the hero where you are.
function journey(state: State, e: Epic, p: EpicProgress, level: number, worn: string[], look?: Look) {
  const g = LADDER[e.guardian];
  // The last chapter sits with the guardian when it is the finish line.
  const lastIsGoal = e.chapters.length > 0 && chapterAt(e, e.chapters.length - 1) >= p.goal;
  const stops = [
    { label: 'START', at: 0 },
    ...e.chapters.map((c, i) => ({ label: `CH ${i + 1} - ${c.name}`, at: chapterAt(e, i), reached: !!p.reached[i] })),
  ];
  if (!lastIsGoal) stops.push({ label: 'THE END', at: p.goal, reached: !!p.finished });
  const n = stops.length;
  const pos = stops.map((_, i) => ({ x: i === 0 ? 18 : i === n - 1 ? 30 : i % 2 ? 72 : 28, y: 100 - (100 * i) / (n - 1) })); // in the road area, which leaves room above for the guardian
  // The hero walks between the last stop passed and the next, by how far along that stretch the value is.
  let k = 0;
  while (k < n - 1 && p.value >= stops[k + 1].at) k++;
  const span = k < n - 1 ? stops[k + 1].at - stops[k].at : 1;
  const f = k < n - 1 ? Math.max(0, Math.min(1, (p.value - stops[k].at) / span)) : 0;
  const me = k < n - 1 ? { x: pos[k].x + (pos[k + 1].x - pos[k].x) * f, y: pos[k].y + (pos[k + 1].y - pos[k].y) * f } : pos[n - 1];
  const pts = (ps: { x: number; y: number }[]) => ps.map((q) => `${q.x},${q.y}`).join(' ');
  const done = !!p.finished;
  const nodes = stops.map((s, i) => {
    const end = i === n - 1;
    const art = end
      ? `<span class="guardian${done ? ' fallen' : ''}">${svg(g.art, 48)}</span>`
      : i === 0 ? '' : svg('reached' in s && s.reached ? FLAG : GREY_FLAG, 24);
    const label = end ? `${esc(s.label.toUpperCase())}<br>GUARDIAN: ${esc(g.name.toUpperCase())}${done ? ' - DEFEATED' : ''}` : esc(s.label.toUpperCase());
    return `<span class="stop${end ? ' end' : i === 0 ? ' start' : ''}" style="left:${pos[i].x}%;top:${pos[i].y}%">${art}<span class="stop-label">${label}</span></span>`;
  });
  const trees = [4, 32, 60, 88].map((y, i) => `<span class="tree" style="left:${i % 2 ? 8 : 90}%;top:${y}%">${svg(TREE, 16)}</span>`);
  const height = Math.max(300, n * 64 + 88);
  return `<div class="journey" style="height:${height}px" role="img" aria-label="${esc(e.name)}: ${amount(e, p)}, ${p.reached.filter(Boolean).length} of ${e.chapters.length} chapters. Guardian ${esc(g.name)}${done ? ' defeated' : ''}.">
      <div class="road-area">
      <svg class="road" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline points="${pts(pos)}" class="road-all" vector-effect="non-scaling-stroke"/>
        <polyline points="${pts([...pos.slice(0, k + 1), me])}" class="road-done" vector-effect="non-scaling-stroke"/>
      </svg>
      ${trees.join('')}${nodes.join('')}
      ${done ? '' : `<span class="walker juice" style="left:${me.x}%;top:${me.y}%">${hero(level, 40, worn, look, true)}</span>`}
      </div>
    </div>`;
}

function chapterList(e: Epic, p: EpicProgress, story = false) {
  if (!e.chapters.length) return '';
  const rows = e.chapters.map((c, i) => {
    const d = p.reached[i];
    const box = e.by === 'chapters' && !story
      ? `<button class="ch-box" data-action="epic-chapter" data-id="${e.id}" data-ch="${i}" aria-pressed="${!!d}" aria-label="${esc(c.name)}${d ? ', done. Tap to undo' : ', tap when done'}">${d ? CHECK : ''}</button>`
      : `<span class="ch-box" aria-hidden="true">${d ? CHECK : ''}</span>`;
    const when = d ? short(d) : e.by !== 'chapters' ? `at ${num(chapterAt(e, i))} ${unitOf(e)}` : '';
    return `<li class="ch-row${d ? ' done' : ''}">${box}
        <span class="ch-text"><span>${esc(c.name)}</span>${c.note ? `<span class="small muted">"${esc(c.note)}"</span>` : ''}</span>
        <span class="small ${d ? 'gold' : 'muted'}">${when}</span>
        ${d ? `<button class="btn small ghost" data-action="epic-note" data-id="${e.id}" data-ch="${i}" aria-label="${c.note ? 'Edit the' : 'Add a'} note for ${esc(c.name)}">NOTE</button>` : ''}
      </li>`;
  });
  return `<h3>CHAPTERS</h3><ul class="ch-list">${rows.join('')}</ul>`;
}

function detail(state: State, e: Epic, today: string, level: number, worn: string[], look?: Look) {
  const p = epicProgress(e, state.log);
  const where = listOf(e, p);
  const isMain = mainEpic(state.epics, state.log) === e;
  const role = p.finished ? 'EPIC QUEST COMPLETE' : e.status === 'retired' ? 'RETIRED WITH HONOR' : e.status === 'inn' ? 'RESTING AT THE INN' : isMain ? 'MAIN QUEST' : 'SIDE QUEST';
  const due = where === 'hall' ? '' : dueNote(e, today);
  const links = (e.links ?? []).map((id) => state.habits.find((h) => h.id === id)?.name).filter(Boolean) as string[];
  const how = e.by === 'links' ? (links.length ? ` (linked: ${esc(links.join(', '))})` : ' (link a quest in EDIT)') : '';
  const logged = e.logs?.[today];
  const log = e.by === 'count' && where !== 'hall'
    ? `<form class="plan-form" data-form="epic-log" data-id="${e.id}">
        <input type="number" name="amount" min="0.1" max="${AMOUNT_MAX}" step="0.1" required placeholder="1" aria-label="Amount of ${esc(unitOf(e) || 'progress')} to add today">
        <button class="btn small" type="submit">+ ADD${e.unit ? ` ${esc(e.unit.toUpperCase())}` : ''}</button>
      </form>
      ${logged ? `<p class="small muted ch-today">Today: ${num(logged)} ${esc(unitOf(e))} <button class="btn small ghost" data-action="epic-unlog" data-id="${e.id}">CLEAR TODAY</button></p>` : ''}`
    : '';
  const quick = p.finished && daysBetween(e.created, p.finished) < QUICK_DAYS;
  const end = p.finished ?? e.ended ?? today;
  const days = daysBetween(e.created, end) + 1; // counting both ends: a same-day finish took 1 day
  const story = where === 'hall'
    ? `<p class="small">${short(e.created)} to ${short(end)}, ${days} day${days === 1 ? '' : 's'}. ${p.gold} G earned${quick ? ` (a quick finish pays ${QUICK_GOLD})` : ''}.</p>`
    : `<p class="small gold">+${CHAPTER_GOLD} G a chapter, +${FINISH_GOLD} G to finish</p>`;
  const id = `data-id="${e.id}"`;
  const actions = [
    `<button class="btn small" data-action="epic-edit" ${id}>EDIT</button>`,
    where === 'active' && !isMain ? `<button class="btn small blue" data-action="epic-main" ${id}>MAKE MAIN</button>` : '',
    where === 'active' ? `<button class="btn small ghost" data-action="epic-inn" ${id}>REST AT INN</button>` : '',
    where === 'inn' ? `<button class="btn small blue" data-action="epic-inn" ${id}>BACK ON THE ROAD</button>` : '',
    where !== 'hall' ? `<button class="btn small ghost" data-action="epic-retire" ${id}>RETIRE</button>` : '',
    !p.gold && !p.finished ? `<button class="btn small danger" data-action="epic-delete" ${id}>DELETE</button>` : '',
  ];
  return `<section class="epic-detail" aria-label="${esc(e.name)}">
      <div class="epic-head">${crestOf(e, 56)}<div class="epic-title">
        <span class="small gold">${role}</span>
        <span class="epic-name">${esc(e.name.toUpperCase())}</span>
        ${e.due || due ? `<span class="small muted">${e.due ? `by ${short(e.due)}` : ''}${due ? ` - ${due}` : ''}</span>` : ''}
      </div></div>
      ${e.why ? `<p class="small epic-why">"${esc(e.why)}"</p>` : ''}
      ${journey(state, e, p, level, worn, look)}
      <div class="bar epic"><div style="width:${Math.round(p.pct * 100)}%"></div></div>
      <p class="small">${amount(e, p)}${how}</p>
      ${story}
      ${log}
      ${chapterList(e, p, e.status === 'retired')}
      <div class="epic-actions">${actions.join('')}</div>
    </section>`;
}

function card(state: State, e: Epic, today: string) {
  const p = epicProgress(e, state.log);
  const sub = p.finished ? `DONE ${short(p.finished)}` : e.status === 'retired' ? `RETIRED ${short(e.ended ?? today)}` : amount(e, p);
  return `<li><button class="epic-card" data-action="epic-open" data-id="${e.id}">
      ${crestOf(e, 32)}
      <span class="q-text"><span class="q-name">${esc(e.name)}</span><span class="q-meta">${sub}</span>
      ${listOf(e, p) === 'hall' ? '' : `<span class="bar epic"><div style="width:${Math.round(p.pct * 100)}%"></div></span>`}</span>
    </button></li>`;
}

export function epicsView(state: State, today: string, ui: EpicUi, level: number, worn: string[], look?: Look) {
  const by = { active: [] as Epic[], inn: [] as Epic[], hall: [] as Epic[] };
  for (const e of state.epics) by[listOf(e, epicProgress(e, state.log))].push(e);
  const shown = by[ui.list];
  const open = shown.find((e) => e.id === ui.open) ?? (ui.list === 'active' ? mainEpic(state.epics, state.log) : undefined);
  const others = shown.filter((e) => e !== open);
  const tabs = (['active', 'inn', 'hall'] as const).map((l) =>
    `<button role="tab" data-action="epic-list" data-list="${l}" aria-selected="${l === ui.list}">${l.toUpperCase()} ${by[l].length}</button>`);
  const empty = {
    active: 'No epic quests on the road. A long road starts with one step.',
    inn: 'Nobody at the inn. Rest an epic here when life gets busy: its linked quests still count.',
    hall: 'The hall is empty for now. Finished and retired epics are told here.',
  }[ui.list];
  return `
    <h2>EPIC QUESTS</h2>
    <div class="slot-tabs three" role="tablist">${tabs.join('')}</div>
    ${open ? detail(state, open, today, level, worn, look) : ''}
    ${others.length ? `${open ? `<h3>${ui.list === 'hall' ? 'MORE LEGENDS' : 'OTHER QUESTS'}</h3>` : ''}<ul class="epic-list">${others.map((e) => card(state, e, today)).join('')}</ul>` : ''}
    ${shown.length ? '' : `<p class="empty">${empty}</p>`}
    <button class="btn wide" data-action="epic-new">+ NEW EPIC QUEST</button>
    <button class="btn wide blue" data-action="tab" data-tab="epic-ideas">+ EPIC IDEAS</button>
    <button class="btn wide ghost" data-action="tab" data-tab="quest">BACK TO QUESTS</button>`;
}

const howLong = (i: (typeof EPIC_IDEAS)[number]) =>
  i.by === 'links' ? `${i.target} checks of "${i.link}"` : i.by === 'count' ? `${num(i.target!)} ${i.unit}` : `${i.chapters.length} chapters`;

export function epicIdeasView() {
  const groups = GOALS.map((g) => {
    const rows = EPIC_IDEAS.map((i, n) => [i, n] as const).filter(([i]) => i.goal === g.id).map(([i, n]) => `
      <li><button class="epic-card" data-action="epic-idea" data-idea="${n}">
        ${crest(i.icon, EPIC_COLORS[GOALS.indexOf(g) % EPIC_COLORS.length], 32)}
        <span class="q-text"><span class="q-name">${esc(i.name)}</span><span class="q-meta">${esc(i.why)} - ${esc(howLong(i))}</span></span>
      </button></li>`);
    return `<h3>${icon(g.icon, 12)} ${g.name}</h3><ul class="epic-list">${rows.join('')}</ul>`;
  });
  return `
    <h2>EPIC IDEAS</h2>
    <p class="small muted">Pick one to start from. You can change every part of it before saving.</p>
    ${groups.join('')}
    <button class="btn wide ghost" data-action="tab" data-tab="epics">BACK</button>`;
}

// addQuest: a quest idea's name the epic wants linked but you don't have yet; ticked, saving adds it.
export function epicFormView(e: Epic | undefined, habits: Habit[], isNew: boolean, addQuest?: string) {
  const by = e?.by ?? 'chapters';
  const icons = Object.keys(ICONS).map((name) => `
    <label class="icon-pick"><input type="radio" name="icon" value="${name}" ${(e?.icon ?? 'star') === name ? 'checked' : ''} aria-label="${name}">${icon(name, 32)}</label>`);
  const colors = EPIC_COLORS.map((c, i) => `
    <label class="icon-pick color-pick"><input type="radio" name="color" value="${i}" ${(e?.color ?? 0) === i ? 'checked' : ''} aria-label="Color ${i + 1}"><span style="background:${PAL[c]}"></span></label>`);
  const linkable = habits.filter((h) => (!h.archived && !isPlanned(h)) || e?.links?.includes(h.id));
  const links = linkable.map((h) => `
    <label class="link-pick"><input type="checkbox" name="link" value="${h.id}" ${e?.links?.includes(h.id) ? 'checked' : ''}>${icon(h.icon, 16)}<span>${esc(h.name)}</span></label>`);
  if (addQuest) links.push(`<label class="link-pick"><input type="checkbox" name="add-quest" value="${esc(addQuest)}" checked><span class="gold">+ ADD QUEST: ${esc(addQuest)}</span></label>`);
  const rows = Math.min(CHAPTERS_MAX, (e?.chapters.length ?? 0) + 3);
  const chapters = Array.from({ length: rows }, (_, i) => {
    const c = e?.chapters[i];
    return `<div class="ch-edit"><input name="ch-name" maxlength="${NAME_MAX}" value="${esc(c?.name ?? '')}" placeholder="Chapter ${i + 1}" aria-label="Chapter ${i + 1} name">
      <input class="ch-at" type="number" name="ch-at" min="1" max="${AMOUNT_MAX}" step="0.1" value="${c?.at ?? ''}" placeholder="auto" aria-label="Chapter ${i + 1} reached at"></div>`;
  });
  const guardians = LADDER.map((b, i) => `<option value="${i}" ${!isNew && e?.guardian === i ? 'selected' : ''}>${b.name}</option>`);
  return `
    <h2>${isNew ? 'NEW EPIC QUEST' : 'EDIT EPIC QUEST'}</h2>
    <form class="habit-form epic-form" data-form="epic">
      <label>NAME<input name="name" required maxlength="${NAME_MAX}" value="${esc(e?.name ?? '')}" placeholder="Run a 5K"></label>
      <label>WHY <span class="muted">(optional)</span><input name="why" maxlength="${WHY_MAX}" value="${esc(e?.why ?? '')}" placeholder="So I can run with my kids"></label>
      <fieldset><legend>CREST</legend><div class="icon-grid">${icons.join('')}</div><div class="icon-grid colors">${colors.join('')}</div></fieldset>
      <fieldset><legend>PROGRESS</legend>
        <select name="by" aria-label="How progress is counted">
          <option value="chapters" ${by === 'chapters' ? 'selected' : ''}>Chapters I tick off</option>
          <option value="links" ${by === 'links' ? 'selected' : ''}>Checks of my quests</option>
          <option value="count" ${by === 'count' ? 'selected' : ''}>An amount I log</option>
        </select>
        <label class="by-target">TARGET<input type="number" name="target" min="1" max="${AMOUNT_MAX}" step="0.1" value="${e?.target ?? ''}" placeholder="24"></label>
        <label class="by-unit">UNIT <span class="muted">(km, books, $)</span><input name="unit" maxlength="${UNIT_MAX}" value="${esc(e?.unit ?? '')}" placeholder="km"></label>
        <div class="by-links"><span class="small muted">Checks of these quests count, from the epic's start. Tiny counts too.</span>${links.length ? links.join('') : '<span class="small">No quests to link yet.</span>'}</div>
      </fieldset>
      <fieldset><legend>CHAPTERS <span class="muted">(up to ${CHAPTERS_MAX})</span></legend>
        <span class="small muted ch-hint">Leave the amount blank to space them evenly.</span>
        ${chapters.join('')}
      </fieldset>
      <label>TARGET DATE <span class="muted">(optional, no penalty)</span><input type="date" name="due" value="${e?.due ?? ''}"></label>
      <label>GUARDIAN <span class="muted">(waits at the end)</span>
        <select name="guardian"><option value="-1" ${isNew ? 'selected' : ''}>Auto: fits the length</option>${guardians.join('')}</select></label>
      <button class="btn wide" type="submit">SAVE</button>
      <button class="btn wide ghost" type="button" data-action="tab" data-tab="epics">CANCEL</button>
    </form>`;
}
