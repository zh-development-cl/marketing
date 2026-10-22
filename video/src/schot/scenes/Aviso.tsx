import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {beat, scenes} from '../timeline';
import {REST} from '../ui/geometry';
import {Headline, GRAD_TEXT} from '../ui/Text';
import {SceneDef, shot} from './types';
import {dipIn, PUSH_BODY, PUSH_BOX, PUSH_TITLE, PushCard} from './Intro';

// Escena 6 · aviso. «Mi agenda» en el teléfono. «Además, te avisa» → la notificación real del backend («10:30 ·
// Lesiones meniscales / En 10 min en Pacífico (Piso 3) · Enjoy») sale de la pantalla en grande y queda sola un
// momento; «diez minutos» → debajo aparece el dial «10 min» con su anillo que se llena. Las dos se quedan hasta el
// final de la frase.
const sc = scenes.aviso;
// La notificación entra limpia y queda sola un momento; «10 min» aparece cuando la voz dice «minutos». Las dos se
// quedan hasta el final de la frase.
const tPush = beat('aviso', 'avisa') - 10;
const tDial = beat('aviso', 'minutos');
const tFill = tDial + 4;
const tPushOut = sc.to - 28;
const tDialOut = sc.to - 24;
const PUSH_TO = {x: 540, y: 1000, k: 2.55};

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SANS = '"Barlow", system-ui, sans-serif';
// Dial «10 min»: salta con resorte con el 10 ya escrito (sin cuenta: un número que cambia no se alcanza a leer) y el
// anillo se llena con el degradé de marca.
const fillAt = (f: number) => interpolate(f, [tFill, tFill + 24], [0, 1], {...clampOpt, easing: Easing.inOut(Easing.cubic)});
const DIAL = {x: 540, y: 1420, d: 330};
const Dial: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < tDial - 1 || f > tDialOut + 14) return null;
  const p = spring({frame: f - tDial, fps, config: {damping: 14, stiffness: 120, mass: 0.9}});
  const q = interpolate(f, [tDialOut, tDialOut + 13], [0, 1], {...clampOpt, easing: Easing.in(Easing.back(1.3))});
  const v = fillAt(f) * 10;
  const R = DIAL.d / 2 - 16;
  const C = 2 * Math.PI * R;
  return (
    <div style={{position: 'absolute', left: DIAL.x - DIAL.d / 2, top: DIAL.y - DIAL.d / 2, width: DIAL.d, height: DIAL.d, zIndex: 47, transform: `scale(${((0.3 + 0.7 * p) * (1 - 0.9 * q)).toFixed(4)}) rotate(${((1 - p) * -20).toFixed(2)}deg)`, opacity: Math.min(1, p * 2.5) * (1 - q)}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: '#fff', boxShadow: '0 30px 70px rgba(14,0,30,.5), 0 0 0 8px rgba(195,174,242,.3), 0 0 80px rgba(162,0,255,.45)'}} />
      <svg width={DIAL.d} height={DIAL.d} style={{position: 'absolute', inset: 0, transform: 'rotate(-90deg)'}}>
        <defs>
          <linearGradient id="dialg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8A00E6" />
            <stop offset="1" stopColor="#E6007E" />
          </linearGradient>
        </defs>
        <circle cx={DIAL.d / 2} cy={DIAL.d / 2} r={R} fill="none" stroke="#EFE7FA" strokeWidth={18} />
        <circle cx={DIAL.d / 2} cy={DIAL.d / 2} r={R} fill="none" stroke="url(#dialg)" strokeWidth={18} strokeLinecap="round" strokeDasharray={`${(C * v) / 10} ${C}`} />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 128, lineHeight: 1.05, color: '#2B0054'}}>10</span>
        <div style={{marginTop: -6, fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: '0.04em', backgroundImage: GRAD_TEXT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>min</div>
      </div>
    </div>
  );
};

const Overlay: React.FC = () => (
  <>
    <Headline n="5" label="Avisos" lines={['Te avisa *10 min*', 'antes']} at={sc.from - 2} out={sc.to - 21} />
    <Dial />
  </>
);


const RECEDE = {...REST, s: 0.88, y: REST.y + 60, rx: 14};

export const aviso: SceneDef = {
  screens: [{at: sc.from - 2, src: shot('agenda'), enter: 'fade', enterDur: 14, ink: 'dark'}],
  lifts: [
    {
      at: tPush,
      out: tPushOut,
      box: PUSH_BOX,
      render: (_f, k) => <PushCard k={k} title={PUSH_TITLE} body={PUSH_BODY} />,
      to: {...PUSH_TO, r: -2, rx: -6},
      exit: 'up',
      radius: 22,
      ring: true,
      scrim: 0.4,
      dim: false,
      sound: 'chime',
      gain: 0.3,
      shine: false,
    },
  ],
  cam: [
    ...dipIn(sc.from),
    {at: tPush, dur: 16, pose: RECEDE},
    {at: tPushOut + 4, dur: 18, pose: REST},
  ],
  Overlay,
  sfx: [
    {name: 'pop-hi', at: tDial + 1, gain: 0.26},
  ],
};
