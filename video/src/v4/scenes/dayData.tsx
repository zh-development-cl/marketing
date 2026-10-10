import React from 'react';
import {hash} from '../fx/ease';
import {ALL_CARDS, StickyNote} from '../ui/cards';
import {COL_W, WINDOW, columnLeft, slotTop} from '../ui/AppWindow';
import {accent, fonts, ink, status} from '../tokens';
import {scenes} from '../timeline';

// Datos compartidos entre Day y Pitch: los 16 eventos del día (hora, tarjeta, columna destino, cuántas tareas
// suma), la posición de cada tarjeta en el montón (determinista) y su slot final dentro de la ventana de la app.
// Day dibuja el montón hasta HANDOFF; Pitch lo toma desde ese mismo frame y lo vuela a las columnas.

export const HANDOFF = scenes.pitch.from - 4; // frame absoluto en que el montón pasa de Day a Pitch (290)
export const HEAP_SCALE = 1.4; // escala de las tarjetas en el montón
export const WIN_SCALE = WINDOW.cardScale; // escala dentro de la ventana

export type Col = 0 | 1 | 2;
export const COLUMNS = [
  {label: 'cotizaciones', color: accent.text},
  {label: 'stock', color: accent.text},
  {label: 'cobros', color: accent.text},
] as const;

export type DayEvent = {time: string; kind: string; variant: number; col: Col; add: number};

export const EVENTS: DayEvent[] = [
  {time: '08:12', kind: 'whatsapp', variant: 1, col: 0, add: 2}, // "me pueden cotizar 20?"
  {time: '08:40', kind: 'excel', variant: 0, col: 1, add: 3}, // inventario_FINAL_v3
  {time: '09:15', kind: 'gmail', variant: 0, col: 0, add: 3}, // RE: RE: RE: cotización
  {time: '10:02', kind: 'invoice', variant: 0, col: 2, add: 2}, // 1043 VENCIDA
  {time: '10:30', kind: 'whatsapp', variant: 2, col: 0, add: 4}, // "hola? alguien?"
  {time: '11:10', kind: 'sticky', variant: 0, col: 2, add: 3}, // cobrar a Pérez (otra vez)
  {time: '12:05', kind: 'purchaseOrder', variant: 0, col: 1, add: 3}, // OC 588
  {time: '13:25', kind: 'excel', variant: 1, col: 2, add: 2}, // cobros_pendientes (va a cobros)
  {time: '13:40', kind: 'instagram', variant: 0, col: 0, add: 4}, // precio???
  {time: '14:50', kind: 'bank', variant: 0, col: 2, add: 3}, // transferencia sin identificar
  {time: '15:35', kind: 'whatsapp', variant: 0, col: 0, add: 3}, // Camila: stock del modelo azul?
  {time: '16:30', kind: 'invoice', variant: 1, col: 2, add: 4}, // 1037 VENCIDA
  {time: '17:15', kind: 'gmail', variant: 2, col: 2, add: 3}, // Factura 1043 vencida
  {time: '17:45', kind: 'excel', variant: 2, col: 1, add: 3}, // ventas_octubre (2)
  {time: '18:05', kind: 'whatsapp', variant: 3, col: 0, add: 2}, // notificación Camila "ahora"
  {time: '18:20', kind: 'bank', variant: 2, col: 2, add: 3}, // cartola sin categorizar
];
export const TOTAL_TASKS = EVENTS.reduce((a, e) => a + e.add, 0); // 47

export const hourOf = (time: string) => {
  const [hh, mm] = time.split(':').map(Number);
  return hh + mm / 60;
};

// Tarjeta instanciada por evento, con su tamaño base (sin escalar).
export type DayCard = {w: number; h: number; node: React.ReactElement; ev: DayEvent};
export const CARDS: DayCard[] = EVENTS.map((ev, i) => {
  const spec = ALL_CARDS.find((c) => c.name === ev.kind);
  if (!spec) throw new Error(`Tarjeta desconocida: ${ev.kind}`);
  const node = ev.kind === 'sticky' ? <StickyNote key={i} variant={ev.variant} rotate={0} /> : <spec.Component key={i} variant={ev.variant} />;
  return {w: spec.w, h: spec.h, node, ev};
});

// Montón: 16 celdas de una grilla 4 x 4 (cell = fila*4 + columna) asignadas a mano para que las tarjetas de un
// mismo grupo (WhatsApp, Excel, facturas/banco) nunca queden en celdas vecinas y el montón crezca sin orden
// aparente; encima, jitter y rotación por hash.
const PERM = [9, 11, 8, 2, 3, 10, 12, 4, 15, 0, 14, 7, 5, 1, 6, 13];
export const heapPlace = (i: number) => {
  const cell = PERM[i % PERM.length];
  const col = cell % 4;
  const row = Math.floor(cell / 4);
  const {w, h} = CARDS[i];
  const W = w * HEAP_SCALE;
  const H = h * HEAP_SCALE;
  let cx = 226 + col * 164 + (hash(i, 21) - 0.5) * 120;
  let cy = 710 + row * 150 + (hash(i, 22) - 0.5) * 90;
  cx = Math.max(30 + W / 2, Math.min(950 - W / 2, cx));
  cy = Math.max(580 + H / 2, Math.min(1330 - H / 2, cy));
  const rot = (hash(i, 23) - 0.5) * 26;
  return {cx, cy, rot};
};

// Slot final dentro de la ventana: columna del evento y orden de llegada dentro de esa columna.
export const slotPlace = (i: number) => {
  const {ev, w, h} = CARDS[i];
  const rank = EVENTS.slice(0, i).filter((e) => e.col === ev.col).length;
  const left = columnLeft(ev.col) + (COL_W - w * WIN_SCALE) / 2;
  const top = slotTop(rank);
  return {cx: left + (w * WIN_SCALE) / 2, cy: top + (h * WIN_SCALE) / 2, rank};
};

// Cuántas tarjetas quedan encima de la i-ésima cuando han entrado `entered` → brillo (las de atrás más oscuras).
export const dimFor = (i: number, entered: number) => 1 - 0.07 * Math.min(5, Math.max(0, entered - 1 - i));

// Cara de la tarjeta: la tarjeta real + etiqueta de hora encima + contorno de resalte opcional.
export const CardFace: React.FC<{i: number; dim: number; hl?: [number, string] | null; tag?: number}> = ({i, dim, hl, tag = 1}) => {
  const {w, h, node, ev} = CARDS[i];
  const k = hl ? hl[0] : 0;
  const c = hl ? hl[1] : 'transparent';
  const bright = k > 0 ? Math.max(dim, 1 + 0.12 * k) : dim;
  return (
    <div style={{position: 'relative', width: w, height: h}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 14, boxShadow: k > 0.01 ? `0 0 0 ${3 * k}px ${c}, 0 0 ${48 * k}px ${c}` : undefined, filter: bright < 0.995 || bright > 1.005 ? `brightness(${bright.toFixed(3)})` : undefined}}>
        {node}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 10,
          top: -17,
          padding: '2px 11px 3px',
          borderRadius: 999,
          opacity: Math.max(0, Math.min(1, tag)),
          background: 'rgba(9,12,18,0.94)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          fontFamily: fonts.mono,
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: '0.04em',
          color: k > 0.3 ? ink.text : accent.text,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
        }}
      >
        {ev.time}
      </div>
    </div>
  );
};
