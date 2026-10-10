// Posiciones compartidas entre escenas (para que las transiciones por morfología calcen al píxel).
export const PHONE = {
  w: 600,
  h: 1240,
  x: 240,
  y: 330,
  // Pantalla (sin bisel): el bisel mide 16 px.
  screen: {x: 256, y: 346, w: 568, h: 1208, r: 80},
} as const;

export const WALL = {cols: 4, cellW: 222, cellH: 104, gap: 12, top: 470, scale: 0.62} as const;
