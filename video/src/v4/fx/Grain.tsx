import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';
import {bg} from '../tokens';

// Fondo del reel: negro profundo, viñeta y grano fino que cambia cada frame (como película).
// El grano es una textura PNG (public/fx/grain.png) desplazada de forma determinista por frame.
const offsets = [
  [0, 0], [137, 61], [43, 211], [271, 97], [89, 173], [199, 29], [311, 251], [17, 131],
];

export const Backdrop: React.FC<{glow?: number}> = ({glow = 0.18}) => {
  const frame = useCurrentFrame();
  const [ox, oy] = offsets[frame % offsets.length];
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 55% at 50% 40%, ${bg.lift} 0%, ${bg.base} 55%, ${bg.deep} 100%)`}}>
      <AbsoluteFill style={{background: `radial-gradient(600px 700px at 50% 42%, rgba(48,107,255,${glow}), transparent 70%)`}} />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('fx/grain.png')})`,
          backgroundRepeat: 'repeat',
          backgroundPosition: `${ox}px ${oy}px`,
          backgroundSize: '540px 540px',
          opacity: 0.07,
          mixBlendMode: 'screen',
        }}
      />
      <AbsoluteFill style={{background: bg.vignette}} />
    </AbsoluteFill>
  );
};
