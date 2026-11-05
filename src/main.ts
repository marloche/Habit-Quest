import './style.css';
import { configureAudio, hasSound, setScene, sfx, unlock } from './audio';
import { banner, floatText, hearts, shake, toast } from './fx';
import { addDays, addMonths, dayKey, isEvening, rolloverMovesBack } from './logic/day';
import { atRisk, isActive, isDue, isPlanned, score, type Score } from './logic/score';
import { BOSS_GOLD, chestLoot, heroOf, type HeroState } from './logic/hero';
import { buyBlock, itemById, wornIds } from './logic/items';
import { clock, FOCUS_MAX, focusedMinutes, isOver, MINUTE, parseTimer, timeLeft, type Timer } from './logic/focus';
import { JOURNAL_GOLD, JOURNAL_MAX } from './logic/journal';
import type { Bg, Chapter, Epic, EpicBy, Look, Mark, Mood, Schedule, Settings, Slot, State } from './logic/types';
import type { VolKey } from './logic/volume';
import { display, sceneFor } from './logic/scene';
import { mountScene } from './scenes';
import { CLASSIC, PRESETS, randomLook } from './logic/look';
import { BACKUP_DAYS, KEY, backupAge, exportFile, fresh, load, newId, parseState, save } from './store';
import { calendarView } from './ui/calendar';
import { editListView, formView } from './ui/edit';
import { heroView, type HeroUi } from './ui/hero';
import { newTiers, TIER_GOLD, trophyAt } from './logic/achievements';
import { nav, type NavTab } from './ui/html';
import { questView } from './ui/quest';
import { settingsView } from './ui/settings';
import { statsView } from './ui/stats';
import { picks, suggestView, type SuggestUi } from './ui/suggest';
import { EPIC_IDEAS, epicFromIdea, GOALS, goalsFromText, IDEAS, ideaToHabit, type Budget } from './logic/suggest';
import { AMOUNT_MAX, defaultGuardian, epicProgress, epicsOfHabit, NAME_MAX, NOTE_MAX, UNIT_MAX, WHY_MAX } from './logic/epic';
import { epicFormView, epicIdeasView, epicsView, listOf, type EpicUi } from './ui/epic';
import { LADDER } from './bosses';

type Tab = 'quest' | 'calendar' | 'hero' | 'edit' | 'form' | 'suggest' | 'stats' | 'settings' | 'epics' | 'epic-form' | 'epic-ideas';
const UNDER_QUEST: Tab[] = ['edit', 'form', 'suggest']; // screens reached from QUEST, which stays lit
const UNDER_EPICS: Tab[] = ['epic-form', 'epic-ideas'];

const app = document.getElementById('app')!;
let state: State = load();
const noQuests = () => !state.habits.some((h) => !h.archived && h.schedule.kind !== 'once');
const newSuggest = (welcome: boolean): SuggestUi => ({ step: 'goals', goals: [], budget: 15, flip: new Set(), welcome });
let sugg = newSuggest(noQuests());
let tab: Tab = sugg.welcome ? 'suggest' : 'quest'; // a clean slate opens on the goal picker
let editingId: string | undefined;
let shownDay = '';
let calDay = ''; // selected day on the calendar
let calMonth = '';
let calMood = false; // calendar grid colored by mood instead of quests
let shopSlot: HeroUi['slot'] = 'hat';
let heroTab: HeroUi['view'] = 'wardrobe';
let epicUi: EpicUi = { list: 'active' };
let epicDraft: Epic | undefined; // the epic in the editor: a copy, so CANCEL changes nothing
let epicAddQuest: string | undefined; // a quest idea the draft wants linked that you don't have yet
configureAudio(state.settings);

const today = () => dayKey(new Date(), state.settings.rolloverHour);

let scored: Score; // score of the last render, reused so a tap scores the log once
let hs: HeroState; // gold balance (and later boss and chests) of the last render

function render() {
  const t = today();
  const sc = (scored = score(state, t));
  hs = heroOf(state, sc, t);
  announceTiers();
  const views: Record<Tab, () => string> = {
    quest: () => questView(state, sc, hs, t, new Date(), { arming, lateTouched, timer, stopping }),
    calendar: () => calendarView(state, sc, t, { month: calMonth, day: calDay, mood: calMood, arming }),
    hero: () => heroView(state, sc, hs, { view: heroTab, slot: shopSlot, buying }),
    edit: () => editListView(state.habits),
    form: () => formView(state.habits.find((h) => h.id === editingId)),
    suggest: () => suggestView(state, sugg),
    stats: () => statsView(state, sc, hs, t),
    settings: () => settingsView(state, t, reducedMotion.matches),
    epics: () => epicsView(state, t, epicUi, sc.level, wornIds(state.wardrobe, hs.trophies), state.look),
    'epic-form': () => epicFormView(epicDraft, state.habits, !state.epics.some((e) => e.id === epicDraft?.id), epicAddQuest),
    'epic-ideas': () => epicIdeasView(),
  };
  app.innerHTML = `<main>${views[tab]()}</main>${nav((UNDER_QUEST.includes(tab) ? 'quest' : UNDER_EPICS.includes(tab) ? 'epics' : tab) as NavTab)}`;
  applyScene();
}

// The background layer, repainted only when the scene, screen size or a display setting changes (AUTO flips on a render).
const bgLayer = document.createElement('div');
bgLayer.id = 'bg';
bgLayer.setAttribute('aria-hidden', 'true');
document.body.prepend(bgLayer);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let sceneKey = '';
function applyScene() {
  const d = display(state.settings, reducedMotion.matches);
  const now = new Date();
  const scene = sceneFor(d.bg, now.getHours(), Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 864e5));
  setScene(scene); // music follows the scene
  const px = innerWidth < 700 ? 3 : 5;
  const key = [scene, px, Math.ceil(innerWidth / px), Math.ceil(innerHeight / px), d.strength, d.anim].join();
  if (key === sceneKey) return;
  sceneKey = key;
  document.body.classList.toggle('scened', scene !== 'plain');
  document.body.classList.toggle('still', !d.anim); // the ANIMATIONS switch: background, bosses, pets, trophy shine
  mountScene(bgLayer, scene, px, d.strength, d.anim);
}
let resizing = 0;
addEventListener('resize', () => {
  clearTimeout(resizing);
  resizing = window.setTimeout(applyScene, 200);
});

function go(to: Tab) {
  if (to === 'calendar' && tab !== 'calendar') pickDay(today());
  tab = to;
  render();
  scrollTo(0, 0);
}

// Achievement tiers already announced, kept so a reload doesn't repeat them. A lost tier drops back, so earning it again cheers again.
const TIERS_KEY = 'habit-quest-achievements';
let quietTiers = false; // set when another window saved: it already cheered
const ROMAN = ['I', 'II', 'III'];

function announceTiers() {
  let seen: Record<string, number> = {};
  try {
    seen = JSON.parse(localStorage.getItem(TIERS_KEY) ?? '{}');
  } catch {} // a broken note just means we cheer again
  const now = Object.fromEntries(hs.achievements.map((p) => [p.track.id, p.tier]));
  const ups = newTiers(seen, hs.achievements);
  if (JSON.stringify(now) !== JSON.stringify(seen)) localStorage.setItem(TIERS_KEY, JSON.stringify(now));
  const quiet = quietTiers;
  quietTiers = false;
  if (quiet || !ups.length) return;
  // Many at once means a first launch or a loaded save: one line instead of a pile of banners.
  if (ups.length > 2) return toast(`${ups.length} achievements unlocked from your history! See HERO > ACHIEVEMENTS.`);
  setTimeout(() => // after the check's own banners
    ups.forEach((p) => {
      const prize = trophyAt(p.track.id, p.tier);
      const sub = `${p.track.name} ${ROMAN[p.tier - 1]}: +${TIER_GOLD[p.tier - 1]} G${prize ? ' and a trophy' : ''}`;
      if (!prize) return banner({ title: 'ACHIEVEMENT!', sub, onShow: () => sfx('perfect') });
      const legend = p.tier === 3;
      banner({
        title: legend ? 'LEGENDARY TROPHY!' : 'EPIC TROPHY!', sub, prize: { name: prize.name, tier: p.tier }, reveal: true,
        level: scored.level, worn: [prize.id], look: state.look, onShow: () => sfx(legend ? 'legendary' : 'epic'),
      });
    }));
}

// Petting: a tap, a click, or a rub (enough back-and-forth over the pet, by finger or mouse) gets hearts, the pet's own
// little move and its sound. Once per 0.7s, so a long rub or tap spam doesn't stack sounds.
let pettedAt = 0;
let rubbed = 0;
let rubTimer: ReturnType<typeof setTimeout>;
function pet(el: HTMLElement) {
  if (Date.now() - pettedAt < 700) return;
  pettedAt = Date.now();
  rubbed = 0;
  const id = el.dataset.pet!;
  if (hasSound(id)) sfx(id);
  el.classList.remove('petted');
  void el.offsetWidth; // restart the animation
  el.classList.add('petted');
  hearts(el);
}
app.addEventListener('pointermove', (e) => {
  const el = (e.target as Element).closest<HTMLElement>('.pet');
  if (!el) return;
  rubbed += Math.abs(e.movementX) + Math.abs(e.movementY);
  clearTimeout(rubTimer);
  rubTimer = setTimeout(() => (rubbed = 0), 500); // a pause ends the rub
  if (rubbed > 120) pet(el); // more than a single pass across the 64px pet
});

function tapBadge(id: string) {
  const p = hs.achievements.find((x) => x.track.id === id);
  if (!p) return;
  const t = p.track;
  const trophy = [2, 3].map((n) => trophyAt(t.id, n)).map((it, i) => (it ? ` Tier ${ROMAN[i + 1]} wins the ${it.name}.` : '')).join('');
  toast(`${t.name}: ${t.tiers.join(' / ')} ${t.unit}. You have ${p.value}.${trophy}`);
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

// The page redraws on every check, so a bar would jump; start it where it was and let its CSS transition move it.
function slide(sel: string, fromPct: number) {
  app.querySelectorAll<HTMLElement>(sel).forEach((el) => {
    const to = el.style.width;
    el.style.transition = 'none';
    el.style.width = `${fromPct}%`;
    void el.offsetWidth;
    el.style.transition = '';
    el.style.width = to;
  });
}

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
  const bossBefore = hs.boss;
  const chestsBefore = hs.chests.length;
  const wasComplete = dayComplete(d);
  const epicsBefore = epicMarks();
  // Measured before the redraw: a done quest sorts down the list, but its rewards belong where you tapped.
  const tapped = app.querySelector(`[data-row="${key}"]`)?.getBoundingClientRect();
  day[id] = m;
  commit();
  const after = scored;
  const bossNow = hs.boss;
  const sameFight = !!bossNow && bossNow.week === bossBefore?.week;
  slide('.bar.xp > div', after.level > before.level ? 0 : before.progress * 100);
  if (sameFight && bossNow.dmg > bossBefore.dmg) {
    slide('.bar.boss > div', ((bossBefore.hp - bossBefore.dmg) / bossBefore.hp) * 100);
    floatText(app.querySelector('.boss-bar'), `-${bossNow.dmg - bossBefore.dmg} HP`, 'hot');
    app.querySelectorAll('.boss-art').forEach((el) => el.classList.add(bossNow.won ? 'fall' : 'hit'));
    setTimeout(() => sfx('hit'), 90);
  }
  const a = after.awards[d][id];
  const row = app.querySelector(`[data-row="${key}"]`);
  row?.classList.add('pop', 'stamp');
  // Stacked bottom to top, each a line above the last and a beat later; all rise at one speed, so they never overlap.
  floatText(tapped, `+${a.xp} XP`);
  setTimeout(() => floatText(tapped, `+${a.gold} G`, 'gold', -22), 180);
  if (a.comeback) setTimeout(() => floatText(tapped, 'COMEBACK!', 'hot', -44), 360);
  // A check that moves an epic says so, one line further up.
  if (epicsOfHabit(state.epics, state.log, id).some((e) => d >= e.created)) setTimeout(() => floatText(tapped, 'EPIC +1', 'epic', a.comeback ? -66 : -44), a.comeback ? 540 : 360);
  sfx(a.milestone ? 'milestone' : a.comeback ? 'combo' : m === 'tiny' ? 'tiny' : 'check');

  if (a.milestone) {
    const name = state.habits.find((h) => h.id === id)!.name;
    banner({ title: `${a.streak}-${after.habits[id].unit.toUpperCase()} STREAK!`, sub: `${name}: +${a.milestone} bonus XP and a chest`, onShow: shake });
  }
  if (after.level > before.level) {
    banner({ title: 'LEVEL UP!', sub: `You reached level ${after.level}`, level: after.level, worn: wornIds(state.wardrobe, hs.trophies), look: state.look, onShow: () => { shake(); sfx('levelup'); } });
  }
  if (!wasComplete && dayComplete(d)) {
    banner({ title: 'PERFECT DAY!', sub: `${after.perfect}-day perfect run`, onShow: () => sfx('perfect') });
  }
  if (sameFight && bossNow.won && !bossBefore.won) {
    const sub = `${bossNow.name} falls! +${BOSS_GOLD * bossNow.weeks} G and ${bossNow.weeks > 1 ? `${bossNow.weeks} chests` : 'a chest'}`;
    const worn = wornIds(state.wardrobe, hs.trophies);
    // Let the knockout play before the banner covers it.
    setTimeout(() => banner({ title: 'BOSS DEFEATED!', sub, level: after.level, worn, look: state.look, onShow: () => { shake(); sfx('bossdown'); } }), 900);
  }
  if (hs.chests.length > chestsBefore) toast('You earned a chest! Open it on the HERO tab.');
  cheerEpics(epicsBefore);
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
  const minutes = Math.round(Number(f.get('focus')));
  const focus = minutes >= 1 ? Math.min(FOCUS_MAX, minutes) : undefined; // blank or 0 = no timer
  const fields = { name, tiny: String(f.get('tiny') ?? '').trim() || undefined, icon: String(f.get('icon') ?? 'star'), schedule, focus };
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
  if (w.owned[id] || hs.trophies.includes(id)) {
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
  sfx('buy');
  banner({ title: 'NEW GEAR!', sub: `${it.name} equipped`, level: scored.level, worn: wornIds(w, hs.trophies), look: state.look, onShow: shake });
}

function openChest(id: string) {
  if (!hs.chests.some((c) => c.id === id)) return;
  const w = state.wardrobe;
  const loot = chestLoot(id, w);
  w.opened[id] = { day: today(), ...loot };
  if (loot.item) w.owned[loot.item] = { day: today(), paid: 0 };
  commit();
  sfx('chest');
  if (loot.item) {
    banner({ title: 'RARE FIND!', sub: `${itemById(loot.item)!.name}! Tap it in the wardrobe to wear it`, level: scored.level, worn: [loot.item], look: state.look, onShow: () => { shake(); setTimeout(() => sfx('levelup'), 450); } });
  } else banner({ title: 'CHEST OPENED!', sub: `+${loot.gold} G`, onShow: () => setTimeout(() => sfx('coin'), 450) });
}

// Tap a face to set the day's mood; tap the lit one again to clear the entry.
function setMood(d: string, mood: Mood) {
  if (d > today()) return;
  const cur = state.journal[d];
  if (cur?.mood === mood) {
    if (cur.text && !confirm('Delete this journal entry, line included?')) return;
    delete state.journal[d];
    commit();
    return sfx('undo');
  }
  state.journal[d] = { ...cur, mood };
  commit();
  sfx(`mood${mood}` as const);
  if (cur) return;
  const face = app.querySelector(`[data-action="mood"][data-day="${d}"][data-mood="${mood}"]`);
  if (face) floatText(face, `+${JOURNAL_GOLD} G`, 'gold');
  else toast(`Mood saved: +${JOURNAL_GOLD} G. Add a line in CALENDAR.`); // the Quest prompt hides once answered
}

function saveJournal(form: HTMLFormElement) {
  const e = state.journal[form.dataset.day ?? ''];
  if (!e) return toast('Pick a mood first.');
  const text = String(new FormData(form).get('text') ?? '').trim().slice(0, JOURNAL_MAX);
  if (text) e.text = text;
  else delete e.text;
  commit();
  sfx('tiny');
  toast('Journal saved.');
}

// Focus timer: one at a time, in its own key so a reload or a locked phone can't lose it.
const FOCUS_KEY = 'habit-quest-focus';
let timer = parseTimer(localStorage.getItem(FOCUS_KEY));
let stopping = false; // STOP tapped: the card asks what to log
let wake: WakeLockSentinel | undefined;

function setTimer(t?: Timer) {
  timer = t;
  stopping = false;
  if (t) localStorage.setItem(FOCUS_KEY, JSON.stringify(t));
  else localStorage.removeItem(FOCUS_KEY);
  void syncWake();
}

// Banks the minutes focused and logs the mark, if any, for the day the timer started.
function endTimer(m?: Mark) {
  const t = timer;
  if (!t) return;
  const min = focusedMinutes(t, Date.now());
  setTimer(undefined);
  if (min) state.focus[t.day] = Math.min(1440, (state.focus[t.day] ?? 0) + min);
  if (m && state.habits.some((h) => h.id === t.habit) && !state.log[t.day]?.[t.habit]) return mark(t.habit, m, t.day); // saves too
  commit();
}

function startFocus(id: string) {
  const h = state.habits.find((x) => x.id === id);
  if (!h?.focus) return;
  if (timer && !confirm('Replace the running focus timer? Its minutes so far still count.')) return;
  endTimer();
  const now = Date.now();
  setTimer({ habit: id, day: today(), start: now, end: now + h.focus * MINUTE });
  sfx('focus-start');
  render();
}

// Runs every second: finishes a timer that ran out (also after the app was asleep), else updates the card in place.
function tickFocus() {
  if (!timer) return;
  const now = Date.now();
  if (isOver(timer, now)) {
    const name = state.habits.find((h) => h.id === timer!.habit)?.name ?? 'Your quest';
    const min = focusedMinutes(timer, now);
    endTimer('full');
    banner({ title: 'FOCUS DONE!', sub: `${name}: ${min} min focused`, onShow: () => sfx('focus-done') });
    return;
  }
  const left = timeLeft(timer, now);
  if (left <= 10_000 && document.visibilityState === 'visible') sfx('tick'); // the last ten seconds
  const time = app.querySelector('.focus-time');
  if (time) time.textContent = clock(timeLeft(timer, now));
  const fill = app.querySelector<HTMLElement>('.focus-fill');
  if (fill) fill.style.width = `${Math.round(((now - timer.start) / (timer.end - timer.start)) * 100)}%`;
}

// Keep the screen on while a timer runs, if SETUP says so. The browser drops the lock when the app is hidden.
async function syncWake() {
  if (!timer || !state.settings.wakeLock || document.visibilityState !== 'visible') {
    void wake?.release();
    wake = undefined;
    return;
  }
  if (wake) return;
  try {
    wake = await navigator.wakeLock.request('screen');
    wake.addEventListener('release', () => (wake = undefined));
  } catch {} // unsupported or refused: the timer still works, just without the screen held on
}

function openSuggest(welcome = false) {
  sugg = newSuggest(welcome);
  go('suggest');
}

function toggleGoal(id: string) {
  const g = sugg.goals;
  sugg.goals = g.includes(id) ? g.filter((x) => x !== id) : [...g, id];
  sugg.flip.clear(); // pre-ticks change with the goals
  render();
}

// Typed intention: add the goals it names to the picked ones.
function matchIntent(form: HTMLFormElement) {
  const found = goalsFromText(String(new FormData(form).get('text') ?? ''));
  if (!found.length) return toast('No match. Pick a goal card instead.');
  sugg.goals = [...sugg.goals, ...found.filter((g) => !sugg.goals.includes(g))];
  sugg.flip.clear();
  render();
  toast(`Matched: ${found.map((g) => GOALS.find((x) => x.id === g)!.name).join(', ')}`);
}

function addSuggested() {
  const chosen = picks(state, sugg).filter((s) => s.on);
  if (!chosen.length) return;
  for (const { idea } of chosen) state.habits.push(ideaToHabit(idea, newId(), today()));
  save(state);
  sfx('milestone');
  toast(`${chosen.length} quest${chosen.length === 1 ? '' : 's'} added. Good luck, hero!`);
  go('quest');
}

// Wipes everything but settings. The typed word is the guard; the EXPORT button sits right above it.
function setLook(look: Look) {
  state.look = look;
  save(state);
  render();
}

function newGame() {
  const typed = prompt('NEW GAME wipes all quests, XP, gold, items, journal and focus minutes. Settings stay.\nExport a backup first if you might want them back.\n\nType RESET to start over.');
  if (typed?.trim().toUpperCase() !== 'RESET') return toast('Nothing was reset.');
  setTimer(undefined);
  state = { ...fresh(state.settings), look: state.look }; // your hero's look is yours, like settings
  localStorage.removeItem(TIERS_KEY);
  save(state);
  shownDay = '';
  openSuggest(true);
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

// Epic quests. Progress is derived (logic/epic.ts); these only change the epic itself and cheer what changed.
type EpicMarks = Record<string, { reached: number; finished: boolean; gold: number }>;
const epicMarks = (): EpicMarks => Object.fromEntries(state.epics.map((e) => {
  const p = epicProgress(e, state.log);
  return [e.id, { reached: p.reached.filter(Boolean).length, finished: !!p.finished, gold: p.gold }];
}));

// A chapter reached gets a banner; a finish gets the big one, with the guardian beaten.
function cheerEpics(before: EpicMarks) {
  for (const e of state.epics) {
    const b = before[e.id];
    if (!b) continue;
    const p = epicProgress(e, state.log);
    const gold = p.gold - b.gold;
    if (p.finished && !b.finished) {
      banner({
        title: 'EPIC QUEST COMPLETE!', sub: `${e.name}: ${LADDER[e.guardian].name} is beaten! +${gold} G`, reveal: true,
        level: scored.level, worn: wornIds(state.wardrobe, hs.trophies), look: state.look, onShow: () => { shake(); sfx('guardian'); },
      });
    } else if (p.reached.filter(Boolean).length > b.reached) {
      const last = p.reached.reduce((best, d, i) => (d && (best < 0 || d >= p.reached[best]!) ? i : best), -1);
      banner({ title: 'CHAPTER COMPLETE!', sub: `${e.name}: ${e.chapters[last].name}. +${gold} G`, onShow: () => sfx('chapter') });
    }
  }
}

// Change an epic, save, redraw and cheer anything it reached.
function epicChange(id: string, change: (e: Epic) => void) {
  const e = state.epics.find((x) => x.id === id);
  if (!e) return;
  const before = epicMarks();
  change(e);
  epicUi = { list: listOf(e, epicProgress(e, state.log)), open: id }; // a finish moves it to the HALL: follow it there
  commit();
  cheerEpics(before);
}

function openEpic(id: string) {
  const e = state.epics.find((x) => x.id === id);
  if (!e) return;
  epicUi = { list: listOf(e, epicProgress(e, state.log)), open: id };
  go('epics');
}

function editEpic(id?: string, draft?: Epic, addQuest?: string) {
  const e = state.epics.find((x) => x.id === id);
  epicDraft = draft ?? (e && structuredClone(e));
  epicAddQuest = addQuest;
  go('epic-form');
}

// An idea fills the editor; its quest is linked if you have it, else offered as a new quest to add on save.
function takeIdea(n: number) {
  const i = EPIC_IDEAS[n];
  if (!i) return;
  const have = i.link ? state.habits.find((h) => !h.archived && h.name.toLowerCase() === i.link!.toLowerCase()) : undefined;
  const draft = epicFromIdea(i, newId(), today(), have?.id);
  editEpic(undefined, draft, i.by === 'links' && !have ? i.link : undefined);
}

function saveEpic(form: HTMLFormElement) {
  const f = new FormData(form);
  const text = (k: string, max: number) => String(f.get(k) ?? '').trim().slice(0, max);
  const name = text('name', NAME_MAX);
  if (!name) return;
  const by = String(f.get('by')) as EpicBy;
  const rawTarget = Math.round(Number(f.get('target')) * 10) / 10;
  const target = by === 'chapters' ? undefined : by === 'links' ? Math.round(rawTarget) : rawTarget;
  if (target !== undefined && !(target >= 1 && target <= AMOUNT_MAX)) return alert('Set a target of at least 1.');
  const old = state.epics.find((e) => e.id === epicDraft?.id) ?? epicDraft;
  const names = f.getAll('ch-name').map(String);
  const ats = f.getAll('ch-at').map(Number);
  // Row i is chapter i, so a renamed chapter keeps its tick and note.
  const chapters: Chapter[] = [];
  names.forEach((raw, i) => {
    const n = raw.trim().slice(0, NAME_MAX);
    if (!n) return;
    const at = by !== 'chapters' && ats[i] >= 1 ? Math.min(target!, by === 'links' ? Math.round(ats[i]) : Math.round(ats[i] * 10) / 10) : undefined;
    const prev = old?.chapters[i];
    chapters.push({ name: n, ...(at ? { at } : {}), ...(prev?.done ? { done: prev.done } : {}), ...(prev?.note ? { note: prev.note } : {}) });
  });
  if (by === 'chapters' && !chapters.length) return alert('Add at least one chapter.');
  const links = f.getAll('link').map(String).filter((id) => state.habits.some((h) => h.id === id));
  const addName = by === 'links' ? String(f.get('add-quest') ?? '') : '';
  const idea = addName ? IDEAS.find((i) => i.name === addName) : undefined;
  if (by === 'links' && !links.length && !idea) return alert('Link at least one quest.');
  if (idea) {
    const h = ideaToHabit(idea, newId(), today());
    state.habits.push(h);
    links.push(h.id);
  }
  const due = String(f.get('due') ?? '');
  const g = Number(f.get('guardian'));
  const why = text('why', WHY_MAX);
  const unit = text('unit', UNIT_MAX);
  const e: Epic = {
    id: old?.id ?? newId(), name, icon: String(f.get('icon') ?? 'star'), color: Number(f.get('color') ?? 0),
    created: old?.created ?? today(), guardian: 0, by, chapters, status: old?.status ?? 'active',
    ...(why ? { why } : {}),
    ...(/^\d{4}-\d{2}-\d{2}$/.test(due) ? { due } : {}),
    ...(target !== undefined ? { target } : {}),
    ...(by === 'count' && unit ? { unit } : {}),
    ...(by === 'links' ? { links } : {}),
    ...(old?.logs ? { logs: old.logs } : {}),
    ...(old?.main ? { main: true } : {}),
    ...(old?.ended ? { ended: old.ended } : {}),
  };
  e.guardian = g >= 0 && g < LADDER.length ? g : defaultGuardian(e);
  const before = epicMarks();
  const i = state.epics.findIndex((x) => x.id === e.id);
  if (i >= 0) state.epics[i] = e;
  else {
    before[e.id] = { reached: 0, finished: false, gold: 0 };
    state.epics.push(e);
  }
  epicDraft = undefined;
  epicAddQuest = undefined;
  epicUi = { list: listOf(e, epicProgress(e, state.log)), open: e.id };
  save(state);
  sfx(i >= 0 ? 'tiny' : 'begin');
  go('epics');
  if (i < 0) toast(idea ? `Epic quest begun! "${idea.name}" was added to your quests.` : 'Epic quest begun! The road is long; every step counts.');
  cheerEpics(before);
}

function logEpic(form: HTMLFormElement) {
  const n = Math.round(Number(new FormData(form).get('amount')) * 10) / 10;
  if (!(n > 0)) return;
  const t = today();
  const at = form.querySelector('button')?.getBoundingClientRect();
  epicChange(form.dataset.id!, (e) => {
    e.logs ??= {};
    e.logs[t] = Math.min(AMOUNT_MAX, Math.round(((e.logs[t] ?? 0) + n) * 10) / 10);
  });
  sfx('check');
  floatText(at, `+${n}`, 'epic');
}

function unlogEpic(id: string) {
  const e = state.epics.find((x) => x.id === id);
  const t = today();
  if (!e?.logs?.[t] || !confirm(`Clear today's ${e.logs[t]} logged for "${e.name}"?`)) return;
  delete e.logs[t];
  commit();
  sfx('undo');
}

function tickChapter(id: string, i: number) {
  const c = state.epics.find((x) => x.id === id)?.chapters[i];
  if (!c) return;
  if (c.done) {
    delete c.done;
    commit();
    return sfx('undo');
  }
  epicChange(id, () => (c.done = today()));
  sfx('check');
}

// One line per chapter: the story the HALL tells later.
function noteChapter(id: string, i: number) {
  const c = state.epics.find((x) => x.id === id)?.chapters[i];
  if (!c) return;
  const line = prompt(`One line for "${c.name}" (blank clears it)`, c.note ?? '');
  if (line === null) return;
  const note = line.trim().slice(0, NOTE_MAX);
  if (note) c.note = note;
  else delete c.note;
  commit();
}

function setMain(id: string) {
  for (const e of state.epics) delete e.main;
  const e = state.epics.find((x) => x.id === id);
  if (e) e.main = true;
  commit();
  sfx('tiny');
}

// The INN: off the QUEST screen while life is busy. Linked checks still count, so nothing is lost.
function toggleInn(id: string) {
  const e = state.epics.find((x) => x.id === id);
  if (!e) return;
  e.status = e.status === 'inn' ? 'active' : 'inn';
  if (e.status === 'inn') delete e.main;
  epicUi = { list: e.status, open: id };
  commit();
  sfx(e.status === 'inn' ? 'inn' : 'road');
  toast(e.status === 'inn' ? `${e.name} rests at the INN. Its linked quests still count.` : `${e.name} is back on the road!`);
}

function retire(id: string) {
  const e = state.epics.find((x) => x.id === id);
  if (!e || !confirm(`Retire "${e.name}" with honor? It moves to the HALL with its chapters and gold kept.`)) return;
  e.status = 'retired';
  e.ended = today();
  delete e.main;
  epicUi = { list: 'hall', open: id };
  commit();
  sfx('retire');
  toast('Retired with honor. Every chapter you reached stays in the HALL.');
}

// Only an epic that never paid out can be deleted; one with history retires instead.
function deleteEpic(id: string) {
  const i = state.epics.findIndex((x) => x.id === id);
  const e = state.epics[i];
  if (!e || epicProgress(e, state.log).gold || !confirm(`Delete "${e.name}"? This can't be undone.`)) return;
  state.epics.splice(i, 1);
  epicUi = { list: 'active' };
  commit();
  sfx('undo');
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
    configureAudio(state.settings);
    commit();
    toast('Save loaded!');
  } catch {
    alert('That file is not a Habit Quest save.');
  }
}

// Quiet clicks for taps that only move around; the ones that change your save have their own sounds.
const TAPS = new Set(['cal-month', 'cal-day', 'cal-view', 'slot', 'hero-view', 'epic-list', 'epic-open', 'epic-new', 'epic-edit', 'epic-idea',
  'new', 'edit-habit', 'sugg-show', 'sugg-back', 'sugg-toggle', 'goal', 'budget', 'bg', 'bg-strength', 'preset', 'look', 'look-random',
  'focus-stop', 'focus-keep', 'badge', 'suggest', 'move']);

app.addEventListener('click', (e) => {
  unlock();
  const el = (e.target as Element).closest<HTMLElement>('[data-action]');
  if (!el || el.tagName === 'INPUT') return;
  const id = el.dataset.id ?? '';
  if (el.dataset.action === 'tab') sfx('tab');
  else if (TAPS.has(el.dataset.action!)) sfx('tap');
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
    case 'cal-view': calMood = !!el.dataset.mood; return render();
    case 'mood': return setMood(el.dataset.day!, Number(el.dataset.mood) as Mood);
    case 'focus-start': return startFocus(id);
    case 'focus-stop': stopping = true; return render();
    case 'focus-keep': stopping = false; return render();
    case 'focus-tiny': return endTimer('tiny');
    case 'focus-discard': return endTimer();
    case 'suggest': return openSuggest();
    case 'goal': return toggleGoal(el.dataset.goal!);
    case 'budget': sugg.budget = Number(el.dataset.budget) as Budget; sugg.flip.clear(); return render();
    case 'sugg-show': if (sugg.goals.length) sugg.step = 'pick'; render(); return scrollTo(0, 0);
    case 'sugg-back': sugg.step = 'goals'; return render();
    case 'sugg-toggle': {
      const name = el.dataset.name!;
      if (!sugg.flip.delete(name)) sugg.flip.add(name);
      return render();
    }
    case 'sugg-add': return addSuggested();
    case 'new-game': return newGame();
    case 'rename': return rename(id);
    case 'unplan': return unplan(id);
    case 'slot': shopSlot = el.dataset.slot as HeroUi['slot']; return render();
    case 'hero-view': heroTab = el.dataset.view as HeroUi['view']; return render();
    case 'badge': return tapBadge(el.dataset.track!);
    case 'pet': return pet(el);
    case 'item': return tapItem(el.dataset.item!);
    case 'preset': return setLook(PRESETS[Number(el.dataset.preset)].look);
    case 'look': return setLook({ ...(state.look ?? CLASSIC), [el.dataset.part as keyof Look]: Number(el.dataset.val) });
    case 'look-random': return setLook(randomLook());
    case 'bg': state.settings.bg = el.dataset.bg as Bg; return commit();
    case 'bg-strength': state.settings.bgStrength = Number(el.dataset.val); return commit();
    case 'open-chest': return openChest(el.dataset.chest!);
    case 'epic-open': return openEpic(id);
    case 'epic-list': epicUi = { list: el.dataset.list as EpicUi['list'] }; return render();
    case 'epic-new': return editEpic();
    case 'epic-edit': return editEpic(id);
    case 'epic-idea': return takeIdea(Number(el.dataset.idea));
    case 'epic-chapter': return tickChapter(id, Number(el.dataset.ch));
    case 'epic-note': return noteChapter(id, Number(el.dataset.ch));
    case 'epic-unlog': return unlogEpic(id);
    case 'epic-main': return setMain(id);
    case 'epic-inn': return toggleInn(id);
    case 'epic-retire': return retire(id);
    case 'epic-delete': return deleteEpic(id);
  }
});

// PC shortcuts: 1-9 toggles quest N in your order, Shift+1-9 its tiny version, Q/C/G/H/S/E switch screens.
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
  const to = ({ KeyQ: 'quest', KeyC: 'calendar', KeyG: 'epics', KeyH: 'hero', KeyS: 'stats', KeyE: 'edit' } as Record<string, Tab>)[e.code];
  if (to && !e.shiftKey) go(to);
});

app.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  if (form.dataset.form === 'plan') plan(form);
  else if (form.dataset.form === 'journal') saveJournal(form);
  else if (form.dataset.form === 'intent') matchIntent(form);
  else if (form.dataset.form === 'epic') saveEpic(form);
  else if (form.dataset.form === 'epic-log') logEpic(form);
  else saveHabit(form);
});

// Volume sliders change the sound live while dragging; letting go saves (without a re-render, so keyboard focus stays).
const VOLS: Record<string, keyof Settings> = { sfxPct: 'sfxVol', musicPct: 'musicVol', ambPct: 'ambVol' };
function slideVolume(t: HTMLInputElement) {
  const k = t.dataset.setting as VolKey;
  state.settings[k] = Number(t.value);
  delete state.settings[VOLS[k]]; // the old LOW / MEDIUM / HIGH
  configureAudio(state.settings);
  t.setAttribute('aria-valuetext', `${t.value}%`);
  const out = t.nextElementSibling;
  if (out) out.textContent = `${t.value}%`;
}
app.addEventListener('input', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.type === 'range' && t.dataset.setting) slideVolume(t);
});

app.addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.dataset.action === 'import') return void importFile(t);
  if (!t.dataset.setting) return; // habit form fields save on submit
  if (t.type === 'range') {
    slideVolume(t);
    save(state);
    if (t.dataset.setting === 'sfxPct') sfx('tap'); // hear the new level
    return;
  }
  if (t.dataset.setting === 'sfx') state.settings.muted = !t.checked;
  if (t.dataset.setting === 'music' || t.dataset.setting === 'ambience') state.settings[t.dataset.setting] = t.checked;
  if (t.dataset.setting === 'bgAnim' || t.dataset.setting === 'bossArt') state.settings[t.dataset.setting] = t.checked;
  if (t.dataset.setting === 'wakeLock') {
    if (t.checked) state.settings.wakeLock = true;
    else delete state.settings.wakeLock;
    void syncWake();
  }
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
  configureAudio(state.settings);
  if (t.type === 'checkbox') sfx(t.checked ? 'on' : 'off');
  commit();
});

// Another window (say a browser tab next to the installed app) saved: adopt it, or our next save would erase its checks.
addEventListener('storage', (e) => {
  if (e.key === FOCUS_KEY) {
    // Started or ended in the other window: follow it, so only one window ever finishes it.
    timer = parseTimer(e.newValue);
    stopping = false;
    void syncWake();
    if (tab === 'quest') render();
    return;
  }
  if (e.key !== KEY || !e.newValue) return;
  try {
    state = parseState(e.newValue);
  } catch {
    return;
  }
  quietTiers = true;
  configureAudio(state.settings);
  if (tab !== 'form' && tab !== 'epic-form') render(); // don't wipe a half-typed quest
});

render();
checkNewDay();
warnRisk();
tickFocus(); // a timer that ran out while the app was closed finishes now
void syncWake();
setInterval(tickFocus, 1000);

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
  void syncWake();
  if (document.visibilityState !== 'visible') return;
  checkNewDay();
  warnRisk();
  tickFocus();
});

if (import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {}); // app still works online without it
void navigator.storage?.persist?.();
