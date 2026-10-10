import React from 'react';
import {AbsoluteFill, Easing, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {StepTitle} from '../fx/text';
import {Moving} from '../fx/MotionBlur';
import {inOutQuart, keyframes, outExpo, prog} from '../fx/ease';
import {OWNERSHIP_H, OWNERSHIP_W, OwnershipCard} from '../ui/OwnershipCard';
import {beat, beatEnd, scenes} from '../timeline';
import type {SfxCue} from '../sound';

// Escena 8 · paso 04 · mejorar → "propiedad". Mientras el panel del paso 03 se desenfoca y apaga, desde abajo
// entra una tarjeta de propiedad (sello ZH chico, "Propiedad de / Tu Empresa") con tres filas —código fuente,
// repositorio y accesos, cuentas y dominio— cuyos checks se encienden en verde con "todo", "nombre" y "empresa";
// un contraluz azul sube con cada check. Al final la tarjeta se encoge hasta un punto (DOT): ahí nace el bloque
// azul del logo en el cierre.
const sc = scenes.step4;
const L = sc.from - 8;
const loc = (a: number) => a - L;
const tTitle = 12; // el título anterior ya salió
const tCard = 8; // la tarjeta entra desde abajo mientras el panel del paso 03 se desenfoca y apaga
const tCheck = [loc(beat('step4', 'todo')), loc(beat('step4', 'nombre')), loc(beat('step4', 'empresa')), loc(beat('step4', 'empresa')) + 8];
const tFooter = tCheck[3] + 4; // el pie aparece con el cuarto check y se lee ~0,8 s antes de encoger
export const END = loc(sc.to) + 8;
const tShrink = END - 16; // la tarjeta se encoge hasta un punto
const DOT = {x: 591, y: 611}; // centro medido del bloque azul del logo en el cierre (frame 1068)

const CARD = {x: (1080 - OWNERSHIP_W) / 2, y: 540, w: OWNERSHIP_W, h: OWNERSHIP_H} as const;

export const sfxCues: SfxCue[] = [
  {name: 'whoosh-soft', at: L + tCard},
  ...tCheck.map((a) => ({name: 'tick' as const, at: L + a, gain: 0.6})),
  {name: 'whoosh-hard', at: L + tShrink, gain: 0.8},
];

export const Step4: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const checks = tCheck.map((a) => spring({frame: frame - a, fps, config: {damping: 11, stiffness: 190}}));
  const lit = checks.reduce((s, p) => s + Math.min(1, p), 0) / 4;
  const footer = prog(frame, tFooter, 8);
  // Contraluz azul detrás de la tarjeta: entra con ella, sube con cada check y se apaga con el encogimiento.
  const halo = prog(frame, tCard + 4, 16) * (0.55 + 0.45 * lit) * (1 - prog(frame, tShrink, 12));
  return (
    <AbsoluteFill>
      {halo > 0.01 ? (
        <div
          style={{
            position: 'absolute',
            left: CARD.x + CARD.w / 2 - 640,
            top: CARD.y + CARD.h / 2 - 520,
            width: 1280,
            height: 1040,
            borderRadius: 999,
            background: `radial-gradient(ellipse at center, rgba(77,124,255,${0.22 * halo}) 0%, rgba(77,124,255,${0.07 * halo}) 35%, rgba(77,124,255,0) 66%)`,
            pointerEvents: 'none',
          }}
        />
      ) : null}

      <StepTitle n="04" title="mejorar" at={tTitle} out={END - 24} />

      <Moving
        x={(f) => keyframes(f, [[tShrink, CARD.x], [END - 2, DOT.x - CARD.w / 2]], inOutQuart)}
        y={(f) => keyframes(f, [[tCard, CARD.y + 760], [tCard + 14, CARD.y], [tShrink, CARD.y], [END - 2, DOT.y - CARD.h / 2]], f < tShrink ? outExpo : inOutQuart)}
        scale={(f) => keyframes(f, [[tShrink, 1], [END - 2, 0.02]], Easing.in(Easing.poly(3)))}
        opacity={(f) => prog(f, tCard, 6)}
        blur={0.26}
        origin="center"
      >
        <div style={{width: CARD.w, height: CARD.h}}>
          <OwnershipCard checks={checks} footer={footer} glow={0.35 + 0.65 * lit} />
        </div>
      </Moving>
    </AbsoluteFill>
  );
};
