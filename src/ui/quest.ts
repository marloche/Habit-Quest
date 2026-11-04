import { addDays, dayKey, dayLabel, isEvening, lateCutoffLabel, lateWindowOpen, weekdayName } from '../logic/day';
import { atRisk, isActive, isDue, isPlanned, xpForLevel, type Score } from '../logic/score';
import type { HeroState } from '../logic/hero';
import { wornIds } from '../logic/items';
import { JOURNAL_GOLD, MOODS } from '../logic/journal';
import type { Habit, State } from '../logic/types';
import { bossBar, goldText, petButton } from './hero';
import { clock, timeLeft, type Timer } from '../logic/focus';
import { COIN, FLAME, hero, HOURGLASS, icon, moodFace, petOf, svg, tierOf } from '../sprites';
import { CHECK, esc } from './html';
import { epicStrip, epicTags } from './epic';

// arming: "day:id" of a done quest waiting for a second tap to undo.
// lateTouched: quests logged for yesterday this session, kept visible so a mistake can be undone.
// timer: the running focus timer; stopping: its STOP was tapped and it's asking what to log.
export type QuestUi = { arming?: string; lateTouched: Set<string>; timer?: Timer; stopping?: boolean };

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

// Five mood faces for a day's journal; tapping the lit one clears the entry.
export function moodRow(state: State, d: string) {
  const cur = state.journal[d]?.mood;
  const faces = MOODS.map((name, i) => {
    const on = cur === i + 1;
    return `<button class="mood${on ? ' on' : ''}" data-action="mood" data-day="${d}" data-mood="${i + 1}" aria-pressed="${on}" aria-label="Mood ${name.toLowerCase()}${on ? ', tap to clear' : ''}">${moodFace(i + 1, 32)}</button>`;
  });
  return `<div class="moods${cur ? ' picked' : ''}" role="group" aria-label="How was the day?">${faces.join('')}</div>`;
}

// The running focus timer, pinned under the HUD. main.ts updates .focus-time and .focus-fill every second.
function focusCard(state: State, now: number, ui: QuestUi) {
  const t = ui.timer;
  const h = t && state.habits.find((x) => x.id === t.habit);
  if (!t || !h) return '';
  const pct = Math.round(((now - t.start) / (t.end - t.start)) * 100);
  const controls = ui.stopping
    ? `<p class="small">Stop early?</p>
       <div class="focus-btns">
         ${h.tiny && !state.log[t.day]?.[h.id] ? '<button class="btn small blue" data-action="focus-tiny">LOG TINY</button>' : ''}
         <button class="btn small danger" data-action="focus-discard">DISCARD</button>
         <button class="btn small" data-action="focus-keep">KEEP GOING</button>
       </div>`
    : '<button class="btn small ghost" data-action="focus-stop">STOP</button>';
  return `<section class="focus-card" aria-label="Focus timer for ${esc(h.name)}">
      <div class="focus-row">${svg(HOURGLASS, 24)}<span class="focus-name">FOCUS: ${esc(h.name.toUpperCase())}</span><b class="focus-time">${clock(timeLeft(t, now))}</b></div>
      <div class="bar"><div class="focus-fill" style="width:${pct}%"></div></div>
      ${controls}
    </section>`;
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

export function questView(state: State, sc: Score, hs: HeroState, today: string, now: Date, ui: QuestUi) {
  // Between midnight and the rollover hour the calendar has moved on but the quest day hasn't.
  const lateNight = dayKey(now, 0) !== today;
  const dateLine = `${dayLabel(today)}${lateNight ? ` <span class="muted">(still ${weekdayName(today)} until ${state.settings.rolloverHour}:00 AM)</span>` : ''}`;
  const worn = wornIds(state.wardrobe, hs.trophies);
  const pet = petOf(worn);
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
  const askMood = !state.journal[today] && (allDone || isEvening(now, state.settings.rolloverHour));
  const strip = epicStrip(state);
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
    else if (mark && award) meta = `+${award.xp} XP${mark === 'tiny' ? ' <span class="tag">TINY</span>' : ''}`;
    else if (risky.has(h.id)) meta = `<span class="hot">STREAK AT RISK${h.tiny ? ' - TINY COUNTS' : ''}</span>`;
    else if (st.comebackReady) meta = '<span class="hot">COMEBACK x1.5</span>';
    else if (rest) meta = 'Rest day - bonus XP';
    else if (isPlanned(h)) meta = 'Planned for today';
    if (weekly) meta = `${st.weekCount}/${weekly} this week ${meta}`;
    meta += epicTags(state, h.id);
    const streak = st.streak ? `<span class="streak">${svg(FLAME, 16)}${st.streak}${st.unit === 'week' ? 'w' : ''}</span>` : '';
    const label = `${h.name}${armed ? ', tap again to undo' : mark ? ', done. Tap twice to undo' : ''}`;
    return `<li class="quest${mark ? ` done ${mark}` : ''}${armed ? ' arming' : ''}${rest ? ' rest' : ''}" data-row="${today}:${h.id}">
      <button class="q-main" data-action="mark" data-id="${h.id}" data-mark="full" aria-pressed="${!!mark}" aria-label="${esc(label)}"${key ? ` aria-keyshortcuts="${key}"` : ''}>
        ${key ? `<span class="q-key" aria-hidden="true">${key}</span>` : ''}
        <span class="q-icon">${icon(h.icon, 32)}</span>
        <span class="q-text"><span class="q-name">${esc(h.name)}</span><span class="q-meta">${meta}</span></span>
        ${streak}
        <span class="q-check juice">${mark ? `${CHECK}<i class="burst"></i>` : ''}</span>
      </button>
      ${h.tiny && !mark ? `<button class="q-tiny" data-action="mark" data-id="${h.id}" data-mark="tiny" aria-label="Tiny version: ${esc(h.tiny)}">TINY<small>${esc(h.tiny)}</small></button>` : ''}
      ${h.focus && !mark && ui.timer?.habit !== h.id ? `<button class="q-focus" data-action="focus-start" data-id="${h.id}" aria-label="Start a ${h.focus} minute focus timer for ${esc(h.name)}">${svg(HOURGLASS, 16)}<small>${h.focus}m</small></button>` : ''}
    </li>`;
  });

  return `
    <header class="hud">
      <div class="hud-hero juice">${hero(sc.level, 80, worn, state.look, true)}${pet ? petButton(pet, 40) : ''}</div>
      <div class="hud-main">
        <div class="hud-row"><span class="lv">LV ${sc.level}</span><span class="tier">${tierOf(sc.level).title.toUpperCase()}</span></div>
        <div class="bar xp ticks juice" role="progressbar" aria-label="XP to next level" aria-valuemin="0" aria-valuemax="${need}" aria-valuenow="${have}"><div style="width:${Math.round(sc.progress * 100)}%"></div></div>
        <span class="small">${have}/${need} XP</span>
        <div class="chips small">
          <span class="chip gold${hs.balance < 0 ? ' debt' : ''}">${svg(COIN, 12)} ${goldText(hs)}</span>
          <span class="chip hot" title="Perfect days in a row">${svg(FLAME, 12)} ${sc.perfect}d</span>
          <span class="chip" title="Share of your quests done in the last 14 days">x${sc.momentum.toFixed(2)} MOMENTUM</span>
        </div>
      </div>
    </header>
    ${bossBar(hs, false, state.settings.bossArt !== false)}
    ${strip}
    ${focusCard(state, now.getTime(), ui)}
    ${lateView(state, today, now, ui)}
    <h2>${allDone ? 'ALL QUESTS DONE!' : "TODAY'S QUESTS"}</h2>
    <p class="date-line">${dateLine}</p>
    ${habits.length ? `<ul class="quests">${rows.join('')}</ul>` : '<p class="empty">No quests yet. Every hero needs one.</p><button class="btn wide blue" data-action="suggest">SUGGEST QUESTS</button>'}
    ${askMood ? `<section class="mood-ask"><h3>HOW WAS TODAY?</h3>${moodRow(state, today)}<p class="small muted">+${JOURNAL_GOLD} G. Add a line in CALENDAR.</p></section>` : ''}
    <button class="btn wide" data-action="tab" data-tab="edit">+ EDIT QUESTS</button>`;
}
