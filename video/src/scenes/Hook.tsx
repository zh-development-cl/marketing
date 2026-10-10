import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../brand/tokens';
import {wordFrame} from '../timeline';

// Escena 1: tipografía cinética "¿Qué es ZH Development?" palabra por palabra, al ritmo de la voz.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Word: React.FC<{at: number; children: React.ReactNode; color?: string; size: number; tight?: boolean}> = ({
  at,
  children,
  color = colors.text,
  size,
  tight,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - at, fps, config: {damping: 13, stiffness: 160, mass: 0.8}});
  return (
    <span
      style={{
        display: 'inline-block',
        color,
        fontSize: size,
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [60, 0])}px) scale(${interpolate(p, [0, 1], [0.7, 1])})`,
        marginRight: tight ? 0 : size * 0.22,
      }}
    >
      {children}
    </span>
  );
};

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const devAt = wordFrame('hook', 'Development') - 6;
  const q = spring({frame: frame - (devAt + 14), fps, config: {damping: 9, stiffness: 180}});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: '80px 80px 440px'}}>
      <div
        style={{
          transform: `scale(${interpolate(frame, [0, 90], [1, 1.07])}) translateY(${interpolate(frame, [40, 70], [0, -30], clamp)}px)`,
          fontFamily: fonts.display,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          textAlign: 'center',
        }}
      >
        <div>
          <Word at={wordFrame('hook', 'Qué') - 16} size={112} color={colors.text2}>
            ¿Qué
          </Word>
          <Word at={wordFrame('hook', 'es') - 8} size={112} color={colors.text2}>
            es
          </Word>
        </div>
        <div style={{marginTop: 10}}>
          <Word at={wordFrame('hook', 'ZH') - 6} size={160}>
            ZH
          </Word>
        </div>
        <div>
          <Word at={devAt} size={132} tight>
            Development
          </Word>
          <span
            style={{
              display: 'inline-block',
              fontSize: 132,
              color: colors.signalOnDark,
              opacity: q,
              transform: `scale(${interpolate(q, [0, 1], [2.2, 1])}) rotate(${interpolate(q, [0, 1], [-20, 0])}deg)`,
            }}
          >
            ?
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
