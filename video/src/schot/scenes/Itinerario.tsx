import React from 'react';
import {beat, beatEnd, scenes} from '../timeline';
import {bx, center, framesOf} from '../shots';
import {focus, REST} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {Mascot} from '../ui/Mascot';
import {SceneDef, seqDir, shot} from './types';

// Escena 3 · agenda con IA. «Cuéntale a TibIA qué te interesa» → se marcan Rodilla y Cadera; «y te arma una agenda»
// → «Armar mi agenda», TibIA trabaja (secuencia real) y aparecen las charlas elegidas; «sin charlas que se crucen» →
// zoom al resultado.
const sc = scenes.itinerario;
const tRod = beat('itinerario', 'qué') - 4;
const tCad = beat('itinerario', 'interesa') + 2;
const tArmar = beat('itinerario', 'arma') - 8;
// La secuencia real: dedo en su cuadro 6, espera «TibIA está armando tu agenda», respuesta en el cuadro 54 y
// tarjetas que entran hasta el 95. Se acelera para que la respuesta llegue justo en «sin charlas que se crucen».
const N = framesOf('seq-itinerario', 96);
const tSeq = tArmar - 4;
const RATE = 54 / (beat('itinerario', 'sin') - 4 - tSeq);
const tShown = tSeq + Math.round(62 / RATE); // ya se leen las tarjetas

const rod = bx('intereses-0', 'chipRodilla', {x: 20, y: 499, w: 252, h: 44});
const cad = bx('intereses-1', 'chipCadera', {x: 20, y: 291, w: 80, h: 44});
const armar = bx('intereses-2', 'botonArmarAgenda', {x: 20, y: 698, w: 350, h: 56});
// TibIA ya no propone «Lesiones meniscales» (la doctora la agrega ella misma en la escena siguiente): se destaca la
// primera charla elegida.
const lista = bx('itinerario', 'tarjeta1', {x: 20, y: 350, w: 350, h: 129});

export const tItinMascot = beat('itinerario', 'TibIA') - 6;
export const tItinMascotOut = sc.to - 14;
const Overlay: React.FC = () => (
  <>
    <Headline n="2" label="Asistente con IA" lines={['Tib*IA* arma', 'tu agenda']} at={sc.from - 2} out={sc.to - 8} />
    <Mascot at={tItinMascot} out={tItinMascotOut} size={260} />
  </>
);

export const itinerario: SceneDef = {
  screens: [
    {at: sc.from, src: shot('intereses-0'), enter: 'push', ink: 'dark'},
    {at: tRod + 2, src: shot('intereses-1'), enter: 'fade', enterDur: 4, ink: 'dark'},
    {at: tCad + 2, src: shot('intereses-2'), enter: 'fade', enterDur: 4, ink: 'dark'},
    // La secuencia real en tres tramos: el toque (0–8), la espera (desde 12, ya visible) y el resultado (54); en la app
    // la espera y el resultado aparecen de golpe, aquí entran con fundido.
    {at: tSeq, seq: {dir: seqDir('seq-itinerario'), frames: N, end: 8, rate: RATE}, enter: 'fade', enterDur: 4, ink: 'dark'},
    {at: tSeq + Math.round(9 / RATE), seq: {dir: seqDir('seq-itinerario'), frames: N, start: 12, end: 53, rate: RATE}, enter: 'fade', enterDur: 8, ink: 'dark'},
    {at: tSeq + Math.round(54 / RATE), src: shot('itinerario'), enter: 'fade', enterDur: 8, ink: 'dark'},
  ],
  taps: [
    {at: tRod, ...center(rod)},
    {at: tCad, ...center(cad)},
    {at: tArmar, ...center(armar)},
  ],
  glows: [{at: tShown + 4, until: sc.to - 8, box: lista, radius: 16}],
  cam: [
    {at: tShown - 2, dur: 18, pose: focus(lista, 1.22, {x: 540, y: 1060})},
    {at: sc.to - 16, dur: 14, pose: REST},
  ],
  Overlay,
  sfx: [
    {name: 'pop', at: tRod, gain: 0.35},
    {name: 'pop', at: tCad, gain: 0.35},
    {name: 'click', at: tArmar, gain: 0.5},
    {name: 'rise', at: tSeq + 4, gain: 0.16},
    {name: 'chime', at: beatEnd('itinerario', 'crucen') + 1, gain: 0.35}, // después de la frase: no tapa «sin»
  ],
};
