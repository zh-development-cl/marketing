import React, {useContext} from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Streak} from '../../v4/fx/MotionBlur';
import {beat, scenes} from '../timeline';
import {bx, center} from '../shots';
import {PT, REST, SCREEN_H, SCREEN_W} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {CamCtx, LiftDef, liftState} from '../ui/Pop';
import {SceneDef, shot} from './types';

// Escena 2 · entrar. Llega con un latigazo desde la apertura. «No se descarga» → la insignia «Descargar la app» se
// tacha; «se abre en el navegador» → la barra de Safari salta de la pantalla, la dirección se escribe en grande, se
// toca «Ir» y vuelve a su lugar mientras carga el ingreso real; «entras con tu correo» → el campo del correo sale ya
// escrito; «y un código» → llega el correo con el código (notificación de Gmail con el remitente, el asunto y la vista
// previa reales del backend: «482915 es tu código para el Congreso SCHOT»), los seis casilleros salen de la pantalla y
// cada dígito vuela desde el correo a su casillero; «Sin contraseñas» → insignia con estallido y adentro: «Hola,
// Carolina».
const sc = scenes.abrir;
const URL = 'app.congresoschot2026.com';

const tIn = sc.from + 1; // el teléfono vuelve con el latigazo
const tBadge = beat('abrir', 'No') - 3;
const tStrike = beat('abrir', 'descarga');
const tBar = beat('abrir', 'se', 1) - 4; // la barra salta
const tType = tBar + 4;
const tTyped = tType + 26;
const tGo = Math.max(beat('abrir', 'navegador') - 1, tTyped + 3); // «Ir» sobre la barra flotante
const tBarBack = tGo + 12;
const BAR_BACK = 18;
const tLoaded = tBarBack + 10; // carga el ingreso real bajo la barra que vuelve
const tBarCollapse = tBarBack + BAR_BACK + 1;
const tTapMail = beat('abrir', 'entras') - 8;
const tMail = beat('abrir', 'entras') - 5; // el campo salta
const tMailTyped = beat('abrir', 'correo') - 4;
const tMailBack = beat('abrir', 'correo') + 8;
const tTapSend = tMailBack + 12;
const tCode = tTapSend + 3;
const CODE_PUSH = 14;
const tGmail = Math.max(beat('abrir', 'un') - 1, tCode + 2); // llega el correo con el código
const tCodeLift = tCode + CODE_PUSH; // sale cuando la pantalla terminó de entrar
const FLY = 14; // frames de vuelo de cada dígito del correo a su casillero
const DIGIT_STEP = 5;
const tDigit0 = Math.max(beat('abrir', 'código') + 2, tCodeLift + 10, tGmail + 14 + FLY);
const tGmailOut = tDigit0 + 5 * DIGIT_STEP + 4;
const tCodeBack = Math.max(beat('abrir', 'Sin') + 2, tGmailOut + 2);
const tSin = Math.max(beat('abrir', 'Sin') - 2, tGmailOut + 6); // cuando el correo ya se fue
const tHome = tCodeBack + 20; // adentro: bienvenida, cuando el código ya volvió
const tTapStart = sc.to - 10; // «Comenzar» → la escena siguiente empuja los intereses

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
const digitAt = (i: number) => tDigit0 + i * DIGIT_STEP;

// ---------- el correo con el código ----------
// El mismo correo que manda el backend (internal/platform/mail/smtp.go): remitente «Congreso SCHOT», asunto
// «<código> es tu código para el Congreso SCHOT» y la vista previa «Vence en 10 minutos y solo sirve una vez.».
// El código es el que se escribe en las capturas (login-3b…3g).
const CODE = '482915';
// Ícono de Gmail (la M de cuatro colores sobre blanco).
const GmailIcon: React.FC<{size: number}> = ({size}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.23, background: '#fff', boxShadow: 'inset 0 0 0 1px rgba(28,18,36,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
    <svg width={size * 0.66} height={size * 0.53} viewBox="0 0 52 42">
      <path fill="#4285f4" d="M3.5 42h8V22.5L0 13.75V38.5c0 1.94 1.57 3.5 3.5 3.5" />
      <path fill="#34a853" d="M40.5 42h8c1.94 0 3.5-1.57 3.5-3.5V13.75L40.5 22.5" />
      <path fill="#fbbc04" d="M40.5 7.33v15.17L52 13.75V9.08c0-4.33-4.94-6.8-8.4-4.2" />
      <path fill="#ea4335" d="M11.5 22.5V7.33L26 18.17 40.5 7.33v15.17L26 33.33" />
      <path fill="#c5221f" d="M0 9.08v4.67l11.5 8.75V7.33L8.28 4.92C4.83 2.32 0 4.79 0 9.08" />
    </svg>
  </div>
);
// Medidas de la notificación (pt): los dígitos tienen ancho fijo para saber de dónde sale cada uno.
const GM = {w: 372, h: 98, pad: 12, icon: 38, gap: 10, row1: 17, row2: 20, row3: 19, digitW: 8.4};
const GM_TEXT_X = 13 + GM.icon + GM.gap;
const digitInMail = (i: number) => ({x: GM_TEXT_X + GM.digitW * (i + 0.5) - GM.w / 2, y: GM.pad + GM.row1 + GM.row2 + GM.row3 / 2 - GM.h / 2});
const launchAt = (i: number) => digitAt(i) - FLY;
const GmailCard: React.FC<{f: number; k: number}> = ({f, k}) => (
  <div style={{position: 'absolute', inset: 0, borderRadius: 22 * k, padding: `${GM.pad * k}px ${13 * k}px`, background: 'rgba(247,245,250,.98)', display: 'flex', gap: GM.gap * k, alignItems: 'flex-start', fontFamily: SF, color: '#1C1224'}}>
    <div style={{paddingTop: 8 * k}}>
      <GmailIcon size={GM.icon * k} />
    </div>
    <div style={{flex: 1, minWidth: 0}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 13 * k, lineHeight: `${GM.row1 * k}px`, color: '#6B6178', fontWeight: 500}}>
        <span style={{fontWeight: 600, color: '#3C3346'}}>Gmail</span>
        <span>ahora</span>
      </div>
      <div style={{fontSize: 15.5 * k, lineHeight: `${GM.row2 * k}px`, fontWeight: 700}}>Congreso SCHOT</div>
      <div style={{fontSize: 14 * k, lineHeight: `${GM.row3 * k}px`, fontWeight: 600, whiteSpace: 'nowrap'}}>
        {/* El código se marca (resaltador lila) antes de salir; la sombra no mueve los dígitos de su lugar. */}
        <span style={{display: 'inline-block', borderRadius: 5 * k, background: `rgba(162,0,255,${(0.14 * pr(f, tGmail + 6, 6) * (1 - pr(f, launchAt(5) + 2, 6))).toFixed(3)})`, boxShadow: `0 0 0 ${3 * k}px rgba(162,0,255,${(0.14 * pr(f, tGmail + 6, 6) * (1 - pr(f, launchAt(5) + 2, 6))).toFixed(3)})`}}>
          {CODE.split('').map((d, i) => (
            // Cada dígito se apaga cuando sale volando hacia su casillero.
            <span key={i} style={{display: 'inline-block', width: GM.digitW * k, textAlign: 'center', fontWeight: 800, color: '#7A00D6', opacity: f >= launchAt(i) ? 0.28 : 1}}>
              {d}
            </span>
          ))}
        </span>
        <span> es tu código para el Congreso SCHOT</span>
      </div>
      <div style={{fontSize: 13.5 * k, lineHeight: `${18 * k}px`, color: '#6B6178', fontWeight: 500, whiteSpace: 'nowrap'}}>Vence en 10 minutos y solo sirve una vez.</div>
    </div>
  </div>
);
const GMAIL_LIFT: LiftDef = {
  at: tGmail,
  out: tGmailOut,
  box: {x: 9, y: 52, w: GM.w, h: GM.h},
  render: (f, k) => <GmailCard f={f} k={k} />,
  from: {x: 540, y: 600, k: 0.9, r: 0},
  to: {x: 540, y: 792, k: 2.45},
  exit: 'pop', // se encoge en su lugar: volando hacia arriba cruzaría el titular
  radius: 22,
  ring: true,
  float: 0, // quieta: los dígitos salen de posiciones exactas
  shine: false,
};

const CODE_TO = {x: 540, y: 1150, k: 3.0};
const CODE_LIFT: LiftDef = {
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
  to: {...CODE_TO, rx: 8},
  radius: 14,
  ring: true,
  scrim: 0.35,
};

// Los seis dígitos vuelan del correo a los casilleros flotantes: cada uno en una tecla blanca que crece hasta el
// tamaño del casillero y cae justo cuando la captura real muestra ese dígito escrito.
const boxCenter = (i: number) => {
  const d = bx('login-3a', `digito${i + 1}`, {x: 48 + i * 50.4, y: 520, w: 42, h: 52});
  return {x: d.x + d.w / 2 - (code.x + code.w / 2), y: d.y + d.h / 2 - (code.y + code.h / 2), w: d.w, h: d.h};
};
const DigitFlights: React.FC = () => {
  const f = useCurrentFrame();
  const {cam} = useContext(CamCtx);
  return (
    <>
      {CODE.split('').map((digit, i) => {
        const t0 = launchAt(i);
        const t1 = digitAt(i);
        if (f < t0 || f >= t1) return null;
        const a = liftState(GMAIL_LIFT, cam, t0);
        const b = liftState(CODE_LIFT, cam, t1);
        if (!a || !b) return null;
        const m = digitInMail(i);
        const bc = boxCenter(i);
        const A = {x: a.x + m.x * a.k, y: a.y + m.y * a.k, w: GM.digitW * a.k * 1.25, h: GM.row3 * a.k * 1.15};
        const B = {x: b.x + bc.x * b.k, y: b.y + bc.y * b.k, w: bc.w * b.k, h: bc.h * b.k};
        const pos = (fr: number) => {
          const t = interpolate(fr, [t0, t1], [0, 1], {...clampOpt, easing: Easing.inOut(Easing.cubic)});
          // Arco: sube un poco y se abre hacia su lado antes de caer en el casillero.
          const cx = (A.x + B.x) / 2 + (i - 2.5) * 34;
          const cy = Math.min(A.y, B.y) - 90;
          const u = 1 - t;
          return {t, x: u * u * A.x + 2 * u * t * cx + t * t * B.x, y: u * u * A.y + 2 * u * t * cy + t * t * B.y};
        };
        const p = pos(f);
        const q = pos(f - 1);
        const w = A.w + (B.w - A.w) * p.t;
        const h = A.h + (B.h - A.h) * p.t;
        const sx = Math.min(30, Math.abs(p.x - q.x) * 0.35);
        const sy = Math.min(30, Math.abs(p.y - q.y) * 0.35);
        const tile = (
          <div style={{position: 'absolute', left: p.x - w / 2, top: p.y - h / 2, width: w, height: h, borderRadius: Math.min(w, h) * 0.24, background: '#fff', boxShadow: `0 ${(10 + 20 * Math.sin(p.t * Math.PI)).toFixed(1)}px ${(24 + 30 * Math.sin(p.t * Math.PI)).toFixed(1)}px rgba(14,0,30,.4), inset 0 0 0 ${Math.max(1.5, 3 * p.t).toFixed(1)}px rgba(162,0,255,.55)`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${(Math.sin(p.t * Math.PI) * (i % 2 ? 10 : -10)).toFixed(2)}deg)`, fontFamily: '"Barlow", system-ui, sans-serif', fontWeight: 800, fontSize: h * 0.52, color: '#2B0054', zIndex: 46}}>
            {digit}
          </div>
        );
        return (
          <div key={i} style={{position: 'absolute', inset: 0, zIndex: 46}}>
            {Math.max(sx, sy) >= 0.7 ? (
              <Streak sx={sx} sy={sy} style={{position: 'absolute', inset: 0}}>
                {tile}
              </Streak>
            ) : (
              tile
            )}
          </div>
        );
      })}
    </>
  );
};

// El teléfono se echa atrás (más chico e inclinado) mientras una pieza está afuera: separa los planos.
const RECEDE = {...REST, s: 0.9, y: REST.y + 50, rx: 12};
// Dónde queda el botón «Ir» de la barra flotante.
const BAR_TO = {x: 540, y: 1150, k: 2.7};

const Overlay: React.FC = () => (
  <>
    <Headline n="1" label="Entrar" lines={['Sin descargar', '*nada*']} at={sc.from - 2} out={sc.to - 21} />
    <DigitFlights />
  </>
);

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
    {at: tIn, dur: 1, pose: {...REST, x: 1840, ry: -22, s: 0.96}},
    {at: tIn + 1, dur: 22, pose: REST, ease: 'whipOut'},
    {at: tBar, dur: 16, pose: RECEDE},
    {at: tBarBack, dur: 18, pose: REST},
    {at: tMail, dur: 16, pose: RECEDE},
    {at: tMailBack, dur: 16, pose: REST},
    {at: tCodeLift, dur: 16, pose: RECEDE},
    {at: tCodeBack, dur: 18, pose: REST},
    {at: tHome + 6, dur: 18, pose: {...REST, s: 1.05, y: REST.y - 20}},
    {at: tTapStart - 8, dur: 14, pose: REST},
  ],
  badges: [
    {at: tBadge, out: tBar - 6, x: 540, y: 1090, text: 'Descargar la app', icon: 'download', tone: 'white', size: 58, r: -4, strike: tStrike},
    {at: tSin, out: sc.to - 8, x: 540, y: 735, text: 'Sin contraseñas', icon: 'shield', tone: 'brand', size: 46, r: -2},
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
    CODE_LIFT,
    {...GMAIL_LIFT, sound: 'chime', gain: 0.38}, // suena como un correo que llega
  ],
  Overlay,
  sfx: [
    {name: 'click', at: tStrike, gain: 0.45},
    {name: 'swish', at: tStrike + 1, gain: 0.25},
    ...Array.from({length: 7}, (_, i) => ({name: 'tick' as const, at: tType + 1 + i * 4, gain: 0.2})),
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

