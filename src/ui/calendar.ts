import { dayLabel, monthDays, monthLabel } from '../logic/day';
import { daySummary, isActive, isDue, isPlanned, type Score } from '../logic/score';
import type { Habit, State } from '../logic/types';
import { icon } from '../sprites';
import { ARROW, esc } from './html';
import { dayRow } from './quest';

// month: 'YYYY-MM' shown in the grid; day: the selected day; arming: "day:id" waiting for a second tap to undo.
export type CalUi = { month: string; day: string; arming?: string };

const SAID = { all: 'all done', some: 'some done', none: 'none done', rest: 'nothing due' };
const WEEK = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

const plansOn = (state: State, d: string) => state.habits.filter((h) => isPlanned(h) && isActive(h, d));

function planButtons(state: State, h: Habit, d: string) {
  if (state.log[d]?.[h.id]) return ''; // a done plan holds XP; undo it first
  return `<button class="btn small ghost" data-action="rename" data-id="${h.id}" aria-label="Rename ${esc(h.name)}">EDIT</button>` +
    `<button class="btn small danger" data-action="unplan" data-id="${h.id}" aria-label="Delete planned quest ${esc(h.name)}">X</button>`;
}

function dayPanel(state: State, sc: Score, today: string, ui: CalUi) {
  const d = ui.day;
  let body: string;
  if (d <= today) {
    // Every quest that existed that day can be changed, rest-day ones included.
    const list = state.habits.filter((h) => isActive(h, d));
    const sum = daySummary(state.habits, state.log, d);
    const xp = Object.values(sc.awards[d] ?? {}).reduce((n, a) => n + a.xp, 0);
    const when = d === today ? 'today' : dayLabel(d);
    body = list.length
      ? `<ul class="late-list">${list.map((h) => dayRow(state, h, d, when, ui.arming, isPlanned(h) ? planButtons(state, h, d) : '')).join('')}</ul>
         <p class="cal-sum">${sum.done}/${sum.total} done - +${xp} XP</p>`
      : '<p class="empty">No quests on this day.</p>';
  } else {
    const due = state.habits.filter((h) => !isPlanned(h) && isDue(h, d)).map((h) => esc(h.name));
    const plans = plansOn(state, d).map((h) =>
      `<li class="late-row"><span class="q-icon">${icon(h.icon, 24)}</span><span class="q-name">${esc(h.name)} <span class="muted">*</span></span>${planButtons(state, h, d)}</li>`);
    body = `<p class="cal-sum muted">Due: ${due.join(', ') || 'nothing'}</p>${plans.length ? `<ul class="late-list">${plans.join('')}</ul>` : ''}`;
  }
  const form = d < today ? '' : `
    <form class="plan-form" data-form="plan" data-day="${d}">
      <input name="name" required maxlength="40" placeholder="e.g. Dentist 3pm" aria-label="Plan a quest for ${dayLabel(d)}">
      <button class="btn small" type="submit">PLAN</button>
    </form>`;
  return `<section class="cal-panel" aria-live="polite">
      <h3>${dayLabel(d)}${d === today ? ' <span class="muted">(TODAY)</span>' : ''}</h3>
      ${body}${form}
    </section>`;
}

export function calendarView(state: State, sc: Score, today: string, ui: CalUi) {
  const cells = monthDays(ui.month).map((d) => {
    const sum = d > today ? undefined : daySummary(state.habits, state.log, d);
    const plans = plansOn(state, d).length;
    const cls = ['cal-day', sum?.status ?? 'future', d.slice(0, 7) !== ui.month && 'other', d === today && 'today'].filter(Boolean).join(' ');
    const label = `${dayLabel(d)}${sum ? `, ${SAID[sum.status]}` : ''}${plans ? `, ${plans} planned` : ''}`;
    return `<button class="${cls}" data-action="cal-day" data-day="${d}" aria-label="${label}" aria-pressed="${d === ui.day}">${Number(d.slice(8))}${plans ? '<i>*</i>' : ''}</button>`;
  });
  return `
    <h2>CALENDAR</h2>
    <div class="cal-head">
      <button class="icon-btn prev" data-action="cal-month" data-dir="-1" aria-label="Previous month">${ARROW}</button>
      <b>${monthLabel(ui.month)}</b>
      <button class="icon-btn next" data-action="cal-month" data-dir="1" aria-label="Next month">${ARROW}</button>
    </div>
    <div class="cal-grid">${WEEK.map((w) => `<span aria-hidden="true">${w}</span>`).join('')}${cells.join('')}</div>
    <p class="cal-key" aria-hidden="true"><i class="all"></i>all <i class="some"></i>some <i class="none"></i>none <span>*</span> planned</p>
    ${dayPanel(state, sc, today, ui)}`;
}
