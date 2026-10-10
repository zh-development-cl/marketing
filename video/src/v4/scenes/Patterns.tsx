import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BottomLabel} from '../fx/text';
import {Moving} from '../fx/MotionBlur';
import {inOutQuart, keyframes, outExpo} from '../fx/ease';
import {ExcelCard, InvoiceCard, WhatsAppCard} from '../ui/cards';
import {scenes} from '../timeline';
import type {SfxCue} from '../sound';

// Escena 5 · tres patrones encontrados en la llamada, cada uno entra y sale con latigazo horizontal:
// 1 preguntas repetidas (chats apilados) · 2 stock en 3 planillas (Excel apilados) · 3 cobros a mano (facturas).
const sc = scenes.patterns;
const L = sc.from - 6;
const SLOT = Math.floor((sc.dur + 6) / 3); // frames por patrón
const slots = [0, 1, 2].map((i) => ({in: i * SLOT, out: (i + 1) * SLOT - 6}));

export const sfxCues: SfxCue[] = slots.flatMap((sl) => [{name: 'whip' as const, at: L + sl.in, gain: 0.8}]);

const Stack: React.FC<{children: React.ReactNode[]; dx?: number; dy?: number}> = ({children, dx = 34, dy = 26}) => (
  <div style={{position: 'relative'}}>
    {children.map((c, i) => (
      <div key={i} style={{position: 'absolute', left: i * dx, top: i * dy, zIndex: i, filter: `brightness(${0.8 + i * 0.1})`}}>
        {c}
      </div>
    ))}
  </div>
);

const Group: React.FC<{slot: {in: number; out: number}; children: React.ReactNode; small: string; big: string; width: number}> = ({slot, children, small, big, width}) => {
  const frame = useCurrentFrame();
  if (frame < slot.in - 2 || frame > slot.out + 12) return null;
  const x = (f: number) => keyframes(f, [[slot.in, 1400], [slot.in + 9, 0], [slot.out, 0], [slot.out + 9, -1400]], f < slot.out ? outExpo : inOutQuart);
  return (
    <>
      <Moving x={x} y={() => 0} blur={0.28} style={{position: 'absolute', left: (1080 - width) / 2, top: 700}}>
        <div style={{width, height: 420, position: 'relative'}}>{children}</div>
      </Moving>
      <Moving x={x} y={() => 0} blur={0.2}>
        <BottomLabel small={small} big={big} at={slot.in + 4} out={slot.out + 2} bottom={520} />
      </Moving>
    </>
  );
};

export const Patterns: React.FC = () => {
  return (
    <AbsoluteFill>
      <Group slot={slots[0]} small="patrón 1" big="preguntas repetidas" width={600}>
        <Stack>
          <WhatsAppCard variant={0} />
          <WhatsAppCard variant={1} />
          <WhatsAppCard variant={2} />
        </Stack>
      </Group>
      <Group slot={slots[1]} small="patrón 2" big="stock en 3 planillas" width={640}>
        <Stack dx={40} dy={34}>
          <ExcelCard variant={0} />
          <ExcelCard variant={1} />
          <ExcelCard variant={2} />
        </Stack>
      </Group>
      <Group slot={slots[2]} small="patrón 3" big="cobros a mano" width={640}>
        <Stack dx={46} dy={30}>
          <InvoiceCard variant={0} />
          <InvoiceCard variant={1} />
          <InvoiceCard variant={2} />
        </Stack>
      </Group>
    </AbsoluteFill>
  );
};
