import type { HeroState } from '../logic/hero';
import { buyBlock, ITEMS, SLOTS, wornIds, type Item } from '../logic/items';
import type { Score } from '../logic/score';
import type { Slot, State } from '../logic/types';
import { COIN, hero, nextTier, svg, tierOf } from '../sprites';
import { esc } from './html';

// slot: the wardrobe tab shown; buying: item id waiting for a second tap to buy.
export type HeroUi = { slot: Slot; buying?: string };

const SLOT_NAMES: Record<Slot, string> = { hat: 'HAT', weapon: 'WEAPON', cape: 'CAPE', pet: 'PET' };

export const goldText = (hs: HeroState) => `${hs.balance}${hs.balance < 0 ? ' (debt)' : ''}`;

function itemCard(state: State, sc: Score, hs: HeroState, it: Item, ui: HeroUi) {
  const owned = !!state.wardrobe.owned[it.id];
  const worn = state.wardrobe.worn[it.slot] === it.id;
  const block = owned ? '' : buyBlock(it, sc.level, hs.balance, state.wardrobe);
  const arming = ui.buying === it.id;
  const hidden = it.chest && !owned; // chest finds stay a surprise
  const name = hidden ? '???' : it.name;
  const status = worn ? 'WORN' : owned ? 'OWNED' : arming ? `BUY ${it.price} G?` : it.chest ? 'CHEST' : it.level && sc.level < it.level ? `LV ${it.level}` : `${it.price} G`;
  const said = worn ? 'worn, tap to take off' : owned ? 'owned, tap to wear' : arming ? `tap again to buy for ${it.price} gold` : block || `${it.price} gold, tap to buy`;
  const cls = ['item', worn && 'worn', arming && 'arming', block && 'locked'].filter(Boolean).join(' ');
  return `<button class="${cls}" data-action="item" data-item="${it.id}" aria-label="${esc(`${name}, ${said}`)}">
      <span class="item-art">${hidden ? '?' : hero(sc.level, 48, [it.id])}</span>
      <span class="item-name">${esc(name)}</span>
      <span class="item-status">${status}</span>
    </button>`;
}

export function heroView(state: State, sc: Score, hs: HeroState, ui: HeroUi) {
  const t = tierOf(sc.level);
  const next = nextTier(sc.level);
  const tabs = SLOTS.map((s) => `<button role="tab" data-action="slot" data-slot="${s}" aria-selected="${s === ui.slot}">${SLOT_NAMES[s]}</button>`);
  return `
    <h2>HERO</h2>
    <div class="hero-card">
      <div class="hero-big">${hero(sc.level, 128, wornIds(state.wardrobe))}</div>
      <div class="hero-info">
        <b>LV ${sc.level} ${t.title.toUpperCase()}</b>
        <span class="gold${hs.balance < 0 ? ' debt' : ''}">${svg(COIN, 12)} ${goldText(hs)} G</span>
        <span class="muted small">${next ? `Next: ${next.title.toUpperCase()} at LV ${next.from}` : 'Highest tier!'}</span>
      </div>
    </div>
    <h3>WARDROBE</h3>
    <div class="slot-tabs" role="tablist">${tabs.join('')}</div>
    <div class="items">${ITEMS.filter((i) => i.slot === ui.slot).map((i) => itemCard(state, sc, hs, i, ui)).join('')}</div>`;
}
