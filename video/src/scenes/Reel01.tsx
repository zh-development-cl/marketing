import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {Background} from '../components/Background';
import {Captions} from '../components/Captions';
import {SceneFade} from '../components/SceneFade';
import {captions, scenes, VO_OFFSET} from '../timeline';
import {Chaos} from './Chaos';
import {Hook} from './Hook';
import {Imagine} from './Imagine';
import {Outro} from './Outro';
import {Step1} from './Step1';
import {Step2} from './Step2';
import {Step3} from './Step3';
import {Step4} from './Step4';

const order: Array<[keyof typeof scenes, React.FC]> = [
  ['hook', Hook],
  ['imagine', Imagine],
  ['chaos', Chaos],
  ['step1', Step1],
  ['step2', Step2],
  ['step3', Step3],
  ['step4', Step4],
  ['outro', Outro],
];

export const Reel01: React.FC = () => (
  <AbsoluteFill>
    <Background />
    {order.map(([key, Scene]) => (
      <Sequence key={key} from={scenes[key].from} durationInFrames={scenes[key].dur} name={key}>
        <SceneFade>
          <Scene />
        </SceneFade>
        <Sequence from={VO_OFFSET} name={`vo-${key}`}>
          <Audio src={staticFile(scenes[key].audio)} />
        </Sequence>
      </Sequence>
    ))}
    <Captions items={captions} />
  </AbsoluteFill>
);
