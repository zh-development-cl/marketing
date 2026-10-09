import React from 'react';
import {colors, fonts} from '../brand/tokens';
import {ChatIcon, InvoiceIcon, MailIcon, SheetIcon} from './icons';

// Tarjetas de UI que representan el trabajo manual: chat, planilla, correo, factura.
// Todas miden 420 x 300 para poder animarlas igual.
export const CARD_W = 420;
export const CARD_H = 300;

const Frame: React.FC<{title: string; icon: React.ReactNode; children: React.ReactNode; accent?: string}> = ({
  title,
  icon,
  children,
}) => (
  <div
    style={{
      width: CARD_W,
      height: CARD_H,
      borderRadius: 28,
      background: colors.ink2,
      border: `1.5px solid ${colors.line2}`,
      boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '16px 20px',
        borderBottom: `1px solid ${colors.line}`,
        fontFamily: fonts.sans,
        fontWeight: 600,
        fontSize: 24,
        color: colors.text,
      }}
    >
      {icon}
      {title}
    </div>
    <div style={{flex: 1, padding: 18, position: 'relative'}}>{children}</div>
  </div>
);

const Bubble: React.FC<{me?: boolean; children: React.ReactNode}> = ({me, children}) => (
  <div
    style={{
      alignSelf: me ? 'flex-end' : 'flex-start',
      maxWidth: '82%',
      padding: '10px 16px',
      borderRadius: 18,
      background: me ? '#1F4F2F' : '#232A38',
      color: colors.text,
      fontFamily: fonts.sans,
      fontSize: 22,
      lineHeight: 1.25,
    }}
  >
    {children}
  </div>
);

export const ChatCard: React.FC = () => (
  <Frame title="Clientes" icon={<ChatIcon size={40} />}>
    <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
      <Bubble>Hola, ¿tienen stock del modelo azul?</Bubble>
      <Bubble me>Déjame revisar la planilla…</Bubble>
      <Bubble>¿Y el precio con despacho?</Bubble>
      <Bubble>¿Me mandan la factura?</Bubble>
    </div>
  </Frame>
);

export const SheetCard: React.FC = () => {
  const rows = [
    ['SKU-104', 'Azul', '12', 'ok'],
    ['SKU-105', 'Rojo', '0', '!!'],
    ['SKU-106', 'Negro', '3', '?'],
    ['SKU-107', 'Azul', '-2', '!!'],
  ];
  return (
    <Frame title="Stock_v7_FINAL(2).xlsx" icon={<SheetIcon size={40} />}>
      <div style={{fontFamily: fonts.mono, fontSize: 20, color: colors.text2}}>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr 0.7fr 0.5fr',
              padding: '8px 6px',
              borderBottom: `1px solid ${colors.line}`,
              color: r[3] === '!!' ? colors.danger : colors.text2,
            }}
          >
            {r.map((c, j) => (
              <span key={j}>{c}</span>
            ))}
          </div>
        ))}
      </div>
    </Frame>
  );
};

export const MailCard: React.FC = () => {
  const mails = [
    ['RE: RE: RE: cotización', 'hace 2 min'],
    ['Factura 1042 pendiente', 'hace 15 min'],
    ['¿Pueden reenviar la OC?', 'hace 1 h'],
    ['Planilla actualizada (v8)', 'ayer'],
  ];
  return (
    <Frame title="Correo · 148 sin leer" icon={<MailIcon size={40} />}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        {mails.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: fonts.sans,
              fontSize: 22,
              color: i === 0 ? colors.text : colors.text2,
              fontWeight: i === 0 ? 600 : 400,
              padding: '6px 0',
              borderBottom: `1px solid ${colors.line}`,
            }}
          >
            <span>{m[0]}</span>
            <span style={{color: colors.text3, fontSize: 19}}>{m[1]}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
};

export const InvoiceCard: React.FC = () => (
  <Frame title="Factura N° 1042" icon={<InvoiceIcon size={40} />}>
    <div style={{fontFamily: fonts.sans, fontSize: 22, color: colors.text2, lineHeight: 1.5}}>
      <div>Cliente: Comercial Andes Ltda.</div>
      <div>Total: $1.284.000</div>
      <div>Vence: 27 sep</div>
    </div>
    <div
      style={{
        position: 'absolute',
        right: 22,
        bottom: 22,
        transform: 'rotate(-12deg)',
        border: `4px solid ${colors.danger}`,
        color: colors.danger,
        fontFamily: fonts.display,
        fontWeight: 700,
        fontSize: 40,
        letterSpacing: '0.08em',
        padding: '4px 14px',
        borderRadius: 10,
        opacity: 0.9,
      }}
    >
      VENCIDA
    </div>
  </Frame>
);

export const ALL_CARDS = [ChatCard, SheetCard, MailCard, InvoiceCard];
