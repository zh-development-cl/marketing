import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {BlurIn, Pop, StepTitle} from '../fx/text';
import {Moving} from '../fx/MotionBlur';
import {clamp, inOutQuart, inQuart, outExpo, prog, tween} from '../fx/ease';
import {Ring} from '../ui/Ring';
import {Paper} from '../ui/Paper';
import {accent, fonts, ink} from '../tokens';
import {beat, beatEnd, scenes} from '../timeline';
import type {SfxCue} from '../sound';

// Escena 6 · paso 02 · diseñar. Un anillo se completa mientras tres fichas (alcance · plazo · precio) se conectan
// debajo; luego una hoja de papel se despliega desde una línea de luz: "Propuesta para Tu Empresa".
const sc = scenes.step2;
const L = sc.from - 8;
const loc = (a: number) => a - L;
const tTitle = 6; // entra cuando el título del paso 01 ya terminó de salir
const tRing = loc(beat('step2', 'Después')) - 12; // el anillo nace con la primera palabra (nunca pantalla vacía)
const tChips = ['alcance', 'plazo', 'precio'].map((w) => loc(beat('step2', w)) - 3); // lo visual 1–2 frames delante del audio
const tPaper = loc(beat('step2', 'precio')) + 12;
const tRows = tPaper + 10;
const tStamp = loc(beat('step2', 'sorpresas')) - 2; // timbre "sin sorpresas" sobre la propuesta
const END = loc(sc.to) + 8;

export const sfxCues: SfxCue[] = [
  {name: 'whoosh-soft', at: L + tTitle, gain: 0.3}, // el whip de la salida del paso 01 ya sonoriza el cambio
  {name: 'rise', at: L + tRing, gain: 0.5},
  ...tChips.map((t) => ({name: 'tick' as const, at: L + t, gain: 0.6})),
  {name: 'paper', at: L + tPaper},
  {name: 'stamp', at: L + tStamp + 2, gain: 0.7},
  // (la salida la sonoriza el whoosh del título del paso 03)
];

const chips = ['alcance', 'plazo', 'precio'];

export const Step2: React.FC = () => {
  const frame = useCurrentFrame();
  const ringP = prog(frame, tRing, 52, inOutQuart); // sigue completándose durante "escrita"
  const ringOut = 1 - prog(frame, tPaper, 8);
  // Papel: se despliega desde una línea horizontal de luz (escala Y 0 → 1) y luego las hojas de atrás se asoman.
  const unfold = prog(frame, tPaper, 16, outExpo);
  const rows = interpolate(frame, [tRows, tRows + 22], [0, 3.2], clamp);
  return (
    <AbsoluteFill>
      <StepTitle n="02" title="diseñar" at={tTitle} out={END - 20} />

      {/* Anillo + fichas conectadas */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 640, opacity: ringOut, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Pop at={tRing} from={0.4}>
          <Ring progress={ringP} label={ringP >= 1 ? '✓' : `${Math.round(ringP * 100)}%`} sub="propuesta escrita" size={380} labelSize={88} />
        </Pop>
        {/* Líneas del árbol */}
        <svg width={820} height={120} style={{marginTop: 8}}>
          <path d="M410 0 V46" stroke={accent.strong} strokeWidth={2.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog(frame, tChips[0] - 10, 8)} fill="none" />
          <path d="M120 46 H700" stroke={accent.strong} strokeWidth={2.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog(frame, tChips[0] - 6, 10)} fill="none" />
          {[120, 410, 700].map((x, i) => (
            <path key={i} d={`M${x} 46 V110`} stroke={accent.strong} strokeWidth={2.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog(frame, tChips[i] - 4, 6)} fill="none" />
          ))}
        </svg>
        <div style={{display: 'flex', gap: 50, width: 820, justifyContent: 'space-between'}}>
          {chips.map((c, i) => (
            <Pop key={c} at={tChips[i]} from={0.6}>
              <div
                style={{
                  width: 240,
                  textAlign: 'center',
                  padding: '22px 0',
                  borderRadius: 16,
                  background: ink.panel2,
                  border: `1.5px solid ${accent.strong}`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(48,107,255,0.25)`,
                  fontFamily: fonts.sans,
                  fontWeight: 600,
                  fontSize: 40,
                  color: ink.text,
                }}
              >
                {c}
              </div>
            </Pop>
          ))}
        </div>
      </div>

      {/* Papel */}
      {frame >= tPaper ? (
        <Moving x={(f) => tween(f, END - 14, END - 4, 160, -1500, inQuart)} y={() => 480} blur={0.3}>
          <div style={{transform: `scaleY(${Math.max(0.02, unfold)})`, transformOrigin: '50% 50%', position: 'relative'}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: 4, background: '#fff', opacity: (1 - unfold) * 0.9, boxShadow: '0 0 30px #fff', transform: 'translateY(-2px)'}} />
            <Paper page="cover" revealRows={rows} company="Tu Empresa" />
            {/* Timbre "sin sorpresas": cae con fuerza sobre la hoja */}
            {frame >= tStamp ? (
              <div style={{position: 'absolute', right: 64, top: 775, transform: 'rotate(-9deg)'}}>
                <Pop at={tStamp} from={1.7} config={{damping: 14, stiffness: 260}}>
                  <div
                    style={{
                      color: '#1F4FD8',
                      border: '3px solid #1F4FD8',
                      borderRadius: 8,
                      padding: '8px 18px',
                      fontFamily: fonts.sans,
                      fontSize: 34,
                      fontWeight: 800,
                      letterSpacing: '0.14em',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 0 0 3px #FBFAF6, 0 0 0 6px #1F4FD8',
                      opacity: 0.88,
                      mixBlendMode: 'multiply',
                    }}
                  >
                    SIN SORPRESAS
                  </div>
                </Pop>
              </div>
            ) : null}
          </div>
        </Moving>
      ) : null}
    </AbsoluteFill>
  );
};
