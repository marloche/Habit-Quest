import { FOCUS_MAX } from '../logic/focus';
import type { Habit } from '../logic/types';
import { ICONS, icon } from '../sprites';
import { ARROW, esc } from './html';

const DAYS: [number, string][] = [[1, 'M'], [2, 'T'], [3, 'W'], [4, 'T'], [5, 'F'], [6, 'S'], [0, 'S']];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function editListView(habits: Habit[]) {
  const active = habits.filter((h) => !h.archived && h.schedule.kind !== 'once'); // plans live in the calendar
  const rows = active.map((h, i) => `
    <li class="edit-row">
      <span class="q-icon">${icon(h.icon, 24)}</span>
      <span class="q-name">${esc(h.name)}</span>
      <button class="icon-btn" data-action="move" data-id="${h.id}" data-dir="-1" aria-label="Move ${esc(h.name)} up" ${i === 0 ? 'disabled' : ''}>${ARROW}</button>
      <button class="icon-btn down" data-action="move" data-id="${h.id}" data-dir="1" aria-label="Move ${esc(h.name)} down" ${i === active.length - 1 ? 'disabled' : ''}>${ARROW}</button>
      <button class="btn small" data-action="edit-habit" data-id="${h.id}">EDIT</button>
    </li>`);
  return `
    <h2>EDIT QUESTS</h2>
    <ul class="edit-list">${rows.join('')}</ul>
    <button class="btn wide" data-action="new">+ NEW QUEST</button>
    <button class="btn wide blue" data-action="suggest">+ SUGGEST QUESTS</button>
    <button class="btn wide ghost" data-action="tab" data-tab="quest">DONE</button>`;
}

// shortcut: editing a schedule re-scores past days under the new schedule; store schedule history if that ever matters.
export function formView(h?: Habit) {
  const s = h?.schedule ?? { kind: 'daily' as const };
  const days = s.kind === 'days' ? s.days : [1, 2, 3, 4, 5];
  const times = s.kind === 'weekly' ? s.times : 3;
  const icons = Object.keys(ICONS).map((name) => `
    <label class="icon-pick"><input type="radio" name="icon" value="${name}" ${(h?.icon ?? 'sword') === name ? 'checked' : ''} aria-label="${name}">${icon(name, 32)}</label>`);
  return `
    <h2>${h ? 'EDIT QUEST' : 'NEW QUEST'}</h2>
    <form class="habit-form">
      <label>NAME<input name="name" required maxlength="40" value="${esc(h?.name ?? '')}" placeholder="Workout"></label>
      <label>TINY VERSION <span class="muted">(optional)</span><input name="tiny" maxlength="40" value="${esc(h?.tiny ?? '')}" placeholder="1 pushup"></label>
      <label>FOCUS TIMER <span class="muted">(minutes, optional)</span><input type="number" name="focus" min="1" max="${FOCUS_MAX}" value="${h?.focus ?? ''}" placeholder="20"></label>
      <fieldset><legend>ICON</legend><div class="icon-grid">${icons.join('')}</div></fieldset>
      <fieldset><legend>SCHEDULE</legend>
        <select name="kind" aria-label="Schedule">
          <option value="daily" ${s.kind === 'daily' ? 'selected' : ''}>Every day</option>
          <option value="days" ${s.kind === 'days' ? 'selected' : ''}>Certain days</option>
          <option value="weekly" ${s.kind === 'weekly' ? 'selected' : ''}>N times a week</option>
        </select>
        <div class="days">${DAYS.map(([d, l]) => `<label class="day-pick"><input type="checkbox" name="day" value="${d}" ${days.includes(d) ? 'checked' : ''} aria-label="${DAY_NAMES[d]}"><span>${l}</span></label>`).join('')}</div>
        <label class="times">TIMES PER WEEK<input type="number" name="times" min="1" max="7" value="${times}"></label>
      </fieldset>
      <button class="btn wide" type="submit">SAVE</button>
      <button class="btn wide ghost" type="button" data-action="tab" data-tab="edit">CANCEL</button>
      ${h ? `<button class="btn wide danger" type="button" data-action="archive" data-id="${h.id}">ARCHIVE QUEST</button>` : ''}
    </form>`;
}
