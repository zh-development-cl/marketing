import React from 'react';
import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Rain} from '../fx/Rain';
import {BlurIn, StepTitle} from '../fx/text';
import {Moving} from '../fx/MotionBlur';
import {clamp, inOutQuart, inQuart, keyframes, outExpo, prog} from '../fx/ease';
import {fonts, ink, accent} from '../tokens';
import {beat, beatEnd, scenes} from '../timeline';
import {rainItems} from './cards';
import {CallBar} from '../ui/CallBar';
import {WALL} from './layout';
import type {SfxCue} from '../sound';

// Escena 3 + 4 · caos → muro. Decenas de tarjetas caen con desenfoque; las etiquetas aparecen en distintos
// lugares; "todo a mano" manuscrito. Con "paso 01 · entender" las tarjetas se ordenan en un muro y abajo la
// barra de llamada cuenta hasta 30:00. Luego el muro sale a la izquierda por oleadas (fila a fila) y detrás
// salen el título y la barra con un latigazo.
const chaos = scenes.chaos;
const step1 = scenes.step1;
const L = chaos.from - 18; // la escena arranca 18 frames antes (preroll): la lluvia ya cruza el empuje del teléfono
const abs = (f: number) => f + L; // local → absoluto
const loc = (a: number) => a - L; // absoluto → local

const tMensajes = loc(beat('chaos', 'mensajes'));
const tPlanillas = loc(beat('chaos', 'planillas'));
const tCorreos = loc(beat('chaos', 'correos'));
const tCobros = loc(beat('chaos', 'cobros'));
const tTodo = loc(beat('chaos', 'todo'));
const tOrderStart = loc(step1.from) - 10;
const tOrderEnd = loc(step1.from) + 14;
const tTitle = loc(step1.from) - 4;
const tCall = loc(beat('step1', 'llamada')) - 6; // la barra aparece justo antes de "llamada"
const tTimer0 = loc(beat('step1', 'llamada'));
const tTimer1 = loc(beat('step1', 'quita')); // llega a 30:00 con la última palabra y se sostiene
const tOut = loc(step1.to) - 16; // el muro empieza a salir por oleadas
const tOutUI = tOut + 6; // título + barra salen con latigazo
const END = loc(step1.to) + 24;
// Durante la llamada "encontramos" los patrones: las tarjetas de cada tipo se iluminan por grupos
// (chats → planillas → facturas), en el mismo orden en que aparecen después.
// Cada grupo se enciende (con su tick) justo al terminar la palabra, en el hueco entre palabras.
const found: Array<{mod: number; at: number; color: string}> = [
  {mod: 0, at: loc(beatEnd('step1', 'encontrar')) + 1, color: accent.strong}, // whatsapp
  {mod: 2, at: loc(beatEnd('step1', 'más')) + 1, color: '#2FD277'}, // excel
  {mod: 4, at: loc(beatEnd('step1', 'quita')) + 2, color: '#FFA63D'}, // facturas
];
const highlight = (i: number, f: number): [number, string] | null => {
  const g = found.find((x) => i % 9 === x.mod);
  if (!g || f < g.at) return null;
  const k = prog(f, g.at, 10, outExpo) * Math.min(1, 0.7 + 0.3 * Math.sin(f / 9 + i)); // leve pulso
  return [k, g.color];
};

export const sfxCues: SfxCue[] = [
  {name: 'whip', at: abs(8)},
  {name: 'whoosh-soft', at: abs(tMensajes - 4), gain: 0.5},
  {name: 'whoosh-soft', at: abs(tPlanillas - 4), gain: 0.5},
  {name: 'whoosh-soft', at: abs(tCorreos - 4), gain: 0.5},
  {name: 'whoosh-soft', at: abs(tCobros - 4), gain: 0.5},
  {name: 'stamp', at: abs(tTodo), gain: 0.8},
  {name: 'whoosh-hard', at: abs(tOrderStart)},
  {name: 'pop', at: abs(tCall)},
  ...found.map((g) => ({name: 'tick' as const, at: abs(g.at), gain: 0.85})),
  {name: 'chime', at: abs(tTimer1), gain: 0.8},
  {name: 'whip', at: abs(tOut)},
];

const labels: Array<{text: string; at: number; x: number; y: number; align: 'left' | 'right'}> = [
  {text: 'mensajes', at: tMensajes, x: 90, y: 520, align: 'left'},
  {text: 'planillas', at: tPlanillas, x: 930, y: 1180, align: 'right'},
  {text: 'correos', at: tCorreos, x: 90, y: 860, align: 'left'},
  {text: 'cobros', at: tCobros, x: 990, y: 640, align: 'right'},
];

const timerEase = Easing.inOut(Easing.poly(2));

export const ChaosWall: React.FC = () => {
  const frame = useCurrentFrame();
  const order = (f: number) => keyframes(f, [[tOrderStart, 0], [tOrderEnd, 1]], inOutQuart);
  // Salida del título y la barra: latigazo a la izquierda (el muro ya va saliendo por filas).
  const outX = keyframes(frame, [[tOutUI, 0], [tOutUI + 10, -1500]], inQuart);
  const labelsOut = 1 - prog(frame, tOrderStart - 2, 6);
  const seconds = Math.floor(interpolate(frame, [tTimer0, tTimer1], [0, 1800], {...clamp, easing: timerEase}));
  const done = frame >= tTimer1;
  return (
    <AbsoluteFill>
      {frame >= END ? null : (
        <>
          <div style={{position: 'absolute', inset: 0}}>
            <Rain
              items={rainItems}
              start={0}
              stagger={2}
              fallFrames={24}
              order={order}
              grid={WALL}
              spread={560}
              depth={900}
              fade={(f) => 1 - 0.18 * (prog(f, tTodo - 2, 6) - prog(f, tOrderStart - 6, 8))}
              camera={(f) => keyframes(f, [[0, 1.0], [tTodo, 1.08], [tOrderStart, 1.06], [tOrderEnd, 1.0], [tOut, 1.045]], inOutQuart)}
              highlight={highlight}
              exitAt={tOut}
              exitFrames={12}
              exitRowDelay={1.5}
            />
          </div>
          <Moving x={() => outX} y={() => 0} blur={0.25}>
            <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}}>
              {/* Etiquetas del caos en distintos lugares */}
              {labels.map((l) => (
                <div key={l.text} style={{position: 'absolute', top: l.y, left: l.align === 'left' ? l.x : undefined, right: l.align === 'right' ? 1080 - l.x : undefined, opacity: labelsOut, zIndex: 3000}}>
                  <Moving x={(f) => keyframes(f, [[l.at - 6, l.align === 'left' ? -120 : 120], [l.at + 4, 0]], outExpo)} y={() => 0} opacity={(f) => prog(f, l.at - 6, 5)} style={{position: 'relative'}}>
                    <div style={{fontFamily: fonts.display, fontWeight: 600, fontSize: 96, letterSpacing: '-0.03em', color: ink.text, textShadow: '0 8px 30px rgba(0,0,0,0.9)', whiteSpace: 'nowrap'}}>{l.text}</div>
                  </Moving>
                </div>
              ))}
              <div style={{position: 'absolute', left: 0, right: 0, top: 880, textAlign: 'center', zIndex: 3000, opacity: labelsOut}}>
                <BlurIn at={tTodo - 2} dy={24}>
                  <div style={{fontFamily: fonts.hand, fontWeight: 700, fontSize: 210, color: ink.text, transform: 'rotate(-5deg)', textShadow: '0 0 26px rgba(0,0,0,0.95), 0 12px 40px rgba(0,0,0,0.9)', whiteSpace: 'nowrap'}}>todo a mano</div>
                </BlurIn>
              </div>
              {/* Paso 01 */}
              <div style={{position: 'absolute', inset: 0, zIndex: 3500}}>
                <StepTitle n="01" title="entender" at={tTitle} />
                <div style={{position: 'absolute', left: 120, top: 1385, width: 840}}>
                  <BlurIn at={tCall} dy={30}>
                    <CallBar seconds={seconds} done={done} avatarSrc={staticFile('people/lorenzo.jpg')} name="Lorenzo, de ZH" subtitle="llamada con Tu Empresa" />
                  </BlurIn>
                </div>
              </div>
            </div>
          </Moving>
        </>
      )}
    </AbsoluteFill>
  );
};
