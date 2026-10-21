import data from './shots.json';
import type {Box} from './ui/geometry';

// Manifiesto de las capturas reales (scripts/schot-shots.mjs): cajas en pt de cada elemento que se toca o se destaca.
type Entry = {boxes?: Record<string, Box | null>; frames?: number; fullHeight?: number};
const shots = data as unknown as Record<string, Entry>;

// Caja `name` de la toma `id`; si el manifiesto no la tiene, la de respaldo (y se avisa en la consola del render).
export const bx = (id: string, name: string, fallback: Box): Box => {
  const b = shots[id]?.boxes?.[name];
  if (b && typeof b.x === 'number') return b;
  console.warn(`[shots] sin caja ${id}.${name}; uso la de respaldo`);
  return fallback;
};
export const center = (b: Box) => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
export const framesOf = (id: string, fallback: number) => shots[id]?.frames ?? fallback;
export const fullHeightOf = (id: string, fallback: number) => shots[id]?.fullHeight ?? fallback;
