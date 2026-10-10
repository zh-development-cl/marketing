import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Typewriter, spreadWords} from '../fx/text';
import {Streak} from '../fx/MotionBlur';
import {clamp, inQuart, keyframes, outQuart, prog} from '../fx/ease';
import {Phone} from '../ui/Phone';
import {beat, scenes, wordsOf} from '../timeline';
import {PHONE} from './layout';
import type {SfxCue} from '../sound';

// Escena 2 · "imagina que esta es tu empresa". El teléfono ya está (viene de la morfología del gancho):
// el bisel aparece, caen notificaciones, el contador "sin responder" sube. Al final, empuje de cámara
// hacia la pantalla con desenfoque y corte al caos.
const sc = scenes.imagine;
const L = sc.from;
const words = wordsOf('imagine').map((w) => ({text: w.text, at: w.from - L - 2, bold: /empresa|tu/i.test(w.text)}));
const tEmpresa = beat('imagine', 'empresa') - L;
const pushStart = sc.dur - 10;

const notes = [
  {app: 'excel' as const, title: 'inventario_FINAL_v3', body: 'Rodrigo modificó 34 celdas', time: 'ahora'},
  {app: 'gmail' as const, title: 'Contabilidad', body: 'Factura 1043 vencida hace 12 días', time: 'ahora'},
  {app: 'whatsapp' as const, title: 'Camila Rojas', body: 'Hola! tienen stock del modelo azul?', time: 'ahora'},
];
const noteAt = [10, 18, 26];

export const sfxCues: SfxCue[] = [
  ...noteAt.map((a) => ({name: 'pop' as const, at: L + a, gain: 0.6})),
  {name: 'rise', at: L + pushStart - 6, gain: 0.6},
];

export const Imagine: React.FC = () => {
  const frame = useCurrentFrame();
  const bezel = prog(frame, 0, 8);
  const count = Math.round(keyframes(frame, [[8, 3], [tEmpresa + 20, 47]], outQuart));
  // Empuje de cámara final: escala y desenfoque crecientes.
  const push = prog(frame, pushStart, 12, inQuart);
  const scale = 1 + push * 0.9;
  const blur = push * 22;
  const dark = interpolate(push, [0.6, 1], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Streak sx={blur * 0.6} sy={blur}>
        <div style={{position: 'absolute', inset: 0, transform: `scale(${scale})`, transformOrigin: '50% 48%'}}>
          <div style={{position: 'absolute', left: 90, top: 184, width: 780}}>
            <Typewriter words={words} size={48} weight={400} boldWeight={700} />
          </div>
          <div style={{position: 'absolute', left: PHONE.x, top: PHONE.y, opacity: prog(frame, 0, 6)}}>
            <Phone
              date="lunes 13 de octubre"
              time="21:47"
              tone="busy"
              bezelOpacity={bezel}
              notifications={notes.map((n, i) => ({...n, progress: prog(frame, noteAt[i], 9)}))}
              pending={{count, label: 'sin responder'}}
            />
          </div>
        </div>
      </Streak>
      <AbsoluteFill style={{background: '#07090D', opacity: dark}} />
    </AbsoluteFill>
  );
};
