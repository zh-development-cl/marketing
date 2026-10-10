import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../brand/tokens';
import {ALL_CARDS, CARD_H, CARD_W} from '../components/Cards';
import {wordFrame} from '../timeline';

// Escena 3: caos. Tarjetas flotando en 3D (giran, cambian de foco) y etiquetas que se apilan al ritmo de la voz.
// Las órbitas se exportan para que el paso 01 arranque cada tarjeta desde donde quedó aquí.
export type Orbit = {x: number; y: number; z: number; rx: number; ry: number; rz: number; enterFrom: [number, number]; at: number};

export const orbits: Orbit[] = [
  {x: -330, y: -560, z: -200, rx: 18, ry: -28, rz: -8, enterFrom: [-900, -600], at: 0},
  {x: 320, y: -520, z: 120, rx: -12, ry: 24, rz: 6, enterFrom: [900, -700], at: 2},
  {x: -300, y: 380, z: 60, rx: -16, ry: 30, rz: 10, enterFrom: [-900, 500], at: 4},
  {x: 340, y: 460, z: -260, rx: 20, ry: -22, rz: -6, enterFrom: [900, 700], at: 6},
  {x: -60, y: -180, z: -520, rx: 10, ry: 14, rz: 14, enterFrom: [-200, -1200], at: 8},
  {x: 120, y: 760, z: -420, rx: -8, ry: -18, rz: -12, enterFrom: [300, 1300], at: 10},
];

const labels = ['mensajes', 'planillas', 'correos', 'cobros'];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const Chaos: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const drift = frame / 30;
  const labelsOpacity = interpolate(frame, [durationInFrames - 12, durationInFrames - 2], [1, 0], clamp);
  const handAt = wordFrame('chaos', 'todo');

  return (
    <AbsoluteFill>
      {/* Empuje de cámara lento sobre todo el espacio 3D */}
      <AbsoluteFill
        style={{
          perspective: 1500,
          perspectiveOrigin: '50% 50%',
          transform: `scale(${interpolate(frame, [0, durationInFrames], [1, 1.1])})`,
        }}
      >
        {orbits.map((o, i) => {
          const Card = ALL_CARDS[i % ALL_CARDS.length];
          const p = spring({frame: frame - o.at, fps, config: {damping: 18, stiffness: 110, mass: 0.9}});
          const z = o.z + Math.sin(drift * 0.7 + i) * 220;
          const x = interpolate(p, [0, 1], [o.enterFrom[0], o.x]) + Math.sin(drift * 1.3 + i) * 18;
          const y = interpolate(p, [0, 1], [o.enterFrom[1], o.y]) + Math.cos(drift * 1.1 + i * 1.7) * 22;
          const rot = interpolate(p, [0, 1], [1.8, 1]);
          const depth = interpolate(z, [-750, 350], [0, 1], clamp); // 0 lejos, 1 cerca
          const blur = interpolate(depth, [0, 1], [7, 0]);
          const dim = interpolate(depth, [0, 1], [0.45, 1]);
          const spin = frame * 0.25 * (i % 2 ? 1 : -1);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: width / 2 - CARD_W / 2,
                top: height / 2 - CARD_H / 2,
                transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${o.rx * rot + Math.sin(drift + i) * 3}deg) rotateY(${o.ry * rot + spin}deg) rotateZ(${o.rz * rot}deg)`,
                filter: `blur(${blur}px) brightness(${dim})`,
                opacity: p,
              }}
            >
              <Card />
            </div>
          );
        })}
      </AbsoluteFill>

      {/* Etiquetas apiladas al centro, cada una cuando la voz la dice */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: labelsOpacity}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2}}>
          {labels.map((l) => {
            const at = wordFrame('chaos', l) - 4;
            const p = spring({frame: frame - at, fps, config: {damping: 12, stiffness: 150}});
            return (
              <div
                key={l}
                style={{
                  fontFamily: fonts.display,
                  fontWeight: 600,
                  fontSize: 112,
                  letterSpacing: '-0.03em',
                  color: colors.text,
                  textShadow: '0 10px 40px rgba(0,0,0,0.8)',
                  opacity: p,
                  transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px) scale(${interpolate(p, [0, 1], [1.4, 1])})`,
                  lineHeight: 1.05,
                }}
              >
                {l}
              </div>
            );
          })}
          {(() => {
            const p = spring({frame: frame - handAt, fps, config: {damping: 11, stiffness: 120}});
            return (
              <div
                style={{
                  marginTop: 26,
                  fontFamily: fonts.hand,
                  fontWeight: 600,
                  fontSize: 150,
                  color: colors.signalOnDark,
                  transform: `rotate(-4deg) scale(${interpolate(p, [0, 1], [0.6, 1])})`,
                  opacity: p,
                  textShadow: '0 10px 40px rgba(0,0,0,0.8)',
                }}
              >
                todo a mano
              </div>
            );
          })()}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
