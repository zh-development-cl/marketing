import React from 'react';
import {beat, scenes} from '../timeline';
import {bx, center, framesOf} from '../shots';
import {REST} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {Mascot} from '../ui/Mascot';
import type {BadgeDef} from '../ui/Pop';
import {SceneDef, seqDir, shot} from './types';

// Escena 7 · TibIA. «¿Una duda?» → insignia y se toca el botón flotante: el chat sube desde abajo. «Pregúntale a
// TibIA» → la mascota salta junto al titular; la pregunta «¿Cuándo es la fiesta de clausura?» sale de la pantalla en
// grande y se envía tocándola (se va volando); «la asistente con inteligencia artificial» → insignia; «que conoce
// todo el congreso» → las secciones de la app saltan alrededor del teléfono mientras TibIA escribe, y la respuesta
// con la tarjeta del lugar sale de la pantalla. Sale con un latigazo hacia la expo.
const sc = scenes.tibia;
export const tMascot = beat('tibia', 'Pregúntale') - 8;
export const tMascotOut = beat('tibia', 'congreso') + 14;
const tDuda = beat('tibia', '¿Una') - 2;
const tFab = beat('tibia', 'duda') - 6;
const tChat = tFab + 4;
const tAsk = beat('tibia', 'Pregúntale') + 6;
const tAskLift = tAsk + 2;
const tSend = beat('tibia', 'asistente') - 8; // se toca «Enviar» sobre la pregunta flotante
const tSeq = tSend; // la secuencia real arranca con la pregunta recién enviada
const NT = framesOf('seq-tibia', 180);
const RATE = Math.max(1, NT / (sc.to - 10 - tSeq));
const SKIP = 9; // los primeros cuadros de la secuencia traen el dedo en «Enviar», ya tocado en grande
const tIA = beat('tibia', 'asistente') + 2;
const tKnows = beat('tibia', 'conoce') - 2;
const tAnswer = Math.max(beat('tibia', 'congreso') + 2, tSeq + Math.round((112 - SKIP) / RATE)); // la tarjeta ya está escrita
export const tWhipOut = sc.to - 9;

const fab = bx('agenda', 'fabTibia', {x: 318, y: 674, w: 56, h: 56});
const campo = bx('chat-escrito', 'campoTexto', {x: 12, y: 672, w: 366, h: 54});
const enviar = bx('chat-escrito', 'botonEnviar', {x: 329, y: 677, w: 44, h: 44});
// La respuesta: el texto («Es mañana, viernes 20, desde las 20:00, en el Valparaíso Sporting…») y la tarjeta del lugar.
const respuesta = {x: 8, y: 240, w: 374, h: 246};

const ASK_TO = {x: 540, y: 1160, k: 2.5};
const SEND_AT = {x: ASK_TO.x + (enviar.x + enviar.w / 2 - (campo.x + campo.w / 2)) * ASK_TO.k, y: ASK_TO.y};

// «Conoce todo el congreso»: las secciones reales de la app, alrededor del teléfono.
const SECTIONS: Array<Pick<BadgeDef, 'text' | 'icon' | 'x' | 'y' | 'r'>> = [
  {text: 'Programa', icon: 'calendarPlus', x: 250, y: 880, r: -5},
  {text: 'Sedes', icon: 'building', x: 850, y: 960, r: 5},
  {text: 'Charlas', icon: 'ticket', x: 230, y: 1250, r: -3},
  {text: 'Expo', icon: 'qr', x: 870, y: 1340, r: 6},
  {text: 'Auspiciadores', icon: 'users', x: 470, y: 1660, r: -2},
];

const Overlay: React.FC = () => (
  <>
    <Headline n="6" label="Asistente" lines={['Pregúntale', 'a Tib*IA*']} at={sc.from - 2} out={sc.to - 17} />
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
    {at: tAskLift, out: tSend + 3, box: campo, src: shot('chat-escrito'), to: {...ASK_TO, r: -2, rx: 8}, exit: 'up', exitDur: 12, radius: 18, ring: true, scrim: 0.35},
    {at: tAnswer, out: tWhipOut - 4, box: respuesta, src: `${seqDir('seq-tibia')}/f${String(NT - 1).padStart(4, '0')}.png`, to: {x: 540, y: 1180, k: 2.42, r: -1.5, rx: 8}, exit: 'pop', radius: 18, ring: true, scrim: 0.45},
  ],
  badges: [
    {at: tDuda, out: tChat + 10, x: 540, y: 1000, text: '¿Una duda?', icon: 'message', tone: 'white', size: 56, r: -4},
    // Abajo, sobre la parte vacía del chat: arriba taparía la pregunta recién enviada.
    {at: tIA, out: tKnows - 2, x: 540, y: 1580, text: 'Asistente con IA', icon: 'sparkles', tone: 'brand', size: 46, r: -3},
    ...SECTIONS.map((s, i) => ({...s, at: tKnows + i * 5, out: tAnswer - 6 + i, tone: 'glass' as const, size: 38, gain: 0.32})),
  ],
  bursts: [
    {at: tMascot + 4, x: 892, y: 300, n: 14, r: 240, star: true},
    {at: tIA + 3, x: 540, y: 1580, n: 12, r: 240, star: true},
  ],
  cam: [
    {at: sc.from, dur: 12, pose: REST},
    {at: tAskLift, dur: 12, pose: RECEDE},
    {at: tSend + 6, dur: 14, pose: REST},
    {at: tKnows, dur: 30, pose: {...REST, s: 0.94, ry: -8, rx: 4}},
    {at: tAnswer, dur: 12, pose: RECEDE},
    {at: tWhipOut, dur: 9, pose: {...REST, x: -760, ry: 28, s: 0.96}, ease: 'whipIn'},
  ],
  Overlay,
  sfx: [
    {name: 'click', at: tFab, gain: 0.45},
    {name: 'swish', at: tChat, gain: 0.25},
    {name: 'sparkle', at: tMascot + 3, gain: 0.3},
    {name: 'click', at: tSend, gain: 0.5},
    {name: 'sparkle', at: tIA + 2, gain: 0.3},
    {name: 'whip', at: tWhipOut, gain: 0.45},
  ],
};
