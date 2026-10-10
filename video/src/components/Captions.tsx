import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {colors, fonts} from '../brand/tokens';
import {Caption} from '../timeline';

// Subtítulos de la voz en off, palabra por palabra: lo dicho en blanco, la palabra actual en acento,
// lo que viene atenuado. Caja de 840 px (x 120 a 960) sobre la zona que Instagram deja libre:
// con dos líneas ocupa como máximo y 1302 a 1450, así que el contenido de escena debe terminar en y 1290.
export const CAPTION_BOTTOM = 470; // px desde abajo hasta el borde inferior de la caja

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const Captions: React.FC<{items: Caption[]}> = ({items}) => {
  const frame = useCurrentFrame();
  const current = items.find((c) => frame >= c.from && frame < c.to);
  if (!current) return null;
  const opacity = current.hold
    ? interpolate(frame, [current.from, current.from + 4], [0, 1], clamp)
    : interpolate(frame, [current.from, current.from + 4, current.to - 4, current.to], [0, 1, 1, 0], clamp);
  const y = interpolate(frame, [current.from, current.from + 5], [14, 0], clamp);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: CAPTION_BOTTOM}}>
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          maxWidth: 840,
          padding: '18px 32px',
          borderRadius: 26,
          background: 'rgba(7, 9, 15, 0.78)',
          border: `1px solid ${colors.line2}`,
          fontFamily: fonts.display,
          fontWeight: 600,
          fontSize: 46,
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
                opacity: spoken || active ? 1 : 0.8,
                transform: `scale(${pop})`,
                marginRight: '0.26em',
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
