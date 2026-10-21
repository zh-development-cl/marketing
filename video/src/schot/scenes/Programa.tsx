import React from 'react';
import {beat, scenes} from '../timeline';
import {bx, center} from '../shots';
import {focus, REST} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {SceneDef, shot} from './types';

// Escena 4 · programa en vivo. «En el programa ves lo que está pasando ahora» → el Programa del jueves con la línea
// «Ahora 10:20» y los bloques que empiezan; baja un poco y se destaca la línea del ahora; «por sede y por
// especialidad» → vuelve arriba, se destacan las sedes y se toca Rodilla: el programa queda filtrado.
const sc = scenes.programa;
const tScroll = beat('programa', 'ves') - 4;
const tAhora = beat('programa', 'ahora') - 2;
const tBack = beat('programa', 'por') - 8;
const tSede = beat('programa', 'sede') - 2;
const tRod = beat('programa', 'especialidad') + 2;

const linea = bx('programa-full', 'lineaAhora', {x: 16, y: 470, w: 358, h: 30});
const SCROLL = Math.max(0, Math.min(320, linea.y - 300));
const sedes = bx('programa', 'chipsSede', {x: 16, y: 300, w: 358, h: 40});
const rod = bx('programa', 'chipRodilla', {x: 200, y: 300, w: 90, h: 40});

const Overlay: React.FC = () => <Headline n="3" label="Programa" lines={['Lo que pasa', '*ahora*']} at={sc.from - 2} out={sc.to - 8} />;

export const programa: SceneDef = {
  screens: [
    {
      at: sc.from,
      src: shot('programa-full'),
      full: true,
      chrome: shot('programa-chrome'),
      scroll: [
        [tScroll, 0],
        [tScroll + 26, SCROLL],
        [tBack, SCROLL],
        [tBack + 14, 0],
      ],
      enter: 'zoom',
      enterDur: 14,
      ink: 'light',
    },
    {at: tRod + 4, src: shot('programa-rodilla'), enter: 'fade', enterDur: 8, ink: 'light'},
  ],
  taps: [{at: tRod, ...center(rod)}],
  glows: [
    {at: tAhora, until: tBack - 2, box: {...linea, y: linea.y - SCROLL}, radius: 10},
    {at: tSede, until: tRod - 2, box: sedes, radius: 20},
  ],
  cam: [
    {at: tAhora - 6, dur: 16, pose: focus({...linea, y: linea.y - SCROLL}, 1.18, {x: 540, y: 1080})},
    {at: tBack, dur: 14, pose: focus(sedes, 1.22, {x: 540, y: 1000})},
    {at: sc.to - 16, dur: 16, pose: REST},
  ],
  Overlay,
  sfx: [
    {name: 'whoosh-soft', at: tScroll, gain: 0.25},
    {name: 'click', at: tRod, gain: 0.45},
  ],
};
