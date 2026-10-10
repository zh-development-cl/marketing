import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Moving} from '../fx/MotionBlur';
import {inQuart, prog} from '../fx/ease';
import {accent, fonts, ink} from '../tokens';
import {beat, beatEnd, scenes} from '../timeline';
import type {SfxCue} from '../sound';

// Escena 1 · gancho. La pregunta se ESCRIBE en pantalla, letra a letra, como en una consola: una línea chica en mono
// ("~/tu-empresa $") y debajo, en display grande, "¿qué hacemos en" / "ZH" / "Development?" con un cursor de bloque azul (el
// mismo azul del logo) que parpadea. Al terminar, todo el bloque sale hacia arriba con latigazo y entra el día.
const sc = scenes.hook;
const L = sc.from;
type W = {text: string; from: number; to: number};
const lines: W[][] = [
  [
    {text: '¿qué', from: beat('hook', 'Qué') - L - 6, to: beatEnd('hook', 'Qué') - L},
    {text: 'hacemos', from: beat('hook', 'hacemos') - L - 2, to: beatEnd('hook', 'hacemos') - L},
    {text: 'en', from: beat('hook', 'en') - L - 2, to: beatEnd('hook', 'en') - L},
  ],
  [{text: 'ZH', from: beat('hook', 'ZH') - L - 4, to: beatEnd('hook', 'ZH') - L - 6}],
  [{text: 'Development?', from: beat('hook', 'Development') - L - 4, to: beatEnd('hook', 'Development') - L - 2}],
];
const words = lines.flat();
const tOut = Math.max(sc.dur - 12, beatEnd('hook', 'Development') - L + 1); // latigazo de salida justo después de la última palabra (el día entra desde abajo)
export const END = sc.dur + 10;

// Carácter a carácter: cuántas letras de una palabra se ven en el frame f.
const chars = (w: W) => [...w.text];
const typed = (f: number, w: W) => {
  const n = chars(w).length;
  const p = Math.max(0, Math.min(1, (f - w.from) / Math.max(1, w.to - w.from)));
  return Math.round(p * n);
};
const charFrames = words.flatMap((w) => chars(w).map((_, i) => Math.round(w.from + ((i + 1) / chars(w).length) * (w.to - w.from))));

export const sfxCues: SfxCue[] = [
  ...charFrames.filter((_, i) => i % 2 === 0).map((f) => ({name: 'tick' as const, at: L + f, gain: 0.3})),
  {name: 'whoosh-hard', at: L + tOut, gain: 0.8},
];

const Caret: React.FC<{h: number}> = ({h}) => (
  <span style={{display: 'inline-block', width: Math.round(h * 0.17), height: h, marginLeft: 12, verticalAlign: '-6%', background: accent.strong, boxShadow: `0 0 24px ${accent.glow}`, borderRadius: 3}} />
);

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const out = prog(frame, tOut, 8, inQuart);
  const lastWord = [...words].reverse().find((w) => typed(frame, w) > 0);
  const caretLine = lastWord ? lines.findIndex((l) => l.includes(lastWord)) : 0;
  const typing = lastWord ? typed(frame, lastWord) < chars(lastWord).length : false;
  const blink = typing || frame % 16 < 10;
  const prompt = prog(frame, 0, 8);
  const sizes = [118, 230, 118];
  const render = (ws: W[]) =>
    ws.map((w, i) => (
      <span key={w.text}>
        {chars(w).slice(0, typed(frame, w)).join('')}
        {i < ws.length - 1 && typed(frame, w) === chars(w).length ? ' ' : ''}
      </span>
    ));
  return (
    <AbsoluteFill style={{zIndex: 5}}>
      <Moving x={() => 0} y={() => -1400 * out} opacity={() => 1 - out} extraBlur={() => out * 10} blur={0.3}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}}>
          <div style={{position: 'absolute', left: 90, top: 640, width: 940}}>
            <div style={{fontFamily: fonts.mono, fontSize: 32, letterSpacing: '0.06em', color: ink.text3, opacity: prompt, marginBottom: 30, whiteSpace: 'nowrap'}}>
              ~/tu-empresa <span style={{color: accent.text}}>$</span>
            </div>
            {lines.map((ws, li) => (
              <div
                key={li}
                style={{
                  fontFamily: fonts.display,
                  fontWeight: li === 1 ? 700 : 600,
                  fontSize: sizes[li],
                  lineHeight: 1.0,
                  letterSpacing: li === 1 ? '-0.045em' : '-0.03em',
                  color: ink.text,
                  whiteSpace: 'nowrap',
                  marginTop: li === 0 ? 0 : li === 1 ? 10 : 14,
                  minHeight: sizes[li],
                }}
              >
                {render(ws)}
                {caretLine === li && blink ? <Caret h={Math.round(sizes[li] * 0.82)} /> : null}
              </div>
            ))}
          </div>
        </div>
      </Moving>
    </AbsoluteFill>
  );
};
