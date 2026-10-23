import React from 'react';
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {beat, captionsOf, scenes} from '../timeline';
import {Box, focus, PT, REST, SCREEN_H, SCREEN_W, toCanvas} from '../ui/geometry';
import {GRAD_TEXT} from '../ui/Text';
import {Backdrop} from '../ui/Backdrop';
import {BurstView} from '../ui/Pop';
import type {Glow, Tap} from '../ui/Stage';
import {SceneDef, shot} from './types';

// Escena 10 · cierre. El teléfono muestra la app abierta en Safari; arriba, la dirección en una cápsula que salta y se
// escribe letra a letra mientras la voz la dice. «y agrégala a tu pantalla de inicio» → el proceso completo de iOS 26
// dentro del teléfono, como una grabación de pantalla continua (sin capturas sueltas): ⋯ → «Compartir» → «Ver más» →
// «Agregar a Inicio» → «Agregar». Cada paso tiene su etiqueta numerada arriba, un marco que señala lo que hay que
// tocar y el dedo que lo toca. Al agregar, Safari se cierra, la pantalla de inicio recibe el ícono de SCHOT, se toca y
// la app se abre creciendo desde el ícono. Termina en la tarjeta final (dirección, sello y datos del congreso) sin
// fundido a negro: WhatsApp se queda en el último cuadro, que tiene que dejar la dirección legible.
const sc = scenes.cierre;
const URL = 'app.congresoschot2026.com';
const tUrl = beat('cierre', 'Entra') - 4;
const urlWord = captionsOf('cierre').flatMap((c) => c.words).find((w) => w.text.includes('congresoschot'));
const tType0 = urlWord ? urlWord.from : tUrl + 18;
const tType1 = urlWord ? Math.min(urlWord.to - 8, tType0 + 75) : tType0 + 70;
// Los pasos. Para un público de 50 a 70 años cada uno da tiempo de leer la etiqueta y encontrar el botón: la etiqueta
// y el marco aparecen ~40 cuadros (1,3 s) antes del toque, y la pantalla responde 6 cuadros después del toque, cuando
// el anillo del dedo ya se apagó (si no, quedaría sobre lo que sube).
const tGuide = beat('cierre', 'agrégala') - 2;
const T = {
  dots: tGuide + 40, // toque en ⋯
  menu: tGuide + 46, // se abre el menú
  compartir: tGuide + 98, // toque en «Compartir»
  share: tGuide + 104, // sube la hoja de compartir
  verMas: tGuide + 158, // toque en «Ver más»
  expand: tGuide + 164, // la hoja se expande con la lista
  inicio: tGuide + 220, // toque en «Agregar a Inicio»
  add: tGuide + 226, // sube la hoja «Agregar a Inicio»
  agregar: tGuide + 282, // toque en «Agregar»
};
const tHome = T.agregar + 8; // Safari se cierra encogiéndose y queda la pantalla de inicio, como en iOS
const CLOSE_DUR = 18;
const tIcon = tHome + 44; // el ícono aparece cuando la cámara ya terminó de acercarse
const tTapIcon = tIcon + 44; // se lee la etiqueta y se ve el ícono quieto antes del toque
const tOpen = tTapIcon + 4; // la app se abre creciendo desde el ícono, sin la barra de Safari
const OPEN_DUR = 18;
const tEndCard = tOpen + 40; // la app abierta se alcanza a ver
// Final: el teléfono se funde en el fondo y salta el sello de SCHOT con el sonido de la apertura (lo pidió Nicolás).
// Cae en el corte de la música (89,5 s, cuadro 2686, con la edición actual, el tiempo fuerte donde se detiene el ritmo); si cambia la
// duración de las escenas anteriores, volver a medirlo.
const tLogo = tEndCard + 63;
// La etiqueta de arriba: un solo texto que cambia con cada paso (los de la guía de la app).
const LABELS: Array<{at: number; n?: number; text: string}> = [
  {at: tGuide, n: 1, text: 'Toca el botón ⋯'},
  {at: T.menu + 12, n: 2, text: 'Toca «Compartir»'},
  {at: T.share + 12, n: 3, text: 'Toca «Ver más»'},
  {at: T.expand + 14, n: 4, text: 'Toca «Agregar a Inicio»'},
  {at: T.add + 14, n: 5, text: 'Toca «Agregar»'},
  // El resultado entra apenas se cerró Safari, mientras la cámara se acerca al lugar del ícono (no queda la instrucción
  // «Toca «Agregar»» sobre la pantalla de inicio).
  {at: tHome + CLOSE_DUR, text: 'El ícono SCHOT queda en tu pantalla de inicio'},
];
const PHONE_POSE = {...REST, y: 1330, s: 0.86};

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ios = Easing.bezier(0.32, 0.72, 0, 1);
const io = Easing.inOut(Easing.cubic);
// Cierre y apertura de la app: arranque suave y llegada larga (la curva de iOS arranca de golpe y se ve como un salto).
const smooth = Easing.bezier(0.45, 0, 0.12, 1);
const pr = (f: number, a: number, d: number, e = ios) => interpolate(f, [a, a + d], [0, 1], {...clampOpt, easing: e});
const SANS = '"Barlow", system-ui, sans-serif';

// ---------- el flujo de instalación dentro del teléfono ----------
// Las capturas de la guía miden 720 px de ancho (la parte de abajo de la pantalla del iPhone): 1 px = 390/720 pt.
// Las posiciones en px de cada botón se midieron sobre esas capturas.
const GS = 390 / 720;
// La barra de Safari, abajo. Su captura trae arriba media fila de textos de la barra de pestañas de la app: se recorta
// desde debajo de esos textos y la barra tapa la de la captura de la página (si no, se verían dos barras).
const BAR = {sy: 24, sh: 174};
const BAR_Y = 844 - BAR.sh * GS - 4;
const MENU = {sx: 212, sy: 32, sw: 446, sh: 693}; // el menú del botón ⋯ en su captura (px)
const MENU_Y = BAR_Y - 6 - MENU.sh * GS; // pt: el menú queda justo sobre la barra
// La hoja de compartir y, debajo, la lista que aparece con «Ver más» (de la captura de la hoja expandida). La lista se
// pega a la hoja a la altura `JOIN` de la hoja (entre los botones redondos y sus nombres), que corresponde a `LIST.sy`
// de la captura expandida: así la fila de nombres pasa a ser la real («Ver menos») y la hoja expandida queda continua,
// sin el borde redondeado de la hoja chica.
const SHEET = {sx: 18, sy: 78, sw: 682, sh: 698}; // la hoja de compartir (px)
const JOIN = 683;
const LIST = {sx: 18, sy: 38, sw: 682, sh: 738}; // desde la fila de nombres de los botones hasta abajo (px)
const SHEET_Y = 844 - SHEET.sh * GS; // pt
const LIST_IN = (JOIN - SHEET.sy) * GS; // pt: dónde empieza la lista dentro de la hoja
const EXPAND = (LIST.sh - (SHEET.sy + SHEET.sh - JOIN)) * GS; // cuánto sube la hoja al expandirse (pt)
const ADD = {sx: 0, sy: 38, sw: 720, sh: 738}; // la hoja «Agregar a Inicio» (px)
const ADD_Y = 52; // pt
const guia = (img: string) => staticFile(`schot/guia/${img}`);
// Punto (px de cada captura) → pt de la pantalla, ya con cada pieza en su lugar final.
const onBar = (x: number, y: number) => ({x: x * GS, y: BAR_Y + (y - BAR.sy) * GS});
const onMenu = (x: number, y: number) => ({x: x * GS, y: MENU_Y + (y - MENU.sy) * GS});
const onSheet = (x: number, y: number) => ({x: x * GS, y: SHEET_Y + (y - SHEET.sy) * GS});
const onList = (x: number, y: number) => ({x: x * GS, y: SHEET_Y - EXPAND + LIST_IN + (y - LIST.sy) * GS});
const onAdd = (x: number, y: number) => ({x: x * GS, y: ADD_Y + (y - ADD.sy) * GS});
const boxOf = (p: {x: number; y: number}, w: number, h: number): Box => ({x: p.x, y: p.y, w: w * GS, h: h * GS});

// Un recorte de una captura de la guía dibujado en (x, y) pt de la pantalla.
const GuideCrop: React.FC<{img: string; c: {sx: number; sy: number; sw: number; sh: number}; x: number; y: number; radius?: string; style?: React.CSSProperties}> = ({img, c, x, y, radius, style}) => (
  <div style={{position: 'absolute', left: x * PT, top: y * PT, width: c.sw * GS * PT, height: c.sh * GS * PT, overflow: 'hidden', borderRadius: radius, ...style}}>
    <Img src={guia(img)} style={{position: 'absolute', left: -c.sx * GS * PT, top: -c.sy * GS * PT, width: 720 * GS * PT}} />
  </div>
);

const InstallFlow: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  // menú: crece desde el botón ⋯ y se va apenas se toca «Compartir» (antes de que suba la hoja: sin doble imagen)
  const m = spring({frame: f - T.menu, fps, config: {damping: 18, stiffness: 220, mass: 0.7}});
  const mOut = pr(f, T.compartir + 1, 5, Easing.out(Easing.quad));
  // hoja de compartir: sube; al expandirse, sube con la lista; se va cuando sube «Agregar a Inicio»
  const sh = pr(f, T.share, 16);
  const ex = pr(f, T.expand, 18);
  const swap = pr(f, T.expand, 6, io); // la fila de nombres y el borde de la hoja chica dan paso a la lista
  const shOut = pr(f, T.add, 12, Easing.in(Easing.quad));
  // hoja «Agregar a Inicio»: sube y se queda hasta que Safari se cierra
  const ad = pr(f, T.add, 18);
  const dim = 0.22 * Math.max(sh * (1 - shOut), ad);
  const sheetH = LIST_IN + LIST.sh * GS;
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
        // que sube al expandirse, así que se ve igual que la hoja normal; al expandirse sube y aparece la lista.
        <div style={{position: 'absolute', left: SHEET.sx * GS * PT, top: (SHEET_Y - EXPAND) * PT, width: SHEET.sw * GS * PT, height: sheetH * PT, borderRadius: `${24 * PT}px ${24 * PT}px 0 0`, overflow: 'hidden', transform: `translateY(${(((1 - sh) * (SHEET.sh * GS + 30) + (1 - ex) * EXPAND + shOut * 300) * PT).toFixed(1)}px)`, opacity: 1 - shOut * 0.6, boxShadow: '0 -10px 40px rgba(14,0,30,.2)'}}>
          <GuideCrop img="ios26-4-lista.jpg" c={LIST} x={0} y={LIST_IN} />
          {/* La hoja chica: arriba hasta la unión (con un borde difuso de 7 px para que no se note el cambio de tono) y
              abajo su fila de nombres con «Ver más» y su borde redondeado, que se apagan al expandirse. */}
          <GuideCrop img="ios26-3-compartir.jpg" c={{...SHEET, sh: JOIN + 7 - SHEET.sy}} x={0} y={0} style={{WebkitMaskImage: `linear-gradient(180deg, #000 calc(100% - ${(7 * GS * PT).toFixed(1)}px), transparent)`, maskImage: `linear-gradient(180deg, #000 calc(100% - ${(7 * GS * PT).toFixed(1)}px), transparent)`}} />
          {swap < 1 ? <GuideCrop img="ios26-3-compartir.jpg" c={{...SHEET, sy: JOIN, sh: SHEET.sy + SHEET.sh - JOIN}} x={0} y={LIST_IN} style={{opacity: 1 - swap}} /> : null}
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

// Dónde se toca en cada paso (pt de la pantalla). En las filas de menú y lista el dedo va sobre el ícono de la fila, no
// sobre la palabra que dice la etiqueta, para que se siga leyendo.
const TAPS = {
  dots: onBar(616, 94),
  compartir: onMenu(284, 88),
  verMas: onSheet(597, 615),
  inicio: onList(86, 461),
  agregar: onAdd(605, 108),
};
// El marco que señala qué tocar, desde que aparece la etiqueta del paso hasta el toque.
const TARGETS: Array<{box: Box; radius: number}> = [
  {box: boxOf(onBar(573, 51), 86, 86), radius: 43 * GS},
  {box: boxOf(onMenu(236, 56), 404, 64), radius: 12},
  {box: boxOf(onSheet(528, 546), 140, 176), radius: 22},
  {box: boxOf(onList(34, 418), 652, 84), radius: 12},
  {box: boxOf(onAdd(516, 66), 178, 84), radius: 42 * GS},
];
const STEP_TAPS = [T.dots, T.compartir, T.verMas, T.inicio, T.agregar];
// Cada marco aparece cuando la pantalla de ese paso ya está quieta (su etiqueta + 4) y se apaga mientras el dedo llega (sin quedar sobre lo que se mueve después del toque).
const GLOWS: Glow[] = TARGETS.map((t, i) => ({at: LABELS[i].at + 4, until: STEP_TAPS[i] - 4, box: t.box, radius: t.radius}));

// La etiqueta del paso, arriba del teléfono. Los pasos 1 a 5 usan una cápsula de ancho fijo y el texto cambia con un
// fundido cruzado en el mismo lugar: el que sale y el que entra usan la misma ventana, así que sus opacidades suman 1
// y la cápsula nunca queda vacía. Para el resultado final la cápsula se ensancha antes del cambio de texto.
const W_STEP = 700;
const W_DONE = 930;
const StepLabel: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < LABELS[0].at - 2 || f > tEndCard) return null;
  const out = pr(f, tEndCard - 14, 12);
  const first = spring({frame: f - LABELS[0].at, fps, config: {damping: 15, stiffness: 120}});
  const last = LABELS[LABELS.length - 1];
  const w = interpolate(f, [last.at - 16, last.at - 6], [W_STEP, W_DONE], {...clampOpt, easing: io});
  // Visibilidad de cada etiqueta: entra en [at−6, at] y sale en [siguiente−6, siguiente].
  const vis = LABELS.map((l, k) => {
    const next = LABELS[k + 1];
    const vin = k === 0 ? 1 : pr(f, l.at - 6, 6, io);
    const vout = next ? pr(f, next.at - 6, 6, io) : 0;
    return {v: vin * (1 - vout), vin, vout};
  });
  // «en iPhone» queda fijo durante los pasos y se va mientras la cápsula se ensancha, antes del texto final (su espacio
  // se libera de a poco: el texto final nunca queda cortado).
  const iPhone = 1 - pr(f, last.at - 16, 8, io);
  const stack: React.CSSProperties = {gridArea: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center'};
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 424, display: 'flex', justifyContent: 'center', zIndex: 50, opacity: Math.min(1, first * 2) * (1 - out), transform: `scale(${(0.7 + 0.3 * first).toFixed(4)})`}}>
      <div style={{position: 'relative', width: w, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 16, padding: '12px 30px 12px 14px', borderRadius: 999, background: '#fff', boxShadow: '0 16px 40px rgba(14,0,30,.4), 0 0 0 6px rgba(195,174,242,.28)'}}>
        <span style={{flex: 'none', width: 58, height: 58, borderRadius: 29, display: 'grid', background: 'linear-gradient(135deg, #8A00E6, #E6007E)', color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 32}}>
          {LABELS.map((l, k) =>
            vis[k].v > 0.001 ? (
              <span key={k} style={{...stack, opacity: vis[k].v, transform: `translateY(${((1 - vis[k].vin) * 22 - vis[k].vout * 22).toFixed(1)}px)`}}>
                {l.n ?? (
                  <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </span>
            ) : null,
          )}
        </span>
        {/* El texto sube al cambiar (el que sale sube y se va, el que entra sube desde abajo): se lee como un rodillo y
            no como dos textos encimados. */}
        <span style={{flex: 1, minWidth: 0, marginRight: 150 * iPhone, display: 'grid', overflow: 'hidden'}}>
          {LABELS.map((l, k) =>
            vis[k].v > 0.001 ? (
              <span key={k} style={{...stack, fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#2B0054', whiteSpace: 'nowrap', opacity: vis[k].v, transform: `translateY(${((1 - vis[k].vin) * 22 - vis[k].vout * 22).toFixed(1)}px)`}}>
                {l.text}
              </span>
            ) : null,
          )}
        </span>
        {iPhone > 0.001 ? <span style={{position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)', fontFamily: SANS, fontWeight: 700, fontSize: 30, color: '#5E4D7A', whiteSpace: 'nowrap', opacity: iPhone}}>en iPhone</span> : null}
      </div>
    </div>
  );
};

// Pantalla de inicio de iOS dibujada en código: fondo azul violeta (se distingue del fondo de marca del video), íconos
// de colores sin marca (otras apps) y el ícono real de SCHOT que aparece con un resorte en `tIcon`. Encima, al llegar,
// Safari se cierra encogiéndose; al tocar el ícono, la app se abre creciendo desde él.
const COLS = 4;
const ICON = 62; // pt
const X0 = 27;
const PITCH_X = (390 - 2 * X0 - ICON) / (COLS - 1);
const Y0 = 78;
const PITCH_Y = 96;
const SLOT = {c: 2, r: 4}; // donde queda SCHOT: después de la última app, como en la captura real (ios26-6-inicio)
const TILE_COLORS = ['#3D7BF2', '#2FB86A', '#F2A33A', '#E5534B', '#8E6CF0', '#1FB5C9', '#F07A3A', '#7A8597', '#E8C33A', '#26A88C', '#5A64E8', '#E0609E', '#4C9BE8', '#9AA3B2', '#38B2A0', '#D9784F', '#6F7CF2', '#C9A13A', '#3FA2D9', '#B46CE0'];
const iconBox = {x: X0 + SLOT.c * PITCH_X, y: Y0 + SLOT.r * PITCH_Y, w: ICON, h: ICON};
const HomeScreen: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const pop = spring({frame: f - tIcon, fps, config: {damping: 11, stiffness: 150}});
  // Toque en el ícono: se hunde y se oscurece un instante, como en iOS.
  const press = pr(f, tTapIcon - 1, 3, io) * (1 - pr(f, tTapIcon + 3, 5, io));
  // Safari se cierra: la página se encoge hacia abajo y se apaga; la pantalla de inicio se asienta (de 1,06 a 1).
  const close = pr(f, tHome, CLOSE_DUR, smooth);
  const home = 1.06 - 0.06 * close;
  // La app se abre: un rectángulo opaco crece desde el ícono hasta la pantalla completa, con la app adentro; el ícono
  // queda encima al principio y se funde en la app (según el avance, no por cuadros: nunca se ve a través).
  const open = pr(f, tOpen, OPEN_DUR, smooth);
  const iconFade = interpolate(open, [0.12, 0.42], [1, 0], {...clampOpt, easing: io});
  const tile = (key: string, x: number, y: number, k: number) => (
    <div
      key={key}
      style={{
        position: 'absolute',
        left: x * PT,
        top: y * PT,
        width: ICON * PT,
        height: ICON * PT,
        borderRadius: 15 * PT,
        background: `linear-gradient(160deg, ${TILE_COLORS[k % TILE_COLORS.length]}, ${TILE_COLORS[(k + 7) % TILE_COLORS.length]})`,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18), 0 6px 18px rgba(10,10,40,.3)',
        opacity: 0.92,
      }}
    />
  );
  const icons: React.ReactNode[] = [];
  let k = 0;
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < COLS; c++) {
      if (r === SLOT.r && c === SLOT.c) continue;
      if (r === 4 && c > 1) continue; // última fila incompleta
      icons.push(tile(`g${r}-${c}`, X0 + c * PITCH_X, Y0 + r * PITCH_Y, k++));
    }
  const {x: sx, y: sy} = iconBox;
  const ox = interpolate(open, [0, 1], [sx, 0]);
  const oy = interpolate(open, [0, 1], [sy, 0]);
  const ow = interpolate(open, [0, 1], [ICON, 390]);
  const oh = interpolate(open, [0, 1], [ICON, 844]);
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: 'radial-gradient(90% 60% at 80% 5%, #6C7BFF 0%, rgba(108,123,255,0) 60%), radial-gradient(90% 60% at 10% 100%, #7A4CC8 0%, rgba(122,76,200,0) 60%), linear-gradient(165deg, #142266 0%, #233A9A 50%, #3B3FB0 100%)'}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${home.toFixed(4)})`}}>
        {icons}
        {/* SCHOT */}
        <div style={{position: 'absolute', left: sx * PT, top: sy * PT, width: ICON * PT, textAlign: 'center', transform: `scale(${((0.2 + 0.8 * pop) * (1 - 0.1 * press)).toFixed(3)})`, opacity: Math.min(1, pop * 1.5), transformOrigin: '50% 40%'}}>
          <div style={{position: 'relative', width: ICON * PT, height: ICON * PT}}>
            <Img src={staticFile('schot/brand/apple-touch-icon.png')} style={{width: ICON * PT, height: ICON * PT, borderRadius: 15 * PT, boxShadow: '0 10px 26px rgba(14,0,30,.45), 0 0 0 1px rgba(255,255,255,.15)'}} />
            {press > 0.001 ? <div style={{position: 'absolute', inset: 0, borderRadius: 15 * PT, background: `rgba(0,0,0,${(0.28 * press).toFixed(3)})`}} /> : null}
          </div>
          <div style={{marginTop: 5 * PT, marginLeft: -20 * PT, marginRight: -20 * PT, fontFamily: '-apple-system, "Barlow", system-ui, sans-serif', fontWeight: 500, fontSize: 12 * PT, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,.4)'}}>SCHOT</div>
        </div>
        {/* Halo que marca el ícono recién agregado, con su nombre adentro; se va antes del toque */}
        <div style={{position: 'absolute', left: (sx - 14) * PT, top: (sy - 12) * PT, width: (ICON + 28) * PT, height: (ICON + 44) * PT, borderRadius: 24 * PT, border: '3px solid rgba(255,255,255,.85)', opacity: pr(f, tIcon + 8, 8) * (1 - pr(f, tIcon + 28, 10)), transform: `scale(${(1.15 - 0.15 * pr(f, tIcon + 8, 12)).toFixed(3)})`}} />
        {/* Dock */}
        <div style={{position: 'absolute', left: 12 * PT, right: 12 * PT, bottom: 14 * PT, height: 92 * PT, borderRadius: 34 * PT, background: 'rgba(255,255,255,.16)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.22)'}}>
          {[0, 1, 2, 3].map((c) => tile(`d${c}`, 21.5 + c * 87, 15, 3 + c * 5))}
        </div>
        <div style={{position: 'absolute', left: SCREEN_W / 2 - 40 * PT, top: SCREEN_H - 130 * PT, width: 80 * PT, height: 26 * PT, borderRadius: 13 * PT, background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: SANS, fontSize: 12 * PT, color: 'rgba(255,255,255,.9)'}}>
          <svg width={12 * PT} height={12 * PT} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          Buscar
        </div>
      </div>
      {close < 1 ? (
        <div style={{position: 'absolute', inset: 0, overflow: 'hidden', transform: `scale(${(1 - 0.84 * close).toFixed(4)})`, transformOrigin: '50% 92%', borderRadius: 60 * close * PT, opacity: 1 - interpolate(close, [0.5, 1], [0, 1], {...clampOpt, easing: io}), boxShadow: '0 20px 60px rgba(10,10,40,.4)'}}>
          <InstallFlow f={f} />
        </div>
      ) : null}
      {f >= tOpen ? (
        <div style={{position: 'absolute', left: ox * PT, top: oy * PT, width: ow * PT, height: oh * PT, overflow: 'hidden', borderRadius: interpolate(open, [0, 1], [15, 0]) * PT, background: '#F9F6FC', boxShadow: '0 20px 60px rgba(10,10,40,.4)'}}>
          <Img src={staticFile(shot('programa'))} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: (844 / 390) * ow * PT}} />
          {iconFade > 0.001 ? <Img src={staticFile('schot/brand/apple-touch-icon.png')} style={{position: 'absolute', left: 0, top: 0, width: ow * PT, height: ow * PT, opacity: iconFade}} /> : null}
        </div>
      ) : null}
    </div>
  );
};

const Overlay: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  // La cápsula salta justo antes de que la voz diga la dirección (vacía se vería como un error).
  const pill = spring({frame: f - (tType0 - 7), fps, config: {damping: 12, stiffness: 150, mass: 0.9}});
  const eyebrow = pr(f, tUrl + 4, 14);
  // El objetivo («y agrégala a tu pantalla de inicio») aparece al terminar de escribirse la dirección, antes de que la
  // voz lo diga: quien lo ve sin sonido sabe para qué son los pasos.
  const subIn = pr(f, tType1 + 4, 14);
  const end = pr(f, tEndCard + 8, 18);
  const note = pr(f, tEndCard + 20, 14, io);
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
      {/* En la tarjeta final, bajo «y agrégala a tu pantalla de inicio»: el resto de lo que dice la voz, para quien lo ve
          sin sonido (en el cierre no hay subtítulos). */}
      <div style={{position: 'absolute', left: 40, right: 40, top: 408, textAlign: 'center', zIndex: 50, opacity: end, transform: `translateY(${((1 - end) * 12).toFixed(1)}px)`, fontFamily: SANS, fontWeight: 600, fontSize: 44, color: '#fff'}}>para usarla como una app</div>
      {/* En la tarjeta final, donde estuvieron los pasos: la nota para Android, quieta y sin sonido. Antes aparecía junto
          al ícono, el momento más cargado, y quedaba sobre la app al abrirse. Se queda hasta el último cuadro. */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 492, display: 'flex', justifyContent: 'center', zIndex: 50, opacity: note, transform: `translateY(${((1 - note) * 12).toFixed(1)}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '10px 28px 10px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.28)'}}>
          <span style={{width: 48, height: 48, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #8A00E6, #E6007E)'}}>
            <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 38, color: '#fff', whiteSpace: 'nowrap'}}>En Android, la app también te guía</span>
        </div>
      </div>
      {/* Pie: sello y datos del congreso (deja su lugar al sello grande del final) */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 64, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, opacity: end * (1 - pr(f, tLogo - 14, 12)), transform: `translateY(${((1 - end) * 20).toFixed(1)}px)`, zIndex: 50}}>
        <Img src={staticFile('schot/brand/schot-sello-blanco.svg')} style={{width: 92, height: 92}} />
        <div style={{fontFamily: SANS, color: '#fff'}}>
          <div style={{fontWeight: 800, fontSize: 34, letterSpacing: '0.01em'}}>62º Congreso SCHOT</div>
          <div style={{fontWeight: 500, fontSize: 28, color: 'rgba(255,255,255,.8)'}}>Viña del Mar · 18–21 nov 2026</div>
        </div>
      </div>
      <LogoFinale />
    </>
  );
};

// El sello de SCHOT salta al final: el fondo del video (el mismo Backdrop) cubre el teléfono y el sello entra con un
// resorte que se pasa un poco y vuelve, con su luz; debajo, el nombre y la fecha del congreso. La dirección de arriba se
// queda: el último cuadro es la miniatura de WhatsApp.
const LogoFinale: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < tLogo - 16) return null;
  const curtain = pr(f, tLogo - 14, 14, io);
  const p = spring({frame: f - tLogo, fps, config: {damping: 10, stiffness: 140, mass: 0.8}});
  const glow = pr(f, tLogo, 20) * (0.85 + 0.15 * Math.sin((f - tLogo) / 9));
  const rise = (at: number) => {
    const t = pr(f, at, 14);
    return {opacity: t, transform: `translateY(${((1 - t) * 22).toFixed(1)}px)`} as React.CSSProperties;
  };
  const D = 460;
  const Y = 1080;
  return (
    <>
      <div style={{position: 'absolute', inset: 0, zIndex: 48, opacity: curtain}}>
        <Backdrop plexus veil="top" turn={26} />
      </div>
      {/* El estallido va aquí, sobre el fondo que tapa el teléfono (los de FxLayer quedan debajo). */}
      <div style={{position: 'absolute', inset: 0, zIndex: 49}}>
        <BurstView d={{at: tLogo + 2, x: 540, y: Y, n: 16, r: 380, star: true}} f={f} />
      </div>
      {f >= tLogo - 1 ? (
        <div style={{position: 'absolute', left: 540 - D / 2, top: Y - D / 2, width: D, height: D, zIndex: 49, transform: `scale(${(0.2 + 0.8 * p).toFixed(4)}) rotate(${((1 - p) * -12).toFixed(2)}deg)`, opacity: Math.min(1, p * 2)}}>
          <div style={{position: 'absolute', inset: -190, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(195,174,242,.5), rgba(162,0,255,.2) 55%, rgba(162,0,255,0))', opacity: glow}} />
          <Img src={staticFile('schot/brand/schot-sello-blanco.svg')} style={{position: 'absolute', inset: 0, width: D, height: D}} />
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 0, right: 0, top: Y + D / 2 + 44, textAlign: 'center', zIndex: 49, fontFamily: SANS, color: '#fff'}}>
        <div style={{fontWeight: 800, fontSize: 84, lineHeight: 1.05, letterSpacing: '-0.01em', ...rise(tLogo + 10)}}>62º Congreso SCHOT</div>
        <div style={{marginTop: 14, fontWeight: 500, fontSize: 40, color: 'rgba(255,255,255,.86)', ...rise(tLogo + 16)}}>Viña del Mar · 18–21 nov 2026</div>
      </div>
    </>
  );
};

// SHOW: acercamiento al ícono nuevo en la pantalla de inicio.
const SHOW = (box: Box, z: number) => focus(box, z, {x: 540, y: 1250});
// Pose de los pasos: el teléfono entero, lo más grande posible bajo la etiqueta (borde de arriba en y≈526) y con la
// barra de Safari y la hoja de compartir completas abajo. No se mueve durante los pasos: todo pasa dentro de la
// pantalla, como una grabación continua (si la cámara saltara de un botón a otro, el movimiento desenfoca).
const FLOW = {x: 540, y: 1229, s: 1.06, r: 0};
const ICON_POSE = SHOW(iconBox, 1.3);
const END_POSE = {...REST, y: 1215, s: 0.74};
const iconAt = toCanvas(ICON_POSE, iconBox.x + ICON / 2, iconBox.y + ICON / 2);
const stepTap = (at: number, p: {x: number; y: number}): Tap => ({at, ...p, fade: 5, dot: 0.35});

export const cierre: SceneDef = {
  screens: [
    {at: sc.from, render: (f) => <InstallFlow f={f} />, enter: 'fade', enterDur: 16, ink: 'dark'},
    {at: tHome, render: (f) => <HomeScreen f={f} />, enter: 'cut', ink: 'light'},
    // La misma pantalla otra vez (el fundido entre dos iguales no se ve): solo para que la barra de estado pase a tinta
    // oscura mientras la app crece desde el ícono y llega arriba, y no quede blanca sobre la app blanca.
    {at: tOpen, render: (f) => <HomeScreen f={f} />, enter: 'fade', enterDur: OPEN_DUR, ink: 'dark'},
    // Al terminar de crecer desde el ícono queda la app abierta como app: a pantalla completa, sin la barra de Safari.
    {at: tOpen + OPEN_DUR, src: shot('programa'), enter: 'cut', ink: 'dark'},
  ],
  cam: [
    {at: sc.from, dur: 30, pose: PHONE_POSE, ease: 'out'},
    // El teléfono se acerca cuando ya se escribió la dirección y queda quieto antes del primer paso.
    {at: tGuide - 24, dur: 24, pose: FLOW, blur: 0.3},
    // En la pantalla de inicio, cuando Safari ya se cerró, la cámara se acerca despacio al lugar del ícono nuevo.
    {at: tHome + 12, dur: 36, pose: ICON_POSE, blur: 0.3},
    // Con la app ya abierta, el teléfono se aleja hasta la pose de la tarjeta final.
    {at: tOpen + OPEN_DUR + 2, dur: 40, pose: END_POSE, blur: 0.3},
  ],
  taps: [
    stepTap(T.dots, TAPS.dots),
    stepTap(T.compartir, TAPS.compartir),
    stepTap(T.verMas, TAPS.verMas),
    stepTap(T.inicio, TAPS.inicio),
    stepTap(T.agregar, TAPS.agregar),
    // El toque del ícono: un anillo más grande que el ícono (el de siempre coincidiría con el sello blanco del logo).
    {at: tTapIcon, x: iconBox.x + ICON / 2, y: iconBox.y + ICON / 2, size: 1.75, fade: 4, dot: 0.3},
  ],
  glows: GLOWS,
  bursts: [
    {at: tIcon + 2, ...iconAt, n: 12, r: 220, star: true},
  ],
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
    {name: 'logo', at: tLogo, gain: 0.55}, // el mismo sonido del sello de la apertura
  ],
};
