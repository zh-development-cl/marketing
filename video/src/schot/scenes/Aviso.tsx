import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {beat, scenes} from '../timeline';
import {bx} from '../shots';
import {REST} from '../ui/geometry';
import {Headline, GRAD_TEXT} from '../ui/Text';
import {Rolling} from '../ui/Pop';
import {SceneDef, SfxCue, shot} from './types';
import {PUSH_BODY, PUSH_BOX, PUSH_TITLE, PushCard} from './Intro';

// Escena 6 · aviso. Llega con un latigazo desde abajo a «Mi agenda». «Además, te avisa» → la notificación real del
// backend («10:30 · Lesiones meniscales / En 10 min en Pacífico (Piso 3) · Enjoy») salta de la pantalla en grande con
// un golpe de cámara; «diez minutos» → un dial que cuenta hasta 10; «antes de que empiece» → la notificación se va y
// salta la tarjeta viva «Lo próximo · en 10 min» de la agenda.
const sc = scenes.aviso;
const tPush = beat('aviso', 'avisa') - 10;
const tDial = beat('aviso', 'diez') - 4;
const tCount = beat('aviso', 'diez') - 1;
const tPushOut = beat('aviso', 'antes') - 4;
const tDialOut = tPushOut + 2;
const tCard = beat('aviso', 'empiece') - 8;
const tCardBack = sc.to - 16;

const proximo = bx('agenda', 'tarjetaLoProximo', {x: 16, y: 248, w: 358, h: 168});
const PUSH_TO = {x: 540, y: 1000, k: 2.55};

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SANS = '"Barlow", system-ui, sans-serif';
const countAt = (f: number) => interpolate(f, [tCount, tCount + 14], [0, 10], {...clampOpt, easing: Easing.out(Easing.cubic)});

// Dial «10 min»: salta con resorte, el número rueda de 0 a 10 y el anillo se llena con el degradé de marca.
const DIAL = {x: 540, y: 1420, d: 330};
const Dial: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < tDial - 1 || f > tDialOut + 11) return null;
  const p = spring({frame: f - tDial, fps, config: {damping: 12, stiffness: 170, mass: 0.8}});
  const q = interpolate(f, [tDialOut, tDialOut + 10], [0, 1], {...clampOpt, easing: Easing.in(Easing.back(1.6))});
  const v = countAt(f);
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
        <Rolling value={v} size={128} color="#2B0054" digits={1} />
        <div style={{marginTop: -6, fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: '0.04em', backgroundImage: GRAD_TEXT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>min</div>
      </div>
    </div>
  );
};

const Overlay: React.FC = () => (
  <>
    <Headline n="5" label="Avisos" lines={['Te avisa *10 min*', 'antes']} at={sc.from - 2} out={sc.to - 17} />
    <Dial />
  </>
);

// Un tic por cada número que pasa en el dial.
const ticks: SfxCue[] = [];
for (let f = tCount, last = 0; f <= tCount + 14; f++) {
  const n = Math.floor(countAt(f) + 1e-6);
  if (n > last) {
    ticks.push({name: 'tick', at: f, gain: 0.16 + 0.012 * n});
    last = n;
  }
}

const RECEDE = {...REST, s: 0.88, y: REST.y + 60, rx: 14};

export const aviso: SceneDef = {
  screens: [{at: sc.from, src: shot('agenda'), ink: 'dark'}],
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
      gain: 0.45,
    },
    {at: tCard, out: tCardBack, box: proximo, src: shot('agenda'), to: {x: 540, y: 1150, k: 2.45, r: 1.5, rx: 8}, radius: 22, ring: true, scrim: 0.4},
  ],
  shakes: [{at: tPush + 6, dur: 12, amp: 9}],
  bursts: [{at: tPush + 5, x: PUSH_TO.x, y: PUSH_TO.y, n: 14, r: 520}],
  cam: [
    {at: sc.from, dur: 1, pose: {...REST, y: REST.y + 1750, rx: 24, s: 0.95}},
    {at: sc.from + 1, dur: 15, pose: REST, ease: 'whipOut'},
    {at: tPush, dur: 12, pose: RECEDE},
    {at: tCardBack, dur: 13, pose: REST},
  ],
  Overlay,
  sfx: [
    {name: 'pop-mid', at: tPush + 1, gain: 0.35},
    {name: 'boom', at: tPush + 5, gain: 0.32},
    {name: 'pop-hi', at: tDial + 1, gain: 0.4},
    ...ticks,
  ],
};
