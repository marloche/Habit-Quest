// Chiptune effects synthesized live: [frequency Hz, start s, duration s].
type Note = [number, number, number];
const SONGS: Record<string, { wave: OscillatorType; notes: Note[] }> = {
  check: { wave: 'square', notes: [[988, 0, 0.07], [1319, 0.07, 0.22]] },
  tiny: { wave: 'square', notes: [[784, 0, 0.1]] },
  undo: { wave: 'square', notes: [[440, 0, 0.06], [330, 0.06, 0.1]] },
  combo: { wave: 'square', notes: [[659, 0, 0.06], [784, 0.06, 0.06], [1047, 0.12, 0.06], [1319, 0.18, 0.2]] },
  milestone: { wave: 'square', notes: [[523, 0, 0.07], [659, 0.07, 0.07], [784, 0.14, 0.07], [1047, 0.21, 0.07], [784, 0.28, 0.07], [1047, 0.35, 0.07], [1319, 0.42, 0.07], [1568, 0.49, 0.3]] },
  levelup: { wave: 'square', notes: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.12], [784, 0.45, 0.08], [1047, 0.53, 0.5]] },
  perfect: { wave: 'triangle', notes: [[784, 0, 0.1], [988, 0.1, 0.1], [1175, 0.2, 0.1], [1568, 0.3, 0.45]] },
};

let ctx: AudioContext | undefined;
export const audio = { muted: false };

// iOS only allows audio after a user gesture, so this runs inside tap handlers.
export function unlock() {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
}

export function sfx(name: keyof typeof SONGS) {
  if (audio.muted) return;
  unlock();
  const c = ctx!;
  const { wave, notes } = SONGS[name];
  const t0 = c.currentTime + 0.01;
  for (const [freq, start, dur] of notes) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.07, t0 + start);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + start + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0 + start);
    osc.stop(t0 + start + dur);
  }
}
