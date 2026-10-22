// Timeline del video demo de la app del 62º Congreso SCHOT: una composición continua. La voz manda: cada escena
// dura lo que su frase más el aire que necesita la coreografía, y los beats (frame de cada palabra) salen de vo.json
// (tiempos medidos con STT sobre el audio final). Mismo motor que el reel de ZH (src/v4/timeline.ts).
import vo from './vo.json';

export const FPS = 30;
export const s = (sec: number) => Math.round(sec * FPS);

export type SceneKey = 'intro' | 'abrir' | 'itinerario' | 'programa' | 'charla' | 'aviso' | 'tibia' | 'expo' | 'cierre';
export const order: SceneKey[] = ['intro', 'abrir', 'itinerario', 'programa', 'charla', 'aviso', 'tibia', 'expo', 'cierre'];

type Word = {text: string; start: number; end: number};
type Caption = {text: string; start: number; end: number; words: Word[]};
type VoScene = {file: string; duration: number; captions: Caption[]};
const voScenes = vo.scenes as Record<SceneKey, VoScene>;

// Aire antes de la voz (la escena ya está en pantalla) y después de la última palabra, en frames.
// Con aire para procesar: el público son médicos de 50 a 70 años; cada escena se asienta antes de que hable la voz y
// queda un respiro después de la última palabra antes de pasar a la siguiente.
const lead: Record<SceneKey, number> = {intro: 16, abrir: 14, itinerario: 14, programa: 14, charla: 14, aviso: 12, tibia: 14, expo: 14, cierre: 14};
const tail: Record<SceneKey, number> = {intro: 14, abrir: 40, itinerario: 76, programa: 44, charla: 70, aviso: 30, tibia: 70, expo: 24, cierre: 394};
// Duración mínima de diseño (coreografía), en frames.
const designed: Record<SceneKey, number> = {
  intro: s(6.6),
  abrir: s(6.8),
  itinerario: s(5.6),
  programa: s(5.0),
  charla: s(5.6),
  aviso: s(4.0),
  tibia: s(8.0),
  expo: s(6.0),
  cierre: s(9.0),
};

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

const clean = (w: string) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]/gu, '');

const findWord = (key: SceneKey, word: string, nth: number) => {
  const target = clean(word);
  let seen = 0;
  for (const c of voScenes[key].captions) {
    for (const w of c.words) {
      if (clean(w.text) === target) {
        if (seen === nth) return w;
        seen++;
      }
    }
  }
  throw new Error(`No encuentro la palabra "${word}" en la voz de ${key}`);
};

// Frame ABSOLUTO en que la voz empieza / termina de decir una palabra (primera coincidencia; `nth` para repeticiones).
export const beat = (key: SceneKey, word: string, nth = 0): number => scenes[key].voAt + s(findWord(key, word, nth).start);
export const beatEnd = (key: SceneKey, word: string, nth = 0): number => scenes[key].voAt + s(findWord(key, word, nth).end);

// Subtítulos: cada frase con sus palabras en frames absolutos.
export const captionsOf = (key: SceneKey) =>
  voScenes[key].captions.map((c) => ({
    text: c.text,
    from: scenes[key].voAt + s(c.start),
    to: scenes[key].voAt + s(c.end),
    words: c.words.map((w) => ({text: w.text, from: scenes[key].voAt + s(w.start), to: scenes[key].voAt + s(w.end)})),
  }));

// Escena activa en un frame absoluto.
export const sceneAt = (frame: number): SceneKey => order.find((k) => frame >= scenes[k].from && frame < scenes[k].to) ?? order[order.length - 1];
