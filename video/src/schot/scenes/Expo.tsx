import React from 'react';
import {beat, scenes} from '../timeline';
import {bx, center, framesOf} from '../shots';
import {focus, REST} from '../ui/geometry';
import {Headline} from '../ui/Text';
import {SceneDef, seqDir, shot} from './types';

// Escena 8 · expo. «En la expo» → Auspiciadores con los logos reales y la tarjeta del Pasaporte Virtual; «junta sellos
// en los stands» → «Escanear sello» y la ceremonia «Sello agregado» (secuencia real, 12 → 13 de 35); «y conecta con
// colegas escaneando su código» → «Mi código QR» con el QR personal, zoom.
const sc = scenes.expo;
const tList = sc.from;
const tScan = beat('expo', 'sellos') - 6;
const tSello = tScan + 4;
const NS = framesOf('seq-sello', 75);
const tQr = beat('expo', 'conecta') - 4;
const tQrZoom = beat('expo', 'escaneando') - 6;

const escanear = bx('auspiciadores', 'botonEscanearSello', {x: 30, y: 300, w: 160, h: 44});
const qr = bx('qr', 'qr', {x: 70, y: 240, w: 250, h: 250});

const Overlay: React.FC = () => <Headline n="7" label="Expo" lines={['Sellos y', '*contactos*']} at={sc.from - 2} out={sc.to - 8} />;

export const expo: SceneDef = {
  screens: [
    {at: tList, src: shot('auspiciadores'), enter: 'zoom', enterDur: 14, ink: 'light'},
    {at: tSello, seq: {dir: seqDir('seq-sello'), frames: NS, rate: Math.max(1, NS / (tQr - tSello - 2))}, enter: 'sheet', enterDur: 12, ink: 'light'},
    {at: tQr, src: shot('qr'), enter: 'push', ink: 'dark'},
  ],
  taps: [{at: tScan, ...center(escanear)}],
  glows: [{at: tQrZoom + 8, until: sc.to + 10, box: qr, radius: 20}],
  cam: [
    {at: tList + 4, dur: 16, pose: focus(escanear, 1.12, {x: 540, y: 1080})},
    {at: tSello, dur: 14, pose: REST},
    {at: tQrZoom, dur: 18, pose: focus(qr, 1.25, {x: 540, y: 1150})},
    {at: sc.to - 12, dur: 14, pose: REST},
  ],
  Overlay,
  sfx: [
    {name: 'click', at: tScan, gain: 0.45},
    {name: 'stamp', at: tSello + 18, gain: 0.55},
    {name: 'chime', at: tSello + 22, gain: 0.4},
    {name: 'whoosh-soft', at: tQr, gain: 0.3},
  ],
};
