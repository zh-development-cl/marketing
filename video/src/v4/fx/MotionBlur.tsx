import React, {useId} from 'react';
import {useCurrentFrame} from 'remotion';

// Motion blur direccional "de verdad": el desenfoque se calcula a partir de la velocidad del elemento
// (diferencia de posición entre este frame y el anterior) y se aplica como un feGaussianBlur anisotrópico.
// El wrapper externo traslada y desenfoca en coordenadas de pantalla; el interno rota y escala.

type Fn = (frame: number) => number;

export type MovingProps = {
  x?: Fn;
  y?: Fn;
  rotate?: Fn; // grados
  scale?: Fn;
  opacity?: Fn;
  blur?: number; // px de desenfoque por px de desplazamiento por frame (0.3 a 0.5 se ve natural)
  minBlur?: number; // por debajo de este desenfoque no se aplica filtro (ahorra render)
  extraBlur?: Fn; // desenfoque uniforme adicional (p. ej. profundidad de campo)
  origin?: string; // transform-origin del interno
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

const zero: Fn = () => 0;
const MAX_BLUR = 48;
const one: Fn = () => 1;

export const Moving: React.FC<MovingProps> = ({
  x = zero,
  y = zero,
  rotate = zero,
  scale = one,
  opacity = one,
  blur = 0.38,
  minBlur = 0.6,
  extraBlur = zero,
  origin = 'center',
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const px = x(frame);
  const py = y(frame);
  const vx = px - x(frame - 1);
  const vy = py - y(frame - 1);
  const dr = rotate(frame) - rotate(frame - 1);
  const ds = scale(frame) - scale(frame - 1);
  const uniform = Math.abs(dr) * 0.45 + Math.abs(ds) * 12 + extraBlur(frame);
  // Tope: por encima de ~48 px el desenfoque deja de leerse como estela y se vuelve una nube que aparece de golpe.
  const sx = Math.min(MAX_BLUR, Math.abs(vx) * blur + uniform);
  const sy = Math.min(MAX_BLUR, Math.abs(vy) * blur + uniform);
  const useFilter = Math.max(sx, sy) >= minBlur;
  return (
    <>
      {useFilter ? (
        <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
          <filter id={id} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`${sx.toFixed(2)} ${sy.toFixed(2)}`} edgeMode="none" />
          </filter>
        </svg>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(${px}px, ${py}px)`,
          filter: useFilter ? `url(#${id})` : undefined,
          opacity: opacity(frame),
          willChange: 'transform',
          ...style,
        }}
      >
        <div style={{transform: `rotate(${rotate(frame)}deg) scale(${scale(frame)})`, transformOrigin: origin}}>{children}</div>
      </div>
    </>
  );
};

// Desenfoque direccional fijo para "latigazos" (whip pans) y streaks: se usa cuando el movimiento
// se anima con transform en el padre y solo hace falta el blur.
export const Streak: React.FC<{sx: number; sy?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({sx, sy = 0, children, style}) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const on = Math.max(sx, sy) >= 0.6;
  return (
    <>
      {on ? (
        <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
          <filter id={id} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`${sx.toFixed(2)} ${sy.toFixed(2)}`} />
          </filter>
        </svg>
      ) : null}
      <div style={{filter: on ? `url(#${id})` : undefined, ...style}}>{children}</div>
    </>
  );
};
