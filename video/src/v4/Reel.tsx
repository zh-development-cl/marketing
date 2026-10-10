import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Backdrop} from './fx/Grain';
import {scenes, TOTAL} from './timeline';
import {SFX_CUES, MUSIC_FILE, MUSIC_GAIN, SFX_GAIN} from './sound';
import {SCENES} from './scenes';
import {Watermark} from './ui/Watermark';

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
      {/* La marca de agua se funde con el resto en los últimos 10 frames (el reel termina en "¿qué esperas?"). */}
      <Watermark opacity={frame < 6 ? frame / 6 : Math.max(0, Math.min(1, (scenes.outro.to - frame) / 10))} />
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
            // La música se apaga en los últimos 36 frames, junto con el fundido a negro.
            const fadeOut = Math.min(1, Math.max(0, (scenes.outro.to - f) / 36));
            const fadeIn = Math.min(1, f / 20);
            // La cama sube ~7 LU a lo largo del tema: desde el paso 02 se baja 3 dB (rampa de 2 s) para que la voz
            // siga mandando ≥ 3 LU en las frases con pocos efectos.
            const s2 = scenes.step2.from;
            const bed = f < s2 - 60 ? 1 : f < s2 ? 1 - 0.3 * ((f - (s2 - 60)) / 60) : 0.7;
            return MUSIC_GAIN * bed * fadeIn * fadeOut;
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
