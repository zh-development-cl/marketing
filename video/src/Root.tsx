import React from 'react';
import {Composition} from 'remotion';
import './brand/fonts';
import {video} from './brand/tokens';
import {Reel01} from './scenes/Reel01';
import {TOTAL} from './timeline';

export const Root: React.FC = () => (
  <>
    <Composition
      id="Reel01"
      component={Reel01}
      durationInFrames={TOTAL}
      fps={video.fps}
      width={video.width}
      height={video.height}
    />
  </>
);
