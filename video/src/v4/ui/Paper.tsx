import React from 'react';
import {staticFile} from 'remotion';
import {accent, apps, fonts, shadow} from '../tokens';

// Documento en papel (760 x 1000, más 12 px de hojas apiladas detrás abajo/derecha). Dos páginas:
//   'cover' → cabecera ZH + fecha, "Propuesta para / Tu Empresa", 01 Diagnóstico con lista numerada (3 ítems)
//   'plan'  → 02 Plan por etapas: tabla ACTIVIDAD con barras por etapa + "QUÉ SE ENTREGA EN CADA CORTE" (4 filas)
// No anima por sí solo: `revealRows` atenúa (gris + leve desenfoque) las filas que todavía no "existen" y
// `barsProgress` dibuja el largo de las barras del plan, escalonadas de arriba hacia abajo.

export const PAPER_W = 760;
export const PAPER_H = 1000;
export const PAPER_STACK = 12; // desplazamiento total de las hojas de atrás: el conjunto ocupa 772 x 1012

export type PaperProps = {
  page: 'cover' | 'plan';
  revealRows?: number; // filas visibles de la lista (cover: 3 ítems; plan: 4 entregables). Fraccionario = en transición. Sin valor = todas.
  company?: string; // "Tu Empresa"
  barsProgress?: number; // solo plan: 0..1 largo de las barras (escalonadas). Sin valor = 1.
  date?: string; // solo cover, cabecera derecha. "MIÉRCOLES 15 DE OCTUBRE"
  style?: React.CSSProperties; // contenedor exterior (position, transform…)
};

const PAD = 56;
const ACCENT = accent.button; // azul más profundo: sobre papel claro se lee mejor que accent.strong
const INK = apps.paperInk;
const MUTED = apps.paperMuted;
const LINE = apps.paperLine;
const INK_SOFT = '#3A3F4A';

const serif: React.CSSProperties = {fontFamily: fonts.serif, fontWeight: 400, color: INK, lineHeight: 1, letterSpacing: '-0.01em'};
// Instrument Serif solo viene en 400: los títulos grandes se engordan con un trazo del mismo color (como un peso 600).
const heavy = (px: number, color: string = INK): React.CSSProperties => ({WebkitTextStroke: `${px}px ${color}`, color});
const caps: React.CSSProperties = {fontFamily: fonts.ui, fontWeight: 500, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED};
const abs = (left: number, top: number, extra?: React.CSSProperties): React.CSSProperties => ({position: 'absolute', left, top, ...extra});

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
// 1 = fila visible; 0 = fila atenuada (como la "3 · Cobros a mano" en la referencia, gris y fuera de foco).
const rowState = (i: number, reveal: number | undefined) => (reveal === undefined ? 1 : clamp01(reveal - i));
const rowStyle = (t: number): React.CSSProperties => ({
  opacity: 0.22 + 0.78 * t,
  filter: t < 0.98 ? `blur(${(1 - t) * 1.8}px)` : undefined,
});

// Monograma ZH chico: cuadro de tinta con "ZH" y un punto en acento, como sello de marca en el papel.
const Monogram: React.FC = () => (
  <div style={{position: 'relative', width: 30, height: 30, borderRadius: 7, background: INK, flexShrink: 0}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fonts.display,
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: '-0.03em',
        color: '#FFFFFF',
        paddingTop: 1,
      }}
    >
      ZH
    </div>
    <div style={{position: 'absolute', right: -3, top: -3, width: 9, height: 9, borderRadius: 5, background: ACCENT, boxShadow: `0 0 0 2px ${apps.paper}`}} />
  </div>
);

const Header: React.FC<{right: string}> = ({right}) => (
  <>
    <div style={abs(PAD, 40, {right: PAD, height: 36, display: 'flex', alignItems: 'center', gap: 12})}>
      <Monogram />
      <div style={{...serif, fontSize: 27, letterSpacing: '0', paddingTop: 2, ...heavy(0.35)}}>ZH Development</div>
      <div style={{...caps, marginLeft: 'auto', paddingTop: 2}}>{right}</div>
    </div>
    <div style={abs(PAD, 92, {right: PAD, height: 1, background: LINE})} />
  </>
);

const Footer: React.FC<{n: string}> = ({n}) => (
  <>
    <div style={abs(PAD, 924, {right: PAD, height: 1, background: LINE})} />
    <div style={abs(PAD, 940, {right: PAD, display: 'flex', alignItems: 'baseline'})}>
      <div style={{...caps, fontSize: 12}}>ZH Development SpA</div>
      <div style={{...serif, marginLeft: 'auto', fontSize: 20, color: INK}}>{n}</div>
    </div>
  </>
);

/* ───────────────────────────── cover ───────────────────────────── */

const DIAG: Array<[string, string]> = [
  ['Preguntas repetidas', 'stock y precios, todo el día'],
  ['Stock en 3 planillas', 'ninguna cuadra con la otra'],
  ['Cobros a mano', 'facturas vencidas sin aviso'],
];

const Cover: React.FC<{company: string; reveal?: number; date: string}> = ({company, reveal, date}) => {
  const rowH = 88;
  const top0 = 452;
  return (
    <>
      <Header right={date} />
      <div style={abs(PAD, 126, {...serif, fontSize: 48, ...heavy(0.6, INK_SOFT)})}>Propuesta para</div>
      <div style={abs(PAD - 2, 178, {...serif, fontSize: 96, letterSpacing: '-0.015em', whiteSpace: 'nowrap', ...heavy(1.6)})}>{company}</div>
      <div style={abs(PAD, 302, {width: 44, height: 3, background: ACCENT, borderRadius: 2})} />
      <div style={abs(PAD, 340, {...serif, fontSize: 21, letterSpacing: '0.12em', ...heavy(0.3, ACCENT)})}>01</div>
      <div style={abs(PAD, 366, {...serif, fontSize: 60, ...heavy(1)})}>Diagnóstico</div>

      {/* Línea que une los círculos numerados */}
      <div style={abs(PAD + 18, top0 + 36, {width: 1, height: rowH * (DIAG.length - 1) - 36, background: LINE})} />
      {DIAG.map(([title, sub], i) => {
        const t = rowState(i, reveal);
        return (
          <div key={title} style={abs(PAD, top0 + i * rowH, {right: PAD, display: 'flex', alignItems: 'flex-start', gap: 20, ...rowStyle(t)})}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                boxSizing: 'border-box',
                border: `1.5px solid ${ACCENT}`,
                background: apps.paper,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                ...serif,
                fontSize: 19,
                color: ACCENT,
                paddingTop: 1,
              }}
            >
              {i + 1}
            </div>
            <div style={{paddingTop: 1}}>
              <div style={{fontFamily: fonts.ui, fontWeight: 600, fontSize: 27, letterSpacing: '-0.015em', color: INK, lineHeight: 1.2}}>{title}</div>
              <div style={{fontFamily: fonts.ui, fontWeight: 400, fontSize: 20, color: MUTED, lineHeight: 1.3, marginTop: 2}}>{sub}</div>
            </div>
          </div>
        );
      })}
      <Footer n="01" />
    </>
  );
};

/* ───────────────────────────── plan ───────────────────────────── */

type Bar = {label: string; from: number; to: number; color: string};
const ACTIVITIES: Bar[] = [
  {label: 'Diseño del flujo', from: 0, to: 1, color: ACCENT},
  {label: 'Asistente de WhatsApp', from: 0.5, to: 2.4, color: ACCENT},
  {label: 'Inventario único', from: 1.05, to: 2.5, color: accent.text},
  {label: 'Cobros automáticos', from: 1.6, to: 3.15, color: ACCENT},
  {label: 'Marcha blanca', from: 3.05, to: 4, color: '#D3D6DD'},
];
const DELIVER = ['Flujo aprobado y cuentas conectadas', 'Asistente respondiendo en prueba', 'Inventario y cobros funcionando', 'Marcha blanca y entrega formal'];

const BAR_X = 300; // inicio del área de etapas (relativo al papel)
const BAR_W = PAPER_W - PAD - BAR_X; // 404 → 101 px por etapa
const STAGE = BAR_W / 4;

const Plan: React.FC<{company: string; reveal?: number; bars: number}> = ({company, reveal, bars}) => {
  const tableTop = 250;
  const rowH = 58;
  const listTop = tableTop + 22 + ACTIVITIES.length * rowH + 42; // 604
  const listRowH = 48;
  return (
    <>
      <Header right={`Propuesta para ${company}`} />
      <div style={abs(PAD, 128, {...serif, fontSize: 21, letterSpacing: '0.12em', ...heavy(0.3, ACCENT)})}>02</div>
      <div style={abs(PAD, 154, {...serif, fontSize: 60, ...heavy(1)})}>Plan por etapas</div>

      {/* Cabecera de la tabla */}
      <div style={abs(PAD, tableTop, {...caps, fontSize: 11, fontWeight: 600})}>Actividad</div>
      {[1, 2, 3, 4].map((n, i) => (
        <div key={n} style={abs(BAR_X + i * STAGE, tableTop - 1, {width: STAGE, textAlign: 'center', fontFamily: fonts.ui, fontWeight: 500, fontSize: 13, color: MUTED, letterSpacing: '0.01em'})}>
          Etapa {n}
        </div>
      ))}
      <div style={abs(PAD, tableTop + 22, {right: PAD, height: 1.5, background: INK, opacity: 0.55})} />

      {ACTIVITIES.map((a, i) => {
        const top = tableTop + 23 + i * rowH;
        const local = clamp01((bars - i * 0.12) / 0.52);
        const full = (a.to - a.from) * STAGE;
        return (
          <React.Fragment key={a.label}>
            <div style={abs(PAD, top, {right: PAD, height: rowH, display: 'flex', alignItems: 'center'})}>
              <div style={{fontFamily: fonts.ui, fontWeight: 400, fontSize: 22, letterSpacing: '-0.01em', color: INK}}>{a.label}</div>
            </div>
            <div style={abs(BAR_X + a.from * STAGE, top + rowH / 2 - 6, {width: Math.max(0, full * local), height: 12, borderRadius: 6, background: a.color, opacity: local > 0 ? 1 : 0})} />
            <div style={abs(PAD, top + rowH - 1, {right: PAD, height: 1, background: LINE})} />
          </React.Fragment>
        );
      })}

      {/* Entregables */}
      <div style={abs(PAD, listTop, {...caps, fontSize: 11, fontWeight: 600, color: ACCENT})}>Qué se entrega en cada corte</div>
      <div style={abs(PAD, listTop + 22, {right: PAD, height: 1.5, background: INK, opacity: 0.55})} />
      {DELIVER.map((d, i) => {
        const t = rowState(i, reveal);
        const top = listTop + 23 + i * listRowH;
        return (
          <React.Fragment key={d}>
            <div style={abs(PAD, top, {right: PAD, height: listRowH, display: 'flex', alignItems: 'center', ...rowStyle(t)})}>
              <div style={{...serif, fontSize: 21, color: ACCENT, width: 72, paddingTop: 2}}>{i + 1}</div>
              <div style={{fontFamily: fonts.ui, fontWeight: 400, fontSize: 20, letterSpacing: '-0.005em', color: INK}}>{d}</div>
            </div>
            <div style={abs(PAD, top + listRowH - 1, {right: PAD, height: 1, background: LINE})} />
          </React.Fragment>
        );
      })}
      <Footer n="02" />
    </>
  );
};

/* ───────────────────────────── papel ───────────────────────────── */

export const Paper: React.FC<PaperProps> = ({page, revealRows, company = 'Tu Empresa', barsProgress = 1, date = 'Miércoles 15 de octubre', style}) => {
  return (
    <div style={{position: 'relative', width: PAPER_W, height: PAPER_H, ...style}}>
      {/* Hojas apiladas detrás, desplazadas 6 px cada una */}
      {[2, 1].map((k) => (
        <div
          key={k}
          style={{
            position: 'absolute',
            left: 6 * k,
            top: 6 * k,
            width: PAPER_W,
            height: PAPER_H,
            borderRadius: 3,
            background: k === 2 ? '#ECEAE2' : '#F4F2EB',
            boxShadow: `0 ${18 + 6 * k}px ${36 + 10 * k}px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(0,0,0,0.16), inset -1px 0 0 rgba(0,0,0,0.05)`,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 3,
          background: `linear-gradient(176deg, #FDFCFA 0%, ${apps.paper} 45%, #F6F4EE 100%)`,
          boxShadow: `${shadow.paper}, 0 0 0 0.5px rgba(0,0,0,0.12)`,
          overflow: 'hidden',
          fontFamily: fonts.ui,
          color: INK,
        }}
      >
        {/* Grano fino (fibra del papel) y brillo diagonal muy tenue: el papel no es un color plano */}
        <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${staticFile('fx/grain.png')})`, backgroundSize: '420px 420px', opacity: 0.045, mixBlendMode: 'multiply', pointerEvents: 'none'}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.035) 100%)', pointerEvents: 'none'}} />
        {page === 'cover' ? <Cover company={company} reveal={revealRows} date={date} /> : <Plan company={company} reveal={revealRows} bars={barsProgress} />}
      </div>
    </div>
  );
};
