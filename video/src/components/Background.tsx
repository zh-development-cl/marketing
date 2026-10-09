import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {colors} from '../brand/tokens';

// Fondo de marca: degradado oscuro, grilla sutil y un halo azul que respira.
export const Background: React.FC<{glowX?: number; glowY?: number; intensity?: number}> = ({
  glowX = 50,
  glowY = 45,
  intensity = 0.3,
}) => {
  const frame = useCurrentFrame();
  const breathe = 1 + 0.06 * Math.sin(frame / 22);
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${colors.ink1} 0%, ${colors.ink0} 100%)`}}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(to right, ${colors.line} 1px, transparent 1px), linear-gradient(to bottom, ${colors.line} 1px, transparent 1px)`,
          backgroundSize: '90px 90px',
          backgroundPosition: `${interpolate(frame, [0, 900], [0, -90])}px 0`,
          opacity: 0.35,
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 30%, transparent 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(${700 * breathe}px ${600 * breathe}px at ${glowX}% ${glowY}%, rgba(36,92,228,${intensity}), transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};
