import { startAmbience, type Room } from './ambience';
import type { Scene } from './logic/music';
import type { Settings } from './logic/types';
import { gainOf } from './logic/volume';
import { noise, startMusic, stopMusic } from './music';

// Chiptune effects synthesized live: [frequency Hz, start s, duration s, slide to Hz]. vol scales a sound (1 = normal).
type Note = [number, number, number, number?];
const SONGS = {
  check: { wave: 'square', notes: [[988, 0, 0.07], [1319, 0.07, 0.22]] },
  tiny: { wave: 'square', notes: [[784, 0, 0.1]] },
  undo: { wave: 'square', notes: [[440, 0, 0.06], [330, 0.06, 0.1]] },
  combo: { wave: 'square', notes: [[659, 0, 0.06], [784, 0.06, 0.06], [1047, 0.12, 0.06], [1319, 0.18, 0.2]] },
  milestone: { wave: 'square', notes: [[523, 0, 0.07], [659, 0.07, 0.07], [784, 0.14, 0.07], [1047, 0.21, 0.07], [784, 0.28, 0.07], [1047, 0.35, 0.07], [1319, 0.42, 0.07], [1568, 0.49, 0.3]] },
  levelup: { wave: 'square', notes: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.12], [784, 0.45, 0.08], [1047, 0.53, 0.5]] },
  perfect: { wave: 'triangle', notes: [[784, 0, 0.1], [988, 0.1, 0.1], [1175, 0.2, 0.1], [1568, 0.3, 0.45]] },
  // Rewards
  hit: { wave: 'square', notes: [[140, 0, 0.09, 60]] }, // a soft thump under the check sound
  bossdown: { wave: 'square', notes: [[523, 0, 0.14, 196], [262, 0.16, 0.1], [392, 0.3, 0.08], [523, 0.38, 0.08], [659, 0.46, 0.08], [1047, 0.54, 0.45]] },
  chest: { wave: 'triangle', notes: [[392, 0, 0.08, 523], [1047, 0.1, 0.06], [1319, 0.16, 0.06], [1568, 0.22, 0.06], [2093, 0.28, 0.3]] },
  coin: { wave: 'square', notes: [[1568, 0, 0.05], [2093, 0.05, 0.3]] },
  buy: { wave: 'triangle', notes: [[659, 0, 0.07], [880, 0.07, 0.07], [1319, 0.14, 0.3]] },
  epic: { wave: 'triangle', notes: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.12], [988, 0.45, 0.08], [1319, 0.53, 0.6]] },
  legendary: { wave: 'square', notes: [[392, 0, 0.1], [392, 0.13, 0.07], [392, 0.22, 0.07], [523, 0.32, 0.36], [466, 0.72, 0.1], [523, 0.84, 0.1], [659, 0.96, 0.1], [784, 1.08, 0.8]] },
  // Menus: quieter than rewards
  tap: { wave: 'square', notes: [[1200, 0, 0.025]], vol: 0.35 },
  tab: { wave: 'triangle', notes: [[660, 0, 0.03], [990, 0.03, 0.05]], vol: 0.6 },
  on: { wave: 'square', notes: [[660, 0, 0.04], [990, 0.04, 0.07]], vol: 0.5 },
  off: { wave: 'square', notes: [[990, 0, 0.04], [660, 0.04, 0.07]], vol: 0.5 },
  // Epic quests
  log: { wave: 'triangle', notes: [[880, 0, 0.05], [1175, 0.05, 0.14]] },
  chapter: { wave: 'triangle', notes: [[523, 0, 0.09], [784, 0.09, 0.09], [1047, 0.18, 0.09], [1319, 0.3, 0.09], [1175, 0.39, 0.09], [1568, 0.48, 0.45]] },
  guardian: { wave: 'square', notes: [[262, 0, 0.12], [330, 0.12, 0.12], [392, 0.24, 0.12], [523, 0.36, 0.3], [392, 0.7, 0.1], [523, 0.82, 0.1], [659, 0.94, 0.1], [784, 1.06, 0.12], [1047, 1.22, 0.9]] },
  inn: { wave: 'sine', notes: [[784, 0, 0.18], [659, 0.2, 0.18], [523, 0.4, 0.45]], vol: 1.4 },
  road: { wave: 'triangle', notes: [[523, 0, 0.08], [659, 0.08, 0.08], [784, 0.16, 0.22]] },
  retire: { wave: 'triangle', notes: [[659, 0, 0.15], [784, 0.17, 0.15], [988, 0.34, 0.15], [1319, 0.52, 0.7]] },
  begin: { wave: 'square', notes: [[392, 0, 0.08], [523, 0.1, 0.08], [659, 0.2, 0.08], [784, 0.3, 0.3]] },
  // Focus timer and journal
  'focus-start': { wave: 'triangle', notes: [[523, 0, 0.1], [1047, 0.1, 0.25]] },
  tick: { wave: 'square', notes: [[2000, 0, 0.015]], vol: 0.3 },
  'focus-done': { wave: 'sine', notes: [[1047, 0, 0.7], [1319, 0.15, 0.7], [1568, 0.3, 1]], vol: 1.4 },
  mood1: { wave: 'triangle', notes: [[392, 0, 0.18, 300]] },
  mood2: { wave: 'triangle', notes: [[440, 0, 0.14]] },
  mood3: { wave: 'triangle', notes: [[523, 0, 0.14]] },
  mood4: { wave: 'triangle', notes: [[587, 0, 0.07], [784, 0.07, 0.12]] },
  mood5: { wave: 'triangle', notes: [[659, 0, 0.06], [880, 0.06, 0.06], [1047, 0.12, 0.16]] },
  // Pets, one voice each
  frog: { wave: 'square', notes: [[300, 0, 0.06, 190], [280, 0.09, 0.09, 170]] },
  fox: { wave: 'triangle', notes: [[900, 0, 0.08, 1500], [1400, 0.1, 0.1, 900]] },
  'little-ghost': { wave: 'sine', notes: [[330, 0, 0.3, 470], [470, 0.3, 0.45, 250]] },
  griffin: { wave: 'sawtooth', notes: [[1700, 0, 0.2, 900]] },
  'loyal-hound': { wave: 'square', notes: [[200, 0, 0.08, 140], [200, 0.15, 0.1, 130]] },
  'steady-turtle': { wave: 'triangle', notes: [[180, 0, 0.25, 360]] },
  slime: { wave: 'square', notes: [[150, 0, 0.12, 320], [320, 0.12, 0.08, 110]] },
  cat: { wave: 'triangle', notes: [[600, 0, 0.15, 950], [950, 0.15, 0.3, 480]] },
  'baby-dragon': { wave: 'sawtooth', notes: [[260, 0, 0.12, 520], [520, 0.12, 0.22, 200]] },
  'wise-owl': { wave: 'sine', notes: [[520, 0, 0.16, 440], [500, 0.26, 0.24, 410]] },
  phoenix: { wave: 'triangle', notes: [[784, 0, 0.07], [1047, 0.07, 0.07], [1319, 0.14, 0.07], [1760, 0.21, 0.3, 2093]] },
} satisfies Record<string, { wave: OscillatorType; notes: Note[]; vol?: number }>;
export type Sound = keyof typeof SONGS;

let ctx: AudioContext | undefined;
let bus: { sfx: GainNode; music: GainNode; amb: GainNode } | undefined;
export const audio = { muted: false, sfx: 1, music: false, musicGain: 0.7, ambience: false, ambGain: 0.7 };
let scene: Scene = 'plain';
let room: Room | undefined; // a place with its own sound (the Keep) replaces the scene's ambience while you're in it
let amb: { scene: Room; stop: () => void } | undefined;

// Starts, stops or swaps music and ambience to match the settings, the scene and whether the app is on screen.
function sync() {
  if (!ctx || !bus) return; // nothing plays before the first tap
  const t = ctx.currentTime;
  bus.sfx.gain.setTargetAtTime(audio.sfx, t, 0.05);
  bus.music.gain.setTargetAtTime(audio.musicGain, t, 0.05);
  bus.amb.gain.setTargetAtTime(audio.ambGain, t, 0.05);
  const shown = document.visibilityState === 'visible';
  if (audio.music && shown) startMusic(ctx, bus.music, scene);
  else stopMusic(ctx);
  const want = room ?? scene;
  if (amb && (!audio.ambience || !shown || amb.scene !== want)) {
    amb.stop();
    amb = undefined;
  }
  if (!amb && audio.ambience && shown) amb = { scene: want, stop: startAmbience(ctx, bus.amb, want) };
}

export function setRoom(r?: Room) {
  if (r === room) return;
  room = r;
  sync();
}

// iOS only allows audio after a user gesture, so this runs inside tap handlers.
export function unlock() {
  if (!ctx) {
    ctx = new AudioContext();
    const out = (v: number) => {
      const g = ctx!.createGain();
      g.gain.value = v;
      g.connect(ctx!.destination);
      return g;
    };
    bus = { sfx: out(1), music: out(0.7), amb: out(0.7) };
  }
  if (ctx.state !== 'running') void ctx.resume(); // 'interrupted' on iOS after a call or Siri
  sync();
}

export function configureAudio(s: Settings) {
  audio.muted = s.muted;
  audio.sfx = gainOf(s, 'sfxPct');
  audio.music = !!s.music;
  audio.musicGain = gainOf(s, 'musicPct');
  audio.ambience = !!s.ambience;
  audio.ambGain = gainOf(s, 'ambPct');
  sync();
}

export function setScene(s: Scene) {
  scene = s;
  sync();
}

document.addEventListener('visibilitychange', sync); // music pauses while the app is hidden

export const hasSound = (name: string): name is Sound => name in SONGS;

// Writing sounds in the Keep, made from filtered noise: a quill scratch per keystroke, a page rustle, a wax seal.
// Effects bus, so they follow SOUND EFFECTS like every other tap.
export type Foley = 'quill' | 'page' | 'seal';
export function foley(name: Foley) {
  if (audio.muted) return;
  unlock();
  const c = ctx!;
  const t = c.currentTime + 0.01;
  const r = (a: number, b: number) => a + Math.random() * (b - a);
  const hiss = (type: BiquadFilterType, freq: number, start: number, dur: number, vol: number, to?: number) => {
    const src = c.createBufferSource();
    src.buffer = noise(c);
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t + start);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + start + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t + start);
    g.gain.exponentialRampToValueAtTime(0.0005, t + start + dur);
    src.connect(f).connect(g).connect(bus!.sfx);
    src.start(t + start, Math.random() * 0.5);
    src.stop(t + start + dur + 0.02);
  };
  if (name === 'quill') hiss('bandpass', r(3500, 5500), 0, r(0.025, 0.055), 0.05);
  else if (name === 'page') {
    hiss('bandpass', 1200, 0, 0.35, 0.07, 4200);
    hiss('highpass', 5000, 0.06, 0.22, 0.03);
  } else {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.18);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g).connect(bus!.sfx);
    o.start(t);
    o.stop(t + 0.22);
    hiss('lowpass', 500, 0, 0.1, 0.1);
    hiss('bandpass', 1800, 0.03, 0.06, 0.03); // the wax gives
  }
}

export function sfx(name: Sound) {
  if (audio.muted) return;
  unlock();
  const c = ctx!;
  const { wave, notes, vol = 1 } = SONGS[name] as { wave: OscillatorType; notes: Note[]; vol?: number };
  const t0 = c.currentTime + 0.01;
  for (const [freq, start, dur, to] of notes) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, t0 + start);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + start + dur);
    // Sawtooth is the harshest wave, so it plays a little softer.
    gain.gain.setValueAtTime((wave === 'sawtooth' ? 0.045 : 0.07) * vol, t0 + start);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + start + dur);
    osc.connect(gain).connect(bus!.sfx);
    osc.start(t0 + start);
    osc.stop(t0 + start + dur);
  }
}
