import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Moving} from '../fx/MotionBlur';
import {inOutQuart, outExpo, prog, tween} from '../fx/ease';
import {TimeRuler} from '../ui/TimeRuler';
import {accent, fonts, ink, status} from '../tokens';
import {beat, beatEnd, scenes} from '../timeline';
import type {SfxCue} from '../sound';
import {CARDS, CardFace, EVENTS, HANDOFF, HEAP_SCALE, dimFor, heapPlace, hourOf} from './dayData';

// Escena 2 · el día en time-lapse. Arriba una regla 08:00 → 19:00 con un cabezal que acelera y la hora grande;
// cada vez que cruza una hora de evento entra desde la derecha, con latigazo, una tarjeta real con su hora y se
// acomoda en un montón desordenado. La voz resalta lo que nombra (WhatsApp → azul, planillas → verde, pagos →
// naranja) y abajo un contador "tareas repetidas hoy" sube de 0 a 47. A las 19:00 regla y contador se apagan y el
// montón pasa a la ventana del Pitch (misma posición, mismo frame: HANDOFF).
const sc = scenes.day;
const L = sc.from - 10;
const loc = (a: number) => a - L;
export const END = loc(sc.to) + 12; // 238: la ventana de la escena (postroll incluido)
const T0 = 10; // el cabezal arranca en 08:00 cuando el bloque termina de entrar
const T1 = 220; // 19:00 (abs 288)
const EXP = 1.7; // aceleración del cabezal (lento al inicio, rápido al final)
const ENTER = 8; // frames que tarda una tarjeta en llegar al montón

const hourAt = (f: number) => 8 + 11 * Math.pow(Math.max(0, Math.min(1, (f - T0) / (T1 - T0))), EXP);
const frameOfHour = (h: number) => Math.round(T0 + (T1 - T0) * Math.pow((h - 8) / 11, 1 / EXP));
export const tEvents = EVENTS.map((e) => frameOfHour(hourOf(e.time)));

// Resaltes por beat: [tipos, color, desde, hasta] en frames locales.
const HL: Array<{kinds: string[]; color: string; from: number; to: number}> = [
  {kinds: ['whatsapp'], color: accent.strong, from: loc(beat('day', 'cotizar')) - 2, to: loc(beatEnd('day', 'WhatsApp')) + 10},
  {kinds: ['excel'], color: accent.strong, from: loc(beat('day', 'planillas')) - 2, to: loc(beatEnd('day', 'planillas')) + 10},
  // (se apaga antes de HANDOFF: la escena Pitch no resalta)
  {kinds: ['invoice', 'bank'], color: accent.strong, from: loc(beat('day', 'pagos')) - 3, to: Math.min(loc(beatEnd('day', 'pagos')) + 10, loc(HANDOFF) - 10)},
];
const highlightOf = (kind: string, f: number): [number, string] | null => {
  for (const h of HL) {
    if (!h.kinds.includes(kind)) continue;
    const k = prog(f, h.from, 6) * (1 - prog(f, h.to, 8, inOutQuart));
    if (k > 0.01) return [k, h.color];
  }
  return null;
};

// Contador: cada evento suma `add`, de a uno por frame (rueda).
const countAt = (f: number) => EVENTS.reduce((acc, e, i) => acc + Math.max(0, Math.min(e.add, f - tEvents[i] + 1)), 0);

const whooshes: SfxCue[] = [];
let lastWhoosh = -99;
tEvents.forEach((t, i) => {
  if (t - lastWhoosh >= 3) {
    whooshes.push({name: 'whoosh-soft', at: L + t, gain: 0.35 + 0.15 * (i / (tEvents.length - 1))});
    lastWhoosh = t;
  }
});

export const sfxCues: SfxCue[] = [
  {name: 'whoosh-soft', at: L + 0, gain: 0.35}, // el día entra desde abajo (el gancho ya suena su whoosh-hard)
  ...whooshes,
  ...tEvents.map((t) => ({name: 'tick' as const, at: L + t + 1, gain: 0.3})),
  {name: 'rise', at: L + T1 - 36, gain: 0.5}, // remata justo en 19:00
  {name: 'click', at: L + T1, gain: 0.8}, // 19:00
];

export const Day: React.FC = () => {
  const frame = useCurrentFrame();
  const hour = hourAt(frame);
  const entered = tEvents.filter((t) => frame >= t).length;
  const count = countAt(frame);
  const off = prog(frame, T1 + 2, 10, inOutQuart); // regla y contador se apagan (abs 290–300)
  const endGlow = prog(frame, T1 - 6, 6) * (1 - off);
  const pulse = 1 + 0.06 * prog(frame, T1, 3) * (1 - prog(frame, T1 + 3, 8));
  const showHeap = L + frame < HANDOFF;
  return (
    <AbsoluteFill>
      {/* Bloque regla + contador: entra desde abajo con desenfoque mientras el gancho sale hacia arriba */}
      <Moving y={(f) => tween(f, 4, 16, 1700, 0, outExpo)} opacity={(f) => prog(f, 4, 6) * (1 - off)} extraBlur={() => off * 14} blur={0.3}>
        <div style={{position: 'relative', width: 1080, height: 1920}}>
          <TimeRuler hour={hour} glow={endGlow} />
          {/* Contador abajo (fuera de la zona insegura) */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 1296, textAlign: 'center'}}>
            <div
              style={{
                fontFamily: fonts.mono,
                fontWeight: 600,
                fontSize: 112,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums',
                color: ink.text,
                transform: `scale(${pulse})`,
                textShadow: endGlow > 0 ? `0 0 ${40 * endGlow}px rgba(77,124,255,${0.6 * endGlow})` : undefined,
              }}
            >
              {String(count).padStart(2, '0')}
            </div>
            <div style={{fontFamily: fonts.sans, fontSize: 34, color: ink.text2, marginTop: 8, letterSpacing: '-0.01em'}}>tareas repetidas hoy</div>
          </div>
          {/* "+n" que flota al lado del número en cada evento */}
          {EVENTS.map((e, i) => {
            const d = frame - tEvents[i];
            if (d < 0 || d > 18) return null;
            if (i + 1 < tEvents.length && frame >= tEvents[i + 1]) return null; // solo el último "+n"
            const p = d / 18;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 640,
                  top: 1312 - p * 46,
                  fontFamily: fonts.mono,
                  fontWeight: 600,
                  fontSize: 44,
                  color: accent.text,
                  opacity: 1 - p * p,
                  letterSpacing: '-0.02em',
                }}
              >
                +{e.add}
              </div>
            );
          })}
          {/* Pie de la regla: cierre de jornada */}
          <div style={{position: 'absolute', left: 80, top: 526, fontFamily: fonts.mono, fontSize: 26, letterSpacing: '0.06em', color: ink.text3, whiteSpace: 'nowrap'}}>
            lunes · un día cualquiera
          </div>
        </div>
      </Moving>

      {/* Montón de tarjetas: cada una entra desde la derecha con latigazo en su hora */}
      {showHeap
        ? CARDS.map((c, i) => {
            const t = tEvents[i];
            if (frame < t) return null;
            const {cx, cy, rot} = heapPlace(i);
            const hl = highlightOf(c.ev.kind, frame);
            const k = hl ? hl[0] : 0;
            const dim = dimFor(i, entered);
            return (
              <React.Fragment key={i}>
                <Moving
                  x={(f) => cx - c.w / 2 + tween(f, t, t + ENTER, 1400, 0, outExpo)}
                  y={() => cy - c.h / 2}
                  rotate={(f) => rot + tween(f, t, t + ENTER, 10, 0, outExpo)}
                  scale={() => HEAP_SCALE}
                  blur={0.26}
                  style={{zIndex: 10 + i}}
                >
                  <CardFace i={i} dim={dim} />
                </Moving>
                {/* Resalte: una copia iluminada se funde encima y sube un poco; la original no cambia de capa */}
                {hl ? (
                  <Moving
                    x={() => cx - c.w / 2}
                    y={() => cy - c.h / 2 - 20 * k}
                    rotate={() => rot}
                    scale={() => HEAP_SCALE * (1 + 0.06 * k)}
                    blur={0.26}
                    style={{zIndex: 300 + i, opacity: k}}
                  >
                    <CardFace i={i} dim={1} hl={hl} />
                  </Moving>
                ) : null}
              </React.Fragment>
            );
          })
        : null}
    </AbsoluteFill>
  );
};
