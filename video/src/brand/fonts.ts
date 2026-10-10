import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Fuentes locales (public/fonts). Marca: Funnel Display / Funnel Sans / IBM Plex Mono.
// Mockups de apps: Inter. Documentos en papel: Instrument Serif. Manuscrita: Caveat.
const faces: Array<{family: string; file: string; weight: string; style?: 'normal' | 'italic'}> = [
  {family: 'Funnel Display', file: 'FunnelDisplay-400.ttf', weight: '400'},
  {family: 'Funnel Display', file: 'FunnelDisplay-500.ttf', weight: '500'},
  {family: 'Funnel Display', file: 'FunnelDisplay-600.ttf', weight: '600'},
  {family: 'Funnel Display', file: 'FunnelDisplay-700.ttf', weight: '700'},
  {family: 'Funnel Sans', file: 'FunnelSans-400.ttf', weight: '400'},
  {family: 'Funnel Sans', file: 'FunnelSans-500.ttf', weight: '500'},
  {family: 'Funnel Sans', file: 'FunnelSans-600.ttf', weight: '600'},
  {family: 'IBM Plex Mono', file: 'IBMPlexMono-400.ttf', weight: '400'},
  {family: 'IBM Plex Mono', file: 'IBMPlexMono-500.ttf', weight: '500'},
  {family: 'Caveat', file: 'Caveat-600.ttf', weight: '600'},
  {family: 'Inter', file: 'Inter-400.ttf', weight: '400'},
  {family: 'Inter', file: 'Inter-500.ttf', weight: '500'},
  {family: 'Inter', file: 'Inter-600.ttf', weight: '600'},
  {family: 'Inter', file: 'Inter-700.ttf', weight: '700'},
  {family: 'Instrument Serif', file: 'InstrumentSerif-400.ttf', weight: '400'},
  {family: 'Instrument Serif', file: 'InstrumentSerif-400-italic.ttf', weight: '400', style: 'italic'},
];

export const fontsReady = Promise.all(
  faces.map((f) =>
    loadFont({
      family: f.family,
      url: staticFile(`fonts/${f.file}`),
      weight: f.weight,
      style: f.style ?? 'normal',
      format: 'truetype',
    }),
  ),
);
