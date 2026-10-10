import {Easing, interpolate} from 'remotion';

// Atajos de interpolación con clamp y curvas que se ven "de cine" (salidas suaves, entradas con empuje).
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const outExpo = Easing.out(Easing.exp);
export const outQuart = Easing.out(Easing.poly(4));
export const inOutQuart = Easing.inOut(Easing.poly(4));
export const inQuart = Easing.in(Easing.poly(4));
export const outBack = Easing.out(Easing.back(1.4));

export const tween = (frame: number, from: number, to: number, a: number, b: number, easing = outQuart) =>
  interpolate(frame, [from, to], [a, b], {...clamp, easing});

// Progreso 0→1 entre dos frames con easing.
export const prog = (frame: number, from: number, dur: number, easing = outQuart) => tween(frame, from, from + dur, 0, 1, easing);

// Secuencia por tramos: [[frame, valor], ...] con easing entre tramos.
export const keyframes = (frame: number, pts: Array<[number, number]>, easing = inOutQuart) => {
  if (frame <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (frame <= pts[i][0]) return interpolate(frame, [pts[i - 1][0], pts[i][0]], [pts[i - 1][1], pts[i][1]], {...clamp, easing});
  }
  return pts[pts.length - 1][1];
};

// Ruido determinista por índice (sin Math.random, para que el render sea reproducible).
export const hash = (n: number, salt = 0) => {
  const x = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
