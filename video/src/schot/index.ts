import React from 'react';
import {Composition, continueRender, delayRender, registerRoot} from 'remotion';
import {schotFontsReady} from './fonts';
import {SchotDemo} from './Demo';
import {TOTAL} from './timeline';

// Entry del video demo de la app SCHOT: npx remotion render src/schot/index.ts SchotDemo out/schot-demo.mp4
const wait = delayRender('fuentes Barlow');
schotFontsReady.then(() => continueRender(wait)).catch(() => continueRender(wait));
registerRoot(() => React.createElement(Composition, {id: 'SchotDemo', component: SchotDemo, durationInFrames: TOTAL, fps: 30, width: 1080, height: 1920}));
