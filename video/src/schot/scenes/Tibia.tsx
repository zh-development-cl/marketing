import React from 'react';
import {beat, scenes} from '../timeline';
import {bx, center, framesOf} from '../shots';
import {focus, REST} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {Mascot} from '../ui/Mascot';
import {SceneDef, seqDir, shot} from './types';

// Escena 7 · TibIA. «¿Una duda?» → se toca el botón flotante con la mascota y el chat sube desde abajo;
// «Pregúntale a TibIA» → la mascota aparece junto al titular y saluda; la pregunta «¿Cuándo es la fiesta de
// clausura?» se envía y TibIA responde escribiendo, con la tarjeta del lugar (secuencia real); zoom a la respuesta.
const sc = scenes.tibia;
export const tMascot = beat('tibia', 'Pregúntale') - 8;
export const tMascotOut = beat('tibia', 'congreso') + 14;
const tFab = beat('tibia', 'duda') - 6; // el toque cae con «¿Una duda?»
const tChat = tFab + 4; // el chat se abre desde abajo (la secuencia real del botón se grabó sobre el Programa)
const tAsk = beat('tibia', 'Pregúntale') + 6;
const tSend = beat('tibia', 'asistente') - 2;
const tSeq = tSend - 6; // la secuencia real trae el dedo en Enviar en su cuadro 6
const NT = framesOf('seq-tibia', 180);
const RATE = Math.max(1, NT / (sc.to - 8 - tSeq));

const fab = bx('agenda', 'fabTibia', bx('seq-estrella', 'fabTibia', {x: 318, y: 674, w: 56, h: 56}));
const send = bx('chat-escrito', 'botonEnviar', {x: 330, y: 760, w: 44, h: 44});
const answer = {x: 16, y: 100, w: 358, h: 200}; // la pregunta y las primeras líneas de la respuesta, bien cerca

const Overlay: React.FC = () => (
  <>
    <Headline n="6" label="Asistente" lines={['Pregúntale', 'a Tib*IA*']} at={sc.from - 2} out={sc.to - 8} />
    <Mascot at={tMascot} out={tMascotOut} />
  </>
);

export const tibia: SceneDef = {
  screens: [
    {at: tChat, src: shot('chat-vacio'), enter: 'sheet', enterDur: 16, ink: 'dark'},
    {at: tAsk, src: shot('chat-escrito'), enter: 'fade', enterDur: 6, ink: 'dark'},
    {at: tSeq, seq: {dir: seqDir('seq-tibia'), frames: NT, end: 8, rate: RATE}, enter: 'fade', enterDur: 4, ink: 'dark'},
    {at: tSeq + Math.round(9 / RATE), seq: {dir: seqDir('seq-tibia'), frames: NT, start: 9, rate: RATE}, enter: 'fade', enterDur: 6, ink: 'dark'},
  ],
  taps: [
    {at: tFab, ...center(fab)},
    {at: tSend, ...center(send)},
  ],
  cam: [
    {at: sc.from, dur: 14, pose: REST},
    {at: tSeq + 24, dur: 24, pose: focus(answer, 1.4, {x: 540, y: 1100})},
    {at: sc.to - 14, dur: 16, pose: REST},
  ],
  Overlay,
  sfx: [
    {name: 'click', at: tFab, gain: 0.45},
    {name: 'whoosh-soft', at: tFab + 4, gain: 0.3},
    {name: 'pop', at: tMascot + 2, gain: 0.5},
    {name: 'click', at: tSend, gain: 0.45},
    {name: 'pop', at: tSend + 6, gain: 0.3},
  ],
};
