import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
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

// Píldora de capítulo («2 · AGENDA») + titular de una o dos líneas, cinético como en el reel de ZH: la píldora salta
// con resorte y cada palabra sube desde detrás de su línea (máscara) con un leve giro, una tras otra; la palabra
// *marcada* va en degradé con un brillo que la cruza. Sale palabra por palabra hacia arriba con desenfoque.
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
  const {fps} = useVideoConfig();
  if (f < at - 1 || (out !== undefined && f > out + 16)) return null;
  const pill = spring({frame: f - at, fps, config: {damping: 12, stiffness: 170, mass: 0.8}});
  const pillOut = out === undefined ? 0 : pr(f, out, 8, Easing.in(Easing.cubic));
  // Palabras con su línea y si van marcadas.
  let idx = 0;
  const rows = lines.map((l) =>
    l
      .split(/(\*[^*]+\*)/g)
      .filter(Boolean)
      .flatMap((part) => {
        const marked = part.startsWith('*');
        const text = marked ? part.slice(1, -1) : part;
        return text
          .split(/(\s+)/)
          .filter((w) => w.length)
          .map((w) => ({w, marked, space: /^\s+$/.test(w), i: /^\s+$/.test(w) ? -1 : idx++}));
      }),
  );
  const total = idx;
  const t0 = at + (label ? 4 : 0);
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top, zIndex: 50}}>
      {label ? (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14,
            padding: '10px 22px 10px 12px',
            borderRadius: 999,
            background: 'rgba(26,0,51,.42)',
            boxShadow: 'inset 0 0 0 1.5px rgba(195,174,242,.35)',
            backdropFilter: 'blur(10px)',
            opacity: Math.min(1, pill * 2) * (1 - pillOut),
            transform: `translateY(${(-pillOut * 30).toFixed(1)}px) scale(${(0.6 + 0.4 * pill).toFixed(4)})`,
            transformOrigin: '0 50%',
          }}
        >
          {n ? (
            <span style={{width: 40, height: 40, borderRadius: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2B0054 0%, #41027A 45%, #A200FF 100%)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.25)', color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 22}}>
              {n}
            </span>
          ) : null}
          {icon ? <span style={{display: 'inline-flex', color: '#C3AEF2'}}>{icon}</span> : null}
          <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 27, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#E9DDFB'}}>{label}</span>
        </div>
      ) : null}
      <div style={{marginTop: label ? 22 : 0}}>
        {rows.map((row, li) => (
          // La máscara de cada línea deja aire para los rasgos descendentes y para el resorte.
          <div key={li} style={{overflow: 'hidden', padding: '0.06em 0.2em 0.14em 0.06em', margin: '-0.06em -0.2em -0.14em -0.06em', fontFamily: SANS, fontWeight: 800, fontSize: size, lineHeight: 1.04, letterSpacing: '-0.012em', color: '#fff', whiteSpace: 'pre'}}>
            {row.map((w, k) => {
              if (w.space) return <span key={k}>{w.w}</span>;
              const p = spring({frame: f - (t0 + w.i * 3), fps, config: {damping: 13, stiffness: 160, mass: 0.85}});
              const o = out === undefined ? 0 : pr(f, out + (total - 1 - w.i) * 1, 9, Easing.in(Easing.cubic));
              const b = Math.max(0, 1 - p) * 8 + o * 12;
              const shimmer = w.marked ? pr(f, t0 + w.i * 3 + 10, 22, Easing.inOut(Easing.quad)) : 0;
              return (
                <span
                  key={k}
                  style={{
                    display: 'inline-block',
                    transform: `translateY(${((1 - p) * 105 - o * 60).toFixed(2)}%) rotate(${((1 - p) * 7).toFixed(2)}deg)`,
                    transformOrigin: '0 100%',
                    opacity: Math.min(1, p * 2) * (1 - o),
                    filter: b > 0.4 ? `blur(${b.toFixed(1)}px)` : undefined,
                    textShadow: w.marked ? undefined : '0 4px 30px rgba(26,0,51,.45)',
                    ...(w.marked
                      ? {
                          backgroundImage: `linear-gradient(100deg, rgba(255,255,255,0) ${(shimmer * 140 - 30).toFixed(1)}%, rgba(255,255,255,.85) ${(shimmer * 140 - 15).toFixed(1)}%, rgba(255,255,255,0) ${(shimmer * 140).toFixed(1)}%), ${GRAD_TEXT}`,
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          color: 'transparent',
                          paddingRight: 4,
                        }
                      : {}),
                  }}
                >
                  {w.w}
                </span>
              );
            })}
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
