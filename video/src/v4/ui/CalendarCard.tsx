import React from 'react';
import {interpolateColors} from 'remotion';
import {accent, fonts, ink, shadow} from '../tokens';

// Calendario de implementación (900 x 620, tarjeta oscura): "noviembre 2026", cabecera lun..vie y 4 filas "semana 1..4"
// con celdas de día. `struck` = progreso del tachado, de izquierda a derecha y fila por fila: la diagonal del día k
// (0..19) se dibuja mientras `struck` recorre k..k+2, solapando con la siguiente, y en 21 están todas completas.
// El número del día se apaga y la etiqueta "semana N" se enciende con el mismo progreso (color continuo, sin
// cambios en seco). La última celda lleva la etiqueta "entrega". No anima por sí solo.

export const CALENDAR_W = 900;
export const CALENDAR_H = 620;

export type CalendarCardProps = {
  struck: number; // 0..21 progreso del tachado (la diagonal k se dibuja entre k y k+2; acepta fracciones)
  deliver?: number; // 0..1 la celda "entrega" se enciende (tinte + anillo + brillo + escala, continuo desde 0)
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
const STRIKE_SPAN = 2; // "días" de `struck` que tarda cada diagonal en dibujarse (solapa con la siguiente)

const Cell: React.FC<{day: number; strike: number; last: boolean; deliver?: number}> = ({day, strike, last, deliver = 0}) => {
  // Encendido de "entrega": todos los estilos son continuos desde d = 0 (en reposo es una celda normal), así el
  // primer frame no da un escalón de borde, tinte ni escala.
  const d = last ? clamp01(deliver) : 0;
  return (
    <div
      style={{
        position: 'relative',
        width: CELL_W,
        height: CELL_H,
        boxSizing: 'border-box',
        borderRadius: 12,
        background: '#181D28',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,${0.05 + 0.03 * d}), 0 0 0 1px rgba(255,255,255,${0.045 * (1 - d)}), 0 0 0 ${1 + d}px rgba(77,124,255,${d}), 0 0 ${30 * d}px rgba(77,124,255,${0.5 * d})`,
        transform: `scale(${1 + 0.08 * d})`,
        zIndex: last ? 2 : undefined,
        overflow: 'hidden',
      }}
    >
      {/* Tinte azul de "entrega": se funde con opacidad = d (debajo del número, la etiqueta y la diagonal) */}
      <div style={{position: 'absolute', inset: 0, borderRadius: 12, background: 'rgba(77,124,255,0.30)', opacity: d}} />
      <div
        style={{
          position: 'absolute',
          left: 16,
          top: 12,
          fontFamily: fonts.ui,
          fontWeight: 600,
          fontSize: 26,
          letterSpacing: '-0.02em',
          color: interpolateColors(strike, [0, 1], [ink.text, ink.text3]), // se apaga mientras se dibuja su diagonal
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {day}
      </div>
      {last ? (
        <div style={{position: 'absolute', left: 16, bottom: 12, fontFamily: fonts.ui, fontWeight: 600, fontSize: 23, color: accent.text, letterSpacing: '-0.005em'}}>entrega</div>
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
};

export const CalendarCard: React.FC<CalendarCardProps> = ({struck, deliver = 0, month = 'noviembre', year = '2026', firstDay = 2, style}) => {
  const done = Math.max(0, struck);
  // Progreso 0..1 de la diagonal del día k: se dibuja mientras `done` recorre k..k+STRIKE_SPAN.
  const strikeOf = (k: number) => clamp01((done - k) / STRIKE_SPAN);
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
        // "semana N" pasa de gris a acento con el mismo progreso que la diagonal de su último día (rampa, no booleano).
        const rowDone = strikeOf((r + 1) * 5 - 1);
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
                color: interpolateColors(rowDone, [0, 1], [ink.text2, accent.text]),
              }}
            >
              semana {r + 1}
            </div>
            {DAYS.map((_, c) => {
              const k = r * 5 + c;
              const strike = strikeOf(k);
              return (
                <div key={c} style={{position: 'absolute', left: GRID_X + c * (CELL_W + GAP), top}}>
                  <Cell day={firstDay + r * 7 + c} strike={strike} last={k === 19} deliver={deliver} />
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};
