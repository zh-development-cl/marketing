// Timeline del reel v4: una sola composición continua. Cada escena tiene un inicio absoluto y una duración;
// las transiciones se diseñan dentro de las escenas (la saliente termina después del inicio de la entrante).
// La voz manda: cada escena dura al menos lo que dura su frase más el aire que necesita la coreografía.
import vo from './vo.json';

export const FPS = 30;
export const s = (sec: number) => Math.round(sec * FPS);

export type SceneKey = 'hook' | 'day' | 'pitch' | 'step1' | 'step2' | 'step3' | 'step4' | 'outro';
export const order: SceneKey[] = ['hook', 'day', 'pitch', 'step1', 'step2', 'step3', 'step4', 'outro'];

type Word = {text: string; start: number; end: number};
type VoScene = {file: string; duration: number; captions: Array<{text: string; start: number; end: number; words: Word[]}>};
const voScenes = vo.scenes as Record<SceneKey, VoScene>;

// Aire antes de la voz (la escena ya está en pantalla) y después de la última palabra.
const lead: Record<SceneKey, number> = {hook: 8, day: 6, pitch: 6, step1: 10, step2: 8, step3: 8, step4: 10, outro: 12};
const tail: Record<SceneKey, number> = {hook: 8, day: 10, pitch: 8, step1: 24, step2: 10, step3: 10, step4: 12, outro: 66};
// Duración mínima de diseño (coreografía), en frames.
const designed: Record<SceneKey, number> = {hook: s(3.0), day: s(7.2), pitch: s(3.0), step1: s(6.0), step2: s(6.0), step3: s(7.2), step4: s(3.4), outro: s(9.4)};

let cursor = 0;
export const scenes = Object.fromEntries(
  order.map((key) => {
    const voice = voScenes[key];
    const withVoice = lead[key] + s(voice.duration) + tail[key];
    const dur = Math.max(designed[key], withVoice);
    const entry = {from: cursor, dur, to: cursor + dur, voAt: cursor + lead[key], audio: voice.file, voice};
    cursor += dur;
    return [key, entry];
  }),
) as Record<SceneKey, {from: number; dur: number; to: number; voAt: number; audio: string; voice: VoScene}>;

export const TOTAL = cursor;

const clean = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// Frame ABSOLUTO en que la voz dice una palabra (primera coincidencia; `nth` para repeticiones) de una escena.
export const beat = (key: SceneKey, word: string, nth = 0): number => {
  const target = clean(word);
  let seen = 0;
  for (const c of voScenes[key].captions) {
    for (const w of c.words) {
      if (clean(w.text) === target) {
        if (seen === nth) return scenes[key].voAt + s(w.start);
        seen++;
      }
    }
  }
  throw new Error(`No encuentro la palabra "${word}" en la voz de ${key}`);
};

// Frame absoluto en que termina de decirse una palabra.
export const beatEnd = (key: SceneKey, word: string, nth = 0): number => {
  const target = clean(word);
  let seen = 0;
  for (const c of voScenes[key].captions) {
    for (const w of c.words) {
      if (clean(w.text) === target) {
        if (seen === nth) return scenes[key].voAt + s(w.end);
        seen++;
      }
    }
  }
  throw new Error(`No encuentro la palabra "${word}" en la voz de ${key}`);
};

// Palabras de una escena con frames absolutos (para tipografía cinética sincronizada).
export const wordsOf = (key: SceneKey) =>
  voScenes[key].captions.flatMap((c) => c.words.map((w) => ({text: w.text, from: scenes[key].voAt + s(w.start), to: scenes[key].voAt + s(w.end)})));
