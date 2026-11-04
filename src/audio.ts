// Chiptune effects synthesized live: [frequency Hz, start s, duration s, slide to Hz].
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
} satisfies Record<string, { wave: OscillatorType; notes: Note[] }>;
export type Sound = keyof typeof SONGS;

let ctx: AudioContext | undefined;
export const audio = { muted: false };

// iOS only allows audio after a user gesture, so this runs inside tap handlers.
export function unlock() {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
}

export const hasSound = (name: string): name is Sound => name in SONGS;

export function sfx(name: Sound) {
  if (audio.muted) return;
  unlock();
  const c = ctx!;
  const { wave, notes } = SONGS[name] as { wave: OscillatorType; notes: Note[] };
  const t0 = c.currentTime + 0.01;
  for (const [freq, start, dur, to] of notes) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, t0 + start);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + start + dur);
    // Sawtooth is the harshest wave, so it plays a little softer.
    gain.gain.setValueAtTime(wave === 'sawtooth' ? 0.045 : 0.07, t0 + start);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + start + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0 + start);
    osc.stop(t0 + start + dur);
  }
}
