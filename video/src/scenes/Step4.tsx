import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Phone} from '../components/Phone';
import {StepLabel} from '../components/StepLabel';
import {InvoiceIcon, SheetIcon, ZHIcon} from '../components/icons';
import {wordFrame} from '../timeline';

const calmNotifications = [
  {icon: <ZHIcon size={64} />, app: 'Asistente ZH', title: 'Pedido #2231 confirmado', body: 'Revisado por Pedro · 20 s', time: 'ahora'},
  {icon: <SheetIcon size={64} />, app: 'Stock', title: 'Sincronizado con el ERP', body: '0 diferencias', time: 'hace 1 min'},
  {icon: <InvoiceIcon size={64} />, app: 'Cobros', title: 'Factura N° 1042 pagada', body: 'Recordatorio automático', time: 'hace 3 min'},
];

// Escena 7: paso 04 Mejorar. El mismo teléfono, seis semanas después y en calma. Todo a nombre del cliente.
// Aquí sí hay subtítulos, así que el teléfono se enmascara antes de y 1300.
export const Step4: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const phone = spring({frame: frame - 2, fps, config: {damping: 20, stiffness: 140}});
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <StepLabel n="04" title="Mejorar" subtitle="Código, repositorio y cuentas, a tu nombre" subtitleAt={wordFrame('step4', 'nombre') - 4} />
      <div
        style={{
          position: 'absolute',
          top: 570,
          height: 730,
          overflow: 'hidden',
          maskImage: 'linear-gradient(to bottom, #000 86%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 86%, transparent)',
          transform: `translateY(${interpolate(phone, [0, 1], [420, 0])}px)`,
        }}
      >
        <div style={{transform: 'scale(0.82)', transformOrigin: 'top center'}}>
          <Phone notifications={calmNotifications} startAt={wordFrame('step4', 'uso') - 4} gap={8} tone="calm" date="lunes 30 de noviembre" />
        </div>
      </div>
    </AbsoluteFill>
  );
};
