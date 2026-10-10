import React from 'react';
import {Composition, registerRoot} from 'remotion';
import '../brand/fonts';
import {ReelV4} from './Reel';
import {TOTAL} from './timeline';

// Entry de la v4 (independiente de la v3): npx remotion render src/v4/index.ts ReelV4 out/reel-01-v4.mp4
registerRoot(() => React.createElement(Composition, {id: 'ReelV4', component: ReelV4, durationInFrames: TOTAL, fps: 30, width: 1080, height: 1920}));
