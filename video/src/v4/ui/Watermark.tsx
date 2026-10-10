import React from 'react';
import {fonts, watermark} from '../tokens';

// Marca de agua que acompaña todo el reel: ícono de Instagram en trazo blanco y debajo "@ZHDEVELOPMENT.CL" en mono.
// `x` es el centro horizontal del bloque y `y` el borde superior (px del lienzo). Por defecto usa tokens.watermark.

export type WatermarkProps = {
  x?: number;
  y?: number;
  opacity?: number;
  handle?: string;
  iconSize?: number; // 44
  style?: React.CSSProperties;
};

export const InstagramOutline: React.FC<{size?: number; color?: string; strokeWidth?: number}> = ({size = 44, color = '#FFFFFF', strokeWidth = 3}) => (
  <svg width={size} height={size} viewBox="0 0 44 44" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
    <rect x="3" y="3" width="38" height="38" rx="11" />
    <circle cx="22" cy="22" r="9" />
    <circle cx="32.6" cy="11.4" r="1.4" fill={color} stroke="none" />
  </svg>
);

export const Watermark: React.FC<WatermarkProps> = ({x = watermark.x, y = watermark.y, opacity = 1, handle = watermark.handle, iconSize = 44, style}) => (
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
    <InstagramOutline size={iconSize} />
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
