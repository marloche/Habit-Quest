import { daysBetween } from '../logic/day';
import type { State } from '../logic/types';
import { BG_NAMES, BGS, DAY_FROM, display, NIGHT_FROM } from '../logic/scene';
import { pctOf, type VolKey } from '../logic/volume';
import { BACKUP_DAYS, backupAge } from '../store';
import type { SyncStatus } from '../sync';
import { esc } from './html';

export function syncText(s: SyncStatus, now = Date.now()) {
  if (s.state === 'syncing') return 'SYNCING...';
  if (s.state === 'error' || s.state === 'offline') return s.msg ?? 'Sync failed.';
  if (!s.last) return 'Not synced yet.';
  const min = Math.floor((now - s.last) / 60_000);
  return `Synced ${min < 1 ? 'just now' : min < 60 ? `${min} min ago` : `${Math.floor(min / 60)} h ago`}.`;
}

export function settingsView(state: State, today: string, reducedMotion: boolean, sync: SyncStatus) {
  const { rolloverHour, muted, lastBackup } = state.settings;
  const age = lastBackup ? daysBetween(lastBackup, today) : undefined;
  const stale = (backupAge(state, today) ?? 0) > BACKUP_DAYS;
  const d = display(state.settings, reducedMotion);
  const bgs = BGS.map((b) => `<button role="tab" data-action="bg" data-bg="${b}" aria-selected="${b === d.bg}">${BG_NAMES[b] ?? b.toUpperCase()}</button>`);
  const strengths = ['LOW', 'MEDIUM', 'HIGH'].map((s, i) => `<button role="tab" data-action="bg-strength" data-val="${i + 1}" aria-selected="${i + 1 === d.strength}">${s}</button>`);
  const vols = (key: VolKey, label: string) => {
    const p = pctOf(state.settings, key);
    return `<div class="vol"><input type="range" min="0" max="100" step="1" value="${p}" data-setting="${key}" aria-label="${label}" aria-valuetext="${p}%"><span class="vol-pct small">${p}%</span></div>`;
  };
  const hours = [0, 1, 2, 3, 4, 5, 6].map((h) => `<option value="${h}" ${h === rolloverHour ? 'selected' : ''}>${h === 0 ? '12' : h}:00 AM</option>`);
  return `
    <h2>SETUP</h2>
    <label>NEW DAY STARTS AT
      <select data-setting="rolloverHour">${hours.join('')}</select>
    </label>
    <p class="muted small">Checks before this hour count for the day before, so late nights still count.</p>
    <label class="toggle"><input type="checkbox" data-setting="wakeLock" ${state.settings.wakeLock ? 'checked' : ''}> KEEP SCREEN ON WHILE FOCUSING</label>
    <p class="muted small">Uses more battery. Without it, a locked phone can't play the end sound; the quest still gets checked when you come back.</p>
    <h3>SOUND</h3>
    <label class="toggle"><input type="checkbox" data-setting="sfx" ${muted ? '' : 'checked'}> SOUND EFFECTS</label>
    ${vols('sfxPct', 'Sound effects volume')}
    <label class="toggle"><input type="checkbox" data-setting="music" ${state.settings.music ? 'checked' : ''}> MUSIC</label>
    ${vols('musicPct', 'Music volume')}
    <p class="muted small">A chiptune for each background scene; it changes when the scene does.</p>
    <label class="toggle"><input type="checkbox" data-setting="ambience" ${state.settings.ambience ? 'checked' : ''}> AMBIENCE</label>
    ${vols('ambPct', 'Ambience volume')}
    <p class="muted small">Scene sounds: rain, waves, wind, fire, birds.</p>
    <p class="muted small">Music pauses while the app is hidden. On iPhone the silent switch mutes everything.</p>
    <h3>DISPLAY</h3>
    <p class="muted small">BACKGROUND</p>
    <div class="slot-tabs three" role="tablist" aria-label="Background">${bgs.join('')}</div>
    <p class="muted small">AUTO: a day scene from ${DAY_FROM}:00 and a night scene from ${NIGHT_FROM}:00, a different one each day.</p>
    <p class="muted small">STRENGTH</p>
    <div class="slot-tabs three" role="tablist" aria-label="Background strength">${strengths.join('')}</div>
    <label class="toggle"><input type="checkbox" data-setting="bgAnim" ${d.anim ? 'checked' : ''}> ANIMATIONS</label>
    <p class="muted small">The background, bosses, pets and trophy shine.</p>
    ${reducedMotion ? '<p class="muted small">Your system asks for reduced motion, so these start off. Turning them on overrides that for these only; the rest of the app stays calm.</p>' : ''}
    <label class="toggle"><input type="checkbox" data-setting="bossArt" ${d.bossArt ? 'checked' : ''}> SHOW BOSS ART</label>
    <h3>SYNC</h3>
    ${sync.on ? `
    <p class="small">Synced through <b>${esc(sync.repo ?? '')}</b>. Progress and the new-day hour are shared; sound and display stay per device.</p>
    <p class="small sync-status${sync.state === 'error' ? ' hot' : ''}" role="status">${esc(syncText(sync))}</p>
    <button class="btn wide" data-action="sync-now">SYNC NOW</button>
    <details class="sync-token"${sync.state === 'error' ? ' open' : ''}>
      <summary class="small">NEW TOKEN</summary>
      <form class="sync-form" data-form="sync-token">
        <label>TOKEN<input name="token" type="password" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
        <button class="btn wide" type="submit">SAVE TOKEN</button>
      </form>
    </details>
    <button class="btn wide ghost" data-action="sync-off">DISCONNECT</button>` : `
    <p class="muted small">Keep your devices the same through a private GitHub repo you own. Nothing else leaves the device.</p>
    <form class="sync-form" data-form="sync">
      <label>REPO<input name="repo" placeholder="yourname/habit-quest-save" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
      <label>TOKEN<input name="token" type="password" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
      <button class="btn wide" type="submit">CONNECT</button>
    </form>
    <p class="muted small">1. On GitHub, make a new PRIVATE repo. 2. Make a fine-grained token for only that repo, with Contents: read and write. 3. Paste both here, on every device. On iPhone, paste inside the home-screen app, not Safari.</p>`}
    <h3>BACKUP</h3>
    <p class="${stale ? 'hot' : 'muted'} small">Last backup: ${age === undefined ? 'never' : age === 0 ? 'today' : `${age} days ago`}</p>
    <p class="muted small">Your save lives only on this device. On iPhone the home-screen app keeps its own save, separate from Safari.</p>
    <button class="btn wide" data-action="export">EXPORT SAVE</button>
    <label class="btn wide">IMPORT SAVE<input type="file" accept=".json,application/json" data-action="import" hidden></label>
    <h3>NEW GAME</h3>
    <p class="muted small">Start over from a clean slate: wipes quests, XP, gold, items, journal and focus minutes. Settings stay. Export first if you might want them back.${sync.on ? ' With sync on, it wipes your other devices too.' : ''}</p>
    <button class="btn wide danger" data-action="new-game">NEW GAME</button>
    <h3 class="kbd-help">KEYBOARD</h3>
    <p class="kbd-help muted small">1-9: check quest N (in your order). Shift+1-9: its tiny version. Press again twice to undo. Q / C / G / H / S / E: quests, calendar, goals (epics), hero, stats, edit.</p>
    <p class="muted small center">Habit Quest v0.1 - build ${__BUILD__} UTC</p>`;
}
