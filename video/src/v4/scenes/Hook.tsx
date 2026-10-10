import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Moving} from '../fx/MotionBlur';
import {clamp, inQuart, outBack, prog} from '../fx/ease';
import {accent, fonts, ink} from '../tokens';
import {beat, beatEnd, scenes} from '../timeline';
import type {SfxCue} from '../sound';

// Escena 1 · gancho. La pregunta se ESCRIBE en pantalla, letra a letra, como en una consola: una línea chica en mono
// ("~/tu-empresa $") y debajo, en display grande, "¿qué hacemos en" / "ZH" / "Development?" con un cursor de bloque azul (el
// mismo azul del logo) que parpadea. Al terminar, todo el bloque sale hacia arriba con latigazo y entra el día.
// Regla de la escena: nada aparece ni cambia en seco. Cada letra nace con fundido + desenfoque, el cursor nunca conmuta
// (su opacidad es continua) y al cambiar de línea se funde entre las dos en vez de teletransportarse.
const sc = scenes.hook;
const L = sc.from;
type W = {text: string; from: number; to: number};
const lines: W[][] = [
  [
    {text: '¿qué', from: beat('hook', 'Qué') - L - 6, to: beatEnd('hook', 'Qué') - L},
    {text: 'hacemos', from: beat('hook', 'hacemos') - L - 2, to: beatEnd('hook', 'hacemos') - L},
    {text: 'en', from: beat('hook', 'en') - L - 2, to: beatEnd('hook', 'en') - L},
  ],
  [{text: 'ZH', from: beat('hook', 'ZH') - L - 4, to: beatEnd('hook', 'ZH') - L - 6}],
  [{text: 'Development?', from: beat('hook', 'Development') - L - 4, to: beatEnd('hook', 'Development') - L - 2}],
];
const words = lines.flat();
const tOut = Math.max(sc.dur - 12, beatEnd('hook', 'Development') - L + 1); // latigazo de salida justo después de la última palabra (el día entra desde abajo)
export const END = sc.dur + 10;

// Carácter a carácter. charFrame() es LA regla de tiempo de la escena: frame en que nace la letra `ci` de la palabra `w`
// (las n letras se reparten entre from y to; la letra k nace al cruzar la mitad de su tramo). De aquí salen las letras,
// el cursor y los ticks de sonido, así nunca se desincronizan.
const chars = (w: W) => [...w.text];
const charFrame = (w: W, ci: number) => {
  const n = chars(w).length;
  return Math.ceil(w.from + ((ci + 0.5) / n) * Math.max(1, w.to - w.from));
};
// Cuántas letras de una palabra se ven (ya nacieron) en el frame f.
const typed = (f: number, w: W) => chars(w).filter((_, ci) => charFrame(w, ci) <= f).length;
// Frames de tecla de toda la escena, en orden.
const charFrames = words.flatMap((w) => chars(w).map((_, ci) => charFrame(w, ci))).sort((a, b) => a - b);
// Primer frame con cursor en cada línea (nace su primera letra); la línea 0 lo tiene desde el arranque.
const lineAt = lines.map((ws, li) => (li === 0 ? 0 : charFrame(ws[0], 0)));

export const sfxCues: SfxCue[] = [
  ...charFrames.filter((_, i) => i % 2 === 0).map((f) => ({name: 'tick' as const, at: L + f, gain: 0.3})),
  {name: 'whoosh-hard', at: L + tOut, gain: 0.8},
];

// Parpadeo del cursor como opacidad continua (ciclo de 16 frames anclado a la última letra): 5 fijo → baja en 3 hasta
// 0.12 → 5 tenue → sube en 3. Empieza y termina en 1, así el ciclo empalma consigo mismo y con el estado "tipeando".
const softQuad = Easing.inOut(Easing.quad);
const blink = (k: number) => interpolate(k % 16, [0, 5, 8, 13, 16], [1, 1, 0.12, 0.12, 1], {...clamp, easing: softQuad});

const Caret: React.FC<{h: number; opacity: number; scaleY: number}> = ({h, opacity, scaleY}) => (
  <span
    style={{
      display: 'inline-block',
      width: Math.round(h * 0.17),
      height: h,
      marginLeft: 12,
      verticalAlign: '-6%',
      background: accent.strong,
      boxShadow: `0 0 24px ${accent.glow}`,
      borderRadius: 3,
      opacity,
      transform: `scaleY(${scaleY.toFixed(3)})`,
      transformOrigin: 'bottom',
    }}
  />
);

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const out = prog(frame, tOut, 8, inQuart);
  const lastWord = [...words].reverse().find((w) => typed(frame, w) > 0);
  const caretLine = lastWord ? lines.findIndex((l) => l.includes(lastWord)) : 0;
  const typing = lastWord ? typed(frame, lastWord) < chars(lastWord).length : false;
  // Opacidad del cursor, nunca un booleano: mientras se tipea una palabra queda encendido; al nacer su última letra el
  // parpadeo arranca anclado a ese frame y, si viene otra letra, se vuelve a encender con rampa en los 4 frames previos
  // (no salta de 0.12 a 1 en seco). Antes de la primera letra también queda encendido.
  const lastKey = [...charFrames].reverse().find((k) => k <= frame);
  const nextKey = charFrames.find((k) => k > frame);
  const wake = nextKey === undefined ? 0 : prog(frame, nextKey - 4, 4, softQuad);
  const caretOp = typing || lastKey === undefined ? 1 : Math.max(blink(frame - lastKey), wake);
  const prompt = prog(frame, 0, 8);
  const sizes = [118, 230, 118];
  // Cada letra entra en su frame de tecla con fundido + desenfoque de 3 frames (ya al 56 % en el frame en que nace, así
  // el cursor avanza y el tick suena con la letra). Spans sin transform ni inline-block: el display conserva el kerning.
  const render = (ws: W[]) =>
    ws.map((w, i) => (
      <span key={w.text}>
        {chars(w).map((ch, ci) => {
          const p = prog(frame, charFrame(w, ci) - 1, 3, Easing.out(Easing.quad));
          if (p <= 0) return null;
          const b = (1 - p) * 6;
          return (
            <span key={ci} style={{opacity: p, filter: b > 0.3 ? `blur(${b.toFixed(2)}px)` : undefined}}>
              {ch}
            </span>
          );
        })}
        {i < ws.length - 1 && typed(frame, w) === chars(w).length ? ' ' : ''}
      </span>
    ));
  return (
    <AbsoluteFill style={{zIndex: 5}}>
      <Moving x={() => 0} y={() => -1400 * out} opacity={() => 1 - out} extraBlur={() => out * 10} blur={0.3}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}}>
          <div style={{position: 'absolute', left: 90, top: 640, width: 940}}>
            <div style={{fontFamily: fonts.mono, fontSize: 32, letterSpacing: '0.06em', color: ink.text3, opacity: prompt, marginBottom: 30, whiteSpace: 'nowrap'}}>
              ~/tu-empresa <span style={{color: accent.text}}>$</span>
            </div>
            {lines.map((ws, li) => {
              // Cambio de línea sin teletransporte: durante 4 frames el cursor viejo se apaga (y se encoge hacia su base)
              // mientras el nuevo nace con fundido y un pequeño resorte en scaleY desde abajo. Nunca hay un frame sin cursor.
              const cur = caretLine === li;
              const leaving = li === caretLine - 1;
              const fade = cur ? prog(frame, lineAt[li], 4) : leaving ? 1 - prog(frame, lineAt[li + 1], 4) : 0;
              const scaleY = cur ? 0.7 + 0.3 * prog(frame, lineAt[li], 5, outBack) : 1 - 0.3 * (1 - fade);
              return (
                <div
                  key={li}
                  style={{
                    fontFamily: fonts.display,
                    fontWeight: li === 1 ? 700 : 600,
                    fontSize: sizes[li],
                    lineHeight: 1.0,
                    letterSpacing: li === 1 ? '-0.045em' : '-0.03em',
                    color: ink.text,
                    whiteSpace: 'nowrap',
                    marginTop: li === 0 ? 0 : li === 1 ? 10 : 14,
                    minHeight: sizes[li],
                  }}
                >
                  {render(ws)}
                  {fade > 0 ? <Caret h={Math.round(sizes[li] * 0.82)} opacity={caretOp * fade} scaleY={scaleY} /> : null}
                </div>
              );
            })}
          </div>
        </div>
      </Moving>
    </AbsoluteFill>
  );
};
