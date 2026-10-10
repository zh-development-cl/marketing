import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {BlurIn, Pop, StepTitle} from '../fx/text';
import {Moving} from '../fx/MotionBlur';
import {clamp, inOutQuart, keyframes, outExpo, outQuart, prog, tween} from '../fx/ease';
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
const tTitle = 4;
const tRing = loc(beat('step2', 'propuesta')) - 8;
const tChips = ['alcance', 'plazo', 'precio'].map((w) => loc(beat('step2', w)));
const tPaper = loc(beat('step2', 'precio')) + 12;
const tRows = tPaper + 10;
const END = loc(sc.to) + 8;

export const sfxCues: SfxCue[] = [
  {name: 'whoosh-soft', at: L + tTitle},
  {name: 'rise', at: L + tRing, gain: 0.5},
  ...tChips.map((t) => ({name: 'tick' as const, at: L + t, gain: 0.6})),
  {name: 'paper', at: L + tPaper},
  {name: 'whoosh-soft', at: L + END - 12, gain: 0.5},
];

const chips = ['alcance', 'plazo', 'precio'];

export const Step2: React.FC = () => {
  const frame = useCurrentFrame();
  const ringP = prog(frame, tRing, 40, inOutQuart);
  const ringOut = 1 - prog(frame, tPaper, 8);
  // Papel: se despliega desde una línea horizontal de luz (escala Y 0 → 1) y luego las hojas de atrás se asoman.
  const unfold = prog(frame, tPaper, 16, outExpo);
  const paperOut = prog(frame, END - 10, 8, inOutQuart);
  const rows = interpolate(frame, [tRows, tRows + 22], [0, 3.2], clamp);
  return (
    <AbsoluteFill>
      <StepTitle n="02" title="diseñar" at={tTitle} out={END - 10} />

      {/* Anillo + fichas conectadas */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 560, opacity: ringOut, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Pop at={tRing} from={0.7}>
          <Ring progress={ringP} label={ringP >= 1 ? '✓' : ''} sub="propuesta escrita" size={320} />
        </Pop>
        {/* Líneas del árbol */}
        <svg width={700} height={110} style={{marginTop: 6}}>
          <path d="M350 0 V40" stroke={accent.strong} strokeWidth={2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog(frame, tChips[0] - 10, 8)} fill="none" />
          <path d="M80 40 H620" stroke={accent.strong} strokeWidth={2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog(frame, tChips[0] - 6, 10)} fill="none" />
          {[80, 350, 620].map((x, i) => (
            <path key={i} d={`M${x} 40 V100`} stroke={accent.strong} strokeWidth={2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog(frame, tChips[i] - 4, 6)} fill="none" />
          ))}
        </svg>
        <div style={{display: 'flex', gap: 60, width: 700, justifyContent: 'space-between'}}>
          {chips.map((c, i) => (
            <Pop key={c} at={tChips[i]} from={0.6}>
              <div
                style={{
                  width: 200,
                  textAlign: 'center',
                  padding: '18px 0',
                  borderRadius: 14,
                  background: ink.panel2,
                  border: `1.5px solid ${accent.strong}`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(48,107,255,0.25)`,
                  fontFamily: fonts.sans,
                  fontWeight: 600,
                  fontSize: 34,
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
        <Moving x={() => 160} y={(f) => tween(f, END - 10, END, 480, 440, inOutQuart)} opacity={() => 1 - paperOut} blur={0.3} extraBlur={() => paperOut * 6}>
          <div style={{transform: `scaleY(${Math.max(0.02, unfold)})`, transformOrigin: '50% 50%', position: 'relative'}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: 4, background: '#fff', opacity: (1 - unfold) * 0.9, boxShadow: '0 0 30px #fff', transform: 'translateY(-2px)'}} />
            <Paper page="cover" revealRows={rows} company="Tu Empresa" />
          </div>
        </Moving>
      ) : null}
    </AbsoluteFill>
  );
};
