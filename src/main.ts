import './style.css';
import { audio, sfx, unlock } from './audio';
import { banner, floatText, shake, toast } from './fx';
import { addDays, addMonths, dayKey, isEvening, rolloverMovesBack } from './logic/day';
import { atRisk, isActive, isDue, isPlanned, score, type Score } from './logic/score';
import { heroOf, type HeroState } from './logic/hero';
import { buyBlock, itemById, wornIds } from './logic/items';
import type { Mark, Schedule, Slot, State } from './logic/types';
import { BACKUP_DAYS, KEY, backupAge, exportFile, load, newId, parseState, save } from './store';
import { calendarView } from './ui/calendar';
import { editListView, formView } from './ui/edit';
import { heroView } from './ui/hero';
import { nav } from './ui/html';
import { questView } from './ui/quest';
import { settingsView } from './ui/settings';
import { statsView } from './ui/stats';

type Tab = 'quest' | 'calendar' | 'hero' | 'edit' | 'form' | 'stats' | 'settings';

const app = document.getElementById('app')!;
let state: State = load(dayKey(new Date(), 4));
let tab: Tab = 'quest';
let editingId: string | undefined;
let shownDay = '';
let calDay = ''; // selected day on the calendar
let calMonth = '';
let shopSlot: Slot = 'hat';
audio.muted = state.settings.muted;

const today = () => dayKey(new Date(), state.settings.rolloverHour);

let scored: Score; // score of the last render, reused so a tap scores the log once
let hs: HeroState; // gold balance (and later boss and chests) of the last render

function render() {
  const t = today();
  const sc = (scored = score(state, t));
  hs = heroOf(state, sc);
  const views: Record<Tab, () => string> = {
    quest: () => questView(state, sc, hs, t, new Date(), { arming, lateTouched }),
    calendar: () => calendarView(state, sc, t, { month: calMonth, day: calDay, arming }),
    hero: () => heroView(state, sc, hs, { slot: shopSlot, buying }),
    edit: () => editListView(state.habits),
    form: () => formView(state.habits.find((h) => h.id === editingId)),
    stats: () => statsView(state, sc, hs, t),
    settings: () => settingsView(state, t),
  };
  app.innerHTML = `<main>${views[tab]()}</main>${nav(tab === 'edit' || tab === 'form' ? 'quest' : tab)}`;
}

function go(to: Tab) {
  if (to === 'calendar' && tab !== 'calendar') pickDay(today());
  tab = to;
  render();
  scrollTo(0, 0);
}

function commit() {
  save(state);
  render();
}

// Missed days are worked out from the log, so a new day only needs a fresh render and a greeting.
function checkNewDay() {
  const t = today();
  if (t === shownDay) return;
  shownDay = t;
  lateTouched.clear();
  const last = state.lastOpened;
  state.lastOpened = t;
  commit();
  if (last && last < t) {
    const comeback = state.habits.some((h) => isActive(h, t) && scored.habits[h.id].comebackReady);
    toast(comeback ? 'Welcome back, hero! Comeback bonus x1.5 is ready.' : 'A new day dawns. Quests refreshed!');
    const age = backupAge(state, t) ?? 0;
    if (age > BACKUP_DAYS) toast(age === Infinity ? 'Your save has never been backed up. SETUP > EXPORT SAVE.' : `No backup for ${age} days. SETUP > EXPORT SAVE.`);
  }
}

let riskToastDay = '';

// Evening nudge on opening the app, once a day, while a real streak is still unprotected.
function warnRisk() {
  const t = today();
  if (riskToastDay === t || !isEvening(new Date(), state.settings.rolloverHour)) return;
  const risky = atRisk(state, scored, t);
  if (!risky.length) return;
  riskToastDay = t;
  const names = risky.map((h) => h.name).join(', ');
  toast(`${risky.length === 1 ? 'Streak' : `${risky.length} streaks`} at risk tonight: ${names}. Even the tiny version counts!`);
}

const dayComplete = (t: string) => {
  const due = state.habits.filter((h) => isDue(h, t));
  return due.length > 0 && due.every((h) => state.log[t]?.[h.id]);
};

let arming: string | undefined; // "day:id" of a done quest waiting for a second tap to undo
let armTimer: ReturnType<typeof setTimeout>;
const lateTouched = new Set<string>();

function mark(id: string, m: Mark, d = today()) {
  const t = today();
  // Any past day can be changed from the calendar (your call: fully editable); the future can't be done yet.
  if (d > t) return render();
  if (d === addDays(t, -1)) lateTouched.add(id);
  const key = `${d}:${id}`;
  const day = (state.log[d] ??= {});
  if (day[id]) {
    clearTimeout(armTimer);
    if (arming !== key) {
      arming = key;
      armTimer = setTimeout(() => {
        arming = undefined;
        render();
      }, 3000);
      return render();
    }
    arming = undefined;
    delete day[id];
    if (!Object.keys(day).length) delete state.log[d];
    commit();
    sfx('undo');
    return;
  }
  const before = scored;
  const wasComplete = dayComplete(d);
  day[id] = m;
  commit();
  const after = scored;
  const a = after.awards[d][id];
  const row = app.querySelector(`[data-row="${key}"]`);
  row?.classList.add('pop');
  floatText(row, `+${a.xp} XP`);
  setTimeout(() => floatText(row, `+${a.gold} G`, 'gold'), 180);
  if (a.comeback) setTimeout(() => floatText(row, 'COMEBACK!', 'hot'), 360);
  sfx(a.milestone ? 'milestone' : a.comeback ? 'combo' : m === 'tiny' ? 'tiny' : 'check');

  if (a.milestone) {
    const name = state.habits.find((h) => h.id === id)!.name;
    banner({ title: `${a.streak}-${after.habits[id].unit.toUpperCase()} STREAK!`, sub: `${name}: +${a.milestone} bonus XP`, onShow: shake });
  }
  if (after.level > before.level) {
    banner({ title: 'LEVEL UP!', sub: `You reached level ${after.level}`, level: after.level, worn: wornIds(state.wardrobe), onShow: () => { shake(); sfx('levelup'); } });
  }
  if (!wasComplete && dayComplete(d)) {
    banner({ title: 'PERFECT DAY!', sub: `${after.perfect}-day perfect run`, onShow: () => sfx('perfect') });
  }
}

function move(id: string, dir: number) {
  const list = state.habits;
  const i = list.findIndex((h) => h.id === id);
  let j = i + dir;
  while (list[j] && (list[j].archived || isPlanned(list[j]))) j += dir; // swap with the next quest you can see
  if (!list[j]) return;
  [list[i], list[j]] = [list[j], list[i]];
  commit();
}

function saveHabit(form: HTMLFormElement) {
  const f = new FormData(form);
  const name = String(f.get('name') ?? '').trim();
  if (!name) return;
  const kind = f.get('kind');
  let schedule: Schedule = { kind: 'daily' };
  if (kind === 'days') {
    const days = f.getAll('day').map(Number);
    if (!days.length) return alert('Pick at least one day.');
    schedule = { kind, days };
  } else if (kind === 'weekly') {
    schedule = { kind, times: Math.min(7, Math.max(1, Number(f.get('times')) || 1)) };
  }
  const fields = { name, tiny: String(f.get('tiny') ?? '').trim() || undefined, icon: String(f.get('icon') ?? 'star'), schedule };
  const existing = state.habits.find((h) => h.id === editingId);
  if (existing) Object.assign(existing, fields);
  else state.habits.push({ id: newId(), created: today(), ...fields });
  save(state);
  go('edit');
}

function archive(id: string) {
  const h = state.habits.find((x) => x.id === id);
  if (!h || !confirm(`Archive "${h.name}"? It leaves your quest list; the XP it earned stays.`)) return;
  h.archived = today();
  save(state);
  go('edit');
}

let buying: string | undefined; // item waiting for a second tap to buy
let buyTimer: ReturnType<typeof setTimeout>;

// Owned: wear or take off. Otherwise buy, with the same two-tap guard as undo.
function tapItem(id: string) {
  const it = itemById(id);
  if (!it) return;
  const w = state.wardrobe;
  if (w.owned[id]) {
    if (w.worn[it.slot] === id) delete w.worn[it.slot];
    else w.worn[it.slot] = id;
    sfx('tiny');
    return commit();
  }
  const block = buyBlock(it, scored.level, hs.balance, w);
  if (block) {
    sfx('undo');
    return toast(block);
  }
  clearTimeout(buyTimer);
  if (buying !== id) {
    buying = id;
    buyTimer = setTimeout(() => {
      buying = undefined;
      render();
    }, 3000);
    return render();
  }
  buying = undefined;
  w.owned[id] = { day: today(), paid: it.price };
  w.worn[it.slot] = id;
  commit();
  sfx('milestone');
  banner({ title: 'NEW GEAR!', sub: `${it.name} equipped`, level: scored.level, worn: wornIds(w), onShow: shake });
}

function pickDay(d: string) {
  calDay = d;
  calMonth = d.slice(0, 7);
}

function plan(form: HTMLFormElement) {
  const name = String(new FormData(form).get('name') ?? '').trim();
  const day = form.dataset.day ?? '';
  if (!name || day < today()) return;
  state.habits.push({ id: newId(), name, icon: 'star', schedule: { kind: 'once', day }, created: today() });
  commit();
  sfx('tiny');
}

function rename(id: string) {
  const h = state.habits.find((x) => x.id === id);
  const name = h && prompt('Rename planned quest', h.name)?.trim().slice(0, 40);
  if (!h || !name) return;
  h.name = name;
  commit();
}

function unplan(id: string) {
  const i = state.habits.findIndex((h) => h.id === id);
  if (i < 0 || !confirm(`Delete "${state.habits[i].name}"?`)) return;
  state.habits.splice(i, 1);
  commit();
}

async function doExport() {
  const prev = state.settings.lastBackup;
  state.settings.lastBackup = today();
  try {
    await exportFile(state, today());
    commit();
    toast('Save exported!');
  } catch {
    state.settings.lastBackup = prev; // share sheet was cancelled
  }
}

async function importFile(input: HTMLInputElement) {
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    const next = parseState(await file.text());
    if (!confirm('Replace everything on this device with this save file?')) return;
    state = next;
    audio.muted = state.settings.muted;
    commit();
    toast('Save loaded!');
  } catch {
    alert('That file is not a Habit Quest save.');
  }
}

app.addEventListener('click', (e) => {
  unlock();
  const el = (e.target as Element).closest<HTMLElement>('[data-action]');
  if (!el || el.tagName === 'INPUT') return;
  const id = el.dataset.id ?? '';
  switch (el.dataset.action) {
    case 'mark': return mark(id, el.dataset.mark as Mark, el.dataset.day);
    case 'tab': return go(el.dataset.tab as Tab);
    case 'new': editingId = undefined; return go('form');
    case 'edit-habit': editingId = id; return go('form');
    case 'move': return move(id, Number(el.dataset.dir));
    case 'archive': return archive(id);
    case 'export': return void doExport();
    case 'cal-month': calMonth = addMonths(calMonth, Number(el.dataset.dir)); return render();
    case 'cal-day': pickDay(el.dataset.day!); return render();
    case 'rename': return rename(id);
    case 'unplan': return unplan(id);
    case 'slot': shopSlot = el.dataset.slot as Slot; return render();
    case 'item': return tapItem(el.dataset.item!);
  }
});

// PC shortcuts: 1-9 toggles quest N in your order, Shift+1-9 its tiny version, Q/C/H/S/E switch screens.
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || (e.target as Element).closest('input, select, textarea')) return;
  const n = /^Digit([1-9])$/.exec(e.code)?.[1];
  if (n && tab === 'quest') {
    const h = state.habits.filter((x) => isActive(x, today()))[Number(n) - 1];
    if (!h) return;
    e.preventDefault();
    unlock();
    return mark(h.id, e.shiftKey && h.tiny ? 'tiny' : 'full');
  }
  const to = ({ KeyQ: 'quest', KeyC: 'calendar', KeyH: 'hero', KeyS: 'stats', KeyE: 'edit' } as Record<string, Tab>)[e.code];
  if (to && !e.shiftKey) go(to);
});

app.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  if (form.dataset.form === 'plan') plan(form);
  else saveHabit(form);
});

app.addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.dataset.action === 'import') return void importFile(t);
  if (!t.dataset.setting) return; // habit form fields save on submit
  if (t.dataset.setting === 'muted') audio.muted = state.settings.muted = t.checked;
  if (t.dataset.setting === 'rolloverHour') {
    const next = Number(t.value);
    if (rolloverMovesBack(new Date(), state.settings.rolloverHour, next)) {
      render(); // puts the select back
      return toast(`That would turn today back into yesterday. Change it after ${next}:00 AM.`);
    }
    state.settings.rolloverHour = next;
    shownDay = '';
    checkNewDay();
  }
  commit();
});

// Another window (say a browser tab next to the installed app) saved: adopt it, or our next save would erase its checks.
addEventListener('storage', (e) => {
  if (e.key !== KEY || !e.newValue) return;
  try {
    state = parseState(e.newValue);
  } catch {
    return;
  }
  audio.muted = state.settings.muted;
  if (tab !== 'form') render(); // don't wipe a half-typed quest
});

render();
checkNewDay();
warnRisk();

// A new deploy installs itself on the next launch with internet; say so once.
const BUILD_KEY = 'habit-quest-build';
const seenBuild = localStorage.getItem(BUILD_KEY);
if (seenBuild !== __BUILD__) {
  // An older copy still open elsewhere can't read newer saves and could overwrite them on its next tap.
  if (seenBuild) toast(`Updated! New version from ${__BUILD__} UTC. Close any other open Habit Quest windows.`);
  localStorage.setItem(BUILD_KEY, __BUILD__);
}
setInterval(() => {
  checkNewDay();
  if (tab === 'quest') render(); // time-based UI, e.g. the yesterday window closing
}, 60_000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  checkNewDay();
  warnRisk();
});

if (import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {}); // app still works online without it
void navigator.storage?.persist?.();
