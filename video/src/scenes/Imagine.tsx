import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../brand/tokens';
import {Phone} from '../components/Phone';
import {ChatIcon, InvoiceIcon, MailIcon, SheetIcon} from '../components/icons';

export const chaosNotifications = [
  {icon: <ChatIcon size={56} />, app: 'Chat', title: 'Comercial Andes', body: '¿Tienen stock del modelo azul? Urgente', time: 'ahora'},
  {icon: <SheetIcon size={56} />, app: 'Planillas', title: 'Stock_v7_FINAL(2).xlsx', body: 'Pedro editó 14 celdas', time: 'hace 2 min'},
  {icon: <MailIcon size={56} />, app: 'Correo', title: 'RE: RE: RE: cotización', body: 'Adjunto la versión corregida…', time: 'hace 5 min'},
  {icon: <InvoiceIcon size={56} />, app: 'Facturación', title: 'Factura N° 1042', body: 'Vencida hace 12 días', time: 'hace 9 min'},
];

// Escena 2: "imagina que esta es tu empresa" sobre un iPhone lleno de notificaciones.
export const Imagine: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const title = spring({frame, fps, config: {damping: 16}});
  const phone = spring({frame: frame - 4, fps, config: {damping: 18, stiffness: 90}});
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          top: 230,
          fontFamily: fonts.display,
          fontWeight: 600,
          fontSize: 66,
          color: colors.text,
          textAlign: 'center',
          letterSpacing: '-0.02em',
          opacity: title,
          transform: `translateY(${interpolate(title, [0, 1], [30, 0])}px)`,
        }}
      >
        imagina que esta
        <br />
        es <span style={{color: colors.signalOnDark}}>tu empresa</span>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 440,
          transform: `translateY(${interpolate(phone, [0, 1], [700, 0])}px)`,
        }}
      >
        <div style={{transform: 'scale(0.82)', transformOrigin: 'top center'}}>
          <Phone notifications={chaosNotifications} startAt={18} gap={10} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
