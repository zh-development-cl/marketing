import type React from 'react';
import type {CamKey, Dim, Glow, PushNote, ScreenEvent, Shake, Tap} from '../ui/Stage';
import type {BadgeDef, BurstDef, CanvasTap, FlashDef, LiftDef} from '../ui/Pop';

export type SfxName =
  | 'whoosh-soft'
  | 'whoosh-hard'
  | 'whip'
  | 'pop'
  | 'pop-hi'
  | 'pop-mid'
  | 'pop-lo'
  | 'swish'
  | 'sparkle'
  | 'boom'
  | 'tick'
  | 'click'
  | 'paper'
  | 'stamp'
  | 'rise'
  | 'chime'
  | 'logo'
  | 'sting';
export type SfxCue = {name: SfxName; at: number; gain?: number};

// Lo que aporta cada escena: pistas del teléfono (pantallas, toques, halos, notificaciones, cámara), lo que va
// fuera del teléfono (titular, piezas propias) y sus efectos de sonido. Frames siempre ABSOLUTOS.
export type SceneDef = {
  screens?: ScreenEvent[];
  taps?: Tap[];
  glows?: Glow[];
  pushes?: PushNote[];
  cam?: CamKey[];
  shakes?: Shake[];
  dims?: Dim[];
  // Piezas que saltan (ver ui/Pop.tsx). Cada Lift y cada Badge trae su «pop» automático salvo `quiet`.
  lifts?: Array<LiftDef & {sound?: SfxName | null; gain?: number}>;
  badges?: Array<BadgeDef & {sound?: SfxName | null; gain?: number}>;
  bursts?: BurstDef[];
  flashes?: FlashDef[];
  ctaps?: CanvasTap[]; // toques sobre piezas flotantes (px del lienzo)
  Overlay?: React.FC;
  Under?: React.FC; // detrás del teléfono
  sfx?: SfxCue[];
};

export const shot = (id: string) => `schot/shots/${id}.png`;
export const seqDir = (id: string) => `schot/shots/${id}`;
