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

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
// Ancho de la rampa de encendido de cada marca, en marcas: la marca cruza del estado apagado al encendido mientras la
// cabeza del trazo recorre esa distancia (centrada en la marca: al 50 % justo cuando la cabeza pasa por ella).
const TICK_RAMP = 6;

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
  const mixOp = clamp01(mix);
  // El punto del trazo (y el primer encendido de las marcas) entran en fundido con el propio progreso (≈6 frames con
  // inOutQuart) en vez de aparecer de golpe: con linecap round un dash de 2 px ya dibuja el cap completo.
  const headIn = clamp01(p / 0.03);
  // Secuencia del cierre (todo con easing, nada en seco): primero se va el texto inicial, después crece el label2 y
  // por último sube el sub2.
  const outK = Math.min(1, mixOp * 1.6);
  const inK = Math.max(0, Math.min(1, (mixOp - 0.3) / 0.7));
  const subK = Math.max(0, Math.min(1, (mixOp - 0.5) / 0.5));

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

        {/* marcas de reloj: cada una se enciende en rampa continua (color y opacidad cruzan en fundido, nunca en seco) */}
        <g>
          {Array.from({length: ticks}, (_, i) => {
            const major = i % 15 === 0;
            const mid = !major && i % 5 === 0;
            // 0 apagada → 1 encendida; con p = 1 todas quedan a 1 y con p = 0 todas a 0 (los usos estáticos no cambian).
            const litT = clamp01((p - i / ticks) / (TICK_RAMP / ticks) + 0.5) * headIn;
            const a = (i / ticks) * Math.PI * 2 - Math.PI / 2;
            const r1 = (major ? 134 : mid ? 136 : 138) * k;
            const r2 = (major ? 154 : mid ? 148 : 145) * k;
            const opOff = major ? 0.35 : mid ? 0.22 : 0.14;
            const opOn = major ? 0.95 : mid ? 0.7 : 0.5;
            const geo = {
              x1: c + Math.cos(a) * r1,
              y1: c + Math.sin(a) * r1,
              x2: c + Math.cos(a) * r2,
              y2: c + Math.sin(a) * r2,
              strokeWidth: (major ? 2.6 : 1.6) * k,
              strokeLinecap: 'round' as const,
            };
            return (
              <g key={i}>
                {/* base apagada (se retira a medida que entra la encendida, así el estado final es el de siempre) */}
                <line {...geo} stroke={accent.text} strokeOpacity={opOff * (1 - litT)} />
                {/* encendida */}
                <line {...geo} stroke={accent.strong} strokeOpacity={opOn * litT} />
              </g>
            );
          })}
        </g>

        {/* pista */}
        <circle cx={c} cy={c} r={r} fill="none" stroke={accent.strong} strokeOpacity={0.14} strokeWidth={sw} />

        {/* trazo: siempre montado; entra en fundido con headIn para que el punto de las 12 no aparezca en un frame */}
        <g transform={`rotate(-90 ${c} ${c})`} opacity={headIn}>
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
      </svg>

      {/* Estado inicial (se funde hacia arriba cuando entra el final) */}
      <div style={{position: 'absolute', inset: 0, padding: `0 ${44 * k}px`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', pointerEvents: 'none', opacity: 1 - outK, transform: outK > 0 ? `translateY(${-12 * k * outK}px)` : undefined}}>
        <div style={{display: 'flex', alignItems: 'baseline', fontFamily: fonts.display, fontWeight: 600, color: labelColor, lineHeight: 1, letterSpacing: '-0.035em', textShadow: `0 0 28px ${accent.glow}`}}>
          <span style={{fontSize: labelSize * k}}>{big}</span>
          {suffix ? <span style={{fontSize: labelSize * k * 0.5, marginLeft: 2 * k, letterSpacing: '-0.01em'}}>{suffix}</span> : null}
        </div>
        {sub ? <div style={{fontFamily: fonts.sans, fontWeight: 500, fontSize: 28 * k, color: ink.text, opacity: 0.85, marginTop: 8 * k, letterSpacing: '0.005em'}}>{sub}</div> : null}
      </div>
      {/* Estado final: el label2 crece con rebote y el sub2 sube en fundido */}
      {label2 !== undefined && inK > 0.001 ? (
        <div style={{position: 'absolute', inset: 0, padding: `0 ${44 * k}px`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', pointerEvents: 'none'}}>
          <div style={{fontFamily: fonts.display, fontWeight: 600, color: labelColor, lineHeight: 1, letterSpacing: '-0.035em', textShadow: `0 0 ${28 * inK}px ${accent.glow}`, fontSize: labelSize * k, opacity: inK, transform: `scale(${0.7 + 0.3 * inK})`}}>
            {label2}
          </div>
          {sub2 ? <div style={{fontFamily: fonts.sans, fontWeight: 500, fontSize: 28 * k, color: ink.text, opacity: 0.85 * subK, marginTop: 8 * k, letterSpacing: '0.005em', transform: `translateY(${12 * k * (1 - subK)}px)`}}>{sub2}</div> : null}
        </div>
      ) : null}
    </div>
  );
};
