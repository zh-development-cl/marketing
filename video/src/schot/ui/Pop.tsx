import React, {createContext, useContext} from 'react';
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Streak} from '../../v4/fx/MotionBlur';
import {Box, PT, toCanvas} from './geometry';
import {Icon, IconName} from './Icon';
import {CamKey, Dim, poseAt, Shake, shakeAt} from './Stage';

// Piezas «que saltan» del video, como en el reel de ZH: contenedores reales que se desprenden de la pantalla del
// teléfono y flotan en grande (Lift), insignias con resorte (Badge), estallidos de partículas (Burst) y contadores
// (Counter). Todo se describe como datos con frames ABSOLUTOS y se dibuja en el lienzo (1080 x 1920), encima del
// teléfono y debajo del titular. Determinista: solo depende del frame.

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
const pr = (f: number, a: number, d: number, e = io) => interpolate(f, [a, a + Math.max(1, d)], [0, 1], {...clampOpt, easing: e});
const SANS = '"Barlow", system-ui, sans-serif';
const hash = (n: number, salt = 0) => {
  const x = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Cámara compartida: la composición la provee para que una pieza sepa dónde está el teléfono en cada frame.
export const CamCtx = createContext<{cam: CamKey[]; shakes: Shake[]}>({cam: [], shakes: []});

// ---------- Lift: un contenedor real que sale de la pantalla ----------
// `to`: centro en el lienzo y escala en px por pt (en el teléfono en reposo 1 pt = 1,5 px). r: giro; rx/ry: 3D.
export type Target = {x: number; y: number; k: number; r?: number; rx?: number; ry?: number};
export type LiftDef = {
  at: number; // se desprende
  out: number; // empieza a salir
  box: Box; // zona de la captura (pt) que se recorta
  view?: Box; // dónde está esa zona en la pantalla en ese momento (página desplazada); por defecto `box`
  src?: string | ((f: number) => string); // captura (relativa a public/) de la que se recorta; puede cambiar por frame
  render?: (f: number, k: number) => React.ReactNode; // contenido propio en vez del recorte (px con k px por pt)
  to: Target;
  moves?: Array<{at: number; to: Target}>; // desplazamientos posteriores (cada uno con su resorte)
  exit?: 'back' | 'pop' | 'up' | 'down' | 'left' | 'right'; // vuelve a su lugar, se encoge o sale volando
  exitDur?: number;
  radius?: number; // pt
  dim?: boolean | number; // deja el hueco oscurecido en la pantalla (número: frame hasta el que dura)
  ring?: boolean; // borde de luz de marca
  scrim?: number; // 0..1: oscurece el resto mientras está afuera
  float?: number; // flotación ociosa (1 por defecto)
  stiffness?: number;
  damping?: number;
  from?: Target; // origen propio cuando no sale del teléfono
  shine?: boolean; // destello que cruza al llegar (por defecto sí)
  z?: number;
};

const lerpT = (a: Target, b: Target, t: number): Target => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  k: a.k + (b.k - a.k) * t,
  r: (a.r ?? 0) + ((b.r ?? 0) - (a.r ?? 0)) * t,
  rx: (a.rx ?? 0) + ((b.rx ?? 0) - (a.rx ?? 0)) * t,
  ry: (a.ry ?? 0) + ((b.ry ?? 0) - (a.ry ?? 0)) * t,
});

const originOf = (d: LiftDef, cam: CamKey[], f: number): Target => {
  if (d.from) return d.from;
  const p = poseAt(cam, f);
  const v = d.view ?? d.box;
  const c = toCanvas(p, v.x + v.w / 2, v.y + v.h / 2);
  return {x: c.x, y: c.y, k: PT * p.s, r: p.r ?? 0, rx: p.rx ?? 0, ry: p.ry ?? 0};
};

// Salidas pausadas (el público tiene 50 a 70 años): nada desaparece en menos de medio segundo.
export const exitDurOf = (d: LiftDef) => d.exitDur ?? (d.exit === 'back' ? 18 : d.exit === 'pop' ? 13 : 15);

type LiftState = Target & {o: number; lift: number; presence: number};

export const liftState = (d: LiftDef, cam: CamKey[], f: number): LiftState | null => {
  const ed = exitDurOf(d);
  if (f < d.at || f > d.out + ed) return null;
  // Resorte suave: llega en ~0,8 s con un rebote leve, sin latigazo.
  const cfg = {damping: d.damping ?? 17, stiffness: d.stiffness ?? 100, mass: 1};
  const o0 = originOf(d, cam, d.at);
  const p = spring({frame: f - d.at, fps: 30, config: cfg});
  let cur = lerpT(o0, d.to, p);
  for (const m of d.moves ?? []) {
    if (f < m.at) break;
    cur = lerpT(cur, m.to, spring({frame: f - m.at, fps: 30, config: cfg}));
  }
  // Flotación ociosa en 3D una vez que llegó.
  const fl = (d.float ?? 1) * pr(f, d.at + 8, 24);
  const t = (f - d.at) / 30;
  const seed = d.at * 0.37;
  cur = {
    ...cur,
    y: cur.y + Math.sin(t * 1.8 + seed) * 6 * fl,
    r: (cur.r ?? 0) + Math.sin(t * 1.4 + seed) * 0.7 * fl,
    rx: (cur.rx ?? 0) + Math.sin(t * 1.7 + seed) * 3 * fl,
    ry: (cur.ry ?? 0) + Math.cos(t * 1.3 + seed) * 4 * fl,
  };
  let o = d.from ? Math.min(1, p * 3) : 1;
  let lift = Math.min(1, Math.max(0, p));
  const presence = Math.min(1, p * 1.4);
  if (f >= d.out) {
    const kind = d.exit ?? 'back';
    if (kind === 'back') {
      const q = pr(f, d.out, ed, Easing.bezier(0.45, 0, 0.2, 1));
      cur = lerpT(cur, originOf(d, cam, d.out + ed), q);
      lift *= 1 - q;
      o *= 1 - pr(f, d.out + ed - 3, 3, Easing.linear);
      return {...cur, o, lift, presence: presence * (1 - q)};
    }
    if (kind === 'pop') {
      const q = pr(f, d.out, ed, Easing.in(Easing.cubic));
      const g = interpolate(q, [0, 0.25, 1], [1, 1.07, 0.15], clampOpt);
      return {...cur, k: cur.k * g, o: o * (1 - pr(f, d.out + ed * 0.45, ed * 0.55, Easing.linear)), lift, presence: presence * (1 - q)};
    }
    const q = pr(f, d.out, ed, Easing.in(Easing.poly(3)));
    const dx = kind === 'left' ? -1400 : kind === 'right' ? 1400 : 0;
    const dy = kind === 'up' ? -1500 : kind === 'down' ? 1500 : 0;
    return {...cur, x: cur.x + dx * q, y: cur.y + dy * q, r: (cur.r ?? 0) + (dx ? Math.sign(dx) * 10 : 0) * q, o, lift, presence: presence * (1 - q)};
  }
  return {...cur, o, lift, presence};
};

const LiftView: React.FC<{d: LiftDef; f: number; cam: CamKey[]; shakes: Shake[]}> = ({d, f, cam, shakes}) => {
  const s = liftState(d, cam, f);
  if (!s || s.o <= 0.001) return null;
  const s1 = liftState(d, cam, f - 1) ?? s;
  // Se dibuja a la escala más grande que alcanza (nítido al llegar) y se reduce con transform.
  const K = Math.max(d.to.k, ...(d.moves ?? []).map((m) => m.to.k));
  const w = d.box.w * K;
  const h = d.box.h * K;
  const sh = shakeAt(shakes, f);
  const sx = Math.min(30, Math.abs(s.x - s1.x) * 0.28 + (Math.abs(s.k - s1.k) / s.k) * 50);
  const sy = Math.min(30, Math.abs(s.y - s1.y) * 0.28 + (Math.abs(s.k - s1.k) / s.k) * 50);
  const src = typeof d.src === 'function' ? d.src(f) : d.src;
  const R = (d.radius ?? 12) * K;
  const shine = d.shine === false ? -1 : pr(f, d.at + 10, 24, Easing.inOut(Easing.quad));
  const L = s.lift;
  const card = (
    <div
      style={{
        position: 'absolute',
        left: s.x + sh.dx - w / 2,
        top: s.y + sh.dy - h / 2,
        width: w,
        height: h,
        transform: `perspective(1800px) rotateX(${(s.rx ?? 0).toFixed(2)}deg) rotateY(${(s.ry ?? 0).toFixed(2)}deg) rotate(${(s.r ?? 0).toFixed(2)}deg) scale(${(s.k / K).toFixed(4)})`,
        opacity: s.o,
        borderRadius: R,
        boxShadow: `0 ${(8 + 46 * L).toFixed(1)}px ${(18 + 80 * L).toFixed(1)}px rgba(14,0,30,${(0.18 + 0.4 * L).toFixed(2)}), 0 0 0 ${(1 / (s.k / K)).toFixed(2)}px rgba(255,255,255,.55)${d.ring ? `, 0 0 0 ${(4 / (s.k / K)).toFixed(1)}px rgba(195,174,242,${(0.55 * L).toFixed(2)}), 0 0 ${(60 * L).toFixed(0)}px rgba(162,0,255,${(0.45 * L).toFixed(2)})` : ''}`,
      }}
    >
      <div style={{position: 'absolute', inset: 0, borderRadius: R, overflow: 'hidden', background: '#F9F6FC'}}>
        {d.render ? d.render(f, K) : src ? <Img src={staticFile(src)} style={{position: 'absolute', left: -d.box.x * K, top: -d.box.y * K, width: 390 * K}} /> : null}
        {shine > 0 && shine < 1 ? (
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(255,255,255,0) 35%, rgba(255,255,255,.55) 50%, rgba(255,255,255,0) 65%)', transform: `translateX(${(-110 + 220 * shine).toFixed(1)}%)`}} />
        ) : null}
      </div>
    </div>
  );
  return Math.max(sx, sy) >= 0.7 ? (
    <Streak sx={sx} sy={sy} style={{position: 'absolute', inset: 0}}>
      {card}
    </Streak>
  ) : (
    card
  );
};

// Huecos oscurecidos en la pantalla mientras su contenido está afuera.
export const liftDims = (lifts: LiftDef[]): Dim[] =>
  lifts
    .filter((d) => d.dim !== false && !d.from)
    .map((d) => ({at: d.at, until: typeof d.dim === 'number' ? d.dim : d.exit === 'back' || d.exit === undefined ? d.out + 3 : d.out, box: d.view ?? d.box, radius: d.radius}));

export const LiftLayer: React.FC<{lifts: LiftDef[]}> = ({lifts}) => {
  const f = useCurrentFrame();
  const {cam, shakes} = useContext(CamCtx);
  const live = lifts.filter((d) => f >= d.at - 1 && f <= d.out + exitDurOf(d) + 1);
  if (!live.length) return null;
  const scrim = Math.max(0, ...live.map((d) => (d.scrim ?? 0) * (liftState(d, cam, f)?.presence ?? 0)));
  return (
    <>
      {scrim > 0.002 ? <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(70% 55% at 50% 58%, rgba(14,0,30,.38), rgba(14,0,30,.72))', opacity: scrim, zIndex: 44}} /> : null}
      {[...live]
        .sort((a, b) => (a.z ?? 0) - (b.z ?? 0) || a.at - b.at)
        .map((d, i) => (
          <div key={`${d.at}-${i}`} style={{position: 'absolute', inset: 0, zIndex: 45}}>
            <LiftView d={d} f={f} cam={cam} shakes={shakes} />
          </div>
        ))}
    </>
  );
};

// ---------- Badge: insignia con resorte ----------
export type BadgeDef = {
  at: number;
  out: number;
  x: number; // centro en el lienzo
  y: number;
  text: string;
  icon?: IconName;
  tone?: 'white' | 'brand' | 'glass';
  size?: number; // tamaño de letra (px)
  r?: number; // giro final (grados)
  strike?: number; // frame en que se tacha (p. ej. «Descargar»)
};

export const BadgeView: React.FC<{d: BadgeDef; f: number}> = ({d, f}) => {
  if (f < d.at || f > d.out + 13) return null;
  const p = spring({frame: f - d.at, fps: 30, config: {damping: 14, stiffness: 120, mass: 0.9}});
  const q = pr(f, d.out, 12, Easing.in(Easing.back(1.3)));
  const size = d.size ?? 40;
  const tone = d.tone ?? 'white';
  const st = d.strike === undefined ? 0 : pr(f, d.strike, 7, Easing.out(Easing.cubic));
  const shake = d.strike === undefined ? 0 : Math.sin((f - d.strike) * 2.6) * 10 * Math.max(0, 1 - (f - d.strike) / 12) * (f >= d.strike ? 1 : 0);
  const bob = Math.sin((f - d.at) / 11) * 4 * pr(f, d.at + 10, 20);
  const scale = (0.25 + 0.75 * p) * (1 - 0.85 * q);
  const bg = tone === 'brand' ? 'linear-gradient(115deg, #5B00B8 0%, #A200FF 48%, #E6007E 100%)' : tone === 'glass' ? 'rgba(26,0,51,.62)' : '#FFFFFF';
  const fg = tone === 'white' ? '#2B0054' : '#FFFFFF';
  const H = size * 2.05;
  return (
    <div style={{position: 'absolute', left: d.x, top: d.y + bob, width: 0, height: 0, zIndex: 47}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(-50%, -50%) translateX(${shake.toFixed(1)}px) rotate(${((d.r ?? 0) + (1 - p) * -14).toFixed(2)}deg) scale(${scale.toFixed(4)})`,
          opacity: Math.min(1, p * 2.5) * (1 - pr(f, d.out + 4, 8, Easing.linear)),
          display: 'flex',
          alignItems: 'center',
          gap: size * 0.4,
          height: H,
          padding: `0 ${size * 0.75}px 0 ${d.icon ? size * 0.28 : size * 0.75}px`,
          borderRadius: 999,
          background: bg,
          backdropFilter: tone === 'glass' ? 'blur(14px)' : undefined,
          boxShadow: `0 18px 44px rgba(14,0,30,.42), inset 0 0 0 ${tone === 'white' ? 0 : 2}px rgba(255,255,255,.28), 0 0 0 6px rgba(195,174,242,${tone === 'white' ? 0.28 : 0.18})`,
          whiteSpace: 'nowrap',
        }}
      >
        {d.icon ? (
          <span style={{width: H - size * 0.5, height: H - size * 0.5, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: tone === 'white' ? 'linear-gradient(135deg, #8A00E6, #E6007E)' : 'rgba(255,255,255,.2)'}}>
            <Icon name={d.icon} size={size * 0.95} color="#fff" stroke={2.4} />
          </span>
        ) : null}
        <span style={{position: 'relative', fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: '-0.005em', color: fg}}>
          {d.text}
          {d.strike !== undefined ? (
            <span style={{position: 'absolute', left: -6, right: -6, top: '52%', height: size * 0.14, borderRadius: 4, background: '#E6007E', transform: `scaleX(${st.toFixed(3)}) rotate(-4deg)`, transformOrigin: '0 50%', boxShadow: '0 2px 8px rgba(230,0,126,.5)'}} />
          ) : null}
        </span>
      </div>
    </div>
  );
};

// ---------- Burst: estallido de partículas ----------
export type BurstDef = {at: number; x: number; y: number; n?: number; r?: number; ring?: boolean; star?: boolean};
const BURST_COLORS = ['#FFFFFF', '#C3AEF2', '#E6007E', '#A200FF', '#FFD6F0'];

export const BurstView: React.FC<{d: BurstDef; f: number}> = ({d, f}) => {
  const t = f - d.at;
  if (t < 0 || t > 32) return null;
  const n = d.n ?? 16;
  const R = d.r ?? 170;
  const q = pr(f, d.at, 26, Easing.out(Easing.poly(4)));
  const fade = 1 - pr(f, d.at + 10, 20, Easing.linear);
  return (
    <div style={{position: 'absolute', left: d.x, top: d.y, width: 0, height: 0, zIndex: 48}}>
      {d.ring !== false ? (
        <div style={{position: 'absolute', left: -R, top: -R, width: 2 * R, height: 2 * R, borderRadius: '50%', border: `${(7 * (1 - q) + 1).toFixed(1)}px solid rgba(255,255,255,${(0.9 * (1 - q)).toFixed(2)})`, transform: `scale(${(0.25 + 0.85 * q).toFixed(3)})`, boxShadow: `0 0 30px rgba(230,0,126,${(0.6 * (1 - q)).toFixed(2)})`}} />
      ) : null}
      {Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2 + hash(i, d.at) * 0.5;
        const dist = R * (0.55 + 0.6 * hash(i, d.at + 1)) * q;
        const c = BURST_COLORS[i % BURST_COLORS.length];
        const kind = i % 3;
        const x = Math.cos(a) * dist;
        const y = Math.sin(a) * dist;
        if (kind === 0 || !d.star) {
          // raya en la dirección del vuelo
          const len = (26 + 18 * hash(i, 3)) * (1 - q * 0.8);
          return <div key={i} style={{position: 'absolute', left: x, top: y, width: len, height: 6, marginTop: -3, borderRadius: 3, background: c, opacity: fade, transform: `rotate(${(a * 180) / Math.PI}deg)`, transformOrigin: '0 50%'}} />;
        }
        // estrella de cuatro puntas o punto
        const sz = (16 + 14 * hash(i, 5)) * (1 - q * 0.5);
        return kind === 1 ? (
          <svg key={i} width={sz} height={sz} viewBox="0 0 24 24" style={{position: 'absolute', left: x - sz / 2, top: y - sz / 2, opacity: fade, transform: `rotate(${(q * 90).toFixed(1)}deg)`}}>
            <path d="M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z" fill={c} />
          </svg>
        ) : (
          <div key={i} style={{position: 'absolute', left: x - sz / 4, top: y - sz / 4, width: sz / 2, height: sz / 2, borderRadius: '50%', background: c, opacity: fade}} />
        );
      })}
    </div>
  );
};

// ---------- Counter: número grande que rueda (odómetro) ----------
export const Rolling: React.FC<{value: number; size: number; color?: string; digits?: number}> = ({value, size, color = '#fff', digits}) => {
  const n = Math.max(digits ?? 1, String(Math.floor(Math.max(0, value))).length);
  const cols = [];
  for (let c = n - 1; c >= 0; c--) {
    const pow = Math.pow(10, c);
    const base = Math.floor(value / pow);
    // Los dígitos altos solo ruedan cuando el de la derecha pasa de 9 a 0, como un odómetro.
    const rest = value - base * pow;
    const frac = c === 0 ? value - Math.floor(value) : Math.max(0, rest - (pow - 1));
    const d0 = base % 10;
    const d1 = (base + 1) % 10;
    cols.push(
      <span key={c} style={{position: 'relative', display: 'inline-block', width: '0.56em', height: '1.05em', overflow: 'hidden', verticalAlign: 'top'}}>
        <span style={{position: 'absolute', left: 0, right: 0, top: 0, textAlign: 'center', transform: `translateY(${(-frac * 100).toFixed(2)}%)`}}>
          <span style={{display: 'block', height: '1.05em'}}>{d0}</span>
          <span style={{display: 'block', height: '1.05em'}}>{d1}</span>
        </span>
      </span>,
    );
  }
  return <span style={{fontFamily: SANS, fontWeight: 800, fontSize: size, lineHeight: 1.05, color, fontVariantNumeric: 'tabular-nums'}}>{cols}</span>;
};

// ---------- Flash: destello de luz en los cambios fuertes ----------
export type FlashDef = {at: number; dur?: number; x?: number; y?: number; a?: number};
export const FlashView: React.FC<{d: FlashDef; f: number}> = ({d, f}) => {
  const dur = d.dur ?? 12;
  if (f < d.at - 2 || f > d.at + dur) return null;
  const a = (d.a ?? 0.55) * interpolate(f, [d.at - 2, d.at + 1, d.at + dur], [0, 1, 0], {...clampOpt, easing: Easing.out(Easing.quad)});
  return <div style={{position: 'absolute', inset: 0, zIndex: 46, pointerEvents: 'none', mixBlendMode: 'screen', opacity: a, background: `radial-gradient(55% 40% at ${((d.x ?? 540) / 10.8).toFixed(1)}% ${((d.y ?? 1100) / 19.2).toFixed(1)}%, rgba(255,255,255,.95) 0%, rgba(195,174,242,.55) 35%, rgba(162,0,255,0) 75%)`}} />;
};

// ---------- toque sobre una pieza flotante (en px del lienzo) ----------
export type CanvasTap = {at: number; x: number; y: number; scale?: number; fade?: number}; // fade: frames de salida
const CanvasTapView: React.FC<{t: CanvasTap; f: number}> = ({t, f}) => {
  const d = f - t.at;
  if (d < -10 || d > 16) return null;
  const inP = pr(f, t.at - 10, 8, Easing.bezier(0.32, 0.72, 0, 1));
  const press = d >= 0 && d < 4 ? 1 - Math.abs(d - 1.5) / 2.5 : 0;
  const out = pr(f, t.at + 4, t.fade ?? 12);
  const ring = (1.45 - 0.45 * inP) * (1 - 0.12 * press) + 0.6 * out;
  const R = 66 * (t.scale ?? 1) * 1.5;
  return (
    <div style={{position: 'absolute', left: t.x, top: t.y, width: 0, height: 0, zIndex: 48, opacity: inP * (1 - out)}}>
      <div style={{position: 'absolute', left: -R / 2, top: -R / 2, width: R, height: R, borderRadius: '50%', border: '6px solid rgba(255,255,255,.95)', transform: `scale(${ring.toFixed(3)})`, boxShadow: '0 0 0 12px rgba(162,0,255,.22), 0 0 50px rgba(162,0,255,.55)'}} />
      <div style={{position: 'absolute', left: -30, top: -30, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.62)', transform: `scale(${(1 + 0.25 * press).toFixed(3)})`, boxShadow: '0 6px 20px rgba(28,18,36,.3)'}} />
    </div>
  );
};

export const FxLayer: React.FC<{badges: BadgeDef[]; bursts: BurstDef[]; flashes: FlashDef[]; ctaps?: CanvasTap[]}> = ({badges, bursts, flashes, ctaps = []}) => {
  const f = useCurrentFrame();
  return (
    <>
      {ctaps.map((t, i) => (
        <CanvasTapView key={`ct${i}`} t={t} f={f} />
      ))}
      {flashes.map((d, i) => (
        <FlashView key={`fl${i}`} d={d} f={f} />
      ))}
      {bursts.map((d, i) => (
        <BurstView key={`bu${i}`} d={d} f={f} />
      ))}
      {badges.map((d, i) => (
        <BadgeView key={`ba${i}`} d={d} f={f} />
      ))}
    </>
  );
};
