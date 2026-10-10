import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BottomLabel} from '../fx/text';
import {Moving} from '../fx/MotionBlur';
import {inOutQuart, keyframes, outExpo} from '../fx/ease';
import {ExcelCard, InvoiceCard, WhatsAppCard} from '../ui/cards';
import {scenes} from '../timeline';
import {accent} from '../tokens';
import type {SfxCue} from '../sound';

// Escena 5 · tres patrones encontrados en la llamada, cada uno entra y sale con latigazo horizontal:
// 1 preguntas repetidas (chats apilados) · 2 stock en 3 planillas (Excel apilados) · 3 cobros a mano (facturas).
const sc = scenes.patterns;
const L = sc.from - 6;
const SLOT = Math.floor((sc.dur + 6) / 3); // frames por patrón
const slots = [0, 1, 2].map((i) => ({in: i * SLOT, out: (i + 1) * SLOT - 5}));

export const sfxCues: SfxCue[] = slots.flatMap((sl) => [{name: 'whip' as const, at: L + sl.in, gain: 0.8}]);

const Stack: React.FC<{children: React.ReactNode[]; dx?: number; dy?: number; glow?: boolean}> = ({children, dx = 34, dy = 26, glow}) => (
  <div style={{position: 'relative'}}>
    {children.map((c, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: i * dx,
          top: i * dy,
          zIndex: i,
          filter: `brightness(${0.82 + i * 0.09})`,
          borderRadius: 14,
          boxShadow: glow ? `0 0 0 1.5px ${accent.strong}, 0 0 28px rgba(77,124,255,0.35), 0 30px 60px rgba(0,0,0,0.6)` : undefined,
        }}
      >
        {c}
      </div>
    ))}
  </div>
);

const Group: React.FC<{slot: {in: number; out: number}; children: React.ReactNode; small: string; big: string; width: number}> = ({slot, children, small, big, width}) => {
  const frame = useCurrentFrame();
  if (frame < slot.in - 2 || frame > slot.out + 12) return null;
  const x = (f: number) => keyframes(f, [[slot.in, 1400], [slot.in + 7, 0], [slot.out, 0], [slot.out + 7, -1400]], f < slot.out ? outExpo : inOutQuart);
  return (
    <>
      <Moving x={x} y={() => 0} blur={0.28} style={{position: 'absolute', left: (1080 - width * 1.6) / 2, top: 640}}>
        <div style={{width, height: 420, position: 'relative', transform: 'scale(1.6)', transformOrigin: 'top left'}}>{children}</div>
      </Moving>
      <Moving x={x} y={() => 0} blur={0.2}>
        <div style={{position: 'relative', width: 1080, height: 1920}}>
          <BottomLabel small={small} big={big} at={slot.in + 3} out={slot.out + 1} bottom={540} />
        </div>
      </Moving>
    </>
  );
};

export const Patterns: React.FC = () => {
  return (
    <AbsoluteFill>
      <Group slot={slots[0]} small="patrón 1" big="preguntas repetidas" width={368}>
        <Stack glow>
          <WhatsAppCard variant={0} />
          <WhatsAppCard variant={1} />
          <WhatsAppCard variant={2} />
        </Stack>
      </Group>
      <Group slot={slots[1]} small="patrón 2" big="stock en 3 planillas" width={400}>
        <Stack dx={40} dy={34}>
          <ExcelCard variant={0} />
          <ExcelCard variant={1} />
          <ExcelCard variant={2} />
        </Stack>
      </Group>
      <Group slot={slots[2]} small="patrón 3" big="cobros a mano" width={412}>
        <Stack dx={46} dy={30}>
          <InvoiceCard variant={0} />
          <InvoiceCard variant={1} />
          <InvoiceCard variant={2} />
        </Stack>
      </Group>
    </AbsoluteFill>
  );
};
