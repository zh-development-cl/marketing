import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Fondo vivo de marca: recreación en CSS del BrandGradient WebGL de la app (src/lib/gradients.ts).
// Piso noche, luz violeta arriba a la derecha y magenta abajo a la derecha que giran en círculo
// (como GradientSway: una vuelta cada `turn` s), lila tenue arriba a la izquierda que respira,
// velo noche donde va el texto y grano fino animado. Determinista (solo depende del frame).

const GRAIN_OFFSETS = [
  [0, 0], [61, 37], [23, 101], [117, 59], [43, 89], [97, 13], [139, 121], [11, 71],
];

export const Backdrop: React.FC<{
  turn?: number; // segundos por vuelta de las luces (app: 36; video: 24 se siente vivo sin marear)
  intensity?: number; // 0..1, baja las luces cuando el foco es el teléfono
  veil?: 'top' | 'center' | 'bottom' | 'none'; // dónde oscurecer para que el texto blanco se lea
  plexus?: boolean; // red de puntos y líneas del og.jpg / banner del congreso
  phase?: number; // desfase en s, para que escenas seguidas no arranquen igual
}> = ({turn = 24, intensity = 1, veil = 'top', plexus = false, phase = 0}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const t = frame / fps + phase;
  const th = (2 * Math.PI * t) / turn;
  const breathe = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 12);
  const tilt = 1 + 0.04 * Math.sin((2 * Math.PI * t) / 12);

  const blob = (cx: number, cy: number, size: number, rgb: string, a: number, mid: number): React.CSSProperties => ({
    position: 'absolute',
    left: cx - size / 2,
    top: cy - size / 2,
    width: size,
    height: size,
    borderRadius: '50%',
    background: `radial-gradient(circle, rgba(${rgb},${a * intensity}) 0%, rgba(${rgb},${mid * intensity}) 37%, rgba(${rgb},0) 63%)`,
  });

  const veils: Record<string, string> = {
    top: 'linear-gradient(180deg, rgba(43,0,84,.55) 0%, rgba(43,0,84,.12) 34%, rgba(43,0,84,0) 58%, rgba(26,0,51,.38) 100%)',
    center: 'radial-gradient(60% 40% at 50% 45%, rgba(43,0,84,.38) 0%, rgba(43,0,84,0) 100%)',
    bottom: 'linear-gradient(0deg, rgba(43,0,84,.6) 0%, rgba(43,0,84,.1) 36%, rgba(43,0,84,0) 60%)',
    none: 'none',
  };
  const [gx, gy] = GRAIN_OFFSETS[Math.floor(frame / 2) % GRAIN_OFFSETS.length];

  return (
    <AbsoluteFill style={{background: 'linear-gradient(160deg, #2B0054 0%, #41027A 58%, #5A0690 100%)', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${tilt})`}}>
        <div style={blob(0.74 * W + 0.1 * W * Math.cos(th), 0.08 * H + 0.05 * H * Math.sin(th), 1500, '162,0,255', 0.78, 0.32)} />
        <div style={blob(0.78 * W + 0.1 * W * Math.cos(th + Math.PI), 0.95 * H + 0.04 * H * Math.sin(th + Math.PI), 1600, '230,0,126', 0.72, 0.28)} />
        <div style={blob(0.02 * W, 0.02 * H, 1000, '195,174,242', 0.14 + 0.12 * breathe, 0.05)} />
      </AbsoluteFill>
      {plexus && <Plexus t={t} />}
      {veil !== 'none' && <AbsoluteFill style={{background: veils[veil]}} />}
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('schot/fx/grain.svg')})`,
          backgroundSize: '160px 160px',
          backgroundPosition: `${gx}px ${gy}px`,
          opacity: 0.14,
          mixBlendMode: 'overlay',
        }}
      />
    </AbsoluteFill>
  );
};

// Red de nodos (motivo del og.jpg y del banner): líneas blancas al 16 %, deriva lenta.
const NODES: Array<[number, number, number]> = [
  [60, 300, 5], [230, 430, 7], [120, 700, 6], [400, 560, 4], [300, 880, 6], [40, 1080, 4],
  [1020, 260, 5], [870, 420, 7], [980, 690, 6], [700, 520, 4], [790, 860, 6], [1050, 1030, 4],
];
const LINKS: Array<[number, number]> = [[0, 1], [1, 2], [1, 3], [2, 4], [4, 5], [6, 7], [7, 8], [7, 9], [8, 10], [10, 11]];

const Plexus: React.FC<{t: number}> = ({t}) => {
  const dy = 260 + 18 * Math.sin((2 * Math.PI * t) / 16);
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, opacity: 0.5}}>
      <g transform={`translate(0 ${dy})`} stroke="rgba(255,255,255,.16)" strokeWidth={2} fill="rgba(255,255,255,.35)">
        {LINKS.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} />
        ))}
        {NODES.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>
    </svg>
  );
};
