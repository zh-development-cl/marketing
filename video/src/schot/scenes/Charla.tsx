import React from 'react';
import {beat, scenes} from '../timeline';
import {bx, center, framesOf} from '../shots';
import {REST} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {SceneDef, seqDir, shot} from './types';

// Escena 5 · charla. Se toca «Lesiones meniscales» en el programa filtrado → su ficha («Empieza en 10 min»).
// «Agregas una charla» → el botón «Agregar a mi agenda» salta de la pantalla; «con un toque» → el dedo lo toca en
// grande, pasa a «En tu agenda» y estalla. «y la app te lleva hasta la puerta de la sala» → «Cómo llegar», y el plano
// del Piso 3 sale de la pantalla inclinado como sobre una mesa, con la ruta real dibujándose; en «sala» cae el pin
// «Pacífico · Piso 3». Sale con un latigazo hacia arriba.
const sc = scenes.charla;
const tRow = sc.from + 2;
const tFicha = tRow + 5;
const tAddLift = beat('charla', 'charla') + 2;
const tToque = beat('charla', 'toque');
const tAddBack = tToque + 10;
const NE = framesOf('seq-estrella', 36);
const tScroll = tAddBack + 12; // la página baja cuando el botón ya volvió a su lugar
const tComo = Math.max(beat('charla', 'lleva') + 2, tScroll + 26);
const tRuta = tComo + 5;
const NR = framesOf('seq-ruta', 48);
const RUTA_PUSH = 10;
const tPlano = Math.max(beat('charla', 'hasta') + 4, tRuta + RUTA_PUSH);
const tPin = beat('charla', 'sala') - 2;
const tPlanoOut = sc.to - 13;
export const tWhipUp = sc.to - 9;

const fila = bx('programa-rodilla', 'filaMeniscales', {x: 17, y: 606, w: 356, h: 110});
const agregar = bx('seq-estrella', 'agregarAgenda', {x: 16, y: 266, w: 358, h: 52});
// «Cómo llegar» en la página (ficha-agendada) y ya desplazada (ficha-donde): el scroll anima la página completa hasta
// esa posición y ahí entra la captura real desplazada.
const comoPage = bx('ficha-agendada', 'botonComoLlegar', {x: 85, y: 770, w: 115, h: 36});
const como = bx('ficha-donde', 'botonComoLlegar', {x: 85, y: 442, w: 115, h: 36});
const SCROLL = Math.max(0, comoPage.y - como.y);
const plano = bx('seq-ruta', 'plano', {x: 16, y: 122, w: 358, h: 356});
const destino = bx('seq-ruta', 'destinoPacifico', {x: 212, y: 220, w: 159, h: 161});

const pad4 = (n: number) => String(n).padStart(4, '0');
const rutaAt = (f: number) => `${seqDir('seq-ruta')}/f${pad4(Math.max(0, Math.min(NR - 1, f - tRuta)))}.png`;

const ADD_TO = {x: 540, y: 1120, k: 2.6};
const PLANO_TO = {x: 540, y: 1200, k: 2.45};
// Dónde cae el destino sobre el plano flotante (sin contar la inclinación, que es leve).
const PIN = {x: PLANO_TO.x + (destino.x + destino.w / 2 - (plano.x + plano.w / 2)) * PLANO_TO.k, y: PLANO_TO.y + (destino.y + destino.h / 2 - (plano.y + plano.h / 2)) * PLANO_TO.k};

const Overlay: React.FC = () => <Headline n="4" label="Charlas" lines={['Un toque, y llegas', 'a la *sala*']} at={sc.from - 2} out={sc.to - 17} />;

const RECEDE = {...REST, s: 0.9, y: REST.y + 50, rx: 12};

export const charla: SceneDef = {
  screens: [
    {at: tFicha, src: shot('ficha'), enter: 'push', ink: 'dark'},
    {at: tToque + 1, src: `${seqDir('seq-estrella')}/f${pad4(NE - 1)}.png`, enter: 'fade', enterDur: 4, ink: 'dark'},
    {
      at: tScroll,
      src: shot('ficha-agendada-full'),
      full: true,
      chrome: shot('ficha-agendada-chrome'),
      scroll: [
        [tScroll + 2, 0],
        [tScroll + 18, SCROLL],
      ],
      enter: 'fade',
      enterDur: 6,
      ink: 'dark',
    },
    {at: tScroll + 18, src: shot('ficha-donde'), enter: 'fade', enterDur: 5, ink: 'dark'},
    {at: tRuta, seq: {dir: seqDir('seq-ruta'), frames: NR}, enter: 'push', enterDur: RUTA_PUSH, ink: 'dark'},
  ],
  taps: [
    {at: tRow, ...center(fila)},
    {at: tComo, ...center(como)},
  ],
  ctaps: [{at: tToque, x: ADD_TO.x - 60, y: ADD_TO.y + 4}],
  lifts: [
    {
      at: tAddLift,
      out: tAddBack,
      box: agregar,
      // Al tocarlo pasa a «En tu agenda» (último cuadro de la secuencia real de la estrella).
      src: (f) => (f < tToque + 1 ? shot('ficha') : `${seqDir('seq-estrella')}/f${pad4(NE - 1)}.png`),
      to: {...ADD_TO, r: -2, rx: 8},
      radius: 14,
      ring: true,
      scrim: 0.4,
    },
    {at: tPlano, out: tPlanoOut, box: plano, src: rutaAt, to: {...PLANO_TO, r: -2, rx: 22}, exit: 'pop', radius: 16, ring: true, scrim: 0.45},
  ],
  badges: [{at: tPin, out: tPlanoOut - 1, x: PIN.x - 30, y: PIN.y - 150, text: 'Pacífico · Piso 3', icon: 'pin', tone: 'brand', size: 40, r: 4}],
  bursts: [
    {at: tToque + 2, x: ADD_TO.x, y: ADD_TO.y, n: 18, r: 330, star: true},
    {at: tPin + 3, x: PIN.x, y: PIN.y, n: 14, r: 200},
  ],
  shakes: [{at: tToque + 1, dur: 10, amp: 7}],
  cam: [
    {at: tFicha, dur: 12, pose: {...REST, s: 1.03}},
    {at: tAddLift, dur: 12, pose: RECEDE},
    {at: tAddBack, dur: 12, pose: REST},
    {at: tPlano, dur: 12, pose: {...RECEDE, s: 0.88}},
    {at: tWhipUp, dur: 9, pose: {...REST, y: REST.y - 1750, rx: -24, s: 0.95}, ease: 'whipIn'},
  ],
  Overlay,
  sfx: [
    {name: 'click', at: tRow, gain: 0.4},
    {name: 'swish', at: tFicha, gain: 0.25},
    {name: 'click', at: tToque, gain: 0.5},
    {name: 'sparkle', at: tToque + 2, gain: 0.35},
    {name: 'click', at: tComo, gain: 0.4},
    {name: 'swish', at: tRuta, gain: 0.25},
    {name: 'rise', at: tPlano + 4, gain: 0.18},
    {name: 'whip', at: tWhipUp, gain: 0.45},
  ],
};
