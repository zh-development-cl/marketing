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
  hook: s(2.3),
  imagine: s(2.5),
  chaos: s(4.1),
  step1: s(4),
  step2: s(4.6),
  step3: s(8.5),
  step4: s(3),
  outro: s(9.7),
};

export const order: SceneKey[] = ['hook', 'imagine', 'chaos', 'step1', 'step2', 'step3', 'step4', 'outro'];

// Escenas con subtítulos. En las demás el texto grande en pantalla ya es la voz.
const CAPTIONED: SceneKey[] = ['step1', 'step2', 'step3', 'step4'];

export type Word = {text: string; start: number; end: number};
type VoScene = {file: string; duration: number; captions: Array<{text: string; start: number; end: number; words: Word[]}>};
const voScenes = vo.scenes as Record<SceneKey, VoScene>;

for (const k of order) {
  const scene = voScenes[k];
  if (!scene || !scene.captions.every((c) => Array.isArray(c.words) && c.words.length > 0)) {
    throw new Error(`vo.json sin tiempos por palabra en "${k}": corre node scripts/voiceover.mjs`);
  }
}

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
// `hold`: la frase siguiente empieza justo cuando termina esta, así que la caja no se apaga entre medio.
export type Caption = {from: number; to: number; hold: boolean; words: CaptionWord[]};

// Subtítulos en frames absolutos del video, con tiempos por palabra.
export const captions: Caption[] = order
  .filter((key) => CAPTIONED.includes(key))
  .flatMap((key) => {
    const base = scenes[key].from + VO_OFFSET;
    const list = voScenes[key].captions;
    return list.map((c, i) => {
      const next = list[i + 1];
      return {
        from: base + s(c.start),
        to: next ? base + s(next.start) : base + s(c.end) + s(0.35),
        hold: Boolean(next),
        words: c.words.map((w) => ({text: w.text, from: base + s(w.start), to: base + s(w.end)})),
      };
    });
  });

// Frame local de la escena en que se pronuncia una palabra (primera coincidencia).
// Sirve para que un elemento aparezca justo cuando la voz lo dice.
const clean = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
export const wordFrame = (key: SceneKey, word: string): number => {
  const target = clean(word);
  for (const c of voScenes[key].captions) {
    for (const w of c.words) {
      if (clean(w.text) === target) return VO_OFFSET + s(w.start);
    }
  }
  throw new Error(`No encuentro la palabra "${word}" en la voz de ${key}`);
};
