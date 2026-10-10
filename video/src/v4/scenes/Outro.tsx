import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {BlurIn, Pop, Typewriter} from '../fx/text';
import {Moving} from '../fx/MotionBlur';
import {clamp, inOutQuart, inQuart, keyframes, outExpo, outQuart, prog} from '../fx/ease';
import {LogoDraw} from '../ui/LogoDraw';
import {Cursor} from '../ui/Cursor';
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
const tLink = loc(beat('outro', 'Link')) - 2;
const tTeam = tLink + 14;
const tEnd = loc(sc.to) - 50; // atenuar y mostrar ícono de Instagram

export const sfxCues: SfxCue[] = [
  {name: 'logo', at: L + tDraw, gain: 0.9},
  {name: 'whoosh-soft', at: L + tName, gain: 0.5},
  {name: 'pop', at: L + tCta, gain: 0.7},
  {name: 'click', at: L + tClick, gain: 0.9},
  {name: 'chime', at: L + tEnd + 6, gain: 0.6},
];

const LOGO_W = 420;
const LOGO_X = (1080 - LOGO_W) / 2;
const LOGO_Y = 560;

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = prog(frame, tDraw, 22, inOutQuart);
  const fill = prog(frame, tFill, 12);
  const accentIn = prog(frame, tDot + 6, 10, outExpo);
  const glow = prog(frame, tFill, 30);
  const dim = prog(frame, tEnd, 14);
  const ctaPress = frame >= tClick && frame < tClick + 5 ? 0.94 : 1;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, opacity: 1 - dim * 0.85, filter: dim > 0 ? `blur(${dim * 6}px)` : undefined}}>
        {/* Punto → bloque azul del logo (el bloque está en (630,110) del viewBox 1000 → en px del lienzo) */}
        <div style={{position: 'absolute', left: LOGO_X, top: LOGO_Y}}>
          <LogoDraw width={LOGO_W} draw={draw} fill={fill} accentIn={accentIn} glow={glow * 0.8} />
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
                boxShadow: shadow.glow(accent.glow, 46),
                transform: `scale(${ctaPress})`,
              }}
            >
              Agenda tu llamada de 30 min →
            </div>
          </Pop>
        </div>
        {frame >= tCta + 6 ? (
          <Moving
            x={(f) => keyframes(f, [[tCta + 6, 980], [tClick - 2, 720], [tClick + 20, 735]], outQuart)}
            y={(f) => keyframes(f, [[tCta + 6, 1500], [tClick - 2, LOGO_Y + 600], [tClick + 20, LOGO_Y + 610]], outQuart)}
            opacity={(f) => prog(f, tCta + 6, 6)}
            blur={0.2}
          >
            <Cursor pressed={frame >= tClick && frame < tClick + 6} />
          </Moving>
        ) : null}
        <BlurIn at={tLink} style={{position: 'absolute', left: 0, right: 0, top: LOGO_Y + 690, textAlign: 'center', fontFamily: fonts.sans, fontSize: 32, color: ink.text2}}>
          zhdevelopment.cl · link en la bio
        </BlurIn>
        {/* Equipo */}
        <div style={{position: 'absolute', left: 0, right: 0, top: LOGO_Y + 770, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
          <div style={{display: 'flex'}}>
            {['people/lorenzo.jpg', 'people/nico.jpg'].map((p, i) => (
              <Pop key={p} at={tTeam + i * 5} from={0.5}>
                <Img src={staticFile(p)} style={{width: 92, height: 92, borderRadius: 999, objectFit: 'cover', border: '3px solid #0B0E13', marginLeft: i ? -18 : 0, boxShadow: '0 10px 30px rgba(0,0,0,0.6)'}} />
              </Pop>
            ))}
          </div>
          <BlurIn at={tTeam + 10}>
            <div style={{fontFamily: fonts.sans, fontSize: 26, color: ink.text3}}>con el equipo de ZH</div>
          </BlurIn>
        </div>
      </div>

      {/* Cierre: ícono de Instagram y usuario */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 820, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: prog(frame, tEnd + 4, 10)}}>
        <Pop at={tEnd + 4} from={0.5}>
          <InstagramGlyph size={150} color={interpolate(frame, [tEnd + 16, tEnd + 30], [0, 1], clamp)} />
        </Pop>
        <BlurIn at={tEnd + 10}>
          <div style={{fontFamily: fonts.mono, fontWeight: 500, fontSize: 30, letterSpacing: '0.08em', color: ink.text}}>{watermark.handle}</div>
        </BlurIn>
      </div>
    </AbsoluteFill>
  );
};
