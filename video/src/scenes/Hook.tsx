import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../brand/tokens';

// Escena 1: tipografía cinética "¿Qué es ZH Development?" palabra por palabra.
const Word: React.FC<{at: number; children: React.ReactNode; color?: string; size: number}> = ({
  at,
  children,
  color = colors.text,
  size,
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
        marginRight: size * 0.22,
      }}
    >
      {children}
    </span>
  );
};

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const q = spring({frame: frame - 30, fps, config: {damping: 9, stiffness: 180}});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 80}}>
      <div
        style={{
          fontFamily: fonts.display,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          textAlign: 'center',
        }}
      >
        <div>
          <Word at={0} size={120} color={colors.text2}>
            ¿Qué
          </Word>
          <Word at={6} size={120} color={colors.text2}>
            es
          </Word>
        </div>
        <div style={{marginTop: 10}}>
          <Word at={14} size={168}>
            ZH
          </Word>
        </div>
        <div>
          <Word at={22} size={150}>
            Development
          </Word>
          <span
            style={{
              display: 'inline-block',
              fontSize: 168,
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
