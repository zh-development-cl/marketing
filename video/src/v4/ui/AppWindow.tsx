import React from 'react';
import {accent, fonts, ink, status} from '../tokens';
import {LogoDraw} from './LogoDraw';

// Ventana de app "Tu Empresa · sistema" (880 x 720): marco oscuro tipo navegador con tres puntos, monograma ZH en la
// barra de título, píldora "en línea" y tres columnas con cabecera (cotizaciones · stock · cobros), contador por
// columna y un check verde al pie (`check` 0..1 lo escala). No anima por sí sola; las tarjetas de cada columna las
// coloca la escena encima usando la geometría exportada en WINDOW (columnLeft / slotTop).

export const WINDOW = {
  x: 100,
  y: 486,
  w: 880,
  h: 700,
  titleH: 64,
  pad: 28,
  colGap: 24,
  headerTop: 88, // y relativo de la cabecera de columna
  slotTop: 152, // y relativo del primer slot de tarjeta
  slotStep: 68, // separación vertical entre tarjetas apiladas (se solapan)
  checkCY: 636, // centro del check al pie de cada columna
  cardScale: 0.66, // escala de las tarjetas dentro de la ventana
} as const;

export const COL_W = Math.floor((WINDOW.w - WINDOW.pad * 2 - WINDOW.colGap * 2) / 3);
export const columnLeft = (c: number) => WINDOW.x + WINDOW.pad + c * (COL_W + WINDOW.colGap);
export const slotTop = (k: number) => WINDOW.y + WINDOW.slotTop + k * WINDOW.slotStep;

export type WindowColumn = {label: string; color: string; count: number; check: number};

export const AppWindow: React.FC<{columns: WindowColumn[]; company?: string; style?: React.CSSProperties}> = ({columns, company = 'Tu Empresa', style}) => (
  <div
    style={{
      position: 'relative',
      width: WINDOW.w,
      height: WINDOW.h,
      borderRadius: 24,
      background: 'linear-gradient(180deg, #131823 0%, #0C1017 100%)',
      boxShadow: '0 60px 140px rgba(0,0,0,0.75), 0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.09), 0 0 120px rgba(48,107,255,0.14)',
      overflow: 'hidden',
      fontFamily: fonts.sans,
      ...style,
    }}
  >
    {/* Barra de título */}
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: WINDOW.titleH, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 18, borderBottom: `1px solid ${ink.line}`, background: 'rgba(255,255,255,0.025)'}}>
      <div style={{display: 'flex', gap: 9}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c, opacity: 0.9}} />
        ))}
      </div>
      <div style={{width: 1, height: 28, background: ink.line2, marginLeft: 4}} />
      <LogoDraw width={46} draw={1} fill={1} accentIn={1} />
      <div style={{fontSize: 27, fontWeight: 600, color: ink.text, letterSpacing: '-0.01em', whiteSpace: 'nowrap'}}>
        {company} <span style={{color: ink.text3, fontWeight: 500}}>· sistema</span>
      </div>
      <div style={{flex: 1}} />
      <div style={{display: 'flex', alignItems: 'center', gap: 9, padding: '6px 14px 6px 11px', borderRadius: 999, background: 'rgba(61,214,140,0.12)', border: '1px solid rgba(61,214,140,0.35)'}}>
        <div style={{width: 10, height: 10, borderRadius: 5, background: status.ok, boxShadow: `0 0 10px ${status.ok}`}} />
        <div style={{fontFamily: fonts.mono, fontSize: 26, color: status.ok, letterSpacing: '0.04em'}}>en línea</div>
      </div>
    </div>

    {/* Columnas */}
    {columns.map((col, c) => {
      const left = WINDOW.pad + c * (COL_W + WINDOW.colGap);
      return (
        <React.Fragment key={col.label}>
          <div style={{position: 'absolute', left, top: WINDOW.headerTop, width: COL_W, display: 'flex', alignItems: 'center', gap: 10}}>
            <div style={{fontSize: 28, fontWeight: 600, color: col.color, letterSpacing: '-0.01em'}}>{col.label}</div>
            <div style={{flex: 1}} />
            <div style={{fontFamily: fonts.mono, fontSize: 24, fontWeight: 500, color: ink.text2, background: 'rgba(255,255,255,0.06)', borderRadius: 999, padding: '2px 11px', minWidth: 22, textAlign: 'center', fontVariantNumeric: 'tabular-nums'}}>
              {col.count}
            </div>
          </div>
          <div style={{position: 'absolute', left, top: WINDOW.headerTop + 44, width: COL_W, height: 2, background: col.color, opacity: 0.5, borderRadius: 1}} />
          {/* fondo tenue de la columna */}
          <div style={{position: 'absolute', left, top: WINDOW.headerTop + 54, width: COL_W, bottom: 20, borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: `1px solid ${ink.line}`}} />
          {/* check al pie */}
          {col.check > 0.001 ? (
            <div
              style={{
                position: 'absolute',
                left: left + COL_W / 2 - 24,
                top: WINDOW.checkCY - 24,
                width: 48,
                height: 48,
                borderRadius: 24,
                background: status.ok,
                boxShadow: `0 0 ${30 * col.check}px rgba(61,214,140,0.6), 0 8px 20px rgba(0,0,0,0.4)`,
                transform: `scale(${col.check})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#06110B" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12.5 L9.5 18 L20 6.5" />
              </svg>
            </div>
          ) : null}
        </React.Fragment>
      );
    })}
    {/* Brillo superior sutil */}
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 200, background: `linear-gradient(180deg, rgba(77,124,255,0.07), transparent)`, pointerEvents: 'none'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: WINDOW.titleH, height: 1, background: `linear-gradient(90deg, transparent, ${accent.strong}55, transparent)`}} />
  </div>
);
