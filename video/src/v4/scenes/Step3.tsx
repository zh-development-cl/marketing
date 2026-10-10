import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Pop, StepTitle} from '../fx/text';
import {Moving} from '../fx/MotionBlur';
import {clamp, inOutQuart, keyframes, outExpo, prog} from '../fx/ease';
import {Paper} from '../ui/Paper';
import {CalendarCard} from '../ui/CalendarCard';
import {Dashboard} from '../ui/Dashboard';
import {WhatsAppConvo} from '../ui/WhatsAppConvo';
import {SummaryCards} from '../ui/SummaryCards';
import {beat, scenes} from '../timeline';
import type {SfxCue} from '../sound';

// Escena 7 · paso 03 · construir. Página "Plan por etapas" del documento → calendario con semanas tachadas →
// panel en uso → conversación con el asistente (IA · revisado por tu equipo) y tarjetas de resumen.
const sc = scenes.step3;
const L = sc.from - 8;
const loc = (a: number) => a - L;
const tTitle = 12; // el título anterior ya salió con su latigazo
const tPlan = 2;
const tCal = loc(beat('step3', 'etapas')) - 4;
const tCalEnd = loc(beat('step3', 'probar'));
const tDash = loc(beat('step3', 'IA')) - 16;
const tChat = loc(beat('step3', 'IA')) + 2;
const tTyping = tChat + 10; // "escribiendo…" mientras la voz sostiene "IA"
const tAnswer = loc(beat('step3', 'con', 1)) - 4; // la respuesta llega con "con revisión"
const tSeal = loc(beat('step3', 'revisión'));
const END = loc(sc.to) + 8;

export const sfxCues: SfxCue[] = [
  {name: 'whoosh-soft', at: L + tTitle},
  {name: 'paper', at: L + tPlan, gain: 0.5},
  {name: 'whip', at: L + tCal - 2, gain: 0.7},
  ...Array.from({length: 6}, (_, i) => ({name: 'tick' as const, at: L + tCal + 8 + i * 5, gain: 0.5})),
  {name: 'whoosh-hard', at: L + tDash},
  {name: 'pop', at: L + tChat, gain: 0.6},
  {name: 'pop', at: L + tAnswer, gain: 0.5},
  {name: 'chime', at: L + tSeal, gain: 0.7},
];

// Pieza que entra desde la derecha con latigazo y sale hacia la izquierda ('whip') o se desenfoca y apaga en el
// sitio ('fade', para quedar debajo de lo que entra encima).
const Slide: React.FC<{tin: number; tout: number; top: number; width: number; exit?: 'whip' | 'fade'; children: React.ReactNode}> = ({tin, tout, top, width, exit = 'whip', children}) => {
  const frame = useCurrentFrame();
  if (frame < tin - 2 || frame > tout + 12) return null;
  const fade = exit === 'fade' ? prog(frame, tout - 6, 12, inOutQuart) : 0;
  return (
    <Moving
      x={(f) => (exit === 'fade' ? keyframes(f, [[tin, 1400], [tin + 10, 0]], outExpo) : keyframes(f, [[tin, 1400], [tin + 10, 0], [tout, 0], [tout + 10, -1400]], f < tout ? outExpo : inOutQuart))}
      y={() => 0}
      opacity={() => 1 - fade}
      extraBlur={() => fade * 14}
      blur={0.26}
      style={{position: 'absolute', left: (1080 - width) / 2, top}}
    >
      <div style={{width}}>{children}</div>
    </Moving>
  );
};

export const Step3: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = prog(frame, tPlan + 6, 24);
  const struck = Math.floor(interpolate(frame, [tCal + 8, tCalEnd + 6], [0, 20], clamp));
  const dash = prog(frame, tDash + 6, 30);
  const show = frame < tChat ? 0 : frame < tAnswer ? 1 : frame < tSeal ? 2 : 3;
  const typing = frame < tAnswer ? prog(frame, tTyping, 6) : 1 - prog(frame, tAnswer, 4);
  return (
    <AbsoluteFill>
      <StepTitle n="03" title="construir" at={tTitle} out={END - 20} />
      <Slide tin={tPlan} tout={tCal - 4} top={520} width={760}>
        <Paper page="plan" barsProgress={bars} company="Tu Empresa" />
      </Slide>
      <Slide tin={tCal} tout={tDash - 4} top={560} width={900}>
        <CalendarCard struck={struck} />
      </Slide>
      <Slide tin={tDash} tout={END - 8} top={448} width={900} exit="fade">
        <Dashboard progress={dash} />
        <div style={{marginTop: 8, opacity: prog(frame, tChat - 2, 6)}}>
          <WhatsAppConvo show={show} typing={typing} tick={frame} />
        </div>
        <div style={{marginTop: 8}}>
          <Pop at={tSeal + 6} from={0.85} config={{damping: 14, stiffness: 160}}>
            <SummaryCards />
          </Pop>
        </div>
      </Slide>
    </AbsoluteFill>
  );
};
