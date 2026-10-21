import React from 'react';
import {beat, scenes} from '../timeline';
import {bx, center, framesOf} from '../shots';
import {focus, REST} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {SceneDef, seqDir, shot} from './types';

// Escena 3 · agenda con IA. «Cuéntale a TibIA qué te interesa» → se marcan Rodilla y Cadera; «y te arma una agenda»
// → «Armar mi agenda», TibIA trabaja (secuencia real) y aparecen las charlas elegidas; «sin charlas que se crucen» →
// zoom al resultado.
const sc = scenes.itinerario;
const tRod = beat('itinerario', 'qué') - 4;
const tCad = beat('itinerario', 'interesa') + 2;
const tArmar = beat('itinerario', 'arma') - 8;
const tSeq = tArmar + 4;
const N = framesOf('seq-itinerario', 90);
const tResult = Math.min(tSeq + N, beat('itinerario', 'sin') - 6);

const rod = bx('intereses-0', 'chipRodilla', {x: 20, y: 300, w: 110, h: 44});
const cad = bx('intereses-1', 'chipCadera', {x: 140, y: 300, w: 110, h: 44});
const armar = bx('intereses-2', 'botonArmar', {x: 16, y: 740, w: 358, h: 54});
const lista = bx('itinerario', 'titulo', {x: 16, y: 110, w: 358, h: 120});

const Overlay: React.FC = () => <Headline n="2" label="Tu agenda con IA" lines={['TibIA arma', 'tu *agenda*']} at={sc.from - 2} out={sc.to - 8} />;

export const itinerario: SceneDef = {
  screens: [
    {at: sc.from, src: shot('intereses-0'), enter: 'push', ink: 'dark'},
    {at: tRod + 3, src: shot('intereses-1'), ink: 'dark'},
    {at: tCad + 3, src: shot('intereses-2'), ink: 'dark'},
    {at: tSeq, seq: {dir: seqDir('seq-itinerario'), frames: N}, enter: 'fade', enterDur: 4, ink: 'dark'},
    {at: tResult, src: shot('itinerario'), enter: 'fade', enterDur: 6, ink: 'dark'},
  ],
  taps: [
    {at: tRod, ...center(rod)},
    {at: tCad, ...center(cad)},
    {at: tArmar, ...center(armar)},
  ],
  glows: [{at: tResult + 6, until: sc.to - 6, box: lista, radius: 16}],
  cam: [
    {at: tResult - 4, dur: 18, pose: focus(lista, 1.25, {x: 540, y: 1000})},
    {at: sc.to - 14, dur: 16, pose: REST},
  ],
  Overlay,
  sfx: [
    {name: 'pop', at: tRod, gain: 0.35},
    {name: 'pop', at: tCad, gain: 0.35},
    {name: 'click', at: tArmar, gain: 0.5},
    {name: 'rise', at: tSeq + 4, gain: 0.3},
    {name: 'chime', at: tResult, gain: 0.45},
  ],
};
