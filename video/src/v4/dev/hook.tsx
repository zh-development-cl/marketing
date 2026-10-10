import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import '../../brand/fonts';
import {Backdrop} from '../fx/Grain';
import {Hook} from '../scenes/Hook';
import {scenes} from '../timeline';

// Vista aislada del gancho (incluye los 8 frames de postroll de la morfología).
const HookOnly: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <Hook />
  </AbsoluteFill>
);

registerRoot(() => <Composition id="HookOnly" component={HookOnly} durationInFrames={scenes.hook.dur + 8} fps={30} width={1080} height={1920} />);
