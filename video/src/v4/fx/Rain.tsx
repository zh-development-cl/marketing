import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Moving} from './MotionBlur';
import {clamp, hash, inOutQuart, keyframes, outQuart} from './ease';

// "Lluvia" de tarjetas en 3D: decenas de tarjetas caen y giran con profundidad de campo y motion blur, y con
// `order` (0 → 1) se ordenan en un muro de celdas. Determinista: todo sale de hash(i).

export type RainItem = {
  w: number;
  h: number;
  node: React.ReactNode;
};

export type RainProps = {
  items: RainItem[]; // tarjetas (ya elegidas por la escena)
  start: number; // frame en que empieza a caer la primera
  stagger?: number; // frames entre tarjetas
  fallFrames?: number; // cuánto tarda cada una en entrar
  order?: (frame: number) => number; // 0 = caos, 1 = ordenadas en la grilla
  grid?: {cols: number; cellW: number; cellH: number; gap: number; top: number; scale: number}; // muro final
  spread?: number; // dispersión horizontal del caos
  depth?: number; // rango de z (px) del caos
  fade?: (frame: number) => number; // opacidad global
  camera?: (frame: number) => number; // escala global (empuje de cámara)
  // Resalte por tarjeta (0 → 1): contorno de color y leve zoom. Devuelve [intensidad, color].
  highlight?: (index: number, frame: number) => [number, string] | null;
};

export const Rain: React.FC<RainProps> = ({
  items,
  start,
  stagger = 2,
  fallFrames = 26,
  order = () => 0,
  grid = {cols: 4, cellW: 230, cellH: 120, gap: 14, top: 500, scale: 0.72},
  spread = 520,
  depth = 900,
  fade = () => 1,
  camera = () => 1,
  highlight = () => null,
}) => {
  const frame = useCurrentFrame();
  const o = order(frame);
  const gridW = grid.cols * grid.cellW + (grid.cols - 1) * grid.gap;
  const gridLeft = (1080 - gridW) / 2;
  return (
    <div style={{position: 'absolute', inset: 0, perspective: 1600, perspectiveOrigin: '50% 45%', transform: `scale(${camera(frame)})`, opacity: fade(frame)}}>
      {items.map((it, i) => {
        const r1 = hash(i, 1);
        const r2 = hash(i, 2);
        const r3 = hash(i, 3);
        const r4 = hash(i, 4);
        const at = start + i * stagger;
        // Caos: entra desde arriba (fuera de cuadro), cae con easing y queda flotando con deriva.
        const p = interpolate(frame, [at, at + fallFrames], [0, 1], {...clamp, easing: outQuart});
        const z = (r3 - 0.5) * depth; // -depth/2 (lejos) a +depth/2 (cerca)
        const scaleZ = 1 + z / 1600;
        const restX = 540 + (r1 - 0.5) * spread * 2 - it.w / 2;
        const restY = 300 + r2 * 1200 - it.h / 2;
        const driftX = Math.sin(frame / 37 + i) * 10;
        const driftY = Math.cos(frame / 41 + i * 1.3) * 12 + (frame - at) * 0.35; // sigue bajando lento
        const chaosX = restX + driftX;
        const chaosY = interpolate(p, [0, 1], [-400 - r4 * 600, restY]) + driftY * p;
        const chaosRot = (r4 - 0.5) * 50 * (1 - p * 0.5) + Math.sin(frame / 50 + i) * 4;
        // Muro: celda por índice.
        const col = i % grid.cols;
        const row = Math.floor(i / grid.cols);
        const gx = gridLeft + col * (grid.cellW + grid.gap) + (grid.cellW - it.w * grid.scale) / 2;
        const gy = grid.top + row * (grid.cellH + grid.gap) + (grid.cellH - it.h * grid.scale) / 2;
        // Mezcla caos → muro con un pequeño retraso por fila para que "se acomoden".
        const oo = interpolate(o, [Math.min(0.9, row * 0.06), Math.min(1, row * 0.06 + 0.5)], [0, 1], {...clamp, easing: inOutQuart});
        const x = interpolate(oo, [0, 1], [chaosX, gx]);
        const y = interpolate(oo, [0, 1], [chaosY, gy]);
        const rot = interpolate(oo, [0, 1], [chaosRot, 0]);
        const sc = interpolate(oo, [0, 1], [scaleZ, grid.scale]);
        const zz = interpolate(oo, [0, 1], [z, 0]);
        // Profundidad de campo: lejos y muy cerca se desenfocan; en el muro todo nítido.
        const dof = (1 - oo) * interpolate(Math.abs(zz), [0, 250, depth / 2], [0, 0.6, 6], clamp);
        const dim = interpolate(zz, [-depth / 2, 0, depth / 2], [0.55, 1, 1], clamp);
        const visible = frame >= at - 1;
        if (!visible) return null;
        const hl = highlight(i, frame);
        const hlk = hl ? hl[0] : 0;
        const hlc = hl ? hl[1] : 'transparent';
        return (
          <Moving
            key={i}
            x={(f) => {
              // Reconstruye x(f) para la velocidad: solo cambia por la caída y la deriva.
              const pf = interpolate(f, [at, at + fallFrames], [0, 1], {...clamp, easing: outQuart});
              const of = order(f);
              const oof = interpolate(of, [Math.min(0.9, row * 0.06), Math.min(1, row * 0.06 + 0.5)], [0, 1], {...clamp, easing: inOutQuart});
              const cx = restX + Math.sin(f / 37 + i) * 10;
              void pf;
              return interpolate(oof, [0, 1], [cx, gx]);
            }}
            y={(f) => {
              const pf = interpolate(f, [at, at + fallFrames], [0, 1], {...clamp, easing: outQuart});
              const of = order(f);
              const oof = interpolate(of, [Math.min(0.9, row * 0.06), Math.min(1, row * 0.06 + 0.5)], [0, 1], {...clamp, easing: inOutQuart});
              const dY = Math.cos(f / 41 + i * 1.3) * 12 + (f - at) * 0.35;
              const cy = interpolate(pf, [0, 1], [-400 - r4 * 600, restY]) + dY * pf;
              return interpolate(oof, [0, 1], [cy, gy]);
            }}
            rotate={() => rot}
            scale={() => sc * (1 + hlk * 0.06)}
            extraBlur={() => dof}
            blur={0.32}
            style={{zIndex: Math.round(1000 + zz + (hlk > 0 ? 500 : 0)), opacity: dim, transformStyle: 'preserve-3d'}}
            origin="top left"
          >
            <div
              style={{
                width: it.w,
                height: it.h,
                transform: `translateZ(${zz}px)`,
                borderRadius: 16,
                boxShadow: hlk > 0 ? `0 0 0 ${3 * hlk}px ${hlc}, 0 0 ${40 * hlk}px ${hlc}` : undefined,
                filter: hlk > 0 ? `brightness(${1 + hlk * 0.12})` : undefined,
              }}
            >
              {it.node}
            </div>
          </Moving>
        );
      })}
    </div>
  );
};

// Utilidad: progreso de ordenamiento entre dos frames.
export const orderBetween = (from: number, to: number) => (frame: number) => keyframes(frame, [[from, 0], [to, 1]], inOutQuart);
