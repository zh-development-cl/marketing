import React from 'react';
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {beat, beatEnd, scenes} from '../timeline';
import {PT, REST, SCREEN_H, SCREEN_W} from '../ui/geometry';
import {GRAD_TEXT} from '../ui/Text';
import {SceneDef, shot} from './types';

// Escena 9 · cierre. Arriba, la dirección grande («Ábrela en tu celular · app.congresoschot2026.com»); en el
// teléfono, la pantalla de ingreso real; en «agrégala» el teléfono pasa a la pantalla de inicio de iOS y el ícono de
// SCHOT cae en su lugar con su nombre. Al final, el sello y los datos del congreso, y un fundido corto.
const sc = scenes.cierre;
const tUrl = beat('cierre', 'Entra') - 4;
const tHome = beat('cierre', 'agrégala') - 8;
const tIcon = beat('cierre', 'agrégala') + 6;
const tEndCard = beatEnd('cierre', 'inicio') + 14;
const tDim = sc.to - 12;

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
  const urlIn = pr(f, tUrl, 16);
  const subIn = pr(f, beat('cierre', 'agrégala') - 2, 14);
  const end = pr(f, tEndCard, 18);
  const dim = pr(f, tDim, 12, Easing.inOut(Easing.cubic));
  const blur = (p: number) => ((1 - p) * 12 > 0.3 ? `blur(${((1 - p) * 12).toFixed(1)}px)` : undefined);
  return (
    <>
      <div style={{position: 'absolute', left: 60, right: 60, top: 150, textAlign: 'center', zIndex: 50}}>
        <div style={{opacity: urlIn, transform: `translateY(${((1 - urlIn) * 24).toFixed(1)}px)`, filter: blur(urlIn)}}>
          <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#C3AEF2'}}>Ábrela en tu celular</div>
          <div style={{marginTop: 18, display: 'inline-block', padding: '20px 40px', borderRadius: 999, background: 'rgba(255,255,255,.96)', boxShadow: '0 20px 60px rgba(14,0,30,.45), 0 0 0 6px rgba(195,174,242,.25)'}}>
            <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 60, letterSpacing: '-0.01em', color: '#2B0054'}}>
              app.congresoschot<span style={{backgroundImage: 'linear-gradient(100deg, #8A00E6 0%, #E6007E 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>2026</span>.com
            </span>
          </div>
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
          <div style={{fontWeight: 500, fontSize: 28, color: 'rgba(255,255,255,.8)'}}>Viña del Mar · noviembre 2026</div>
        </div>
      </div>
      {/* Fundido final a noche */}
      <div style={{position: 'absolute', inset: 0, background: '#1A0033', opacity: dim, zIndex: 100}} />
    </>
  );
};

export const cierre: SceneDef = {
  screens: [
    {at: sc.from, src: shot('login-1'), enter: 'fade', enterDur: 10, ink: 'light'},
    {at: tHome, render: (f) => <HomeScreen f={f} fps={30} />, enter: 'zoom', enterDur: 14, ink: 'light'},
  ],
  cam: [
    {at: sc.from, dur: 20, pose: {...REST, y: 1330, s: 0.86}, ease: 'io'},
    {at: tEndCard, dur: 26, pose: {...REST, y: 1215, s: 0.74}, ease: 'io'},
  ],
  taps: [],
  Overlay,
  sfx: [
    {name: 'whoosh-soft', at: tUrl, gain: 0.5},
    {name: 'pop', at: tIcon, gain: 0.7},
    {name: 'chime', at: tIcon + 4, gain: 0.45},
    {name: 'logo', at: tEndCard - 4, gain: 0.55},
  ],
};
