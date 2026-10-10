import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {StepTitle} from '../fx/text';
import {Moving} from '../fx/MotionBlur';
import {inOutQuart, keyframes, outExpo, outQuart, prog} from '../fx/ease';
import {Phone} from '../ui/Phone';
import {beat, scenes} from '../timeline';
import {PHONE} from './layout';
import type {SfxCue} from '../sound';

// Escena 8 · paso 04 · mejorar. El mismo teléfono, en calma: el contador baja de 47 a 0 y llegan dos
// notificaciones del sistema. Al final el teléfono se encoge hasta un punto (sigue en el cierre).
const sc = scenes.step4;
const L = sc.from - 8;
const loc = (a: number) => a - L;
const tTitle = 4;
const tPhone = 2;
const tCount0 = loc(beat('step4', 'todo')) - 6;
const tCount1 = loc(beat('step4', 'empresa'));
const notes = [
  {app: 'gmail' as const, title: 'Contabilidad', body: 'Pago recibido, factura 1043', time: 'ahora'},
  {app: 'whatsapp' as const, title: 'Asistente de Tu Empresa', body: 'Listo Camila, te reservé el azul', time: 'ahora'},
];
const noteAt = [tCount0 + 4, tCount0 + 14];
export const END = loc(sc.to) + 8;

export const sfxCues: SfxCue[] = [
  {name: 'whoosh-soft', at: L + tPhone},
  ...noteAt.map((a) => ({name: 'pop' as const, at: L + a, gain: 0.6})),
  {name: 'chime', at: L + tCount1, gain: 0.6},
];

export const Step4: React.FC = () => {
  const frame = useCurrentFrame();
  const count = Math.round(keyframes(frame, [[tCount0, 47], [tCount1, 0]], outQuart));
  const tone = frame < tCount0 ? 'busy' : 'calm';
  return (
    <AbsoluteFill>
      <StepTitle n="04" title="mejorar" at={tTitle} out={END - 14} top={230} />
      <Moving
        x={() => PHONE.x}
        y={(f) => keyframes(f, [[tPhone, PHONE.y + 700], [tPhone + 14, PHONE.y + 60]], outExpo)}
        scale={() => 0.9}
        opacity={(f) => prog(f, tPhone, 6)}
        blur={0.3}
        origin="top center"
      >
        <Phone
          date="lunes 1 de diciembre"
          time="21:48"
          tone={tone}
          notifications={notes.map((n, i) => ({...n, progress: prog(frame, noteAt[i], 9)}))}
          pending={{count, label: 'sin responder'}}
        />
      </Moving>
    </AbsoluteFill>
  );
};
