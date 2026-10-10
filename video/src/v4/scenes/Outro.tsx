import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {BlurIn, Pop, Typewriter} from '../fx/text';
import {Moving} from '../fx/MotionBlur';
import {clamp, inOutQuart, inQuart, keyframes, outExpo, outQuart, prog} from '../fx/ease';
import {LogoDraw} from '../ui/LogoDraw';
import {InstagramGlyph} from '../ui/Watermark';
import {accent, fonts, ink, shadow, watermark} from '../tokens';
import {beat, scenes, wordsOf} from '../timeline';
import type {SfxCue} from '../sound';

// Escena 9 · cierre. El teléfono (escena anterior) se encogió a un punto; el punto se vuelve el bloque azul del
// logo, el monograma se dibuja, aparece "ZH Development", la frase palabra por palabra, el botón con un cursor
// que hace clic, el dominio y el equipo. Al final todo se atenúa y queda el ícono de Instagram con el usuario.
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
const tEnd = loc(sc.to) - 64; // atenuar y mostrar ícono de Instagram (0,4 s de silencio tras la música, 1,9 s de ícono)

export const sfxCues: SfxCue[] = [
  {name: 'logo', at: L + tDraw, gain: 0.9},
  {name: 'whoosh-soft', at: L + tName, gain: 0.5},
  {name: 'pop', at: L + tCta, gain: 0.7},
  {name: 'click', at: L + tClick, gain: 0.9},
  // Cierre: golpe grave (sting) sobre el ícono de Instagram, con un brillo encima; la música ya terminó.
  {name: 'sting', at: L + tEnd + 6, gain: 1.0},
  {name: 'chime', at: L + tEnd + 9, gain: 0.8}, // brillo 3 frames después del golpe
];

const LOGO_W = 420;
const LOGO_X = (1080 - LOGO_W) / 2;
const LOGO_Y = 560;

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = prog(frame, tDraw, 22, inOutQuart);
  const fill = prog(frame, tFill, 12);
  const accentIn = prog(frame, tDot + 10, 8, outExpo); // el bloque nace cuando la tarjeta ya es un punto
  const glow = prog(frame, tFill, 30);
  const dim = prog(frame, tEnd, 14);
  const press = prog(frame, tClick, 3, outQuart) * (1 - prog(frame, tClick + 5, 7, outQuart)); // clic con easing
  const pressed = press > 0.2;
  const ctaPress = 1 - 0.1 * press;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, opacity: 1 - dim * 0.95, filter: dim > 0 ? `blur(${dim * 12}px)` : undefined}}>
        {/* Punto → bloque azul del logo (el bloque está en (630,110) del viewBox 1000 → en px del lienzo) */}
        <div style={{position: 'absolute', left: LOGO_X, top: LOGO_Y}}>
          <LogoDraw width={LOGO_W} draw={draw} fill={fill} accentIn={accentIn} glow={glow * 0.8 * (0.92 + 0.08 * Math.sin(frame / 9))} />
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
        <div style={{position: 'absolute', left: 0, right: 0, top: LOGO_Y + 560, display: 'flex', justifyContent: 'center'}}>
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
        {frame >= tClick - 1 && frame < tClick + 18 ? (
          <div style={{position: 'absolute', left: 540 + 150, top: LOGO_Y + 560 + 44, width: 0, height: 0, pointerEvents: 'none'}}>
            <div style={{position: 'absolute', left: -70, top: -70, width: 140, height: 140, borderRadius: 70, border: `3px solid ${accent.text}`, opacity: 0.7 * (1 - prog(frame, tClick, 16)), transform: `scale(${0.35 + 1.1 * prog(frame, tClick, 16, outQuart)})`}} />
            <div style={{position: 'absolute', left: -16, top: -16, width: 32, height: 32, borderRadius: 16, background: '#FFFFFF', opacity: 0.9 * (1 - prog(frame, tClick + 2, 8)), transform: `scale(${1 - 0.4 * prog(frame, tClick, 6)})`, boxShadow: '0 0 24px rgba(255,255,255,0.6)'}} />
          </div>
        ) : null}
        <div style={{position: 'absolute', left: 0, right: 0, top: LOGO_Y + 648, textAlign: 'center'}}>
          <Pop at={tWhy} from={0.6} config={{damping: 11, stiffness: 200}}>
            <div style={{fontFamily: fonts.display, fontWeight: 700, fontSize: 68, letterSpacing: '-0.03em', color: accent.text, lineHeight: 1}}>¿qué esperas?</div>
          </Pop>
        </div>
        <BlurIn at={tLink} style={{position: 'absolute', left: 0, right: 0, top: LOGO_Y + 740, textAlign: 'center', fontFamily: fonts.sans, fontSize: 32, color: ink.text2}}>
          zhdevelopment.cl · link en la bio
        </BlurIn>
        {/* Equipo */}
        <div style={{position: 'absolute', left: 0, right: 0, top: LOGO_Y + 800, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
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

      {/* Cierre: ícono de Instagram y usuario */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 850, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: prog(frame, tEnd + 4, 10)}}>
        <Pop at={tEnd + 4} from={0.5}>
          <InstagramGlyph size={150} color={interpolate(frame, [tEnd + 16, tEnd + 30], [0, 1], clamp)} />
        </Pop>
        <BlurIn at={tEnd + 10}>
          <div style={{fontFamily: fonts.mono, fontWeight: 600, fontSize: 40, letterSpacing: '0.08em', color: ink.text}}>{watermark.handle}</div>
        </BlurIn>
      </div>
    </AbsoluteFill>
  );
};
