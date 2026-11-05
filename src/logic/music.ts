import type { Bg } from './types';

// Background music: one chiptune per scene, written as text so it stays small and testable.
// A step is an eighth note. Tokens: a note (C4, F#5, Bb3), '-' holds the note before, '.' is a rest, '|' is a bar line (ignored).
// A section is 4 bars (32 steps); a part shorter than that repeats to fill it. form: the order sections play in, then it loops.
// Drums: k kick, s snare, h hat, '.' rest.
export const STEPS = 32;

type Voice = { wave: OscillatorType; parts: Record<string, string> };
export type Track = { name: string; bpm: number; key: string; form: string; lead: Voice; bass: Voice; drums?: Record<string, string> };
export type Scene = Exclude<Bg, 'auto'>;

const lead = (wave: OscillatorType, parts: Record<string, string>): Voice => ({ wave, parts });
const bass = (parts: Record<string, string>, wave: OscillatorType = 'triangle'): Voice => ({ wave, parts });

export const TRACKS: Record<Scene, Track> = {
  castle: {
    name: 'Banner March', bpm: 104, key: 'C major', form: 'ABAC',
    lead: lead('square', {
      A: 'C5 - E5 - G5 - E5 - | F5 - A5 - G5 - - . | E5 - G5 - C6 - B5 - | A5 - G5 - - - . .',
      B: 'A5 - G5 - F5 - E5 - | D5 - E5 - F5 - G5 - | E5 - D5 - C5 - D5 - | E5 - - - D5 - - .',
      C: 'C5 - E5 - G5 - E5 - | F5 - A5 - G5 - F5 - | E5 - D5 - G4 - B4 - | C5 - - - - - . .',
    }),
    bass: bass({
      A: 'C3 . G2 . C3 . G2 . | F2 . C3 . G2 . D3 . | C3 . G2 . C3 . E3 . | F2 . G2 . C3 . G2 .',
      B: 'F2 . C3 . F2 . C3 . | G2 . D3 . G2 . D3 . | C3 . G2 . A2 . E3 . | F2 . G2 . G2 . B2 .',
      C: 'C3 . G2 . C3 . G2 . | F2 . C3 . F2 . A2 . | G2 . D3 . G2 . B2 . | C3 . G2 . C3 - - .',
    }),
    drums: { A: 'k . h . s . h . | k . h k s . h h' },
  },
  dungeon: {
    name: 'Dripping Halls', bpm: 76, key: 'A minor', form: 'AABB',
    lead: lead('triangle', {
      A: 'A4 - - - . . E4 - | F4 - - - E4 - - - | . . A4 - C5 - B4 - | A4 - - - - - . .',
      B: 'C5 - - - B4 - A4 - | G4 - - - F4 - - - | E4 - F4 - E4 - D4 - | E4 - - - - - . .',
    }),
    bass: bass({ A: 'A2 - - - - - - - | F2 - - - - - - - | D2 - - - - - - - | E2 - - - - - - -' }),
    drums: { A: 'k . . . . . . . | . . . . s . . .' },
  },
  forest: {
    name: 'Village Green', bpm: 120, key: 'G major', form: 'AABA',
    lead: lead('square', {
      A: 'G4 . B4 . D5 - B4 . | C5 . E5 . D5 - . . | B4 . D5 . G5 - F#5 . | E5 . D5 . B4 - . .',
      B: 'E5 . E5 . D5 . C5 . | B4 . B4 . A4 - . . | C5 . C5 . B4 . A4 . | G4 . A4 . B4 - D5 .',
    }),
    bass: bass({
      A: 'G2 . D3 . G2 . D3 . | C3 . G2 . D3 . A2 . | G2 . D3 . E3 . B2 . | C3 . D3 . G2 . D3 .',
      B: 'C3 . G2 . C3 . G2 . | G2 . D3 . A2 . D3 . | A2 . E3 . D3 . A2 . | G2 . D3 . G2 . D3 .',
    }),
    drums: { A: 'k . h . s . h . | k k h . s . h .' },
  },
  hell: {
    name: 'Cinder Gate', bpm: 150, key: 'E phrygian', form: 'AABA',
    lead: lead('square', {
      A: 'E5 - F5 - E5 - D5 - | E5 - - - B4 - - - | C5 - B4 - A4 - G4 - | F4 - - - E4 - - -',
      B: 'G5 - F5 - E5 - F5 - | G5 - - - A5 - G5 - | F5 - E5 - D5 - C5 - | B4 - - - E5 - - -',
    }),
    bass: bass({
      A: 'E2 E2 E3 E2 E2 E2 F2 E2',
      B: 'C2 C2 C3 C2 C2 C2 C3 C2 | D2 D2 D3 D2 E2 E2 E3 E2',
    }, 'square'),
    drums: { A: 'k . s . k k s . | k . s . k k s h' },
  },
  plain: {
    name: 'Quiet Road', bpm: 90, key: 'C major', form: 'AB',
    lead: lead('triangle', {
      A: 'E5 - - - D5 - C5 - | D5 - - - G4 - - - | C5 - D5 - E5 - G5 - | F5 - E5 - D5 - - -',
      B: 'E5 - - - D5 - C5 - | A4 - - - G4 - - - | C5 - E5 - D5 - B4 - | C5 - - - - - - -',
    }),
    bass: bass({
      A: 'C3 - - - A2 - - - | G2 - - - G2 - - - | A2 - - - E2 - - - | F2 - - - G2 - - -',
      B: 'C3 - - - A2 - - - | F2 - - - E2 - - - | F2 - - - G2 - - - | C3 - - - - - - -',
    }),
    drums: { A: 'k . h . s . h .' },
  },
  snow: {
    name: 'Frost Bells', bpm: 84, key: 'D major', form: 'AABA',
    lead: lead('triangle', {
      A: 'A5 - - - F#5 - - - | D6 - - - C#6 - A5 - | B5 - - - A5 - - - | F#5 - - - - - - -',
      B: 'D6 - - - E6 - - - | F#6 - - - E6 - D6 - | B5 - - - A5 - - - | A5 - - - - - . .',
    }),
    bass: bass({ A: 'D3 - - - - - - - | B2 - - - - - - - | G2 - - - - - - - | A2 - - - - - - -' }),
    drums: { A: 'h . . . . . . .' },
  },
  harbor: {
    name: 'Salt and Rope', bpm: 100, key: 'D minor', form: 'AABA',
    lead: lead('square', {
      A: 'D5 - . A4 D5 - E5 - | F5 - E5 - D5 - - . | C5 - . G4 C5 - D5 - | E5 - C5 - D5 - - .',
      B: 'F5 - - - G5 - A5 - | Bb5 - A5 - G5 - F5 - | E5 - - - D5 - E5 - | F5 - - - E5 - - .',
    }),
    bass: bass({
      A: 'D3 . A2 . D3 . A2 . | D3 . A2 . Bb2 . F2 . | C3 . G2 . C3 . G2 . | A2 . E2 . D3 . A2 .',
      B: 'F2 . C3 . F2 . C3 . | Bb2 . F2 . G2 . D3 . | A2 . E3 . A2 . E3 . | D3 . A2 . A2 . C3 .',
    }),
    drums: { A: 'k . . h s . . h' },
  },
  grove: {
    name: 'Firefly Glade', bpm: 88, key: 'F major', form: 'AABA',
    lead: lead('triangle', {
      A: 'C5 - D5 - F5 - - - | E5 - D5 - C5 - - - | A4 - C5 - D5 - C5 - | A4 - G4 - F4 - - -',
      B: 'Bb4 - - - A4 - G4 - | A4 - C5 - F5 - - - | D5 - - - C5 - Bb4 - | A4 - - - G4 - - -',
    }),
    bass: bass({
      A: 'F2 - - - C3 - - - | Bb2 - - - F2 - - - | D3 - - - A2 - - - | Bb2 - - - C3 - - -',
      B: 'G2 - - - D3 - - - | F2 - - - C3 - - - | Bb2 - - - F2 - - - | C3 - - - C3 - - -',
    }),
  },
  desert: {
    name: 'Mirage Caravan', bpm: 92, key: 'A phrygian-dominant', form: 'AABA',
    lead: lead('square', {
      A: 'A4 - Bb4 - C#5 - D5 - | E5 - - - D5 - C#5 - | D5 - C#5 - Bb4 - A4 - | Bb4 - - - A4 - - -',
      B: 'E5 - F5 - E5 - D5 - | C#5 - D5 - E5 - - - | G5 - F5 - E5 - D5 - | C#5 - Bb4 - A4 - - -',
    }),
    bass: bass({ A: 'A2 - - - . . A2 . | A2 - - - . . E2 .', B: 'D2 - - - . . D2 . | A2 - - - . . A2 .' }),
    drums: { A: 'k . . k s . . . | k . k . s . h .' },
  },
  aurora: {
    name: 'Northern Lights', bpm: 72, key: 'F lydian', form: 'AB',
    lead: lead('triangle', {
      A: 'F4 A4 C5 E5 C5 A4 F4 A4 | G4 B4 D5 G5 D5 B4 G4 B4 | E4 A4 C5 E5 C5 A4 E4 A4 | F4 A4 C5 F5 E5 C5 A4 C5',
      B: 'D4 F4 A4 D5 A4 F4 D4 F4 | G4 B4 D5 E5 D5 B4 G4 B4 | A4 C5 E5 A5 E5 C5 A4 C5 | B4 D5 E5 G5 E5 D5 B4 G4',
    }),
    bass: bass({
      A: 'F2 - - - - - - - | G2 - - - - - - - | A2 - - - - - - - | F2 - - - - - - -',
      B: 'D2 - - - - - - - | G2 - - - - - - - | A2 - - - - - - - | G2 - - - - - - -',
    }),
  },
  lair: {
    name: 'Sleeping Hoard', bpm: 66, key: 'C minor', form: 'AABA',
    lead: lead('square', {
      A: 'C4 - - - - - Eb4 - | D4 - - - - - - - | C4 - - - G3 - - - | Ab3 - - - G3 - - -',
      B: 'Eb4 - - - F4 - - - | G4 - - - Ab4 - G4 - | F4 - - - Eb4 - D4 - | C4 - - - - - - -',
    }),
    bass: bass({ A: 'C2 - - - C2 - - - | Ab1 - - - Ab1 - - - | F1 - - - F1 - - - | G1 - - - G1 - - -' }, 'square'),
    drums: { A: 'k . . . . . . . | k . . . s . . .' },
  },
  storm: {
    name: 'Thunderhead', bpm: 160, key: 'B minor', form: 'AABA',
    lead: lead('square', {
      A: 'B4 B4 D5 B4 F#5 - E5 D5 | C#5 C#5 E5 C#5 F#5 - E5 C#5 | B4 B4 D5 B4 G5 - F#5 E5 | F#5 - E5 - D5 - C#5 -',
      B: 'D5 - E5 - F#5 - G5 - | A5 - G5 - F#5 - E5 - | D5 - C#5 - B4 - C#5 - | D5 - - - C#5 - - -',
    }),
    bass: bass({ A: 'B2 B2 B3 B2 B2 B2 B3 B2 | A2 A2 A3 A2 A2 A2 A3 A2 | G2 G2 G3 G2 G2 G2 G3 G2 | F#2 F#2 F#3 F#2 F#2 F#2 F#3 F#2' }),
    drums: { A: 'k h s h k k s h' },
  },
  isles: {
    name: 'Cloud Steps', bpm: 96, key: 'A major', form: 'AABA',
    lead: lead('triangle', {
      A: 'E5 - - - A5 - - - | G#5 - F#5 - E5 - - - | C#5 - - - F#5 - - - | E5 - D5 - C#5 - - -',
      B: 'D5 - - - F#5 - - - | E5 - D5 - C#5 - B4 - | C#5 - - - E5 - - - | B4 - - - - - - -',
    }),
    bass: bass({
      A: 'A2 . E3 . A2 . E3 . | E2 . B2 . E2 . B2 . | F#2 . C#3 . F#2 . C#3 . | D2 . A2 . E2 . B2 .',
      B: 'D2 . A2 . D2 . A2 . | A2 . E3 . A2 . E3 . | F#2 . C#3 . F#2 . C#3 . | E2 . B2 . E2 . B2 .',
    }),
    drums: { A: 'h . . h . . h .' },
  },
};

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// 'F#5' -> MIDI note number, or undefined if it isn't a note.
export function midiOf(tok: string): number | undefined {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(tok);
  if (!m) return undefined;
  return 12 * (Number(m[3]) + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

export const freqOf = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

const MODES: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11], 'phrygian-dominant': [0, 1, 4, 5, 7, 8, 10],
};

// The pitch classes of a key like 'F# minor'.
export function scaleOf(key: string): Set<number> {
  const [root, mode] = key.split(' ');
  const r = midiOf(`${root}4`)! % 12;
  return new Set(MODES[mode].map((i) => (r + i) % 12));
}

export const tokens = (text: string) => text.split(/\s+/).filter((t) => t && t !== '|');

export type Ev = { step: number; midi: number; len: number };
export type Hit = { step: number; kind: 'k' | 's' | 'h' };
export type Compiled = { track: Track; steps: number; stepSec: number; lead: Ev[][]; bass: Ev[][]; drums: Hit['kind'][][] };

// One voice's part for a section, repeated to fill STEPS.
const fill = (text: string) => {
  const t = tokens(text);
  return Array.from({ length: STEPS }, (_, i) => t[i % t.length]);
};

// Notes with their lengths: a note starts, '-' extends it, '.' or the next note ends it.
function notes(steps: string[]): Ev[] {
  const out: Ev[] = [];
  let cur: Ev | undefined;
  steps.forEach((tok, step) => {
    if (tok === '-') { if (cur) cur.len++; return; }
    cur = undefined;
    const midi = midiOf(tok);
    if (midi !== undefined) out.push((cur = { step, midi, len: 1 }));
  });
  return out;
}

// The whole loop, indexed by the step each note starts on, for the scheduler.
export function compile(track: Track): Compiled {
  const steps = track.form.length * STEPS;
  const voice = (v: Voice) => notes([...track.form].flatMap((s) => fill(v.parts[s] ?? v.parts.A)));
  const byStep = (evs: Ev[]) => {
    const at: Ev[][] = Array.from({ length: steps }, () => []);
    for (const e of evs) at[e.step].push(e);
    return at;
  };
  const drums = track.drums ? [...track.form].flatMap((s) => fill(track.drums![s] ?? track.drums!.A)) : [];
  return {
    track, steps, stepSec: 60 / track.bpm / 2,
    lead: byStep(voice(track.lead)), bass: byStep(voice(track.bass)),
    drums: Array.from({ length: steps }, (_, i) => (['k', 's', 'h'].includes(drums[i]) ? [drums[i] as Hit['kind']] : [])),
  };
}

export const loopSeconds = (c: Compiled) => c.steps * c.stepSec;
