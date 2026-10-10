import React from 'react';

// Flecha de cursor de macOS (SVG, blanca con borde negro, ~44 px de alto). La punta queda en la esquina superior
// izquierda del bloque. `pressed` lo escala a 0.9 desde la punta (clic). No anima solo.

export type CursorProps = {
  pressed?: boolean;
  size?: number; // alto en px (44)
  style?: React.CSSProperties;
};

export const Cursor: React.FC<CursorProps> = ({pressed = false, size = 44, style}) => {
  const w = size * (24 / 32);
  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: size,
        transform: `scale(${pressed ? 0.9 : 1})`,
        transformOrigin: '12.5% 6%',
        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5)) drop-shadow(0 6px 10px rgba(0,0,0,0.35))',
        ...style,
      }}
    >
      <svg width={w} height={size} viewBox="0 0 24 32" style={{display: 'block', overflow: 'visible'}}>
        <path
          d="M3 2 L3 25.2 L8.7 19.9 L12.3 28.6 L17.4 26.4 L13.8 17.8 L21.2 17.8 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
