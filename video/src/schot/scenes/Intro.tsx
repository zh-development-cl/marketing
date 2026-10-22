import React from 'react';
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {beat, scenes} from '../timeline';
import {bx, framesOf} from '../shots';
import {REST} from '../ui/geometry';
import {Headline} from '../ui/Text';
import type {LiftDef} from '../ui/Pop';
import {SceneDef, seqDir, shot} from './types';

// Escena 1 · apertura. El cuadro 0 ya es la portada (WhatsApp lo usa de miniatura): sello de SCHOT con su luz y
// «62º Congreso SCHOT». Mientras la voz dice «Esta es la app oficial del Congreso SCHOT 2026», piezas reales de la
// app saltan alrededor del título, una por palabra (el aviso, el QR, una charla del programa, un sello de la expo,
// la respuesta de TibIA, un interés). En «Todo el congreso» el título se va hacia la cámara, las piezas vuelan hacia
// el centro y el teléfono sube inclinado desde abajo con el Programa real: todo eso cabe en el celular.
const sc = scenes.intro;
const tSeal = -30;
const tEyebrow = -20;
const tTitle = -16;
const tTodo = beat('intro', 'Todo');
const tRise = tTodo - 12;
const tTitleOut = tTodo - 14;
const tConverge = tTodo - 14;

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ios = Easing.bezier(0.32, 0.72, 0, 1);
const pr = (f: number, a: number, d: number, e = ios) => interpolate(f, [a, a + d], [0, 1], {...clampOpt, easing: e});
const SANS = '"Barlow", system-ui, sans-serif';

const Under: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seal = spring({frame: f - tSeal, fps, config: {damping: 16, stiffness: 90}});
  // Salida «hacia la cámara»: crece, se desenfoca y se apaga.
  const out = pr(f, tTitleOut, 14, Easing.in(Easing.quad));
  const glow = pr(f, tSeal, 40) * (0.85 + 0.15 * Math.sin(f / 10));
  const fade = (at: number, d = 14) => {
    const p = pr(f, at, d);
    const b = (1 - p) * 12;
    return {opacity: p, transform: `translateY(${((1 - p) * 24).toFixed(1)}px)`, filter: b > 0.3 ? `blur(${b.toFixed(1)}px)` : undefined} as React.CSSProperties;
  };
  if (out >= 1) return null;
  const ob = out * 22;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 1920,
        transform: `scale(${(1 + 0.04 * Math.min(1, Math.max(0, f) / tTitleOut) + 0.7 * out).toFixed(4)})`,
        transformOrigin: '50% 48%',
        opacity: 1 - out,
        filter: ob > 0.3 ? `blur(${ob.toFixed(1)}px)` : undefined,
      }}
    >
      {/* Sello con su luz */}
      <div style={{position: 'absolute', left: 540 - 190, top: 520, width: 380, height: 380, transform: `scale(${0.7 + 0.3 * seal})`, opacity: Math.min(1, seal * 1.4)}}>
        <div style={{position: 'absolute', inset: -160, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(195,174,242,.45), rgba(162,0,255,.18) 55%, rgba(162,0,255,0))', opacity: glow}} />
        <Img src={staticFile('schot/brand/schot-sello-blanco.svg')} style={{position: 'absolute', inset: 0, width: 380, height: 380}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 960, textAlign: 'center', ...fade(tEyebrow)}}>
        <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#C3AEF2'}}>App oficial · Viña del Mar 2026</span>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1016, textAlign: 'center', ...fade(tTitle)}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 118, lineHeight: 1.0, letterSpacing: '-0.015em', color: '#fff'}}>62º Congreso</div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 118, lineHeight: 1.04, letterSpacing: '0.02em', color: '#fff'}}>SCHOT</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1278, textAlign: 'center', ...fade(tTitle + 8)}}>
        <span style={{fontFamily: SANS, fontWeight: 500, fontSize: 42, color: 'rgba(255,255,255,.86)'}}>Ortopedia y Traumatología</span>
      </div>
    </div>
  );
};

// Notificación real del backend dibujada a escala k (px por pt).
export const PushCard: React.FC<{k: number; title: string; body: string}> = ({k, title, body}) => (
  <div style={{position: 'absolute', inset: 0, borderRadius: 22 * k, padding: `${11 * k}px ${13 * k}px`, background: 'rgba(245,242,249,.97)', display: 'flex', gap: 10 * k, alignItems: 'center', fontFamily: SANS, color: '#1C1224'}}>
    <Img src={staticFile('schot/brand/apple-touch-icon.png')} style={{width: 38 * k, height: 38 * k, borderRadius: 9 * k, flex: 'none'}} />
    <div style={{flex: 1, minWidth: 0}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 13 * k, color: '#6B6178', fontWeight: 500}}>
        <span style={{fontWeight: 600, color: '#1C1224'}}>SCHOT</span>
        <span>ahora</span>
      </div>
      <div style={{fontSize: 15 * k, fontWeight: 700, lineHeight: 1.2, marginTop: 1 * k}}>{title}</div>
      <div style={{fontSize: 15 * k, fontWeight: 500, lineHeight: 1.25}}>{body}</div>
    </div>
  </div>
);
export const PUSH_TITLE = '10:30 · Lesiones meniscales';
export const PUSH_BODY = 'En 10 min en Pacífico (Piso 3) · Enjoy';
export const PUSH_BOX = {x: 9, y: 52, w: 372, h: 86};

const pad4 = (n: number) => String(n).padStart(4, '0');
const lastOf = (id: string, fallback: number) => `${seqDir(id)}/f${pad4(framesOf(id, fallback) - 1)}.png`;

// Las seis piezas: cada una nace en su lugar con resorte (una por palabra) y en tConverge vuela al centro.
const piece = (at: number, i: number, box: LiftDef['box'], to: {x: number; y: number; k: number; r: number}, src?: string, render?: LiftDef['render']): LiftDef => ({
  at,
  out: tConverge + 6 + i,
  box,
  src,
  render,
  from: {x: to.x, y: to.y + 40, k: to.k * 0.2, r: to.r - 10},
  to: {...to, rx: 6, ry: (to.x < 540 ? 1 : -1) * 12},
  moves: [{at: tConverge + i, to: {x: 540, y: 1330, k: to.k * 0.35, r: 0}}],
  exit: 'pop',
  exitDur: 8,
  radius: 16,
  stiffness: 170,
  damping: 13,
  dim: false,
  shine: true,
});

const PIECES: LiftDef[] = [
  piece(beat('intro', 'app') - 2, 0, PUSH_BOX, {x: 360, y: 330, k: 1.55, r: -4}, undefined, (_f, k) => <PushCard k={k} title={PUSH_TITLE} body={PUSH_BODY} />),
  piece(beat('intro', 'oficial') - 2, 3, bx('qr', 'tarjetaQR', {x: 63, y: 266, w: 264, h: 264}), {x: 868, y: 318, k: 1.0, r: 6}, shot('qr')),
  // La fila se recorta antes del botón flotante de TibIA, que la tapa a la derecha.
  piece(beat('intro', 'Congreso') - 2, 1, {...bx('programa', 'primeraFila', {x: 17, y: 630, w: 356, h: 110}), w: 296}, {x: 760, y: 1488, k: 1.6, r: 4}, shot('programa')),
  piece(beat('intro', 'SCHOT') - 2, 4, bx('seq-sello', 'sello', {x: 119, y: 211, w: 152, h: 152}), {x: 178, y: 1452, k: 1.25, r: -7}, lastOf('seq-sello', 75)),
  piece(beat('intro', '2026') - 2, 2, bx('seq-tibia', 'tarjetaLugar_final', {x: 16, y: 305, w: 358, h: 178}), {x: 330, y: 1716, k: 1.32, r: -4}, lastOf('seq-tibia', 180)),
  piece(beat('intro', '2026') + 8, 5, bx('intereses-2', 'chipRodilla', {x: 20, y: 499, w: 274, h: 44}), {x: 812, y: 1790, k: 1.3, r: 5}, shot('intereses-2')),
];

const Overlay: React.FC = () => <Headline lines={['Todo el congreso,', 'en tu *celular*']} at={tTodo - 4} out={sc.to - 17} />;

const tWhip = sc.to - 8; // latigazo hacia la escena siguiente
export const intro: SceneDef = {
  screens: [{at: 0, src: shot('programa'), ink: 'dark'}],
  cam: [
    {at: -2, dur: 1, pose: {...REST, y: REST.y + 1500, rx: 38, s: 0.9}},
    {at: tRise, dur: 24, pose: REST, ease: 'whipOut'},
    {at: tRise + 26, dur: 30, pose: {...REST, ry: -7, rx: 3, s: 1.02}},
    {at: tWhip, dur: 8, pose: {...REST, x: -760, ry: 28, s: 0.96}, ease: 'whipIn'},
  ],
  lifts: PIECES.map((d, i) => ({...d, gain: 0.36 + 0.02 * i})),
  bursts: [{at: tRise + 18, x: 540, y: 1100, n: 18, r: 420, star: true}],
  flashes: [{at: tRise + 16, dur: 14, y: 1150, a: 0.4}],
  Under,
  Overlay,
  sfx: [
    {name: 'logo', at: 0, gain: 0.55},
    {name: 'swish', at: tConverge, gain: 0.35},
    {name: 'whoosh-hard', at: tRise + 2, gain: 0.4},
    {name: 'boom', at: tRise + 16, gain: 0.5},
    {name: 'whip', at: tWhip, gain: 0.5},
  ],
};

