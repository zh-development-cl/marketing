import React from 'react';
import {AbsoluteFill, Easing, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Pop, Typewriter} from '../fx/text';
import {Moving} from '../fx/MotionBlur';
import {inOutQuart, inQuart, prog, tween} from '../fx/ease';
import {AppWindow, ColumnChecks, WINDOW} from '../ui/AppWindow';
import {fonts, ink, status} from '../tokens';
import {beat, scenes} from '../timeline';
import type {SfxCue} from '../sound';
import {CARDS, COLUMNS, CardFace, HANDOFF, WIN_SCALE, dimFor, slotPlace} from './dayData';

// Escena 3 · pitch. A las 19:00 se abre en el centro la ventana "Tu Empresa · sistema" (Pop) detrás del montón y
// las MISMAS tarjetas que se amontonaron durante el día vuelan hacia ella, columna por columna (primero todas las
// de cotizaciones, después stock, después cobros): cada una se endereza, se encoge con desenfoque, se apila en su
// lista y recibe un check verde al aterrizar (ordenado Y resuelto); el contador de cada columna sube con cada
// llegada. En "resuelve" cada columna remata con un check grande. Debajo, en mono: "a medida · integrado · tuyo".
// Sale a la izquierda con latigazo porque el paso 01 entra desde la derecha.
const sc = scenes.pitch;
const L = sc.from - 12;
const loc = (a: number) => a - L;
export const END = loc(sc.to) + 10;
const tWin = loc(HANDOFF); // 8: la ventana aparece y el montón pasa a esta escena (mismas posiciones)
const tFly = tWin + 3; // la ventana ya está naciendo cuando despega la primera tarjeta
const STAGGER = 0.85; // frames entre despegues (38 tarjetas → ~32 frames de flujo continuo)
const FLY = 14;
const tLine = loc(beat('pitch', 'Hacemos')) + 2;
const tChecks = loc(beat('pitch', 'resuelve')) - 2;
const tOut = loc(sc.to) - 6;

const flyAt = (i: number) => tFly + CARDS[i].fly * STAGGER;
const flyP = (i: number, f: number) => prog(f, flyAt(i), FLY, Easing.bezier(0.4, 0, 0.1, 1));
const landAt = (i: number) => flyAt(i) + FLY * 0.85; // frame en que "aterriza" (recibe su check)
// Frame en que aterriza la última tarjeta de cada columna (tick por columna completa).
const colDone = COLUMNS.map((_, c) => Math.round(Math.max(...CARDS.map((card, i) => (card.ev.col === c ? landAt(i) : -1)))));

export const sfxCues: SfxCue[] = [
  {name: 'pop', at: L + tWin, gain: 0.7},
  {name: 'whoosh-hard', at: L + tFly, gain: 0.7},
  {name: 'whoosh-soft', at: L + tFly + 12, gain: 0.4},
  {name: 'whoosh-soft', at: L + tFly + 24, gain: 0.35},
  ...colDone.map((at) => ({name: 'tick' as const, at: L + at, gain: 0.4})),
  {name: 'chime', at: L + tChecks, gain: 0.6},
  {name: 'tick', at: L + tChecks + 3, gain: 0.45},
  {name: 'tick', at: L + tChecks + 6, gain: 0.45},
  {name: 'whip', at: L + tOut, gain: 0.8},
];

// Check chico que recibe cada tarjeta al aterrizar en su columna (en coordenadas de la tarjeta, se escala con ella).
const LandedCheck: React.FC<{k: number}> = ({k}) => (
  <div
    style={{
      position: 'absolute',
      right: -10,
      top: -10,
      width: 36,
      height: 36,
      borderRadius: 18,
      background: status.ok,
      border: '2.5px solid #0B0E13',
      boxShadow: `0 0 ${18 * k}px rgba(61,214,140,0.55), 0 4px 10px rgba(0,0,0,0.45)`,
      transform: `scale(${k})`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#06110B" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12.5 L9.5 18 L20 6.5" />
    </svg>
  </div>
);

export const Pitch: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < tWin) return <AbsoluteFill />;
  const landed = CARDS.map((_, i) => frame >= landAt(i));
  const columns = COLUMNS.map((col, c) => ({
    label: col.label,
    color: col.color,
    count: CARDS.filter((card, i) => card.ev.col === c && landed[i]).length,
    check: 0, // los checks grandes van en una capa encima de las tarjetas
  }));
  const checks = COLUMNS.map((_, c) => prog(frame, tChecks + c * 3, 9, inOutQuart));
  return (
    <AbsoluteFill>
      <Moving x={(f) => tween(f, tOut, tOut + 10, 0, -1400, inQuart)} blur={0.18}>
        <div style={{position: 'relative', width: 1080, height: 1920}}>
          {/* Ventana de la app: nace detrás del montón */}
          <div style={{position: 'absolute', left: WINDOW.x, top: WINDOW.y, zIndex: 1}}>
            <Pop at={tWin} from={0.6} config={{damping: 14, stiffness: 170}}>
              <AppWindow columns={columns} />
            </Pop>
          </div>

          {/* Las mismas tarjetas del montón vuelan a su columna */}
          {CARDS.map((c, i) => {
            const hp = c.heap;
            const sp = slotPlace(i);
            const p = flyP(i, frame);
            const dim = dimFor(i, CARDS.length) * (c.extra ? 0.94 : 1);
            const done = landed[i] ? Math.min(1, spring({frame: frame - landAt(i), fps, config: {damping: 12, stiffness: 240}})) : 0;
            const x = (f: number) => {
              const q = flyP(i, f);
              return hp.cx - c.w / 2 + (sp.cx - hp.cx) * q;
            };
            const y = (f: number) => {
              const q = flyP(i, f);
              // leve arco hacia arriba al despegar
              return hp.cy - c.h / 2 + (sp.cy - hp.cy) * q - Math.sin(q * Math.PI) * 60;
            };
            return (
              <Moving
                key={i}
                x={x}
                y={y}
                rotate={(f) => hp.rot * (1 - flyP(i, f))}
                scale={(f) => hp.scale + (WIN_SCALE - hp.scale) * flyP(i, f)}
                blur={0.16}
                style={{zIndex: p <= 0 ? 10 + i : 300 + c.fly}}
              >
                <div style={{position: 'relative', width: c.w, height: c.h}}>
                  <CardFace i={i} dim={dim + (1 - dim) * p} tag={1 - p} />
                  {done > 0.01 ? <LandedCheck k={done} /> : null}
                </div>
              </Moving>
            );
          })}

          {/* Checks grandes por columna, encima de las pilas */}
          <div style={{position: 'absolute', inset: 0, zIndex: 900, pointerEvents: 'none'}}>
            <ColumnChecks checks={checks} />
          </div>

          {/* Línea en mono bajo la ventana */}
          <div style={{position: 'absolute', left: 0, right: 0, top: WINDOW.y + WINDOW.h + 54, textAlign: 'center', zIndex: 2}}>
            <Typewriter
              size={36}
              family={fonts.mono}
              color={ink.text}
              letterSpacing="0.1em"
              words={[
                {text: 'a medida ·', at: Math.max(tLine, loc(beat('pitch', 'que')) - 2)},
                {text: 'integrado ·', at: loc(beat('pitch', 'lo')) + 1},
                {text: 'tuyo', at: loc(beat('pitch', 'resuelve')) - 2},
              ]}
              style={{textAlign: 'center', justifyContent: 'center'}}
            />
          </div>
        </div>
      </Moving>
    </AbsoluteFill>
  );
};
