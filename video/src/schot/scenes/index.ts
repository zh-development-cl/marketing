import type {SceneKey} from '../timeline';
import type {SceneDef} from './types';
import {intro} from './Intro';
import {abrir} from './Abrir';
import {itinerario} from './Itinerario';
import {programa} from './Programa';
import {charla} from './Charla';
import {aviso} from './Aviso';
import {tibia} from './Tibia';
import {ciencia} from './Ciencia';
import {expo} from './Expo';
import {cierre} from './Cierre';

export const SCENES: Record<SceneKey, SceneDef> = {intro, abrir, itinerario, programa, charla, aviso, tibia, ciencia, expo, cierre};
