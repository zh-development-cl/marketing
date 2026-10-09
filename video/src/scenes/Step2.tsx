import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../brand/tokens';
import {StepLabel} from '../components/StepLabel';
import {ZHIcon} from '../components/icons';

// Escena 5: paso 02 Diseñar. Una propuesta escrita que se despliega línea a línea.
const Row: React.FC<{at: number; label: string; value: React.ReactNode; strong?: boolean}> = ({at, label, value, strong}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - at, fps, config: {damping: 15, stiffness: 130}});
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr',
        gap: 20,
        padding: '18px 0',
        borderBottom: `1px solid ${colors.line}`,
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [16, 0])}px)`,
      }}
    >
      <div style={{fontFamily: fonts.mono, fontSize: 24, letterSpacing: '0.12em', textTransform: 'uppercase', color: colors.signalOnDark, paddingTop: 6}}>
        {label}
      </div>
      <div style={{fontFamily: fonts.sans, fontSize: 30, color: strong ? colors.text : colors.text2, lineHeight: 1.35, fontWeight: strong ? 600 : 400}}>
        {value}
      </div>
    </div>
  );
};

export const Step2: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const doc = spring({frame: frame - 8, fps, config: {damping: 16, stiffness: 100}});
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <StepLabel n="02" title="Diseñar" />
      <div
        style={{
          position: 'absolute',
          top: 560,
          width: 900,
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
            <div style={{fontFamily: fonts.display, fontWeight: 600, fontSize: 38, color: colors.text, letterSpacing: '-0.01em'}}>
              Propuesta · Comercial Andes
            </div>
            <div style={{fontFamily: fonts.sans, fontSize: 24, color: colors.text3}}>Escrita antes de empezar</div>
          </div>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 22,
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
          at={22}
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
        <Row at={46} label="Plazo" value="6 semanas · entregas cada semana" strong />
        <Row at={64} label="Precio" value="Cerrado. Sin sorpresas." strong />
      </div>
    </AbsoluteFill>
  );
};
