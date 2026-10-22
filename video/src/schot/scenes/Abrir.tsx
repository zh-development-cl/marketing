import React from 'react';
import {Easing, Img, interpolate, staticFile} from 'remotion';
import {beat, scenes} from '../timeline';
import {bx, center} from '../shots';
import {PT, REST, SCREEN_H, SCREEN_W} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {SceneDef, shot} from './types';

// Escena 2 · entrar. Llega con un latigazo desde la apertura. «No se descarga» → la insignia «Descargar la app» se
// tacha; «se abre en el navegador» → la barra de Safari salta de la pantalla, la dirección se escribe en grande, se
// toca «Ir» y vuelve a su lugar mientras carga el ingreso real; «entras con tu correo» → el campo del correo sale ya
// escrito; «y un código» → los seis casilleros salen y los dígitos caen uno a uno; «Sin contraseñas» → insignia con
// estallido y adentro: «Hola, Carolina».
const sc = scenes.abrir;
const URL = 'app.congresoschot2026.com';

const tIn = sc.from + 1; // el teléfono vuelve con el latigazo
const tBadge = beat('abrir', 'No') - 3;
const tStrike = beat('abrir', 'descarga');
const tBar = beat('abrir', 'se', 1) - 4; // la barra salta
const tType = tBar + 4;
const tTyped = tType + 19;
const tGo = beat('abrir', 'navegador') - 1; // «Ir» sobre la barra flotante
const tBarBack = tGo + 9;
const BAR_BACK = 13;
const tLoaded = tBarBack + 8; // carga el ingreso real bajo la barra que vuelve
const tBarCollapse = tBarBack + BAR_BACK + 1;
const tTapMail = beat('abrir', 'entras') - 4;
const tMail = beat('abrir', 'entras') + 1; // el campo salta
const tMailTyped = beat('abrir', 'correo') - 6;
const tMailBack = beat('abrir', 'correo') + 4;
const tTapSend = tMailBack + 10;
const tCode = tTapSend + 3;
const CODE_PUSH = 10;
const tCodeLift = tCode + CODE_PUSH; // sale cuando la pantalla terminó de entrar
const tDigit0 = Math.max(beat('abrir', 'código') + 2, tCodeLift + 6);
const tCodeBack = Math.max(beat('abrir', 'Sin') + 2, tDigit0 + 18);
const tSin = beat('abrir', 'Sin') - 2;
const tHome = tCodeBack + 14; // adentro: bienvenida, cuando el código ya volvió
const tTapStart = sc.to - 8; // «Comenzar» → la escena siguiente empuja los intereses

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
const pr = (f: number, a: number, d: number, e = io) => interpolate(f, [a, a + Math.max(1, d)], [0, 1], {...clampOpt, easing: e});
const SF = '-apple-system, "SF Pro Text", "Barlow", system-ui, sans-serif';

// Barra de direcciones de Safari (iOS 26: cápsula flotante) dibujada a escala k (px por pt) en una caja de 358 x 50 pt.
const SafariBarView: React.FC<{f: number; k: number; col?: number}> = ({f, k, col = 0}) => {
  const n = Math.round(URL.length * pr(f, tType, tTyped - tType, Easing.linear));
  const caret = f >= tType - 2 && f < tGo && Math.floor(f / 6) % 2 === 0;
  const load = pr(f, tGo, tLoaded - tGo + 6, Easing.out(Easing.quad));
  const loading = f >= tGo && f < tLoaded + 10;
  return (
    <div style={{position: 'absolute', inset: 0, borderRadius: 30 * k, background: 'rgba(255,255,255,.97)', display: 'flex', alignItems: 'center', padding: `0 ${16 * k}px`, gap: 10 * k, overflow: 'hidden'}}>
      <span style={{fontFamily: SF, fontWeight: 600, fontSize: 17 * k, color: '#1C1224', opacity: 1 - col, width: (1 - col) * 22 * k, overflow: 'hidden', flex: 'none'}}>
        a<span style={{fontSize: 13 * k}}>A</span>
      </span>
      <span style={{flex: 1, fontFamily: SF, fontWeight: 500, fontSize: (17 - 6.5 * col) * k, color: n ? '#1C1224' : '#8E8A96', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden'}}>
        {n ? (col > 0.5 ? URL.replace(/^app\./, '') : URL.slice(0, n)) : 'Buscar o escribir el sitio'}
        {caret ? <span style={{display: 'inline-block', width: 2 * k, height: 20 * k, background: '#A200FF', marginLeft: 1, verticalAlign: 'middle'}} /> : null}
      </span>
      <svg width={(1 - col) * 18 * k} height={18 * k} viewBox="0 0 24 24" fill="none" stroke="#1C1224" strokeWidth="2.2" strokeLinecap="round" style={{opacity: 1 - col, flex: 'none'}}>
        <path d="M20 12a8 8 0 1 1-2.3-5.6" />
        <path d="M20 4v4h-4" />
      </svg>
      {loading ? <div style={{position: 'absolute', left: 0, bottom: 0, height: 3 * k, width: `${(load * 100).toFixed(1)}%`, background: 'linear-gradient(90deg, #8A00E6, #E6007E)', borderRadius: 2}} /> : null}
    </div>
  );
};

const BAR = {x: 16, y: 756, w: 358, h: 50};
// La barra en el teléfono: no se dibuja mientras está afuera; al volver se recoge en una pastilla chica y se va.
const SafariBarOnPhone: React.FC<{f: number}> = ({f}) => {
  if (f >= tBar + 1 && f < tBarBack + BAR_BACK - 1) return null;
  const col = pr(f, tBarCollapse, 10, Easing.bezier(0.32, 0.72, 0, 1));
  const w = (358 - 230 * col) * PT;
  return (
    <div style={{position: 'absolute', left: (SCREEN_W - w) / 2, bottom: (38 - 14 * col) * PT, width: w, height: (50 - 22 * col) * PT, borderRadius: 30 * PT, boxShadow: '0 10px 30px rgba(28,18,36,.18), inset 0 0 0 1px rgba(28,18,36,.06)', opacity: 1 - pr(f, tBarCollapse + 6, 8), zIndex: 25, overflow: 'hidden'}}>
      <SafariBarView f={f} k={PT * (1 - 0.3 * col)} col={col} />
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
    <SafariBarOnPhone f={f} />
  </div>
);

const SafariPage: React.FC<{f: number; id: string}> = ({f, id}) => (
  <div style={{position: 'absolute', inset: 0}}>
    <Img src={staticFile(shot(id))} style={{position: 'absolute', left: 0, top: 0, width: SCREEN_W, height: SCREEN_H}} />
    <SafariBarOnPhone f={f} />
  </div>
);

const mail = bx('login-1', 'campoCorreo', {x: 48, y: 436, w: 294, h: 53});
const send = bx('login-2', 'botonEnviarCodigo', {x: 48, y: 505, w: 294, h: 48});
const code = bx('login-3a', 'grupoCodigo', {x: 48, y: 520, w: 294, h: 52});
const codeLast = bx('login-3g', 'grupoCodigo', {x: 48, y: 505, w: 294, h: 52});
const comenzar = bx('bienvenida', 'botonComenzar', {x: 24, y: 706, w: 342, h: 56});
const digits = ['login-3b', 'login-3c', 'login-3d', 'login-3e', 'login-3f', 'login-3g'];
const digitAt = (i: number) => tDigit0 + i * 3;

// El teléfono se echa atrás (más chico e inclinado) mientras una pieza está afuera: separa los planos.
const RECEDE = {...REST, s: 0.9, y: REST.y + 50, rx: 12};
// Dónde queda el botón «Ir» de la barra flotante.
const BAR_TO = {x: 540, y: 1150, k: 2.7};

const Overlay: React.FC = () => <Headline n="1" label="Entrar" lines={['Sin descargar', '*nada*']} at={sc.from - 2} out={sc.to - 17} />;

export const abrir: SceneDef = {
  screens: [
    {at: sc.from, render: (f) => <SafariStart f={f} />, ink: 'dark'},
    {at: tLoaded, render: (f) => <SafariPage f={f} id="login-1" />, enter: 'fade', enterDur: 8, ink: 'light'},
    {at: tMailBack + 8, src: shot('login-2'), enter: 'fade', enterDur: 4, ink: 'light'},
    {at: tCode, src: shot('login-3a'), enter: 'push', enterDur: CODE_PUSH, ink: 'light'},
    ...digits.map((id, i) => ({at: digitAt(i), src: shot(id), enter: 'fade' as const, enterDur: i === digits.length - 1 ? 7 : 3, ink: 'light' as const})),
    {at: tHome, src: shot('bienvenida'), enter: 'zoom', enterDur: 14, ink: 'light'},
  ],
  taps: [
    {at: tTapMail, ...center(mail)},
    {at: tTapSend, ...center(send)},
    {at: tTapStart, ...center(comenzar)},
  ],
  ctaps: [{at: tGo, x: BAR_TO.x + (358 / 2 - 25) * BAR_TO.k, y: BAR_TO.y, scale: 0.9}],
  cam: [
    {at: tIn, dur: 1, pose: {...REST, x: 1840, ry: -28, s: 0.96}},
    {at: tIn + 1, dur: 16, pose: REST, ease: 'whipOut'},
    {at: tBar, dur: 14, pose: RECEDE},
    {at: tBarBack, dur: 14, pose: REST},
    {at: tMail, dur: 12, pose: RECEDE},
    {at: tMailBack, dur: 12, pose: REST},
    {at: tCodeLift, dur: 12, pose: RECEDE},
    {at: tCodeBack, dur: 14, pose: REST},
    {at: tHome + 6, dur: 18, pose: {...REST, s: 1.05, y: REST.y - 20}},
    {at: tTapStart - 8, dur: 14, pose: REST},
  ],
  badges: [
    {at: tBadge, out: tBar - 6, x: 540, y: 1090, text: 'Descargar la app', icon: 'download', tone: 'white', size: 58, r: -4, strike: tStrike},
    {at: tSin, out: sc.to - 14, x: 540, y: 735, text: 'Sin contraseñas', icon: 'shield', tone: 'brand', size: 46, r: -2},
  ],
  bursts: [{at: tSin + 4, x: 540, y: 735, n: 16, r: 260, star: true}],
  lifts: [
    {
      at: tBar,
      out: tBarBack,
      exitDur: BAR_BACK,
      box: BAR,
      render: (f, k) => <SafariBarView f={f} k={k} />,
      to: {...BAR_TO, rx: 8},
      radius: 30,
      ring: true,
      scrim: 0.35,
      dim: false,
      shine: false,
    },
    {
      at: tMail,
      out: tMailBack,
      box: mail,
      src: (f) => shot(f < tMailTyped ? 'login-1' : 'login-2'),
      to: {x: 540, y: 1130, k: 3.0, rx: 8},
      radius: 14,
      ring: true,
      scrim: 0.35,
    },
    {
      at: tCodeLift,
      out: tCodeBack,
      box: code,
      // Cada dígito que entra cambia el recorte; el último reacomoda la tarjeta 15 pt más arriba.
      render: (f, k) => {
        let id = 'login-3a';
        digits.forEach((d, i) => {
          if (f >= digitAt(i)) id = d;
        });
        const y = id === 'login-3g' ? codeLast.y : code.y;
        return <Img src={staticFile(shot(id))} style={{position: 'absolute', left: -code.x * k, top: -y * k, width: 390 * k}} />;
      },
      to: {x: 540, y: 1130, k: 3.0, rx: 8},
      radius: 14,
      ring: true,
      scrim: 0.35,
    },
  ],
  Overlay,
  sfx: [
    {name: 'click', at: tStrike, gain: 0.45},
    {name: 'swish', at: tStrike + 1, gain: 0.25},
    ...Array.from({length: 7}, (_, i) => ({name: 'tick' as const, at: tType + 1 + i * 3, gain: 0.2})),
    {name: 'click', at: tGo, gain: 0.5},
    {name: 'click', at: tTapMail, gain: 0.35},
    {name: 'tick', at: tMailTyped, gain: 0.3},
    {name: 'click', at: tTapSend, gain: 0.45},
    ...digits.map((_, i) => ({name: (i % 2 ? 'pop-hi' : 'pop-mid') as 'pop-hi' | 'pop-mid', at: digitAt(i), gain: 0.28})),
    {name: 'sparkle', at: tSin + 3, gain: 0.35},
    {name: 'chime', at: tHome + 2, gain: 0.22},
    {name: 'click', at: tTapStart, gain: 0.4},
  ],
};

