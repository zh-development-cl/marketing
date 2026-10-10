import React from 'react';
import {apps, fonts, ink, radius, shadow, status} from '../tokens';

// Teléfono (iPhone, 600 x 1240) en pantalla de bloqueo: isla dinámica, estado, fecha, hora grande, notificaciones con
// ícono de app, píldora "N sin responder", linterna/cámara y barra inferior. No anima por sí solo: la escena pasa
// `progress` por notificación (0..1) y decide el tono de la pantalla.

export type PhoneApp = 'whatsapp' | 'excel' | 'gmail' | 'instagram' | 'zh';

export type PhoneNotification = {
  app: PhoneApp;
  title: string;
  body: string;
  time: string; // "ahora", "21:40"
  progress?: number; // 0..1 entrada (opacidad, subida, escala, desenfoque). Sin valor = 1.
};

export type PhoneProps = {
  date: string; // "lunes 13 de octubre"
  time: string; // "21:47"
  notifications: PhoneNotification[];
  pending?: {count: number; label?: string}; // píldora inferior; label por defecto "sin responder"
  tone?: 'busy' | 'calm'; // busy: gris azulado apagado · calm: azul profundo más luminoso
  screenOnly?: boolean; // sin bisel ni botones ni sombra; la pantalla queda en la misma posición (inset 18 px)
  frameOpacity?: number; // 0..1 opacidad del bisel (para hacerlo aparecer); screenOnly equivale a 0
  bezelOpacity?: number; // alias de `frameOpacity`
  style?: React.CSSProperties;
};

export const PHONE_W = 600;
export const PHONE_H = 1240;
export const PHONE_SCREEN_INSET = 18; // bisel + banda metálica
export const PHONE_SCREEN_W = PHONE_W - PHONE_SCREEN_INSET * 2; // 564
export const PHONE_SCREEN_H = PHONE_H - PHONE_SCREEN_INSET * 2; // 1204

const white = (a: number) => `rgba(255,255,255,${a})`;

// Ícono de app (cuadrado redondeado) en SVG. Se parece a la app real sin ser el logo oficial.
export const AppIcon: React.FC<{app: PhoneApp; size?: number; style?: React.CSSProperties}> = ({app, size = 44, style}) => {
  const r = size * 0.24;
  const common: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: r,
    flexShrink: 0,
    boxShadow: '0 1px 2px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
    overflow: 'hidden',
    ...style,
  };
  if (app === 'whatsapp') {
    return (
      <svg width={size} height={size} viewBox="0 0 44 44" style={common}>
        <defs>
          <linearGradient id="zh-wa-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5BF07F" />
            <stop offset="1" stopColor={apps.whatsapp} />
          </linearGradient>
        </defs>
        <rect width="44" height="44" fill="url(#zh-wa-g)" />
        <path d="M22 8.5c-7.2 0-13 5.6-13 12.5 0 2.4.7 4.6 1.9 6.5L9 35.5l8.4-2.1c1.4.6 3 .9 4.6.9 7.2 0 13-5.6 13-12.5S29.2 8.5 22 8.5z" fill="#FFFFFF" />
        <path
          d="M17.6 15.6c-.3-.7-.6-.7-.9-.7h-.8c-.3 0-.7.1-1.1.5s-1.4 1.4-1.4 3.4 1.5 4 1.7 4.2c.2.3 2.9 4.6 7.1 6.3 3.5 1.4 4.2 1.1 5 1 .8-.1 2.4-1 2.8-2 .3-1 .3-1.8.2-2-.1-.2-.4-.3-.8-.5s-2.4-1.2-2.8-1.3c-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.3 1.6-.2.3-.5.3-.9.1s-1.7-.6-3.2-2c-1.2-1.1-2-2.4-2.2-2.8-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.7.1-.3.1-.5 0-.7-.1-.2-.9-2.2-1.2-3z"
          fill={apps.whatsapp}
        />
      </svg>
    );
  }
  if (app === 'excel') {
    return (
      <svg width={size} height={size} viewBox="0 0 44 44" style={common}>
        <rect width="44" height="44" fill="#F2F5F3" />
        <rect x="16" y="7" width="22" height="30" rx="2.5" fill="#FFFFFF" stroke="#C7D3CC" strokeWidth="1" />
        <rect x="16" y="7" width="22" height="7" rx="2.5" fill="#21A366" />
        <rect x="16" y="11" width="22" height="3" fill="#21A366" />
        <g stroke="#C7D3CC" strokeWidth="1">
          <line x1="16" y1="21" x2="38" y2="21" />
          <line x1="16" y1="28" x2="38" y2="28" />
          <line x1="27" y1="14" x2="27" y2="37" />
        </g>
        <rect x="5" y="13" width="18" height="18" rx="2.5" fill={apps.excel} />
        <text x="14" y="27.6" textAnchor="middle" fontFamily={fonts.ui} fontWeight={700} fontSize="15" fill="#FFFFFF">
          X
        </text>
      </svg>
    );
  }
  if (app === 'gmail') {
    return (
      <svg width={size} height={size} viewBox="0 0 44 44" style={common}>
        <rect width="44" height="44" fill="#FFFFFF" />
        <path d="M6 15.5v14c0 1.2 1 2.2 2.2 2.2H13V20.4l-7-4.9z" fill={apps.gmailBlue} />
        <path d="M38 15.5v14c0 1.2-1 2.2-2.2 2.2H31V20.4l7-4.9z" fill={apps.gmailGreen} />
        <path d="M13 20.4l9 6.6 9-6.6v-5.6l-9 6.6-9-6.6z" fill={apps.gmailRed} />
        <path d="M6 15.5v-1.6c0-2 2.3-3.1 3.9-1.9L13 14.8v5.6l-7-4.9z" fill={apps.gmailYellow} />
        <path d="M38 15.5v-1.6c0-2-2.3-3.1-3.9-1.9L31 14.8v5.6l7-4.9z" fill={apps.gmailRed} />
      </svg>
    );
  }
  if (app === 'instagram') {
    return (
      <svg width={size} height={size} viewBox="0 0 44 44" style={common}>
        <defs>
          <radialGradient id="zh-ig-g" cx="0.22" cy="1.05" r="1.25">
            <stop offset="0" stopColor="#FFD676" />
            <stop offset="0.28" stopColor="#FF7A3D" />
            <stop offset="0.52" stopColor={apps.instagram} />
            <stop offset="0.78" stopColor="#8E3BE0" />
            <stop offset="1" stopColor="#4F5BD5" />
          </radialGradient>
        </defs>
        <rect width="44" height="44" fill="url(#zh-ig-g)" />
        <rect x="10" y="10" width="24" height="24" rx="7" fill="none" stroke="#FFFFFF" strokeWidth="2.4" />
        <circle cx="22" cy="22" r="5.6" fill="none" stroke="#FFFFFF" strokeWidth="2.4" />
        <circle cx="28.6" cy="15.4" r="1.6" fill="#FFFFFF" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" style={common}>
      <defs>
        <linearGradient id="zh-zh-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1A2130" />
          <stop offset="1" stopColor="#0A0D13" />
        </linearGradient>
      </defs>
      <rect width="44" height="44" fill="url(#zh-zh-g)" />
      <rect x="0.75" y="0.75" width="42.5" height="42.5" rx="10" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
      <text x="21.5" y="29" textAnchor="middle" fontFamily={fonts.display} fontWeight={700} fontSize="18.5" letterSpacing="-0.6" fill="#F2F4F8">
        ZH
      </text>
      <circle cx="35" cy="9.5" r="2.8" fill="#4D7CFF" />
    </svg>
  );
};

const Wifi: React.FC = () => (
  <svg width="27" height="20" viewBox="0 0 24 18" fill="none" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round">
    <path d="M2 6.6a14.5 14.5 0 0 1 20 0" />
    <path d="M5.7 10.3a9.3 9.3 0 0 1 12.6 0" />
    <path d="M9.3 13.9a4.2 4.2 0 0 1 5.4 0" />
    <circle cx="12" cy="16.6" r="1.1" fill="#FFFFFF" stroke="none" />
  </svg>
);

const Battery: React.FC = () => (
  <svg width="36" height="17.5" viewBox="0 0 31 15">
    <rect x="1" y="1" width="25" height="13" rx="4" fill="none" stroke={white(0.45)} strokeWidth="1.5" />
    <rect x="3.2" y="3.2" width="17.5" height="8.6" rx="2.2" fill="#FFFFFF" />
    <path d="M28 5.2v4.6c1.1-.3 1.8-1.2 1.8-2.3S29.1 5.5 28 5.2z" fill={white(0.45)} />
  </svg>
);

const Flashlight: React.FC = () => (
  <svg width="26" height="30" viewBox="0 0 26 30">
    <path d="M7 2h12v4.2l-2.6 4.3V27a1.6 1.6 0 0 1-1.6 1.6h-3.6A1.6 1.6 0 0 1 9.6 27V10.5L7 6.2z" fill="#FFFFFF" />
    <rect x="7" y="6.2" width="12" height="1.8" fill="rgba(0,0,0,0.35)" />
    <circle cx="13" cy="14" r="1.6" fill="rgba(0,0,0,0.4)" />
  </svg>
);

const Camera: React.FC = () => (
  <svg width="30" height="26" viewBox="0 0 30 26" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round">
    <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h4l2-3.2h7L20.5 6h4A2.5 2.5 0 0 1 27 8.5v12a2.5 2.5 0 0 1-2.5 2.5h-19A2.5 2.5 0 0 1 3 20.5z" />
    <circle cx="15" cy="14.5" r="5" />
  </svg>
);

const Notification: React.FC<{n: PhoneNotification; tone: 'busy' | 'calm'}> = ({n, tone}) => {
  const p = Math.max(0, Math.min(1, n.progress ?? 1));
  const blur = (1 - p) * 8;
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * 34}px) scale(${0.9 + 0.1 * p})`,
        transformOrigin: '50% 0%',
        filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
        borderRadius: 28,
        background: tone === 'busy' ? 'rgba(70,76,88,0.72)' : 'rgba(58,72,102,0.68)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.11), 0 10px 26px rgba(0,0,0,0.22)',
        padding: '18px 20px 19px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 15,
        fontFamily: fonts.ui,
      }}
    >
      <AppIcon app={n.app} size={54} style={{marginTop: 2}} />
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10}}>
          <div style={{fontWeight: 600, fontSize: 24, color: white(0.96), letterSpacing: '-0.01em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
            {n.title}
          </div>
          <div style={{fontSize: 19, color: white(0.5), flexShrink: 0}}>{n.time}</div>
        </div>
        <div
          style={{
            fontSize: 23,
            color: white(0.9),
            lineHeight: 1.25,
            marginTop: 3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {n.body}
        </div>
      </div>
    </div>
  );
};

const SideButton: React.FC<{side: 'left' | 'right'; top: number; height: number}> = ({side, top, height}) => (
  <div
    style={{
      position: 'absolute',
      top,
      height,
      width: 6,
      [side]: -5,
      borderRadius: side === 'left' ? '3px 0 0 3px' : '0 3px 3px 0',
      background: `linear-gradient(${side === 'left' ? 90 : 270}deg, #3A3F48 0%, #20242B 60%, #15181E 100%)`,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 2px 4px rgba(0,0,0,0.5)',
    }}
  />
);

export const Phone: React.FC<PhoneProps> = ({date, time, notifications, pending, tone = 'busy', screenOnly = false, frameOpacity, bezelOpacity, style}) => {
  const fo = screenOnly ? 0 : Math.max(0, Math.min(1, frameOpacity ?? bezelOpacity ?? 1));
  const screenBg =
    tone === 'busy'
      ? [
          'radial-gradient(78% 44% at 16% 6%, rgba(96,118,130,0.72) 0%, rgba(96,118,130,0) 70%)',
          'radial-gradient(64% 42% at 90% 97%, rgba(80,108,120,0.7) 0%, rgba(80,108,120,0) 70%)',
          'radial-gradient(50% 30% at 60% 55%, rgba(44,58,68,0.5) 0%, rgba(44,58,68,0) 70%)',
          'linear-gradient(165deg, #2B343D 0%, #1E252D 45%, #11161B 100%)',
        ].join(', ')
      : [
          'radial-gradient(75% 42% at 18% 8%, rgba(78,128,220,0.62) 0%, rgba(78,128,220,0) 70%)',
          'radial-gradient(60% 38% at 88% 96%, rgba(48,107,255,0.42) 0%, rgba(48,107,255,0) 70%)',
          'radial-gradient(50% 30% at 60% 55%, rgba(30,56,110,0.5) 0%, rgba(30,56,110,0) 70%)',
          'linear-gradient(165deg, #1B3158 0%, #10213E 45%, #0A1427 100%)',
        ].join(', ');
  const pillBg = tone === 'busy' ? 'rgba(62,68,78,0.78)' : 'rgba(52,66,96,0.72)';
  const btnBg = tone === 'busy' ? 'rgba(66,72,84,0.6)' : 'rgba(56,72,104,0.55)';

  return (
    <div style={{position: 'relative', width: PHONE_W, height: PHONE_H, ...style}}>
      {fo > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: fo}}>
          {/* banda metálica (titanio) con brillo en el borde */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: radius.phone,
              background: 'linear-gradient(160deg, #3B4049 0%, #22262D 22%, #15181E 50%, #1C2027 78%, #343941 100%)',
              boxShadow: `${shadow.phone}, inset 0 0 0 1.5px rgba(255,255,255,0.17), inset 0 1px 0 rgba(255,255,255,0.26)`,
            }}
          />
          {/* bisel negro */}
          <div
            style={{
              position: 'absolute',
              inset: 5,
              borderRadius: radius.phone - 5,
              background: '#080A0D',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.035)',
            }}
          />
          <SideButton side="left" top={236} height={40} />
          <SideButton side="left" top={318} height={78} />
          <SideButton side="left" top={410} height={78} />
          <SideButton side="right" top={352} height={124} />
        </div>
      ) : null}

      {/* pantalla */}
      <div
        style={{
          position: 'absolute',
          inset: PHONE_SCREEN_INSET,
          borderRadius: radius.screen,
          overflow: 'hidden',
          background: screenBg,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
          fontFamily: fonts.ui,
          color: ink.text,
        }}
      >
        {/* reflejo diagonal sutil */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(112deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.045) 16%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.035) 80%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* isla dinámica */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 180,
            height: 50,
            borderRadius: 25,
            background: '#000',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        />

        {/* estado */}
        <div style={{position: 'absolute', top: 30, right: 32, display: 'flex', alignItems: 'center', gap: 8}}>
          <Wifi />
          <Battery />
        </div>

        {/* fecha y hora */}
        <div style={{position: 'absolute', top: 98, left: 0, right: 0, textAlign: 'center', fontWeight: 500, fontSize: 30, color: white(0.95), letterSpacing: '-0.005em'}}>
          {date}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 160,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 172,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: white(0.97),
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {time}
        </div>

        {/* notificaciones */}
        <div style={{position: 'absolute', top: 386, left: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 10}}>
          {notifications.map((n, i) => (
            <Notification key={i} n={n} tone={tone} />
          ))}
        </div>

        {/* píldora "N sin responder" */}
        {pending ? (
          <div
            style={{
              position: 'absolute',
              bottom: 180,
              left: '50%',
              transform: 'translateX(-50%)',
              background: pillBg,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              borderRadius: radius.pill,
              padding: '11px 22px 12px',
              fontSize: 24,
              color: white(0.86),
              whiteSpace: 'nowrap',
              letterSpacing: '-0.005em',
            }}
          >
            <span style={{fontWeight: 700, color: pending.count === 0 ? status.ok : '#FFFFFF', fontVariantNumeric: 'tabular-nums'}}>{pending.count}</span> {pending.label ?? 'sin responder'}
          </div>
        ) : null}

        {/* linterna y cámara */}
        {(['left', 'right'] as const).map((side) => (
          <div
            key={side}
            style={{
              position: 'absolute',
              bottom: 44,
              [side]: 48,
              width: 86,
              height: 86,
              borderRadius: 43,
              background: btnBg,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.09), 0 4px 14px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {side === 'left' ? <Flashlight /> : <Camera />}
          </div>
        ))}

        {/* barra inferior */}
        <div style={{position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', width: 190, height: 6, borderRadius: 3, background: white(0.92)}} />
      </div>
    </div>
  );
};
