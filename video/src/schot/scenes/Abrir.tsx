import React from 'react';
import {Easing, Img, interpolate, staticFile} from 'remotion';
import {beat, scenes} from '../timeline';
import {bx, center} from '../shots';
import {focus, PT, REST, SCREEN_H, SCREEN_W} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {SceneDef, shot} from './types';

// Escena 2 · entrar. «No se descarga: se abre en el navegador» → Safari con la dirección que se escribe sola y la
// página que carga (la pantalla de ingreso real); la barra de Safari se recoge al tocar el correo; «entras con tu
// correo y un código» → correo escrito, «Enviarme un código», los 6 dígitos que se completan; «Sin contraseñas» →
// adentro: «Hola, Carolina».
const sc = scenes.abrir;
const URL = 'app.congresoschot2026.com';
const tType = beat('abrir', 'descarga') - 4; // empieza a escribirse la dirección
const tTyped = tType + 30;
const tGo = beat('abrir', 'abre') - 2; // «Ir»: carga la página
const tLoaded = beat('abrir', 'navegador') - 8;
const tTapMail = beat('abrir', 'entras') - 4;
const tMail = tTapMail + 5;
const tTapSend = beat('abrir', 'correo') + 6;
const tCode = tTapSend + 5;
const tDigit0 = beat('abrir', 'código') - 2;
const tIn = beat('abrir', 'Sin') + 4; // adentro: bienvenida
const tBarOut = tTapMail - 2;

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
const pr = (f: number, a: number, d: number, e = io) => interpolate(f, [a, a + Math.max(1, d)], [0, 1], {...clampOpt, easing: e});
const SF = '-apple-system, "SF Pro Text", "Barlow", system-ui, sans-serif';

// Barra de direcciones de Safari (iOS 26: cápsula flotante abajo). `typed` 0..1 de la dirección; `load` 0..1 barra
// de carga; `collapse` 0..1 se recoge en una pastilla chica y se va.
const SafariBar: React.FC<{f: number}> = ({f}) => {
  const n = Math.round(URL.length * pr(f, tType, tTyped - tType, Easing.linear));
  const typing = f < tTyped + 4;
  const caret = typing && Math.floor(f / 8) % 2 === 0;
  const load = pr(f, tGo, tLoaded - tGo + 4, Easing.out(Easing.quad));
  const loading = f >= tGo && f < tLoaded + 8;
  const col = pr(f, tBarOut, 10, Easing.bezier(0.32, 0.72, 0, 1));
  const w = (358 - 230 * col) * PT;
  return (
    <div style={{position: 'absolute', left: (SCREEN_W - w) / 2, bottom: (38 - 14 * col) * PT, width: w, height: (50 - 22 * col) * PT, borderRadius: 30 * PT, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(20px)', boxShadow: '0 10px 30px rgba(28,18,36,.18), inset 0 0 0 1px rgba(28,18,36,.06)', display: 'flex', alignItems: 'center', padding: `0 ${16 * PT}px`, gap: 10 * PT, opacity: 1 - pr(f, tBarOut + 6, 8), overflow: 'hidden', zIndex: 25}}>
      <span style={{fontFamily: SF, fontWeight: 600, fontSize: (17 - 5 * col) * PT, color: '#1C1224', opacity: 1 - col}}>
        a<span style={{fontSize: (13 - 4 * col) * PT}}>A</span>
      </span>
      <span style={{flex: 1, fontFamily: SF, fontWeight: 500, fontSize: (17 - 5 * col) * PT, color: n ? '#1C1224' : '#8E8A96', textAlign: 'center', whiteSpace: 'nowrap'}}>
        {n ? URL.slice(0, n) : 'Buscar o escribir el sitio'}
        {caret ? <span style={{display: 'inline-block', width: 2 * PT, height: 20 * PT, background: '#A200FF', marginLeft: 1, verticalAlign: 'middle'}} /> : null}
      </span>
      <svg width={18 * PT} height={18 * PT} viewBox="0 0 24 24" fill="none" stroke="#1C1224" strokeWidth="2.2" strokeLinecap="round" style={{opacity: 1 - col}}>
        <path d="M20 12a8 8 0 1 1-2.3-5.6" />
        <path d="M20 4v4h-4" />
      </svg>
      {loading ? <div style={{position: 'absolute', left: 0, bottom: 0, height: 3 * PT, width: `${(load * 100).toFixed(1)}%`, background: 'linear-gradient(90deg, #8A00E6, #E6007E)', borderRadius: 2}} /> : null}
    </div>
  );
};

// Página de inicio de Safari (antes de cargar la app).
const SafariStart: React.FC<{f: number}> = ({f}) => (
  <div style={{position: 'absolute', inset: 0, background: '#F2F1F6'}}>
    <div style={{position: 'absolute', left: 24 * PT, top: 92 * PT, fontFamily: SF, fontWeight: 700, fontSize: 22 * PT, color: '#1C1224'}}>Favoritos</div>
    <div style={{position: 'absolute', left: 24 * PT, top: 132 * PT, display: 'grid', gridTemplateColumns: `repeat(4, ${66 * PT}px)`, gap: `${18 * PT}px ${22 * PT}px`}}>
      {Array.from({length: 8}, (_, i) => (
        <div key={i} style={{width: 66 * PT, height: 66 * PT, borderRadius: 14 * PT, background: 'linear-gradient(160deg, #FFFFFF, #E9E6EF)', boxShadow: 'inset 0 0 0 1px rgba(28,18,36,.06)'}} />
      ))}
    </div>
    <SafariBar f={f} />
  </div>
);

// La página real de ingreso dentro de Safari (con la barra encima hasta que se recoge).
const SafariPage: React.FC<{f: number; id: string}> = ({f, id}) => (
  <div style={{position: 'absolute', inset: 0}}>
    <Img src={staticFile(shot(id))} style={{position: 'absolute', left: 0, top: 0, width: SCREEN_W, height: SCREEN_H}} />
    <SafariBar f={f} />
  </div>
);

const mail = bx('login-1', 'campoCorreo', {x: 24, y: 520, w: 342, h: 52});
const send = bx('login-2', 'botonEnviarCodigo', bx('login-1', 'botonEnviarCodigo', {x: 24, y: 590, w: 342, h: 52}));
const codeBoxes = bx('login-3g', 'cajasCodigo', {x: 24, y: 330, w: 342, h: 60});
const bar = {x: 16, y: 756, w: 358, h: 50};

const Overlay: React.FC = () => <Headline n="1" label="Entrar" lines={['Sin descargar', '*nada*']} at={sc.from - 4} out={sc.to - 8} />;

const digits = ['login-3b', 'login-3c', 'login-3d', 'login-3e', 'login-3f', 'login-3g'];

export const abrir: SceneDef = {
  screens: [
    {at: sc.from - 2, render: (f) => <SafariStart f={f} />, enter: 'zoom', enterDur: 12, ink: 'dark'},
    {at: tLoaded, render: (f) => <SafariPage f={f} id="login-1" />, enter: 'fade', enterDur: 8, ink: 'light'},
    {at: tMail, src: shot('login-2'), enter: 'fade', enterDur: 6, ink: 'light'},
    {at: tCode, src: shot('login-3a'), enter: 'push', ink: 'light'},
    ...digits.map((id, i) => ({at: tDigit0 + i * 3, src: shot(id), ink: 'light' as const})),
    {at: tIn, src: shot('bienvenida'), enter: 'zoom', enterDur: 14, ink: 'light'},
  ],
  taps: [
    {at: tGo - 3, x: 330, y: bar.y + bar.h / 2},
    {at: tTapMail, ...center(mail)},
    {at: tTapSend, ...center(send)},
  ],
  cam: [
    {at: sc.from + 2, dur: 14, pose: focus(bar, 1.28, {x: 540, y: 1260})},
    {at: tLoaded - 2, dur: 16, pose: REST},
    {at: tCode + 2, dur: 12, pose: focus(codeBoxes, 1.3, {x: 540, y: 1120})},
    {at: tIn - 4, dur: 16, pose: REST},
  ],
  Overlay,
  sfx: [
    ...Array.from({length: 8}, (_, i) => ({name: 'tick' as const, at: tType + 2 + i * 4, gain: 0.18})),
    {name: 'click', at: tGo - 3, gain: 0.5},
    {name: 'click', at: tTapMail, gain: 0.4},
    {name: 'click', at: tTapSend, gain: 0.5},
    ...digits.map((_, i) => ({name: 'tick' as const, at: tDigit0 + i * 3, gain: 0.22})),
    {name: 'chime', at: tIn, gain: 0.4},
  ],
};
