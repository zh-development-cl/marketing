import React from 'react';
import {SceneKey} from '../timeline';
import {Hook} from './Hook';
import {Day} from './Day';
import {Pitch} from './Pitch';
import {Step1} from './Step1';
import {Step2} from './Step2';
import {Step3} from './Step3';
import {Step4} from './Step4';
import {Outro} from './Outro';

// Registro de escenas. `preroll`/`postroll` extienden la ventana para que una escena pueda empezar su entrada
// antes de su inicio nominal o terminar su salida después (así las transiciones se solapan por diseño).
export type SceneEntry = {key: SceneKey; Component: React.FC; preroll?: number; postroll?: number};

export const SCENES: SceneEntry[] = [
  {key: 'hook', Component: Hook, postroll: 10},
  {key: 'day', Component: Day, preroll: 10, postroll: 12},
  {key: 'pitch', Component: Pitch, preroll: 12, postroll: 10},
  {key: 'step1', Component: Step1, preroll: 10, postroll: 12},
  {key: 'step2', Component: Step2, preroll: 8, postroll: 8},
  {key: 'step3', Component: Step3, preroll: 8, postroll: 22},
  {key: 'step4', Component: Step4, preroll: 8, postroll: 8},
  {key: 'outro', Component: Outro, preroll: 8},
];
