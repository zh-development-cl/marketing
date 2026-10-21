import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {order, scenes, TOTAL} from './timeline';
import {SCENES} from './scenes';
import {Backdrop} from './ui/Backdrop';
import {Stage} from './ui/Stage';
import {Captions} from './ui/Text';
import {tMascot, tMascotOut} from './scenes/Tibia';

// Video demo de la app del 62º Congreso SCHOT (1080 x 1920, 30 fps). Fondo vivo de marca; un solo teléfono que
// recorre todo el video con la app real en pantalla (las escenas aportan pistas de pantallas, toques, cámara);
// titulares por escena; subtítulos de la voz; voz en una toma, efectos por cue y cama musical propia.
const all = order.map((k) => SCENES[k]);
const screens = all.flatMap((d) => d.screens ?? []);
const taps = all.flatMap((d) => d.taps ?? []);
const glows = all.flatMap((d) => d.glows ?? []);
const pushes = all.flatMap((d) => d.pushes ?? []);
const cam = all.flatMap((d) => d.cam ?? []);
export const SFX = all.flatMap((d) => d.sfx ?? []).sort((a, b) => a.at - b.at);

const MUSIC = 'music/schot-bed.mp3';
const MUSIC_GAIN = 0.7;
const SFX_GAIN = 0.6;

// Subtítulos fuera de la apertura (el título ya dice lo mismo) y del cierre (la dirección grande lo reemplaza).
const hideCaptions = (f: number) => f < scenes.abrir.from || f >= scenes.cierre.from;

export const SchotDemo: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#2B0054'}}>
      <Backdrop plexus veil="top" turn={26} />
      {order.map((k) => {
        const Under = SCENES[k].Under;
        const sc = scenes[k];
        return Under && frame >= sc.from - 20 && frame < sc.to + 20 ? <Under key={`u-${k}`} /> : null;
      })}
      <Stage screens={screens} taps={taps} glows={glows} pushes={pushes} cam={cam} />
      {order.map((k) => {
        const Overlay = SCENES[k].Overlay;
        const sc = scenes[k];
        return Overlay && frame >= sc.from - 20 && frame < sc.to + 20 ? <Overlay key={`o-${k}`} /> : null;
      })}
      <Captions hide={hideCaptions} right={(f) => (f >= tMascot - 6 && f < tMascotOut + 14 ? 360 : 80)} />
      {/* Voz por escena */}
      {order.map((k) => (
        <Sequence key={`vo-${k}`} from={scenes[k].voAt} name={`vo-${k}`}>
          <Audio src={staticFile(scenes[k].audio)} />
        </Sequence>
      ))}
      {/* Efectos */}
      {SFX.map((c, i) => (
        <Sequence key={`sfx-${i}`} from={c.at} name={`sfx-${c.name}`}>
          <Audio src={staticFile(`sfx/${c.name}.mp3`)} volume={c.gain ?? SFX_GAIN} />
        </Sequence>
      ))}
      {/* Música: entra suave y se apaga con el fundido final */}
      <Audio
        src={staticFile(MUSIC)}
        volume={(f) => MUSIC_GAIN * Math.min(1, f / 24) * Math.min(1, Math.max(0, (TOTAL - f) / 40))}
      />
    </AbsoluteFill>
  );
};
