import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {Background} from '../components/Background';
import {Captions} from '../components/Captions';
import {captions, order, scenes, SceneKey, TRANSITION, VO_OFFSET} from '../timeline';
import {Chaos} from './Chaos';
import {Hook} from './Hook';
import {Imagine} from './Imagine';
import {Outro} from './Outro';
import {Step1} from './Step1';
import {Step2} from './Step2';
import {Step3} from './Step3';
import {Step4} from './Step4';

const components: Record<SceneKey, React.FC> = {
  hook: Hook,
  imagine: Imagine,
  chaos: Chaos,
  step1: Step1,
  step2: Step2,
  step3: Step3,
  step4: Step4,
  outro: Outro,
};

export const Reel01: React.FC = () => {
  const items: React.ReactNode[] = [];
  order.forEach((key, i) => {
    const Scene = components[key];
    if (i > 0) {
      items.push(
        <TransitionSeries.Transition key={`t-${key}`} presentation={fade({shouldFadeOutExitingScene: true})} timing={linearTiming({durationInFrames: TRANSITION})} />,
      );
    }
    items.push(
      <TransitionSeries.Sequence key={key} durationInFrames={scenes[key].dur}>
        <Scene />
        <Sequence from={VO_OFFSET} name={`vo-${key}`}>
          <Audio src={staticFile(scenes[key].audio)} />
        </Sequence>
      </TransitionSeries.Sequence>,
    );
  });
  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>{items}</TransitionSeries>
      <Captions items={captions} />
    </AbsoluteFill>
  );
};
