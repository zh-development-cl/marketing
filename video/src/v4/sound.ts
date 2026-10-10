// Pistas de sonido del reel v4. Los archivos los genera scripts/sfx.mjs en public/sfx y public/music.
// Las escenas declaran sus cues (frame absoluto + nombre); aquí se juntan.
import {sfxCues as hookCues} from './scenes/Hook';
import {sfxCues as chaosCues} from './scenes/ChaosWall';
import {sfxCues as imagineCues} from './scenes/Imagine';
import {sfxCues as patternsCues} from './scenes/Patterns';
import {sfxCues as step2Cues} from './scenes/Step2';
import {sfxCues as step3Cues} from './scenes/Step3';
import {sfxCues as step4Cues} from './scenes/Step4';
import {sfxCues as outroCues} from './scenes/Outro';

export type SfxName = 'whoosh-soft' | 'whoosh-hard' | 'whip' | 'pop' | 'tick' | 'click' | 'paper' | 'stamp' | 'rise' | 'chime' | 'logo';
export type SfxCue = {name: SfxName; at: number; gain?: number};

export const SFX_GAIN = 0.7;
export const MUSIC_GAIN = 0.55;
export const MUSIC_FILE: string | null = 'music/bed.mp3';

export const SFX_CUES: Array<SfxCue & {file: string}> = [
  ...hookCues,
  ...imagineCues,
  ...chaosCues,
  ...patternsCues,
  ...step2Cues,
  ...step3Cues,
  ...step4Cues,
  ...outroCues,
]
  .sort((a, b) => a.at - b.at)
  .map((c) => ({...c, file: `sfx/${c.name}.mp3`}));
