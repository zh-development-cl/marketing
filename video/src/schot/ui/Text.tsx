import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {captionsOf, order, SceneKey} from '../timeline';

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ios = Easing.bezier(0.32, 0.72, 0, 1);
const pr = (f: number, a: number, d: number, e = ios) => interpolate(f, [a, a + Math.max(1, d)], [0, 1], {...clampOpt, easing: e});

const SANS = '"Barlow", system-ui, sans-serif';
export const GRAD_TEXT = 'linear-gradient(100deg, #C38BFF 0%, #FF4DA6 100%)';

// Texto con *palabras* en degradé lila → rosa (el «IA» de tibIA sobre oscuro).
export const Marked: React.FC<{text: string}> = ({text}) => (
  <>
    {text.split(/(\*[^*]+\*)/g).map((part, i) =>
      part.startsWith('*') ? (
        <span key={i} style={{backgroundImage: GRAD_TEXT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingRight: 4}}>
          {part.slice(1, -1)}
        </span>
      ) : (
        <span key={i}>{part}</span>
      ),
    )}
  </>
);

// Píldora de capítulo («2 · TU AGENDA») + titular de una o dos líneas. Entra con desenfoque y subida escalonada;
// sale hacia arriba con desenfoque. `lines` admite *marcas* para la palabra en degradé.
export const Headline: React.FC<{
  n?: string;
  label?: string;
  icon?: React.ReactNode;
  lines: string[];
  at: number;
  out?: number;
  top?: number;
  size?: number;
}> = ({n, label, icon, lines, at, out, top = 132, size = 86}) => {
  const f = useCurrentFrame();
  const o = out === undefined ? 0 : pr(f, out, 10, Easing.in(Easing.cubic));
  if (f < at - 1 || o >= 1) return null;
  const item = (i: number) => {
    const p = pr(f, at + i * 3, 14);
    const b = (1 - p) * 12 + o * 10;
    return {
      opacity: p * (1 - o),
      transform: `translateY(${((1 - p) * 26 - o * 22).toFixed(1)}px)`,
      filter: b > 0.3 ? `blur(${b.toFixed(1)}px)` : undefined,
    } as React.CSSProperties;
  };
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top, zIndex: 50}}>
      {label ? (
        <div style={{...item(0), display: 'inline-flex', alignItems: 'center', gap: 14, padding: '10px 22px 10px 12px', borderRadius: 999, background: 'rgba(26,0,51,.42)', boxShadow: 'inset 0 0 0 1.5px rgba(195,174,242,.35)', backdropFilter: 'blur(10px)'}}>
          {n ? (
            <span style={{width: 40, height: 40, borderRadius: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2B0054 0%, #41027A 45%, #A200FF 100%)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.25)', color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 22}}>
              {n}
            </span>
          ) : null}
          {icon ? <span style={{display: 'inline-flex', color: '#C3AEF2'}}>{icon}</span> : null}
          <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 27, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#E9DDFB'}}>{label}</span>
        </div>
      ) : null}
      <div style={{marginTop: label ? 26 : 0}}>
        {lines.map((l, i) => (
          <div key={i} style={{...item(i + 1), fontFamily: SANS, fontWeight: 800, fontSize: size, lineHeight: 1.04, letterSpacing: '-0.012em', color: '#fff', textShadow: '0 4px 30px rgba(26,0,51,.45)'}}>
            <Marked text={l} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Subtítulos de la voz: la frase vigente, palabra por palabra (lo dicho en blanco, lo que viene tenue).
// `hide(f)` permite ocultarlos en tramos con mucho texto propio (p. ej. el cierre).
export const Captions: React.FC<{top?: number; skip?: SceneKey[]; right?: (f: number) => number}> = ({top = 446, skip = [], right}) => {
  const f = useCurrentFrame();
  const ALL = order.filter((k) => !skip.includes(k)).flatMap((k) => captionsOf(k));
  const i = ALL.findIndex((c, k) => f >= c.from - 6 && f < (ALL[k + 1]?.from ?? Infinity) - 6 && f < c.to + 20);
  if (i < 0) return null;
  const c = ALL[i];
  const inP = pr(f, c.from - 6, 8);
  const nextFrom = ALL[i + 1]?.from ?? Infinity;
  // La salida termina 6 frames antes de que entre la siguiente frase: nunca se corta a medio camino.
  const outP = pr(f, Math.min(c.to + 12, nextFrom - 14), 8, Easing.in(Easing.cubic));
  const R = right ? Math.max(right(c.from - 6), right(c.from + 4), right(c.to), right(c.to + 12)) : 80;
  return (
    // El ancho y el tamaño se deciden una vez por frase (nunca cambian a mitad de frase).
    <div style={{position: 'absolute', left: 80, right: R, top, zIndex: 50, opacity: inP * (1 - outP), transform: `translateY(${((1 - inP) * 10).toFixed(1)}px)`}}>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: R > 200 ? 35 : 40, lineHeight: 1.22, color: '#fff', textShadow: '0 2px 16px rgba(26,0,51,.6)'}}>
        {c.words.map((w, k) => {
          const lit = pr(f, w.from - 2, 5, Easing.out(Easing.quad));
          return (
            <span key={k} style={{opacity: 0.4 + 0.6 * lit}}>
              {w.text}
              {k < c.words.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
};
