import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {BlurIn, Pop, Typewriter} from '../fx/text';
import {Moving} from '../fx/MotionBlur';
import {inOutQuart, inQuart, prog, tween} from '../fx/ease';
import {AppWindow, WINDOW} from '../ui/AppWindow';
import {accent, fonts} from '../tokens';
import {beat, scenes} from '../timeline';
import type {SfxCue} from '../sound';
import {CARDS, COLUMNS, CardFace, HANDOFF, HEAP_SCALE, WIN_SCALE, dimFor, heapPlace, slotPlace} from './dayData';

// Escena 3 · pitch. A las 19:00 se abre en el centro la ventana "Tu Empresa · sistema" (Pop) y el montón del día
// vuela hacia ella: cada tarjeta se encoge con desenfoque y se ordena en tres columnas (cotizaciones · stock ·
// cobros). En "resuelve" cada columna remata con un check verde. Debajo, en mono: "a medida · integrado · tuyo".
// Sale a la izquierda con latigazo porque el paso 01 entra desde la derecha.
const sc = scenes.pitch;
const L = sc.from - 12;
const loc = (a: number) => a - L;
export const END = loc(sc.to) + 10;
const tWin = loc(HANDOFF); // 8: la ventana aparece y el montón pasa a esta escena
const tFly = tWin; // despegue inmediato: la ventana nace y el montón ya vuela
const STAGGER = 1.5;
const FLY = 14;
const tLine = loc(beat('pitch', 'Hacemos')) + 2;
const tChecks = loc(beat('pitch', 'resuelve')) - 2;
const tOut = loc(sc.to) - 6;

const flyAt = (i: number) => tFly + i * STAGGER;
const flyP = (i: number, f: number) => prog(f, flyAt(i), FLY, Easing.bezier(0.4, 0, 0.1, 1));

export const sfxCues: SfxCue[] = [
  {name: 'pop', at: L + tWin, gain: 0.7},
  {name: 'whoosh-hard', at: L + tFly, gain: 0.7},
  {name: 'whoosh-soft', at: L + tFly + 10, gain: 0.4},
  {name: 'chime', at: L + tChecks, gain: 0.6},
  {name: 'tick', at: L + tChecks + 3, gain: 0.45},
  {name: 'tick', at: L + tChecks + 6, gain: 0.45},
  {name: 'whip', at: L + tOut, gain: 0.8},
];

export const Pitch: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < tWin) return <AbsoluteFill />;
  const landed = CARDS.map((_, i) => flyP(i, frame) >= 0.96);
  const columns = COLUMNS.map((col, c) => ({
    label: col.label,
    color: col.color,
    count: CARDS.filter((card, i) => card.ev.col === c && landed[i]).length,
    check: prog(frame, tChecks + c * 3, 9, inOutQuart),
  }));
  return (
    <AbsoluteFill>
      <Moving x={(f) => tween(f, tOut, tOut + 10, 0, -1400, inQuart)} blur={0.3}>
        <div style={{position: 'relative', width: 1080, height: 1920}}>
          {/* Ventana de la app */}
          <div style={{position: 'absolute', left: WINDOW.x, top: WINDOW.y, zIndex: 1}}>
            <Pop at={tWin} from={0.6} config={{damping: 14, stiffness: 170}}>
              <AppWindow columns={columns} />
            </Pop>
          </div>

          {/* El montón vuela a las columnas */}
          {CARDS.map((c, i) => {
            const hp = heapPlace(i);
            const sp = slotPlace(i);
            const p = flyP(i, frame);
            const dim = dimFor(i, CARDS.length);
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
                scale={(f) => HEAP_SCALE + (WIN_SCALE - HEAP_SCALE) * flyP(i, f)}
                blur={0.3}
                style={{zIndex: 10 + i}}
              >
                <CardFace i={i} dim={dim + (1 - dim) * p} tag={1 - p} />
              </Moving>
            );
          })}

          {/* Línea en mono bajo la ventana */}
          <div style={{position: 'absolute', left: 0, right: 0, top: WINDOW.y + WINDOW.h + 54, textAlign: 'center', zIndex: 2}}>
            <Typewriter
              size={32}
              family={fonts.mono}
              color={accent.text}
              letterSpacing="0.1em"
              words={[
                {text: 'a medida ·', at: loc(beat('pitch', 'software')) - 2},
                {text: 'integrado ·', at: loc(beat('pitch', 'que')) - 2},
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
