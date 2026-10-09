// Timing del reel 01 en frames (30 fps). Las escenas duran lo diseñado o lo que dure su voz en off, lo que sea mayor.
// Las escenas se encadenan con transiciones superpuestas (TRANSITION frames), así que el inicio real
// de cada una es la suma de las anteriores menos las superposiciones.
import vo from './vo.json';

export const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

// Frames que se superponen dos escenas consecutivas durante la transición.
export const TRANSITION = 10;
// La voz entra cuando la escena ya es visible (justo al terminar la transición de entrada).
export const VO_OFFSET = TRANSITION;
const TAIL = 0.45; // segundos de aire después de la última palabra

export type SceneKey = 'hook' | 'imagine' | 'chaos' | 'step1' | 'step2' | 'step3' | 'step4' | 'outro';

const designed: Record<SceneKey, number> = {
  hook: s(2.6),
  imagine: s(2.5),
  chaos: s(4.5),
  step1: s(4),
  step2: s(4),
  step3: s(6),
  step4: s(3),
  outro: s(6),
};

export const order: SceneKey[] = ['hook', 'imagine', 'chaos', 'step1', 'step2', 'step3', 'step4', 'outro'];

export type Word = {text: string; start: number; end: number};
type VoScene = {file: string; duration: number; captions: Array<{text: string; start: number; end: number; words: Word[]}>};
const voScenes = vo.scenes as Record<SceneKey, VoScene>;

let cursor = 0;
export const scenes = Object.fromEntries(
  order.map((key, i) => {
    const withVoice = VO_OFFSET + s(voScenes[key].duration + TAIL);
    const dur = Math.max(designed[key], withVoice);
    const from = cursor - (i > 0 ? TRANSITION : 0);
    cursor = from + dur;
    return [key, {from, dur, audio: voScenes[key].file, voice: voScenes[key]}];
  }),
) as Record<SceneKey, {from: number; dur: number; audio: string; voice: VoScene}>;

export const TOTAL = cursor;

export type CaptionWord = {text: string; from: number; to: number};
export type Caption = {from: number; to: number; words: CaptionWord[]};

// Subtítulos en frames absolutos del video, con tiempos por palabra.
export const captions: Caption[] = order.flatMap((key) => {
  const base = scenes[key].from + VO_OFFSET;
  return voScenes[key].captions.map((c) => ({
    from: base + s(c.start),
    to: base + s(c.end) + s(0.35),
    words: c.words.map((w) => ({text: w.text, from: base + s(w.start), to: base + s(w.end)})),
  }));
});

// Frame absoluto en que se pronuncia una palabra (primera coincidencia) dentro de una escena.
// Útil para que un elemento aparezca justo cuando la voz lo dice.
export const wordFrame = (key: SceneKey, word: string): number => {
  const target = word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  for (const c of voScenes[key].captions) {
    for (const w of c.words) {
      if (w.text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') === target) return VO_OFFSET + s(w.start);
    }
  }
  throw new Error(`No encuentro la palabra "${word}" en la voz de ${key}`);
};
