import React from 'react';
import {beat, scenes} from '../timeline';
import {bx, center, framesOf} from '../shots';
import {focus, REST} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {Mascot} from '../ui/Mascot';
import type {LiftDef} from '../ui/Pop';
import {SceneDef, seqDir, shot} from './types';

// Escena 3 · agenda con IA. Entra empujada desde «Comenzar». «Cuéntale a TibIA» → la mascota salta junto al titular;
// «qué te interesa» → Rodilla y Cadera se marcan y saltan de la pantalla, una a cada lado; «y te arma una agenda» →
// «Armar mi agenda», la cámara se acerca a TibIA trabajando (secuencia real); «sin charlas que se crucen» → las cuatro
// charlas elegidas salen de la pantalla en cascada y la insignia «Sin cruces de horario» las sella. Sale con un volteo
// 3D del teléfono hacia el Programa.
const sc = scenes.itinerario;
const tRod = beat('itinerario', 'qué') - 4;
const tCad = beat('itinerario', 'interesa') + 2;
const tChipsBack = beat('itinerario', 'y') - 1;
const tArmar = Math.max(beat('itinerario', 'arma') - 8, tChipsBack + 14); // los chips ya volvieron
// La secuencia real: dedo en su cuadro 6, espera «TibIA está armando tu agenda», respuesta en el cuadro 54 y tarjetas
// que entran hasta el 95. Se acelera para que la respuesta llegue justo antes de «sin charlas que se crucen».
const N = framesOf('seq-itinerario', 96);
const tSeq = tArmar - 4;
const RATE = 54 / (beat('itinerario', 'sin') - 6 - tSeq);
const tResult = tSeq + Math.round(54 / RATE);
const tCards = beat('itinerario', 'sin') - 1;
const tSeal = beat('itinerario', 'crucen') - 6;
const tOut = sc.to - 30;
export const tFlip = sc.to - 15; // volteo hacia el Programa

const rod = bx('intereses-1', 'chipRodilla', {x: 20, y: 499, w: 274, h: 44});
const cad = bx('intereses-2', 'chipCadera', {x: 20, y: 291, w: 102, h: 44});
const armar = bx('intereses-2', 'botonArmarAgenda', {x: 20, y: 698, w: 350, h: 56});
const espera = bx('seq-itinerario', 'mascotaEspera', {x: 141, y: 240, w: 112, h: 153});

export const tItinMascot = beat('itinerario', 'TibIA') - 6;
export const tItinMascotOut = sc.to - 16;
const Overlay: React.FC = () => (
  <>
    <Headline n="2" label="Asistente con IA" lines={['Tib*IA* arma', 'tu agenda']} at={sc.from - 2} out={sc.to - 21} />
    <Mascot at={tItinMascot} out={tItinMascotOut} size={260} />
  </>
);

// Las cuatro charlas (las dos de abajo están fuera de la pantalla: se recortan de la página completa y salen desde el
// borde inferior del teléfono) en cascada, alternando a izquierda y derecha.
const CARDS = [
  {x: 20, y: 350, w: 350, h: 128.6},
  {x: 20, y: 488.6, w: 350, h: 150.6},
  {x: 20, y: 692.8, w: 350, h: 128.6},
  {x: 20, y: 831.4, w: 350, h: 147.2},
];
const K = 1.78;
const ys = [692, 952, 1222, 1482];
const cards: LiftDef[] = CARDS.map((b, i) => ({
  at: tCards + i * 7,
  out: tOut + i * 2,
  box: b,
  src: i < 2 ? shot('itinerario') : shot('itinerario-full'),
  from: i < 2 ? undefined : {x: 540, y: 1880, k: 1.2, r: 0},
  to: {x: i % 2 ? 604 : 476, y: ys[i], k: K, r: i % 2 ? 2.2 : -2.2, rx: 6, ry: i % 2 ? -8 : 8},
  exit: 'pop',
  radius: 16,
  scrim: 0.45,
  dim: i < 2 ? tOut : false,
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
    {at: tRod + 3, out: tChipsBack, box: rod, src: shot('intereses-1'), to: {x: 420, y: 905, k: 2.5, r: -5, rx: 6, ry: 10}, radius: 22, ring: true, scrim: 0.3},
    {at: tCad + 3, out: tChipsBack + 2, box: cad, src: shot('intereses-2'), to: {x: 800, y: 1090, k: 3.0, r: 6, rx: 6, ry: -10}, radius: 22, ring: true, scrim: 0.3},
    ...cards,
  ],
  badges: [{at: tSeal, out: tOut + 10, x: 540, y: 1760, text: 'Sin cruces de horario', icon: 'check', tone: 'brand', size: 48, r: -3}],
  bursts: [{at: tSeal + 3, x: 540, y: 1760, n: 18, r: 300, star: true}],
  cam: [
    {at: sc.from, dur: 16, pose: REST},
    {at: tRod + 3, dur: 16, pose: {...REST, s: 0.92, y: REST.y + 40, rx: 10}},
    {at: tChipsBack, dur: 16, pose: REST},
    {at: tArmar + 6, dur: 30, pose: {...focus(espera, 1.2, {x: 540, y: 1180}), ry: -6}},
    {at: tCards - 2, dur: 16, pose: {...REST, s: 0.88, y: REST.y + 60, rx: 12}},
    {at: tFlip, dur: 15, pose: {...REST, ry: 90, s: 0.9}, ease: 'in'},
  ],
  Overlay,
  sfx: [
    {name: 'click', at: tArmar, gain: 0.45},
    {name: 'rise', at: tSeq + 6, gain: 0.2},
    {name: 'sparkle', at: tSeal + 2, gain: 0.32},
    {name: 'chime', at: tSeal + 8, gain: 0.3},
    {name: 'whoosh-soft', at: tFlip, gain: 0.36},
  ],
};
