import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../brand/tokens';
import {StepLabel} from '../components/StepLabel';
import {ZHIcon} from '../components/icons';
import {wordFrame} from '../timeline';

// Escena 5: paso 02 Diseñar. Una propuesta escrita, dirigida al espectador, que se despliega al ritmo de la voz.
const Row: React.FC<{at: number; label: string; value: React.ReactNode; strong?: boolean}> = ({at, label, value, strong}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - at, fps, config: {damping: 15, stiffness: 150}});
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '190px 1fr',
        gap: 20,
        padding: '18px 0',
        borderBottom: `1px solid ${colors.line}`,
        position: 'relative',
      }}
    >
      {/* Esqueleto: el documento se ve "rellenándose" hasta que la voz nombra cada fila */}
      <div style={{position: 'absolute', left: 0, top: 26, width: 120, height: 16, borderRadius: 8, background: colors.line2, opacity: 1 - p}} />
      <div style={{position: 'absolute', left: 210, top: 26, width: '52%', height: 16, borderRadius: 8, background: colors.line2, opacity: 1 - p}} />
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 30,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: colors.signalOnDark,
          paddingTop: 6,
          opacity: p,
          transform: `translateY(${interpolate(p, [0, 1], [12, 0])}px)`,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 34,
          color: colors.text,
          lineHeight: 1.35,
          fontWeight: strong ? 600 : 400,
          opacity: p,
          transform: `translateY(${interpolate(p, [0, 1], [12, 0])}px)`,
        }}
      >
        {value}
      </div>
    </div>
  );
};

export const Step2: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const doc = spring({frame: frame - 6, fps, config: {damping: 16, stiffness: 100}});
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <StepLabel n="02" title="Diseñar" />
      <div
        style={{
          position: 'absolute',
          top: 480,
          width: 840,
          borderRadius: 32,
          background: colors.ink2,
          border: `1.5px solid ${colors.line2}`,
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          padding: '30px 36px 10px',
          opacity: doc,
          transform: `translateY(${interpolate(doc, [0, 1], [80, 0])}px) scale(${interpolate(doc, [0, 1], [0.96, 1])})`,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 18, paddingBottom: 20, borderBottom: `1px solid ${colors.line2}`}}>
          <ZHIcon size={64} />
          <div style={{flex: 1}}>
            <div style={{fontFamily: fonts.display, fontWeight: 600, fontSize: 40, color: colors.text, letterSpacing: '-0.01em'}}>
              Propuesta · tu empresa
            </div>
          </div>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 26,
              color: colors.text2,
              border: `1px solid ${colors.line2}`,
              borderRadius: 999,
              padding: '8px 16px',
            }}
          >
            v1 · 14 oct
          </div>
        </div>
        <Row
          at={wordFrame('step2', 'alcance') - 6}
          label="Alcance"
          value={
            <>
              Asistente de chat con revisión humana
              <br />
              Stock unificado y sincronizado con el ERP
              <br />
              Cobros automáticos con recordatorio
            </>
          }
        />
        <Row at={wordFrame('step2', 'plazo') - 6} label="Plazo" value="6 semanas · entregas cada semana" strong />
        <Row at={wordFrame('step2', 'precio') - 6} label="Precio" value="Cerrado antes de empezar" strong />
      </div>
    </AbsoluteFill>
  );
};
