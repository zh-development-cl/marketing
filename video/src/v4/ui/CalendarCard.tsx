import React from 'react';
import {accent, fonts, ink, shadow} from '../tokens';

// Calendario de implementación (900 x 620, tarjeta oscura): "noviembre 2026", cabecera lun..vie y 4 filas "semana 1..4"
// con celdas de día. `struck` = cuántos días llevan la diagonal en acento, de izquierda a derecha y fila por fila
// (fraccionario = la diagonal del siguiente día a medio dibujar). La última celda lleva la etiqueta "entrega".
// No anima por sí solo.

export const CALENDAR_W = 900;
export const CALENDAR_H = 620;

export type CalendarCardProps = {
  struck: number; // 0..20 días tachados (acepta fracciones para animar la línea que se está dibujando)
  month?: string; // "noviembre"
  year?: string; // "2026"
  firstDay?: number; // número del lunes de la semana 1 (2 → lun 2 … vie 27, noviembre 2026)
  style?: React.CSSProperties; // contenedor exterior
};

const DAYS = ['lun', 'mar', 'mié', 'jue', 'vie'];
const PAD_X = 40;
const LABEL_W = 116;
const GAP = 12;
const CELL_W = 128;
const CELL_H = 100;
const GRID_X = PAD_X + LABEL_W + GAP; // 168
const GRID_Y = 146;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const Cell: React.FC<{day: number; strike: number; last: boolean}> = ({day, strike, last}) => (
  <div
    style={{
      position: 'relative',
      width: CELL_W,
      height: CELL_H,
      boxSizing: 'border-box',
      borderRadius: 12,
      background: '#181D28',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(255,255,255,0.045)',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 16,
        top: 12,
        fontFamily: fonts.ui,
        fontWeight: 600,
        fontSize: 26,
        letterSpacing: '-0.02em',
        color: strike >= 1 ? ink.text3 : ink.text,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {day}
    </div>
    {last ? (
      <div style={{position: 'absolute', left: 16, bottom: 12, fontFamily: fonts.ui, fontWeight: 600, fontSize: 17, color: accent.text, letterSpacing: '-0.005em'}}>entrega</div>
    ) : null}
    {strike > 0 ? (
      <svg width={CELL_W} height={CELL_H} viewBox={`0 0 ${CELL_W} ${CELL_H}`} style={{position: 'absolute', inset: 0, display: 'block'}} aria-hidden>
        <line
          x1={26}
          y1={CELL_H - 20}
          x2={CELL_W - 26}
          y2={20}
          stroke={accent.strong}
          strokeWidth={5}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - clamp01(strike)}
        />
      </svg>
    ) : null}
  </div>
);

export const CalendarCard: React.FC<CalendarCardProps> = ({struck, month = 'noviembre', year = '2026', firstDay = 2, style}) => {
  const done = Math.max(0, struck);
  return (
    <div
      style={{
        position: 'relative',
        width: CALENDAR_W,
        height: CALENDAR_H,
        boxSizing: 'border-box',
        borderRadius: 22,
        background: `linear-gradient(180deg, #131824 0%, ${ink.panel} 100%)`,
        boxShadow: `${shadow.card}, inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(255,255,255,0.055)`,
        overflow: 'hidden',
        fontFamily: fonts.ui,
        color: ink.text,
        ...style,
      }}
    >
      {/* Título */}
      <div style={{position: 'absolute', left: PAD_X, top: 36, display: 'flex', alignItems: 'baseline', gap: 14, lineHeight: 1}}>
        <div style={{fontWeight: 700, fontSize: 44, letterSpacing: '-0.025em'}}>{month}</div>
        <div style={{fontWeight: 400, fontSize: 44, letterSpacing: '-0.02em', color: ink.text3}}>{year}</div>
      </div>

      {/* Cabecera de días */}
      {DAYS.map((d, i) => (
        <div
          key={d}
          style={{
            position: 'absolute',
            left: GRID_X + i * (CELL_W + GAP),
            top: 110,
            width: CELL_W,
            textAlign: 'center',
            fontWeight: 500,
            fontSize: 21,
            color: ink.text2,
            letterSpacing: '-0.005em',
          }}
        >
          {d}
        </div>
      ))}

      {/* Filas */}
      {[0, 1, 2, 3].map((r) => {
        const top = GRID_Y + r * (CELL_H + GAP);
        const rowDone = done >= (r + 1) * 5;
        return (
          <React.Fragment key={r}>
            <div
              style={{
                position: 'absolute',
                left: PAD_X,
                top,
                width: LABEL_W,
                height: CELL_H,
                display: 'flex',
                alignItems: 'center',
                fontWeight: 500,
                fontSize: 22,
                letterSpacing: '-0.01em',
                color: rowDone ? accent.text : ink.text2,
              }}
            >
              semana {r + 1}
            </div>
            {DAYS.map((_, c) => {
              const k = r * 5 + c;
              const strike = clamp01(done - k);
              return (
                <div key={c} style={{position: 'absolute', left: GRID_X + c * (CELL_W + GAP), top}}>
                  <Cell day={firstDay + r * 7 + c} strike={strike} last={k === 19} />
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};
