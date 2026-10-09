import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../brand/tokens';

// Etiqueta "paso 0N" + título de la etapa, arriba de la escena.
export const StepLabel: React.FC<{n: string; title: string; subtitle?: string}> = ({n, title, subtitle}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame, fps, config: {damping: 16, stiffness: 120}});
  const line = spring({frame: frame - 6, fps, config: {damping: 18}});
  return (
    <div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center'}}>
      <div
        style={{
          display: 'inline-block',
          fontFamily: fonts.mono,
          fontWeight: 500,
          fontSize: 30,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: colors.signalOnDark,
          border: `2px solid ${colors.line2}`,
          borderRadius: 999,
          padding: '12px 28px',
          opacity: p,
          transform: `translateY(${interpolate(p, [0, 1], [20, 0])}px)`,
        }}
      >
        paso {n}
      </div>
      <div
        style={{
          marginTop: 22,
          fontFamily: fonts.display,
          fontWeight: 600,
          fontSize: 110,
          letterSpacing: '-0.02em',
          color: colors.text,
          opacity: line,
          transform: `scale(${interpolate(line, [0, 1], [0.9, 1])})`,
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            marginTop: 8,
            fontFamily: fonts.sans,
            fontSize: 38,
            color: colors.text2,
            opacity: line,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
};
