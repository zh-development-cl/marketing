import React, {useId} from 'react';
import {fonts, watermark} from '../tokens';

// Marca de agua que acompaña todo el reel: ícono de Instagram en trazo blanco y debajo "@ZHDEVELOPMENT.CL" en mono.
// `x` es el centro horizontal del bloque y `y` el borde superior (px del lienzo). Por defecto usa tokens.watermark.

export type WatermarkProps = {
  x?: number;
  y?: number;
  opacity?: number;
  handle?: string;
  iconSize?: number; // 44
  color?: number; // 0..1 cuánto del degradado de Instagram muestra el ícono (0 = blanco, 1 = color)
  style?: React.CSSProperties;
};

// Ícono de Instagram en trazo (outline). `color` es un string CSS del trazo.
export const InstagramOutline: React.FC<{size?: number; color?: string; strokeWidth?: number}> = ({size = 44, color = '#FFFFFF', strokeWidth = 3}) => (
  <svg width={size} height={size} viewBox="0 0 44 44" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
    <rect x="3" y="3" width="38" height="38" rx="11" />
    <circle cx="22" cy="22" r="9" />
    <circle cx="32.6" cy="11.4" r="1.4" fill={color} stroke="none" />
  </svg>
);

// Ícono de Instagram en trazo que pasa de blanco al degradado oficial: `color` 0..1 (como al cierre de la referencia).
export const InstagramGlyph: React.FC<{size?: number; color?: number; strokeWidth?: number; style?: React.CSSProperties}> = ({size = 44, color = 0, strokeWidth = 3, style}) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const c = Math.max(0, Math.min(1, color));
  const shape = (stroke: string, opacity: number) => (
    <g stroke={stroke} opacity={opacity} fill="none" strokeWidth={strokeWidth} strokeLinecap="round">
      <rect x="3" y="3" width="38" height="38" rx="11" />
      <circle cx="22" cy="22" r="9" />
      <circle cx="32.6" cy="11.4" r="1.4" fill={stroke} stroke="none" />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" style={{display: 'block', ...style}}>
      <defs>
        <radialGradient id={`${id}ig`} gradientUnits="userSpaceOnUse" cx="6" cy="44" r="54">
          <stop offset="0" stopColor="#FFD676" />
          <stop offset="0.3" stopColor="#FF7A3D" />
          <stop offset="0.55" stopColor="#E1306C" />
          <stop offset="0.8" stopColor="#8E3BE0" />
          <stop offset="1" stopColor="#4F5BD5" />
        </radialGradient>
      </defs>
      {c < 1 ? shape('#FFFFFF', 1 - c) : null}
      {c > 0 ? shape(`url(#${id}ig)`, c) : null}
    </svg>
  );
};

export const Watermark: React.FC<WatermarkProps> = ({x = watermark.x, y = watermark.y, opacity = 1, handle = watermark.handle, iconSize = 44, color = 0, style}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: 'translateX(-50%)',
      opacity,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      pointerEvents: 'none',
      filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.55))',
      ...style,
    }}
  >
    <InstagramGlyph size={iconSize} color={color} />
    <div
      style={{
        fontFamily: fonts.mono,
        fontWeight: 500,
        fontSize: 20,
        letterSpacing: '0.08em',
        color: '#FFFFFF',
        whiteSpace: 'nowrap',
        lineHeight: 1,
        // compensa el tracking que se añade después del último carácter
        marginRight: '-0.08em',
      }}
    >
      {handle}
    </div>
  </div>
);
