import React, {useId} from 'react';
import {accent, fonts, ink} from '../tokens';

// Anillo de progreso (≈ 320 px) con marcas de reloj alrededor, glow suave y etiqueta grande al centro ("24h", "✓").
// `progress` 0..1 avanza desde las 12 en sentido horario; las marcas ya recorridas se encienden. No anima solo.

export type RingProps = {
  progress: number; // 0..1
  label: string; // "24h" (el sufijo no numérico se dibuja a la mitad de tamaño) o "✓"
  sub?: string; // texto chico bajo la etiqueta ("de respuesta")
  size?: number; // 320
  labelColor?: string; // por defecto ink.text
  labelSize?: number; // 96
  style?: React.CSSProperties;
  // Estado final opcional: con `mix` 0..1 la etiqueta/sub cruzan en fundido a (label2, sub2); `mix` puede pasar de 1
  // (easing con rebote) y solo afecta a la escala del label2 (la opacidad se topa).
  label2?: string;
  sub2?: string;
  mix?: number;
};

export const RING_SIZE = 320;

export const Ring: React.FC<RingProps> = ({progress, label, sub, size = RING_SIZE, labelColor = ink.text, labelSize = 96, style, label2, sub2, mix = 0}) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const p = Math.max(0, Math.min(1, progress));
  const k = size / RING_SIZE; // escala respecto al tamaño base
  const c = size / 2;
  const r = 118 * k;
  const sw = 8 * k;
  const circ = 2 * Math.PI * r;
  const ticks = 60;
  const m = label.match(/^([\d.,]+)(.*)$/);
  const big = m ? m[1] : label;
  const suffix = m ? m[2] : '';
  const mixOp = Math.max(0, Math.min(1, mix));

  return (
    <div style={{position: 'relative', width: size, height: size, ...style}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <defs>
          <filter id={`${id}g`} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={10 * k} />
          </filter>
          <radialGradient id={`${id}f`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.55" stopColor={accent.strong} stopOpacity="0" />
            <stop offset="1" stopColor={accent.strong} stopOpacity={0.16 * p} />
          </radialGradient>
        </defs>

        {/* relleno interior apenas iluminado */}
        <circle cx={c} cy={c} r={r - sw / 2} fill={`url(#${id}f)`} />

        {/* marcas de reloj */}
        <g>
          {Array.from({length: ticks}, (_, i) => {
            const major = i % 15 === 0;
            const mid = !major && i % 5 === 0;
            const lit = p > 0 && i / ticks <= p + 1e-6;
            const a = (i / ticks) * Math.PI * 2 - Math.PI / 2;
            const r1 = (major ? 134 : mid ? 136 : 138) * k;
            const r2 = (major ? 154 : mid ? 148 : 145) * k;
            const op = lit ? (major ? 0.95 : mid ? 0.7 : 0.5) : major ? 0.35 : mid ? 0.22 : 0.14;
            return (
              <line
                key={i}
                x1={c + Math.cos(a) * r1}
                y1={c + Math.sin(a) * r1}
                x2={c + Math.cos(a) * r2}
                y2={c + Math.sin(a) * r2}
                stroke={lit ? accent.strong : accent.text}
                strokeOpacity={op}
                strokeWidth={(major ? 2.6 : 1.6) * k}
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {/* pista */}
        <circle cx={c} cy={c} r={r} fill="none" stroke={accent.strong} strokeOpacity={0.14} strokeWidth={sw} />

        {p > 0.002 ? (
          <g transform={`rotate(-90 ${c} ${c})`}>
            {/* glow */}
            <circle
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={accent.strong}
              strokeOpacity={0.62}
              strokeWidth={sw * 2.2}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - p)}
              filter={`url(#${id}g)`}
            />
            {/* trazo */}
            <circle cx={c} cy={c} r={r} fill="none" stroke={accent.strong} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - p)} />
            {/* brillo fino encima del trazo */}
            <circle cx={c} cy={c} r={r} fill="none" stroke="#FFFFFF" strokeOpacity={0.22} strokeWidth={sw * 0.3} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - p)} />
          </g>
        ) : null}
      </svg>

      {/* Estado inicial (se funde hacia arriba cuando entra el final) */}
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: 1 - mixOp, transform: mixOp > 0 ? `translateY(${-10 * k * mixOp}px)` : undefined}}>
        <div style={{display: 'flex', alignItems: 'baseline', fontFamily: fonts.display, fontWeight: 600, color: labelColor, lineHeight: 1, letterSpacing: '-0.035em', textShadow: `0 0 28px ${accent.glow}`}}>
          <span style={{fontSize: labelSize * k}}>{big}</span>
          {suffix ? <span style={{fontSize: labelSize * k * 0.5, marginLeft: 2 * k, letterSpacing: '-0.01em'}}>{suffix}</span> : null}
        </div>
        {sub ? <div style={{fontFamily: fonts.sans, fontWeight: 500, fontSize: 28 * k, color: ink.text, opacity: 0.85, marginTop: 8 * k, letterSpacing: '0.005em'}}>{sub}</div> : null}
      </div>
      {/* Estado final: el label2 crece con rebote y el sub2 sube en fundido */}
      {label2 !== undefined && mixOp > 0.001 ? (
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'}}>
          <div style={{fontFamily: fonts.display, fontWeight: 600, color: labelColor, lineHeight: 1, letterSpacing: '-0.035em', textShadow: `0 0 28px ${accent.glow}`, fontSize: labelSize * k, opacity: mixOp, transform: `scale(${0.55 + 0.45 * mix})`}}>
            {label2}
          </div>
          {sub2 ? <div style={{fontFamily: fonts.sans, fontWeight: 500, fontSize: 28 * k, color: ink.text, opacity: 0.85 * mixOp, marginTop: 8 * k, letterSpacing: '0.005em', transform: `translateY(${10 * k * (1 - mixOp)}px)`}}>{sub2}</div> : null}
        </div>
      ) : null}
    </div>
  );
};
