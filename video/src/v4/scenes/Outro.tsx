import React from 'react';
import {AbsoluteFill, Easing, Img, staticFile, useCurrentFrame} from 'remotion';
import {BlurIn, Pop, Typewriter} from '../fx/text';
import {Moving} from '../fx/MotionBlur';
import {inOutQuart, inQuart, keyframes, outQuart, prog} from '../fx/ease';
import {LogoDraw} from '../ui/LogoDraw';
import {accent, fonts, ink, shadow} from '../tokens';
import {beat, scenes, wordsOf} from '../timeline';
import type {SfxCue} from '../sound';

// Escena 9 · cierre. El teléfono (escena anterior) se encogió a un punto; el punto se vuelve el bloque azul del
// logo, el monograma se dibuja, aparece "ZH Development", la frase palabra por palabra, el botón con un cursor
// que hace clic, el dominio y el equipo. Termina en "¿qué esperas?" con un fundido corto a negro.
const sc = scenes.outro;
const L = sc.from - 8;
const loc = (a: number) => a - L;
const tDot = 0;
const tDraw = 10;
const tFill = 30;
const tName = loc(beat('outro', 'Development')) - 4;
const tagWords = wordsOf('outro')
  .filter((w) => w.from >= beat('outro', 'software'))
  .filter((w) => w.from < beat('outro', 'Agenda'))
  .map((w) => ({text: w.text.replace(/[.:]$/, ''), at: loc(w.from) - 2, bold: /conecta|operación/i.test(w.text)}));
const tCta = loc(beat('outro', 'Agenda')) - 6;
const tClick = loc(beat('outro', 'minutos')) + 4;
const tLink = loc(beat('outro', 'minutos')) + 8; // el link aparece como respuesta al toque
const tWhy = loc(beat('outro', 'Qué')) - 3; // "¿qué esperas?"
const tTeam = tClick + 6; // el equipo entra tras el clic, durante "minutos"
const tEnd = loc(sc.to); // fin del reel: termina en "¿qué esperas?" con un fundido corto a negro (sin tarjeta de Instagram)

export const sfxCues: SfxCue[] = [
  {name: 'logo', at: L + tDraw, gain: 0.9},
  {name: 'whoosh-soft', at: L + tName, gain: 0.5},
  {name: 'pop', at: L + tCta, gain: 0.7},
  {name: 'click', at: L + tClick, gain: 0.9},
];

const LOGO_W = 420;
const LOGO_X = (1080 - LOGO_W) / 2;
const LOGO_Y = 500;

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = prog(frame, tDraw, 22, inOutQuart);
  const fill = prog(frame, tFill, 12);
  const accentIn = prog(frame, tDot + 10, 8, inOutQuart); // el bloque nace desde cero con arranque suave, cuando la tarjeta ya es un punto
  const glow = prog(frame, tFill, 30);
  const dim = prog(frame, tEnd - 10, 10, inOutQuart); // fundido final a negro (el reel vuelve a empezar en negro)
  // Clic: la presión reparte el recorrido en 5 frames y vuelve en 8, con easing simétrico (nada de 80 % en un frame).
  const press = prog(frame, tClick, 5, Easing.inOut(Easing.quad)) * (1 - prog(frame, tClick + 6, 8, Easing.inOut(Easing.quad)));
  const land = prog(frame, tClick - 4, 4, Easing.inOut(Easing.quad)); // el dedo aterriza sobre el botón en los 4 frames previos al clic
  const pressed = press > 0.2;
  const ctaPress = 1 - 0.1 * press;
  return (
    <AbsoluteFill>
      {/* Push-in continuo muy leve: la pantalla nunca se congela del todo */}
      <div style={{position: 'absolute', inset: 0, opacity: 1 - dim, transform: `scale(${(1 + 0.035 * Math.min(1, Math.max(0, frame / tEnd))).toFixed(4)})`, transformOrigin: '50% 42%'}}>
        {/* Punto → bloque azul del logo (el bloque está en (630,110) del viewBox 1000 → en px del lienzo) */}
        <div style={{position: 'absolute', left: LOGO_X, top: LOGO_Y}}>
          <LogoDraw width={LOGO_W} draw={draw} fill={fill} accentIn={accentIn} glow={glow * 0.8 * (0.8 + 0.2 * Math.sin(frame / 9))} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: LOGO_Y + 300, textAlign: 'center'}}>
          <BlurIn at={tName} dy={16}>
            <div style={{fontFamily: fonts.display, fontWeight: 700, fontSize: 84, letterSpacing: '-0.03em', color: ink.text}}>
              ZH <span style={{color: accent.text}}>Development</span>
            </div>
          </BlurIn>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: LOGO_Y + 420, display: 'flex', justifyContent: 'center'}}>
          <Typewriter words={tagWords} size={44} weight={400} boldWeight={700} style={{textAlign: 'center', maxWidth: 900}} />
        </div>
        {/* CTA + cursor */}
        <div style={{position: 'absolute', left: 0, right: 0, top: LOGO_Y + 540, display: 'flex', justifyContent: 'center'}}>
          <Pop at={tCta} from={0.7}>
            <div
              style={{
                padding: '24px 46px',
                borderRadius: 999,
                background: accent.button,
                color: '#fff',
                fontFamily: fonts.sans,
                fontWeight: 600,
                fontSize: 40,
                boxShadow: shadow.glow(accent.glow, 46 - 26 * press),
                transform: `scale(${ctaPress})`,
              }}
            >
              Agenda tu llamada de 30 min →
            </div>
          </Pop>
        </div>
        {/* Toque (dedo) sobre el botón: onda que se expande + punto; no hay mouse en un celular */}
        {frame >= tClick - 4 && frame < tClick + 18 ? (
          <div style={{position: 'absolute', left: 540 + 150, top: LOGO_Y + 540 + 44, width: 0, height: 0, pointerEvents: 'none'}}>
            <div style={{position: 'absolute', left: -70, top: -70, width: 140, height: 140, borderRadius: 70, border: `3px solid ${accent.text}`, opacity: 0.7 * prog(frame, tClick - 1, 4, Easing.inOut(Easing.quad)) * (1 - prog(frame, tClick, 16)), transform: `scale(${0.35 + 1.1 * prog(frame, tClick, 16, outQuart)})`}} />
            <div style={{position: 'absolute', left: -16, top: -16, width: 32, height: 32, borderRadius: 16, background: '#FFFFFF', opacity: 0.9 * land * (1 - prog(frame, tClick + 2, 8)), transform: `scale(${(1.5 - 0.5 * land) * (1 - 0.4 * prog(frame, tClick, 6, Easing.inOut(Easing.quad)))})`, boxShadow: '0 0 24px rgba(255,255,255,0.6)'}} />
          </div>
        ) : null}
        {/* Remate bajo el botón: más chico que el botón para no competir con él, con aire arriba y abajo */}
        <div style={{position: 'absolute', left: 0, right: 0, top: LOGO_Y + 690, textAlign: 'center'}}>
          <Pop at={tWhy} from={0.6} config={{damping: 14, stiffness: 180}}>
            <div style={{fontFamily: fonts.display, fontWeight: 700, fontSize: 44, letterSpacing: '-0.03em', color: ink.text, lineHeight: 1}}>¿qué esperas?</div>
          </Pop>
        </div>
        <BlurIn at={tLink} style={{position: 'absolute', left: 0, right: 0, top: LOGO_Y + 770, textAlign: 'center', fontFamily: fonts.sans, fontSize: 32, color: ink.text2}}>
          zhdevelopment.cl · link en la bio
        </BlurIn>
        {/* Equipo */}
        <div style={{position: 'absolute', left: 0, right: 0, top: LOGO_Y + 830, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
          <div style={{display: 'flex'}}>
            {['people/lorenzo.jpg', 'people/nico.jpg'].map((p, i) => (
              <Pop key={p} at={tTeam + i * 5} from={0.5}>
                <Img src={staticFile(p)} style={{width: 80, height: 80, borderRadius: 999, objectFit: 'cover', border: '3px solid #0B0E13', marginLeft: i ? -18 : 0, boxShadow: '0 10px 30px rgba(0,0,0,0.6)'}} />
              </Pop>
            ))}
          </div>
          <BlurIn at={tTeam + 10}>
            <div style={{fontFamily: fonts.sans, fontSize: 30, color: ink.text2}}>con el equipo de ZH</div>
          </BlurIn>
        </div>
      </div>

    </AbsoluteFill>
  );
};
