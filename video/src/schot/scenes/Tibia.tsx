import React from 'react';
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {beat, scenes} from '../timeline';
import {bx, center, framesOf} from '../shots';
import {focus, REST} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {SceneDef, seqDir, shot} from './types';

// Escena 7 · TibIA. «¿Una duda?» → se toca el botón flotante con la mascota y el chat sube desde abajo;
// «Pregúntale a TibIA» → la mascota aparece junto al titular y saluda; la pregunta «¿Cuándo es la fiesta de
// clausura?» se envía y TibIA responde escribiendo, con la tarjeta del lugar (secuencia real); zoom a la respuesta.
const sc = scenes.tibia;
export const tMascot = beat('tibia', 'Pregúntale') - 8;
export const tMascotOut = beat('tibia', 'congreso') + 14;
const tFab = sc.from + 14;
const tChat = tFab + 4; // el chat se abre desde abajo (la secuencia real del botón se grabó sobre el Programa)
const tAsk = beat('tibia', 'Pregúntale') + 6;
const tSend = beat('tibia', 'asistente') - 2;
const tSeq = tSend + 2;
const NT = framesOf('seq-tibia', 170);
const RATE = Math.max(1, NT / (sc.to - 8 - tSeq));

const fab = bx('agenda', 'fabTibia', bx('seq-estrella', 'fabTibia', {x: 318, y: 674, w: 56, h: 56}));
const send = bx('chat-escrito', 'botonEnviar', {x: 330, y: 760, w: 44, h: 44});
const answer = bx('seq-tibia', 'respuesta', {x: 16, y: 300, w: 358, h: 360});

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// La mascota TibIA arriba a la derecha, junto al titular: entra con resorte, flota y saluda; sale hacia la derecha.
const Mascot: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - tMascot, fps, config: {damping: 13, stiffness: 120}});
  const out = interpolate(f, [tMascotOut, tMascotOut + 14], [0, 1], {...clampOpt, easing: Easing.in(Easing.cubic)});
  if (p <= 0.001 || out >= 1) return null;
  const float = Math.sin((f - tMascot) / 14) * 6;
  const tilt = Math.sin((f - tMascot) / 9) * 2.5 * Math.min(1, (f - tMascot) / 20);
  return (
    <div style={{position: 'absolute', left: 742, top: 96, width: 300, height: 418, zIndex: 49, opacity: Math.min(1, p * 1.5) * (1 - out), transform: `translate(${((1 - p) * 220 + out * 320).toFixed(1)}px, ${(float + (1 - p) * 40).toFixed(1)}px) rotate(${tilt.toFixed(2)}deg)`, transformOrigin: '50% 90%'}}>
      <div style={{position: 'absolute', inset: -60, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(195,174,242,.45), rgba(162,0,255,.15) 60%, rgba(162,0,255,0))'}} />
      <Img src={staticFile('schot/mascot/tibia-busto-768.png')} style={{position: 'absolute', inset: 0, width: 300, height: 418, filter: 'drop-shadow(0 20px 30px rgba(26,0,51,.5))'}} />
    </div>
  );
};

const Overlay: React.FC = () => (
  <>
    <Headline n="6" label="Asistente" lines={['Pregúntale', 'a Tib*IA*']} at={sc.from - 2} out={sc.to - 8} />
    <Mascot />
  </>
);

export const tibia: SceneDef = {
  screens: [
    {at: tChat, src: shot('chat-vacio'), enter: 'sheet', enterDur: 16, ink: 'dark'},
    {at: tAsk, src: shot('chat-escrito'), enter: 'fade', enterDur: 6, ink: 'dark'},
    {at: tSeq, seq: {dir: seqDir('seq-tibia'), frames: NT, rate: RATE}, ink: 'dark'},
  ],
  taps: [
    {at: tFab, ...center(fab)},
    {at: tSend, ...center(send)},
  ],
  cam: [
    {at: sc.from, dur: 14, pose: REST},
    {at: tSeq + 30, dur: 24, pose: focus(answer, 1.16, {x: 540, y: 1150})},
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
