import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Barlow (la tipografía de la app, @fontsource/barlow 5.3.0, latín: cubre á é í ó ú ñ ¿ ¡ º –) y Barlow Condensed
// (la grotesca del afiche del congreso, solo para momentos de afiche). Licencia OFL en public/schot/fonts/OFL.txt.
const faces: Array<{family: string; file: string; weight: string; style?: 'normal' | 'italic'}> = [
  {family: 'Barlow', file: 'barlow-latin-400-normal.woff2', weight: '400'},
  {family: 'Barlow', file: 'barlow-latin-500-normal.woff2', weight: '500'},
  {family: 'Barlow', file: 'barlow-latin-600-normal.woff2', weight: '600'},
  {family: 'Barlow', file: 'barlow-latin-700-normal.woff2', weight: '700'},
  {family: 'Barlow', file: 'barlow-latin-800-normal.woff2', weight: '800'},
  {family: 'Barlow Condensed', file: 'barlow-condensed-latin-700-normal.woff2', weight: '700'},
  {family: 'Barlow Condensed', file: 'barlow-condensed-latin-800-normal.woff2', weight: '800'},
];

export const schotFontsReady = Promise.all(
  faces.map((f) => loadFont({family: f.family, url: staticFile(`schot/fonts/${f.file}`), weight: f.weight, style: f.style ?? 'normal', format: 'woff2'})),
);
