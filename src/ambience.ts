import type { Scene } from './logic/music';
import { noise } from './music';

// Quiet scene sounds made from filtered noise and a few synth one-shots: rain, waves, wind, fire, birds, bells.
// startAmbience returns a stop function that fades everything out.

type Ctx = { c: AudioContext; out: GainNode; stops: (() => void)[] };

// A steady noise bed through a filter, optionally swelling (gain) or sweeping (filter) slowly.
function bed(x: Ctx, type: BiquadFilterType, freq: number, vol: number, swell?: { rate: number; depth: number }, sweep?: { rate: number; depth: number }) {
  const { c } = x;
  const src = c.createBufferSource();
  src.buffer = noise(c);
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(x.out);
  src.start();
  const lfos: OscillatorNode[] = [];
  const lfo = (rate: number, depth: number, param: AudioParam) => {
    const o = c.createOscillator();
    o.frequency.value = rate;
    const d = c.createGain();
    d.gain.value = depth;
    o.connect(d).connect(param);
    o.start();
    lfos.push(o);
  };
  if (swell) lfo(swell.rate, swell.depth, g.gain);
  if (sweep) lfo(sweep.rate, sweep.depth, f.frequency);
  x.stops.push(() => [src, ...lfos].forEach((n) => n.stop()));
}

// Calls play() at random times between min and max seconds apart, until stopped.
function every(x: Ctx, min: number, max: number, play: (t: number) => void) {
  let timer = 0;
  const go = () => {
    play(x.c.currentTime + 0.05);
    timer = window.setTimeout(go, (min + Math.random() * (max - min)) * 1000);
  };
  timer = window.setTimeout(go, Math.random() * max * 1000);
  x.stops.push(() => clearTimeout(timer));
}

function chirp(x: Ctx, wave: OscillatorType, from: number, to: number, t: number, dur: number, vol: number) {
  const o = x.c.createOscillator();
  const g = x.c.createGain();
  o.type = wave;
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + Math.min(0.02, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
  o.connect(g).connect(x.out);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function burst(x: Ctx, type: BiquadFilterType, freq: number, t: number, dur: number, vol: number) {
  const src = x.c.createBufferSource();
  src.buffer = noise(x.c);
  const f = x.c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = x.c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
  src.connect(f).connect(g).connect(x.out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const PENTA = [1047, 1175, 1319, 1568, 1760, 2093];

const wind = (x: Ctx, vol = 0.03) => bed(x, 'bandpass', 500, vol, { rate: 0.07, depth: vol * 0.6 }, { rate: 0.05, depth: 250 });
const fire = (x: Ctx, vol = 0.012, pops = 0.03) => {
  bed(x, 'lowpass', 700, vol);
  // Sparse, low, soft pops: high fast ones sounded like ticking.
  every(x, 0.4, 1.6, (t) => burst(x, 'bandpass', 1100, t, rand(0.03, 0.07), rand(0.3, 1) * pops * 0.5));
};
const birds = (x: Ctx) => every(x, 2, 7, (t) => {
  for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) chirp(x, 'sine', rand(2200, 3200), rand(3000, 4200), t + i * 0.12, 0.08, 0.012);
});
const rumble = (x: Ctx, vol = 0.05) => bed(x, 'lowpass', 120, vol, { rate: 0.18, depth: vol * 0.7 }); // slow breathing

const SCENES: Record<Scene, (x: Ctx) => void> = {
  castle: (x) => { wind(x, 0.015); fire(x, 0.006, 0.015); },
  dungeon: (x) => { fire(x, 0.008, 0.02); every(x, 1.5, 5, (t) => chirp(x, 'sine', rand(1100, 1500), rand(500, 700), t, 0.12, 0.03)); },
  forest: (x) => { wind(x, 0.008); birds(x); },
  hell: (x) => { fire(x, 0.02, 0.05); rumble(x, 0.04); },
  plain: () => {},
  snow: (x) => wind(x, 0.04),
  harbor: (x) => {
    bed(x, 'lowpass', 450, 0.03, { rate: 0.09, depth: 0.025 });
    every(x, 8, 20, (t) => { chirp(x, 'triangle', 1500, 950, t, 0.25, 0.015); chirp(x, 'triangle', 1400, 900, t + 0.3, 0.3, 0.012); });
  },
  grove: (x) => every(x, 0.8, 1.6, (t) => { for (let i = 0; i < 3; i++) chirp(x, 'sine', 4400, 4300, t + i * 0.06, 0.04, 0.006); }),
  desert: (x) => wind(x, 0.03),
  aurora: (x) => { wind(x, 0.008); every(x, 2, 5, (t) => { const f = PENTA[Math.floor(Math.random() * PENTA.length)]; chirp(x, 'sine', f, f * 0.999, t, 2.5, 0.01); }); },
  lair: (x) => { rumble(x, 0.06); fire(x, 0.008, 0.02); },
  storm: (x) => {
    bed(x, 'bandpass', 1300, 0.05);
    every(x, 15, 40, (t) => burst(x, 'lowpass', 180, t, rand(2.5, 4), 0.25));
  },
  isles: (x) => { wind(x, 0.02); birds(x); },
};

export function startAmbience(c: AudioContext, bus: AudioNode, scene: Scene): () => void {
  const out = c.createGain();
  out.gain.setValueAtTime(0, c.currentTime);
  out.gain.linearRampToValueAtTime(1, c.currentTime + 1.5);
  out.connect(bus);
  const x: Ctx = { c, out, stops: [] };
  SCENES[scene](x);
  return () => {
    out.gain.cancelScheduledValues(c.currentTime);
    out.gain.setValueAtTime(out.gain.value, c.currentTime);
    out.gain.linearRampToValueAtTime(0, c.currentTime + 0.8);
    setTimeout(() => { x.stops.forEach((s) => s()); out.disconnect(); }, 1000);
  };
}
