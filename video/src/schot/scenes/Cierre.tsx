import React from 'react';
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {beat, beatEnd, captionsOf, scenes} from '../timeline';
import {PT, REST, SCREEN_H, SCREEN_W, toCanvas} from '../ui/geometry';
import {GRAD_TEXT} from '../ui/Text';
import type {LiftDef} from '../ui/Pop';
import {SceneDef, shot} from './types';

// Escena 9 · cierre. El teléfono se aleja con la pantalla de ingreso; arriba, la dirección en una cápsula que salta y
// se escribe letra a letra mientras la voz la dice. «y agrégala a tu pantalla de inicio» → los tres pasos de la guía
// «Instalar la app» de la propia app saltan uno sobre otro y quedan en abanico; la pantalla de inicio de iOS recibe el
// ícono de SCHOT con un estallido. Termina en la tarjeta final (dirección, sello y datos del congreso) sin fundido a
// negro: WhatsApp se queda en el último cuadro, que tiene que dejar la dirección legible.
const sc = scenes.cierre;
const URL = 'app.congresoschot2026.com';
const tUrl = beat('cierre', 'Entra') - 4;
const urlWord = captionsOf('cierre').flatMap((c) => c.words).find((w) => w.text.includes('congresoschot'));
const tType0 = urlWord ? urlWord.from : tUrl + 18;
const tType1 = urlWord ? Math.min(urlWord.to - 8, tType0 + 75) : tType0 + 70;
// La guía de instalación de la propia app, paso a paso, cuando la dirección ya quedó escrita. Un paso por
// vez, grande (título e ilustración), con tiempo de leerlo.
const tStep1 = tType1 + 4; // apenas la dirección quedó escrita entera
const STEP = 48;
const tStep2 = tStep1 + STEP;
const tStep3 = tStep2 + STEP;
const tHome = Math.max(tStep3 + STEP, beat('cierre', 'pantalla') - 4);
const tIcon = tHome + 12;
const tEndCard = Math.max(beatEnd('cierre', 'inicio') + 10, tIcon + 16);
// Cada paso flotante: arriba «Paso N de 3» y su título (sin el texto chico de ayuda) y abajo la ilustración del
// teléfono con el botón marcado. En pt de la captura.
const PASO_TOP = {x: 16, y: 132, w: 358, h: 70};
const PASO_ILU = {x: 16, y: 250, w: 358, h: 246};
const paso = {x: 16, y: 132, w: 358, h: PASO_TOP.h + PASO_ILU.h};
const PHONE_POSE = {...REST, y: 1330, s: 0.86};

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ios = Easing.bezier(0.32, 0.72, 0, 1);
const pr = (f: number, a: number, d: number, e = ios) => interpolate(f, [a, a + d], [0, 1], {...clampOpt, easing: e});
const SANS = '"Barlow", system-ui, sans-serif';

// Pantalla de inicio de iOS dibujada en código: fondo de marca, íconos de vidrio sin marca (otras apps) y el ícono
// real de SCHOT que aparece con un resorte en `tIcon`.
const COLS = 4;
const ICON = 62; // pt
const X0 = 27;
const PITCH_X = (390 - 2 * X0 - ICON) / (COLS - 1);
const Y0 = 78;
const PITCH_Y = 96;
const SLOT = {c: 1, r: 2}; // donde queda SCHOT
const ICON_AT = toCanvas(PHONE_POSE, X0 + SLOT.c * PITCH_X + ICON / 2, Y0 + SLOT.r * PITCH_Y + ICON / 2);
const HomeScreen: React.FC<{f: number; fps: number}> = ({f, fps}) => {
  const pop = spring({frame: f - tIcon, fps, config: {damping: 11, stiffness: 150}});
  const glass = (key: string, x: number, y: number, a = 1) => (
    <div
      key={key}
      style={{
        position: 'absolute',
        left: x * PT,
        top: y * PT,
        width: ICON * PT,
        height: ICON * PT,
        borderRadius: 15 * PT,
        background: 'linear-gradient(160deg, rgba(255,255,255,.34), rgba(255,255,255,.12))',
        boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.35), 0 6px 18px rgba(26,0,51,.25)',
        opacity: a,
      }}
    />
  );
  const icons: React.ReactNode[] = [];
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < COLS; c++) {
      if (r === SLOT.r && c === SLOT.c) continue;
      if (r === 4 && c > 1) continue; // última fila incompleta
      icons.push(glass(`g${r}-${c}`, X0 + c * PITCH_X, Y0 + r * PITCH_Y, 0.9));
    }
  const sx = X0 + SLOT.c * PITCH_X;
  const sy = Y0 + SLOT.r * PITCH_Y;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: 'radial-gradient(120% 70% at 85% 0%, #A200FF 0%, rgba(162,0,255,0) 60%), radial-gradient(110% 70% at 100% 100%, #E6007E 0%, rgba(230,0,126,0) 60%), linear-gradient(160deg, #2B0054 0%, #41027A 60%, #5A0690 100%)'}}>
      {icons}
      {/* SCHOT */}
      <div style={{position: 'absolute', left: sx * PT, top: sy * PT, width: ICON * PT, textAlign: 'center', transform: `scale(${(0.2 + 0.8 * pop).toFixed(3)})`, opacity: Math.min(1, pop * 1.5), transformOrigin: '50% 40%'}}>
        <Img src={staticFile('schot/brand/apple-touch-icon.png')} style={{width: ICON * PT, height: ICON * PT, borderRadius: 15 * PT, boxShadow: '0 10px 26px rgba(14,0,30,.45), 0 0 0 1px rgba(255,255,255,.15)'}} />
        <div style={{marginTop: 5 * PT, marginLeft: -20 * PT, marginRight: -20 * PT, fontFamily: '-apple-system, "Barlow", system-ui, sans-serif', fontWeight: 500, fontSize: 12 * PT, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,.4)'}}>SCHOT</div>
      </div>
      {/* Halo que marca el ícono recién agregado */}
      <div style={{position: 'absolute', left: (sx - 14) * PT, top: (sy - 14) * PT, width: (ICON + 28) * PT, height: (ICON + 28) * PT, borderRadius: 26 * PT, border: '3px solid rgba(255,255,255,.85)', opacity: pr(f, tIcon + 8, 8) * (1 - pr(f, tIcon + 40, 14)), transform: `scale(${(1.15 - 0.15 * pr(f, tIcon + 8, 12)).toFixed(3)})`}} />
      {/* Dock */}
      <div style={{position: 'absolute', left: 12 * PT, right: 12 * PT, bottom: 14 * PT, height: 92 * PT, borderRadius: 34 * PT, background: 'rgba(255,255,255,.16)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.22)', backdropFilter: 'blur(18px)'}}>
        {[0, 1, 2, 3].map((c) => glass(`d${c}`, 15 + c * 87 - 12, 15, 0.95))}
      </div>
      <div style={{position: 'absolute', left: SCREEN_W / 2 - 40 * PT, top: SCREEN_H - 130 * PT, width: 80 * PT, height: 26 * PT, borderRadius: 13 * PT, background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: SANS, fontSize: 12 * PT, color: 'rgba(255,255,255,.9)'}}>
        <svg width={12 * PT} height={12 * PT} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        Buscar
      </div>
    </div>
  );
};

const Overlay: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  // La cápsula salta justo antes de que la voz diga la dirección (vacía se vería como un error).
  const pill = spring({frame: f - (tType0 - 7), fps, config: {damping: 12, stiffness: 150, mass: 0.9}});
  const eyebrow = pr(f, tUrl + 4, 14);
  const subIn = pr(f, beat('cierre', 'agrégala') - 2, 14);
  const end = pr(f, tEndCard + 8, 18);
  const blur = (p: number) => ((1 - p) * 12 > 0.3 ? `blur(${((1 - p) * 12).toFixed(1)}px)` : undefined);
  // Letras de la dirección: cada una salta en su lugar (las posiciones no se mueven mientras se escribe).
  const n = URL.length;
  const charAt = (i: number) => tType0 + ((tType1 - tType0) * i) / (n - 1);
  const chars = URL.split('').map((ch, i) => {
    const p = spring({frame: f - charAt(i), fps, config: {damping: 11, stiffness: 220, mass: 0.6}});
    const grad = i >= 17 && i <= 20; // «2026»
    return (
      <span
        key={i}
        style={{
          display: 'inline-block',
          opacity: Math.min(1, p * 2.2),
          transform: `translateY(${((1 - p) * 26).toFixed(1)}px) scale(${(0.5 + 0.5 * p).toFixed(3)})`,
          ...(grad ? {backgroundImage: 'linear-gradient(100deg, #8A00E6 0%, #E6007E 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'} : {}),
        }}
      >
        {ch}
      </span>
    );
  });
  const typing = f >= tType0 - 4 && f < tType1 + 10;
  const caretX = Math.min(n, Math.max(0, Math.floor(((f - tType0) / (tType1 - tType0)) * (n - 1)) + 1));
  return (
    <>
      <div style={{position: 'absolute', left: 40, right: 40, top: 150, textAlign: 'center', zIndex: 50}}>
        <div style={{opacity: eyebrow, transform: `translateY(${((1 - eyebrow) * 20).toFixed(1)}px)`, filter: blur(eyebrow), fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#C3AEF2'}}>Ábrela en tu celular</div>
        <div style={{marginTop: 18, display: 'inline-block', position: 'relative', padding: '20px 40px', borderRadius: 999, background: 'rgba(255,255,255,.97)', boxShadow: '0 20px 60px rgba(14,0,30,.45), 0 0 0 6px rgba(195,174,242,.25)', opacity: Math.min(1, pill * 2), transform: `scale(${(0.4 + 0.6 * pill).toFixed(4)}) rotate(${((1 - pill) * -6).toFixed(2)}deg)`}}>
          <span style={{position: 'relative', fontFamily: SANS, fontWeight: 800, fontSize: 60, letterSpacing: '-0.01em', color: '#2B0054', whiteSpace: 'nowrap'}}>
            {chars}
            {typing && Math.floor(f / 6) % 2 === 0 ? (
              <span style={{position: 'absolute', top: 8, bottom: 8, width: 4, borderRadius: 2, background: '#A200FF', left: `${((caretX / n) * 100).toFixed(2)}%`}} />
            ) : null}
          </span>
        </div>
        <div style={{marginTop: 26, opacity: subIn, transform: `translateY(${((1 - subIn) * 18).toFixed(1)}px)`, filter: blur(subIn), fontFamily: SANS, fontWeight: 600, fontSize: 44, color: '#fff'}}>
          y agrégala a tu <span style={{backgroundImage: GRAD_TEXT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>pantalla de inicio</span>
        </div>
      </div>
      {/* Pie: sello y datos del congreso */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 64, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, opacity: end, transform: `translateY(${((1 - end) * 20).toFixed(1)}px)`, zIndex: 50}}>
        <Img src={staticFile('schot/brand/schot-sello-blanco.svg')} style={{width: 92, height: 92}} />
        <div style={{fontFamily: SANS, color: '#fff'}}>
          <div style={{fontWeight: 800, fontSize: 34, letterSpacing: '0.01em'}}>62º Congreso SCHOT</div>
          <div style={{fontWeight: 500, fontSize: 28, color: 'rgba(255,255,255,.8)'}}>Viña del Mar · 18–21 nov 2026</div>
        </div>
      </div>
    </>
  );
};

// Los tres pasos de la guía: cada uno salta al centro y se va cuando llega el siguiente.
const STEP_AT = [tStep1, tStep2, tStep3];
const STEPS: LiftDef[] = ['instalar', 'instalar-paso2', 'instalar-paso3'].map((id, i) => ({
  at: STEP_AT[i] + 3,
  out: (STEP_AT[i + 1] ?? tHome) - 2,
  box: paso,
  render: (_f, k) => (
    <>
      <div style={{position: 'absolute', left: 0, top: 0, width: paso.w * k, height: PASO_TOP.h * k, overflow: 'hidden'}}>
        <Img src={staticFile(shot(id))} style={{position: 'absolute', left: -PASO_TOP.x * k, top: -PASO_TOP.y * k, width: 390 * k}} />
      </div>
      <div style={{position: 'absolute', left: 0, top: PASO_TOP.h * k, width: paso.w * k, height: PASO_ILU.h * k, overflow: 'hidden'}}>
        <Img src={staticFile(shot(id))} style={{position: 'absolute', left: -PASO_ILU.x * k, top: -PASO_ILU.y * k, width: 390 * k}} />
      </div>
    </>
  ),
  to: {x: 540, y: 1180, k: 1.9, r: i === 1 ? 1.5 : -1.5, rx: 5},
  exit: 'pop',
  radius: 22,
  ring: true,
  scrim: 0.4,
  shine: false,
  dim: (STEP_AT[i + 1] ?? tHome) - 2,
  z: i,
}));

export const cierre: SceneDef = {
  screens: [
    {at: sc.from, src: shot('login-1'), enter: 'fade', enterDur: 16, ink: 'light'},
    {at: tStep1 - 12, src: shot('instalar'), enter: 'push', enterDur: 14, ink: 'dark'},
    {at: tStep2, src: shot('instalar-paso2'), enter: 'fade', enterDur: 8, ink: 'dark'},
    {at: tStep3, src: shot('instalar-paso3'), enter: 'fade', enterDur: 8, ink: 'dark'},
    {at: tHome, render: (f) => <HomeScreen f={f} fps={30} />, enter: 'zoom', enterDur: 18, ink: 'light'},
  ],
  cam: [
    {at: sc.from, dur: 30, pose: PHONE_POSE, ease: 'out'},
    {at: tEndCard - 16, dur: 26, pose: {...REST, y: 1215, s: 0.74}, ease: 'io'},
  ],
  lifts: STEPS.map((d) => ({...d, gain: 0.26})),
  // Los pasos que se muestran son los de iPhone; la app también trae su guía para Android.
  badges: [
    {at: tStep1 + 8, out: tHome - 4, x: 540, y: 800, text: 'En iPhone', icon: 'share', tone: 'white', size: 40, r: -2, gain: 0.25},
    {at: tStep2 + 10, out: tHome - 2, x: 540, y: 1580, text: 'En Android, la app también te guía', icon: 'check', tone: 'glass', size: 34, r: 1.5, gain: 0.2},
  ],
  bursts: [{at: tIcon + 2, x: ICON_AT.x, y: ICON_AT.y, n: 12, r: 220, star: true}],
  Overlay,
  sfx: [
    {name: 'whoosh-soft', at: sc.from, gain: 0.25},
    {name: 'pop-hi', at: tType0 - 6, gain: 0.3},
    {name: 'pop', at: tIcon, gain: 0.45},
    {name: 'sparkle', at: tIcon + 2, gain: 0.28},
    {name: 'logo', at: tEndCard - 4, gain: 0.5},
  ],
};
