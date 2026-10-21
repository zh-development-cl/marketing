import React from 'react';
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {beat, scenes} from '../timeline';
import {REST} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {SceneDef, shot} from './types';

// Escena 1 · apertura. El sello de SCHOT nace con su luz, «App oficial · Viña del Mar 2026», «62º Congreso SCHOT»;
// en «Todo el congreso» el título sube y se va, y el teléfono sube desde abajo con el Programa real en pantalla.
const sc = scenes.intro;
// El frame 0 ya es la portada completa (WhatsApp usa el primer cuadro como miniatura): todo nace antes del 0 y la
// portada respira con un acercamiento lento hasta que sube el teléfono.
const tSeal = -30;
const tEyebrow = -20;
const tTitle = -16;
const tTodo = beat('intro', 'Todo');
const tRise = tTodo - 10; // el teléfono sube justo antes de «Todo»
const tTitleOut = tTodo - 12;

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ios = Easing.bezier(0.32, 0.72, 0, 1);
const pr = (f: number, a: number, d: number, e = ios) => interpolate(f, [a, a + d], [0, 1], {...clampOpt, easing: e});

const SANS = '"Barlow", system-ui, sans-serif';

const Under: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seal = spring({frame: f - tSeal, fps, config: {damping: 16, stiffness: 90}});
  const out = pr(f, tTitleOut, 16, Easing.in(Easing.cubic));
  const glow = pr(f, tSeal, 40) * (0.85 + 0.15 * Math.sin(f / 10));
  const fade = (at: number, d = 14) => {
    const p = pr(f, at, d);
    const b = (1 - p) * 12 + out * 12;
    return {opacity: p * (1 - out), transform: `translateY(${((1 - p) * 24 - out * 60).toFixed(1)}px)`, filter: b > 0.3 ? `blur(${b.toFixed(1)}px)` : undefined} as React.CSSProperties;
  };
  if (out >= 1) return null;
  return (
    <>
      {out < 1 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 1920, transform: `scale(${(1 + 0.03 * Math.min(1, f / tTitleOut)).toFixed(4)})`, transformOrigin: '50% 45%'}}>
          {/* Sello con su luz */}
          <div style={{position: 'absolute', left: 540 - 190, top: 520, width: 380, height: 380, transform: `translateY(${(-out * 120).toFixed(1)}px) scale(${(0.7 + 0.3 * seal) * (1 - 0.25 * out)})`, opacity: Math.min(1, seal * 1.4) * (1 - out)}}>
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
      ) : null}
    </>
  );
};

const Overlay: React.FC = () => <Headline lines={['Todo el congreso,', 'en tu *celular*']} at={tTodo - 4} out={sc.to - 12} />;

export const intro: SceneDef = {
  screens: [{at: 0, src: shot('programa'), ink: 'dark'}],
  cam: [
    {at: -2, dur: 1, pose: {...REST, y: REST.y + 1500}},
    {at: tRise, dur: 26, pose: REST, ease: 'out'},
  ],
  Under,
  Overlay,
  sfx: [
    {name: 'logo', at: 0, gain: 0.6},
    {name: 'whoosh-soft', at: tRise, gain: 0.55},
  ],
};
