import { daysBetween } from '../logic/day';
import type { State } from '../logic/types';
import { BACKUP_DAYS, backupAge } from '../store';

export function settingsView(state: State, today: string) {
  const { rolloverHour, muted, lastBackup } = state.settings;
  const age = lastBackup ? daysBetween(lastBackup, today) : undefined;
  const stale = (backupAge(state, today) ?? 0) > BACKUP_DAYS;
  const hours = [0, 1, 2, 3, 4, 5, 6].map((h) => `<option value="${h}" ${h === rolloverHour ? 'selected' : ''}>${h === 0 ? '12' : h}:00 AM</option>`);
  return `
    <h2>SETUP</h2>
    <label>NEW DAY STARTS AT
      <select data-setting="rolloverHour">${hours.join('')}</select>
    </label>
    <p class="muted small">Checks before this hour count for the day before, so late nights still count.</p>
    <label class="toggle"><input type="checkbox" data-setting="muted" ${muted ? 'checked' : ''}> MUTE SOUNDS</label>
    <h3>BACKUP</h3>
    <p class="${stale ? 'hot' : 'muted'} small">Last backup: ${age === undefined ? 'never' : age === 0 ? 'today' : `${age} days ago`}</p>
    <p class="muted small">Your save lives only on this device. On iPhone the home-screen app keeps its own save, separate from Safari.</p>
    <button class="btn wide" data-action="export">EXPORT SAVE</button>
    <label class="btn wide">IMPORT SAVE<input type="file" accept=".json,application/json" data-action="import" hidden></label>
    <h3 class="kbd-help">KEYBOARD</h3>
    <p class="kbd-help muted small">1-9: check quest N (in your order). Shift+1-9: its tiny version. Press again twice to undo. Q / C / H / S / E: quests, calendar, hero, stats, edit.</p>
    <p class="muted small center">Habit Quest v0.1 - build ${__BUILD__} UTC</p>`;
}
