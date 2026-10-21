import React from 'react';
import {beat, scenes} from '../timeline';
import {bx, center, framesOf} from '../shots';
import {focus, REST} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {SceneDef, seqDir, shot} from './types';

// Escena 5 · charla. Se toca «Lesiones meniscales» en el programa filtrado → su ficha («Empieza en 10 min»);
// «Agregas una charla con un toque» → «Agregar a mi agenda» pasa a «En tu agenda» (secuencia real); «y la app te
// lleva hasta la puerta de la sala» → baja a «Dónde», «Cómo llegar» y el plano del Piso 3 con la ruta que se dibuja
// hasta el Auditorio Pacífico (secuencia real); zoom a la ruta.
const sc = scenes.charla;
const tRow = sc.from + 2;
const tFicha = tRow + 5;
const tAdd = beat('charla', 'toque') - 8;
const NE = framesOf('seq-estrella', 36);
const tScroll = beat('charla', 'app') - 6;
const tComo = beat('charla', 'lleva') + 2;
const tRuta = tComo + 5;
const NR = framesOf('seq-ruta', 48);

const fila = bx('programa-rodilla', 'filaLesiones', {x: 16, y: 520, w: 358, h: 90});
const agregar = bx('seq-estrella', 'agregarAgenda', {x: 16, y: 266, w: 358, h: 52});
const como = bx('ficha-agendada-full', 'comoLlegar', {x: 16, y: 760, w: 358, h: 48});
const SCROLL = Math.max(0, como.y - 560);
const destino = bx('seq-ruta', 'destinoPacifico', {x: 260, y: 300, w: 120, h: 150});

const Overlay: React.FC = () => <Headline n="4" label="Charlas" lines={['Un toque, y llegas', 'a la *sala*']} at={sc.from - 2} out={sc.to - 8} />;

export const charla: SceneDef = {
  screens: [
    {at: tFicha, src: shot('ficha'), enter: 'push', ink: 'dark'},
    // La secuencia arranca con el dedo ya apoyado: el toque real cae en su cuadro 6–8.
    {at: tAdd - 6, seq: {dir: seqDir('seq-estrella'), frames: NE}, ink: 'dark'},
    {
      at: tScroll,
      src: shot('ficha-agendada-full'),
      full: true,
      chrome: shot('ficha-agendada-chrome'),
      scroll: [
        [tScroll, 0],
        [tScroll + 16, SCROLL],
      ],
      enter: 'fade',
      enterDur: 4,
      ink: 'dark',
    },
    {at: tRuta, seq: {dir: seqDir('seq-ruta'), frames: NR}, enter: 'push', ink: 'dark'},
  ],
  taps: [
    {at: tRow, ...center(fila)},
    {at: tAdd, ...center(agregar)},
    {at: tComo, x: center(como).x, y: como.y + como.h / 2 - SCROLL},
  ],
  cam: [
    {at: tFicha + 4, dur: 14, pose: focus(agregar, 1.22, {x: 540, y: 1060})},
    {at: tScroll - 2, dur: 14, pose: REST},
    {at: tRuta + 12, dur: 22, pose: focus(destino, 1.3, {x: 540, y: 1150})},
    {at: sc.to - 10, dur: 16, pose: REST},
  ],
  Overlay,
  sfx: [
    {name: 'click', at: tRow, gain: 0.4},
    {name: 'whoosh-soft', at: tFicha, gain: 0.3},
    {name: 'click', at: tAdd, gain: 0.5},
    {name: 'pop', at: tAdd + 6, gain: 0.5},
    {name: 'click', at: tComo, gain: 0.45},
    {name: 'whoosh-soft', at: tRuta, gain: 0.3},
    {name: 'rise', at: tRuta + 2, gain: 0.22},
  ],
};
