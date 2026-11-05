import { describe, expect, it } from 'vitest';
import { compile, freqOf, loopSeconds, midiOf, scaleOf, STEPS, tokens, TRACKS } from './music';
import { BGS } from './scene';

describe('note names', () => {
  it('turn into MIDI numbers and pitches', () => {
    expect(midiOf('A4')).toBe(69);
    expect(midiOf('C4')).toBe(60);
    expect(midiOf('F#5')).toBe(78);
    expect(midiOf('Bb3')).toBe(58);
    expect(midiOf('-')).toBeUndefined();
    expect(freqOf(69)).toBe(440);
    expect([...scaleOf('A minor')].sort((a, b) => a - b)).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });
});

describe('scene tunes', () => {
  it('cover every scene', () => {
    for (const b of BGS.filter((x) => x !== 'auto')) expect(TRACKS[b], b).toBeDefined();
  });
  for (const [scene, t] of Object.entries(TRACKS)) {
    it(`${scene}: parts fit their section, notes are real, in key and in range, and the loop is long enough`, () => {
      const scale = scaleOf(t.key);
      const voices = [['lead', t.lead.parts, 48, 96], ['bass', t.bass.parts, 24, 60]] as const;
      for (const [name, parts, lo, hi] of voices) {
        expect(parts.A, `${scene} ${name} needs an A part`).toBeDefined();
        for (const [sec, text] of Object.entries(parts)) {
          const toks = tokens(text);
          expect(STEPS % toks.length, `${scene} ${name} ${sec}: ${toks.length} steps`).toBe(0);
          for (const tok of toks) {
            if (tok === '-' || tok === '.') continue;
            const m = midiOf(tok);
            expect(m, `${scene} ${name} ${sec}: "${tok}"`).toBeDefined();
            expect(scale.has(m! % 12), `${scene} ${name} ${sec}: ${tok} not in ${t.key}`).toBe(true);
            expect(m! >= lo && m! <= hi, `${scene} ${name}: ${tok} out of range`).toBe(true);
          }
        }
      }
      for (const [sec, text] of Object.entries(t.drums ?? {})) {
        const toks = tokens(text);
        expect(STEPS % toks.length, `${scene} drums ${sec}`).toBe(0);
        expect(toks.every((x) => ['k', 's', 'h', '.'].includes(x)), `${scene} drums ${sec}`).toBe(true);
      }
      expect(t.bpm >= 60 && t.bpm <= 180).toBe(true);
      const c = compile(t);
      expect(loopSeconds(c), scene).toBeGreaterThanOrEqual(20);
      expect(c.lead.flat().length).toBeGreaterThan(8);
    });
  }
  it('hold notes across "-" and stop them at rests', () => {
    const c = compile({ ...TRACKS.plain, form: 'A', lead: { wave: 'square', parts: { A: 'C5 - - . D5 . E5 - | C5 . . . . . . .' } } });
    expect(c.lead[0][0].len).toBe(3);
    expect(c.lead[4][0].len).toBe(1);
    expect(c.lead[6][0].len).toBe(2);
    expect(c.lead[16][0].midi).toBe(72); // the 16-step part repeats to fill the section
  });
});
