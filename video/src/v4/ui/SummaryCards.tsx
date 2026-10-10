import React from 'react';
import {fonts, ink} from '../tokens';

// Resumen del panel (900 x 120, tarjeta OSCURA, sobria): tres métricas grandes en blanco con etiqueta mono chica
// ("22 leads", "62 respondidos", "7 por cobrar") separadas por líneas finas, y a la derecha una nota breve en acento
// ("3 facturas por cobrar · recordatorio enviado"). Sin colores pastel: sigue la paleta del panel de arriba.
// `progress` 0..1 hace aparecer las métricas de izquierda a derecha (sin valor = todo visible).

export const SUMMARY_W = 900;
export const SUMMARY_H = 120;

export type SummaryCardsProps = {
  progress?: number; // 0..1 entrada escalonada; sin valor = 1
  style?: React.CSSProperties; // contenedor exterior
};

const METRICS: Array<{value: string; label: string}> = [
  {value: '22', label: 'leads nuevos'},
  {value: '62', label: 'respondidos'},
  {value: '7', label: 'por cobrar'},
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const enter = (t: number): React.CSSProperties => ({opacity: t, transform: `translateY(${(1 - t) * 8}px)`});

export const SummaryCards: React.FC<SummaryCardsProps> = ({progress = 1, style}) => {
  return (
    <div
      style={{
        position: 'relative',
        width: SUMMARY_W,
        height: SUMMARY_H,
        boxSizing: 'border-box',
        borderRadius: 16,
        background: 'linear-gradient(180deg, #151A25 0%, #10141C 100%)',
        boxShadow: '0 24px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(255,255,255,0.07)',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        fontFamily: fonts.ui,
        color: ink.text,
        overflow: 'hidden',
        ...style,
      }}
    >
      {METRICS.map((m, i) => {
        const t = clamp01((progress - i * 0.14) / 0.4);
        return (
          <div key={m.label} style={{display: 'flex', alignItems: 'baseline', gap: 12, paddingRight: i < METRICS.length - 1 ? 44 : 0, marginRight: i < METRICS.length - 1 ? 44 : 0, borderRight: i < METRICS.length - 1 ? '1px solid rgba(255,255,255,0.09)' : 'none', ...enter(t)}}>
            <div style={{fontFamily: fonts.display, fontWeight: 700, fontSize: 44, letterSpacing: '-0.03em', color: ink.text, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>{m.value}</div>
            <div style={{fontFamily: fonts.mono, fontSize: 21, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink.text2, whiteSpace: 'nowrap'}}>{m.label}</div>
          </div>
        );
      })}
    </div>
  );
};
