import { dayKey, dayLabel, weekdayName } from '../logic/day';
import { isActive, isDue, xpForLevel, type Score } from '../logic/score';
import type { Habit, State } from '../logic/types';
import { COIN, FLAME, hero, icon, svg, tierOf } from '../sprites';
import { CHECK, esc } from './html';

export function questView(state: State, sc: Score, today: string, now: Date, arming?: string) {
  // Between midnight and the rollover hour the calendar has moved on but the quest day hasn't.
  const lateNight = dayKey(now, 0) !== today;
  const dateLine = `${dayLabel(today)}${lateNight ? ` <span class="muted">(still ${weekdayName(today)} until ${state.settings.rolloverHour}:00 AM)</span>` : ''}`;
  const need = xpForLevel(sc.level + 1) - xpForLevel(sc.level);
  const have = sc.xp - xpForLevel(sc.level);
  // Still-to-do quests first, then rest-day bonuses, then done ones; your order is kept within each group.
  const rank = (h: Habit) => (state.log[today]?.[h.id] ? 2 : h.schedule.kind !== 'weekly' && !isDue(h, today) ? 1 : 0);
  const habits = state.habits.filter((h) => isActive(h, today)).sort((a, b) => rank(a) - rank(b));
  const due = habits.filter((h) => isDue(h, today));
  const allDone = due.length > 0 && due.every((h) => state.log[today]?.[h.id]);

  const rows = habits.map((h) => {
    const st = sc.habits[h.id];
    const mark = state.log[today]?.[h.id];
    const award = sc.awards[today]?.[h.id];
    const weekly = h.schedule.kind === 'weekly' ? h.schedule.times : 0;
    const rest = !weekly && !isDue(h, today);
    const armed = mark && arming === h.id;
    let meta = '';
    if (armed) meta = '<span class="hot">TAP AGAIN TO UNDO</span>';
    else if (mark && award) meta = `+${award.xp} XP${mark === 'tiny' ? ' (tiny)' : ''}`;
    else if (st.comebackReady) meta = '<span class="hot">COMEBACK x1.5</span>';
    else if (rest) meta = 'Rest day - bonus XP';
    if (weekly) meta = `${st.weekCount}/${weekly} this week ${meta}`;
    const streak = st.streak ? `<span class="streak">${svg(FLAME, 16)}${st.streak}${st.unit === 'week' ? 'w' : ''}</span>` : '';
    const label = `${h.name}${armed ? ', tap again to undo' : mark ? ', done. Tap twice to undo' : ''}`;
    return `<li class="quest${mark ? ' done' : ''}${armed ? ' arming' : ''}${rest ? ' rest' : ''}" data-row="${h.id}">
      <button class="q-main" data-action="mark" data-id="${h.id}" data-mark="full" aria-pressed="${!!mark}" aria-label="${esc(label)}">
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
    <h2>${allDone ? 'ALL QUESTS DONE!' : "TODAY'S QUESTS"}</h2>
    <p class="date-line">${dateLine}</p>
    ${habits.length ? `<ul class="quests">${rows.join('')}</ul>` : '<p class="empty">No quests yet. Every hero needs one.</p>'}
    <button class="btn wide" data-action="tab" data-tab="edit">+ EDIT QUESTS</button>`;
}
