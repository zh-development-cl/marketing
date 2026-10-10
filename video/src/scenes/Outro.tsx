import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../brand/tokens';
import {Logo} from '../components/Logo';
import {wordFrame} from '../timeline';

// Escena 8: logo con glow, promesa en dos líneas, CTA y dominio, cada cosa cuando la voz la dice.
const Line: React.FC<{at: number; children: React.ReactNode}> = ({at, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - at, fps, config: {damping: 14, stiffness: 150}});
  return (
    <div style={{opacity: p, transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px)`}}>{children}</div>
  );
};

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const logo = spring({frame, fps, config: {damping: 14, stiffness: 90}});
  const ctaAt = wordFrame('outro', 'Agenda') - 12;
  const cta = spring({frame: frame - ctaAt, fps, config: {damping: 12, stiffness: 140}});
  const domain = spring({frame: frame - (wordFrame('outro', 'link') - 4), fps, config: {damping: 16}});
  const pulse = frame > ctaAt + 12 ? 1 + 0.02 * Math.sin((frame - ctaAt) / 6) : 1;
  const glow = 0.35 + 0.15 * Math.sin(frame / 12);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          opacity: logo,
          transform: `scale(${interpolate(logo, [0, 1], [0.7, 1]) * interpolate(frame, [0, durationInFrames], [1, 1.06])})`,
          filter: `drop-shadow(0 0 60px rgba(36,92,228,${glow}))`,
          marginTop: -140,
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
          padding: '0 80px',
        }}
      >
        <Line at={wordFrame('outro', 'software') - 4}>Software a medida que</Line>
        <Line at={wordFrame('outro', 'conecta') - 4}>
          conecta <span style={{color: colors.signalOnDark}}>tu operación.</span>
        </Line>
      </div>
      <div
        style={{
          marginTop: 56,
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
        Agenda tu llamada de 30 min
      </div>
      <div
        style={{
          marginTop: 16,
          fontFamily: fonts.sans,
          fontWeight: 600,
          fontSize: 42,
          color: colors.text,
          opacity: cta,
          transform: `translateY(${interpolate(cta, [0, 1], [16, 0])}px)`,
        }}
      >
        Link en la bio
      </div>
      <div
        style={{
          marginTop: 28,
          fontFamily: fonts.mono,
          fontWeight: 500,
          fontSize: 36,
          letterSpacing: '0.04em',
          color: colors.text,
          opacity: domain,
          transform: `translateY(${interpolate(domain, [0, 1], [16, 0])}px)`,
        }}
      >
        zhdevelopment.cl
      </div>
    </AbsoluteFill>
  );
};
