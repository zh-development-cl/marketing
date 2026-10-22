import React from 'react';
import {beat, scenes} from '../timeline';
import {bx, center, framesOf} from '../shots';
import {REST} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {Mascot} from '../ui/Mascot';
import type {LiftDef} from '../ui/Pop';
import {SceneDef, seqDir, shot} from './types';
import {dipOut} from './Intro';

// Escena 3 · agenda con IA. Entra empujada desde «Comenzar». «Cuéntale a TibIA» → la mascota salta junto al titular;
// «qué te interesa» → Rodilla y Cadera se marcan y saltan de la pantalla, una a cada lado; «y te arma una agenda» →
// «Armar mi agenda» y TibIA trabaja (secuencia real); «sin charlas que se crucen» → los dos días de la agenda (jueves y
// viernes, con su encabezado) salen de la pantalla y la insignia «Sin cruces de horario» los sella.
const sc = scenes.itinerario;
const tRod = beat('itinerario', 'qué') - 4;
const tCad = beat('itinerario', 'interesa') + 2;
const tChipsOut = beat('itinerario', 'y') - 4; // los chips se van (se encogen) antes de «y te arma»
const tArmar = Math.max(beat('itinerario', 'arma') - 8, tChipsOut + 8);
// La secuencia real: dedo en su cuadro 6, espera «TibIA está armando tu agenda», respuesta en el cuadro 54 y tarjetas
// que entran hasta el 95. Se acelera para que la respuesta llegue justo antes de «sin charlas que se crucen».
const N = framesOf('seq-itinerario', 96);
const tSeq = tArmar - 4;
const RATE = 54 / (beat('itinerario', 'sin') - 6 - tSeq);
const tResult = tSeq + Math.round(54 / RATE);
// Las charlas elegidas salen agrupadas por día (jueves y viernes, con su encabezado): así se ve que no se cruzan.
const tDay1 = beat('itinerario', 'sin') + 2;
const tDay2 = beat('itinerario', 'charlas') + 12;
const tSeal = Math.max(beat('itinerario', 'crucen') + 6, tDay2 + 26); // el sello cae cuando los dos días ya llegaron
const tOut = sc.to - 40; // el resultado completo queda quieto más de un segundo

const rod = bx('intereses-1', 'chipRodilla', {x: 20, y: 499, w: 274, h: 44});
const cad = bx('intereses-2', 'chipCadera', {x: 20, y: 291, w: 102, h: 44});
const armar = bx('intereses-2', 'botonArmarAgenda', {x: 20, y: 698, w: 350, h: 56});

export const tItinMascot = beat('itinerario', 'TibIA') - 6;
export const tItinMascotOut = sc.to - 16;
const Overlay: React.FC = () => (
  <>
    <Headline n="2" label="Asistente con IA" lines={['Tib*IA* arma', 'tu agenda']} at={sc.from - 2} out={sc.to - 21} />
    <Mascot at={tItinMascot} out={tItinMascotOut} size={260} />
  </>
);

// Los dos días del itinerario con su encabezado («JUEVES, 19 DE NOVIEMBRE · 2 charlas»): el jueves está en la
// pantalla; el viernes, más abajo en la página, se recorta de la página completa y sale desde el borde del teléfono.
const DAYS = [
  {box: {x: 14, y: 316, w: 362, h: 328}, src: shot('itinerario'), at: tDay1, to: {x: 522, y: 880, k: 1.7, r: -1.5, rx: 5, ry: 6}},
  {box: {x: 14, y: 658, w: 362, h: 324}, src: shot('itinerario-full'), at: tDay2, from: {x: 540, y: 1880, k: 1.2, r: 0}, to: {x: 558, y: 1455, k: 1.7, r: 1.5, rx: 5, ry: -6}},
];
const days: LiftDef[] = DAYS.map((d, i) => ({
  at: d.at,
  out: tOut + i * 3,
  box: d.box,
  src: d.src,
  from: d.from,
  to: d.to,
  exit: 'pop',
  radius: 18,
  scrim: 0.45,
  dim: i === 0 ? tOut : false,
  shine: false,
  z: i,
}));

export const itinerario: SceneDef = {
  screens: [
    {at: sc.from, src: shot('intereses-0'), enter: 'push', ink: 'dark'},
    {at: tRod + 2, src: shot('intereses-1'), enter: 'fade', enterDur: 4, ink: 'dark'},
    {at: tCad + 2, src: shot('intereses-2'), enter: 'fade', enterDur: 4, ink: 'dark'},
    // La secuencia real en tres tramos: el toque (0–8), la espera (desde 12) y el resultado (54); en la app la espera y
    // el resultado aparecen de golpe, aquí entran con fundido.
    {at: tSeq, seq: {dir: seqDir('seq-itinerario'), frames: N, end: 8, rate: RATE}, enter: 'fade', enterDur: 4, ink: 'dark'},
    {at: tSeq + Math.round(9 / RATE), seq: {dir: seqDir('seq-itinerario'), frames: N, start: 12, end: 53, rate: RATE}, enter: 'fade', enterDur: 8, ink: 'dark'},
    {at: tResult, src: shot('itinerario'), enter: 'fade', enterDur: 6, ink: 'dark'},
  ],
  taps: [
    {at: tRod, ...center(rod)},
    {at: tCad, ...center(cad)},
    {at: tArmar, ...center(armar)},
  ],
  lifts: [
    {at: tRod + 3, out: tChipsOut, box: rod, src: shot('intereses-1'), to: {x: 420, y: 905, k: 2.5, r: -5, rx: 6, ry: 10}, exit: 'pop', radius: 22, ring: true, scrim: 0.3, dim: tChipsOut},
    {at: tCad + 3, out: tChipsOut + 2, box: cad, src: shot('intereses-2'), to: {x: 800, y: 1090, k: 3.0, r: 6, rx: 6, ry: -10}, exit: 'pop', radius: 22, ring: true, scrim: 0.3, dim: tChipsOut},
    ...days.map((d) => ({...d, gain: 0.3})),
  ],
  badges: [{at: tSeal, out: tOut + 12, x: 540, y: 1808, text: 'Sin cruces de horario', icon: 'check', tone: 'brand', size: 48, r: -3, gain: 0.3}],
  bursts: [{at: tSeal + 3, x: 540, y: 1808, n: 12, r: 260, star: true}],
  cam: [
    {at: sc.from, dur: 16, pose: REST},
    {at: tRod + 3, dur: 16, pose: {...REST, s: 0.92, y: REST.y + 40, rx: 10}},
    {at: tChipsOut, dur: 18, pose: REST},
    {at: tDay1 - 2, dur: 18, pose: {...REST, s: 0.88, y: REST.y + 60, rx: 12}},
    ...dipOut(sc.to),
  ],
  Overlay,
  sfx: [
    {name: 'click', at: tArmar, gain: 0.45},
    {name: 'rise', at: tSeq + 6, gain: 0.2},
    {name: 'sparkle', at: tSeal + 2, gain: 0.24},
    {name: 'swish', at: sc.to - 12, gain: 0.2},
  ],
};
