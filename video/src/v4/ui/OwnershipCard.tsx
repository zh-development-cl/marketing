import React from 'react';
import {interpolate} from 'remotion';
import {accent, fonts, ink, shadow, status} from '../tokens';

// Tarjeta de "propiedad" (860 x 660): certificado oscuro con sello ZH chico, "Propiedad de" en mono acento y
// "Tu Empresa" en display; tres filas grandes (código fuente, repositorio y accesos, cuentas y dominio) con un
// check a la derecha que pasa de gris a verde, y al pie una línea mono. No anima por sí sola: `checks[i]` es el
// valor de un resorte 0..1 (puede pasar de 1) por fila, `footer` 0..1 revela la línea del pie, `glow` 0..1 sube
// el brillo azul de la cabecera.

export const OWNERSHIP_W = 840;
export const OWNERSHIP_H = 772;

export type OwnershipCardProps = {
  company?: string; // "Tu Empresa"
  checks?: number[]; // resorte 0..1 por fila (3 filas)
  footer?: number; // 0..1 revela el pie
  glow?: number; // 0..1 brillo azul de la cabecera
  style?: React.CSSProperties;
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const c01 = (v: number) => Math.max(0, Math.min(1, v));

// Íconos de las filas: trazo en acento, 30 px dentro de una baldosa de 64.
const CodeIcon: React.FC<{color: string}> = ({color}) => (
  <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" style={{display: 'block'}}>
    <path d="M8.5 7.5 4 12l4.5 4.5M15.5 7.5 20 12l-4.5 4.5M13.5 5l-3 14" />
  </svg>
);
const RepoIcon: React.FC<{color: string}> = ({color}) => (
  <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" style={{display: 'block'}}>
    <circle cx="6.5" cy="5" r="2.4" />
    <circle cx="6.5" cy="19" r="2.4" />
    <circle cx="17.5" cy="8" r="2.4" />
    <path d="M6.5 7.4v9.2M17.5 10.4c0 3.6-3.2 4.2-6 4.6-2.1.3-4.2.8-5 1.9" />
  </svg>
);
const LoopIcon: React.FC<{color: string}> = ({color}) => (
  <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{display: 'block'}}>
    <path d="M20 12a8 8 0 0 1-14.2 5" />
    <path d="M4 12a8 8 0 0 1 14.2-5" />
    <path d="M18 3v4h-4M6 21v-4h4" />
  </svg>
);

const DomainIcon: React.FC<{color: string}> = ({color}) => (
  <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" style={{display: 'block'}}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18" />
  </svg>
);

const ROWS: Array<{label: string; Icon: React.FC<{color: string}>}> = [
  {label: 'El sistema completo (código)', Icon: CodeIcon},
  {label: 'Claves y accesos', Icon: RepoIcon},
  {label: 'Cuentas y dominio', Icon: DomainIcon},
  {label: 'Mejoras continuas · mensual', Icon: LoopIcon},
];

// Check circular: anillo gris con tilde apagada; encima, el verde entra con el resorte (escala, desenfoque, brillo).
const Check: React.FC<{p: number}> = ({p}) => {
  const s = interpolate(p, [0, 1], [0.55, 1]);
  const o = Math.min(1, p * 1.6);
  const b = Math.max(0, 1 - p) * 8;
  const ring = 1 - c01(p * 2);
  return (
    <div style={{position: 'relative', width: 58, height: 58, flexShrink: 0}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 999, boxShadow: `inset 0 0 0 2.5px rgba(255,255,255,${0.05 + 0.1 * ring})`, background: 'rgba(255,255,255,0.03)'}} />
      <svg width={58} height={58} viewBox="0 0 58 58" style={{position: 'absolute', inset: 0, opacity: 0.22 * ring}}>
        <path d="M19 29.5l7 7 13-14" fill="none" stroke={ink.text} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 999,
          background: `linear-gradient(180deg, #4FE39E 0%, ${status.ok} 100%)`,
          boxShadow: `0 0 ${26 * o}px rgba(61,214,140,${0.5 * o}), 0 8px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35)`,
          opacity: o,
          transform: `scale(${s})`,
          filter: b > 0.3 ? `blur(${b}px)` : undefined,
        }}
      >
        <svg width={58} height={58} viewBox="0 0 58 58" style={{display: 'block'}}>
          <path d="M19 29.5l7 7 13-14" fill="none" stroke="#06281A" strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};

export const OwnershipCard: React.FC<OwnershipCardProps> = ({company = 'Tu Empresa', checks = [1, 1, 1], footer = 1, glow = 0.6, style}) => {
  const fo = c01(footer);
  const fb = (1 - fo) * 8;
  return (
    <div
      style={{
        position: 'relative',
        width: OWNERSHIP_W,
        height: OWNERSHIP_H,
        boxSizing: 'border-box',
        borderRadius: 28,
        background: 'linear-gradient(180deg, #151B27 0%, #0E121A 100%)',
        boxShadow: `${shadow.cardFar}, ${shadow.card}, inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.08)`,
        overflow: 'hidden',
        fontFamily: fonts.sans,
        color: ink.text,
        padding: '42px 44px 0',
        ...style,
      }}
    >
      {/* Brillo azul de la cabecera (arriba a la izquierda) y una línea de luz en el borde superior */}
      <div
        style={{
          position: 'absolute',
          left: -140,
          top: -220,
          width: 720,
          height: 520,
          borderRadius: 999,
          background: `radial-gradient(ellipse at center, rgba(77,124,255,${0.22 * glow}) 0%, rgba(77,124,255,0) 62%)`,
          pointerEvents: 'none',
        }}
      />
      <div style={{position: 'absolute', left: 120, right: 120, top: 0, height: 1, background: `linear-gradient(90deg, rgba(143,176,255,0) 0%, rgba(143,176,255,${0.35 + 0.4 * glow}) 50%, rgba(143,176,255,0) 100%)`}} />

      {/* Cabecera: sello ZH + "Propiedad de" / "Tu Empresa" */}
      <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 26}}>
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 20,
            flexShrink: 0,
            background: `linear-gradient(160deg, #4D7CFF 0%, ${accent.button} 100%)`,
            boxShadow: `0 10px 28px rgba(48,107,255,${0.25 + 0.3 * glow}), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.25)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 32,
            letterSpacing: '-0.04em',
            color: '#fff',
          }}
        >
          ZH
        </div>
        <div style={{lineHeight: 1}}>
          <div style={{fontFamily: fonts.mono, fontWeight: 500, fontSize: 26, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent.text}}>Propiedad de</div>
          <div style={{fontFamily: fonts.display, fontWeight: 700, fontSize: 72, letterSpacing: '-0.03em', marginTop: 10, whiteSpace: 'nowrap'}}>{company}</div>
        </div>
        {/* Esquina de certificado: número y fecha de entrega */}
        <div style={{marginLeft: 'auto', alignSelf: 'flex-end', textAlign: 'right', lineHeight: 1, fontFamily: fonts.mono, whiteSpace: 'nowrap'}}>
          <div style={{fontSize: 26, letterSpacing: '0.14em', textTransform: 'uppercase', color: ink.text3}}>Entrega</div>
          <div style={{fontSize: 28, letterSpacing: '0.02em', color: ink.text2, marginTop: 10}}>N° 2026-041</div>
        </div>
      </div>

      <div style={{height: 1, background: 'rgba(255,255,255,0.08)', margin: '32px 0 10px'}} />

      {/* Tres filas con check */}
      <div style={{position: 'relative'}}>
        {ROWS.map(({label, Icon}, i) => {
          const p = checks[i] ?? 0;
          const lit = c01(p * 1.4);
          const tileBg = `rgba(77,124,255,${0.08 + 0.1 * lit})`;
          const iconColor = lit > 0.5 ? accent.text : '#9FB4E6';
          return (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                height: 112,
                boxShadow: i < ROWS.length - 1 ? 'inset 0 -1px 0 rgba(255,255,255,0.06)' : undefined,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  flexShrink: 0,
                  background: tileBg,
                  boxShadow: `inset 0 0 0 1px rgba(143,176,255,${0.14 + 0.2 * lit}), inset 0 1px 0 rgba(255,255,255,0.06)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon color={iconColor} />
              </div>
              <div style={{flex: 1, fontSize: 38, fontWeight: 500, letterSpacing: '-0.015em', color: lit > 0.5 ? ink.text : '#C5CCDA', whiteSpace: 'nowrap'}}>{label}</div>
              <Check p={p} />
            </div>
          );
        })}
      </div>

      {/* Pie: línea mono */}
      <div style={{height: 1, background: 'rgba(255,255,255,0.08)', margin: '10px 0 0'}} />
      <div
        style={{
          height: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: fonts.mono,
          fontSize: 28,
          letterSpacing: '0.01em',
          color: ink.text2,
          whiteSpace: 'nowrap',
          opacity: fo,
          filter: fb > 0.3 ? `blur(${fb}px)` : undefined,
          transform: `translateY(${(1 - fo) * 8}px)`,
        }}
      >
        tuyo <span style={{color: accent.text, margin: '0 10px'}}>·</span> documentado <span style={{color: accent.text, margin: '0 10px'}}>·</span> y seguimos mejorando
      </div>
    </div>
  );
};
