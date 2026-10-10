import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Moving} from '../fx/MotionBlur';
import {inOutQuart, outExpo, prog, tween} from '../fx/ease';
import {TimeRuler} from '../ui/TimeRuler';
import {accent, fonts, ink} from '../tokens';
import {beat, beatEnd, scenes} from '../timeline';
import type {SfxCue} from '../sound';
import {CARDS, CardFace, HANDOFF, T1, dimFor, hourAt} from './dayData';

// Escena 2 · el día en time-lapse. Arriba una regla 08:00 → 19:00 con un cabezal que acelera y la hora grande;
// cada vez que cruza una hora de evento entra desde la derecha, con latigazo, una tarjeta real con su hora y se
// acomoda en un montón desordenado. Desde media tarde el día se desborda: llueven notificaciones extra cada vez más
// seguidas por los tres bordes, giradas y encimadas, y la cámara tiembla. La voz resalta lo que nombra (WhatsApp,
// planillas, pagos) y abajo un contador "tareas repetidas hoy" sube de 0 a 73. A las 19:00 regla y contador se
// apagan y el montón ENTERO pasa a la ventana del Pitch (mismas tarjetas, misma posición, mismo frame: HANDOFF),
// donde esas mismas tarjetas se ordenan. La regla y el contador van ENCIMA del montón (HUD): siempre se leen.
const sc = scenes.day;
const L = sc.from - 10;
const loc = (a: number) => a - L;
export const END = loc(sc.to) + 12; // la ventana de la escena (postroll incluido)
const ENTER = 11; // frames que tarda una tarjeta en llegar al montón (latigazo con easing, no teletransporte)
const tHand = loc(HANDOFF); // 222: desde aquí dibuja Pitch

// Resaltes por beat: [tipos, color, desde, hasta] en frames locales.
const HL: Array<{kinds: string[]; color: string; from: number; to: number}> = [
  {kinds: ['whatsapp'], color: accent.strong, from: loc(beat('day', 'cotizar')) - 2, to: loc(beatEnd('day', 'WhatsApp')) + 10},
  {kinds: ['excel'], color: accent.strong, from: loc(beat('day', 'planillas')) - 2, to: loc(beatEnd('day', 'planillas')) + 10},
  // (se apaga antes de HANDOFF: la escena Pitch no resalta)
  {kinds: ['invoice', 'bank'], color: accent.strong, from: loc(beat('day', 'pagos')) - 3, to: Math.min(loc(beatEnd('day', 'pagos')) + 10, tHand - 10)},
];
const highlightOf = (kind: string, f: number): [number, string] | null => {
  for (const h of HL) {
    if (!h.kinds.includes(kind)) continue;
    const k = prog(f, h.from, 6) * (1 - prog(f, h.to, 8, inOutQuart));
    if (k > 0.01) return [k, h.color];
  }
  return null;
};

// Contador: cada tarjeta suma `add`, de a uno por frame (rueda).
const countAt = (f: number) => CARDS.reduce((acc, c) => acc + Math.max(0, Math.min(c.ev.add, f - c.at + 1)), 0);

// Temblor de cámara: ruido suave (dos senos), no un salto distinto en cada frame.
const noise = (f: number, s: number) => 0.6 * Math.sin(f * 1.7 + s) + 0.4 * Math.sin(f * 2.9 + s * 2);

const BASE = CARDS.filter((c) => !c.extra);
const whooshes: SfxCue[] = [];
let lastWhoosh = -99;
BASE.forEach((c, i) => {
  if (c.at - lastWhoosh >= 3) {
    // Los últimos whooshes (bajo "perseguir pagos") se topan a 0,40 para que la voz siga mandando.
    whooshes.push({name: 'whoosh-soft', at: L + c.at, gain: Math.min(0.35 + 0.15 * (i / (BASE.length - 1)), i >= 10 ? 0.4 : 1)});
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
    .map((c) => ({name: 'pop' as const, at: L + c.at, gain: c.at < T1 - 8 ? 0.3 : 0.45})),
  {name: 'rise', at: L + T1 - 36, gain: 0.4}, // remata justo en 19:00
  {name: 'click', at: L + T1, gain: 0.8}, // 19:00
];

export const Day: React.FC = () => {
  const frame = useCurrentFrame();
  const hour = hourAt(frame);
  const entered = CARDS.filter((c) => frame >= c.at).length;
  const count = countAt(frame);
  const off = prog(frame, T1 + 2, 8, inOutQuart); // regla y contador se apagan mientras nace la ventana
  const endGlow = prog(frame, T1 - 6, 6) * (1 - off);
  const pulse = 1 + 0.06 * prog(frame, T1, 3) * (1 - prog(frame, T1 + 3, 8));
  const showHeap = frame < tHand;
  // Sacudida de cámara creciente en la última media hora (hasta ±7 px); vuelve a cero justo antes del traspaso
  // para que Pitch tome las tarjetas exactamente donde están. El HUD se mueve con la cámara, un poco menos.
  const shakeAmp = 7 * prog(frame, T1 - 60, 60) * (1 - prog(frame, tHand - 8, 7));
  const shakeX = noise(frame, 1.3) * shakeAmp;
  const shakeY = noise(frame, 4.1) * shakeAmp;
  const last = CARDS.reduce((best, c, i) => (frame >= c.at && (best < 0 || c.at >= CARDS[best].at) ? i : best), -1);
  const lunes = 1 - prog(frame, 170, 10); // el pie de la regla se va cuando el montón empieza a taparlo
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
                  textShadow: `0 2px 28px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.7)${endGlow > 0 ? `, 0 0 ${40 * endGlow}px rgba(77,124,255,${0.6 * endGlow})` : ''}`,
                }}
              >
                {String(count).padStart(2, '0')}
              </div>
              <div style={{fontFamily: fonts.sans, fontSize: 34, color: ink.text2, marginTop: 8, letterSpacing: '-0.01em', textShadow: '0 2px 18px rgba(0,0,0,0.9)'}}>tareas repetidas hoy</div>
            </div>
            {/* "+n" que flota al lado del número con la última tarjeta que entró */}
            {last >= 0 && frame - CARDS[last].at <= 18
              ? (() => {
                  const p = (frame - CARDS[last].at) / 18;
                  return (
                    <div
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
                        textShadow: '0 2px 18px rgba(0,0,0,0.9)',
                      }}
                    >
                      +{CARDS[last].ev.add}
                    </div>
                  );
                })()
              : null}
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
