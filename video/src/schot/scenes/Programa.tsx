import React from 'react';
import {Easing, Img, interpolate, staticFile} from 'remotion';
import {beat, scenes} from '../timeline';
import {bx} from '../shots';
import {focus, REST} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {SceneDef, shot} from './types';
import {dipIn} from './Intro';

// Escena 4 · programa en vivo. «En el programa ves lo que está pasando ahora» → baja hasta la línea «Ahora 10:20»,
// que salta de la pantalla y vuelve en la pausa de la voz; «por sede y por especialidad» → la fila de filtros salta de la pantalla: un anillo marca las sedes
// (Sheraton, Enjoy) y luego la especialidad (Rodilla), que se toca; la fila vuelve y el programa queda filtrado. Sale
// tocando «Lesiones meniscales» (escena siguiente).
const sc = scenes.programa;
const tScroll = beat('programa', 'programa');
const tAhora = Math.max(beat('programa', 'ves'), tScroll + 28);
const tAhoraBack = beat('programa', 'por') - 18; // vuelve en la pausa de la voz, antes de «por sede»
const tTop = tAhoraBack + 18; // vuelve arriba
const tRow = beat('programa', 'por') + 2; // la fila de filtros salta
const tSedeRing = beat('programa', 'sede') - 1;
const tEspRing = beat('programa', 'especialidad') - 3;
const tRod = beat('programa', 'especialidad') + 6; // toque sobre Rodilla en la fila flotante
const tRowBack = tRod + 12;
const tFiltered = tRowBack + 10; // la fila ya volvió: el programa filtrado

const lineaApp = bx('programa', 'lineaAhora', {x: 16, y: 429, w: 358, h: 24});
const SCROLL = Math.max(0, Math.min(320, lineaApp.y - 300));
// Con margen alrededor: «Ahora 10:20» no queda pegado al borde de la tarjeta flotante.
const linea = {x: 6, y: lineaApp.y - 8, w: 378, h: lineaApp.h + 16};
const up = (b: {x: number; y: number; w: number; h: number}) => ({...b, y: b.y - SCROLL});
// Fila de filtros de programa-enjoy: Rodilla · Sheraton · Enjoy (la fila está corrida; se recorta entre los bordes).
const rodEnjoy = bx('programa-enjoy', 'chipRodilla', {x: 57, y: 303, w: 88, h: 44});
const sedes = {x: 150, y: 303, w: 212, h: 44}; // chips Sheraton y Enjoy
const fila = {x: 50, y: 297, w: 316, h: 56};
const ROW_TO = {x: 540, y: 1000, k: 3.0};
const meniscales = bx('programa-rodilla', 'filaMeniscales', {x: 17, y: 606, w: 356, h: 110});

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
// Anillo que marca chips sobre la fila flotante: primero las sedes, luego Rodilla (se desliza de una a otra).
const RowRing: React.FC<{f: number; k: number}> = ({f, k}) => {
  const a = interpolate(f, [tSedeRing, tSedeRing + 10], [0, 1], {...clampOpt, easing: Easing.out(Easing.cubic)});
  if (a <= 0) return null;
  const m = interpolate(f, [tEspRing, tEspRing + 14], [0, 1], {...clampOpt, easing: Easing.inOut(Easing.cubic)});
  const from = sedes;
  const to = rodEnjoy;
  const x = from.x + (to.x - from.x) * m - fila.x - 4;
  const w = from.w + (to.w - from.w) * m + 8;
  const y = from.y - fila.y - 4;
  const h = from.h + 8;
  const pulse = 1 + 0.03 * Math.sin((f - tSedeRing) / 5);
  return (
    <div style={{position: 'absolute', left: x * k, top: y * k, width: w * k, height: h * k, borderRadius: (h / 2) * k, border: `${(2.2 * k).toFixed(1)}px solid #E6007E`, boxShadow: '0 0 24px rgba(230,0,126,.55)', opacity: a, transform: `scale(${((0.9 + 0.1 * a) * pulse).toFixed(4)})`}} />
  );
};

const Overlay: React.FC = () => <Headline n="3" label="Programa" lines={['Lo que pasa', '*ahora*']} at={sc.from - 2} out={sc.to - 21} />;

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
      enter: 'fade',
      enterDur: 14,
      ink: 'dark',
    },
    {at: tRow - 10, src: shot('programa-enjoy'), enter: 'fade', enterDur: 10, ink: 'dark'},
    {at: tRowBack + 6, src: shot('programa-rodilla'), enter: 'fade', enterDur: 10, ink: 'dark'},
  ],
  ctaps: [{at: tRod, x: ROW_TO.x + (rodEnjoy.x + rodEnjoy.w / 2 - (fila.x + fila.w / 2)) * ROW_TO.k, y: ROW_TO.y, scale: 0.9}],
  lifts: [
    {at: tAhora, out: tAhoraBack, box: linea, view: up(linea), src: shot('programa-full'), to: {x: 540, y: 1000, k: 2.75, r: -2, rx: 8}, radius: 14, ring: true, scrim: 0.4, shine: false},
    {
      at: tRow,
      out: tRowBack,
      box: fila,
      render: (f, k) => (
        <>
          <Img src={staticFile(shot('programa-enjoy'))} style={{position: 'absolute', left: -fila.x * k, top: -fila.y * k, width: 390 * k}} />
          <RowRing f={f} k={k} />
        </>
      ),
      to: {...ROW_TO, r: -1.5, rx: 6},
      radius: 18,
      ring: true,
      scrim: 0.4,
    },
  ],
  bursts: [{at: tRod + 2, x: ROW_TO.x + (rodEnjoy.x + rodEnjoy.w / 2 - (fila.x + fila.w / 2)) * ROW_TO.k, y: ROW_TO.y, n: 12, r: 180}],
  cam: [
    ...dipIn(sc.from),
    // Echado atrás desde «ahora» hasta que vuelve la fila de filtros: sin vaivén entre las dos piezas.
    {at: tAhora, dur: 16, pose: RECEDE},
    {at: tRowBack, dur: 16, pose: REST},
    // El programa filtrado: la cámara se acerca a la charla que se toca en la escena siguiente.
    {at: tFiltered + 4, dur: 22, pose: focus(meniscales, 1.08, {x: 540, y: 1200})},
  ],
  Overlay,
  sfx: [
    {name: 'swish', at: tScroll, gain: 0.2},
    {name: 'tick', at: tSedeRing, gain: 0.22},
    {name: 'swish', at: tEspRing, gain: 0.16},
    {name: 'click', at: tRod, gain: 0.45},
  ],
};
