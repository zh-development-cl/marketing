import React from 'react';
import {accent, fonts, ink} from '../tokens';

// Regla de tiempo horizontal 08:00 → 19:00 (ancho completo, y absoluto `top` = la línea): marcas por hora y media
// hora, horas en mono debajo, tramo recorrido iluminado en azul, cabezal (playhead) con glow y, encima, la hora
// actual grande en mono tabular que acompaña al cabezal. `hour` es decimal (8 .. 19). `glow` 0..1 intensifica el
// cabezal (p. ej. al llegar a 19:00). No anima por sí sola.

export const RULER = {x0: 80, x1: 1000, top: 456, h0: 8, h1: 19} as const;

export const xOfHour = (h: number) => RULER.x0 + ((h - RULER.h0) / (RULER.h1 - RULER.h0)) * (RULER.x1 - RULER.x0);

export const formatHour = (h: number) => {
  const hh = Math.min(RULER.h1, Math.floor(h + 1e-6));
  const mm = hh >= RULER.h1 ? 0 : Math.floor((h - hh) * 60 + 1e-6);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

export const TimeRuler: React.FC<{hour: number; glow?: number; style?: React.CSSProperties}> = ({hour, glow = 0, style}) => {
  const h = Math.max(RULER.h0, Math.min(RULER.h1, hour));
  const px = xOfHour(h);
  const hours = Array.from({length: RULER.h1 - RULER.h0 + 1}, (_, i) => RULER.h0 + i);
  const clockW = 196;
  const clockLeft = Math.max(60, Math.min(1080 - 60 - clockW, px - clockW / 2));
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 500, ...style}}>
      {/* Hora grande */}
      <div
        style={{
          position: 'absolute',
          left: clockLeft,
          top: RULER.top - 104,
          width: clockW,
          textAlign: 'center',
          fontFamily: fonts.mono,
          fontWeight: 600,
          fontSize: 64,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
          color: ink.text,
          textShadow: `0 0 ${24 + 40 * glow}px rgba(77,124,255,${0.35 + 0.45 * glow})`,
        }}
      >
        {formatHour(h)}
      </div>
      {/* Línea base */}
      <div style={{position: 'absolute', left: RULER.x0, top: RULER.top - 1, width: RULER.x1 - RULER.x0, height: 2, background: ink.line2, borderRadius: 1}} />
      {/* Tramo recorrido */}
      <div
        style={{
          position: 'absolute',
          left: RULER.x0,
          top: RULER.top - 2,
          width: Math.max(0, px - RULER.x0),
          height: 4,
          borderRadius: 2,
          background: `linear-gradient(90deg, rgba(77,124,255,0.12), ${accent.strong})`,
          boxShadow: `0 0 18px ${accent.glow}`,
        }}
      />
      {/* Marcas */}
      {hours.map((hh) => {
        const x = xOfHour(hh);
        const passed = hh <= h + 1e-6;
        return (
          <React.Fragment key={hh}>
            <div style={{position: 'absolute', left: x - 1, top: RULER.top - 12, width: 2, height: 24, background: passed ? accent.text : ink.line2, opacity: passed ? 0.9 : 1}} />
            {hh < RULER.h1 ? <div style={{position: 'absolute', left: xOfHour(hh + 0.5) - 1, top: RULER.top - 5, width: 2, height: 10, background: ink.line2}} /> : null}
            <div
              style={{
                position: 'absolute',
                left: x - 30,
                top: RULER.top + 26,
                width: 60,
                textAlign: 'center',
                fontFamily: fonts.mono,
                fontSize: 28,
                fontWeight: 500,
                fontVariantNumeric: 'tabular-nums',
                color: passed ? ink.text : ink.text3,
              }}
            >
              {String(hh).padStart(2, '0')}
            </div>
          </React.Fragment>
        );
      })}
      {/* Cabezal */}
      <div
        style={{
          position: 'absolute',
          left: px - 4,
          top: RULER.top - 32,
          width: 8,
          height: 64,
          borderRadius: 4,
          background: accent.strong,
          boxShadow: `0 0 ${22 + 30 * glow}px ${accent.glow}, 0 0 ${60 + 60 * glow}px rgba(48,107,255,${0.35 + 0.4 * glow}), inset 0 1px 0 rgba(255,255,255,0.4)`,
          transform: `scaleY(${1 + glow * 0.18})`,
        }}
      />
      <div style={{position: 'absolute', left: px - 2, top: RULER.top - 2, width: 4, height: 4, borderRadius: 2, background: '#fff'}} />
    </div>
  );
};
