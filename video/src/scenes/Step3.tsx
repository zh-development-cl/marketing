import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../brand/tokens';
import {StepLabel} from '../components/StepLabel';
import {Check, ChatIcon} from '../components/icons';

// Escena 6: paso 03 Construir. Entregas semanales, panel en uso y el asistente respondiendo con revisión humana.
const Panel: React.FC<{at: number; title: string; children: React.ReactNode}> = ({at, title, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - at, fps, config: {damping: 16, stiffness: 110}});
  return (
    <div
      style={{
        width: 900,
        borderRadius: 28,
        background: colors.ink2,
        border: `1.5px solid ${colors.line2}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
        padding: '22px 28px',
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [50, 0])}px)`,
      }}
    >
      <div style={{fontFamily: fonts.mono, fontSize: 22, letterSpacing: '0.12em', textTransform: 'uppercase', color: colors.text3, marginBottom: 14}}>
        {title}
      </div>
      {children}
    </div>
  );
};

export const Step3: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const bars = [38, 52, 46, 70, 64, 88, 96];
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <StepLabel n="03" title="Construir" />
      <div style={{position: 'absolute', top: 540, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center'}}>
        <Panel at={6} title="Entregas que puedes probar">
          <div style={{display: 'flex', gap: 12}}>
            {[1, 2, 3, 4, 5, 6].map((w, i) => {
              const done = spring({frame: frame - 24 - i * 9, fps, config: {damping: 12, stiffness: 160}});
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
                    fontSize: 22,
                    color: colors.text2,
                  }}
                >
                  <div>sem {w}</div>
                  <div style={{height: 34, marginTop: 8, display: 'flex', justifyContent: 'center', opacity: done, transform: `scale(${done})`}}>
                    <Check size={30} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel at={62} title="Panel de operación · en uso">
          <div style={{display: 'flex', gap: 28, alignItems: 'flex-end'}}>
            <div>
              <div style={{fontFamily: fonts.sans, fontSize: 22, color: colors.text3}}>Pedidos hoy</div>
              <div style={{fontFamily: fonts.display, fontWeight: 600, fontSize: 72, color: colors.text, lineHeight: 1}}>
                {Math.round(interpolate(frame, [70, 110], [0, 42], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))}
              </div>
              <div style={{fontFamily: fonts.sans, fontSize: 22, color: colors.ok, marginTop: 6}}>Stock al día</div>
            </div>
            <div style={{flex: 1, display: 'flex', gap: 12, alignItems: 'flex-end', height: 150}}>
              {bars.map((b, i) => {
                const h = interpolate(frame, [72 + i * 4, 100 + i * 4], [6, b * 1.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: h,
                      borderRadius: 8,
                      background: i === bars.length - 1 ? colors.signalOnDark : colors.line2,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </Panel>

        <Panel at={108} title="Asistente · con revisión humana">
          <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
            {(() => {
              const a = spring({frame: frame - 116, fps, config: {damping: 14}});
              const b = spring({frame: frame - 134, fps, config: {damping: 14}});
              const c = spring({frame: frame - 150, fps, config: {damping: 12, stiffness: 150}});
              return (
                <>
                  <div style={{alignSelf: 'flex-start', display: 'flex', gap: 12, alignItems: 'flex-end', opacity: a, transform: `translateY(${interpolate(a, [0, 1], [16, 0])}px)`}}>
                    <ChatIcon size={44} />
                    <div style={{padding: '12px 18px', borderRadius: 20, background: '#232A38', fontFamily: fonts.sans, fontSize: 26, color: colors.text}}>
                      Hola, ¿tienen stock del modelo azul?
                    </div>
                  </div>
                  <div style={{alignSelf: 'flex-end', maxWidth: '85%', opacity: b, transform: `translateY(${interpolate(b, [0, 1], [16, 0])}px)`}}>
                    <div style={{padding: '12px 18px', borderRadius: 20, background: '#1F4F2F', fontFamily: fonts.sans, fontSize: 26, color: colors.text}}>
                      Sí, quedan 12 unidades. ¿Te reservo 2 y te envío la factura?
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        fontFamily: fonts.mono,
                        fontSize: 20,
                        color: colors.ok,
                        opacity: c,
                        transform: `scale(${interpolate(c, [0, 1], [0.8, 1])})`,
                      }}
                    >
                      <Check size={24} /> IA · revisado por tu equipo
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </Panel>
      </div>
    </AbsoluteFill>
  );
};
