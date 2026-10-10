import React from 'react';
import {accent, apps, fonts, ink, shadow, status} from '../tokens';
import {InstagramIcon, WhatsAppIcon} from './icons';

// Panel de operación (900 x 520): ventana de navegador oscura con tres puntos y título "Tu Empresa"; dentro, barra de
// app con 3 KPIs, titular "Clientes que avanzan solos" y 4 columnas kanban (LEADS NUEVOS / EN SEGUIMIENTO / AGENDADOS /
// EN TUS MANOS) con tarjetitas de leads. `progress` 0..1 hace aparecer las columnas de izquierda a derecha
// (sin valor = todo visible). No anima por sí solo.

export const DASHBOARD_W = 900;
export const DASHBOARD_H = 480;

export type DashboardProps = {
  progress?: number; // 0..1 columnas de izquierda a derecha (escalonadas); sin valor = 1
  company?: string; // "Tu Empresa"
  style?: React.CSSProperties; // contenedor exterior
};

type Source = 'whatsapp' | 'instagram' | 'web';
type Lead = {name: string; desc: string; source: Source; amount?: string; foot: string};
type Column = {title: string; sub: string; color: string; leads: Lead[]};

const COLUMNS: Column[] = [
  {
    title: 'Consultas nuevas',
    sub: 'El asistente contesta y califica',
    color: accent.strong,
    leads: [
      {name: 'Ignacia Fuentes', desc: 'Quiere partir este mes', source: 'whatsapp', foot: 'Respondido en 40 s · hace 2 min'},
      {name: 'Camila Rojas', desc: 'Preguntó por el plan mensual', source: 'instagram', foot: 'Cotización enviada · hace 9 min'},
      {name: 'Jorge Maldonado', desc: 'Pide hora para una evaluación', source: 'whatsapp', foot: 'Preguntas resueltas · hace 14 min'},
    ],
  },
  {
    title: 'En seguimiento',
    sub: 'Recordatorios automáticos',
    color: status.warn,
    leads: [
      {name: 'Valentina Núñez', desc: 'Cotización enviada, lo conversa con su socio', source: 'whatsapp', amount: '$ 430.000', foot: 'Recordatorio el jueves · hace 1 h'},
      {name: 'Andrés Silva', desc: 'Está comparando con otras dos empresas', source: 'instagram', foot: 'Seguimiento el jueves · hace 3 h'},
      {name: 'Paula Garrido', desc: 'Pidió referencias de un cliente', source: 'whatsapp', foot: 'Caso enviado · hace 5 h'},
    ],
  },
  {
    title: 'Agendados',
    sub: 'Reuniones puestas en tu agenda',
    color: status.ok,
    leads: [
      {name: 'Marcela Torres', desc: 'Reunión inicial por videollamada', source: 'whatsapp', foot: 'Confirmada · mié 14, 11:30'},
      {name: 'Felipe Aravena', desc: 'Demo del servicio con el equipo', source: 'web', foot: 'Confirmada · jue 15, 16:00'},
    ],
  },
  {
    title: 'En tus manos',
    sub: 'Solo cuando vale la pena',
    color: apps.instagram,
    leads: [
      {name: 'Rosa Ibáñez', desc: 'Proyecto grande, negociación final', source: 'whatsapp', amount: '$ 2.400.000', foot: 'Con Marta · hace 28 min'},
      {name: 'Tomás Vega', desc: 'Prefiere hablar con una persona', source: 'instagram', foot: 'Derivado a tu equipo · 41 min'},
    ],
  },
];

const KPIS: Array<[string, string]> = [
  ['22', 'consultas nuevas'],
  ['92 %', 'respondidas solas'],
  ['40 s', 'primera respuesta'],
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const mono: React.CSSProperties = {fontFamily: fonts.mono, textTransform: 'uppercase', letterSpacing: '0.14em'};

const SourceChip: React.FC<{source: Source}> = ({source}) => {
  const label = source === 'whatsapp' ? 'WhatsApp' : source === 'instagram' ? 'Instagram' : 'Web';
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 3, padding: '2px 5px 2px 3px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', flexShrink: 0}}>
      {source === 'whatsapp' ? (
        <WhatsAppIcon size={10} />
      ) : source === 'instagram' ? (
        <InstagramIcon size={10} />
      ) : (
        <svg width={10} height={10} viewBox="0 0 24 24" aria-hidden style={{display: 'block'}}>
          <circle cx="12" cy="12" r="10" fill="none" stroke={accent.text} strokeWidth="2.2" />
          <path d="M2.5 12h19M12 2.5c3 3 3 16 0 19M12 2.5c-3 3-3 16 0 19" fill="none" stroke={accent.text} strokeWidth="1.8" />
        </svg>
      )}
      <span style={{fontSize: 9, fontWeight: 500, color: ink.text2, letterSpacing: '0.005em'}}>{label}</span>
    </div>
  );
};

const LeadCard: React.FC<{lead: Lead; color: string; t: number}> = ({lead, color, t}) => (
  <div
    style={{
      position: 'relative',
      boxSizing: 'border-box',
      borderRadius: 9,
      background: ink.panel2,
      boxShadow: '0 6px 14px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(255,255,255,0.06)',
      padding: '8px 8px 8px 11px',
      overflow: 'hidden',
      opacity: t,
      transform: `translateY(${(1 - t) * 10}px)`,
    }}
  >
    <div style={{position: 'absolute', left: 0, top: 8, bottom: 8, width: 2.5, borderRadius: 2, background: color, opacity: 0.9}} />
    <div style={{display: 'flex', alignItems: 'center', gap: 5}}>
      <div style={{flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, letterSpacing: '-0.015em', color: ink.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{lead.name}</div>
      <SourceChip source={lead.source} />
    </div>
    <div style={{fontSize: 11, lineHeight: 1.3, color: ink.text2, marginTop: 3, letterSpacing: '-0.005em'}}>{lead.desc}</div>
    {lead.amount ? <div style={{fontSize: 12, fontWeight: 600, color: ink.text, marginTop: 4, fontVariantNumeric: 'tabular-nums'}}>{lead.amount}</div> : null}
    <div style={{display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 9.5, color: ink.text3, letterSpacing: '0.01em', whiteSpace: 'nowrap'}}>
      <div style={{width: 5, height: 5, borderRadius: 3, background: color, flexShrink: 0}} />
      <span style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>{lead.foot}</span>
    </div>
  </div>
);

const Avatar: React.FC<{initials: string; bg: string; style?: React.CSSProperties}> = ({initials, bg, style}) => (
  <div
    style={{
      width: 22,
      height: 22,
      borderRadius: 11,
      background: bg,
      boxShadow: `0 0 0 2px ${ink.panel}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 8.5,
      fontWeight: 700,
      letterSpacing: '0.02em',
      color: ink.text,
      ...style,
    }}
  >
    {initials}
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({progress = 1, company = 'Tu Empresa', style}) => {
  return (
    <div
      style={{
        position: 'relative',
        width: DASHBOARD_W,
        height: DASHBOARD_H,
        boxSizing: 'border-box',
        borderRadius: 16,
        background: ink.panel,
        boxShadow: `${shadow.card}, inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(255,255,255,0.06)`,
        overflow: 'hidden',
        fontFamily: fonts.ui,
        color: ink.text,
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {/* Barra del navegador */}
      <div style={{position: 'relative', height: 44, flexShrink: 0, background: '#171C27', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 18px'}}>
        <div style={{display: 'flex', gap: 8}}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <div key={c} style={{width: 12, height: 12, borderRadius: 6, background: c, boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.25)'}} />
          ))}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', pointerEvents: 'none'}}>
          {company}
        </div>
        <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 8px', borderRadius: 999, background: 'rgba(61,214,140,0.12)', boxShadow: 'inset 0 0 0 1px rgba(61,214,140,0.25)'}}>
          <div style={{width: 7, height: 7, borderRadius: 4, background: status.ok, boxShadow: `0 0 8px ${status.ok}`}} />
          <span style={{fontSize: 11.5, fontWeight: 500, color: status.ok}}>agente en línea</span>
        </div>
      </div>

      {/* Barra de la app: marca + KPIs + equipo */}
      <div style={{height: 52, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12}}>
        <div style={{width: 26, height: 26, borderRadius: 7, background: accent.button, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.display, fontWeight: 700, fontSize: 11, color: '#fff', letterSpacing: '-0.03em', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)'}}>
          ZH
        </div>
        <div style={{lineHeight: 1.1}}>
          <div style={{...mono, fontSize: 8.5, color: ink.text3}}>ZH Development</div>
          <div style={{fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', marginTop: 2}}>Panel de operación</div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 26, marginLeft: 36}}>
          {KPIS.map(([v, l]) => (
            <div key={l} style={{lineHeight: 1.1}}>
              <div style={{fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums'}}>{v}</div>
              <div style={{...mono, fontSize: 8.5, color: ink.text3, marginTop: 3}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, background: 'rgba(61,214,140,0.12)'}}>
            <div style={{width: 6, height: 6, borderRadius: 3, background: status.ok}} />
            <span style={{fontSize: 10.5, fontWeight: 600, color: status.ok}}>Asistente activo</span>
          </div>
          <div style={{display: 'flex'}}>
            <Avatar initials="AL" bg="#3A4660" />
            <Avatar initials="MR" bg="#5A4A7A" style={{marginLeft: -6}} />
          </div>
        </div>
      </div>

      {/* Titular + explicación */}
      <div style={{flexShrink: 0, display: 'flex', alignItems: 'flex-end', padding: '14px 20px 10px', gap: 24}}>
        <div style={{fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1, whiteSpace: 'nowrap'}}>
          Clientes que avanzan <span style={{fontFamily: fonts.serif, fontStyle: 'italic', fontWeight: 400, fontSize: 29, color: accent.text, letterSpacing: '0'}}>solos</span>
        </div>
        <div style={{marginLeft: 'auto', fontSize: 14, lineHeight: 1.2, color: ink.text3, textAlign: 'right', letterSpacing: '-0.005em', whiteSpace: 'nowrap'}}>
          {company} · el asistente responde, califica y agenda
        </div>
      </div>

      {/* Kanban */}
      <div style={{flex: 1, minHeight: 0, display: 'flex', gap: 10, padding: '0 16px 16px'}}>
        {COLUMNS.map((col, i) => {
          const t = clamp01((progress - i * 0.2) / 0.4);
          return (
            <div
              key={col.title}
              style={{
                flex: 1,
                minWidth: 0,
                boxSizing: 'border-box',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.025)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
                padding: '10px 7px',
                opacity: t,
                transform: `translateY(${(1 - t) * 14}px)`,
              }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: 6, padding: '0 2px'}}>
                <div style={{width: 7, height: 7, borderRadius: 4, background: col.color, boxShadow: `0 0 8px ${col.color}`}} />
                <div style={{...mono, fontSize: 9.5, color: ink.text2}}>{col.title}</div>
                <div style={{marginLeft: 'auto', fontSize: 9.5, fontWeight: 600, color: ink.text3, fontVariantNumeric: 'tabular-nums'}}>{col.leads.length}</div>
              </div>
              <div style={{fontSize: 9.5, color: ink.text3, margin: '3px 2px 8px', letterSpacing: '-0.005em'}}>{col.sub}</div>
              <div style={{display: 'flex', flexDirection: 'column', gap: 7}}>
                {col.leads.map((lead, j) => (
                  <LeadCard key={lead.name} lead={lead} color={col.color} t={clamp01((t - j * 0.18) / 0.5)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
