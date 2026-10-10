import React from 'react';
import {AbsoluteFill, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Rain} from '../fx/Rain';
import {BlurIn, StepTitle} from '../fx/text';
import {Moving} from '../fx/MotionBlur';
import {clamp, inOutQuart, keyframes, outExpo, prog} from '../fx/ease';
import {fonts, ink, accent} from '../tokens';
import {beat, beatEnd, scenes} from '../timeline';
import {rainItems} from './cards';
import {CallBar} from '../ui/CallBar';
import {WALL} from './layout';
import type {SfxCue} from '../sound';

// Escena 3 + 4 · caos → muro. Decenas de tarjetas caen con desenfoque; las etiquetas aparecen en distintos
// lugares; "todo a mano" manuscrito. Con "paso 01 · entender" las tarjetas se ordenan en un muro y abajo la
// barra de llamada cuenta hasta 30:00. Luego todo sale con un latigazo hacia la izquierda.
const chaos = scenes.chaos;
const step1 = scenes.step1;
const L = chaos.from - 10; // la escena arranca 10 frames antes (preroll)
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
const tTimer1 = loc(beatEnd('step1', 'minutos')) + 2; // llega a 30:00 cuando termina "minutos"
const tOut = loc(step1.to) - 6; // latigazo de salida
const END = loc(step1.to) + 6;

export const sfxCues: SfxCue[] = [
  {name: 'whip', at: abs(8)},
  {name: 'whoosh-soft', at: abs(tMensajes - 4), gain: 0.5},
  {name: 'whoosh-soft', at: abs(tPlanillas - 4), gain: 0.5},
  {name: 'whoosh-soft', at: abs(tCorreos - 4), gain: 0.5},
  {name: 'whoosh-soft', at: abs(tCobros - 4), gain: 0.5},
  {name: 'stamp', at: abs(tTodo), gain: 0.8},
  {name: 'whoosh-hard', at: abs(tOrderStart)},
  {name: 'pop', at: abs(tCall)},
  {name: 'chime', at: abs(tTimer1), gain: 0.8},
  {name: 'whip', at: abs(tOut)},
];

const labels: Array<{text: string; at: number; x: number; y: number; align: 'left' | 'right'}> = [
  {text: 'mensajes', at: tMensajes, x: 90, y: 520, align: 'left'},
  {text: 'planillas', at: tPlanillas, x: 990, y: 1180, align: 'right'},
  {text: 'correos', at: tCorreos, x: 90, y: 860, align: 'left'},
  {text: 'cobros', at: tCobros, x: 990, y: 640, align: 'right'},
];

export const ChaosWall: React.FC = () => {
  const frame = useCurrentFrame();
  const order = (f: number) => keyframes(f, [[tOrderStart, 0], [tOrderEnd, 1]], inOutQuart);
  // Salida: todo el muro sale a la izquierda con latigazo.
  const outX = keyframes(frame, [[tOut, 0], [tOut + 10, -1500]], inOutQuart);
  const labelsOut = 1 - prog(frame, tOrderStart - 6, 8);
  const seconds = Math.floor(interpolate(frame, [tTimer0, tTimer1], [0, 1800], {...clamp, easing: inOutQuart}));
  const done = frame >= tTimer1;
  return (
    <AbsoluteFill>
      <Moving x={() => outX} y={() => 0} blur={0.25}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}}>
          <Rain
            items={rainItems}
            start={0}
            stagger={2}
            fallFrames={24}
            order={order}
            grid={WALL}
            spread={560}
            depth={900}
            camera={(f) => keyframes(f, [[0, 1.0], [tOrderStart, 1.06], [tOrderEnd, 1.0]], inOutQuart)}
          />
          {/* Etiquetas del caos en distintos lugares */}
          {labels.map((l) => (
            <div key={l.text} style={{position: 'absolute', top: l.y, left: l.align === 'left' ? l.x : undefined, right: l.align === 'right' ? 1080 - l.x : undefined, opacity: labelsOut, zIndex: 3000}}>
              <Moving x={(f) => keyframes(f, [[l.at - 6, l.align === 'left' ? -120 : 120], [l.at + 4, 0]], outExpo)} y={() => 0} opacity={(f) => prog(f, l.at - 6, 5)} style={{position: 'relative'}}>
                <div style={{fontFamily: fonts.display, fontWeight: 600, fontSize: 96, letterSpacing: '-0.03em', color: ink.text, textShadow: '0 8px 30px rgba(0,0,0,0.9)', whiteSpace: 'nowrap'}}>{l.text}</div>
              </Moving>
            </div>
          ))}
          <div style={{position: 'absolute', left: 70, top: 1340, zIndex: 3000, opacity: labelsOut}}>
            <BlurIn at={tTodo - 2} dy={24}>
              <div style={{fontFamily: fonts.hand, fontWeight: 600, fontSize: 150, color: accent.text, transform: 'rotate(-5deg)', textShadow: '0 8px 30px rgba(0,0,0,0.9)'}}>todo a mano</div>
            </BlurIn>
          </div>
          {/* Paso 01 */}
          <div style={{position: 'absolute', inset: 0, zIndex: 3500}}>
            <StepTitle n="01" title="entender" at={tTitle} />
            <div style={{position: 'absolute', left: 120, top: 1480, width: 840}}>
              <BlurIn at={tCall} dy={30}>
                <CallBar seconds={seconds} done={done} avatarSrc={staticFile('people/lorenzo.jpg')} name="Lorenzo, de ZH" subtitle="llamada con Tu Empresa" />
              </BlurIn>
            </div>
          </div>
        </div>
      </Moving>
      {frame >= END ? null : null}
    </AbsoluteFill>
  );
};
