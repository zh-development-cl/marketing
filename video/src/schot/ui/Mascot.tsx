import React from 'react';
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// La mascota TibIA arriba a la derecha, junto al titular: entra con resorte desde la derecha, flota y se balancea
// como si saludara; sale hacia la derecha. `at`/`out` en frames absolutos.
export const Mascot: React.FC<{at: number; out: number; size?: number}> = ({at, out, size = 300}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - at, fps, config: {damping: 13, stiffness: 120}});
  const o = interpolate(f, [out, out + 14], [0, 1], {...clampOpt, easing: Easing.in(Easing.cubic)});
  if (p <= 0.001 || o >= 1) return null;
  const h = size * (768 / 552);
  const float = Math.sin((f - at) / 14) * 6;
  const tilt = Math.sin((f - at) / 9) * 2.5 * Math.min(1, (f - at) / 20);
  return (
    <div
      style={{
        position: 'absolute',
        left: 1042 - size,
        top: 96,
        width: size,
        height: h,
        zIndex: 49,
        opacity: Math.min(1, p * 1.5) * (1 - o),
        transform: `translate(${((1 - p) * 220 + o * 320).toFixed(1)}px, ${(float + (1 - p) * 40).toFixed(1)}px) rotate(${tilt.toFixed(2)}deg)`,
        transformOrigin: '50% 90%',
      }}
    >
      <div style={{position: 'absolute', inset: -60, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(195,174,242,.45), rgba(162,0,255,.15) 60%, rgba(162,0,255,0))'}} />
      <Img src={staticFile('schot/mascot/tibia-busto-768.png')} style={{position: 'absolute', inset: 0, width: size, height: h, filter: 'drop-shadow(0 20px 30px rgba(26,0,51,.5))'}} />
    </div>
  );
};
