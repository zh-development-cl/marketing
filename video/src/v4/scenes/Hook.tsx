import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BlurIn} from '../fx/text';
import {Moving} from '../fx/MotionBlur';
import {clamp, inOutQuart, keyframes, outExpo, prog, tween} from '../fx/ease';
import {accent, fonts, ink} from '../tokens';
import {beat, scenes} from '../timeline';
import {PHONE} from './layout';
import type {SfxCue} from '../sound';
import {interpolate} from 'remotion';

// Escena 1 · gancho. "qué es" chico, "ZH?" enorme con el "?" en acento, "development" debajo.
// Al final, una píldola se dibuja alrededor del texto, se llena de oscuro y se expande hasta ser la pantalla del
// teléfono de la escena siguiente (morfología, como en la referencia).
const sc = scenes.hook;
const L = sc.from; // frames absolutos → locales
const tQue = beat('hook', 'Qué') - L;
const tEs = beat('hook', 'es') - L;
const tZH = beat('hook', 'ZH') - L;
const tDev = beat('hook', 'Development') - L;
const morphStart = sc.dur - 18;
const morphEnd = sc.dur + 6;

export const sfxCues: SfxCue[] = [
  {name: 'whoosh-soft', at: L + tZH - 6},
  {name: 'tick', at: L + tDev + 10, gain: 0.5},
  {name: 'whoosh-hard', at: L + morphStart + 6},
];

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  // Morfología: 0 = píldora alrededor del texto, 1 = rectángulo de la pantalla del teléfono.
  const m = prog(frame, morphStart + 6, morphEnd - morphStart - 6, inOutQuart);
  const ring = prog(frame, morphStart, 7, outExpo); // dibujo del contorno
  const textFade = 1 - prog(frame, morphStart + 8, 8);
  // Píldora alrededor de "ZH?": centro (540, 930), 620 x 300. Pantalla: PHONE.screen.
  const pw = tween(m, 0, 1, 620, PHONE.screen.w, inOutQuart);
  const ph = tween(m, 0, 1, 300, PHONE.screen.h, inOutQuart);
  const px = tween(m, 0, 1, 540 - 310, PHONE.screen.x, inOutQuart);
  const py = tween(m, 0, 1, 930 - 150, PHONE.screen.y, inOutQuart);
  const pr = tween(m, 0, 1, 150, PHONE.screen.r, inOutQuart);
  const fillA = prog(frame, morphStart + 6, 8);
  return (
    <AbsoluteFill>
      {/* Texto */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', opacity: textFade}}>
        <BlurIn at={tQue - 6} dy={10}>
          <div style={{display: 'inline-block', position: 'relative'}}>
            <div style={{fontFamily: fonts.sans, fontWeight: 400, fontSize: 96, letterSpacing: '-0.01em', color: ink.text, lineHeight: 1}}>
              <span style={{opacity: interpolate(frame, [tQue - 6, tQue + 2], [0, 1], clamp)}}>qué </span>
              <span style={{opacity: interpolate(frame, [tEs - 5, tEs + 3], [0, 1], clamp)}}>es</span>
            </div>
            {/* Línea fina que se dibuja bajo "qué es" */}
            <div style={{position: 'absolute', left: 0, bottom: -10, height: 2, width: `${prog(frame, tEs, 12) * 100}%`, background: accent.strong, opacity: 0.9}} />
          </div>
        </BlurIn>
        <div style={{marginTop: 14, lineHeight: 0.95}}>
          <Moving x={(f) => keyframes(f, [[tZH - 8, -140], [tZH + 6, 0]], outExpo)} y={() => 0} opacity={(f) => prog(f, tZH - 8, 6)} style={{position: 'relative'}}>
            <div style={{fontFamily: fonts.display, fontWeight: 700, fontSize: 250, letterSpacing: '-0.045em', color: ink.text, display: 'inline-block', whiteSpace: 'nowrap'}}>
              ZH
              <span
                style={{
                  color: accent.text,
                  display: 'inline-block',
                  marginLeft: 6,
                  opacity: interpolate(frame, [tDev + 6, tDev + 10], [0, 1], clamp),
                  transform: `scale(${tween(frame, tDev + 6, tDev + 16, 1.9, 1, outExpo)}) rotate(${tween(frame, tDev + 6, tDev + 16, -18, 0, outExpo)}deg)`,
                  transformOrigin: 'center 70%',
                }}
              >
                ?
              </span>
            </div>
          </Moving>
        </div>
        <BlurIn at={tDev - 4} dy={12}>
          <div style={{fontFamily: fonts.sans, fontWeight: 500, fontSize: 56, letterSpacing: '0.01em', color: ink.text2, marginTop: 150}}>development</div>
        </BlurIn>
      </div>

      {/* Píldora → pantalla */}
      {frame >= morphStart ? (
        <div
          style={{
            position: 'absolute',
            left: px,
            top: py,
            width: pw,
            height: ph,
            borderRadius: pr,
            boxSizing: 'border-box',
            border: `2px solid ${accent.strong}`,
            background: `rgba(10, 13, 19, ${fillA})`,
            boxShadow: `0 0 ${40 * (1 - m)}px rgba(48,107,255,${0.35 * (1 - m)}), 0 40px 100px rgba(0,0,0,${0.5 * m})`,
            clipPath: `inset(0 ${(1 - ring) * 100}% 0 0 round ${pr}px)`,
            opacity: 1,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
