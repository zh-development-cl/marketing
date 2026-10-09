import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

const faces: Array<{family: string; file: string; weight: string}> = [
  {family: 'Funnel Display', file: 'FunnelDisplay-500.ttf', weight: '500'},
  {family: 'Funnel Display', file: 'FunnelDisplay-600.ttf', weight: '600'},
  {family: 'Funnel Display', file: 'FunnelDisplay-700.ttf', weight: '700'},
  {family: 'Funnel Sans', file: 'FunnelSans-400.ttf', weight: '400'},
  {family: 'Funnel Sans', file: 'FunnelSans-500.ttf', weight: '500'},
  {family: 'Funnel Sans', file: 'FunnelSans-600.ttf', weight: '600'},
  {family: 'IBM Plex Mono', file: 'IBMPlexMono-400.ttf', weight: '400'},
  {family: 'IBM Plex Mono', file: 'IBMPlexMono-500.ttf', weight: '500'},
  {family: 'Caveat', file: 'Caveat-600.ttf', weight: '600'},
];

export const fontsReady = Promise.all(
  faces.map((f) =>
    loadFont({
      family: f.family,
      url: staticFile(`fonts/${f.file}`),
      weight: f.weight,
      format: 'truetype',
    }),
  ),
);
