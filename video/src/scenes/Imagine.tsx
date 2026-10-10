import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../brand/tokens';
import {Phone} from '../components/Phone';
import {ChatIcon, InvoiceIcon, MailIcon, SheetIcon} from '../components/icons';

export const chaosNotifications = [
  {icon: <ChatIcon size={64} />, app: 'Chat', title: 'Comercial Andes', body: '¿Tienen stock del modelo azul?', time: 'ahora'},
  {icon: <SheetIcon size={64} />, app: 'Planillas', title: 'Stock_v7_FINAL(2).xlsx', body: 'Pedro editó 14 celdas', time: 'hace 2 min'},
  {icon: <MailIcon size={64} />, app: 'Correo', title: 'RE: RE: RE: cotización', body: 'Adjunto la versión corregida', time: 'hace 5 min'},
  {icon: <InvoiceIcon size={64} />, app: 'Facturación', title: 'Factura N° 1042', body: 'Vencida hace 16 días', time: 'hace 9 min'},
];

// Escena 2: "imagina que esta es tu empresa" sobre un iPhone grande lleno de notificaciones.
// Sin subtítulos en esta escena, así que el bisel del teléfono puede caer bajo la zona de Instagram, como en la referencia.
export const Imagine: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const title = spring({frame, fps, config: {damping: 16}});
  const phone = spring({frame: frame - 2, fps, config: {damping: 20, stiffness: 150}});
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          top: 250,
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
          top: 490,
          transform: `translateY(${interpolate(phone, [0, 1], [500, 0])}px)`,
        }}
      >
        <div style={{transform: 'scale(0.95)', transformOrigin: 'top center'}}>
          <Phone notifications={chaosNotifications} startAt={10} gap={7} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
