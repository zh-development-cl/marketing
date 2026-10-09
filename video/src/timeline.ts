// Timing del reel 01 en frames (30 fps). Las escenas duran lo diseñado o lo que dure su voz en off, lo que sea mayor.
import vo from './vo.json';

export const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

// La voz entra unos frames después del inicio de cada escena, para que primero se vea el fundido.
export const VO_OFFSET = 5;
const TAIL = 0.45; // segundos de aire después de la última palabra

type SceneKey = 'hook' | 'imagine' | 'chaos' | 'step1' | 'step2' | 'step3' | 'step4' | 'outro';

const designed: Record<SceneKey, number> = {
  hook: s(3),
  imagine: s(2.5),
  chaos: s(4.5),
  step1: s(4),
  step2: s(4),
  step3: s(6),
  step4: s(3),
  outro: s(6),
};

const order: SceneKey[] = ['hook', 'imagine', 'chaos', 'step1', 'step2', 'step3', 'step4', 'outro'];

type VoScene = {file: string; duration: number; captions: Array<{text: string; start: number; end: number}>};
const voScenes = vo.scenes as Record<SceneKey, VoScene>;

let cursor = 0;
export const scenes = Object.fromEntries(
  order.map((key) => {
    const withVoice = VO_OFFSET + s(voScenes[key].duration + TAIL);
    const dur = Math.max(designed[key], withVoice);
    const entry = {from: cursor, dur, audio: voScenes[key].file};
    cursor += dur;
    return [key, entry];
  }),
) as Record<SceneKey, {from: number; dur: number; audio: string}>;

export const TOTAL = cursor;

export type Caption = {from: number; to: number; text: string};

export const captions: Caption[] = order.flatMap((key) =>
  voScenes[key].captions.map((c) => ({
    from: scenes[key].from + VO_OFFSET + s(c.start),
    to: scenes[key].from + VO_OFFSET + s(c.end) + s(0.3),
    text: c.text,
  })),
);
