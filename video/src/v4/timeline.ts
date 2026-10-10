// Timeline del reel v4: una sola composición continua. Cada escena tiene un inicio absoluto y una duración;
// las transiciones se diseñan dentro de las escenas (la saliente termina después del inicio de la entrante).
// La voz manda: cada escena dura al menos lo que dura su frase más el aire que necesita la coreografía.
import vo from './vo.json';

export const FPS = 30;
export const s = (sec: number) => Math.round(sec * FPS);

export type SceneKey = 'hook' | 'imagine' | 'chaos' | 'step1' | 'patterns' | 'step2' | 'step3' | 'step4' | 'outro';
export const order: SceneKey[] = ['hook', 'imagine', 'chaos', 'step1', 'patterns', 'step2', 'step3', 'step4', 'outro'];

type Word = {text: string; start: number; end: number};
type VoScene = {file: string; duration: number; captions: Array<{text: string; start: number; end: number; words: Word[]}>};
const voScenes = vo.scenes as Record<Exclude<SceneKey, 'patterns'>, VoScene>;

// Aire antes de la voz (la escena ya está en pantalla) y después de la última palabra.
const lead: Record<SceneKey, number> = {hook: 8, imagine: 6, chaos: 4, step1: 10, patterns: 0, step2: 8, step3: 8, step4: 10, outro: 12};
const tail: Record<SceneKey, number> = {hook: 10, imagine: 16, chaos: 10, step1: 14, patterns: 0, step2: 18, step3: 16, step4: 18, outro: 70};
// Duración mínima de diseño (coreografía), en frames.
const designed: Record<SceneKey, number> = {hook: s(2.8), imagine: s(2.4), chaos: s(5.2), step1: s(5.4), patterns: s(3.4), step2: s(6.4), step3: s(7.6), step4: s(3.2), outro: s(10)};

let cursor = 0;
export const scenes = Object.fromEntries(
  order.map((key) => {
    const voice = key === 'patterns' ? null : voScenes[key];
    const withVoice = voice ? lead[key] + s(voice.duration) + tail[key] : 0;
    const dur = Math.max(designed[key], withVoice);
    const entry = {from: cursor, dur, to: cursor + dur, voAt: cursor + lead[key], audio: voice?.file ?? null, voice};
    cursor += dur;
    return [key, entry];
  }),
) as Record<SceneKey, {from: number; dur: number; to: number; voAt: number; audio: string | null; voice: VoScene | null}>;

export const TOTAL = cursor;

const clean = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// Frame ABSOLUTO en que la voz dice una palabra (primera coincidencia) de una escena.
export const beat = (key: Exclude<SceneKey, 'patterns'>, word: string, nth = 0): number => {
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
export const beatEnd = (key: Exclude<SceneKey, 'patterns'>, word: string): number => {
  const target = clean(word);
  for (const c of voScenes[key].captions) for (const w of c.words) if (clean(w.text) === target) return scenes[key].voAt + s(w.end);
  throw new Error(`No encuentro la palabra "${word}" en la voz de ${key}`);
};

// Palabras de una escena con frames absolutos (para subtítulos o tipografía cinética sincronizada).
export const wordsOf = (key: Exclude<SceneKey, 'patterns'>) =>
  voScenes[key].captions.flatMap((c) => c.words.map((w) => ({text: w.text, from: scenes[key].voAt + s(w.start), to: scenes[key].voAt + s(w.end)})));
