import { svg } from '../sprites';

// User text (and imported saves) must never become markup.
export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const CHECK = svg(['........', '......ll', '.....ll.', 'l...ll..', 'll.ll...', '.lll....', '..l.....', '........'], 24);
export const ARROW = svg(['...kk...', '..kwwk..', '.kwwwwk.', 'kwwwwwwk', 'kkkwwkkk', '..kwwk..', '..kwwk..', '..kkkk..'], 16);

export type NavTab = 'quest' | 'calendar' | 'hero' | 'stats' | 'settings';

export function nav(current: NavTab) {
  const item = (tab: NavTab, label: string) =>
    `<button data-action="tab" data-tab="${tab}" ${tab === current ? 'aria-current="page"' : ''}>${label}</button>`;
  return `<nav class="tabs">${item('quest', 'QUEST')}${item('calendar', 'CALENDAR')}${item('hero', 'HERO')}${item('stats', 'STATS')}${item('settings', 'SETUP')}</nav>`;
}
