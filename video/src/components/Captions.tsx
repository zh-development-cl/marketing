import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {colors, fonts} from '../brand/tokens';
import {Caption} from '../timeline';

// Subtítulos de la voz en off, abajo, siempre legibles.
export const Captions: React.FC<{items: Caption[]}> = ({items}) => {
  const frame = useCurrentFrame();
  const current = items.find((c) => frame >= c.from && frame < c.to);
  if (!current) return null;
  const opacity = interpolate(
    frame,
    [current.from, current.from + 5, current.to - 4, current.to],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const y = interpolate(frame, [current.from, current.from + 6], [10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 380}}>
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          maxWidth: 880,
          padding: '18px 34px',
          borderRadius: 22,
          background: 'rgba(7, 9, 15, 0.72)',
          border: `1px solid ${colors.line2}`,
          color: colors.text,
          fontFamily: fonts.sans,
          fontWeight: 500,
          fontSize: 40,
          lineHeight: 1.25,
          textAlign: 'center',
        }}
      >
        {current.text}
      </div>
    </AbsoluteFill>
  );
};
