import React, {useId} from 'react';
import {apps} from '../tokens';

// Íconos de apps como SVG inline (sin logos reales: formas que se reconocen al tamaño de una tarjeta).
// Todos aceptan `size` (px, cuadrado salvo GmailM) y `style`. Deterministas; sin estado.

export type IconProps = {size?: number; style?: React.CSSProperties};

const base = (style?: React.CSSProperties): React.CSSProperties => ({display: 'block', flexShrink: 0, ...style});

// Burbuja verde de WhatsApp con auricular.
export const WhatsAppIcon: React.FC<IconProps> = ({size = 22, style}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={base(style)} aria-hidden>
    <circle cx="12" cy="12" r="12" fill={apps.whatsapp} />
    <path d="M5.94 15.5 A7 7 0 1 1 9.6 18.58 L5.1 19.7 Z" fill="#FFFFFF" />
    <path
      d="M9.15 8.2 c-1 .5-1.25 1.55-.7 2.7 c1 2.2 2.7 3.9 4.95 4.9 c1.15.5 2.2.3 2.7-.7"
      stroke={apps.whatsapp}
      strokeWidth="2.3"
      strokeLinecap="round"
      fill="none"
    />
    <path d="M8.4 8.9 l1.3 1.9 M15.4 15.3 l-1.9-1.3" stroke={apps.whatsapp} strokeWidth="2.1" strokeLinecap="round" />
  </svg>
);

// Ícono de Excel: planilla blanca con una "X" en un cuadro verde.
export const ExcelIcon: React.FC<IconProps & {tile?: string}> = ({size = 18, tile = '#0E4B2B', style}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={base(style)} aria-hidden>
    <rect x="8" y="2" width="14" height="20" rx="2" fill="#FFFFFF" />
    <path d="M11 7.5h8M11 11.5h8M11 15.5h8M11 19.5h8" stroke="#9CC9AE" strokeWidth="1.2" />
    <path d="M15 5v16" stroke="#9CC9AE" strokeWidth="1.2" />
    <rect x="1" y="5" width="13" height="14" rx="2.2" fill={tile} />
    <path d="M4.3 8.5 l5.4 7 M9.7 8.5 l-5.4 7" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" />
  </svg>
);

// La "M" de Gmail en cuatro colores. Proporción 4:3 (ancho = size).
export const GmailM: React.FC<IconProps> = ({size = 22, style}) => (
  <svg width={size} height={size * 0.75} viewBox="0 0 24 18" style={base(style)} aria-hidden>
    <path d="M0 5.2 h4.8 V18 H1.6 A1.6 1.6 0 0 1 0 16.4 Z" fill={apps.gmailBlue} />
    <path d="M19.2 5.2 H24 V16.4 A1.6 1.6 0 0 1 22.4 18 H19.2 Z" fill={apps.gmailGreen} />
    <path d="M24 5.2 V1.9 A1.6 1.6 0 0 0 21.4 .7 L19.2 2.4 L12 8 V12.4 Z" fill={apps.gmailYellow} />
    <path d="M0 5.2 V1.9 A1.6 1.6 0 0 1 2.6 .7 L4.8 2.4 L12 8 V12.4 Z" fill={apps.gmailRed} />
  </svg>
);

// Ícono de Instagram: cuadrado con degradado y cámara en blanco.
export const InstagramIcon: React.FC<IconProps> = ({size = 18, style}) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={base(style)} aria-hidden>
      <defs>
        <linearGradient id={`${id}ig`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FFD24C" />
          <stop offset="0.45" stopColor="#F03C6C" />
          <stop offset="1" stopColor="#7A2CE0" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="23" height="23" rx="6.5" fill={`url(#${id}ig)`} />
      <rect x="4.6" y="4.6" width="14.8" height="14.8" rx="4.6" fill="none" stroke="#FFFFFF" strokeWidth="1.9" />
      <circle cx="12" cy="12" r="3.7" fill="none" stroke="#FFFFFF" strokeWidth="1.9" />
      <circle cx="16.7" cy="7.3" r="1.15" fill="#FFFFFF" />
    </svg>
  );
};

// Anillo degradado de Instagram (para avatares). `ring` es el grosor en px.
export const InstagramRing: React.FC<{size: number; ring?: number; children?: React.ReactNode; style?: React.CSSProperties}> = ({
  size,
  ring = 2,
  children,
  style,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'conic-gradient(from 210deg, #FFD24C, #F03C6C 40%, #7A2CE0 75%, #FFD24C)',
      padding: ring,
      boxSizing: 'border-box',
      flexShrink: 0,
      ...style,
    }}
  >
    <div style={{width: '100%', height: '100%', borderRadius: '50%', background: '#0B0B0F', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', border: '2px solid #0B0B0F'}}>
      {children}
    </div>
  </div>
);

// Banco: edificio con columnas sobre un cuadro azul.
export const BankIcon: React.FC<IconProps & {tile?: string}> = ({size = 22, tile = apps.bankAccent, style}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={base(style)} aria-hidden>
    <rect x="0" y="0" width="24" height="24" rx="6" fill={tile} />
    <path d="M12 4.6 L19.4 8.6 H4.6 Z" fill="#FFFFFF" />
    <rect x="5.6" y="9.8" width="2" height="6.2" fill="#FFFFFF" />
    <rect x="9.2" y="9.8" width="2" height="6.2" fill="#FFFFFF" />
    <rect x="12.8" y="9.8" width="2" height="6.2" fill="#FFFFFF" />
    <rect x="16.4" y="9.8" width="2" height="6.2" fill="#FFFFFF" />
    <rect x="4.6" y="17.2" width="14.8" height="2.4" rx="0.6" fill="#FFFFFF" />
  </svg>
);

// Calendario tipo Google: hoja blanca con cabecera azul y "31".
export const CalendarIcon: React.FC<IconProps> = ({size = 20, style}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={base(style)} aria-hidden>
    <rect x="1" y="1" width="22" height="22" rx="4" fill="#FFFFFF" stroke="#D5D9E0" />
    <path d="M1 5 A4 4 0 0 1 5 1 H19 A4 4 0 0 1 23 5 V8 H1 Z" fill={apps.gmailBlue} />
    <circle cx="7.5" cy="4.5" r="1" fill="#FFFFFF" />
    <circle cx="16.5" cy="4.5" r="1" fill="#FFFFFF" />
    <text x="12" y="19" textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize="9.5" fill={apps.gmailBlue}>
      31
    </text>
  </svg>
);

// Documento PDF (para chips de adjuntos).
export const PdfIcon: React.FC<IconProps> = ({size = 16, style}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={base(style)} aria-hidden>
    <path d="M5 2 H14 L20 8 V21 A1.5 1.5 0 0 1 18.5 22.5 H5 A1.5 1.5 0 0 1 3.5 21 V3.5 A1.5 1.5 0 0 1 5 2 Z" fill="#E5484D" />
    <path d="M14 2 V8 H20 Z" fill="#FFB3B6" />
    <rect x="6" y="13" width="12" height="6" rx="1.2" fill="#FFFFFF" />
    <text x="12" y="17.8" textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize="5.2" fill="#E5484D" letterSpacing="0.3">
      PDF
    </text>
  </svg>
);

// Clip de adjunto.
export const PaperclipIcon: React.FC<IconProps & {color?: string}> = ({size = 14, color = '#5F6368', style}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={base(style)} aria-hidden>
    <path
      d="M16.5 6.5 L8.6 14.4 a2.5 2.5 0 0 0 3.5 3.5 L19.3 10.7 a4.5 4.5 0 0 0 -6.4 -6.4 L5.3 11.9 a6.5 6.5 0 0 0 9.2 9.2 L20 15.6"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);
