import React from 'react';
import {apps, fonts, ink, radius, shadow, status} from '../tokens';
import {BankIcon, CalendarIcon, ExcelIcon, GmailM, InstagramIcon, InstagramRing, PdfIcon, WhatsAppIcon} from './icons';

// Biblioteca de tarjetas de "trabajo manual" (WhatsApp, Excel, post-it, factura, Gmail, DM de Instagram, banco,
// calendario, orden de compra). Cada tarjeta tiene tamaño fijo en px, NO anima y dibuja un estado a partir de
// `variant` (0..variants-1, se toma módulo). La escena decide posición, escala y entrada.
//
// Uso típico:  <WhatsAppCard variant={1} />   o   <CardAt index={i} />  para repartir N tarjetas.

export type CardProps = {
  variant?: number; // contenido 0..n-1 (se toma módulo, cualquier entero sirve)
  style?: React.CSSProperties; // se aplica al contenedor exterior (position, transform, etc.)
};

const pick = <T,>(arr: readonly T[], variant: number | undefined) => {
  const n = arr.length;
  const v = variant ?? 0;
  return arr[((Math.floor(v) % n) + n) % n];
};

const ellipsis: React.CSSProperties = {whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0};
const row: React.CSSProperties = {display: 'flex', alignItems: 'center'};

// Contenedor base: tamaño fijo, sombra profunda, brillo de 1 px arriba y borde sutil en las oscuras.
const Shell: React.FC<{
  w: number;
  h: number;
  bg: string;
  dark?: boolean;
  r?: number;
  pad?: string | number;
  shadowCss?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({w, h, bg, dark = false, r = radius.cardSm + 2, pad = 0, shadowCss, style, children}) => (
  <div
    style={{
      position: 'relative',
      width: w,
      height: h,
      boxSizing: 'border-box',
      borderRadius: r,
      background: bg,
      overflow: 'hidden',
      padding: pad,
      fontFamily: fonts.ui,
      color: dark ? ink.text : '#202124',
      boxShadow:
        shadowCss ??
        (dark
          ? `${shadow.card}, inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(255,255,255,0.055)`
          : `${shadow.card}, inset 0 1px 0 rgba(255,255,255,0.9)`),
      ...style,
    }}
  >
    {children}
  </div>
);

/* ───────────────────────────── 1. WhatsApp ───────────────────────────── */

const WA_W = 300;
const WA_H = 150;
type WaData = {name: string; time: string; from?: string; fromColor?: string; msgs: string[]};
const WA: WaData[] = [
  {name: 'Tu Empresa', time: '21:40', from: 'Camila Rojas', fromColor: '#F2A05E', msgs: ['Hola! tienen stock del modelo azul?']},
  {name: 'Tu Empresa', time: '21:46', from: 'Pía', fromColor: '#E85FB4', msgs: ['me pueden cotizar 20?']},
  {name: 'Don Jorge', time: '21:48', msgs: ['hola?', 'alguien?']},
];

// Chat de WhatsApp (modo oscuro): cabecera con burbuja verde, nombre y hora; mensajes entrantes en burbujas.
export const WhatsAppCard: React.FC<CardProps> = ({variant, style}) => {
  const d = pick(WA, variant);
  return (
    <Shell w={WA_W} h={WA_H} bg="#0E161C" dark pad="12px 14px" style={style}>
      <div style={{...row, gap: 9}}>
        <WhatsAppIcon size={24} />
        <div style={{...ellipsis, flex: 1, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em'}}>{d.name}</div>
        <div style={{fontSize: 13, color: '#8696A0'}}>{d.time}</div>
      </div>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, marginTop: 9}}>
        {d.msgs.map((m, i) => (
          <div
            key={i}
            style={{
              maxWidth: 246,
              background: '#1F2C34',
              borderRadius: 10,
              borderTopLeftRadius: i === 0 ? 3 : 10,
              padding: '6px 11px 7px',
              boxShadow: '0 1px 1px rgba(0,0,0,0.35)',
            }}
          >
            {i === 0 && d.from ? <div style={{fontSize: 13, fontWeight: 600, color: d.fromColor, marginBottom: 1}}>{d.from}</div> : null}
            <div style={{fontSize: 16, lineHeight: 1.28, color: '#E9EDEF'}}>{m}</div>
          </div>
        ))}
      </div>
    </Shell>
  );
};

/* ───────────────────────────── 2. Excel ───────────────────────────── */

const XL_W = 320;
const XL_H = 160;
const XL_FILES = ['inventario_FINAL_v3.xlsx', 'cobros_pendientes.xlsx', 'ventas_octubre (2).xlsx'];
const XL_ROWS: Array<[string, string, string]> = [
  ['producto', 'stock', 'precio'],
  ['modelo azul', '12', '24.990'],
  ['modelo rojo', '#REF!', '19.990'],
];

// Planilla de Excel: cabecera verde con nombre de archivo, columnas A/B/C y un #REF! en rojo seleccionado.
export const ExcelCard: React.FC<CardProps> = ({variant, style}) => {
  const file = pick(XL_FILES, variant);
  const cols = '24px 142px 68px 86px';
  const cell: React.CSSProperties = {
    boxSizing: 'border-box',
    height: 33,
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    borderRight: `1px solid ${apps.excelGrid}`,
    borderBottom: `1px solid ${apps.excelGrid}`,
    fontSize: 13,
    color: '#1F2933',
    ...ellipsis,
  };
  const head: React.CSSProperties = {...cell, height: 22, background: '#F2F4F6', color: '#6B7684', fontSize: 13, justifyContent: 'center', padding: 0};
  return (
    <Shell w={XL_W} h={XL_H} bg="#FFFFFF" style={style}>
      <div style={{...row, gap: 7, height: 30, background: apps.excel, padding: '0 10px', color: '#FFFFFF'}}>
        <ExcelIcon size={17} />
        <div style={{...ellipsis, fontSize: 13, fontWeight: 600, letterSpacing: '-0.005em'}}>{file}</div>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: cols}}>
        <div style={head} />
        {['A', 'B', 'C'].map((c) => (
          <div key={c} style={head}>
            {c}
          </div>
        ))}
        {XL_ROWS.map((r, ri) => (
          <React.Fragment key={ri}>
            <div style={{...head, height: 33}}>{ri + 1}</div>
            {r.map((v, ci) => {
              const isRef = v === '#REF!';
              const num = ci > 0 && ri > 0;
              return (
                <div
                  key={ci}
                  style={{
                    ...cell,
                    justifyContent: num ? 'flex-end' : 'flex-start',
                    fontWeight: ri === 0 ? 600 : 400,
                    ...(isRef
                      ? {
                          background: '#FDECEE',
                          color: status.danger,
                          fontWeight: 700,
                          boxShadow: `inset 0 0 0 2px ${apps.excel}`,
                          justifyContent: 'center',
                        }
                      : null),
                  }}
                >
                  {v}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </Shell>
  );
};

/* ───────────────────────────── 3. Post-it ───────────────────────────── */

const SN_W = 280;
const SN_H = 200;
const SN: Array<{text: string; rotate: number}> = [
  {text: 'cobrar a Pérez (otra vez)', rotate: -2.6},
  {text: 'responder Instagram', rotate: 1.8},
  {text: 'llamar proveedor 15:30', rotate: -1.1},
];

// Post-it amarillo con texto manuscrito (Caveat), esquina doblada y sombra de papel. `rotate` en grados.
export const StickyNote: React.FC<CardProps & {rotate?: number}> = ({variant, rotate, style}) => {
  const d = pick(SN, variant);
  const rot = rotate ?? d.rotate;
  const fold = 30;
  return (
    <div style={{position: 'relative', width: SN_W, height: SN_H, transform: `rotate(${rot}deg)`, fontFamily: fonts.hand, ...style}}>
      <div style={{position: 'absolute', inset: 2, borderRadius: 2, boxShadow: shadow.paper}} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(172deg, #FCEF86 0%, ${apps.sticky} 38%, ${apps.stickyShade} 100%)`,
          clipPath: `polygon(0 0, 100% 0, 100% calc(100% - ${fold}px), calc(100% - ${fold}px) 100%, 0 100%)`,
          borderRadius: 2,
        }}
      >
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 26, background: 'rgba(255,255,255,0.16)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: 'rgba(255,255,255,0.45)'}} />
        <div
          style={{
            position: 'absolute',
            left: 22,
            right: 22,
            top: 40,
            fontSize: 33,
            lineHeight: 1.1,
            fontWeight: 600,
            color: apps.stickyInk,
            transform: 'rotate(-1deg)',
          }}
        >
          {d.text}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: fold,
          height: fold,
          background: 'linear-gradient(to bottom right, #FBF1A4 0%, #E9D558 44%, #C8B135 50%, rgba(0,0,0,0) 50%)',
          filter: 'drop-shadow(-2px -2px 3px rgba(0,0,0,0.18))',
        }}
      />
    </div>
  );
};

/* ───────────────────────────── 4. Factura ───────────────────────────── */

const INV_W = 320;
const INV_H = 170;
const INV: Array<{n: string; client: string; total: string; due: string; stamp: string; rot: number}> = [
  {n: '1043', client: 'Comercial Andes', total: '$ 384.900', due: '28-09-2026', stamp: 'VENCIDA', rot: -12},
  {n: '1037', client: 'Ferretería Lagos', total: '$ 129.500', due: '15-09-2026', stamp: 'VENCIDA', rot: -9},
  {n: '1051', client: 'Distribuidora Norte', total: '$ 1.204.300', due: '02-10-2026', stamp: 'VENCIDA', rot: -15},
];

// Factura electrónica en papel: número, cliente, total y timbre rojo rotado "VENCIDA" con borde doble.
export const InvoiceCard: React.FC<CardProps> = ({variant, style}) => {
  const d = pick(INV, variant);
  const line: React.CSSProperties = {...row, justifyContent: 'space-between', fontSize: 14, color: apps.paperInk};
  return (
    <Shell w={INV_W} h={INV_H} bg={apps.paper} r={radius.cardSm} pad="15px 18px 14px" shadowCss={shadow.paper} style={style}>
      <div style={{fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', color: apps.paperInk, whiteSpace: 'nowrap'}}>FACTURA ELECTRÓNICA</div>
      <div style={{fontSize: 13, color: apps.paperMuted, marginTop: 3}}>N° {d.n}</div>
      <div style={{height: 1, background: apps.paperLine, margin: '10px 0 9px'}} />
      <div style={{...line, marginBottom: 5}}>
        <span style={{color: apps.paperMuted}}>Cliente</span>
        <span style={{fontWeight: 500}}>{d.client}</span>
      </div>
      <div style={{...line, marginBottom: 5}}>
        <span style={{color: apps.paperMuted}}>Vence</span>
        <span style={{color: apps.paperMuted}}>{d.due}</span>
      </div>
      <div style={{...line, fontSize: 16, fontWeight: 700}}>
        <span>Total</span>
        <span>{d.total}</span>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 12,
          top: 11,
          transform: `rotate(${d.rot}deg)`,
          color: apps.stamp,
          border: `2px solid ${apps.stamp}`,
          borderRadius: 4,
          padding: '3px 7px',
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: '0.14em',
          whiteSpace: 'nowrap',
          boxShadow: `0 0 0 2px ${apps.paper}, 0 0 0 3.5px ${apps.stamp}`,
          opacity: 0.86,
          mixBlendMode: 'multiply',
        }}
      >
        {d.stamp}
      </div>
    </Shell>
  );
};

/* ───────────────────────────── 5. Gmail ───────────────────────────── */

const GM_W = 320;
const GM_H = 150;
const GM: Array<{from: string; time: string; subject: string; preview: string}> = [
  {from: 'Cliente Pérez', time: '21:21', subject: 'RE: RE: RE: cotización', preview: 'Hola, sigo esperando la cotización que me…'},
  {from: 'Proveedor Sur', time: '21:18', subject: 'Orden de compra 588', preview: 'Adjunto la orden, confirmar recepción por…'},
  {from: 'Contabilidad', time: '21:16', subject: 'Factura 1043 vencida', preview: 'Recordatorio: el pago venció hace 12 días…'},
];

// Correo de Gmail: M de colores, remitente, hora azul, asunto en negrita y vista previa gris.
export const GmailCard: React.FC<CardProps> = ({variant, style}) => {
  const d = pick(GM, variant);
  return (
    <Shell w={GM_W} h={GM_H} bg="#FFFFFF" pad="16px 18px" style={style}>
      <div style={{...row, gap: 10}}>
        <GmailM size={24} />
        <div style={{...ellipsis, flex: 1, fontSize: 15, fontWeight: 700, color: '#202124'}}>{d.from}</div>
        <div style={{fontSize: 13, fontWeight: 500, color: '#1A73E8'}}>{d.time}</div>
      </div>
      <div style={{...ellipsis, fontSize: 17, fontWeight: 700, color: '#202124', marginTop: 13, letterSpacing: '-0.01em'}}>{d.subject}</div>
      <div style={{...ellipsis, fontSize: 14, color: '#5F6368', marginTop: 6}}>{d.preview}</div>
    </Shell>
  );
};

/* ───────────────────────────── 6. Instagram DM ───────────────────────────── */

const IG_W = 300;
const IG_H = 140;
const IG: Array<{user: string; msg: string}> = [
  {user: 'maria.jose', msg: 'precio???'},
  {user: 'tienda.lu', msg: 'hacen envíos a regiones?'},
  {user: 'cata.ulloa', msg: 'sigue disponible??'},
];

// DM de Instagram: fondo negro, avatar con anillo degradado e inicial, usuario y burbuja gris oscura.
export const InstagramDMCard: React.FC<CardProps> = ({variant, style}) => {
  const d = pick(IG, variant);
  return (
    <Shell w={IG_W} h={IG_H} bg="#0B0B0F" dark pad="13px 14px" style={style}>
      <div style={{...row, gap: 10}}>
        <InstagramRing size={30} ring={2}>
          <span style={{fontSize: 13, fontWeight: 700, color: '#FFFFFF', fontFamily: fonts.ui}}>{d.user[0].toUpperCase()}</span>
        </InstagramRing>
        <div style={{...ellipsis, flex: 1, fontSize: 15, fontWeight: 600, color: '#FAFAFA'}}>{d.user}</div>
        <InstagramIcon size={18} />
      </div>
      <div style={{display: 'flex', marginTop: 12}}>
        <div style={{maxWidth: 236, background: '#262626', borderRadius: 18, padding: '9px 14px', fontSize: 16, lineHeight: 1.3, color: '#FAFAFA'}}>{d.msg}</div>
      </div>
    </Shell>
  );
};

/* ───────────────────────────── 7. Banco ───────────────────────────── */

const BK_W = 320;
const BK_H = 140;
const BK: Array<{title: string; body: string; time: string}> = [
  {title: 'Transferencia recibida', body: 'Tienes un abono que no está c…', time: '21:32'},
  {title: 'Pago rechazado', body: 'La transferencia a Proveedor Sur no s…', time: '09:14'},
  {title: 'Cartola disponible', body: 'Tienes 14 movimientos sin categori…', time: '08:02'},
];

// Notificación de banco: fondo azul muy oscuro, ícono de banco, "Banco", título, texto cortado y hora.
export const BankCard: React.FC<CardProps> = ({variant, style}) => {
  const d = pick(BK, variant);
  return (
    <Shell w={BK_W} h={BK_H} bg={`linear-gradient(180deg, #121C33 0%, ${apps.bank} 100%)`} dark pad="14px 16px 14px 18px" style={style}>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: apps.bankAccent}} />
      <div style={{...row, gap: 10}}>
        <BankIcon size={24} />
        <div style={{...ellipsis, flex: 1, fontSize: 14, fontWeight: 600, color: ink.text2, letterSpacing: '0.01em'}}>Banco</div>
        <div style={{fontSize: 13, color: ink.text3}}>{d.time}</div>
      </div>
      <div style={{...ellipsis, fontSize: 17, fontWeight: 700, color: ink.text, marginTop: 12, letterSpacing: '-0.01em'}}>{d.title}</div>
      <div style={{...ellipsis, fontSize: 14, color: ink.text2, marginTop: 5}}>{d.body}</div>
    </Shell>
  );
};

/* ───────────────────────────── 8. Calendario ───────────────────────────── */

const CAL_W = 300;
const CAL_H = 160;
type CalBlock = {title: string; sub: string; color: string; from: number; to: number; left: number; w: number};
const CAL: Array<{start: number; blocks: CalBlock[]}> = [
  {
    start: 14,
    blocks: [
      {title: 'Reunión de ventas', sub: '15:00 a 16:00', color: '#1E9BE9', from: 14.55, to: 15.75, left: 0, w: 150},
      {title: 'Llamar proveedor', sub: '15:30', color: '#F4511E', from: 15.4, to: 16.5, left: 100, w: 128},
    ],
  },
  {
    start: 9,
    blocks: [
      {title: 'Entrega pedido 588', sub: '09:30 a 10:30', color: '#1E9BE9', from: 9.4, to: 10.5, left: 0, w: 160},
      {title: 'Cobrar a Pérez', sub: '10:00', color: '#F4511E', from: 9.95, to: 11.1, left: 96, w: 132},
    ],
  },
  {
    start: 16,
    blocks: [
      {title: 'Inventario', sub: '16:00 a 18:00', color: '#1E9BE9', from: 16.1, to: 17.8, left: 0, w: 120},
      {title: 'Reunión contador', sub: '17:00', color: '#F4511E', from: 16.85, to: 18.0, left: 72, w: 156},
    ],
  },
];

// Mini agenda: horas a la izquierda y dos bloques de eventos (azul y rojo) superpuestos.
export const CalendarEventCard: React.FC<CardProps> = ({variant, style}) => {
  const d = pick(CAL, variant);
  const top = 18; // y de la primera hora
  const hourPx = 52;
  const x0 = 62;
  const hours = [0, 1, 2].map((i) => d.start + i);
  const y = (h: number) => top + (h - d.start) * hourPx;
  return (
    <Shell w={CAL_W} h={CAL_H} bg="#FFFFFF" style={style}>
      <CalendarIcon size={20} style={{position: 'absolute', right: 10, top: 9}} />
      {hours.map((h) => (
        <React.Fragment key={h}>
          <div style={{position: 'absolute', left: 12, top: y(h) - 8, fontSize: 13, color: '#70757A', fontVariantNumeric: 'tabular-nums'}}>
            {String(h).padStart(2, '0')}:00
          </div>
          <div style={{position: 'absolute', left: x0 - 6, right: 0, top: y(h), height: 1, background: '#E6E8EB'}} />
        </React.Fragment>
      ))}
      {d.blocks.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x0 + b.left,
            top: y(b.from),
            width: b.w,
            height: (b.to - b.from) * hourPx,
            background: b.color,
            borderRadius: 6,
            padding: '5px 8px',
            boxSizing: 'border-box',
            color: '#FFFFFF',
            overflow: 'hidden',
            boxShadow: i > 0 ? '0 0 0 1.5px #FFFFFF, 0 6px 14px rgba(0,0,0,0.22)' : 'none',
          }}
        >
          <div style={{...ellipsis, fontSize: 13, fontWeight: 700, lineHeight: 1.2}}>{b.title}</div>
          <div style={{fontSize: 13, opacity: 0.85, lineHeight: 1.2, marginTop: 1}}>{b.sub}</div>
        </div>
      ))}
    </Shell>
  );
};

/* ───────────────────────────── 9. Orden de compra ───────────────────────────── */

const PO_W = 320;
const PO_H = 150;
const PO: Array<{n: string; vendor: string; msg: string; file: string; state: string}> = [
  {n: '588', vendor: 'Proveedor Sur', msg: 'Adjunto la orden, confirmar recepción', file: 'OC-588.pdf', state: 'sin confirmar'},
  {n: '591', vendor: 'Distribuidora Norte', msg: 'Favor confirmar fecha de despacho', file: 'OC-591.pdf', state: 'sin confirmar'},
  {n: '602', vendor: 'Importadora Lira', msg: 'Falta la OC firmada para despachar', file: 'OC-602_firmar.pdf', state: 'pendiente'},
];

// Orden de compra: documento blanco con número, proveedor, mensaje, adjunto PDF y estado "sin confirmar".
export const PurchaseOrderCard: React.FC<CardProps> = ({variant, style}) => {
  const d = pick(PO, variant);
  return (
    <Shell w={PO_W} h={PO_H} bg="#FFFFFF" pad="13px 16px 12px" style={style}>
      <div style={{...row, gap: 8}}>
        <div style={{fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', color: '#5F6368', whiteSpace: 'nowrap'}}>ORDEN DE COMPRA</div>
        <div style={{flex: 1}} />
        <div style={{fontFamily: fonts.mono, fontSize: 13, fontWeight: 500, color: '#202124', background: '#F1F3F4', borderRadius: 4, padding: '1px 7px', whiteSpace: 'nowrap'}}>
          N° {d.n}
        </div>
      </div>
      <div style={{...ellipsis, fontSize: 17, fontWeight: 700, color: '#202124', marginTop: 10, letterSpacing: '-0.01em'}}>{d.vendor}</div>
      <div style={{...ellipsis, fontSize: 14, color: '#5F6368', marginTop: 3}}>{d.msg}</div>
      <div style={{...row, gap: 8, marginTop: 10}}>
        <div style={{...row, gap: 7, minWidth: 0, border: '1px solid #DADCE0', borderRadius: 8, padding: '4px 10px 4px 7px', background: '#F8F9FA'}}>
          <PdfIcon size={16} />
          <span style={{...ellipsis, fontSize: 13, fontWeight: 500, color: '#3C4043'}}>{d.file}</span>
        </div>
        <div style={{flex: 1}} />
        <div style={{...row, gap: 6, fontSize: 13, fontWeight: 600, color: '#B45309', background: '#FEF3C7', borderRadius: 999, padding: '3px 10px 3px 8px', whiteSpace: 'nowrap'}}>
          <span style={{width: 7, height: 7, borderRadius: 4, background: status.warn, display: 'inline-block'}} />
          {d.state}
        </div>
      </div>
    </Shell>
  );
};

/* ───────────────────────────── Catálogo ───────────────────────────── */

export type CardSpec = {
  name: string;
  Component: React.FC<CardProps>;
  w: number;
  h: number;
  variants: number;
};

// Todas las tarjetas con su tamaño y cuántas variantes de contenido tienen. Orden pensado para alternar
// oscuras y claras al recorrerlo en secuencia.
export const ALL_CARDS: CardSpec[] = [
  {name: 'whatsapp', Component: WhatsAppCard, w: WA_W, h: WA_H, variants: WA.length},
  {name: 'gmail', Component: GmailCard, w: GM_W, h: GM_H, variants: GM.length},
  {name: 'excel', Component: ExcelCard, w: XL_W, h: XL_H, variants: XL_FILES.length},
  {name: 'instagram', Component: InstagramDMCard, w: IG_W, h: IG_H, variants: IG.length},
  {name: 'invoice', Component: InvoiceCard, w: INV_W, h: INV_H, variants: INV.length},
  {name: 'calendar', Component: CalendarEventCard, w: CAL_W, h: CAL_H, variants: CAL.length},
  {name: 'bank', Component: BankCard, w: BK_W, h: BK_H, variants: BK.length},
  {name: 'sticky', Component: StickyNote, w: SN_W, h: SN_H, variants: SN.length},
  {name: 'purchaseOrder', Component: PurchaseOrderCard, w: PO_W, h: PO_H, variants: PO.length},
];

// Elige tarjeta y variante de forma determinista por índice: el tipo cicla (índice mod 9) y la variante avanza
// cada vuelta completa, así 40 índices seguidos dan 40 tarjetas distintas y bien repartidas.
export const pickCard = (index: number, variant?: number): CardSpec & {variant: number} => {
  const n = ALL_CARDS.length;
  const i = ((Math.floor(index) % n) + n) % n;
  const spec = ALL_CARDS[i];
  const v = variant ?? Math.floor(Math.abs(index) / n) % spec.variants;
  return {...spec, variant: v};
};

// Dibuja la tarjeta número `index` (ver pickCard). `variant` fuerza el contenido.
export const CardAt: React.FC<{index: number; variant?: number; style?: React.CSSProperties}> = ({index, variant, style}) => {
  const {Component, variant: v} = pickCard(index, variant);
  return <Component variant={v} style={style} />;
};
