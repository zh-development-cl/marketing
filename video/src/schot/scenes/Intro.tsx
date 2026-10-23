import React from 'react';
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {beat, scenes} from '../timeline';
import {bx, framesOf} from '../shots';
import {REST} from '../ui/geometry';
import {Headline} from '../ui/Text';
import type {LiftDef} from '../ui/Pop';
import {SceneDef, seqDir, shot} from './types';

// Escena 1 · apertura. El cuadro 0 ya es la portada (WhatsApp lo usa de miniatura): sello de SCHOT con su luz,
// «App oficial» en una píldora blanca y «62º Congreso SCHOT». Mientras la voz dice «Esta es la app oficial del Congreso
// SCHOT 2026» solo está el título (Nicolás pidió que nada flote antes del celular). El título se va hacia la cámara y
// el teléfono sube inclinado desde abajo con el Programa real; ya quieto, en «Todo el congreso» saltan a su alrededor
// piezas reales de la app, una por una (el QR, un sello de la expo, una charla del programa, un interés), y en «en tu
// celular» cada una entra a su pantalla: todo eso cabe en el celular.
const sc = scenes.intro;
const tSeal = -30;
const tEyebrow = -20;
const tTitle = -16;
const tTodo = beat('intro', 'Todo');
// Una cosa a la vez: primero se va el título, después sube el teléfono; con el teléfono casi quieto saltan las piezas a
// su alrededor (una cada 6 cuadros) y, después de verse algo más de un segundo, entran a su pantalla una por una.
const tTitleOut = tTodo - 34;
const tRise = tTodo - 24;
const RISE = 40;
const tLand = tRise + RISE;
const tPop = tLand - 6;
const tInto = tLand + 30;
const STEP = 6;

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ios = Easing.bezier(0.32, 0.72, 0, 1);
const pr = (f: number, a: number, d: number, e = ios) => interpolate(f, [a, a + d], [0, 1], {...clampOpt, easing: e});
const SANS = '"Barlow", system-ui, sans-serif';

const Under: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seal = spring({frame: f - tSeal, fps, config: {damping: 16, stiffness: 90}});
  // Salida suave: crece apenas, se desenfoca poco y se apaga.
  const out = pr(f, tTitleOut, 22, Easing.inOut(Easing.quad));
  const glow = pr(f, tSeal, 40) * (0.85 + 0.15 * Math.sin(f / 10));
  const fade = (at: number, d = 14) => {
    const p = pr(f, at, d);
    const b = (1 - p) * 12;
    return {opacity: p, transform: `translateY(${((1 - p) * 24).toFixed(1)}px)`, filter: b > 0.3 ? `blur(${b.toFixed(1)}px)` : undefined} as React.CSSProperties;
  };
  if (out >= 1) return null;
  const ob = out * 8;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 1920,
        transform: `scale(${(1 + 0.04 * Math.min(1, Math.max(0, f) / tTitleOut) + 0.08 * out).toFixed(4)})`,
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
      {/* «App oficial» en una píldora blanca: es lo que dice que esto es una app (se lee en la miniatura de WhatsApp) */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 930, textAlign: 'center', ...fade(tEyebrow)}}>
        <span style={{display: 'inline-block', padding: '12px 30px', borderRadius: 999, background: '#fff', boxShadow: '0 12px 30px rgba(14,0,30,.35)', fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#2B0054'}}>App oficial · Viña del Mar 2026</span>
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

// Las cuatro piezas nacen con resorte alrededor del teléfono (dos a cada lado, bajo el titular) y después vuelan a su
// pantalla, en el mismo orden.
const intoAt = (order: number) => tInto + order * STEP;
const piece = (order: number, box: LiftDef['box'], to: {x: number; y: number; k: number; r: number}, src?: string, render?: LiftDef['render']): LiftDef => {
  const into = intoAt(order);
  return {
    at: tPop + order * STEP,
    out: into + 7,
    box,
    src,
    render,
    from: {x: to.x, y: to.y + 40, k: to.k * 0.2, r: to.r - 10},
    to: {...to, rx: 6, ry: (to.x < 540 ? 1 : -1) * 10},
    moves: [{at: into, to: {x: 540, y: 1180, k: to.k * 0.3, r: 0}}],
    exit: 'pop',
    exitDur: 10,
    radius: 16,
    dim: false,
    shine: false,
    stiffness: 130,
    damping: 16,
  };
};

const PIECES: LiftDef[] = [
  piece(0, bx('qr', 'tarjetaQR', {x: 63, y: 266, w: 264, h: 264}), {x: 880, y: 780, k: 1.0, r: 6}, shot('qr')),
  piece(1, bx('seq-sello', 'sello', {x: 119, y: 211, w: 152, h: 152}), {x: 180, y: 920, k: 1.25, r: -7}, lastOf('seq-sello', 75)),
  // La fila se recorta antes del botón flotante de TibIA, que la tapa a la derecha.
  piece(2, {...bx('programa', 'primeraFila', {x: 17, y: 630, w: 356, h: 110}), w: 296}, {x: 770, y: 1500, k: 1.6, r: 4}, shot('programa')),
  piece(3, bx('intereses-2', 'chipRodilla', {x: 20, y: 499, w: 274, h: 44}), {x: 290, y: 1720, k: 1.3, r: -5}, shot('intereses-2')),
];

const Overlay: React.FC = () => <Headline lines={['Todo el congreso,', 'en tu *celular*']} at={tTodo - 4} out={sc.to - 21} />;

// Cambio de escena tranquilo (el mismo en todo el video): el teléfono se achica un poco y gira apenas mientras la
// pantalla cambia con un fundido; nunca sale de cuadro.
export const dipOut = (to: number) => [{at: to - 12, dur: 14, pose: {...REST, s: 0.93, ry: -6, y: REST.y + 20}}];
export const dipIn = (from: number) => [{at: from + 3, dur: 22, pose: REST, ease: 'out' as const}];
const TO_ABRIR = dipOut(sc.to);
export const intro: SceneDef = {
  screens: [{at: 0, src: shot('programa'), ink: 'dark'}],
  cam: [
    {at: -2, dur: 1, pose: {...REST, y: REST.y + 1500, rx: 38, s: 0.9}},
    {at: tRise, dur: RISE, pose: REST, ease: 'out'},
    {at: tLand + 50, dur: 40, pose: {...REST, ry: -5, rx: 2, s: 1.02}},
    ...TO_ABRIR,
  ],
  // Cada pieza, un pop suave al saltar.
  lifts: PIECES.map((d) => ({...d, gain: 0.3})),
  bursts: [{at: tLand - 2, x: 540, y: 1180, n: 10, r: 260, star: true}],
  Under,
  Overlay,
  sfx: [
    {name: 'logo', at: 0, gain: 0.55},
    {name: 'whoosh-soft', at: tTitleOut, gain: 0.25},
    {name: 'whoosh-soft', at: tRise + 4, gain: 0.3},
    {name: 'boom', at: tLand - 4, gain: 0.28},
    ...PIECES.map((_d, i) => ({name: 'tick' as const, at: intoAt(i) + 6, gain: 0.12})),
    {name: 'swish', at: sc.to - 12, gain: 0.2},
  ],
};

