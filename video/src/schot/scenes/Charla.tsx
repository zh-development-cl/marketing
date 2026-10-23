import React from 'react';
import {Img, interpolate, staticFile} from 'remotion';
import {beat, scenes} from '../timeline';
import {bx, center, framesOf} from '../shots';
import {REST} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {SceneDef, seqDir, shot} from './types';
import {dipOut} from './Intro';

// Escena 5 · charla. Se toca «Lesiones meniscales» en el programa filtrado → su ficha («Empieza en 10 min»).
// «Agregas una charla» → el botón «Agregar a mi agenda» salta de la pantalla; «con un toque» → el dedo lo toca en
// grande, pasa a «En tu agenda» y estalla. «y la app te lleva hasta la puerta de la sala» → «Cómo llegar», y el plano
// del Piso 3 sale de la pantalla inclinado como sobre una mesa, con la ruta real dibujándose; en «sala» cae el pin
// «Pacífico · Piso 3».
const sc = scenes.charla;
const tRow = sc.from + 2;
const tFicha = tRow + 5;
const tAddLift = beat('charla', 'charla') + 2;
const tToque = beat('charla', 'toque');
const tAddBack = tToque + 24; // «En tu agenda» se lee un momento antes de volver
const NE = framesOf('seq-estrella', 36);
const tScroll = tAddBack + 20; // la página baja cuando el botón ya volvió a su lugar
const tComo = Math.max(beat('charla', 'lleva') + 2, tScroll + 26);
const tRuta = tComo + 6;
const NR = framesOf('seq-ruta', 48);
const RUTA_PUSH = 16;
const tPlano = Math.max(beat('charla', 'hasta') + 4, tRuta + RUTA_PUSH);
// La ruta se dibuja sobre el plano flotante, ya quieto y en grande (no durante el empuje de la pantalla).
const tRouteStart = tPlano + 10;
const ROUTE_RATE = 2;
const tRouteDone = tRouteStart + Math.ceil((NR - 1) / ROUTE_RATE);
const tPin = Math.max(beat('charla', 'sala') - 8, tRouteDone - 2); // el pin cae cuando la ruta llegó a la sala
const tPlanoOut = sc.to - 20;

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
const rutaAt = (f: number) => `${seqDir('seq-ruta')}/f${pad4(Math.max(0, Math.min(NR - 1, Math.floor((f - tRouteStart) * ROUTE_RATE))))}.png`;

const ADD_TO = {x: 540, y: 1120, k: 2.6};
const PLANO_TO = {x: 540, y: 1200, k: 2.45};
// Dónde cae el destino sobre el plano flotante (sin contar la inclinación, que es leve).
const PIN = {x: PLANO_TO.x + (destino.x + destino.w / 2 - (plano.x + plano.w / 2)) * PLANO_TO.k, y: PLANO_TO.y + (destino.y + destino.h / 2 - (plano.y + plano.h / 2)) * PLANO_TO.k};

const Overlay: React.FC = () => <Headline n="4" label="Charlas" lines={['Un toque, y llegas', 'a la *sala*']} at={sc.from - 2} out={sc.to - 21} />;

const RECEDE = {...REST, s: 0.9, y: REST.y + 50, rx: 12};

export const charla: SceneDef = {
  screens: [
    {at: tFicha, src: shot('ficha'), enter: 'push', ink: 'dark'},
    {at: tToque + 1, src: `${seqDir('seq-estrella')}/f${pad4(NE - 1)}.png`, enter: 'fade', enterDur: 6, ink: 'dark'},
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
    {at: tRuta, render: (f) => <Img src={staticFile(rutaAt(f))} style={{position: 'absolute', left: 0, top: 0, width: 390 * 1.5, height: 844 * 1.5}} />, enter: 'push', enterDur: RUTA_PUSH, ink: 'dark'},
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
      // Al tocarlo pasa a «En tu agenda» (último cuadro de la secuencia real de la estrella), con un fundido corto.
      render: (f, k) => {
        const t = interpolate(f, [tToque, tToque + 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const img = (src: string, o: number) => <Img src={staticFile(src)} style={{position: 'absolute', left: -agregar.x * k, top: -agregar.y * k, width: 390 * k, opacity: o}} />;
        return (
          <>
            {img(shot('ficha'), 1)}
            {t > 0 ? img(`${seqDir('seq-estrella')}/f${pad4(NE - 1)}.png`, t) : null}
          </>
        );
      },
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
    {at: tFicha, dur: 18, pose: {...REST, s: 1.03}},
    {at: tAddLift, dur: 16, pose: RECEDE},
    {at: tAddBack, dur: 16, pose: REST},
    {at: tPlano, dur: 16, pose: {...RECEDE, s: 0.88}},
    ...dipOut(sc.to),
  ],
  Overlay,
  sfx: [
    {name: 'click', at: tRow, gain: 0.4},
    {name: 'swish', at: tFicha, gain: 0.25},
    {name: 'click', at: tToque, gain: 0.5},
    {name: 'sparkle', at: tToque + 8, gain: 0.35}, // al terminar «toque»: encima de la palabra tapaba sus consonantes
    {name: 'click', at: tComo, gain: 0.4},
    {name: 'swish', at: tRuta, gain: 0.25},
    {name: 'rise', at: tRouteStart, gain: 0.16},
    {name: 'swish', at: sc.to - 12, gain: 0.2},
  ],
};
