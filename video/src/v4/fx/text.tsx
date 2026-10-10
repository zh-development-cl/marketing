import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {fonts, ink} from '../tokens';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Un bloque que entra con desenfoque → nítido, leve subida y opacidad. Base de casi todas las apariciones.
export const BlurIn: React.FC<{at: number; dur?: number; dy?: number; children: React.ReactNode; style?: React.CSSProperties; out?: number}> = ({
  at,
  dur = 7,
  dy = 14,
  children,
  style,
  out,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + dur], [0, 1], clamp);
  const q = out === undefined ? 1 : interpolate(frame, [out, out + 5], [1, 0], clamp);
  const b = (1 - p) * 10 + (1 - q) * 10;
  return (
    <div
      style={{
        opacity: p * q,
        filter: b > 0.3 ? `blur(${b}px)` : undefined,
        transform: `translateY(${(1 - p) * dy}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Pop con resorte: escala desde chico con un poco de desenfoque al inicio.
export const Pop: React.FC<{at: number; from?: number; children: React.ReactNode; style?: React.CSSProperties; config?: {damping?: number; stiffness?: number; mass?: number}}> = ({
  at,
  from = 0.6,
  children,
  style,
  config = {damping: 12, stiffness: 170},
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - at, fps, config});
  const b = Math.max(0, 1 - p) * 8;
  return (
    <div
      style={{
        opacity: Math.min(1, p * 1.6),
        transform: `scale(${interpolate(p, [0, 1], [from, 1])})`,
        filter: b > 0.3 ? `blur(${b}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Texto palabra por palabra. `words` con tiempo de entrada (frames) por palabra; **negrita** se marca con el flag bold.
export type TWord = {text: string; at: number; bold?: boolean; color?: string};

export const Typewriter: React.FC<{
  words: TWord[];
  size: number;
  weight?: number;
  boldWeight?: number;
  family?: string;
  color?: string;
  lineHeight?: number;
  letterSpacing?: string;
  gap?: string;
  style?: React.CSSProperties;
}> = ({words, size, weight = 400, boldWeight = 700, family = fonts.sans, color = ink.text, lineHeight = 1.15, letterSpacing = '-0.01em', gap = '0.26em', style}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{fontFamily: family, fontSize: size, lineHeight, letterSpacing, color, ...style}}>
      {words.map((w, i) => {
        const p = interpolate(frame, [w.at, w.at + 6], [0, 1], clamp);
        const b = (1 - p) * 8;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              marginRight: gap,
              fontWeight: w.bold ? boldWeight : weight,
              color: w.color ?? color,
              opacity: p,
              filter: b > 0.3 ? `blur(${b}px)` : undefined,
              transform: `translateY(${(1 - p) * 10}px)`,
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

// Reparte una frase en palabras con entradas cada `every` frames desde `at`. "**palabra**" => negrita.
export const spreadWords = (text: string, at: number, every = 4): TWord[] =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .map((raw, i) => {
      const bold = /^\*\*.*\*\*$/.test(raw);
      return {text: raw.replace(/\*\*/g, ''), at: at + i * every, bold};
    });

// Etiqueta "paso 0N" + título en minúsculas, como en la referencia: etiqueta pequeña en acento arriba, título bold grande.
export const StepTitle: React.FC<{n: string; title: string; at: number; out?: number; top?: number; accentColor?: string}> = ({n, title, at, out, top = 250, accentColor = '#8FB0FF'}) => {
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center'}}>
      <BlurIn at={at} out={out} dy={10}>
        <div style={{fontFamily: fonts.sans, fontWeight: 500, fontSize: 34, color: accentColor, letterSpacing: '0.01em'}}>paso {n}</div>
      </BlurIn>
      <BlurIn at={at + 3} out={out} dy={18}>
        <div style={{fontFamily: fonts.display, fontWeight: 700, fontSize: 132, letterSpacing: '-0.035em', color: ink.text, lineHeight: 1.05, marginTop: 4}}>
          {title}
        </div>
      </BlurIn>
    </div>
  );
};

// Etiqueta inferior "patrón N" + texto, centrada abajo.
export const BottomLabel: React.FC<{small: string; big: string; at: number; out?: number; bottom?: number}> = ({small, big, at, out, bottom = 560}) => (
  <div style={{position: 'absolute', bottom, left: 0, right: 0, textAlign: 'center'}}>
    <BlurIn at={at} out={out} dy={8}>
      <div style={{fontFamily: fonts.sans, fontWeight: 500, fontSize: 30, color: '#8FB0FF'}}>{small}</div>
    </BlurIn>
    <BlurIn at={at + 2} out={out} dy={14}>
      <div style={{fontFamily: fonts.display, fontWeight: 600, fontSize: 72, letterSpacing: '-0.02em', color: ink.text, marginTop: 6}}>{big}</div>
    </BlurIn>
  </div>
);
