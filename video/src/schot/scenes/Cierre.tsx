import React from 'react';
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {beat, beatEnd, captionsOf, scenes} from '../timeline';
import {focus, PT, REST, SCREEN_H, SCREEN_W, toCanvas} from '../ui/geometry';
import {GRAD_TEXT} from '../ui/Text';
import {SceneDef, shot} from './types';

// Escena 9 · cierre. El teléfono muestra la app abierta en Safari; arriba, la dirección en una cápsula que salta y se
// escribe letra a letra mientras la voz la dice. «y agrégala a tu pantalla de inicio» → el proceso real, como en un
// video de la pantalla: cada captura real de iOS 26 (las mismas que usa la guía «Instalar la app» de la propia app)
// sale en grande, numerada con el texto de esa guía, y el dedo toca: ⋯ → «Compartir» → «Ver más» → «Agregar a
// Inicio» → «Agregar». Después, la pantalla de inicio recibe el ícono de SCHOT, se toca y la app se abre. Termina en
// la tarjeta final (dirección, sello y datos del congreso) sin fundido a negro: WhatsApp se queda en el último cuadro,
// que tiene que dejar la dirección legible.
const sc = scenes.cierre;
const URL = 'app.congresoschot2026.com';
const tUrl = beat('cierre', 'Entra') - 4;
const urlWord = captionsOf('cierre').flatMap((c) => c.words).find((w) => w.text.includes('congresoschot'));
const tType0 = urlWord ? urlWord.from : tUrl + 18;
const tType1 = urlWord ? Math.min(urlWord.to - 8, tType0 + 75) : tType0 + 70;
// El proceso real de iOS 26 para agregarla a la pantalla de inicio, como una grabación de pantalla continua dentro del
// teléfono. Las piezas son las capturas reales de iOS 26 que usa la guía «Instalar la app» de la propia app
// (schot-app-frontend, InstallGuide.tsx; public/schot/guia/), recortadas por elemento (barra, menú, hojas) y animadas
// como en iOS: el menú crece desde el botón ⋯, la hoja de compartir sube, se expande con la lista, sube la hoja
// «Agregar a Inicio» y, al agregar, se vuelve a la pantalla de inicio. Los textos de la etiqueta son los de esa guía.
const tGuide = beat('cierre', 'agrégala') - 2;
const T = {
  dots: tGuide + 22, // toque en ⋯
  menu: tGuide + 26, // se abre el menú
  compartir: tGuide + 66, // toque en «Compartir»
  share: tGuide + 70, // sube la hoja de compartir
  verMas: tGuide + 110, // toque en «Ver más»
  expand: tGuide + 114, // la hoja se expande con la lista
  inicio: tGuide + 154, // toque en «Agregar a Inicio»
  add: tGuide + 158, // sube la hoja «Agregar a Inicio»
  agregar: tGuide + 204, // toque en «Agregar»
};
const tHome = tGuide + 220; // al agregar, Safari se cierra y aparece la pantalla de inicio (como en iOS)
const tIcon = tHome + 14; // el ícono de SCHOT aparece
const tTapIcon = tIcon + 34; // se toca
const tOpen = tTapIcon + 5; // y la app se abre, sin la barra de Safari
const tEndCard = tOpen + 60; // la app abierta se alcanza a ver
// La etiqueta de arriba: un solo texto que cambia con cada paso (los de la guía de la app).
const LABELS: Array<{at: number; n?: number; text: string}> = [
  {at: tGuide, n: 1, text: 'Toca el botón ⋯'},
  {at: T.menu + 8, n: 2, text: 'Toca «Compartir»'},
  {at: T.share + 10, n: 3, text: 'Toca «Ver más»'},
  {at: T.expand + 10, n: 4, text: 'Toca «Agregar a Inicio»'},
  {at: T.add + 10, n: 5, text: 'Toca «Agregar»'},
  {at: tHome + 4, text: 'El ícono SCHOT queda en tu pantalla de inicio'},
];
const PHONE_POSE = {...REST, y: 1330, s: 0.86};

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ios = Easing.bezier(0.32, 0.72, 0, 1);
const pr = (f: number, a: number, d: number, e = ios) => interpolate(f, [a, a + d], [0, 1], {...clampOpt, easing: e});
const SANS = '"Barlow", system-ui, sans-serif';

// ---------- el flujo de instalación dentro del teléfono ----------
// Las capturas de la guía son de pantalla completa a 720 px de ancho: 1 px = 390/720 pt.
const GS = 390 / 720;
// La barra de Safari, abajo. Su captura trae arriba media fila de textos de la barra de pestañas de la app: se recorta
// desde debajo de esos textos y la barra tapa la de la captura de la página (si no, se verían dos barras).
const BAR = {sy: 24, sh: 174};
const BAR_H = BAR.sh * GS;
const BAR_Y = 844 - BAR_H - 4;
const MENU = {sx: 212, sy: 32, sw: 446, sh: 693}; // el menú del botón ⋯ en su captura (px)
const MENU_Y = BAR_Y - 6 - MENU.sh * GS; // pt: el menú queda justo sobre la barra
const SHEET = {sx: 18, sy: 78, sw: 682, sh: 698}; // la hoja de compartir (px)
const SHEET_Y = 844 - SHEET.sh * GS; // pt
const LIST = {sx: 18, sy: 110, sw: 682, sh: 666}; // la lista de «Ver más» (px)
const EXPAND = LIST.sh * GS; // cuánto sube la hoja al expandirse (pt)
const ADD = {sx: 0, sy: 38, sw: 720, sh: 738}; // la hoja «Agregar a Inicio» (px)
const ADD_Y = 52; // pt
const guia = (img: string) => staticFile(`schot/guia/${img}`);

// Un recorte de una captura de la guía dibujado en (x, y) pt de la pantalla.
const GuideCrop: React.FC<{img: string; c: {sx: number; sy: number; sw: number; sh: number}; x: number; y: number; radius?: string; style?: React.CSSProperties}> = ({img, c, x, y, radius, style}) => (
  <div style={{position: 'absolute', left: x * PT, top: y * PT, width: c.sw * GS * PT, height: c.sh * GS * PT, overflow: 'hidden', borderRadius: radius, ...style}}>
    <Img src={guia(img)} style={{position: 'absolute', left: -c.sx * GS * PT, top: -c.sy * GS * PT, width: 720 * GS * PT}} />
  </div>
);

const nav = Easing.bezier(0.32, 0.72, 0, 1);
const InstallFlow: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  // menú: crece desde el botón ⋯ y se apaga cuando sube la hoja
  const m = spring({frame: f - T.menu, fps, config: {damping: 18, stiffness: 220, mass: 0.7}});
  const mOut = pr(f, T.share, 8, Easing.out(Easing.quad));
  // hoja de compartir: sube; al expandirse, sube con la lista; se va cuando sube «Agregar a Inicio»
  const sh = pr(f, T.share, 16, nav);
  const ex = pr(f, T.expand, 18, nav);
  const shOut = pr(f, T.add, 12, Easing.in(Easing.quad));
  // hoja «Agregar a Inicio»: sube y se queda hasta que aparece la pantalla de inicio
  const ad = pr(f, T.add, 18, nav);
  const dim = 0.22 * Math.max(sh * (1 - shOut), ad);
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      <Img src={staticFile(shot('programa'))} style={{position: 'absolute', left: 0, top: 0, width: SCREEN_W, height: SCREEN_H}} />
      <GuideCrop img="ios26-1-barra.jpg" c={{sx: 0, sy: BAR.sy, sw: 720, sh: BAR.sh}} x={0} y={BAR_Y} />
      {dim > 0.001 ? <div style={{position: 'absolute', inset: 0, background: `rgba(10,6,20,${dim.toFixed(3)})`}} /> : null}
      {f >= T.menu && mOut < 1 ? (
        <GuideCrop
          img="ios26-2-menu.jpg"
          c={MENU}
          x={MENU.sx * GS}
          y={MENU_Y}
          radius={`${30 * PT}px`}
          style={{transform: `scale(${(0.35 + 0.65 * m).toFixed(4)})`, transformOrigin: '88% 100%', opacity: Math.min(1, m * 2) * (1 - mOut), boxShadow: '0 20px 50px rgba(14,0,30,.28)'}}
        />
      ) : null}
      {f >= T.share && shOut < 1 ? (
        // La hoja expandida es la hoja de compartir con la lista debajo: antes de expandirse está corrida hacia abajo lo
        // que mide la lista, así que se ve igual que la hoja normal; al expandirse sube y aparece la lista.
        <div style={{position: 'absolute', left: SHEET.sx * GS * PT, top: (SHEET_Y - EXPAND) * PT, width: SHEET.sw * GS * PT, height: (SHEET.sh * GS + EXPAND) * PT, borderRadius: `${24 * PT}px ${24 * PT}px 0 0`, overflow: 'hidden', transform: `translateY(${(((1 - sh) * (SHEET.sh * GS + 30) + (1 - ex) * EXPAND + shOut * 300) * PT).toFixed(1)}px)`, opacity: 1 - shOut * 0.6, boxShadow: '0 -10px 40px rgba(14,0,30,.2)'}}>
          <GuideCrop img="ios26-3-compartir.jpg" c={SHEET} x={0} y={0} />
          <GuideCrop img="ios26-4-lista.jpg" c={LIST} x={0} y={SHEET.sh * GS} />
        </div>
      ) : null}
      {ad > 0.001 ? (
        <div style={{position: 'absolute', left: 0, top: ADD_Y * PT, width: SCREEN_W, height: (844 - ADD_Y) * PT, borderRadius: `${24 * PT}px ${24 * PT}px 0 0`, overflow: 'hidden', background: 'rgb(243,242,248)', transform: `translateY(${((1 - ad) * (844 - ADD_Y + 20) * PT).toFixed(1)}px)`, boxShadow: '0 -10px 40px rgba(14,0,30,.25)'}}>
          <GuideCrop img="ios26-5-agregar.jpg" c={ADD} x={0} y={0} />
        </div>
      ) : null}
    </div>
  );
};
// Dónde se toca en cada paso (pt de la pantalla).
const TAPS = {
  dots: {x: 614 * GS, y: BAR_Y + (93 - BAR.sy) * GS},
  compartir: {x: 400 * GS, y: MENU_Y + (84 - MENU.sy) * GS},
  verMas: {x: 588 * GS, y: SHEET_Y + (612 - SHEET.sy) * GS},
  inicio: {x: 300 * GS, y: SHEET_Y - EXPAND + SHEET.sh * GS + (457 - LIST.sy) * GS},
  agregar: {x: 590 * GS, y: ADD_Y + (107 - ADD.sy) * GS},
};

// La etiqueta del paso, arriba del teléfono: el número y el texto cambian con un fundido, en el mismo lugar.
const StepLabel: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < LABELS[0].at - 2 || f > tEndCard) return null;
  let i = 0;
  LABELS.forEach((l, k) => {
    if (f >= l.at) i = k;
  });
  const l = LABELS[i];
  const p = spring({frame: f - l.at, fps, config: {damping: 16, stiffness: 140, mass: 0.8}});
  // El texto de este paso sale (sube y se apaga) justo antes de que entre el siguiente: nunca se ven dos a la vez.
  const next = LABELS[i + 1];
  const q = next ? pr(f, next.at - 5, 5, Easing.in(Easing.quad)) : 0;
  const tx = Math.min(1, p * 2) * (1 - q);
  const ty = (1 - p) * 12 - q * 10;
  // La cápsula cambia de ancho con el texto: un pequeño salto al cambiar lo acompaña.
  const bump = i > 0 ? 1 - 0.05 * Math.sin(Math.PI * Math.min(1, Math.max(0, (f - l.at) / 8))) : 1;
  const out = pr(f, tEndCard - 14, 12);
  const first = spring({frame: f - LABELS[0].at, fps, config: {damping: 15, stiffness: 120}});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 438, display: 'flex', justifyContent: 'center', zIndex: 50, opacity: Math.min(1, first * 2) * (1 - out), transform: `scale(${(0.7 + 0.3 * first).toFixed(4)})`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '12px 30px 12px 14px', borderRadius: 999, background: '#fff', boxShadow: '0 16px 40px rgba(14,0,30,.4), 0 0 0 6px rgba(195,174,242,.28)', transform: `scale(${bump.toFixed(4)})`}}>
        <span style={{width: 58, height: 58, borderRadius: 29, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #8A00E6, #E6007E)', color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: l.n ? 32 : 30}}>
          {l.n ? (
            <span style={{opacity: tx, transform: `translateY(${ty.toFixed(1)}px)`}}>{l.n}</span>
          ) : (
            <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{opacity: tx}}>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </span>
        <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#2B0054', whiteSpace: 'nowrap', opacity: tx, transform: `translateY(${ty.toFixed(1)}px)`}}>{l.text}</span>
        {l.n ? <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 24, color: '#8E7AA8', marginLeft: 4}}>en iPhone</span> : null}
      </div>
    </div>
  );
};

// Pantalla de inicio de iOS dibujada en código: fondo de marca, íconos de vidrio sin marca (otras apps) y el ícono
// real de SCHOT que aparece con un resorte en `tIcon`.
const COLS = 4;
const ICON = 62; // pt
const X0 = 27;
const PITCH_X = (390 - 2 * X0 - ICON) / (COLS - 1);
const Y0 = 78;
const PITCH_Y = 96;
const SLOT = {c: 1, r: 2}; // donde queda SCHOT
const HomeScreen: React.FC<{f: number; fps: number}> = ({f, fps}) => {
  const pop = spring({frame: f - tIcon, fps, config: {damping: 11, stiffness: 150}});
  const glass = (key: string, x: number, y: number, a = 1) => (
    <div
      key={key}
      style={{
        position: 'absolute',
        left: x * PT,
        top: y * PT,
        width: ICON * PT,
        height: ICON * PT,
        borderRadius: 15 * PT,
        background: 'linear-gradient(160deg, rgba(255,255,255,.34), rgba(255,255,255,.12))',
        boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.35), 0 6px 18px rgba(26,0,51,.25)',
        opacity: a,
      }}
    />
  );
  const icons: React.ReactNode[] = [];
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < COLS; c++) {
      if (r === SLOT.r && c === SLOT.c) continue;
      if (r === 4 && c > 1) continue; // última fila incompleta
      icons.push(glass(`g${r}-${c}`, X0 + c * PITCH_X, Y0 + r * PITCH_Y, 0.9));
    }
  const sx = X0 + SLOT.c * PITCH_X;
  const sy = Y0 + SLOT.r * PITCH_Y;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: 'radial-gradient(120% 70% at 85% 0%, #A200FF 0%, rgba(162,0,255,0) 60%), radial-gradient(110% 70% at 100% 100%, #E6007E 0%, rgba(230,0,126,0) 60%), linear-gradient(160deg, #2B0054 0%, #41027A 60%, #5A0690 100%)'}}>
      {icons}
      {/* SCHOT */}
      <div style={{position: 'absolute', left: sx * PT, top: sy * PT, width: ICON * PT, textAlign: 'center', transform: `scale(${(0.2 + 0.8 * pop).toFixed(3)})`, opacity: Math.min(1, pop * 1.5), transformOrigin: '50% 40%'}}>
        <Img src={staticFile('schot/brand/apple-touch-icon.png')} style={{width: ICON * PT, height: ICON * PT, borderRadius: 15 * PT, boxShadow: '0 10px 26px rgba(14,0,30,.45), 0 0 0 1px rgba(255,255,255,.15)'}} />
        <div style={{marginTop: 5 * PT, marginLeft: -20 * PT, marginRight: -20 * PT, fontFamily: '-apple-system, "Barlow", system-ui, sans-serif', fontWeight: 500, fontSize: 12 * PT, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,.4)'}}>SCHOT</div>
      </div>
      {/* Halo que marca el ícono recién agregado, con su nombre adentro */}
      <div style={{position: 'absolute', left: (sx - 14) * PT, top: (sy - 12) * PT, width: (ICON + 28) * PT, height: (ICON + 44) * PT, borderRadius: 24 * PT, border: '3px solid rgba(255,255,255,.85)', opacity: pr(f, tIcon + 8, 8) * (1 - pr(f, tIcon + 40, 14)), transform: `scale(${(1.15 - 0.15 * pr(f, tIcon + 8, 12)).toFixed(3)})`}} />
      {/* Dock */}
      <div style={{position: 'absolute', left: 12 * PT, right: 12 * PT, bottom: 14 * PT, height: 92 * PT, borderRadius: 34 * PT, background: 'rgba(255,255,255,.16)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.22)', backdropFilter: 'blur(18px)'}}>
        {[0, 1, 2, 3].map((c) => glass(`d${c}`, 15 + c * 87 - 12, 15, 0.95))}
      </div>
      <div style={{position: 'absolute', left: SCREEN_W / 2 - 40 * PT, top: SCREEN_H - 130 * PT, width: 80 * PT, height: 26 * PT, borderRadius: 13 * PT, background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: SANS, fontSize: 12 * PT, color: 'rgba(255,255,255,.9)'}}>
        <svg width={12 * PT} height={12 * PT} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        Buscar
      </div>
    </div>
  );
};

const Overlay: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  // La cápsula salta justo antes de que la voz diga la dirección (vacía se vería como un error).
  const pill = spring({frame: f - (tType0 - 7), fps, config: {damping: 12, stiffness: 150, mass: 0.9}});
  const eyebrow = pr(f, tUrl + 4, 14);
  // El objetivo («y agrégala a tu pantalla de inicio») aparece con el primer paso, antes de que la voz lo diga: quien
  // lo ve sin sonido sabe para qué son los pasos.
  const subIn = pr(f, tType1 + 4, 14);
  const end = pr(f, tEndCard + 8, 18);
  const blur = (p: number) => ((1 - p) * 12 > 0.3 ? `blur(${((1 - p) * 12).toFixed(1)}px)` : undefined);
  // Letras de la dirección: cada una salta en su lugar (las posiciones no se mueven mientras se escribe).
  const n = URL.length;
  const charAt = (i: number) => tType0 + ((tType1 - tType0) * i) / (n - 1);
  const chars = URL.split('').map((ch, i) => {
    const p = spring({frame: f - charAt(i), fps, config: {damping: 11, stiffness: 220, mass: 0.6}});
    const grad = i >= 17 && i <= 20; // «2026»
    return (
      <span
        key={i}
        style={{
          display: 'inline-block',
          opacity: Math.min(1, p * 2.2),
          transform: `translateY(${((1 - p) * 26).toFixed(1)}px) scale(${(0.5 + 0.5 * p).toFixed(3)})`,
          ...(grad ? {backgroundImage: 'linear-gradient(100deg, #8A00E6 0%, #E6007E 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'} : {}),
        }}
      >
        {ch}
      </span>
    );
  });
  const typing = f >= tType0 - 4 && f < tType1 + 10;
  const caretX = Math.min(n, Math.max(0, Math.floor(((f - tType0) / (tType1 - tType0)) * (n - 1)) + 1));
  return (
    <>
      <div style={{position: 'absolute', left: 40, right: 40, top: 150, textAlign: 'center', zIndex: 50}}>
        <div style={{opacity: eyebrow, transform: `translateY(${((1 - eyebrow) * 20).toFixed(1)}px)`, filter: blur(eyebrow), fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#C3AEF2'}}>Ábrela en tu celular</div>
        <div style={{marginTop: 18, display: 'inline-block', position: 'relative', padding: '20px 40px', borderRadius: 999, background: 'rgba(255,255,255,.97)', boxShadow: '0 20px 60px rgba(14,0,30,.45), 0 0 0 6px rgba(195,174,242,.25)', opacity: Math.min(1, pill * 2), transform: `scale(${(0.4 + 0.6 * pill).toFixed(4)}) rotate(${((1 - pill) * -6).toFixed(2)}deg)`}}>
          <span style={{position: 'relative', fontFamily: SANS, fontWeight: 800, fontSize: 60, letterSpacing: '-0.01em', color: '#2B0054', whiteSpace: 'nowrap'}}>
            {chars}
            {typing && Math.floor(f / 6) % 2 === 0 ? (
              <span style={{position: 'absolute', top: 8, bottom: 8, width: 4, borderRadius: 2, background: '#A200FF', left: `${((caretX / n) * 100).toFixed(2)}%`}} />
            ) : null}
          </span>
        </div>
        <div style={{marginTop: 26, opacity: subIn, transform: `translateY(${((1 - subIn) * 18).toFixed(1)}px)`, filter: blur(subIn), fontFamily: SANS, fontWeight: 600, fontSize: 44, color: '#fff'}}>
          y agrégala a tu <span style={{backgroundImage: GRAD_TEXT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>pantalla de inicio</span>
        </div>
      </div>
      <StepLabel />
      {/* Pie: sello y datos del congreso */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 64, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, opacity: end, transform: `translateY(${((1 - end) * 20).toFixed(1)}px)`, zIndex: 50}}>
        <Img src={staticFile('schot/brand/schot-sello-blanco.svg')} style={{width: 92, height: 92}} />
        <div style={{fontFamily: SANS, color: '#fff'}}>
          <div style={{fontWeight: 800, fontSize: 34, letterSpacing: '0.01em'}}>62º Congreso SCHOT</div>
          <div style={{fontWeight: 500, fontSize: 28, color: 'rgba(255,255,255,.8)'}}>Viña del Mar · 18–21 nov 2026</div>
        </div>
      </div>
    </>
  );
};

const iconBox = {x: X0 + SLOT.c * PITCH_X, y: Y0 + SLOT.r * PITCH_Y, w: ICON, h: ICON};

// Cámara: sigue lo que se toca, con el teléfono más grande que en el resto del cierre.
const SHOW = (box: {x: number; y: number; w: number; h: number}, z: number) => focus(box, z, {x: 540, y: 1250});
// Pose de los pasos: el teléfono entero, lo más grande posible bajo la etiqueta (borde de arriba en y≈526, bajo la
// etiqueta que termina en 520) y con la barra de Safari y la hoja de compartir completas abajo.
const FLOW = {x: 540, y: 1229, s: 1.06, r: 0};

export const cierre: SceneDef = {
  screens: [
    {at: sc.from, render: (f) => <InstallFlow f={f} />, enter: 'fade', enterDur: 16, ink: 'dark'},
    {at: tHome, render: (f) => <HomeScreen f={f} fps={30} />, enter: 'zoom', enterDur: 18, ink: 'light'},
    // Al tocar el ícono la app se abre como app: a pantalla completa, sin la barra de Safari.
    {at: tOpen, src: shot('programa'), enter: 'zoom', enterDur: 16, ink: 'dark'},
  ],
  cam: [
    {at: sc.from, dur: 30, pose: PHONE_POSE, ease: 'out'},
    // Durante los pasos el teléfono no se mueve: todo pasa dentro de la pantalla, como una grabación continua, y
    // cada cosa que se toca queda a la vista (si la cámara saltara de un elemento a otro, el movimiento desenfoca).
    {at: tGuide, dur: 24, pose: FLOW},
    // En la pantalla de inicio la cámara se acerca, despacio, al ícono nuevo.
    {at: tHome, dur: 26, pose: SHOW(iconBox, 1.3)},
    {at: tOpen + 2, dur: 22, pose: PHONE_POSE},
    {at: tEndCard - 16, dur: 26, pose: {...REST, y: 1215, s: 0.74}, ease: 'io'},
  ],
  taps: [
    {at: T.dots, ...TAPS.dots},
    {at: T.compartir, ...TAPS.compartir},
    {at: T.verMas, ...TAPS.verMas},
    {at: T.inicio, ...TAPS.inicio},
    {at: T.agregar, ...TAPS.agregar},
    {at: tTapIcon, x: iconBox.x + ICON / 2, y: iconBox.y + ICON / 2},
  ],
  badges: [{at: tIcon + 6, out: tEndCard - 6, x: 540, y: 1700, text: 'En Android, la app también te guía', icon: 'check', tone: 'glass', size: 32, r: 1, gain: 0.18}],
  bursts: [{at: tIcon + 2, ...toCanvas(SHOW(iconBox, 1.3), iconBox.x + ICON / 2, iconBox.y + ICON / 2), n: 12, r: 220, star: true}],
  Overlay,
  sfx: [
    {name: 'whoosh-soft', at: sc.from, gain: 0.25},
    {name: 'pop-hi', at: tType0 - 6, gain: 0.3},
    {name: 'click', at: T.dots, gain: 0.3},
    {name: 'pop-mid', at: T.menu + 1, gain: 0.16},
    {name: 'click', at: T.compartir, gain: 0.3},
    {name: 'swish', at: T.share, gain: 0.14},
    {name: 'click', at: T.verMas, gain: 0.3},
    {name: 'swish', at: T.expand, gain: 0.12},
    {name: 'click', at: T.inicio, gain: 0.3},
    {name: 'swish', at: T.add, gain: 0.14},
    {name: 'click', at: T.agregar, gain: 0.32},
    {name: 'whoosh-soft', at: tHome, gain: 0.2},
    {name: 'pop', at: tIcon, gain: 0.42},
    {name: 'sparkle', at: tIcon + 2, gain: 0.24},
    {name: 'click', at: tTapIcon, gain: 0.36},
    {name: 'whoosh-soft', at: tOpen, gain: 0.22},
    {name: 'logo', at: tEndCard - 4, gain: 0.5},
  ],
};
