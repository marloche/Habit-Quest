import { dayLabel } from '../logic/day';
import { BOSS_GOLD, woundStage, type HeroState } from '../logic/hero';
import { buyBlock, itemById, ITEMS, RARITY, SLOTS, wornIds, type Item } from '../logic/items';
import type { Score } from '../logic/score';
import type { LookPart, Slot, State } from '../logic/types';
import type { Progress } from '../logic/achievements';
import { BEARDS, CLASSIC, EYES, FACES, GARBS, HAIRS, MARKS, NAME_MAX, OUTFITS, PRESETS, sameLook, SKINS, STYLES, type Swatch } from '../logic/look';
import { CALENDAR, CHEST, COIN, crestRows, FLAME, hero, heroHead, ICONS, ITEM_ART, nextTier, PAL, petOf, SUNRISE, svg, titleOf } from '../sprites';
import { ELITE_PALS, LADDER, wounded } from '../bosses';
import { PETS32 } from '../art32';
import { CHECK, esc } from './html';

// view: wardrobe, look or achievements; slot: the wardrobe tab shown; buying: item id waiting for a second tap to buy.
export type HeroUi = { view: 'wardrobe' | 'look' | 'achievements'; slot: Slot | 'trophies'; buying?: string };

const SLOT_NAMES: Record<Slot, string> = { hat: 'HAT', armor: 'ARMOR', weapon: 'WEAPON', cape: 'CAPE', pet: 'PET' };

export const goldText = (hs: HeroState) => `${hs.balance}${hs.balance < 0 ? ' (debt)' : ''}`;

// The current boss as an HP bar that empties as you check things off; big on the Hero tab, slim on the Quest screen.
export function bossBar(hs: HeroState, big = false, art = true) {
  const b = hs.boss;
  if (!b) return '';
  const left = b.hp - b.dmg;
  const status = b.won ? 'DEFEATED!' : `${left} HP - ${!b.reach ? 'OUT OF REACH' : b.daysLeft ? `${b.daysLeft}d left` : 'last day'}`;
  const said = b.won ? `Boss ${b.name} defeated` : `Boss ${b.name}, ${left} of ${b.hp} HP left, ${b.reach ? `${b.daysLeft} days left` : 'out of reach this time'}`;
  const prize = `+${BOSS_GOLD * b.weeks} G and ${b.weeks > 1 ? `${b.weeks} chests` : 'a chest'}`;
  const by = b.weeks > 1 ? `in ${b.weeks} weeks, by ${dayLabel(b.end)}` : 'by Sunday';
  const story = b.won
    ? `${prize} earned. A meaner boss comes Monday.`
    : !b.reach
      ? `Out of reach this time: it gets away ${b.daysLeft ? `on ${dayLabel(b.end)}` : 'tonight'}. A fresh rematch starts Monday, nothing lost, and every check still earns XP and gold.`
      : `Beat it ${by}: ${prize}. Miss, and it comes back for a rematch.`;
  const { art: rows, title } = LADDER[b.tier];
  // Bigger bosses also draw bigger on the HERO tab: 48px for the 8-pixel slime up to 64px for the dragon.
  const size = 40 + (big ? rows.length : 0);
  const pal = b.lap ? { ...PAL, ...ELITE_PALS[(b.lap - 1) % ELITE_PALS.length] } : PAL;
  return `<div class="boss-bar${big ? ' big' : ''}${b.won ? ' won' : ''}" role="img" aria-label="${said}">
      ${art ? `<span class="boss-art juice b${b.tier}${b.lap ? ` elite e${(b.lap - 1) % ELITE_PALS.length}` : ''}">${svg(wounded(rows, woundStage(b), b.name), size, '', pal)}</span>` : ''}
      <div class="boss-main">
        <div class="hud-row small"><span>${big ? (b.weeks > 1 ? 'BOSS: ' : 'WEEK BOSS: ') : ''}${b.name.toUpperCase()}</span><span class="${b.won ? 'gold' : b.reach ? '' : 'muted'}">${status}</span></div>
        <div class="bar boss ticks juice"><div class="trail" style="width:${Math.round((left / b.hp) * 100)}%"></div><div style="width:${Math.round((left / b.hp) * 100)}%"></div></div>
        ${big ? `<div class="small hot">"${title}"</div>
        ${b.won ? '' : `<div class="small">${b.hp} HP${b.weeks > 1 ? `, a ${b.weeks}-week fight` : ''}. Your checks hit for ${b.hit}, tiny ones for ${Math.round(b.hit / 2)}.</div>`}
        <div class="small muted">${story} Bosses beaten: ${hs.wins}</div>` : ''}
      </div>
    </div>`;
}

// The worn pet sits on the hero as its own button, so tapping or rubbing it gets a reaction. Half the hero's size: 8 of its 16 rows.
export const petButton = (id: string, size = 64) =>
  `<button class="pet p-${id}" data-action="pet" data-pet="${id}" aria-label="Pet your ${esc(itemById(id)?.name ?? 'pet')}">${svg(PETS32[id] ?? ITEM_ART[id].rows, size)}</button>`;

const TRACK_ART: Record<string, string[]> = {
  streak: FLAME, perfect: ICONS.star, checks: ICONS.pen, tiny: ICONS.leaf, comeback: ICONS.heart,
  boss: LADDER[0].art, level: ICONS.sword, planner: ICONS.moon, collector: COIN, treasure: CHEST,
  days: SUNRISE, weeks: CALENDAR, legends: crestRows('star', 'v'),
};
const DIM = { ...PAL, y: PAL.S }; // an unearned star

function badge(p: Progress) {
  const t = p.track;
  const next = t.tiers[p.tier]; // undefined once tier III is reached
  const stars = [0, 1, 2].map((i) => svg(ICONS.star, 10, '', i < p.tier ? PAL : DIM)).join('');
  const pct = next ? Math.min(100, Math.round((p.value / next) * 100)) : 100;
  const said = `${t.name}, tier ${p.tier} of 3, ${p.value} ${t.unit}${next ? `, next tier at ${next}` : ''}`;
  return `<button class="badge${p.tier ? '' : ' none'}${p.tier === 3 ? ' max' : ''}" data-action="badge" data-track="${t.id}" aria-label="${said}">
      <span class="badge-art">${svg(TRACK_ART[t.id], 32)}</span>
      <span class="badge-name">${t.name}</span>
      <span class="badge-stars">${stars}</span>
      <span class="bar"><div style="width:${pct}%"></div></span>
      <span class="badge-count">${next ? `${p.value}/${next}` : 'MAX'}</span>
    </button>`;
}

function itemCard(state: State, sc: Score, hs: HeroState, it: Item, ui: HeroUi) {
  const owned = !!state.wardrobe.owned[it.id] || hs.trophies.includes(it.id);
  const worn = owned && state.wardrobe.worn[it.slot] === it.id;
  const block = owned ? '' : buyBlock(it, sc.level, hs.balance, state.wardrobe);
  const arming = ui.buying === it.id;
  const hidden = it.chest && !owned; // chest finds stay a surprise
  const name = hidden ? '???' : it.name;
  const status = worn ? 'WORN' : owned ? 'OWNED' : arming ? `BUY ${it.price} G?` : it.chest ? 'CHEST' : it.trophy ? 'TROPHY' : it.level && sc.level < it.level ? `LV ${it.level}` : `${it.price} G`;
  const said = worn ? 'worn, tap to take off' : owned ? 'owned, tap to wear' : arming ? `tap again to buy for ${it.price} gold` : block || `${it.price} gold, tap to buy`;
  const cls = ['item', worn && 'worn', arming && 'arming', block && 'locked'].filter(Boolean).join(' ');
  return `<button class="${cls}" data-action="item" data-item="${it.id}" aria-label="${esc(`${name}, ${said}`)}">
      <span class="item-art">${hidden ? '?' : hero(sc.level, 48, [it.id], state.look)}</span>
      <span class="item-name">${esc(name)}</span>
      <span class="item-status">${status}</span>
    </button>`;
}

// Trophies stay visible while locked (dimmed), with their unlock spelled out: the point is knowing what to show up for.
function trophyCard(state: State, sc: Score, hs: HeroState, it: Item) {
  const t = it.trophy!;
  const earned = hs.trophies.includes(it.id);
  const worn = earned && state.wardrobe.worn[it.slot] === it.id;
  const kind = `${RARITY[t.tier]} ${SLOT_NAMES[it.slot]}`;
  const said = `${it.name}, ${kind.toLowerCase()} trophy, ${worn ? 'worn, tap to take off' : earned ? 'earned, tap to wear' : 'locked'}. ${t.how}`;
  const cls = ['item', 'trophy', `t${t.tier}`, worn && 'worn', !earned && 'unearned'].filter(Boolean).join(' ');
  return `<button class="${cls}" data-action="item" data-item="${it.id}" aria-label="${esc(said)}">
      <span class="item-art">${hero(sc.level, 48, [it.id], state.look)}</span>
      <span class="rare t${t.tier}">${esc(it.name)}</span>
      <span class="item-kind">${kind}</span>
      <span class="item-how">${esc(t.how)}</span>
      <span class="item-status">${worn ? 'WORN' : earned ? 'EARNED' : 'LOCKED'}</span>
    </button>`;
}

// A color button; the check mark and the name in the heading say which is picked, not the color alone.
const swatch = (part: LookPart, label: string, s: Swatch, i: number, on: boolean) =>
  `<button class="swatch" style="--c:${s.c};--d:${s.d ?? s.c}" data-action="look" data-part="${part}" data-val="${i}" aria-pressed="${on}" aria-label="${label} ${s.name}">${on ? CHECK : ''}</button>`;

// Your name, shown as "NAME THE RANK". Also on the WELCOME screen. Empty clears it.
export const nameForm = (name = '') => `
  <form class="plan-form" data-form="hero-name">
    <input name="name" maxlength="${NAME_MAX}" value="${esc(name)}" placeholder="Your hero's name" aria-label="Your hero's name" autocomplete="off" spellcheck="false">
    <button class="btn small" type="submit">SAVE</button>
  </form>`;

function lookView(state: State, level: number, worn: string[]) {
  const look = state.look ?? CLASSIC;
  const presets = PRESETS.map((p, i) => `<button class="item" data-action="preset" data-preset="${i}" aria-pressed="${sameLook(look, p.look)}">
      <span class="item-art">${hero(level, 48, [], p.look)}</span><span class="item-name">${p.name.toUpperCase()}</span></button>`);
  // Head-and-shoulders buttons, so hair and faces show big enough to tell apart.
  const heads = (part: LookPart, label: string, names: string[]) =>
    `<h3>${label}: ${names[look[part] ?? 0].toUpperCase()}</h3>
     <div class="styles heads" role="group" aria-label="${label}">${names.map((n, i) => `<button class="item" data-action="look" data-part="${part}" data-val="${i}" aria-pressed="${(look[part] ?? 0) === i}" aria-label="${label} ${n}">
      <span class="item-art">${heroHead({ ...look, [part]: i }, 44)}</span><span class="item-name">${n.toUpperCase()}</span></button>`).join('')}</div>`;
  const garbs = GARBS.map((n, i) => `<button class="item" data-action="look" data-part="garb" data-val="${i}" aria-pressed="${(look.garb ?? 0) === i}" aria-label="Outfit ${n}">
      <span class="item-art">${hero(level, 40, [], { ...look, garb: i })}</span></button>`);
  const row = (part: 'skin' | 'hair' | 'outfit' | 'eye', label: string, list: Swatch[]) =>
    `<h3>${label}: ${list[look[part] ?? 0].name.toUpperCase()}</h3>
     <div class="swatches" role="group" aria-label="${label}">${list.map((s, i) => swatch(part, label, s, i, (look[part] ?? 0) === i)).join('')}</div>`;
  // Pinned while you scroll the long list below, so every change shows on your hero without scrolling back up.
  return `
    <div class="look-pin">${hero(level, 64, worn, look)}<button class="btn ghost" data-action="look-random">RANDOM HERO</button></div>
    ${nameForm(look.name)}
    <h3>PRESETS</h3>
    <div class="presets">${presets.join('')}</div>
    ${row('skin', 'SKIN', SKINS)}
    ${heads('style', 'HAIR', STYLES)}
    ${row('hair', 'HAIR COLOR', HAIRS)}
    ${heads('face', 'EXPRESSION', FACES)}
    ${row('eye', 'EYES', EYES)}
    ${heads('beard', 'FACIAL HAIR', BEARDS)}
    ${heads('mark', 'FACE MARKS', MARKS)}
    <h3>OUTFIT STYLE: ${GARBS[look.garb ?? 0].toUpperCase()}</h3>
    <div class="styles" role="group" aria-label="Outfit style">${garbs.join('')}</div>
    ${row('outfit', 'OUTFIT COLOR', OUTFITS)}
    <p class="muted small">Hats cover your hair. Your level adds armor trim on top: shoulder pads at KNIGHT, a gold belt at CHAMPION, glowing eyes at LEGEND.</p>`;
}

export function heroView(state: State, sc: Score, hs: HeroState, ui: HeroUi) {
  const next = nextTier(sc.level);
  const stars = hs.achievements.reduce((n, p) => n + p.tier, 0);
  const tabs = [...SLOTS, 'trophies' as const].map((s) => `<button role="tab" data-action="slot" data-slot="${s}" aria-selected="${s === ui.slot}">${s === 'trophies' ? 'TROPHY' : SLOT_NAMES[s]}</button>`);
  const trophies = ITEMS.filter((i) => i.trophy);
  const earned = trophies.filter((i) => hs.trophies.includes(i.id)).length;
  const worn = wornIds(state.wardrobe, hs.trophies);
  const pet = petOf(worn);
  return `
    <h2>HERO</h2>
    <div class="hero-card">
      <div class="hero-big juice">${hero(sc.level, 128, worn, state.look, true)}${pet ? petButton(pet) : ''}</div>
      <div class="hero-info">
        <b>LV ${sc.level} ${esc(titleOf(sc.level, state.look).toUpperCase())}</b>
        <span class="gold${hs.balance < 0 ? ' debt' : ''}">${svg(COIN, 12)} ${goldText(hs)} G</span>
        <span class="muted small">${next ? `Next: ${next.title.toUpperCase()} at LV ${next.from}` : 'Highest tier!'}</span>
      </div>
    </div>
    ${bossBar(hs, true, state.settings.bossArt !== false)}
    ${hs.chests.length ? `<button class="btn wide chest-btn" data-action="open-chest" data-chest="${hs.chests[0].id}">
      ${svg(CHEST, 32)}<span>OPEN CHEST${hs.chests.length > 1 ? ` (${hs.chests.length})` : ''}<small>${esc(hs.chests[0].why)}</small></span></button>` : ''}
    <div class="slot-tabs three" role="tablist">
      <button role="tab" data-action="hero-view" data-view="wardrobe" aria-selected="${ui.view === 'wardrobe'}">WARDROBE</button>
      <button role="tab" data-action="hero-view" data-view="look" aria-selected="${ui.view === 'look'}">LOOK</button>
      <button role="tab" data-action="hero-view" data-view="achievements" aria-selected="${ui.view === 'achievements'}">ACHIEVEMENTS ${stars}/${hs.achievements.length * 3}</button>
    </div>
    ${ui.view === 'look' ? lookView(state, sc.level, worn) : ui.view === 'achievements'
      ? `<div class="badges">${hs.achievements.map(badge).join('')}</div>`
      : `<div class="slot-tabs six" role="tablist">${tabs.join('')}</div>
         ${ui.slot === 'trophies'
           ? `<p class="muted small">${earned} of ${trophies.length} earned. Trophies can't be bought: you earn them by showing up. A missed day never takes one away.</p>
              <div class="items">${trophies.map((i) => trophyCard(state, sc, hs, i)).join('')}</div>`
           : `<div class="items">${ITEMS.filter((i) => i.slot === ui.slot && !i.trophy).map((i) => itemCard(state, sc, hs, i, ui)).join('')}</div>`}`}`;
}
