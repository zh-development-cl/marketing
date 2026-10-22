import React from 'react';
import {beat, scenes} from '../timeline';
import {bx, center, framesOf} from '../shots';
import {REST} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {Mascot} from '../ui/Mascot';
import {SceneDef, seqDir, shot} from './types';
import {dipOut} from './Intro';

// Escena 7 · TibIA. «¿Una duda?» → insignia y se toca el botón flotante: el chat sube desde abajo. «Pregúntale a
// TibIA» → la mascota salta junto al titular; la pregunta «¿Cuándo es la fiesta de clausura?» sale de la pantalla en
// grande, se lee y se envía tocándola (se va volando); «la asistente con inteligencia artificial» → insignia; TibIA
// responde y la respuesta con la tarjeta del lugar sale de la pantalla, sola, con tiempo para leerla.
const sc = scenes.tibia;
export const tMascot = beat('tibia', 'Pregúntale') - 8;
export const tMascotOut = beat('tibia', 'congreso') + 14;
const tDuda = beat('tibia', '¿Una') - 2;
const tFab = beat('tibia', 'duda') - 6;
const tChat = tFab + 4;
const tAsk = beat('tibia', 'Pregúntale') - 2;
const tAskLift = tAsk + 2;
const tSend = beat('tibia', 'asistente') + 12; // la pregunta se lee unos dos segundos antes de enviarla
const tSeq = tSend; // la secuencia real arranca con la pregunta recién enviada
const NT = framesOf('seq-tibia', 180);
const RATE = Math.max(1, NT / (sc.to - 10 - tSeq));
const SKIP = 9; // los primeros cuadros de la secuencia traen el dedo en «Enviar», ya tocado en grande
const tIA = beat('tibia', 'inteligencia');
const tKnows = beat('tibia', 'conoce') - 2;
// La respuesta sale de la pantalla apenas la tarjeta del lugar está escrita (cuadro 108 de la secuencia real).
const tAnswer = tSeq + Math.round((108 - SKIP) / RATE) + 6;
const tAnswerOut = sc.to - 20;

const fab = bx('agenda', 'fabTibia', {x: 318, y: 674, w: 56, h: 56});
const campo = bx('chat-escrito', 'campoTexto', {x: 12, y: 672, w: 366, h: 54});
const enviar = bx('chat-escrito', 'botonEnviar', {x: 329, y: 677, w: 44, h: 44});
// La respuesta: el texto («Es mañana, viernes 20, desde las 20:00, en el Valparaíso Sporting…») y la tarjeta del lugar.
const respuesta = {x: 8, y: 240, w: 374, h: 246};

const ASK_TO = {x: 540, y: 1160, k: 2.5};
const SEND_AT = {x: ASK_TO.x + (enviar.x + enviar.w / 2 - (campo.x + campo.w / 2)) * ASK_TO.k, y: ASK_TO.y};


const Overlay: React.FC = () => (
  <>
    <Headline n="6" label="Asistente" lines={['Pregúntale', 'a Tib*IA*']} at={sc.from - 2} out={sc.to - 21} />
    <Mascot at={tMascot} out={tMascotOut} />
  </>
);

const RECEDE = {...REST, s: 0.9, y: REST.y + 50, rx: 12};

export const tibia: SceneDef = {
  screens: [
    {at: tChat, src: shot('chat-vacio'), enter: 'sheet', enterDur: 14, ink: 'dark'},
    {at: tAsk, src: shot('chat-escrito'), enter: 'fade', enterDur: 6, ink: 'dark'},
    {at: tSeq, seq: {dir: seqDir('seq-tibia'), frames: NT, start: SKIP, rate: RATE}, enter: 'fade', enterDur: 6, ink: 'dark'},
  ],
  taps: [{at: tFab, ...center(fab)}],
  // El anillo se apaga rápido: la pregunta se va volando y no debe quedar flotando solo.
  ctaps: [{at: tSend, ...SEND_AT, scale: 0.8, fade: 5}],
  lifts: [
    {at: tAskLift, out: tSend + 3, box: campo, src: shot('chat-escrito'), to: {...ASK_TO, r: -2, rx: 8}, exit: 'up', exitDur: 16, radius: 18, ring: true, scrim: 0.35, shine: false},
    {at: tAnswer, out: tAnswerOut, shine: false, box: respuesta, src: `${seqDir('seq-tibia')}/f${String(NT - 1).padStart(4, '0')}.png`, to: {x: 540, y: 1180, k: 2.42, r: -1.5, rx: 8}, exit: 'pop', radius: 18, ring: true, scrim: 0.45},
  ],
  badges: [
    {at: tDuda, out: beat('tibia', 'Pregúntale') - 4, x: 540, y: 1000, text: '¿Una duda?', icon: 'message', tone: 'white', size: 56, r: -4},
    // Abajo, sobre la parte vacía del chat: arriba taparía la pregunta recién enviada.
    {at: tIA, out: tKnows - 2, x: 540, y: 1580, text: 'Asistente con IA', icon: 'sparkles', tone: 'brand', size: 46, r: -3},
  ],
  bursts: [
    {at: tMascot + 4, x: 892, y: 300, n: 14, r: 240, star: true},
    {at: tIA + 3, x: 540, y: 1580, n: 12, r: 240, star: true},
  ],
  cam: [
    {at: sc.from, dur: 16, pose: REST},
    {at: tAskLift, dur: 16, pose: RECEDE},
    {at: tSend + 6, dur: 18, pose: REST},
    {at: tKnows, dur: 30, pose: {...REST, s: 0.94, ry: -8, rx: 4}},
    {at: tAnswer, dur: 16, pose: RECEDE},
    ...dipOut(sc.to),
  ],
  Overlay,
  sfx: [
    {name: 'click', at: tFab, gain: 0.45},
    {name: 'swish', at: tChat, gain: 0.25},
    {name: 'sparkle', at: tMascot + 3, gain: 0.3},
    {name: 'click', at: tSend, gain: 0.5},
    {name: 'sparkle', at: tIA + 2, gain: 0.3},
    {name: 'swish', at: sc.to - 12, gain: 0.2},
  ],
};
