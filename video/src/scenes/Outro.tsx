import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../brand/tokens';
import {Logo} from '../components/Logo';

// Escena 8: logo con glow, promesa, CTA y dominio.
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const logo = spring({frame, fps, config: {damping: 14, stiffness: 90}});
  const text = spring({frame: frame - 14, fps, config: {damping: 16}});
  const cta = spring({frame: frame - 70, fps, config: {damping: 12, stiffness: 140}});
  const pulse = 1 + 0.02 * Math.sin((frame - 70) / 6) * (frame > 70 ? 1 : 0);
  const glow = 0.35 + 0.1 * Math.sin(frame / 15);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          opacity: logo,
          transform: `scale(${interpolate(logo, [0, 1], [0.7, 1])})`,
          filter: `drop-shadow(0 0 ${60}px rgba(36,92,228,${glow}))`,
          marginTop: -260,
        }}
      >
        <Logo width={520} />
      </div>
      <div
        style={{
          marginTop: 70,
          fontFamily: fonts.display,
          fontWeight: 600,
          fontSize: 64,
          letterSpacing: '-0.02em',
          color: colors.text,
          textAlign: 'center',
          lineHeight: 1.1,
          opacity: text,
          transform: `translateY(${interpolate(text, [0, 1], [30, 0])}px)`,
          padding: '0 80px',
        }}
      >
        Software a medida que
        <br />
        conecta <span style={{color: colors.signalOnDark}}>tu operación.</span>
      </div>
      <div
        style={{
          marginTop: 60,
          padding: '28px 54px',
          borderRadius: 999,
          background: colors.button,
          color: '#fff',
          fontFamily: fonts.sans,
          fontWeight: 600,
          fontSize: 42,
          boxShadow: '0 20px 60px rgba(48,107,255,0.45)',
          opacity: cta,
          transform: `scale(${interpolate(cta, [0, 1], [0.8, 1]) * pulse})`,
        }}
      >
        Agenda tu llamada de 30 min →
      </div>
      <div
        style={{
          marginTop: 40,
          fontFamily: fonts.mono,
          fontSize: 30,
          letterSpacing: '0.08em',
          color: colors.text2,
          opacity: cta,
        }}
      >
        zhdevelopment.cl · @zhdevelopment.cl
      </div>
    </AbsoluteFill>
  );
};
