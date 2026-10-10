import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Moving} from '../fx/MotionBlur';
import {inOutQuart, outBack, outExpo, prog, tween} from '../fx/ease';
import {RollText, TimeRuler, formatHour, rollOf} from '../ui/TimeRuler';
import {accent, fonts, ink} from '../tokens';
import {beat, beatEnd, scenes} from '../timeline';
import type {SfxCue} from '../sound';
import {CARDS, CardFace, HANDOFF, T1, dimFor, frameOfHour, hourAt} from './dayData';

// Escena 2 · el día en time-lapse. Arriba una regla 08:00 → 19:00 con un cabezal que acelera y la hora grande;
// cada vez que cruza una hora de evento entra desde la derecha, con latigazo, una tarjeta real con su hora y se
// acomoda en un montón desordenado. Desde media tarde el día se desborda: llueven notificaciones extra cada vez más
// seguidas por los tres bordes, giradas y encimadas, y la cámara tiembla. La voz resalta lo que nombra (WhatsApp,
// planillas, pagos) y abajo un contador "tareas repetidas hoy" sube de 0 a 73. A las 19:00 regla y contador se
// apagan y el montón ENTERO pasa a la ventana del Pitch (mismas tarjetas, misma posición, mismo frame: HANDOFF),
// donde esas mismas tarjetas se ordenan. La regla y el contador van ENCIMA del montón (HUD): siempre se leen.
// Nada cambia en seco: reloj y contador funden cifra a cifra, las horas de la regla y el brillo del montón van en
// rampa, los resaltes entran con inOutQuart y el "+n" nace con fundido.
const sc = scenes.day;
const L = sc.from - 10;
const loc = (a: number) => a - L;
export const END = loc(sc.to) + 12; // la ventana de la escena (postroll incluido)
const ENTER = 11; // frames que tarda una tarjeta en llegar al montón (latigazo con easing, no teletransporte)
const tHand = loc(HANDOFF); // 222: desde aquí dibuja Pitch
const ROLL = 3; // frames del fundido cruzado de cifras (reloj grande y contador)

// Resaltes por beat: [tipos, color, desde, hasta] en frames locales. El arranque dura 10 frames con inOutQuart
// (primer frame ≈ 0 %, mitad en el 5.º), por eso `desde` va 5–6 frames antes de la palabra: el pico sigue cayendo
// sobre ella.
const HL: Array<{kinds: string[]; color: string; from: number; to: number}> = [
  {kinds: ['whatsapp'], color: accent.strong, from: loc(beat('day', 'cotizar')) - 5, to: loc(beatEnd('day', 'WhatsApp')) + 10},
  {kinds: ['excel'], color: accent.strong, from: loc(beat('day', 'planillas')) - 5, to: loc(beatEnd('day', 'planillas')) + 10},
  // (se apaga antes de HANDOFF: la escena Pitch no resalta)
  {kinds: ['invoice', 'bank'], color: accent.strong, from: loc(beat('day', 'pagos')) - 6, to: Math.min(loc(beatEnd('day', 'pagos')) + 10, tHand - 10)},
];
const highlightOf = (kind: string, f: number): [number, string] | null => {
  for (const h of HL) {
    if (!h.kinds.includes(kind)) continue;
    const k = prog(f, h.from, 10, inOutQuart) * (1 - prog(f, h.to, 8, inOutQuart));
    if (k > 0.01) return [k, h.color];
  }
  return null;
};

// Contador: cada tarjeta suma `add`, de a uno por frame (rueda).
const countAt = (f: number) => CARDS.reduce((acc, c) => acc + Math.max(0, Math.min(c.ev.add, f - c.at + 1)), 0);
const countText = (f: number) => String(countAt(f)).padStart(2, '0');
const clockText = (f: number) => formatHour(hourAt(f));

// Grupos del "+n": las tarjetas que entran en el mismo frame suman su `add` en una sola etiqueta; `next` es el frame
// del grupo siguiente (la etiqueta se funde cuando nace la próxima, no desaparece en seco).
const ENTRIES = (() => {
  const sum = new Map<number, number>();
  CARDS.forEach((c) => sum.set(c.at, (sum.get(c.at) ?? 0) + c.ev.add));
  const ats = [...sum.keys()].sort((a, b) => a - b);
  return ats.map((at, k) => ({at, add: sum.get(at) ?? 0, next: k + 1 < ats.length ? ats[k + 1] : null}));
})();
const TAG_LIFE = 18; // frames que flota cada "+n"

// Temblor de cámara: ruido suave de baja frecuencia (periodos ≈ 14 y 8,6 frames): vaivén, no vibración por frame.
const noise = (f: number, s: number) => 0.6 * Math.sin(f * 0.45 + s) + 0.4 * Math.sin(f * 0.73 + s * 2);

const BASE = CARDS.filter((c) => !c.extra);
const whooshes: SfxCue[] = [];
let lastWhoosh = -99;
BASE.forEach((c, i) => {
  if (c.at - lastWhoosh >= 3) {
    // Los últimos whooshes (bajo "perseguir pagos") se topan a 0,40 para que la voz siga mandando.
    whooshes.push({name: 'whoosh-soft', at: L + c.at, gain: Math.min(0.35 + 0.15 * (i / (BASE.length - 1)), i >= 10 ? 0.28 : 1)});
    lastWhoosh = c.at;
  }
});

export const sfxCues: SfxCue[] = [
  {name: 'whoosh-soft', at: L + 0, gain: 0.35}, // el día entra desde abajo (el gancho ya suena su whoosh-hard)
  ...whooshes,
  // Ticks solo mientras el día va tranquilo; en el desborde ya suenan los pops.
  ...BASE.filter((c) => c.at < T1 - 40).map((c) => ({name: 'tick' as const, at: L + c.at + 1, gain: 0.3})),
  // Pops (una de cada dos extra): discretos bajo la voz, plenos en el remate final.
  ...CARDS.filter((c) => c.extra)
    .filter((_, k) => k % 2 === 0)
    .map((c) => ({name: 'pop' as const, at: L + c.at, gain: c.at < T1 - 8 ? 0.2 : 0.45})),
  {name: 'rise', at: L + T1 - 31, gain: 0.3}, // su pico (1,02 s) remata justo en 19:00
  {name: 'click', at: L + T1, gain: 0.8}, // 19:00
];

export const Day: React.FC = () => {
  const frame = useCurrentFrame();
  const hour = hourAt(frame);
  // Cuántas tarjetas "ya cayeron", fraccionario: cada una cuenta de a poco mientras aterriza (frames 3–11 del
  // latigazo), así las de abajo se oscurecen en rampa y no en un escalón. En HANDOFF vale 38 exacto (la última
  // termina en 220 < 230), igual que dimFor(i, CARDS.length) en Pitch.
  const entered = CARDS.reduce((a, c) => a + prog(frame, c.at + 3, ENTER - 3), 0);
  const count = rollOf(frame, countText, ROLL);
  const clock = rollOf(frame, clockText, ROLL);
  const off = prog(frame, T1 + 5, 8, inOutQuart); // regla y contador se apagan mientras nace la ventana (el 73 se lee ≥ 0,5 s)
  const endGlow = prog(frame, T1 - 6, 6) * (1 - off);
  const pulse = 1 + 0.06 * prog(frame, T1, 3) * (1 - prog(frame, T1 + 3, 8));
  const showHeap = frame < tHand;
  // Sacudida de cámara creciente en la última media hora (hasta ±7 px); vuelve a cero justo antes del traspaso
  // para que Pitch tome las tarjetas exactamente donde están. El HUD se mueve con la cámara, un poco menos.
  const shakeAmp = 7 * prog(frame, T1 - 60, 60) * (1 - prog(frame, tHand - 8, 7));
  const shakeX = noise(frame, 1.3) * shakeAmp;
  const shakeY = noise(frame, 4.1) * shakeAmp;
  const lunes = 1 - prog(frame, 78, 8); // el pie de la regla se va justo antes de que aterrice la primera tarjeta que lo tapa
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${shakeX.toFixed(2)}px, ${shakeY.toFixed(2)}px)`}}>
        {/* Montón: cada tarjeta entra con latigazo en su frame (las de la regla por la derecha; las extra por
            cualquier borde) y se queda donde cayó hasta el traspaso. El resalte ilumina la propia tarjeta
            (sin copia encima): sube un poco, crece y gana contorno sin cambiar de capa. */}
        {showHeap
          ? CARDS.map((c, i) => {
              const t = c.at;
              if (frame < t) return null;
              const {cx, cy, rot, scale} = c.heap;
              const hl = highlightOf(c.ev.kind, frame);
              const k = hl ? hl[0] : 0;
              const dim = dimFor(i, entered) * (c.extra ? 0.94 : 1);
              return (
                <Moving
                  key={i}
                  x={(f) => cx - c.w / 2 + tween(f, t, t + ENTER, c.from.dx, 0, outExpo)}
                  y={(f) => cy - c.h / 2 + tween(f, t, t + ENTER, c.from.dy, 0, outExpo) - 20 * k}
                  rotate={(f) => rot + tween(f, t, t + ENTER, c.from.drot, 0, outExpo)}
                  scale={() => scale * (1 + 0.06 * k)}
                  blur={0.14}
                  style={{zIndex: 10 + i}}
                >
                  <CardFace i={i} dim={dim} hl={hl} />
                </Moving>
              );
            })
          : null}
      </div>

      {/* HUD (regla + contador), encima del montón: entra desde abajo con desenfoque mientras el gancho sale */}
      <div style={{position: 'absolute', inset: 0, transform: `translate(${(shakeX * 0.6).toFixed(2)}px, ${(shakeY * 0.6).toFixed(2)}px)`}}>
        <Moving y={(f) => tween(f, 4, 16, 1700, 0, outExpo)} opacity={(f) => prog(f, 4, 6) * (1 - off)} extraBlur={() => off * 14} blur={0.14}>
          <div style={{position: 'relative', width: 1080, height: 1920}}>
            {/* Cada hora de la regla se enciende en 6 frames centrados en el cruce del cabezal (en frames: dura lo
                mismo aunque el cabezal acelere; las 19 terminan antes de que la regla se apague en T1+5). Las 08 ya
                están cruzadas cuando entra el HUD. */}
            <TimeRuler hour={hour} glow={endGlow} clock={clock} lit={(hh) => (hh <= 8 ? 1 : prog(frame, frameOfHour(hh) - 3, 6))} />
            {/* Contador abajo (fuera de la zona insegura); las cifras cambian con fundido cruzado */}
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
                  textShadow: `0 2px 28px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.7)${endGlow > 0 ? `, 0 0 ${40 * endGlow}px rgba(77,124,255,${0.6 * endGlow})` : ''}`,
                }}
              >
                <RollText prev={count.prev} next={count.next} roll={count.roll} />
              </div>
              <div style={{fontFamily: fonts.sans, fontSize: 34, color: ink.text2, marginTop: 8, letterSpacing: '-0.01em', textShadow: '0 2px 18px rgba(0,0,0,0.9)'}}>tareas repetidas hoy</div>
            </div>
            {/* "+n" que flota al lado del número: una etiqueta por grupo de tarjetas que entran en el mismo frame,
                cada una nace con fundido (4 frames) y resorte, sube sus 18 frames y, si nace la siguiente antes,
                se funde en 4 frames (la nueva no pisa a la vieja: sin cambio de texto ni salto de posición). */}
            {ENTRIES.filter((e) => frame >= e.at && frame - e.at <= TAG_LIFE).map((e) => {
              const p = (frame - e.at) / TAG_LIFE;
              const born = prog(frame, e.at, 4); // fundido de entrada (outQuart)
              const pop = tween(frame, e.at, e.at + 6, 0.8, 1, outBack); // resorte de escala al nacer
              const cede = e.next === null ? 1 : 1 - prog(frame, e.next, 4, inOutQuart); // cede el lugar a la siguiente
              const opacity = born * (1 - p * p) * cede;
              if (opacity <= 0.005) return null;
              return (
                <div
                  key={e.at}
                  style={{
                    position: 'absolute',
                    left: 640,
                    top: 1312 - p * 46,
                    transform: `scale(${pop.toFixed(3)})`,
                    transformOrigin: 'left center',
                    fontFamily: fonts.mono,
                    fontWeight: 600,
                    fontSize: 44,
                    color: accent.text,
                    opacity,
                    letterSpacing: '-0.02em',
                    textShadow: '0 2px 18px rgba(0,0,0,0.9)',
                  }}
                >
                  +{e.add}
                </div>
              );
            })}
            {/* Pie de la regla: cierre de jornada (se funde antes de que el montón lo tape) */}
            {lunes > 0 ? (
              <div style={{position: 'absolute', left: 80, top: 526, fontFamily: fonts.mono, fontSize: 26, letterSpacing: '0.06em', color: ink.text3, whiteSpace: 'nowrap', opacity: lunes}}>
                lunes · un día cualquiera
              </div>
            ) : null}
          </div>
        </Moving>
      </div>
    </AbsoluteFill>
  );
};
