import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {beat, scenes} from '../timeline';
import {bx, framesOf} from '../shots';
import {PT, REST, toCanvas} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {SceneDef, seqDir, shot} from './types';

// Escena 8 · expo. Llega con un latigazo. «En la expo» → la tarjeta del Pasaporte Virtual salta de los Auspiciadores;
// «junta sellos» → se toca «Escanear sello» sobre la tarjeta flotante; sube la hoja real y el sello de AO Trauma cae
// desde la cámara y se estampa (golpe, temblor, estallido); el avance «13 de 35 sellos» salta y rueda de 12 a 13.
// «y conecta con colegas escaneando su código» → «Mi código QR»: el QR salta girando y una línea de escaneo lo
// recorre. Sale encogiéndose hacia el cierre.
const sc = scenes.expo;
const tPas = beat('expo', 'expo') - 4;
const tScan = beat('expo', 'junta');
const tSheet = tScan + 3;
const tImpact = Math.max(beat('expo', 'sellos') + 6, tSheet + 14); // el sello golpea con la hoja ya arriba
const SEQ_HIT = 18; // cuadro de la secuencia real con el sello ya puesto (antes del 12 → 13)
const NS = framesOf('seq-sello', 75);
const tProg = tImpact + 6;
const tProgOut = beat('expo', 'conecta') - 8;
const tQr = tProgOut + 6;
const tQrLift = beat('expo', 'colegas') - 6;
const tScanLine = beat('expo', 'escaneando') - 2;
const tQrOut = sc.to - 20;

const pasaporte = bx('auspiciadores', 'tarjetaPasaporte', {x: 16, y: 129, w: 358, h: 172});
const escanear = bx('auspiciadores', 'botonEscanearSello', {x: 30, y: 239, w: 330, h: 48});
const sello = bx('seq-sello', 'sello', {x: 119, y: 211, w: 152, h: 152});
const progreso = bx('seq-sello', 'progreso', {x: 20, y: 454, w: 350, h: 64});
const qr = bx('qr', 'tarjetaQR', {x: 63, y: 266, w: 264, h: 264});

const PAS_TO = {x: 540, y: 1080, k: 2.5};
const SCAN_AT = {x: PAS_TO.x + (escanear.x + escanear.w / 2 - (pasaporte.x + pasaporte.w / 2)) * PAS_TO.k, y: PAS_TO.y + (escanear.y + escanear.h / 2 - (pasaporte.y + pasaporte.h / 2)) * PAS_TO.k};

const pad4 = (n: number) => String(n).padStart(4, '0');
const selloFrame = (i: number) => `${seqDir('seq-sello')}/f${pad4(Math.max(0, Math.min(NS - 1, i)))}.png`;
// La secuencia corre desde el golpe: hasta entonces queda en el círculo vacío «Sumando el sello…».
const seqAt = (f: number) => (f < tImpact ? 2 : SEQ_HIT + (f - tImpact));

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// El sello cae desde la cámara: grande, girado y desenfocado; acelera y se estampa justo en su lugar de la hoja.
const STAMP_FALL = 9;
const Stamp: React.FC = () => {
  const f = useCurrentFrame();
  const t0 = tImpact - STAMP_FALL;
  if (f < t0 || f >= tImpact) return null;
  const t = interpolate(f, [t0, tImpact], [0, 1], {...clampOpt, easing: Easing.in(Easing.quad)});
  const dst = toCanvas(REST, sello.x + sello.w / 2, sello.y + sello.h / 2);
  const k = PT * (1 + 2.6 * (1 - t));
  const w = sello.w * k;
  const blur = (1 - t) * 8;
  return (
    <div style={{position: 'absolute', left: dst.x - w / 2, top: dst.y - w / 2 - (1 - t) * 260, width: w, height: w, zIndex: 47, opacity: Math.min(1, t * 4), transform: `rotate(${((1 - t) * -24).toFixed(2)}deg)`, filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', boxShadow: `0 ${(40 * (1 - t)).toFixed(0)}px ${(80 * (1 - t) + 10).toFixed(0)}px rgba(14,0,30,.45)`}}>
        <Img src={staticFile(selloFrame(NS - 1))} style={{position: 'absolute', left: -sello.x * k, top: -sello.y * k, width: 390 * k}} />
      </div>
    </div>
  );
};

const Overlay: React.FC = () => (
  <>
    <Headline n="7" label="Expo" lines={['Sellos y', '*contactos*']} at={sc.from - 2} out={sc.to - 17} />
    <Stamp />
  </>
);

// Línea de escaneo que recorre el QR flotante (dos pasadas).
const ScanLine: React.FC<{f: number; k: number}> = ({f, k}) => {
  const t = interpolate(f, [tScanLine, tScanLine + 26], [0, 2], clampOpt);
  if (f < tScanLine || t >= 2) return null;
  const y = (t <= 1 ? t : 2 - t) * qr.h * k;
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: y - 60, height: 60, background: 'linear-gradient(180deg, rgba(162,0,255,0), rgba(162,0,255,.22))', transform: t > 1 ? 'scaleY(-1) translateY(-60px)' : undefined}} />
      <div style={{position: 'absolute', left: -6, right: -6, top: y - 3, height: 6, borderRadius: 3, background: 'linear-gradient(90deg, rgba(230,0,126,0), #E6007E 15%, #FF6CC4 50%, #E6007E 85%, rgba(230,0,126,0))', boxShadow: '0 0 24px rgba(230,0,126,.9)'}} />
    </>
  );
};

export const expo: SceneDef = {
  screens: [
    {at: sc.from, src: shot('auspiciadores'), ink: 'dark'},
    {at: tSheet, render: (f) => <Img src={staticFile(selloFrame(seqAt(f)))} style={{position: 'absolute', left: 0, top: 0, width: 390 * PT, height: 844 * PT}} />, enter: 'sheet', enterDur: 12, ink: 'dark'},
    {at: tQr, src: shot('qr'), enter: 'push', enterDur: 12, ink: 'dark'},
  ],
  ctaps: [{at: tScan, ...SCAN_AT, scale: 0.85}],
  lifts: [
    {at: tPas, out: tScan + 3, box: pasaporte, src: shot('auspiciadores'), to: {...PAS_TO, r: -2, rx: 8}, exit: 'pop', radius: 22, ring: true, scrim: 0.35},
    {at: tProg, out: tProgOut, box: progreso, src: (f) => selloFrame(seqAt(f)), to: {x: 540, y: 1380, k: 2.6, r: 2, rx: 6}, exit: 'pop', radius: 16, ring: true, dim: false},
    {
      at: tQrLift,
      out: tQrOut,
      box: qr,
      render: (f, k) => (
        <>
          <Img src={staticFile(shot('qr'))} style={{position: 'absolute', left: -qr.x * k, top: -qr.y * k, width: 390 * k}} />
          <ScanLine f={f} k={k} />
        </>
      ),
      // Sale girado y se endereza con un segundo resorte: un medio giro 3D.
      to: {x: 540, y: 1150, k: 3.0, r: -2, rx: 6, ry: -34},
      moves: [{at: tQrLift + 7, to: {x: 540, y: 1150, k: 3.0, r: -2, rx: 6, ry: 0}}],
      exit: 'back', // vuelve a su lugar en la pantalla: el blanco grande no desaparece de golpe
      exitDur: 14,
      radius: 24,
      ring: true,
      scrim: 0.45,
    },
  ],
  badges: [
    {at: tImpact + 2, out: tProgOut - 2, x: 760, y: 760, text: 'Sello agregado', icon: 'star', tone: 'brand', size: 42, r: 6, sound: null},
    {at: beat('expo', 'conecta') - 2, out: tQrOut, x: 540, y: 1720, text: 'Conecta con colegas', icon: 'users', tone: 'white', size: 44, r: -3},
  ],
  bursts: [{at: tImpact, ...toCanvas(REST, sello.x + sello.w / 2, sello.y + sello.h / 2), n: 20, r: 360, star: true}],
  flashes: [{at: tImpact, dur: 10, y: 1000, a: 0.45}],
  shakes: [{at: tImpact, dur: 14, amp: 18}],
  cam: [
    {at: sc.from, dur: 1, pose: {...REST, x: 1840, ry: -28, s: 0.96}},
    {at: sc.from + 1, dur: 15, pose: REST, ease: 'whipOut'},
    {at: tPas, dur: 12, pose: {...REST, s: 0.9, y: REST.y + 50, rx: 12}},
    {at: tScan + 4, dur: 10, pose: REST},
    {at: tQrLift, dur: 12, pose: {...REST, s: 0.88, y: REST.y + 60, rx: 14}},
  ],
  Overlay,
  sfx: [
    {name: 'click', at: tScan, gain: 0.5},
    {name: 'swish', at: tSheet, gain: 0.25},
    {name: 'whoosh-soft', at: tImpact - STAMP_FALL, gain: 0.3},
    {name: 'stamp', at: tImpact, gain: 0.7},
    {name: 'boom', at: tImpact, gain: 0.5},
    {name: 'chime', at: tImpact + 10, gain: 0.3},
    {name: 'tick', at: tProg + 8, gain: 0.3},
    {name: 'rise', at: tScanLine - 4, gain: 0.16},
    {name: 'tick', at: tScanLine + 13, gain: 0.25},
  ],
};
