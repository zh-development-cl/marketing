import React from 'react';
import {Pop} from '../fx/text';
import {apps, fonts} from '../tokens';
import {WhatsAppIcon} from './icons';

// Conversación de WhatsApp (880 x 420, tarjeta blanca estilo WhatsApp web): cabecera con avatar "CR" y
// "Camila Rojas · WhatsApp"; burbuja entrante gris oscura con hora, etiqueta "AGENTE DE TU EMPRESA", burbuja
// saliente verde claro con doble check y sello "IA · revisado por tu equipo".
// `show` = cuántos elementos se ven: 0 nada · 1 entrante · 2 + etiqueta y respuesta · 3 + sello (fraccionario = entrando).
// No anima por sí solo.

export const CONVO_W = 880;
export const CONVO_H = 410;

export type WhatsAppConvoProps = {
  show: number; // 0 | 1 | 2 | 3 (fraccionario = el elemento siguiente a medio aparecer)
  company?: string; // "Tu Empresa" → etiqueta "AGENTE DE TU EMPRESA"
  name?: string; // "Camila Rojas"
  initials?: string; // "CR"
  incoming?: string; // texto entrante
  outgoing?: string; // texto de respuesta
  timeIn?: string; // "21:47"
  timeOut?: string; // "21:47"
  typing?: number; // 0..1 burbuja "escribiendo…" (tres puntos) en el lugar de la respuesta
  sealAt?: number; // frame local en que el sello entra con resorte (si no viene, entra por `show`)
  tick?: number; // frame, para el pulso de los puntos
  style?: React.CSSProperties; // contenedor exterior
};

const INK = '#111B21';
const MUTED = '#667781';
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const enter = (t: number, dy = 12): React.CSSProperties => ({opacity: t, transform: `translateY(${(1 - t) * dy}px)`, filter: t < 0.98 ? `blur(${(1 - t) * 4}px)` : undefined});

const DoubleCheck: React.FC = () => (
  <svg width={17} height={11} viewBox="0 0 17 11" aria-hidden style={{display: 'block'}}>
    <path d="M1 6.2 L4.2 9.4 L10.4 1.6" fill="none" stroke="#53BDEB" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.2 6.2 L9.4 9.4 L15.6 1.6" fill="none" stroke="#53BDEB" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Sparkle: React.FC<{color: string}> = ({color}) => (
  <svg width={12} height={12} viewBox="0 0 24 24" aria-hidden style={{display: 'block'}}>
    <path d="M12 2 C12.6 7.4 16.6 11.4 22 12 C16.6 12.6 12.6 16.6 12 22 C11.4 16.6 7.4 12.6 2 12 C7.4 11.4 11.4 7.4 12 2 Z" fill={color} />
  </svg>
);

export const WhatsAppConvo: React.FC<WhatsAppConvoProps> = ({
  show,
  company = 'Tu Empresa',
  name = 'Camila Rojas',
  initials = 'CR',
  incoming = 'Hola! tienen stock del modelo azul?',
  outgoing = 'Hola Camila, sí, quedan 12 a $24.990, te lo reservo?',
  timeIn = '21:47',
  timeOut = '21:47',
  typing = 0,
  tick = 0,
  sealAt,
  style,
}) => {
  const t1 = clamp01(show);
  const t2 = clamp01(show - 1);
  const t3 = clamp01(show - 2);
  const ty = clamp01(typing);
  return (
    <div
      style={{
        position: 'relative',
        width: CONVO_W,
        height: CONVO_H,
        boxSizing: 'border-box',
        borderRadius: 16,
        background: '#FFFFFF',
        boxShadow: '0 24px 48px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.9)',
        overflow: 'hidden',
        fontFamily: fonts.ui,
        color: INK,
        ...style,
      }}
    >
      {/* Cabecera */}
      <div style={{height: 76, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px', background: '#F7F8F8', borderBottom: '1px solid #E4E8EA'}}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            background: 'linear-gradient(160deg, #5C6F86 0%, #3E4C5E 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '0.02em',
            color: '#FFFFFF',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{lineHeight: 1.1}}>
          <div style={{fontSize: 21, fontWeight: 600, letterSpacing: '-0.015em'}}>{name}</div>
          <div style={{display: 'flex', alignItems: 'center', gap: 6, marginTop: 4}}>
            <WhatsAppIcon size={15} />
            <span style={{fontSize: 14, fontWeight: 500, color: MUTED}}>WhatsApp</span>
            <span style={{fontSize: 14, color: '#AEB7BD'}}>·</span>
            <span style={{fontSize: 14, color: MUTED}}>en línea</span>
          </div>
        </div>
        <div style={{marginLeft: 'auto', display: 'flex', gap: 6}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{width: 5, height: 5, borderRadius: 3, background: '#AEB7BD'}} />
          ))}
        </div>
      </div>

      {/* Cuerpo */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 76, bottom: 0, background: 'linear-gradient(180deg, #FFFFFF 0%, #FBFBFA 100%)'}}>
        {/* Entrante */}
        <div style={{position: 'absolute', left: 24, top: 22, ...enter(t1)}}>
          <div
            style={{
              position: 'relative',
              maxWidth: 560,
              boxSizing: 'border-box',
              padding: '12px 72px 12px 16px',
              borderRadius: 14,
              borderTopLeftRadius: 4,
              background: '#2A3340',
              color: '#F2F4F8',
              fontSize: 21,
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
              boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
            }}
          >
            {incoming}
            <div style={{position: 'absolute', right: 14, bottom: 9, fontSize: 12.5, color: '#9AA5B4', fontVariantNumeric: 'tabular-nums'}}>{timeIn}</div>
          </div>
        </div>

        {/* Escribiendo… (tres puntos que pulsan) */}
        {ty > 0 ? (
          <div style={{position: 'absolute', right: 24, top: 118, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ...enter(ty)}}>
            <div style={{fontFamily: fonts.mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTED, marginBottom: 8, paddingRight: 2}}>Agente de {company} · escribiendo</div>
            <div style={{display: 'flex', gap: 7, alignItems: 'center', height: 46, padding: '0 18px', borderRadius: 14, borderTopRightRadius: 4, background: apps.whatsappBubbleOut, boxShadow: '0 1px 2px rgba(0,0,0,0.12)'}}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{width: 9, height: 9, borderRadius: 5, background: '#5B7A62', opacity: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(tick / 2.2 - i * 1.3))}} />
              ))}
            </div>
          </div>
        ) : null}

        {/* Etiqueta + saliente */}
        <div style={{position: 'absolute', right: 24, top: 118, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ...enter(t2)}}>
          <div style={{fontFamily: fonts.mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTED, marginBottom: 8, paddingRight: 2}}>Agente de {company}</div>
          <div
            style={{
              position: 'relative',
              maxWidth: 620,
              boxSizing: 'border-box',
              padding: '12px 92px 12px 16px',
              borderRadius: 14,
              borderTopRightRadius: 4,
              background: apps.whatsappBubbleOut,
              color: INK,
              fontSize: 21,
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
              boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
            }}
          >
            {outgoing}
            <div style={{position: 'absolute', right: 12, bottom: 9, display: 'flex', alignItems: 'center', gap: 5}}>
              <span style={{fontSize: 12.5, color: '#6E8372', fontVariantNumeric: 'tabular-nums'}}>{timeOut}</span>
              <DoubleCheck />
            </div>
          </div>
        </div>

        {/* Sello IA */}
        <div style={{position: 'absolute', right: 24, top: 230, ...(sealAt === undefined ? enter(t3, 8) : {})}}>
          <Pop at={sealAt ?? -1000} from={0.6} config={{damping: 12, stiffness: 220}}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '6px 12px 6px 10px',
              borderRadius: 999,
              background: 'rgba(37,211,102,0.13)',
              boxShadow: 'inset 0 0 0 1px rgba(18,140,126,0.25)',
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: '0.01em',
              color: '#128C7E',
            }}
          >
            <Sparkle color="#128C7E" />
            IA · revisado por tu equipo
          </div>
          </Pop>
        </div>

        {/* Caja de texto */}
        <div style={{position: 'absolute', left: 24, right: 24, bottom: 20, height: 46, boxSizing: 'border-box', borderRadius: 23, background: '#F0F2F5', boxShadow: 'inset 0 0 0 1px #E2E6EA', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12}}>
          <div style={{width: 18, height: 18, borderRadius: 9, boxShadow: 'inset 0 0 0 1.6px #8696A0'}} />
          <div style={{flex: 1, fontSize: 15, color: '#8696A0'}}>Escribe un mensaje</div>
          <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden style={{display: 'block'}}>
            <path d="M12 15.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v6a3.5 3.5 0 0 0 3.5 3.5zM18 12a6 6 0 0 1-12 0M12 18v3" fill="none" stroke="#8696A0" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};
