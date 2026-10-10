import React from 'react';
import {AbsoluteFill, Easing, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Pop, StepTitle} from '../fx/text';
import {Moving} from '../fx/MotionBlur';
import {inQuart, outExpo, prog, tween} from '../fx/ease';
import {CallCard, CALLCARD_H, CALLCARD_W} from '../ui/CallCard';
import {CallNotes, CALLNOTES_H, CALLNOTES_STACK, CALLNOTES_W} from '../ui/CallNotes';
import {ExcelCard, InvoiceCard, WhatsAppCard} from '../ui/cards';
import {beat, beatEnd, scenes} from '../timeline';
import type {SfxCue} from '../sound';

// Escena 5 · paso 01 · entender. "La llamada de diagnóstico": una videollamada grande (Lorenzo · Tu Empresa) entra
// con latigazo; su contador corre de 00:00 a 30:00 mientras la voz dice "llamada… quita" y se pone verde al llegar.
// Debajo, una hoja "Notas de la llamada" donde se escriben en vivo, letra a letra, tres hallazgos; cada uno recibe
// un marcador azul y, a su derecha, una mini tarjeta real (WhatsApp / Excel / factura) como prueba.
const sc = scenes.step1;
// Captura real de la llamada (Meet con Lorenzo y Nico). Cuando llegue el archivo, ponerlo en public/people/ y activar:
//   {kind: 'image', src: 'people/meet.jpg', label: 'Lorenzo y Nico · ZH Development'}  o
//   {kind: 'video', src: 'people/meet.mp4', startFrom: 0, label: 'Lorenzo y Nico · ZH Development'}
type Meet = {kind: 'image' | 'video'; src: string; startFrom?: number; label?: string; objectPosition?: string};
const MEET = null as Meet | null;
const PRE = 10;
const POST = 12;
const L = sc.from - PRE;
const loc = (a: number) => a - L;

const tIn = loc(sc.from) - 4; // latigazo de la llamada: from-4 → from+6
const tTitle = 12;
const tCount0 = loc(beat('step1', 'llamada')); // 00:00 empieza a correr
const tCount1 = loc(beat('step1', 'quita')); // llega a 30:00 (verde + chime)
const tSpeak0 = loc(sc.voAt);
const tSpeak1 = loc(beatEnd('step1', 'quita'));
const tSheet = loc(beat('step1', '30')) - 3; // la hoja sube desde abajo mientras se dice "30 minutos"
const tOut = loc(sc.to) - 10; // salida: to-10 → to
const END = loc(sc.to) + POST;

type Line = {text: string; at: number; dur: number};
const LINES: Line[] = [
  {text: '1. cotizaciones repetidas por WhatsApp', at: loc(beat('step1', 'encontrar')), dur: 19},
  {text: '2. stock en tres planillas distintas', at: loc(beat('step1', 'más')) - 2, dur: 16},
  {text: '3. cobros a mano, facturas vencidas', at: loc(beat('step1', 'te')), dur: 18},
];
const lineEnd = (l: Line) => l.at + l.dur; // último carácter escrito → marcador + prueba
const MARK_DUR = 12;

// Un 'tick' cada 3 frames mientras se escribe (≈9 por segundo: tecleo, no zumbido) y nunca en el frame del marcador.
const tickFrames = (l: Line) => {
  const out: number[] = [];
  for (let f = l.at + 2; f < lineEnd(l) - 1; f += 3) out.push(f);
  return out;
};

export const sfxCues: SfxCue[] = [
  {name: 'whoosh-hard', at: L + tIn},
  {name: 'whoosh-soft', at: L + tSheet - 2, gain: 0.6},
  {name: 'paper', at: L + tSheet + 6, gain: 0.5},
  ...LINES.flatMap((l) => tickFrames(l).map((t) => ({name: 'tick' as const, at: L + t, gain: 0.25}))),
  ...LINES.map((l) => ({name: 'pop' as const, at: L + lineEnd(l), gain: 0.6})),
  {name: 'chime', at: L + tCount1, gain: 0.8},
  {name: 'whip', at: L + tOut},
];

const inOutQuad = Easing.inOut(Easing.quad);

// Posición x compartida por la llamada y la hoja: 0 en reposo, latigazo hacia la izquierda con inQuart al salir.
const exitX = (f: number) => tween(f, tOut, tOut + 10, 0, -1400, inQuart);

const PROOF_ROT = [-2.2, 1.6, -1.2];
const PROOF_DY = [-2, 0, 6]; // la factura (más alta) baja un poco para no tapar el #REF! de la planilla

export const Step1: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Contador 00:00 → 30:00 con easing inOut cuadrático (monótono: nunca retrocede).
  const seconds = 1800 * prog(frame, tCount0, tCount1 - tCount0, inOutQuad);
  const done = frame >= tCount1 ? spring({frame: frame - tCount1, fps, config: {damping: 11, stiffness: 180}}) : 0;
  const speaking = frame >= tSpeak0 && frame <= tSpeak1;

  // Renglones: letras escritas, marcador y prueba.
  const lines = LINES.map((l, i) => {
    const typed = Math.floor(tween(frame, l.at, lineEnd(l), 0, l.text.length, Easing.linear));
    const mark = prog(frame, lineEnd(l), MARK_DUR, outExpo);
    const tProof = lineEnd(l) + 1;
    const proof =
      frame >= tProof ? (
        <Pop at={tProof} from={0.5} config={{damping: 12, stiffness: 190}}>
          {i === 0 ? <WhatsAppCard variant={1} /> : i === 1 ? <ExcelCard variant={0} /> : <InvoiceCard variant={0} />}
        </Pop>
      ) : undefined;
    return {text: l.text, typed, mark, proof, proofRotate: PROOF_ROT[i], proofDy: PROOF_DY[i]};
  });
  // Cursor: parpadea en el primer renglón vacío apenas llega la hoja, fijo en el renglón que se escribe y
  // parpadeando en el último completado.
  const active = LINES.findIndex((l) => frame >= l.at && frame < lineEnd(l));
  const lastDone = LINES.reduce((acc, l, i) => (frame >= lineEnd(l) ? i : acc), -1);
  const cursorLine = active >= 0 ? active : frame >= tSheet + 10 ? Math.max(0, lastDone) : -1;
  const cursorOn = active >= 0 ? true : frame % 16 < 9;

  const showCall = frame >= tIn - 1 && frame <= tOut + 11;
  const showSheet = frame >= tSheet - 1 && frame <= tOut + 11;

  return (
    <AbsoluteFill>
      <StepTitle n="01" title="entender" at={tTitle} out={END - 28} />

      {/* Videollamada: entra desde la derecha con latigazo, sale a la izquierda con la hoja */}
      {showCall ? (
        <Moving x={(f) => tween(f, tIn, tIn + 10, 1400, 0, outExpo) + exitX(f)} y={() => 0} blur={0.3} style={{left: (1080 - CALLCARD_W) / 2, top: 460}}>
          <div style={{width: CALLCARD_W, height: CALLCARD_H}}>
            <CallCard seconds={seconds} done={done} speaking={speaking} tick={frame} avatarSrc={staticFile('people/lorenzo.jpg')} media={MEET ? {...MEET, src: staticFile(MEET.src)} : undefined} />
          </div>
        </Moving>
      ) : null}

      {/* Hoja de notas: sube desde abajo del cuadro, sale a la izquierda con la llamada */}
      {showSheet ? (
        <Moving x={exitX} y={(f) => tween(f, tSheet, tSheet + 12, 420, 0, outExpo)} blur={0.12} style={{left: (1080 - CALLNOTES_W) / 2, top: 1004}}>
          <div style={{width: CALLNOTES_W + CALLNOTES_STACK, height: CALLNOTES_H + CALLNOTES_STACK}}>
            <CallNotes lines={lines} cursorLine={cursorLine} cursorOn={cursorOn} />
          </div>
        </Moving>
      ) : null}
    </AbsoluteFill>
  );
};
