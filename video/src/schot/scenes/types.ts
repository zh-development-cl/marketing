import type React from 'react';
import type {CamKey, Glow, PushNote, ScreenEvent, Tap} from '../ui/Stage';

export type SfxName = 'whoosh-soft' | 'whoosh-hard' | 'whip' | 'pop' | 'tick' | 'click' | 'paper' | 'stamp' | 'rise' | 'chime' | 'logo' | 'sting';
export type SfxCue = {name: SfxName; at: number; gain?: number};

// Lo que aporta cada escena: pistas del teléfono (pantallas, toques, halos, notificaciones, cámara), lo que va
// fuera del teléfono (titular, piezas propias) y sus efectos de sonido. Frames siempre ABSOLUTOS.
export type SceneDef = {
  screens?: ScreenEvent[];
  taps?: Tap[];
  glows?: Glow[];
  pushes?: PushNote[];
  cam?: CamKey[];
  Overlay?: React.FC;
  Under?: React.FC; // detrás del teléfono
  sfx?: SfxCue[];
};

export const shot = (id: string) => `schot/shots/${id}.png`;
export const seqDir = (id: string) => `schot/shots/${id}`;
