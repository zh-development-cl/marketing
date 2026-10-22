import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {order, scenes, TOTAL} from './timeline';
import {SCENES} from './scenes';
import {Backdrop} from './ui/Backdrop';
import {Stage} from './ui/Stage';
import {CamCtx, FxLayer, LiftLayer, liftDims} from './ui/Pop';
import {Captions} from './ui/Text';
import type {SfxCue} from './scenes/types';
import {tMascot, tMascotOut} from './scenes/Tibia';
import {tItinMascot, tItinMascotOut} from './scenes/Itinerario';

// Video demo de la app del 62º Congreso SCHOT (1080 x 1920, 30 fps). Fondo vivo de marca; un solo teléfono que
// recorre todo el video con la app real en pantalla (las escenas aportan pistas de pantallas, toques, cámara);
// titulares por escena; subtítulos de la voz; voz en una toma, efectos por cue y cama musical propia.
const all = order.map((k) => SCENES[k]);
const screens = all.flatMap((d) => d.screens ?? []);
const taps = all.flatMap((d) => d.taps ?? []);
const glows = all.flatMap((d) => d.glows ?? []);
const pushes = all.flatMap((d) => d.pushes ?? []);
const cam = all.flatMap((d) => d.cam ?? []);
const shakes = all.flatMap((d) => d.shakes ?? []);
const lifts = all.flatMap((d) => d.lifts ?? []);
const badges = all.flatMap((d) => d.badges ?? []);
const bursts = all.flatMap((d) => d.bursts ?? []);
const flashes = all.flatMap((d) => d.flashes ?? []);
const ctaps = all.flatMap((d) => d.ctaps ?? []);
const dims = [...all.flatMap((d) => d.dims ?? []), ...liftDims(lifts)];
// Cada pieza que salta suena: pops con tres alturas que se alternan (para que una serie no suene igual) y un
// «swish» suave cuando un contenedor vuelve a su lugar.
const POPS = ['pop-mid', 'pop-hi', 'pop', 'pop-lo'] as const;
const autoSfx: SfxCue[] = [
  ...lifts.flatMap((d, i) => [
    ...(d.sound === null ? [] : [{name: d.sound ?? POPS[i % 3], at: d.at + 1, gain: d.gain ?? 0.42}]),
    ...(d.sound === null || (d.exit ?? 'back') !== 'back' ? [] : [{name: 'swish' as const, at: d.out + 2, gain: 0.16}]),
    ...(d.sound !== null && d.exit && d.exit !== 'back' && d.exit !== 'pop' ? [{name: 'swish' as const, at: d.out, gain: 0.2}] : []),
  ]),
  ...badges.flatMap((d, i) => (d.sound === null ? [] : [{name: d.sound ?? POPS[(i + 1) % 4], at: d.at + 1, gain: d.gain ?? 0.45}])),
];
export const SFX = [...all.flatMap((d) => d.sfx ?? []), ...autoSfx].sort((a, b) => a.at - b.at);

const MUSIC = 'music/schot-drive.mp3';
// La música baja bajo la voz (ducking) y sube en los respiros entre frases y escenas.
const MUSIC_HI = 0.85;
const MUSIC_LO = 0.55;
const voiceSpans = order.map((k) => [scenes[k].voAt, scenes[k].voAt + Math.round(scenes[k].voice.duration * 30)] as const);
const duckAt = (f: number) =>
  Math.max(0, ...voiceSpans.map(([a, b]) => Math.min(1, Math.max(0, (f - (a - 8)) / 8)) * Math.min(1, Math.max(0, (b + 8 - f) / 8))));
const SFX_GAIN = 0.6;


export const SchotDemo: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <CamCtx.Provider value={{cam, shakes}}>
    <AbsoluteFill style={{background: '#2B0054'}}>
      <Backdrop plexus veil="top" turn={26} />
      {order.map((k) => {
        const Under = SCENES[k].Under;
        const sc = scenes[k];
        return Under && frame >= sc.from - 20 && frame < sc.to + 20 ? <Under key={`u-${k}`} /> : null;
      })}
      <Stage screens={screens} taps={taps} glows={glows} pushes={pushes} cam={cam} shakes={shakes} dims={dims} />
      <LiftLayer lifts={lifts} />
      <FxLayer badges={badges} bursts={bursts} flashes={flashes} ctaps={ctaps} />
      {order.map((k) => {
        const Overlay = SCENES[k].Overlay;
        const sc = scenes[k];
        return Overlay && frame >= sc.from - 20 && frame < sc.to + 20 ? <Overlay key={`o-${k}`} /> : null;
      })}
      {/* Subtítulos fuera de la apertura (el título dice lo mismo) y del cierre (la dirección grande lo reemplaza) */}
      <Captions skip={['intro', 'cierre']} right={(f) => ((f >= tMascot - 6 && f < tMascotOut + 24) || (f >= tItinMascot - 6 && f < tItinMascotOut + 24) ? 330 : 80)} />
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
        volume={(f) => (MUSIC_HI - (MUSIC_HI - MUSIC_LO) * duckAt(f)) * Math.min(1, f / 24) * Math.min(1, Math.max(0, (TOTAL - f) / 40))}
      />
    </AbsoluteFill>
    </CamCtx.Provider>
  );
};
