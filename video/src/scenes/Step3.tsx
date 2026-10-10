import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../brand/tokens';
import {StepLabel} from '../components/StepLabel';
import {Check, ChatIcon} from '../components/icons';
import {wordFrame} from '../timeline';

// Escena 6: paso 03 Construir. Entregas semanales que se marcan y el asistente respondiendo con revisión humana,
// cada cosa cuando la voz la dice.
const Panel: React.FC<{at: number; title: string; children: React.ReactNode}> = ({at, title, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - at, fps, config: {damping: 16, stiffness: 110}});
  return (
    <div
      style={{
        width: 840,
        borderRadius: 28,
        background: colors.ink2,
        border: `1.5px solid ${colors.line2}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
        padding: '20px 26px',
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [50, 0])}px)`,
      }}
    >
      <div style={{fontFamily: fonts.mono, fontSize: 30, letterSpacing: '0.12em', textTransform: 'uppercase', color: colors.text, marginBottom: 14}}>
        {title}
      </div>
      {children}
    </div>
  );
};

export const Step3: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const weeksAt = wordFrame('step3', 'etapas') - 6;
  const chatAt = wordFrame('step3', 'IA');
  const panelAt = wordFrame('step3', 'probar') - 6;
  const typing = interpolate(frame, [chatAt - 6, chatAt], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const answerAt = wordFrame('step3', 'aporta');
  const sealAt = wordFrame('step3', 'revisión');
  const a = spring({frame: frame - chatAt, fps, config: {damping: 14}});
  const b = spring({frame: frame - answerAt, fps, config: {damping: 14}});
  const c = spring({frame: frame - sealAt, fps, config: {damping: 12, stiffness: 150}});
  const sealPulse = frame > sealAt + 12 ? 1 + 0.03 * Math.sin(frame / 5) : 1;
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <StepLabel n="03" title="Construir" />
      <div style={{position: 'absolute', top: 500, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center'}}>
        <Panel at={6} title="Entregas que puedes probar">
          <div style={{display: 'flex', gap: 12}}>
            {[1, 2, 3, 4, 5, 6].map((w, i) => {
              const done = spring({frame: frame - weeksAt - i * 8, fps, config: {damping: 12, stiffness: 160}});
              return (
                <div
                  key={w}
                  style={{
                    flex: 1,
                    borderRadius: 18,
                    border: `1.5px solid ${done > 0.5 ? colors.signalOnDark : colors.line2}`,
                    background: done > 0.5 ? 'rgba(36,92,228,0.18)' : colors.ink1,
                    padding: '14px 0',
                    textAlign: 'center',
                    fontFamily: fonts.mono,
                    fontSize: 28,
                    color: colors.text2,
                  }}
                >
                  <div>sem {w}</div>
                  <div style={{height: 36, marginTop: 8, display: 'flex', justifyContent: 'center', opacity: done, transform: `scale(${done})`}}>
                    <Check size={32} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel at={panelAt} title="Asistente · con revisión humana">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              position: 'relative',
              overflow: 'hidden',
              height: 40 + 76 * a + 130 * b + 70 * c,
            }}
          >
            {/* El cliente escribe… */}
            <div style={{position: 'absolute', left: 60, top: 6, display: 'flex', gap: 10, opacity: typing}}>
              {[0, 1, 2].map((d) => (
                <div
                  key={d}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    background: colors.text2,
                    opacity: 0.4 + 0.6 * Math.abs(Math.sin(frame / 6 + d)),
                  }}
                />
              ))}
            </div>
            <div style={{alignSelf: 'flex-start', display: 'flex', gap: 12, alignItems: 'flex-end', opacity: a, transform: `translateY(${interpolate(a, [0, 1], [16, 0])}px)`}}>
              <ChatIcon size={48} />
              <div style={{padding: '14px 22px', borderRadius: 22, background: '#232A38', fontFamily: fonts.sans, fontSize: 32, color: colors.text, maxWidth: '80%'}}>
                Hola, ¿tienen stock del modelo azul?
              </div>
            </div>
            <div style={{alignSelf: 'flex-end', maxWidth: '80%', opacity: b, transform: `translateY(${interpolate(b, [0, 1], [16, 0])}px)`}}>
              <div style={{padding: '14px 22px', borderRadius: 22, background: '#1F4F2F', fontFamily: fonts.sans, fontSize: 32, color: colors.text}}>
                Sí, quedan 12 unidades. ¿Te reservo 2 y te envío la factura?
              </div>
              <div
                style={{
                  marginTop: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  fontFamily: fonts.mono,
                  fontSize: 30,
                  color: colors.ok,
                  padding: '8px 16px',
                  borderRadius: 999,
                  background: 'rgba(61,214,140,0.14)',
                  opacity: c,
                  transform: `scale(${interpolate(c, [0, 1], [0.8, 1]) * sealPulse})`,
                }}
              >
                <Check size={32} /> IA · revisado por tu equipo
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </AbsoluteFill>
  );
};
