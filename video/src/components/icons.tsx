import React from 'react';
import {colors} from '../brand/tokens';

// Íconos genéricos de apps (no son marcas) para notificaciones y tarjetas.
const Tile: React.FC<{bg: string; size: number; children: React.ReactNode}> = ({bg, size, children}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.24,
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none',
    }}
  >
    {children}
  </div>
);

export const ChatIcon: React.FC<{size?: number}> = ({size = 64}) => (
  <Tile bg={colors.chat} size={size}>
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5v-8Z"
        fill="#fff"
      />
    </svg>
  </Tile>
);

export const SheetIcon: React.FC<{size?: number}> = ({size = 64}) => (
  <Tile bg={colors.sheet} size={size}>
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="2" fill="#fff" />
      <path d="M4 9.5h16M4 14.5h16M10 4v16" stroke={colors.sheet} strokeWidth="1.6" />
    </svg>
  </Tile>
);

export const MailIcon: React.FC<{size?: number}> = ({size = 64}) => (
  <Tile bg={colors.mail} size={size}>
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2.5" fill="#fff" />
      <path d="M4 7.5l8 5.5 8-5.5" stroke={colors.mail} strokeWidth="1.8" fill="none" />
    </svg>
  </Tile>
);

export const InvoiceIcon: React.FC<{size?: number}> = ({size = 64}) => (
  <Tile bg={colors.invoice} size={size}>
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
      <path d="M6 3h9l4 4v14H6V3Z" fill="#fff" />
      <path d="M9 11h7M9 14.5h7M9 18h4" stroke={colors.invoice} strokeWidth="1.6" />
    </svg>
  </Tile>
);

export const ZHIcon: React.FC<{size?: number}> = ({size = 64}) => (
  <Tile bg={colors.ink2} size={size}>
    <div
      style={{
        fontFamily: 'Funnel Display',
        fontWeight: 700,
        fontSize: size * 0.42,
        color: colors.text,
        letterSpacing: '-0.04em',
      }}
    >
      ZH
    </div>
  </Tile>
);

export const Check: React.FC<{size?: number; color?: string}> = ({size = 28, color = colors.ok}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill={color} />
    <path d="M7 12.5l3.2 3L17 9" stroke="#07090F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
