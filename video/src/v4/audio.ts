// Generado por scripts/sfx.mjs: no editar a mano (se reescribe en cada ejecución).
// Rutas relativas a public/ (para staticFile) y duraciones reales medidas con ffprobe.
export const SFX = {
  'whoosh-soft': {file: 'sfx/whoosh-soft.mp3', durationSec: 0.605},
  'whoosh-hard': {file: 'sfx/whoosh-hard.mp3', durationSec: 0.6},
  'whip': {file: 'sfx/whip.mp3', durationSec: 0.48},
  'pop': {file: 'sfx/pop.mp3', durationSec: 0.3},
  'tick': {file: 'sfx/tick.mp3', durationSec: 0.18},
  'click': {file: 'sfx/click.mp3', durationSec: 0.22},
  'paper': {file: 'sfx/paper.mp3', durationSec: 0.727},
  'stamp': {file: 'sfx/stamp.mp3', durationSec: 0.283},
  'rise': {file: 'sfx/rise.mp3', durationSec: 1.2},
  'chime': {file: 'sfx/chime.mp3', durationSec: 1},
  'logo': {file: 'sfx/logo.mp3', durationSec: 1.48},
  'sting': {file: 'sfx/sting.mp3', durationSec: 1.48},
} as const;

export type SfxName = keyof typeof SFX;

export const MUSIC = {file: 'music/bed.mp3', durationSec: 50} as const;
