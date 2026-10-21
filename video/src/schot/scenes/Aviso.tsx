import React from 'react';
import {beat, scenes} from '../timeline';
import {bx, center} from '../shots';
import {focus} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {SceneDef, shot} from './types';

// Escena 6 · aviso. Se toca la pestaña Agenda → Mi agenda con la tarjeta viva «Lo próximo · en 10 min»;
// «te avisa diez minutos antes» → baja la notificación real del backend («10:30 · Lesiones meniscales / En 10 min en
// Pacífico (Piso 3) · Enjoy»), zoom a ella, y luego se destaca la tarjeta de la agenda.
const sc = scenes.aviso;
const tTab = sc.from + 2;
const tAgenda = tTab + 5;
const tPush = beat('aviso', 'avisa') - 8;
const tCard = beat('aviso', 'empiece') - 2;

const tab = bx('seq-ruta', 'tabAgenda', bx('seq-estrella', 'tabAgenda', {x: 80, y: 745, w: 76, h: 65}));
const proximo = bx('agenda', 'tarjetaProximo', {x: 16, y: 170, w: 358, h: 200});
const PUSH_BOX = {x: 9, y: 10, w: 372, h: 86};

const Overlay: React.FC = () => <Headline n="5" label="Avisos" lines={['Te avisa *10 min*', 'antes']} at={sc.from - 2} out={sc.to - 8} />;

export const aviso: SceneDef = {
  screens: [{at: tAgenda, src: shot('agenda'), enter: 'fade', enterDur: 8, ink: 'dark'}],
  taps: [{at: tTab, ...center(tab)}],
  pushes: [{at: tPush, until: tCard + 6, title: '10:30 · Lesiones meniscales', body: 'En 10 min en Pacífico (Piso 3) · Enjoy'}],
  glows: [{at: tCard + 10, until: sc.to + 20, box: proximo, radius: 22}],
  cam: [
    {at: tPush + 4, dur: 18, pose: focus(PUSH_BOX, 1.42, {x: 540, y: 860})},
    {at: tCard + 2, dur: 18, pose: focus(proximo, 1.15, {x: 540, y: 1080})},
  ],
  Overlay,
  sfx: [
    {name: 'click', at: tTab, gain: 0.4},
    {name: 'chime', at: tPush + 6, gain: 0.55},
  ],
};
