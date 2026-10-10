import React from 'react';
import {hash} from '../fx/ease';
import {ALL_CARDS, StickyNote} from '../ui/cards';
import {COL_W, WINDOW, columnLeft} from '../ui/AppWindow';
import {accent, fonts, ink} from '../tokens';
import {scenes} from '../timeline';

// Datos compartidos entre Day y Pitch: TODAS las tarjetas del día (16 eventos con hora en la regla + 22
// notificaciones extra que llueven al final), la posición de cada una en el montón (determinista) y su slot final
// dentro de la ventana de la app. Day dibuja el montón hasta HANDOFF; Pitch lo toma desde ese mismo frame y vuela
// exactamente las mismas tarjetas a las columnas: nada desaparece, lo que se amontonó es lo que se ordena.

export const HANDOFF = scenes.pitch.from - 4; // frame absoluto en que el montón pasa de Day a Pitch
export const HEAP_SCALE = 1.4; // escala de las tarjetas con hora en el montón
export const WIN_SCALE = WINDOW.cardScale; // escala dentro de la ventana

// Reloj del día en frames locales de Day: el cabezal va de 08:00 (T0) a 19:00 (T1) acelerando (EXP).
export const T0 = 10;
export const T1 = HANDOFF - (scenes.day.from - 10) - 10; // 19:00 diez frames antes del traspaso (220 con la toma actual)
export const EXP = 1.7;
export const hourAt = (f: number) => 8 + 11 * Math.pow(Math.max(0, Math.min(1, (f - T0) / (T1 - T0))), EXP);
export const frameOfHour = (h: number) => Math.round(T0 + (T1 - T0) * Math.pow((h - 8) / 11, 1 / EXP));
export const hourOf = (time: string) => {
  const [hh, mm] = time.split(':').map(Number);
  return hh + mm / 60;
};

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

// Notificaciones extra: desde media tarde llueven cada vez más seguidas (el frame lo fija una curva que acelera),
// sin hora en la regla. Casi todas son tarjetas distintas de las 16 de la regla; las cuatro repetidas son las que
// en la vida real se repiten ("RE: RE: RE:", "hola? alguien?", "cobrar a Pérez (otra vez)", inventario_FINAL_v3).
// Columna elegida para que las tres queden parejas (14 · 10 · 14).
const EXTRA_KINDS: Array<{kind: string; variant: number; col: Col; add: number}> = [
  {kind: 'instagram', variant: 1, col: 0, add: 1}, // tienda.lu: hacen envíos a regiones?
  {kind: 'purchaseOrder', variant: 1, col: 1, add: 1}, // OC 591 Distribuidora Norte
  {kind: 'invoice', variant: 2, col: 2, add: 1}, // 1051 VENCIDA
  {kind: 'whatsapp', variant: 4, col: 1, add: 1}, // Proveedor Sur: llegó la OC 588?
  {kind: 'gmail', variant: 4, col: 0, add: 2}, // Distribuidora Norte: cotización urgente
  {kind: 'bank', variant: 1, col: 2, add: 1}, // pago rechazado
  {kind: 'calendar', variant: 0, col: 1, add: 1}, // reunión de ventas / llamar proveedor
  {kind: 'instagram', variant: 2, col: 0, add: 1}, // cata.ulloa: sigue disponible??
  {kind: 'sticky', variant: 0, col: 2, add: 2}, // cobrar a Pérez (otra vez)
  {kind: 'excel', variant: 3, col: 0, add: 1}, // cotizaciones_pendientes
  {kind: 'purchaseOrder', variant: 2, col: 1, add: 1}, // OC 602 falta firma
  {kind: 'whatsapp', variant: 5, col: 2, add: 1}, // Ferretería Lagos: me mandas la factura de nuevo?
  {kind: 'sticky', variant: 1, col: 0, add: 1}, // responder Instagram
  {kind: 'calendar', variant: 1, col: 1, add: 1}, // entrega pedido 588
  {kind: 'gmail', variant: 3, col: 2, add: 1}, // Comercial Andes: RE: factura 1043
  {kind: 'whatsapp', variant: 2, col: 0, add: 2}, // hola? alguien? (otra vez)
  {kind: 'sticky', variant: 2, col: 1, add: 1}, // llamar proveedor 15:30
  {kind: 'invoice', variant: 3, col: 2, add: 1}, // 1052 VENCIDA
  {kind: 'instagram', variant: 3, col: 0, add: 1}, // notificación maria.jose
  {kind: 'excel', variant: 0, col: 1, add: 2}, // inventario_FINAL_v3 (otra vez)
  {kind: 'bank', variant: 3, col: 2, add: 1}, // abono sin identificar
  {kind: 'gmail', variant: 0, col: 0, add: 1}, // RE: RE: RE: cotización (otra vez)
];
export const N_EXTRA = EXTRA_KINDS.length; // 22
const EXTRA_FROM = T1 - 95; // ~13:00
const EXTRA_TO = T1 - 14; // la última ya está quieta medio segundo antes del traspaso (el total se lee)
const extraAt = (k: number) => Math.round(EXTRA_FROM + (EXTRA_TO - EXTRA_FROM) * Math.pow((k + 1) / N_EXTRA, 0.55));

export const TOTAL_TASKS = EVENTS.reduce((a, e) => a + e.add, 0) + EXTRA_KINDS.reduce((a, e) => a + e.add, 0); // 73

// Tarjeta del día lista para animar: tamaño base (sin escalar), nodo, evento, frame de entrada (local de Day),
// posición en el montón, desde dónde entra y su orden de vuelo hacia la ventana.
export type DayCard = {
  w: number;
  h: number;
  node: React.ReactElement;
  ev: DayEvent;
  at: number; // frame local de Day en que entra
  extra: boolean; // notificación extra (sin hora en la regla, sin etiqueta)
  heap: {cx: number; cy: number; rot: number; scale: number};
  from: {dx: number; dy: number; drot: number}; // desplazamiento inicial de la entrada
  fly: number; // orden de vuelo a la ventana (por columna y llegada)
};

const makeNode = (ev: DayEvent, key: string) => {
  const spec = ALL_CARDS.find((c) => c.name === ev.kind);
  if (!spec) throw new Error(`Tarjeta desconocida: ${ev.kind}`);
  const node = ev.kind === 'sticky' ? <StickyNote key={key} variant={ev.variant} rotate={0} /> : <spec.Component key={key} variant={ev.variant} />;
  return {w: spec.w, h: spec.h, node};
};

// Montón base: 16 celdas de una grilla 4 x 4 (cell = fila*4 + columna) asignadas a mano para que las tarjetas de un
// mismo grupo (WhatsApp, Excel, facturas/banco) nunca queden en celdas vecinas y el montón crezca sin orden
// aparente; encima, jitter y rotación por hash.
const PERM = [9, 11, 8, 2, 3, 10, 12, 4, 15, 0, 14, 7, 5, 1, 6, 13];
const baseHeap = (b: number, w: number, h: number) => {
  const cell = PERM[b % PERM.length];
  const col = cell % 4;
  const row = Math.floor(cell / 4);
  const W = w * HEAP_SCALE;
  const H = h * HEAP_SCALE;
  let cx = 226 + col * 164 + (hash(b, 21) - 0.5) * 120;
  let cy = 710 + row * 150 + (hash(b, 22) - 0.5) * 90;
  cx = Math.max(30 + W / 2, Math.min(950 - W / 2, cx));
  cy = Math.max(580 + H / 2, Math.min(1280 - H / 2, cy));
  const rot = (hash(b, 23) - 0.5) * 26;
  return {cx, cy, rot, scale: HEAP_SCALE};
};

// Montón extra: posición, giro y tamaño por hash, encimadas en cualquier parte del montón; nunca más del 30 % de
// la tarjeta fuera de cuadro y sin bajar hasta el contador.
const extraHeap = (k: number, w: number, h: number) => {
  const scale = 0.95 + hash(k, 62) * 0.35;
  const W = w * scale;
  const H = h * scale;
  let cx = 180 + hash(k, 63) * 720;
  let cy = 560 + hash(k, 64) * 640;
  cx = Math.max(W * 0.3, Math.min(1080 - W * 0.3, cx));
  cy = Math.max(580 + H / 2, Math.min(1250 - H / 2, cy));
  const rot = (hash(k, 65) - 0.5) * 56;
  return {cx, cy, rot, scale};
};

const build = (): DayCard[] => {
  const list: Array<Omit<DayCard, 'fly'>> = [];
  EVENTS.forEach((ev, b) => {
    const {w, h, node} = makeNode(ev, `b${b}`);
    list.push({w, h, node, ev, at: frameOfHour(hourOf(ev.time)), extra: false, heap: baseHeap(b, w, h), from: {dx: 1200, dy: 0, drot: 10}});
  });
  EXTRA_KINDS.forEach((x, k) => {
    const at = extraAt(k);
    const hh = Math.floor(hourAt(at));
    const mm = Math.floor((hourAt(at) - hh) * 60);
    const ev: DayEvent = {time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, kind: x.kind, variant: x.variant, col: x.col, add: x.add};
    const {w, h, node} = makeNode(ev, `x${k}`);
    const side = hash(k, 66); // desde dónde entra
    const from = side < 0.4 ? {dx: 1200, dy: 0, drot: 24} : side < 0.8 ? {dx: -1200, dy: 0, drot: -24} : {dx: 0, dy: -1100, drot: 18};
    list.push({w, h, node, ev, at, extra: true, heap: extraHeap(k, w, h), from});
  });
  // Orden de llegada (estable): define el apilado en el montón.
  const byArrival = list.map((c, i) => ({c, i})).sort((p, q) => p.c.at - q.c.at || p.i - q.i).map((p) => p.c);
  // Orden de vuelo: columna por columna (cotizaciones → stock → cobros) y, dentro de cada una, por llegada.
  const flyOrder = byArrival.map((c, i) => ({c, i})).sort((p, q) => p.c.ev.col - q.c.ev.col || p.i - q.i);
  const fly = new Array<number>(byArrival.length);
  flyOrder.forEach((p, rank) => {
    fly[p.i] = rank;
  });
  return byArrival.map((c, i) => ({...c, fly: fly[i]}));
};

export const CARDS: DayCard[] = build(); // 38 tarjetas en orden de llegada

// Slot final dentro de la ventana: columna del evento y orden de llegada dentro de esa columna. Con muchas tarjetas
// por columna el paso se comprime para que todas quepan sobre el check (quedan como una lista apilada).
const SLOT_AVAIL = WINDOW.checkCY - 40 - WINDOW.slotTop;
const colInfo = COLUMNS.map((_, c) => {
  const members = CARDS.filter((card) => card.ev.col === c);
  const n = members.length;
  const maxH = Math.max(...members.map((m) => m.h)) * WIN_SCALE;
  const step = n > 1 ? Math.min(WINDOW.slotStep, (SLOT_AVAIL - maxH) / (n - 1)) : WINDOW.slotStep;
  return {n, step};
});
export const slotPlace = (i: number) => {
  const {ev, w, h} = CARDS[i];
  const rank = CARDS.slice(0, i).filter((c) => c.ev.col === ev.col).length;
  const left = columnLeft(ev.col) + (COL_W - w * WIN_SCALE) / 2;
  const top = WINDOW.y + WINDOW.slotTop + rank * colInfo[ev.col].step;
  return {cx: left + (w * WIN_SCALE) / 2, cy: top + (h * WIN_SCALE) / 2, rank};
};

// Cuántas tarjetas quedan encima de la i-ésima cuando han entrado `entered` → brillo (las de atrás más oscuras).
export const dimFor = (i: number, entered: number) => 1 - 0.07 * Math.min(5, Math.max(0, entered - 1 - i));

// Cara de la tarjeta: la tarjeta real + etiqueta de hora encima (solo las de la regla) + contorno de resalte opcional.
export const CardFace: React.FC<{i: number; dim: number; hl?: [number, string] | null; tag?: number}> = ({i, dim, hl, tag = 1}) => {
  const {w, h, node, ev, extra} = CARDS[i];
  const k = hl ? hl[0] : 0;
  const c = hl ? hl[1] : 'transparent';
  const bright = k > 0 ? Math.max(dim, 1 + 0.12 * k) : dim;
  return (
    <div style={{position: 'relative', width: w, height: h}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 14, boxShadow: k > 0.01 ? `0 0 0 ${3 * k}px ${c}, 0 0 ${48 * k}px ${c}` : undefined, filter: bright < 0.995 || bright > 1.005 ? `brightness(${bright.toFixed(3)})` : undefined}}>
        {node}
      </div>
      {extra ? null : (
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
      )}
    </div>
  );
};
