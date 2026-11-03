import { addDays, weekStart } from '../logic/day';
import { expected, isActive, type Score } from '../logic/score';
import type { HeroState } from '../logic/hero';
import { focusStats, minutesText } from '../logic/focus';
import { MOODS, moodLink, moodName } from '../logic/journal';
import type { State } from '../logic/types';
import { esc } from './html';

const WEEKS = 16;
const MOOD_DAYS = 30;

export function statsView(state: State, sc: Score, hs: HeroState, today: string) {
  const start = addDays(weekStart(today), -7 * (WEEKS - 1));
  const cells: string[] = [];
  for (let d = start; d < addDays(weekStart(today), 7); d = addDays(d, 1)) {
    if (d > today) {
      cells.push('<i class="h-future"></i>');
      continue;
    }
    const want = state.habits.reduce((n, h) => n + expected(h, d), 0);
    const got = Object.keys(state.log[d] ?? {}).filter((id) => state.habits.some((h) => h.id === id && isActive(h, d))).length;
    const ratio = want ? Math.min(1, got / want) : got ? 1 : -1;
    const lvl = ratio < 0 ? 'rest' : ratio === 0 ? 0 : ratio < 0.34 ? 1 : ratio < 0.67 ? 2 : ratio < 1 ? 3 : 4;
    cells.push(`<i class="h-${lvl}" title="${d}: ${got} done"></i>`);
  }

  const rows = state.habits.filter((h) => !h.archived && h.schedule.kind !== 'once').map((h) => {
    const st = sc.habits[h.id];
    const u = st.unit === 'week' ? 'w' : 'd';
    return `<tr><th scope="row">${esc(h.name)}</th><td>${st.streak}${u}</td><td>${st.best}${u}</td><td>${st.full}/${st.tiny}</td></tr>`;
  });

  const moods = Array.from({ length: MOOD_DAYS }, (_, i) => {
    const d = addDays(today, i - MOOD_DAYS + 1);
    const m = state.journal[d]?.mood;
    return `<i class="m${m ?? 0}" title="${d}${m ? `: ${MOODS[m - 1].toLowerCase()}` : ''}"></i>`;
  });
  const fs = focusStats(state.focus, today);
  const link = moodLink(state.habits, state.log, state.journal, today);
  const said = (a: typeof link.all) => (a ? `${moodName(a.avg)} (${a.days}d)` : '-');
  const moodLine = link.all || link.other
    ? `<p class="small">Avg mood on all-done days: <b>${said(link.all)}</b>. Other days: <b>${said(link.other)}</b>.</p>`
    : '<p class="small muted">No journal entries yet. Pick a face on the Quest screen tonight.</p>';

  return `
    <h2>STATS</h2>
    <div class="cards">
      <div class="card"><b>${sc.level}</b><span>LEVEL</span></div>
      <div class="card"><b>${sc.xp}</b><span>TOTAL XP</span></div>
      <div class="card"><b>${hs.balance}</b><span>GOLD</span></div>
      <div class="card"><b>${sc.perfect}d</b><span>PERFECT RUN</span></div>
      <div class="card"><b>${sc.bestPerfect}d</b><span>BEST RUN</span></div>
      <div class="card"><b>x${sc.momentum.toFixed(2)}</b><span>MOMENTUM</span></div>
      <div class="card"><b>${minutesText(fs.today)}</b><span>FOCUS TODAY</span></div>
      <div class="card"><b>${minutesText(fs.week)}</b><span>FOCUS WEEK</span></div>
      <div class="card"><b>${minutesText(fs.total)}</b><span>FOCUS TOTAL</span></div>
    </div>
    <h3>LAST ${WEEKS} WEEKS</h3>
    <div class="heat" role="img" aria-label="Completion heatmap for the last ${WEEKS} weeks">${cells.join('')}</div>
    <h3>MOOD, LAST ${MOOD_DAYS} DAYS</h3>
    <div class="mood-strip" role="img" aria-label="Mood for each of the last ${MOOD_DAYS} days">${moods.join('')}</div>
    ${moodLine}
    <h3>QUESTS</h3>
    <table class="stat-table">
      <thead><tr><th scope="col">QUEST</th><th scope="col">NOW</th><th scope="col">BEST</th><th scope="col">FULL/TINY</th></tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table>`;
}
