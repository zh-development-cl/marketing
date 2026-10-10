import React from 'react';
import {interpolateColors} from 'remotion';
import {accent, fonts, ink} from '../tokens';

// Regla de tiempo horizontal 08:00 → 19:00 (ancho completo, y absoluto `top` = la línea): marcas por hora y media
// hora, horas en mono debajo, tramo recorrido iluminado en azul, cabezal (playhead) con glow y, encima, la hora
// actual grande en mono tabular que acompaña al cabezal. `hour` es decimal (8 .. 19). `glow` 0..1 intensifica el
// cabezal (p. ej. al llegar a 19:00). `lit(hh)` 0..1 dice cuánto está encendida cada hora (marca y número): por
// defecto se enciende en los ~20 min previos a que el cabezal la cruce; Day la pasa en frames para que dure lo mismo
// a cualquier velocidad. `clock` trae el string anterior del reloj grande y el progreso del fundido cruzado hacia el
// actual (ver rollOf). No anima por sí sola.

export const RULER = {x0: 80, x1: 1000, top: 456, h0: 8, h1: 19} as const;

export const xOfHour = (h: number) => RULER.x0 + ((h - RULER.h0) / (RULER.h1 - RULER.h0)) * (RULER.x1 - RULER.x0);

export const formatHour = (h: number) => {
  const hh = Math.min(RULER.h1, Math.floor(h + 1e-6));
  const mm = hh >= RULER.h1 ? 0 : Math.floor((h - hh) * 60 + 1e-6);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Texto que cambia de valor con fundido cruzado en vez de en seco: `prev` se apaga mientras `next` se enciende con
// `roll` 0..1. Se funde carácter por carácter (cifras tabulares: cada posición mide lo mismo) y los caracteres que
// no cambian se dibujan una sola vez a opacidad completa, así "18:3" no parpadea mientras rueda el último dígito.
// Hereda fuente, tamaño, color y sombra del padre; sin cambio de layout.
export const RollText: React.FC<{prev: string; next: string; roll: number; style?: React.CSSProperties}> = ({prev, next, roll, style}) => {
  const k = clamp01(roll);
  const n = Math.max(prev.length, next.length);
  return (
    <span style={{display: 'inline-block', whiteSpace: 'pre', fontVariantNumeric: 'tabular-nums', ...style}}>
      {Array.from({length: n}, (_, i) => {
        const a = prev[i] ?? '';
        const b = next[i] ?? '';
        if (a === b || k >= 1) return <span key={i}>{b}</span>;
        if (k <= 0) return <span key={i}>{a}</span>;
        return (
          <span key={i} style={{position: 'relative', display: 'inline-block'}}>
            <span style={{opacity: k}}>{b}</span>
            <span style={{position: 'absolute', left: 0, top: 0, opacity: 1 - k}}>{a}</span>
          </span>
        );
      })}
    </span>
  );
};

// Para RollText: string actual, el anterior y el progreso del fundido entre ambos. Retrocede frame a frame (como
// mucho `dur`) hasta encontrar el último cambio; el fundido es lineal y dura `dur` frames desde el frame del cambio
// (con dur = 3: 1/3 · 2/3 · 1). Si el texto cambia todos los frames, cada frame mezcla los dos valores vecinos
// (se lee como rodillo), y al detenerse se asienta en 2 frames.
export const rollOf = (frame: number, textAt: (f: number) => string, dur = 3) => {
  const next = textAt(frame);
  for (let back = 1; back <= dur; back++) {
    const prev = textAt(frame - back);
    if (prev !== next) return {prev, next, roll: clamp01(back / dur)};
  }
  return {prev: next, next, roll: 1};
};

export const TimeRuler: React.FC<{
  hour: number;
  glow?: number;
  style?: React.CSSProperties;
  lit?: (hh: number) => number;
  clock?: {prev: string; roll: number};
}> = ({hour, glow = 0, style, lit, clock}) => {
  const h = Math.max(RULER.h0, Math.min(RULER.h1, hour));
  const px = xOfHour(h);
  const hours = Array.from({length: RULER.h1 - RULER.h0 + 1}, (_, i) => RULER.h0 + i);
  const litOf = lit ?? ((hh: number) => clamp01((h - hh) * 3 + 1));
  const clockW = 196;
  const clockLeft = Math.max(60, Math.min(1080 - 60 - clockW, px - clockW / 2));
  const text = formatHour(h);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 500, ...style}}>
      {/* Hora grande (con fundido cruzado entre un string y el siguiente cuando llega `clock`) */}
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
        {clock ? <RollText prev={clock.prev} next={text} roll={clock.roll} /> : text}
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
      {/* Marcas: cada hora se enciende con rampa continua (k 0..1), no con un booleano */}
      {hours.map((hh) => {
        const x = xOfHour(hh);
        const k = clamp01(litOf(hh));
        return (
          <React.Fragment key={hh}>
            <div style={{position: 'absolute', left: x - 1, top: RULER.top - 12, width: 2, height: 24, background: interpolateColors(k, [0, 1], [ink.line2, accent.text]), opacity: 1 - 0.1 * k}} />
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
                color: interpolateColors(k, [0, 1], [ink.text3, ink.text]),
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
