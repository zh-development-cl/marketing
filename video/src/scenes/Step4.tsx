import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../brand/tokens';
import {Phone} from '../components/Phone';
import {StepLabel} from '../components/StepLabel';
import {InvoiceIcon, MailIcon, SheetIcon, ZHIcon} from '../components/icons';

const calmNotifications = [
  {icon: <ZHIcon size={56} />, app: 'Asistente ZH', title: 'Pedido #1042 confirmado', body: 'Respondido en 20 s · revisado por Pedro', time: 'ahora'},
  {icon: <SheetIcon size={56} />, app: 'Stock', title: 'Sincronizado con el ERP', body: '0 diferencias · 12:00', time: 'hace 1 min'},
  {icon: <InvoiceIcon size={56} />, app: 'Cobros', title: 'Factura N° 1042 pagada', body: 'Recordatorio automático enviado el lunes', time: 'hace 3 min'},
  {icon: <MailIcon size={56} />, app: 'Correo', title: '0 sin leer', body: 'Las cotizaciones ahora salen desde el sistema', time: 'hace 8 min'},
];

// Escena 7: paso 04 Mejorar. El mismo teléfono, ahora en calma, y todo a nombre del cliente.
export const Step4: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const phone = spring({frame: frame - 4, fps, config: {damping: 18, stiffness: 90}});
  const foot = spring({frame: frame - 50, fps, config: {damping: 16}});
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <StepLabel n="04" title="Mejorar" />
      <div
        style={{
          position: 'absolute',
          top: 470,
          transform: `translateY(${interpolate(phone, [0, 1], [500, 0])}px)`,
          transformOrigin: 'top center',
        }}
      >
        <div style={{transform: 'scale(0.78)', transformOrigin: 'top center'}}>
          <Phone notifications={calmNotifications} startAt={14} gap={9} tone="calm" />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1400,
          fontFamily: fonts.sans,
          fontSize: 32,
          color: colors.text2,
          textAlign: 'center',
          opacity: foot,
          transform: `translateY(${interpolate(foot, [0, 1], [20, 0])}px)`,
        }}
      >
        Código, repositorio y cuentas:
        <br />
        <span style={{color: colors.text, fontWeight: 600}}>a nombre de tu empresa.</span>
      </div>
    </AbsoluteFill>
  );
};
