import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Streak} from '../../v4/fx/MotionBlur';
import {BEZEL, Box, PHONE_H, PHONE_W, PT, Pose, REST, SCREEN_H, SCREEN_W} from './geometry';

// El teléfono del video y todo lo que pasa en su pantalla, descrito como datos (pistas) por las escenas:
// - `screens`: qué captura real se ve desde cada frame y cómo entra (corte, fundido, empuje de navegación iOS,
//   hoja desde abajo); capturas de página completa con scroll por keyframes; secuencias cuadro a cuadro.
// - `taps`: el dedo (anillo + punto) que toca un punto de la pantalla, en pt (CSS px de la app, 390 x 844).
// - `glows`: un halo que destaca una caja de la pantalla.
// - `pushes`: notificación de iOS que baja desde arriba.
// - `cam`: poses del teléfono (centro de la pantalla en el lienzo + escala) con su duración; entre poses se
//   interpola con la curva de navegación de iOS.
// Todo es determinista: solo depende del frame.

export type Transition = 'cut' | 'fade' | 'push' | 'pop' | 'sheet' | 'zoom';
export type ScreenEvent = {
  at: number;
  src?: string; // imagen relativa a public/ (p. ej. 'schot/shots/programa.png')
  seq?: {dir: string; frames: number; start?: number; end?: number; rate?: number}; // secuencia f0000.png… a 30 fps desde `at` (de `start` a `end`)
  full?: boolean; // página completa: se desplaza con `scroll`
  scroll?: Array<[number, number]>; // [frame absoluto, pt desplazados]; entre keyframes con easing suave
  chrome?: string; // capa fija encima (barra de pestañas + botón de TibIA) para las páginas completas
  enter?: Transition;
  enterDur?: number;
  ink?: 'dark' | 'light'; // tinta de la barra de estado sobre esta pantalla
  render?: (f: number) => React.ReactNode; // pantalla dibujada en código (px de pantalla, 585 x 1266)
};
export type Tap = {at: number; x: number; y: number};
export type Glow = {at: number; until: number; box: Box; radius?: number};
export type PushNote = {at: number; until: number; title: string; body: string; app?: string; when?: string};
export type CamKey = {at: number; dur: number; pose: Pose; ease?: 'io' | 'out' | 'in' | 'whipIn' | 'whipOut'};
// Temblor de cámara (impactos): amplitud en px que decae en `dur` frames.
export type Shake = {at: number; dur: number; amp: number};
// Zona de la pantalla que se oscurece mientras su contenido «sale» del teléfono (Lift).
export type Dim = {at: number; until: number; box: Box; radius?: number};

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ios = Easing.bezier(0.32, 0.72, 0, 1);
const io = Easing.inOut(Easing.cubic);
// Navegación (empuje, hoja, zoom): arranque suave y llegada larga; sin el salto del primer cuadro de una curva rápida.
const nav = Easing.bezier(0.45, 0, 0.12, 1);
const pr = (f: number, a: number, d: number, e = ios) => interpolate(f, [a, a + Math.max(1, d)], [0, 1], {...clampOpt, easing: e});

// ---------- cámara ----------
export const shakeAt = (shakes: Shake[], f: number) => {
  let dx = 0;
  let dy = 0;
  for (const k of shakes) {
    const d = f - k.at;
    if (d < 0 || d > k.dur) continue;
    const a = k.amp * Math.pow(1 - d / k.dur, 2);
    dx += a * Math.sin(d * 2.3 + k.at);
    dy += a * Math.cos(d * 2.9 + k.at * 0.7);
  }
  return {dx, dy};
};

export const poseAt = (cam: CamKey[], f: number): Pose => {
  let cur: Pose = REST;
  for (const k of [...cam].sort((a, b) => a.at - b.at)) {
    if (f < k.at) break;
    const e =
      k.ease === 'out' ? ios : k.ease === 'in' ? Easing.in(Easing.cubic) : k.ease === 'whipIn' ? Easing.in(Easing.poly(3)) : k.ease === 'whipOut' ? Easing.out(Easing.poly(4)) : io;
    const t = pr(f, k.at, k.dur, e);
    cur = {
      x: cur.x + (k.pose.x - cur.x) * t,
      y: cur.y + (k.pose.y - cur.y) * t,
      s: cur.s + (k.pose.s - cur.s) * t,
      r: (cur.r ?? 0) + ((k.pose.r ?? 0) - (cur.r ?? 0)) * t,
      rx: (cur.rx ?? 0) + ((k.pose.rx ?? 0) - (cur.rx ?? 0)) * t,
      ry: (cur.ry ?? 0) + ((k.pose.ry ?? 0) - (cur.ry ?? 0)) * t,
    };
  }
  return cur;
};

// ---------- scroll ----------
const scrollAt = (ev: ScreenEvent, f: number) => {
  const keys = ev.scroll ?? [];
  if (!keys.length) return 0;
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [a, ya] = keys[i - 1];
    const [b, yb] = keys[i];
    if (f <= b) return ya + (yb - ya) * interpolate(f, [a, b], [0, 1], {...clampOpt, easing: io});
  }
  return keys[keys.length - 1][1];
};

const pad4 = (n: number) => String(n).padStart(4, '0');

// Una pantalla (captura, página completa con scroll o secuencia).
const ScreenView: React.FC<{ev: ScreenEvent; f: number}> = ({ev, f}) => {
  if (ev.render) return <>{ev.render(f)}</>;
  if (ev.seq) {
    const {dir, frames, start = 0, end = frames - 1, rate = 1} = ev.seq;
    const i = Math.max(start, Math.min(end, frames - 1, start + Math.floor((f - ev.at) * rate)));
    return <Img src={staticFile(`${dir}/f${pad4(i)}.png`)} style={{position: 'absolute', left: 0, top: 0, width: SCREEN_W, height: SCREEN_H, objectFit: 'cover', objectPosition: 'top'}} />;
  }
  if (!ev.src) return null;
  const y = ev.full ? scrollAt(ev, f) : 0;
  return (
    <>
      <Img
        src={staticFile(ev.src)}
        style={{position: 'absolute', left: 0, top: 0, width: SCREEN_W, transform: `translateY(${(-y * PT).toFixed(2)}px)`}}
      />
      {/* Al desplazar, el contenido pasa bajo una franja difuminada (como en iOS) para que no choque con la hora */}
      {ev.full && y > 0.5 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 50 * PT, background: 'rgba(249,246,252,.88)', backdropFilter: 'blur(14px) saturate(1.4)', boxShadow: '0 1px 0 rgba(28,18,36,.06)', opacity: Math.min(1, y / 30)}} />
      ) : null}
      {ev.chrome ? <Img src={staticFile(ev.chrome)} style={{position: 'absolute', left: 0, top: 0, width: SCREEN_W, height: SCREEN_H}} /> : null}
    </>
  );
};

// Capa con la transición de entrada de la pantalla `ev` sobre la anterior.
const Screens: React.FC<{screens: ScreenEvent[]; f: number}> = ({screens, f}) => {
  const sorted = [...screens].sort((a, b) => a.at - b.at);
  let idx = -1;
  for (let i = 0; i < sorted.length; i++) if (f >= sorted[i].at) idx = i;
  if (idx < 0) return null;
  const cur = sorted[idx];
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const kind = cur.enter ?? 'cut';
  const dur = cur.enterDur ?? (kind === 'fade' ? 10 : kind === 'zoom' ? 18 : 20);
  const t = kind === 'cut' ? 1 : pr(f, cur.at, dur, kind === 'fade' ? io : nav);
  // Velocidad de la transición (fracción de pantalla por frame) para el desenfoque de movimiento de empujes y hojas.
  const dt = kind === 'cut' ? 0 : Math.abs(t - pr(f - 1, cur.at, dur, kind === 'fade' ? io : nav));
  const layer = (child: React.ReactNode, style: React.CSSProperties, key: string, blur?: {sx: number; sy?: number}) => (
    <div key={key} style={{position: 'absolute', inset: 0, overflow: 'hidden', ...style}}>
      {blur && Math.max(blur.sx, blur.sy ?? 0) >= 0.6 ? (
        <Streak sx={blur.sx} sy={blur.sy ?? 0} style={{position: 'absolute', inset: 0}}>
          {child}
        </Streak>
      ) : (
        child
      )}
    </div>
  );
  const mb = (px: number) => Math.min(20, px * 0.34);
  if (!prev || t >= 1) return layer(<ScreenView ev={cur} f={f} />, {}, `s${idx}`);
  const prevView = <ScreenView ev={prev} f={f} />;
  const curView = <ScreenView ev={cur} f={f} />;
  if (kind === 'fade') return <>{layer(prevView, {}, `p${idx}`)}{layer(curView, {opacity: t}, `s${idx}`)}</>;
  if (kind === 'zoom')
    return (
      <>
        {layer(prevView, {opacity: 1 - t, transform: `scale(${1 + 0.06 * t})`}, `p${idx}`)}
        {layer(curView, {opacity: t, transform: `scale(${0.94 + 0.06 * t})`}, `s${idx}`)}
      </>
    );
  if (kind === 'sheet')
    return (
      <>
        {layer(prevView, {}, `p${idx}`)}
        <div style={{position: 'absolute', inset: 0, background: `rgba(14,0,30,${0.35 * t})`}} />
        {layer(curView, {transform: `translateY(${((1 - t) * SCREEN_H).toFixed(1)}px)`, boxShadow: '0 -20px 50px rgba(14,0,30,.35)'}, `s${idx}`, {sx: 0, sy: mb(dt * SCREEN_H)})}
      </>
    );
  // push (navegar hacia adentro) y pop (volver): como la navegación de iOS, la anterior se corre un 30 % y se oscurece.
  const dir = kind === 'pop' ? -1 : 1;
  return (
    <>
      {layer(prevView, {transform: `translateX(${(-dir * 0.3 * t * SCREEN_W).toFixed(1)}px)`}, `p${idx}`, {sx: mb(dt * 0.3 * SCREEN_W)})}
      <div style={{position: 'absolute', inset: 0, background: `rgba(14,0,30,${0.18 * t})`}} />
      {layer(curView, {transform: `translateX(${(dir * (1 - t) * SCREEN_W).toFixed(1)}px)`, boxShadow: '-16px 0 40px rgba(14,0,30,.25)'}, `s${idx}`, {sx: mb(dt * SCREEN_W)})}
    </>
  );
};

// ---------- dedo ----------
const TapView: React.FC<{tap: Tap; f: number}> = ({tap, f}) => {
  const d = f - tap.at; // 0 = toque
  if (d < -10 || d > 16) return null;
  const inP = pr(f, tap.at - 10, 8); // aparece y se cierra
  const press = d >= 0 && d < 4 ? 1 - Math.abs(d - 1.5) / 2.5 : 0; // presión de 4 frames
  const out = pr(f, tap.at + 4, 12, io);
  const ring = (1.45 - 0.45 * inP) * (1 - 0.12 * press) + 0.5 * out;
  const o = inP * (1 - out);
  const R = 44 * PT;
  return (
    <div style={{position: 'absolute', left: tap.x * PT, top: tap.y * PT, width: 0, height: 0, zIndex: 20, opacity: o}}>
      <div style={{position: 'absolute', left: -R / 2, top: -R / 2, width: R, height: R, borderRadius: '50%', border: '4px solid rgba(255,255,255,.95)', transform: `scale(${ring.toFixed(3)})`, boxShadow: '0 0 0 8px rgba(162,0,255,.22), 0 0 34px rgba(162,0,255,.55)'}} />
      <div style={{position: 'absolute', left: -20, top: -20, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.62)', transform: `scale(${(1 + 0.25 * press).toFixed(3)})`, boxShadow: '0 4px 14px rgba(28,18,36,.25)'}} />
    </div>
  );
};

// ---------- halo ----------
const GlowView: React.FC<{g: Glow; f: number}> = ({g, f}) => {
  const a = pr(f, g.at, 10, io) * (1 - pr(f, g.until, 10, io));
  if (a <= 0.001) return null;
  const pulse = 0.85 + 0.15 * Math.sin(((f - g.at) / 30) * Math.PI * 2 * 0.8);
  const r = (g.radius ?? 14) * PT;
  return (
    <div
      style={{
        position: 'absolute',
        left: g.box.x * PT - 6,
        top: g.box.y * PT - 6,
        width: g.box.w * PT + 12,
        height: g.box.h * PT + 12,
        borderRadius: r + 6,
        border: '3px solid rgba(230,0,126,.9)',
        boxShadow: `0 0 0 ${6 * pulse}px rgba(162,0,255,.18), 0 0 ${30 * pulse}px rgba(230,0,126,.45)`,
        opacity: a,
        zIndex: 15,
      }}
    />
  );
};

// ---------- notificación de iOS ----------
const PushView: React.FC<{n: PushNote; f: number}> = ({n, f}) => {
  const inT = pr(f, n.at, 16, Easing.bezier(0.2, 0.9, 0.25, 1.15));
  const outT = pr(f, n.until, 12, Easing.in(Easing.cubic));
  if (inT <= 0 || outT >= 1) return null;
  const y = (-140 + 192 * inT - 210 * outT) * PT; // reposa bajo la isla dinámica (52 pt), como en iOS
  return (
    <div
      style={{
        position: 'absolute',
        left: 9 * PT,
        right: 9 * PT,
        top: 0,
        transform: `translateY(${y.toFixed(1)}px)`,
        zIndex: 30,
        borderRadius: 22 * PT,
        padding: `${11 * PT}px ${13 * PT}px`,
        background: 'rgba(245,242,249,.86)',
        backdropFilter: 'blur(24px) saturate(1.6)',
        boxShadow: '0 18px 50px rgba(14,0,30,.35), inset 0 0 0 1px rgba(255,255,255,.6)',
        display: 'flex',
        gap: 10 * PT,
        alignItems: 'center',
        fontFamily: '"Barlow", system-ui, sans-serif',
        color: '#1C1224',
      }}
    >
      <Img src={staticFile('schot/brand/apple-touch-icon.png')} style={{width: 38 * PT, height: 38 * PT, borderRadius: 9 * PT, flex: 'none'}} />
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 13 * PT, color: '#6B6178', fontWeight: 500}}>
          <span style={{fontWeight: 600, color: '#1C1224'}}>{n.app ?? 'SCHOT'}</span>
          <span>{n.when ?? 'ahora'}</span>
        </div>
        <div style={{fontSize: 15 * PT, fontWeight: 700, lineHeight: 1.2, marginTop: 1 * PT}}>{n.title}</div>
        <div style={{fontSize: 15 * PT, fontWeight: 500, lineHeight: 1.25}}>{n.body}</div>
      </div>
    </div>
  );
};

// ---------- barra de estado ----------
const StatusBar: React.FC<{ink: 'dark' | 'light'; time: string}> = ({ink, time}) => {
  const c = ink === 'dark' ? '#1C1224' : '#FFFFFF';
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 47 * PT,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${4 * PT}px ${28 * PT}px 0 ${44 * PT}px`,
        fontFamily: '"Barlow", system-ui, sans-serif',
        fontWeight: 600,
        fontSize: 17 * PT,
        color: c,
        fontVariantNumeric: 'tabular-nums',
        transition: 'none',
      }}
    >
      <span>{time}</span>
      <span style={{display: 'flex', gap: 6 * PT, alignItems: 'center'}}>
        <svg width={18 * PT} height={11 * PT} viewBox="0 0 36 22" fill={c}><rect x="0" y="14" width="6" height="8" rx="1.5" /><rect x="10" y="10" width="6" height="12" rx="1.5" /><rect x="20" y="5" width="6" height="17" rx="1.5" /><rect x="30" y="0" width="6" height="22" rx="1.5" /></svg>
        <svg width={16 * PT} height={11.5 * PT} viewBox="0 0 32 23" fill={c}><path d="M16 23l-5.2-5.6a7.6 7.6 0 0 1 10.4 0z" /><path d="M16 9.6c3.7 0 7 1.4 9.6 3.8l-2.6 2.8a10 10 0 0 0-14 0l-2.6-2.8A13.9 13.9 0 0 1 16 9.6z" /><path d="M16 0c6.2 0 11.8 2.4 16 6.4l-2.6 2.8A19.4 19.4 0 0 0 16 3.8 19.4 19.4 0 0 0 2.6 9.2L0 6.4A23.2 23.2 0 0 1 16 0z" /></svg>
        <svg width={26 * PT} height={12 * PT} viewBox="0 0 52 24"><rect x="1" y="1" width="44" height="22" rx="7" fill="none" stroke={c} strokeOpacity=".4" strokeWidth="2" /><rect x="4" y="4" width="34" height="16" rx="4.5" fill={c} /><rect x="47.5" y="8" width="3.5" height="8" rx="1.75" fill={c} fillOpacity=".4" /></svg>
      </span>
    </div>
  );
};

export type StageProps = {
  screens: ScreenEvent[];
  shakes?: Shake[];
  dims?: Dim[];
  taps?: Tap[];
  glows?: Glow[];
  pushes?: PushNote[];
  cam?: CamKey[];
  opacity?: (f: number) => number;
  time?: string;
  extra?: (f: number) => React.ReactNode; // capas extra dentro de la pantalla (coordenadas en px de pantalla)
};

// Inkjet de la barra de estado: la de la pantalla vigente (en un empuje cambia a la mitad).
// Cuánto de tinta clara lleva la barra de estado (0 oscura, 1 clara): cruza en fundido durante la entrada de cada
// pantalla (6 frames en los cortes) y al desplazar una página completa.
const inkAt = (screens: ScreenEvent[], f: number): number => {
  const sorted = [...screens].sort((a, b) => a.at - b.at);
  const val = (s: ScreenEvent) => (s.ink === 'light' ? 1 : 0) * (s.full ? 1 - Math.min(1, scrollAt(s, f) / 30) : 1);
  let k = 0;
  for (const s of sorted) {
    if (f < s.at) break;
    const d = s.enter && s.enter !== 'cut' ? s.enterDur ?? 18 : 6;
    const t = interpolate(f, [s.at, s.at + d], [0, 1], {...clampOpt, easing: io});
    k = k + (val(s) - k) * t;
  }
  return k;
};

export const Stage: React.FC<StageProps> = ({screens, taps = [], glows = [], pushes = [], cam = [], shakes = [], dims = [], opacity, time = '10:20', extra}) => {
  const f = useCurrentFrame();
  const sh = shakeAt(shakes, f);
  const p0 = poseAt(cam, f);
  const p = {...p0, x: p0.x + sh.dx, y: p0.y + sh.dy};
  // Desenfoque de movimiento del teléfono entero según su velocidad (latigazos y vuelos), como en el reel de ZH.
  const pp = poseAt(cam, f - 1);
  // Un giro 3D rápido (volteo) también deja estela, en x.
  const vx = Math.abs(p0.x - pp.x) + Math.abs(p0.s - pp.s) * 300 + Math.abs((p0.ry ?? 0) - (pp.ry ?? 0)) * 5;
  const vy = Math.abs(p0.y - pp.y) + Math.abs(p0.s - pp.s) * 300 + Math.abs((p0.rx ?? 0) - (pp.rx ?? 0)) * 5;
  const bx = Math.min(34, vx * 0.3);
  const by = Math.min(34, vy * 0.3);
  const o = opacity ? opacity(f) : 1;
  if (o <= 0.001) return null;
  // El teléfono se dibuja con su esquina superior izquierda en (0,0) y se lleva a la pose con transform.
  const left = p.x - PHONE_W / 2;
  const top = p.y - PHONE_H / 2;
  const phone = (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: PHONE_W,
        height: PHONE_H,
        transform: `translate(${left.toFixed(2)}px, ${top.toFixed(2)}px) perspective(2400px) rotateX(${(p.rx ?? 0).toFixed(3)}deg) rotateY(${(p.ry ?? 0).toFixed(3)}deg) scale(${p.s.toFixed(4)}) rotate(${(p.r ?? 0).toFixed(3)}deg)`,
        transformOrigin: '50% 50%',
        opacity: o,
      }}
    >
      {/* Sombra de contacto y halo de marca */}
      <div style={{position: 'absolute', left: 40, right: 40, bottom: -30, height: 120, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(14,0,30,.55), rgba(14,0,30,0))', filter: 'blur(10px)'}} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 96,
          padding: 18,
          background: 'linear-gradient(145deg, #4A3C5C 0%, #231A2E 18%, #140E1B 50%, #231A2E 82%, #3E3150 100%)',
          boxShadow:
            '0 0 0 2px rgba(195,174,242,.18), inset 0 0 0 2px rgba(255,255,255,.10), 0 70px 140px -40px rgba(14,0,30,.9), 0 30px 60px -30px rgba(26,0,51,.8), 60px 80px 160px -60px rgba(230,0,126,.35)',
        }}
      >
        {/* Botones laterales */}
        {[
          {left: -6, top: 290, h: 100},
          {left: -6, top: 420, h: 100},
          {right: -6, top: 340, h: 160},
        ].map((b, i) => (
          <div key={i} style={{position: 'absolute', left: b.left, right: b.right, top: b.top, height: b.h, width: 8, borderRadius: 4, background: 'linear-gradient(90deg, #2A2134, #463859)'}} />
        ))}
        <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 80, background: '#0B0710', padding: BEZEL - 18}}>
          <div style={{position: 'relative', width: SCREEN_W, height: SCREEN_H, borderRadius: 68, overflow: 'hidden', background: '#F9F6FC'}}>
            <Screens screens={screens} f={f} />
            {dims.map((d, i) => {
              const a = pr(f, d.at, 8, io) * (1 - pr(f, d.until, 10, io));
              return a > 0.001 ? (
                <div key={`dim${i}`} style={{position: 'absolute', left: d.box.x * PT, top: d.box.y * PT, width: d.box.w * PT, height: d.box.h * PT, borderRadius: (d.radius ?? 12) * PT, background: 'rgba(43,0,84,.16)', boxShadow: 'inset 0 6px 18px rgba(26,0,51,.28)', opacity: a, zIndex: 14}} />
              ) : null;
            })}
            {glows.map((g, i) => (
              <GlowView key={i} g={g} f={f} />
            ))}
            {extra ? extra(f) : null}
            {taps.map((t, i) => (
              <TapView key={i} tap={t} f={f} />
            ))}
            {pushes.map((n, i) => (
              <PushView key={i} n={n} f={f} />
            ))}
            {(() => {
              const k = inkAt(screens, f);
              return (
                <>
                  {k < 0.999 ? <div style={{position: 'absolute', inset: 0, zIndex: 40, opacity: 1 - k}}><StatusBar ink="dark" time={time} /></div> : null}
                  {k > 0.001 ? <div style={{position: 'absolute', inset: 0, zIndex: 40, opacity: k}}><StatusBar ink="light" time={time} /></div> : null}
                </>
              );
            })()}
            {/* Isla dinámica */}
            <div style={{position: 'absolute', top: 11 * PT, left: '50%', transform: 'translateX(-50%)', width: 124 * PT, height: 36 * PT, borderRadius: 20 * PT, background: '#000', zIndex: 41}} />
            {/* Indicador de inicio */}
            <div style={{position: 'absolute', bottom: 8 * PT, left: '50%', transform: 'translateX(-50%)', width: 134 * PT, height: 5 * PT, borderRadius: 99, background: 'rgba(28,18,36,.85)', zIndex: 41}} />
            {/* Reflejo */}
            <div style={{position: 'absolute', inset: 0, zIndex: 42, pointerEvents: 'none', background: 'linear-gradient(118deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,0) 30%)'}} />
          </div>
        </div>
      </div>
    </div>
  );
  return Math.max(bx, by) >= 0.8 ? (
    <Streak sx={bx} sy={by} style={{position: 'absolute', inset: 0}}>
      {phone}
    </Streak>
  ) : (
    phone
  );
};
