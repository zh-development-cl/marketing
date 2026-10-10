import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Backdrop} from './fx/Grain';
import {scenes, TOTAL} from './timeline';
import {SFX_CUES, MUSIC_FILE, MUSIC_GAIN, SFX_GAIN} from './sound';
import {SCENES} from './scenes';

// Composición v4: fondo, escenas (cada una decide cuándo aparece y cómo entra/sale), marca de agua, audio.
export const ReelV4: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#07090D'}}>
      <Backdrop />
      {SCENES.map(({key, Component, preroll = 0, postroll = 0}) => {
        const sc = scenes[key];
        const from = sc.from - preroll;
        const to = sc.to + postroll;
        if (frame < from || frame >= to) return null;
        return (
          <Sequence key={key} from={from} durationInFrames={to - from} name={key} layout="none">
            <Component />
          </Sequence>
        );
      })}
      {/* Voz por escena */}
      {Object.entries(scenes).map(([key, sc]) =>
        sc.audio ? (
          <Sequence key={`vo-${key}`} from={sc.voAt} name={`vo-${key}`}>
            <Audio src={staticFile(sc.audio)} />
          </Sequence>
        ) : null,
      )}
      {/* Efectos */}
      {SFX_CUES.map((c, i) => (
        <Sequence key={`sfx-${i}`} from={c.at} name={`sfx-${c.name}`}>
          <Audio src={staticFile(c.file)} volume={c.gain ?? SFX_GAIN} />
        </Sequence>
      ))}
      {/* Música */}
      {MUSIC_FILE ? (
        <Audio
          src={staticFile(MUSIC_FILE)}
          volume={(f) => {
            const fadeOut = Math.min(1, Math.max(0, (TOTAL - f) / 45));
            const fadeIn = Math.min(1, f / 20);
            return MUSIC_GAIN * fadeIn * fadeOut;
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
