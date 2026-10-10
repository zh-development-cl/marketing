import React from 'react';
import {fonts} from '../tokens';

// Resumen del panel (900 x 130, contenedor blanco): fila de 4 mini tarjetas pastel (verde, celeste, amarillo, rosa)
// con ícono circular y número grande ("22 leads", "62 respondidos", "26 % ocupación", "7 por cobrar") y debajo la
// franja "QUIÉN DEBE SEPTIEMBRE · 3 facturas" con botón verde "Recordar el pago".
// `progress` 0..1 hace aparecer las tarjetas de izquierda a derecha y luego la franja (sin valor = todo visible).

export const SUMMARY_W = 900;
export const SUMMARY_H = 130;

export type SummaryCardsProps = {
  progress?: number; // 0..1 entrada escalonada (tarjetas 1→4, después la franja); sin valor = 1
  style?: React.CSSProperties; // contenedor exterior
};

type Tile = {value: string; label: string; bg: string; icon: string; glyph: 'person' | 'chat' | 'pie' | 'bill'};
const TILES: Tile[] = [
  {value: '22', label: 'leads', bg: '#DDF5E6', icon: '#1FA463', glyph: 'person'},
  {value: '62', label: 'respondidos', bg: '#DCEDFB', icon: '#2A7FD5', glyph: 'chat'},
  {value: '26 %', label: 'ocupación', bg: '#FBF0CC', icon: '#D9970F', glyph: 'pie'},
  {value: '7', label: 'por cobrar', bg: '#FBE0E9', icon: '#D63D7A', glyph: 'bill'},
];

const INK = '#1C1F26';
const MUTED = '#6B7280';
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const enter = (t: number): React.CSSProperties => ({opacity: t, transform: `translateY(${(1 - t) * 8}px)`});

const Glyph: React.FC<{kind: Tile['glyph']}> = ({kind}) => {
  const s = {fill: 'none', stroke: '#FFFFFF', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden style={{display: 'block'}}>
      {kind === 'person' ? (
        <>
          <circle cx="12" cy="8" r="4" {...s} />
          <path d="M4 20.5c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" {...s} />
        </>
      ) : kind === 'chat' ? (
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17H6.5A2.5 2.5 0 0 1 4 14.5z" {...s} />
      ) : kind === 'pie' ? (
        <>
          <path d="M12 3a9 9 0 1 0 9 9h-9z" {...s} />
          <path d="M14.5 2.5a9 9 0 0 1 7 7h-7z" fill="#FFFFFF" />
        </>
      ) : (
        <>
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" {...s} />
          <path d="M9 8h6M9 12h6" {...s} />
        </>
      )}
    </svg>
  );
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({progress = 1, style}) => {
  const tStrip = clamp01((progress - 0.55) / 0.45);
  return (
    <div
      style={{
        position: 'relative',
        width: SUMMARY_W,
        height: SUMMARY_H,
        boxSizing: 'border-box',
        borderRadius: 16,
        background: '#FFFFFF',
        boxShadow: '0 24px 48px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.9)',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontFamily: fonts.ui,
        color: INK,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div style={{display: 'flex', gap: 6, flex: 1, minHeight: 0}}>
        {TILES.map((tile, i) => {
          const t = clamp01((progress - i * 0.14) / 0.4);
          return (
            <div
              key={tile.label}
              style={{
                flex: 1,
                minWidth: 0,
                boxSizing: 'border-box',
                borderRadius: 10,
                background: tile.bg,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), inset 0 0 0 1px rgba(0,0,0,0.035)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '0 14px',
                ...enter(t),
              }}
            >
              <div style={{width: 32, height: 32, borderRadius: 16, background: tile.icon, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 5px rgba(0,0,0,0.12)'}}>
                <Glyph kind={tile.glyph} />
              </div>
              <div style={{lineHeight: 1, whiteSpace: 'nowrap'}}>
                <div style={{fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: tile.icon, marginBottom: 5}}>{tile.label}</div>
                <div style={{fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: INK, fontVariantNumeric: 'tabular-nums'}}>{tile.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Franja de cobros */}
      <div
        style={{
          height: 44,
          flexShrink: 0,
          boxSizing: 'border-box',
          borderRadius: 10,
          background: '#FAFAF7',
          boxShadow: 'inset 0 0 0 1px #ECEBE5',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 10px 0 12px',
          ...enter(tStrip),
        }}
      >
        <div style={{width: 20, height: 20, borderRadius: 10, background: '#FBF0CC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
          <svg width={11} height={11} viewBox="0 0 24 24" aria-hidden style={{display: 'block'}}>
            <circle cx="12" cy="12" r="9" fill="none" stroke="#D9970F" strokeWidth="2.4" />
            <path d="M12 7.5V12l3 2" fill="none" stroke="#D9970F" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{lineHeight: 1, whiteSpace: 'nowrap'}}>
          <div style={{fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK}}>Quién debe septiembre</div>
          <div style={{fontSize: 11, color: MUTED, marginTop: 4}}>
            <b style={{fontWeight: 600, color: INK}}>3 facturas</b> · $ 1.284.000 sin pagar todavía
          </div>
        </div>
        <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
            {['#F2A33A', '#E5484D', '#8FB0FF'].map((c, i) => (
              <div key={c} style={{width: 18, height: 18, borderRadius: 9, background: c, opacity: 0.85, marginLeft: i ? -10 : 0, boxShadow: '0 0 0 2px #FAFAF7'}} />
            ))}
            <span style={{fontSize: 11, color: MUTED, marginLeft: 2}}>Ferretería Lagos y 2 más</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 12px 0 10px', borderRadius: 14, background: '#1FA463', color: '#FFFFFF', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.005em', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 6px rgba(31,164,99,0.35)', whiteSpace: 'nowrap'}}>
            <svg width={12} height={12} viewBox="0 0 24 24" aria-hidden style={{display: 'block'}}>
              <path d="M3 11.5 21 3l-8.5 18-2.5-7.5z" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinejoin="round" />
            </svg>
            Recordar el pago
          </div>
        </div>
      </div>
    </div>
  );
};
