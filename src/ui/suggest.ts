import { GOALS, suggest, type Budget } from '../logic/suggest';
import type { Schedule, State } from '../logic/types';
import { icon } from '../sprites';
import { CHECK, esc } from './html';

// step: pick goals and time, then pick quests. goals: chosen goal ids, in the order tapped.
// flip: quest names you toggled away from their pre-tick. welcome: first launch (or NEW GAME) wording.
export type SuggestUi = { step: 'goals' | 'pick'; goals: string[]; budget: Budget; flip: Set<string>; welcome: boolean };

const BUDGETS: [Budget, string][] = [[5, '5 MIN'], [15, '15 MIN'], [30, '30+ MIN']];

const when = (s: Schedule) => (s.kind === 'weekly' ? `${s.times}x a week` : 'every day');

export const picks = (state: State, ui: SuggestUi) =>
  suggest(ui.goals, ui.budget, state.habits).map((s) => ({ ...s, on: s.on !== ui.flip.has(s.idea.name) }));

export function suggestView(state: State, ui: SuggestUi) {
  if (ui.step === 'pick') {
    const list = picks(state, ui);
    const n = list.filter((s) => s.on).length;
    const rows = list.map(({ idea: i, on }) => `
      <li><button class="sugg${on ? ' on' : ''}" data-action="sugg-toggle" data-name="${esc(i.name)}" aria-pressed="${on}">
        <span class="q-icon">${icon(i.icon, 24)}</span>
        <span class="q-text"><span class="q-name">${esc(i.name)}</span>
          <span class="q-meta">Tiny: ${esc(i.tiny)} - ${when(i.schedule)}${i.focus ? ` - ${i.focus}m timer` : ''}</span></span>
        <span class="q-check">${on ? CHECK : ''}</span>
      </button></li>`);
    return `
      <h2>SUGGESTED QUESTS</h2>
      <p class="small muted">Tap to pick. Start small: you can add more any time from EDIT QUESTS.</p>
      ${list.length ? `<ul class="sugg-list">${rows.join('')}</ul>` : '<p class="empty">You already have every quest for these goals.</p>'}
      <button class="btn wide" data-action="sugg-add" ${n ? '' : 'disabled'}>ADD ${n} QUEST${n === 1 ? '' : 'S'}</button>
      <button class="btn wide ghost" data-action="sugg-back">BACK</button>`;
  }
  const goals = GOALS.map((g) => `<button class="goal" data-action="goal" data-goal="${g.id}" aria-pressed="${ui.goals.includes(g.id)}">${icon(g.icon, 24)}<span>${g.name}</span></button>`);
  const budgets = BUDGETS.map(([b, label]) => `<button role="tab" data-action="budget" data-budget="${b}" aria-selected="${b === ui.budget}">${label}</button>`);
  return `
    <h2>${ui.welcome ? 'WELCOME, HERO!' : 'SUGGEST QUESTS'}</h2>
    <p class="small">${ui.welcome ? 'Every hero needs quests. ' : ''}What do you want to get better at? Pick one or more.</p>
    <div class="goal-grid">${goals.join('')}</div>
    <form class="plan-form" data-form="intent">
      <input name="text" maxlength="80" placeholder="or type: learn spanish" aria-label="Describe what you want to get better at">
      <button class="btn small" type="submit">MATCH</button>
    </form>
    <h3>HOW MUCH TIME A DAY?</h3>
    <div class="slot-tabs three" role="tablist">${budgets.join('')}</div>
    <button class="btn wide" data-action="sugg-show" ${ui.goals.length ? '' : 'disabled'}>SHOW QUESTS</button>
    ${ui.welcome
      ? `<button class="btn wide ghost" data-action="new">I'LL MAKE MY OWN</button>`
      : '<button class="btn wide ghost" data-action="tab" data-tab="edit">CANCEL</button>'}`;
}
