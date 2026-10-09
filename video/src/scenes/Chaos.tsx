import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../brand/tokens';
import {ALL_CARDS, CARD_H, CARD_W} from '../components/Cards';

// Escena 3: caos. Tarjetas flotando en 3D con desenfoque de profundidad y etiquetas que se apilan.
type Orbit = {x: number; y: number; z: number; rx: number; ry: number; rz: number; enterFrom: [number, number]; at: number};

const orbits: Orbit[] = [
  {x: -330, y: -560, z: -200, rx: 18, ry: -28, rz: -8, enterFrom: [-900, -600], at: 0},
  {x: 320, y: -520, z: 120, rx: -12, ry: 24, rz: 6, enterFrom: [900, -700], at: 4},
  {x: -300, y: 380, z: 60, rx: -16, ry: 30, rz: 10, enterFrom: [-900, 500], at: 8},
  {x: 340, y: 460, z: -260, rx: 20, ry: -22, rz: -6, enterFrom: [900, 700], at: 12},
  {x: -60, y: -180, z: -520, rx: 10, ry: 14, rz: 14, enterFrom: [-200, -1200], at: 16},
  {x: 120, y: 760, z: -420, rx: -8, ry: -18, rz: -12, enterFrom: [300, 1300], at: 20},
  {x: 400, y: 60, z: -600, rx: 24, ry: 40, rz: 4, enterFrom: [1100, 100], at: 24},
  {x: -420, y: -60, z: -650, rx: -22, ry: -36, rz: -4, enterFrom: [-1100, -100], at: 28},
];

const labels = ['mensajes', 'planillas', 'correos', 'cobros'];

export const Chaos: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{perspective: 1500, perspectiveOrigin: '50% 50%'}}>
        {orbits.map((o, i) => {
          const Card = ALL_CARDS[i % ALL_CARDS.length];
          const p = spring({frame: frame - o.at, fps, config: {damping: 20, stiffness: 60, mass: 1.2}});
          const drift = frame / 30;
          const x = interpolate(p, [0, 1], [o.enterFrom[0], o.x]) + Math.sin(drift * 1.3 + i) * 18;
          const y = interpolate(p, [0, 1], [o.enterFrom[1], o.y]) + Math.cos(drift * 1.1 + i * 1.7) * 22;
          const rot = interpolate(p, [0, 1], [1.8, 1]);
          const depth = (o.z + 650) / 1300; // 0 lejos, 1 cerca
          const blur = interpolate(depth, [0, 1], [7, 0]);
          const dim = interpolate(depth, [0, 1], [0.45, 1]);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: width / 2 - CARD_W / 2,
                top: height / 2 - CARD_H / 2,
                transform: `translate3d(${x}px, ${y}px, ${o.z}px) rotateX(${o.rx * rot + Math.sin(drift + i) * 3}deg) rotateY(${o.ry * rot + Math.cos(drift * 0.8 + i) * 4}deg) rotateZ(${o.rz * rot}deg)`,
                filter: `blur(${blur}px) brightness(${dim})`,
                opacity: p,
              }}
            >
              <Card />
            </div>
          );
        })}
      </AbsoluteFill>

      {/* Etiquetas apiladas al centro */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2}}>
          {labels.map((l, i) => {
            const at = 18 + i * 18;
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
            const p = spring({frame: frame - 96, fps, config: {damping: 11, stiffness: 120}});
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
