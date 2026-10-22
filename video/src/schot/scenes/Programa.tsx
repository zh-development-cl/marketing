import React from 'react';
import {beat, scenes} from '../timeline';
import {bx, center} from '../shots';
import {REST} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {SceneDef, shot} from './types';

// Escena 4 · programa en vivo. Entra con el volteo 3D del teléfono. «En el programa ves lo que está pasando ahora» →
// baja hasta la línea «Ahora 10:20», que salta de la pantalla junto con el bloque que viene («10:30 · Empieza en
// 10 min»); «por sede» → los chips Sheraton y Enjoy saltan; «y por especialidad» → se toca Rodilla, el programa queda
// filtrado y el chip marcado salta. Sale tocando «Lesiones meniscales» (escena siguiente).
const sc = scenes.programa;
const tScroll = beat('programa', 'ves') - 4;
const tAhora = Math.max(beat('programa', 'pasando') - 4, tScroll + 22);
const tBloque = beat('programa', 'ahora') - 2;
const tAhoraBack = beat('programa', 'por') - 6;
const tTop = tAhoraBack + 12; // vuelve arriba
const tSede = beat('programa', 'sede') - 4;
const tSedeBack = beat('programa', 'por', 1) - 6;
const tRod = beat('programa', 'especialidad') + 1;
const tRodLift = tRod + 7;

const linea = bx('programa', 'lineaAhora', {x: 16, y: 429, w: 358, h: 24});
const SCROLL = Math.max(0, Math.min(320, linea.y - 300));
// Cabecera del bloque de las 10:30 («10:30 – 12:30 · Empieza en 10 min»), medida en la captura.
const bloque = {x: 16, y: 559, w: 358, h: 32};
const up = (b: {x: number; y: number; w: number; h: number}) => ({...b, y: b.y - SCROLL});
const sedes = {x: 150, y: 303, w: 212, h: 44}; // chips Sheraton y Enjoy en la fila corrida (programa-enjoy)
const rodEnjoy = bx('programa-enjoy', 'chipRodilla', {x: 57, y: 303, w: 88, h: 44});
const rodOn = bx('programa-rodilla', 'chipRodilla', {x: 270, y: 303, w: 88, h: 44});

const Overlay: React.FC = () => <Headline n="3" label="Programa" lines={['Lo que pasa', '*ahora*']} at={sc.from - 2} out={sc.to - 17} />;

const RECEDE = {...REST, s: 0.9, y: REST.y + 50, rx: 12};

export const programa: SceneDef = {
  screens: [
    {
      at: sc.from,
      src: shot('programa-full'),
      full: true,
      chrome: shot('programa-chrome'),
      scroll: [
        [tScroll, 0],
        [tScroll + 22, SCROLL],
        [tAhoraBack + 2, SCROLL],
        [tTop, 0],
      ],
      ink: 'dark',
    },
    {at: tSede - 6, src: shot('programa-enjoy'), enter: 'fade', enterDur: 8, ink: 'dark'},
    {at: tRod + 3, src: shot('programa-rodilla'), enter: 'fade', enterDur: 6, ink: 'dark'},
  ],
  taps: [{at: tRod, ...center(rodEnjoy)}],
  lifts: [
    {at: tAhora, out: tAhoraBack, box: linea, view: up(linea), src: shot('programa-full'), to: {x: 540, y: 960, k: 2.75, r: -2, rx: 8}, radius: 8, ring: true, scrim: 0.4},
    {at: tBloque, out: tAhoraBack + 2, box: bloque, view: up(bloque), src: shot('programa-full'), to: {x: 540, y: 1150, k: 2.75, r: 1.5, rx: 8}, radius: 10, ring: true, scrim: 0.4},
    {at: tSede, out: tSedeBack, box: sedes, src: shot('programa-enjoy'), to: {x: 540, y: 1000, k: 3.6, r: -3, rx: 6}, radius: 22, ring: true, scrim: 0.35},
    {at: tRodLift, out: sc.to - 12, box: rodOn, src: shot('programa-rodilla'), to: {x: 540, y: 1000, k: 4.2, r: 4, rx: 6}, radius: 22, ring: true, scrim: 0.3},
  ],
  bursts: [{at: tRodLift + 4, x: 540, y: 1000, n: 14, r: 280}],
  cam: [
    {at: sc.from, dur: 1, pose: {...REST, ry: -90, s: 0.9}},
    {at: sc.from + 1, dur: 15, pose: REST, ease: 'whipOut'},
    {at: tAhora, dur: 12, pose: RECEDE},
    {at: tAhoraBack, dur: 12, pose: REST},
    {at: tSede, dur: 10, pose: RECEDE},
    {at: tSedeBack, dur: 10, pose: REST},
    {at: tRodLift, dur: 10, pose: RECEDE},
    {at: sc.to - 12, dur: 12, pose: REST},
  ],
  Overlay,
  sfx: [
    {name: 'swish', at: tScroll, gain: 0.2},
    {name: 'click', at: tRod, gain: 0.45},
  ],
};
