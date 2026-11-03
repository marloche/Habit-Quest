import { addDays, dayKey, dayLabel, isEvening, lateCutoffLabel, lateWindowOpen, weekdayName } from '../logic/day';
import { atRisk, isActive, isDue, isPlanned, xpForLevel, type Score } from '../logic/score';
import type { Habit, State } from '../logic/types';
import { COIN, FLAME, hero, icon, svg, tierOf } from '../sprites';
import { CHECK, esc } from './html';

// arming: "day:id" of a done quest waiting for a second tap to undo.
// lateTouched: quests logged for yesterday this session, kept visible so a mistake can be undone.
export type QuestUi = { arming?: string; lateTouched: Set<string> };

// One quest on a day other than today's list: DONE/TINY, or a check that undoes on a second tap.
export function dayRow(state: State, h: Habit, d: string, when: string, arming?: string, extra = '') {
  const mark = state.log[d]?.[h.id];
  const key = `${d}:${h.id}`;
  const armed = arming === key;
  const name = esc(h.name);
  const buttons = mark
    ? `<button class="btn small${armed ? ' danger' : ' ghost'}" data-action="mark" data-day="${d}" data-id="${h.id}" data-mark="${mark}" aria-label="${name}, logged for ${when}. Tap ${armed ? 'again' : 'twice'} to undo">${armed ? 'UNDO?' : CHECK}</button>`
    : `<button class="btn small" data-action="mark" data-day="${d}" data-id="${h.id}" data-mark="full" aria-label="Log ${name} for ${when}">DONE</button>` +
      (h.tiny ? `<button class="btn small blue" data-action="mark" data-day="${d}" data-id="${h.id}" data-mark="tiny" aria-label="Log tiny version for ${when}: ${esc(h.tiny)}">TINY</button>` : '');
  return `<li class="late-row${mark ? ' done' : ''}" data-row="${key}"><span class="q-icon">${icon(h.icon, 24)}</span><span class="q-name">${name}${isPlanned(h) ? ' <span class="muted">*</span>' : ''}</span>${extra}${buttons}</li>`;
}

function lateView(state: State, today: string, now: Date, ui: QuestUi) {
  const r = state.settings.rolloverHour;
  if (!lateWindowOpen(now, r)) return '';
  const y = addDays(today, -1);
  const late = state.habits.filter((h) => isActive(h, y) && (h.schedule.kind !== 'days' || isDue(h, y)));
  if (!late.some((h) => !state.log[y]?.[h.id] || ui.lateTouched.has(h.id))) return '';
  const rows = late.map((h) => dayRow(state, h, y, 'yesterday', ui.arming));
  return `<section class="late" aria-label="Log forgotten quests for yesterday">
      <h3>FORGOT YESTERDAY? <span class="muted">open until ${lateCutoffLabel(r)}</span></h3>
      <ul class="late-list">${rows.join('')}</ul>
    </section>`;
}

export function questView(state: State, sc: Score, today: string, now: Date, ui: QuestUi) {
  // Between midnight and the rollover hour the calendar has moved on but the quest day hasn't.
  const lateNight = dayKey(now, 0) !== today;
  const dateLine = `${dayLabel(today)}${lateNight ? ` <span class="muted">(still ${weekdayName(today)} until ${state.settings.rolloverHour}:00 AM)</span>` : ''}`;
  const need = xpForLevel(sc.level + 1) - xpForLevel(sc.level);
  const have = sc.xp - xpForLevel(sc.level);
  // Still-to-do quests first, then rest-day bonuses, then done ones; your order is kept within each group.
  const restDay = (h: Habit) => h.schedule.kind !== 'weekly' && !isPlanned(h) && !isDue(h, today);
  const rank = (h: Habit) => (state.log[today]?.[h.id] ? 2 : restDay(h) ? 1 : 0);
  const listed = state.habits.filter((h) => isActive(h, today));
  const habits = [...listed].sort((a, b) => rank(a) - rank(b));
  // Keyboard numbers follow your order, not the sorted one, so a quest keeps its key after you check it.
  const keyOf = (h: Habit) => (listed.indexOf(h) < 9 ? listed.indexOf(h) + 1 : 0);
  const due = habits.filter((h) => isDue(h, today));
  const allDone = due.length > 0 && due.every((h) => state.log[today]?.[h.id]);
  const risky = new Set(isEvening(now, state.settings.rolloverHour) ? atRisk(state, sc, today).map((h) => h.id) : []);

  const rows = habits.map((h) => {
    const st = sc.habits[h.id];
    const mark = state.log[today]?.[h.id];
    const award = sc.awards[today]?.[h.id];
    const weekly = h.schedule.kind === 'weekly' ? h.schedule.times : 0;
    const rest = restDay(h);
    const armed = mark && ui.arming === `${today}:${h.id}`;
    const key = keyOf(h);
    let meta = '';
    if (armed) meta = '<span class="hot">TAP AGAIN TO UNDO</span>';
    else if (mark && award) meta = `+${award.xp} XP${mark === 'tiny' ? ' (tiny)' : ''}`;
    else if (risky.has(h.id)) meta = `<span class="hot">STREAK AT RISK${h.tiny ? ' - TINY COUNTS' : ''}</span>`;
    else if (st.comebackReady) meta = '<span class="hot">COMEBACK x1.5</span>';
    else if (rest) meta = 'Rest day - bonus XP';
    else if (isPlanned(h)) meta = 'Planned for today';
    if (weekly) meta = `${st.weekCount}/${weekly} this week ${meta}`;
    const streak = st.streak ? `<span class="streak">${svg(FLAME, 16)}${st.streak}${st.unit === 'week' ? 'w' : ''}</span>` : '';
    const label = `${h.name}${armed ? ', tap again to undo' : mark ? ', done. Tap twice to undo' : ''}`;
    return `<li class="quest${mark ? ' done' : ''}${armed ? ' arming' : ''}${rest ? ' rest' : ''}" data-row="${today}:${h.id}">
      <button class="q-main" data-action="mark" data-id="${h.id}" data-mark="full" aria-pressed="${!!mark}" aria-label="${esc(label)}"${key ? ` aria-keyshortcuts="${key}"` : ''}>
        ${key ? `<span class="q-key" aria-hidden="true">${key}</span>` : ''}
        <span class="q-icon">${icon(h.icon, 32)}</span>
        <span class="q-text"><span class="q-name">${esc(h.name)}</span><span class="q-meta">${meta}</span></span>
        ${streak}
        <span class="q-check">${mark ? CHECK : ''}</span>
      </button>
      ${h.tiny && !mark ? `<button class="q-tiny" data-action="mark" data-id="${h.id}" data-mark="tiny" aria-label="Tiny version: ${esc(h.tiny)}">TINY<small>${esc(h.tiny)}</small></button>` : ''}
    </li>`;
  });

  return `
    <header class="hud">
      <div class="hud-hero">${hero(sc.level, 72)}</div>
      <div class="hud-main">
        <div class="hud-row"><span>LV ${sc.level}</span><span class="muted">${tierOf(sc.level).title}</span></div>
        <div class="bar" role="progressbar" aria-label="XP to next level" aria-valuemin="0" aria-valuemax="${need}" aria-valuenow="${have}"><div style="width:${Math.round(sc.progress * 100)}%"></div></div>
        <div class="hud-row small"><span>${have}/${need} XP</span><span class="gold">${svg(COIN, 12)} ${sc.gold}</span></div>
        <div class="hud-row small"><span title="Share of your quests done in the last 14 days">x${sc.momentum.toFixed(2)} MOMENTUM</span><span>${svg(FLAME, 12)} ${sc.perfect}d</span></div>
      </div>
    </header>
    ${lateView(state, today, now, ui)}
    <h2>${allDone ? 'ALL QUESTS DONE!' : "TODAY'S QUESTS"}</h2>
    <p class="date-line">${dateLine}</p>
    ${habits.length ? `<ul class="quests">${rows.join('')}</ul>` : '<p class="empty">No quests yet. Every hero needs one.</p>'}
    <button class="btn wide" data-action="tab" data-tab="edit">+ EDIT QUESTS</button>`;
}
