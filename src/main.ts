import './style.css';
import { audio, sfx, unlock } from './audio';
import { banner, floatText, shake, toast } from './fx';
import { dayKey } from './logic/day';
import { isActive, isDue, score } from './logic/score';
import type { Mark, Schedule, State } from './logic/types';
import { exportFile, load, newId, parseState, save } from './store';
import { editListView, formView } from './ui/edit';
import { nav } from './ui/html';
import { questView } from './ui/quest';
import { settingsView } from './ui/settings';
import { statsView } from './ui/stats';

type Tab = 'quest' | 'edit' | 'form' | 'stats' | 'settings';

const app = document.getElementById('app')!;
let state: State = load(dayKey(new Date(), 4));
let tab: Tab = 'quest';
let editingId: string | undefined;
let shownDay = '';
audio.muted = state.settings.muted;

const today = () => dayKey(new Date(), state.settings.rolloverHour);

function render() {
  const t = today();
  const sc = score(state, t);
  const views: Record<Tab, () => string> = {
    quest: () => questView(state, sc, t),
    edit: () => editListView(state.habits),
    form: () => formView(state.habits.find((h) => h.id === editingId)),
    stats: () => statsView(state, sc, t),
    settings: () => settingsView(state, t),
  };
  app.innerHTML = `<main>${views[tab]()}</main>${nav(tab === 'edit' || tab === 'form' ? 'quest' : tab)}`;
}

function go(to: Tab) {
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
  const last = state.lastOpened;
  state.lastOpened = t;
  commit();
  if (last && last < t) {
    const sc = score(state, t);
    const comeback = state.habits.some((h) => isActive(h, t) && sc.habits[h.id].comebackReady);
    toast(comeback ? 'Welcome back, hero! Comeback bonus x1.5 is ready.' : 'A new day dawns. Quests refreshed!');
  }
}

const dayComplete = (t: string) => {
  const due = state.habits.filter((h) => isDue(h, t));
  return due.length > 0 && due.every((h) => state.log[t]?.[h.id]);
};

function mark(id: string, m: Mark) {
  const t = today();
  const day = (state.log[t] ??= {});
  if (day[id]) {
    delete day[id];
    if (!Object.keys(day).length) delete state.log[t];
    commit();
    sfx('undo');
    return;
  }
  const before = score(state, t);
  const wasComplete = dayComplete(t);
  day[id] = m;
  commit();
  const after = score(state, t);
  const a = after.awards[t][id];
  const row = app.querySelector(`[data-row="${id}"]`);
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
    banner({ title: 'LEVEL UP!', sub: `You reached level ${after.level}`, level: after.level, onShow: () => { shake(); sfx('levelup'); } });
  }
  if (!wasComplete && dayComplete(t)) {
    banner({ title: 'PERFECT DAY!', sub: `${after.perfect}-day perfect run`, onShow: () => sfx('perfect') });
  }
}

function move(id: string, dir: number) {
  const list = state.habits;
  const i = list.findIndex((h) => h.id === id);
  let j = i + dir;
  while (list[j]?.archived) j += dir;
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
    case 'mark': return mark(id, el.dataset.mark as Mark);
    case 'tab': return go(el.dataset.tab as Tab);
    case 'new': editingId = undefined; return go('form');
    case 'edit-habit': editingId = id; return go('form');
    case 'move': return move(id, Number(el.dataset.dir));
    case 'archive': return archive(id);
    case 'export': return void doExport();
  }
});

app.addEventListener('submit', (e) => {
  e.preventDefault();
  saveHabit(e.target as HTMLFormElement);
});

app.addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.dataset.action === 'import') return void importFile(t);
  if (!t.dataset.setting) return; // habit form fields save on submit
  if (t.dataset.setting === 'muted') audio.muted = state.settings.muted = t.checked;
  if (t.dataset.setting === 'rolloverHour') {
    state.settings.rolloverHour = Number(t.value);
    shownDay = '';
    checkNewDay();
  }
  commit();
});

render();
checkNewDay();
setInterval(checkNewDay, 60_000);
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && checkNewDay());

if (import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {}); // app still works online without it
void navigator.storage?.persist?.();
