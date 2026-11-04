import { daysBetween } from '../logic/day';
import type { State } from '../logic/types';
import { BGS, DAY_FROM, display, NIGHT_FROM } from '../logic/scene';
import { BACKUP_DAYS, backupAge } from '../store';

export function settingsView(state: State, today: string, reducedMotion: boolean) {
  const { rolloverHour, muted, lastBackup } = state.settings;
  const age = lastBackup ? daysBetween(lastBackup, today) : undefined;
  const stale = (backupAge(state, today) ?? 0) > BACKUP_DAYS;
  const d = display(state.settings, reducedMotion);
  const bgs = BGS.map((b) => `<button role="tab" data-action="bg" data-bg="${b}" aria-selected="${b === d.bg}">${b === 'hell' ? 'HELL' : b.toUpperCase()}</button>`);
  const strengths = ['LOW', 'MEDIUM', 'HIGH'].map((s, i) => `<button role="tab" data-action="bg-strength" data-val="${i + 1}" aria-selected="${i + 1 === d.strength}">${s}</button>`);
  const hours = [0, 1, 2, 3, 4, 5, 6].map((h) => `<option value="${h}" ${h === rolloverHour ? 'selected' : ''}>${h === 0 ? '12' : h}:00 AM</option>`);
  return `
    <h2>SETUP</h2>
    <label>NEW DAY STARTS AT
      <select data-setting="rolloverHour">${hours.join('')}</select>
    </label>
    <p class="muted small">Checks before this hour count for the day before, so late nights still count.</p>
    <label class="toggle"><input type="checkbox" data-setting="muted" ${muted ? 'checked' : ''}> MUTE SOUNDS</label>
    <label class="toggle"><input type="checkbox" data-setting="wakeLock" ${state.settings.wakeLock ? 'checked' : ''}> KEEP SCREEN ON WHILE FOCUSING</label>
    <p class="muted small">Uses more battery. Without it, a locked phone can't play the end sound; the quest still gets checked when you come back.</p>
    <h3>DISPLAY</h3>
    <p class="muted small">BACKGROUND</p>
    <div class="slot-tabs three" role="tablist" aria-label="Background">${bgs.join('')}</div>
    <p class="muted small">AUTO: forest village from ${DAY_FROM}:00, castle at night from ${NIGHT_FROM}:00.</p>
    <p class="muted small">STRENGTH</p>
    <div class="slot-tabs three" role="tablist" aria-label="Background strength">${strengths.join('')}</div>
    <label class="toggle"><input type="checkbox" data-setting="bgAnim" ${d.anim ? 'checked' : ''}> ANIMATE BACKGROUND</label>
    ${reducedMotion ? '<p class="muted small">This device asks for reduced motion, so the background stays still either way. Change it in the system settings.</p>' : ''}
    <label class="toggle"><input type="checkbox" data-setting="bossArt" ${d.bossArt ? 'checked' : ''}> SHOW BOSS ART</label>
    <h3>BACKUP</h3>
    <p class="${stale ? 'hot' : 'muted'} small">Last backup: ${age === undefined ? 'never' : age === 0 ? 'today' : `${age} days ago`}</p>
    <p class="muted small">Your save lives only on this device. On iPhone the home-screen app keeps its own save, separate from Safari.</p>
    <button class="btn wide" data-action="export">EXPORT SAVE</button>
    <label class="btn wide">IMPORT SAVE<input type="file" accept=".json,application/json" data-action="import" hidden></label>
    <h3>NEW GAME</h3>
    <p class="muted small">Start over from a clean slate: wipes quests, XP, gold, items, journal and focus minutes. Settings stay. Export first if you might want them back.</p>
    <button class="btn wide danger" data-action="new-game">NEW GAME</button>
    <h3 class="kbd-help">KEYBOARD</h3>
    <p class="kbd-help muted small">1-9: check quest N (in your order). Shift+1-9: its tiny version. Press again twice to undo. Q / C / H / S / E: quests, calendar, hero, stats, edit.</p>
    <p class="muted small center">Habit Quest v0.1 - build ${__BUILD__} UTC</p>`;
}
