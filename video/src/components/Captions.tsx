import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {colors, fonts} from '../brand/tokens';
import {Caption} from '../timeline';

// Subtítulos de la voz en off, palabra por palabra: lo dicho en blanco, la palabra actual en acento,
// lo que viene atenuado. Van sobre la zona que Instagram deja libre.
export const CAPTION_BOTTOM = 470; // px desde abajo hasta el borde inferior de la caja

export const Captions: React.FC<{items: Caption[]}> = ({items}) => {
  const frame = useCurrentFrame();
  const current = items.find((c) => frame >= c.from && frame < c.to);
  if (!current) return null;
  const opacity = interpolate(frame, [current.from, current.from + 4, current.to - 4, current.to], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(frame, [current.from, current.from + 5], [14, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: CAPTION_BOTTOM}}>
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          maxWidth: 920,
          padding: '20px 36px',
          borderRadius: 26,
          background: 'rgba(7, 9, 15, 0.78)',
          border: `1px solid ${colors.line2}`,
          fontFamily: fonts.display,
          fontWeight: 600,
          fontSize: 50,
          lineHeight: 1.18,
          letterSpacing: '-0.01em',
          textAlign: 'center',
        }}
      >
        {current.words.map((w, i) => {
          const spoken = frame >= w.to;
          const active = frame >= w.from && frame < w.to;
          const pop = active ? 1 + 0.06 * Math.max(0, 1 - (frame - w.from) / 6) : 1;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                color: active ? colors.signalOnDark : spoken ? colors.text : colors.text2,
                opacity: spoken || active ? 1 : 0.55,
                transform: `scale(${pop})`,
                marginRight: '0.26em',
                transition: 'none',
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
