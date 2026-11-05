import { compile, freqOf, TRACKS, type Compiled, type Scene } from './logic/music';

// Plays a scene's tune on a loop. A timer looks a little ahead and books notes on the audio clock, so timing stays
// exact even when the page is busy. Switching scenes crossfades.

let noiseBuf: AudioBuffer | undefined;
export function noise(c: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

const AHEAD = 0.2; // seconds booked ahead
const TICK = 50; // ms between bookings
const FADE = 0.7;
const LEAD_VOL = 0.035;
const BASS_VOL = 0.05;

type Playing = { scene: Scene; song: Compiled; out: GainNode; step: number; next: number; timer: number };
let now: Playing | undefined;
const songs = new Map<Scene, Compiled>();

function tone(c: AudioContext, out: AudioNode, wave: OscillatorType, midi: number, t: number, dur: number, vol: number) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = wave;
  osc.frequency.value = freqOf(midi);
  const v = wave === 'square' ? vol * 0.7 : vol; // square is the loudest-sounding wave
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + 0.01);
  g.gain.linearRampToValueAtTime(v * 0.6, t + Math.min(0.15, dur / 2));
  g.gain.setValueAtTime(v * 0.6, t + dur - 0.03);
  g.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.01);
}

export function drum(c: AudioContext, out: AudioNode, kind: 'k' | 's' | 'h', t: number, vol = 1) {
  const g = c.createGain();
  g.connect(out);
  if (kind === 'k') {
    const osc = c.createOscillator();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.18 * vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.16);
    return;
  }
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = kind === 's' ? 1500 : 7000;
  const len = kind === 's' ? 0.12 : 0.04;
  g.gain.setValueAtTime((kind === 's' ? 0.07 : 0.03) * vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + len);
  src.connect(f).connect(g);
  src.start(t, Math.random() * 0.5);
  src.stop(t + len + 0.01);
}

function book(c: AudioContext, p: Playing) {
  const { song } = p;
  while (p.next < c.currentTime + AHEAD) {
    for (const e of song.lead[p.step]) tone(c, p.out, song.track.lead.wave, e.midi, p.next, e.len * song.stepSec, LEAD_VOL);
    for (const e of song.bass[p.step]) tone(c, p.out, song.track.bass.wave, e.midi, p.next, e.len * song.stepSec, BASS_VOL);
    for (const k of song.drums[p.step]) drum(c, p.out, k, p.next);
    p.next += song.stepSec;
    p.step = (p.step + 1) % song.steps;
  }
}

function fadeOut(c: AudioContext, p: Playing) {
  clearInterval(p.timer);
  p.out.gain.cancelScheduledValues(c.currentTime);
  p.out.gain.setValueAtTime(p.out.gain.value, c.currentTime);
  p.out.gain.linearRampToValueAtTime(0, c.currentTime + FADE);
  setTimeout(() => p.out.disconnect(), FADE * 1000 + 300); // notes already booked play out under the fade
}

// Plays this scene's tune; the same scene keeps playing where it is.
export function startMusic(c: AudioContext, bus: AudioNode, scene: Scene) {
  if (now?.scene === scene) return;
  if (now) fadeOut(c, now);
  if (!songs.has(scene)) songs.set(scene, compile(TRACKS[scene]));
  const out = c.createGain();
  out.gain.setValueAtTime(0, c.currentTime);
  out.gain.linearRampToValueAtTime(1, c.currentTime + FADE);
  out.connect(bus);
  const p: Playing = { scene, song: songs.get(scene)!, out, step: 0, next: c.currentTime + 0.05, timer: 0 };
  p.timer = window.setInterval(() => book(c, p), TICK);
  book(c, p);
  now = p;
}

export function stopMusic(c: AudioContext | undefined) {
  if (now && c) fadeOut(c, now);
  now = undefined;
}

export const musicPlaying = () => now?.scene;
