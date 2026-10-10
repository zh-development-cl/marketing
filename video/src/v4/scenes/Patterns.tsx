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
const L = sc.from; // sin preroll: el muro ya salió cuando llega la primera pila
const LEAD = 8; // la primera pila llega 8 frames después del inicio nominal
const SLOT = Math.floor((sc.dur - LEAD) / 3); // frames por patrón
const slots = [0, 1, 2].map((i) => ({in: LEAD + i * SLOT, out: LEAD + (i + 1) * SLOT - 5}));
const SCALE = 1.72; // las pilas ocupan ~70 % del ancho

export const sfxCues: SfxCue[] = [
  ...slots.map((sl) => ({name: 'whip' as const, at: L + sl.in, gain: 0.8})),
  {name: 'rise', at: L + sc.dur - 24, gain: 0.6}, // desemboca en el paso 02
];

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
          filter: `brightness(${0.7 + i * 0.15})`,
          opacity: 0.8 + i * 0.1,
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
      <Moving x={x} y={() => 0} blur={0.28} style={{position: 'absolute', left: (1080 - width * SCALE) / 2 - 30, top: 700}}>
        <div style={{width, height: 420, position: 'relative', transform: `scale(${SCALE})`, transformOrigin: 'top left'}}>{children}</div>
      </Moving>
      <Moving x={x} y={() => 0} blur={0.2}>
        <div style={{position: 'relative', width: 1080, height: 1920}}>
          <BottomLabel small={small} big={big} at={slot.in + 3} out={slot.out + 1} bottom={520} />
        </div>
      </Moving>
    </>
  );
};

export const Patterns: React.FC = () => {
  return (
    <AbsoluteFill>
      <Group slot={slots[0]} small="patrón 1" big="preguntas repetidas" width={368}>
        <Stack glow dx={40} dy={64}>
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
