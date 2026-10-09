import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../brand/tokens';
import {ALL_CARDS, CARD_H, CARD_W} from '../components/Cards';
import {StepLabel} from '../components/StepLabel';
import {Check} from '../components/icons';

// Escena 4: paso 01 Entender. Las tarjetas se ordenan; abajo, la llamada de 30 minutos y los hallazgos.
const findings = ['Preguntas repetidas por chat', 'Stock en 3 planillas distintas', 'Cobros y recordatorios a mano'];

const pad2 = (n: number) => String(n).padStart(2, '0');

export const Step1: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scale = 0.56;
  const gridW = CARD_W * scale * 2 + 24;
  const gridH = CARD_H * scale * 2 + 24;
  const minutes = Math.round(interpolate(frame, [20, 80], [0, 30], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const seconds = frame < 80 ? Math.round(interpolate(frame, [20, 80], [0, 1800], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})) % 60 : 0;
  const callIn = spring({frame: frame - 10, fps, config: {damping: 16, stiffness: 100}});

  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <StepLabel n="01" title="Entender" />

      {/* Grilla ordenada */}
      <div style={{position: 'absolute', top: 560, width: gridW, height: gridH}}>
        {ALL_CARDS.map((Card, i) => {
          const p = spring({frame: frame - i * 4, fps, config: {damping: 15, stiffness: 110}});
          const col = i % 2;
          const row = Math.floor(i / 2);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: col * (CARD_W * scale + 24),
                top: row * (CARD_H * scale + 24),
                width: CARD_W,
                height: CARD_H,
                transformOrigin: 'top left',
                transform: `scale(${scale}) rotate(${interpolate(p, [0, 1], [(i % 2 ? 1 : -1) * 14, 0])}deg) translateY(${interpolate(p, [0, 1], [-80, 0])}px)`,
                opacity: p,
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
          top: 980,
          width: 880,
          borderRadius: 32,
          background: colors.ink2,
          border: `1.5px solid ${colors.line2}`,
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          padding: 28,
          opacity: callIn,
          transform: `translateY(${interpolate(callIn, [0, 1], [60, 0])}px)`,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
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
            }}
          >
            L
          </div>
          <div style={{flex: 1}}>
            <div style={{fontFamily: fonts.sans, fontWeight: 600, fontSize: 32, color: colors.text}}>Lorenzo · ZH Development</div>
            <div style={{fontFamily: fonts.sans, fontSize: 25, color: colors.text2}}>Llamada de descubrimiento · Google Meet</div>
          </div>
          <div
            style={{
              fontFamily: fonts.mono,
              fontWeight: 500,
              fontSize: 44,
              color: minutes >= 30 ? colors.ok : colors.signalOnDark,
              background: colors.ink1,
              border: `1px solid ${colors.line2}`,
              borderRadius: 16,
              padding: '8px 18px',
            }}
          >
            {pad2(minutes)}:{pad2(seconds)}
          </div>
        </div>
        <div style={{marginTop: 22, display: 'flex', flexDirection: 'column', gap: 12}}>
          {findings.map((f, i) => {
            const p = spring({frame: frame - 90 - i * 14, fps, config: {damping: 14, stiffness: 140}});
            return (
              <div
                key={f}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  fontFamily: fonts.sans,
                  fontSize: 28,
                  color: colors.text,
                  opacity: p,
                  transform: `translateX(${interpolate(p, [0, 1], [-30, 0])}px)`,
                }}
              >
                <Check size={34} />
                {f}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
