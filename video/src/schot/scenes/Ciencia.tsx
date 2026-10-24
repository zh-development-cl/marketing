import React from 'react';
import {Img, staticFile} from 'remotion';
import {beat, scenes} from '../timeline';
import {bx, bxFull} from '../shots';
import {REST, toCanvas} from '../ui/geometry';
import {Headline} from '../ui/Text';
import type {LiftDef} from '../ui/Pop';
import {SceneDef, shot} from './types';
import {dipIn, dipOut} from './Intro';

// Escena 8 · ciencia. La pestaña Ciencia real (Rodilla, «Destacados»). «trabajos seleccionados» → halo sobre «Trabajos
// libres seleccionados por el comité científico del 62º Congreso». El teléfono se aleja y, ya quieto, con «abstracts,
// e-pósters y videos» salta una pieza real por palabra, cada una desde su lugar en la pantalla: la tarjeta del primer
// trabajo (#458) se levanta, llega arriba y ahí se vuelve su resumen; un e-póster (#266, el PDF que la app dibuja) sale de la
// pestaña «E-pósters» y la tarjeta de un video (#248), de «Videos». Las tres quedan juntas un momento y se encogen
// hacia la expo. El póster es de columna aunque la lista es de Rodilla: en la app ningún e-póster tiene especialidad
// todavía y todos salen en todas; los de rodilla con PDF traen fotos de cirugía o logos grandes de clínicas.
// Dura tres compases exactos de la música (112 bpm): la pista se alarga con tres compases repetidos y la expo y el
// cierre siguen sonando como antes.
const sc = scenes.ciencia;
const tGlow = beat('ciencia', 'trabajos') - 2;
// El teléfono termina de alejarse antes de que la primera tarjeta se levante (si no, sale de un blanco en movimiento).
const tRecede = beat('ciencia', 'abstracts') - 22;
const tAbs = beat('ciencia', 'abstracts') - 4;
const tPoster = beat('ciencia', 'e-pósters') - 4;
const tVideo = beat('ciencia', 'videos') - 4;
const tOut = sc.to - 18;

const subtitulo = bx('ciencia', 'subtitulo', {x: 16, y: 98, w: 358, h: 40});
const primerTrabajo = bx('ciencia', 'primerTrabajo', {x: 17, y: 477.1, w: 356, h: 168});
const vistaEposters = bx('ciencia', 'vistaEposters', {x: 195, y: 338.1, w: 87.5, h: 48});
const vistaVideos = bx('ciencia', 'vistaVideos', {x: 282.5, y: 338.1, w: 87.5, h: 48});
const resumen = bxFull('ciencia-resumen', 'resumenInicio', {x: 6, y: 1191, w: 378, h: 185});
const poster = bxFull('ciencia-poster', 'poster', {x: 16, y: 471.8, w: 358, h: 636.3});
const video = bx('ciencia-video', 'video', {x: 16, y: 440.1, w: 358, h: 201.4});

const RECEDE = {...REST, s: 0.88, y: REST.y + 60, rx: 14};
// El póster y el video nacen chicos en su pestaña (con el teléfono ya alejado) y crecen hasta su lugar, delante del
// teléfono: el resumen arriba y ancho (es texto: tiene que alcanzar a leerse); debajo, el póster (alto) a la izquierda y
// el video a la derecha, casi encima de la pestaña «Videos», que así queda a la vista hasta que el video sale de ella.
const fromBox = (b: {x: number; y: number; w: number; h: number}, to: {k: number; r: number}) => {
  const c = toCanvas(RECEDE, b.x + b.w / 2, b.y + b.h / 2);
  return {x: c.x, y: c.y, k: to.k * 0.18, r: to.r - 8};
};
const piece = (at: number, out: number, box: LiftDef['box'], src: string, origin: LiftDef['box'], to: {x: number; y: number; k: number; r: number}, extra: Partial<LiftDef> = {}): LiftDef => ({
  at,
  out,
  box,
  src,
  from: fromBox(origin, to),
  to: {...to, rx: 6, ry: (to.x < 540 ? 1 : -1) * 8},
  exit: 'pop',
  exitDur: 13,
  radius: 18,
  ring: true,
  scrim: 0.35,
  dim: false,
  shine: false,
  stiffness: 110,
  damping: 16,
  ...extra,
});

const ABS_TO = {x: 540, y: 750, k: 1.55, r: -2};
const POSTER_TO = {x: 300, y: 1310, k: 1.15, r: -3};
const VIDEO_TO = {x: 770, y: 1290, k: 1.3, r: 3};

// La tarjeta del trabajo #458 se levanta de la lista tal cual (centrada en el recorte del resumen, que mide casi lo
// mismo), llega arriba todavía como tarjeta y, ya quieta y nítida, se funde en su resumen (antes de que salga el
// póster): así se ve que el resumen es de ese trabajo. Mientras vuela, la estela es más corta (maxBlur) para que se
// siga leyendo como la tarjeta.
const cardIntoAbstract = (f: number, k: number) => {
  const t = Math.min(1, Math.max(0, (f - tAbs - 12) / 10));
  const cx = primerTrabajo.x + primerTrabajo.w / 2 - resumen.w / 2;
  const cy = primerTrabajo.y + primerTrabajo.h / 2 - resumen.h / 2;
  return (
    <>
      <Img src={staticFile(shot('ciencia-resumen-full'))} style={{position: 'absolute', left: -resumen.x * k, top: -resumen.y * k, width: 390 * k}} />
      {t < 1 ? <Img src={staticFile(shot('ciencia'))} style={{position: 'absolute', left: -cx * k, top: -cy * k, width: 390 * k, opacity: 1 - t}} /> : null}
    </>
  );
};

const LIFTS: LiftDef[] = [
  piece(tAbs, tOut, resumen, shot('ciencia-resumen-full'), primerTrabajo, ABS_TO, {from: undefined, src: undefined, view: primerTrabajo, dim: true, render: cardIntoAbstract, maxBlur: 14}),
  // El póster es el único que cruza con un destello: es el que más se luce.
  piece(tPoster, tOut + 2, poster, shot('ciencia-poster-full'), vistaEposters, POSTER_TO, {shine: true}),
  piece(tVideo, tOut + 4, video, shot('ciencia-video'), vistaVideos, VIDEO_TO),
];

const Overlay: React.FC = () => <Headline n="7" label="Ciencia" lines={['Los trabajos', '*seleccionados*']} at={sc.from - 2} out={sc.to - 21} />;

export const ciencia: SceneDef = {
  screens: [{at: sc.from - 2, src: shot('ciencia'), enter: 'fade', enterDur: 14, ink: 'dark'}],
  glows: [{at: tGlow, until: tRecede + 4, box: subtitulo, radius: 10}],
  lifts: LIFTS.map((d) => ({...d, gain: 0.28})),
  cam: [
    ...dipIn(sc.from),
    {at: tRecede, dur: 16, pose: RECEDE},
    ...dipOut(sc.to),
  ],
  Overlay,
  sfx: [
    {name: 'sparkle', at: tGlow + 2, gain: 0.18},
    {name: 'swish', at: sc.to - 12, gain: 0.2},
  ],
};
