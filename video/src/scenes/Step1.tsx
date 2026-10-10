import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../brand/tokens';
import {ALL_CARDS, CARD_H, CARD_W} from '../components/Cards';
import {StepLabel} from '../components/StepLabel';
import {Check} from '../components/icons';
import {wordFrame} from '../timeline';
import {orbits} from './Chaos';

// Escena 4: paso 01 Entender. Las tarjetas del caos viajan a una grilla ordenada; abajo, la llamada de 30 minutos
// con un contador que llega a 30:00 cuando la voz lo dice, y los hallazgos al ritmo de la frase.
const findings = ['Preguntas repetidas por chat', 'Stock en 3 planillas distintas', 'Cobros y recordatorios a mano'];

const pad2 = (n: number) => String(n).padStart(2, '0');
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const SCALE = 0.7;
const CELL_W = CARD_W * SCALE; // 294
const CELL_H = CARD_H * SCALE; // 210
const GAP = 24;
const GRID_W = CELL_W * 2 + GAP; // 612
const GRID_TOP = 470;

export const Step1: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const gridLeft = (width - GRID_W) / 2;

  const t0 = wordFrame('step1', 'llamada');
  const t1 = wordFrame('step1', 'minutos');
  const total = Math.floor(interpolate(frame, [t0, t1], [0, 1800], {easing: Easing.out(Easing.cubic), ...clamp}));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  const arrived = total >= 1800;
  const pulse = 1 + 0.12 * Math.sin(Math.PI * interpolate(frame, [t1, t1 + 12], [0, 1], clamp));
  const callIn = spring({frame: frame - 18, fps, config: {damping: 16, stiffness: 100}});
  const findAt = wordFrame('step1', 'encontrar');
  const reviewAt = wordFrame('step1', 'entender');
  const listOpen = spring({frame: frame - findAt, fps, config: {damping: 16, stiffness: 120}});

  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <StepLabel n="01" title="Entender" />

      {/* Las tarjetas llegan desde sus órbitas del caos y se ordenan */}
      <div style={{position: 'absolute', inset: 0, perspective: 1500, zIndex: 0}}>
        {ALL_CARDS.map((Card, i) => {
          const o = orbits[i];
          const p = spring({frame, fps, config: {damping: 18, stiffness: 70}});
          const col = i % 2;
          const row = Math.floor(i / 2);
          const cellLeft = gridLeft + col * (CELL_W + GAP);
          const cellTop = GRID_TOP + row * (CELL_H + GAP);
          const cx = cellLeft + CELL_W / 2;
          const cy = cellTop + CELL_H / 2;
          const fromX = width / 2 + o.x - cx;
          const fromY = height / 2 + o.y - cy;
          // Mientras la voz dice "entender", un repaso tarjeta por tarjeta.
          const hl = interpolate(frame, [reviewAt + i * 8, reviewAt + i * 8 + 2, reviewAt + i * 8 + 9, reviewAt + i * 8 + 12], [0, 1, 1, 0], clamp);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: cellLeft - (CARD_W - CELL_W) / 2,
                top: cellTop - (CARD_H - CELL_H) / 2,
                width: CARD_W,
                height: CARD_H,
                transformOrigin: 'center',
                transform: `translate(${interpolate(p, [0, 1], [fromX, 0])}px, ${interpolate(p, [0, 1], [fromY, 0])}px) rotateX(${interpolate(p, [0, 1], [o.rx, 0])}deg) rotateY(${interpolate(p, [0, 1], [o.ry, 0])}deg) rotateZ(${interpolate(p, [0, 1], [o.rz, 0])}deg) scale(${interpolate(p, [0, 1], [1, SCALE])})`,
                opacity: interpolate(frame, [0, 6], [0, 1], clamp),
                borderRadius: 28,
                boxShadow: `0 0 0 5px rgba(143,176,255,${hl}), 0 0 ${40 * hl}px rgba(36,92,228,${0.6 * hl})`,
              }}
            >
              <Card />
            </div>
          );
        })}
      </div>

      {/* Tarjeta de llamada */}
      <div
        style={{
          position: 'absolute',
          zIndex: 1,
          top: 950,
          width: 840,
          borderRadius: 32,
          background: colors.ink2,
          border: `1.5px solid ${colors.line2}`,
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          padding: 24,
          opacity: callIn,
          transform: `translateY(${interpolate(callIn, [0, 1], [60, 0])}px)`,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 999,
              background: colors.signal,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 40,
              color: '#fff',
              flex: 'none',
            }}
          >
            L
          </div>
          <div style={{flex: 1, minWidth: 0}}>
            <div style={{fontFamily: fonts.sans, fontWeight: 600, fontSize: 32, color: colors.text}}>Lorenzo · ZH Development</div>
            <div style={{fontFamily: fonts.sans, fontSize: 28, color: colors.text2}}>Primera reunión · 30 min · Google Meet</div>
          </div>
          <div
            style={{
              fontFamily: fonts.mono,
              fontWeight: 500,
              fontSize: 40,
              color: arrived ? colors.ok : colors.signalOnDark,
              background: colors.ink1,
              border: `1px solid ${colors.line2}`,
              borderRadius: 16,
              padding: '8px 16px',
              transform: `scale(${pulse})`,
              flex: 'none',
            }}
          >
            {pad2(minutes)}:{pad2(seconds)}
          </div>
        </div>
        <div
          style={{
            marginTop: interpolate(listOpen, [0, 1], [0, 20]),
            height: interpolate(listOpen, [0, 1], [0, 168]),
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {findings.map((f, i) => {
            const p = spring({frame: frame - findAt - i * 15, fps, config: {damping: 14, stiffness: 160}});
            return (
              <div
                key={f}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  height: 48,
                  flex: 'none',
                  fontFamily: fonts.sans,
                  fontSize: 32,
                  color: colors.text,
                  opacity: p,
                  transform: `translateX(${interpolate(p, [0, 1], [-30, 0])}px)`,
                }}
              >
                <Check size={36} />
                {f}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
