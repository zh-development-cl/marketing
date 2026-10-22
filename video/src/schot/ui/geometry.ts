// Geometría del teléfono del video. La pantalla del iPhone mide 390 x 844 pt (CSS px de la app); en el lienzo
// 1 pt = 1,5 px, así la pantalla mide 585 x 1266 px y una captura @3x (1170 px de ancho) se dibuja a la mitad.
export const PT = 1.5;
export const SCREEN_W = 390 * PT; // 585
export const SCREEN_H = 844 * PT; // 1266
export const BEZEL = 30; // marco (18) + borde negro (12), por lado
export const PHONE_W = SCREEN_W + 2 * BEZEL; // 645
export const PHONE_H = SCREEN_H + 2 * BEZEL; // 1326

// Pose del teléfono: centro de la PANTALLA en el lienzo y escala. Reposo: centrado, con aire arriba para el titular.
// r: giro en el plano (grados); rx / ry: inclinación 3D (grados, con perspectiva).
export type Pose = {x: number; y: number; s: number; r?: number; rx?: number; ry?: number};
export const REST: Pose = {x: 540, y: 560 + BEZEL + SCREEN_H / 2, s: 1, r: 0}; // pantalla de y=590 a y=1856

export type Box = {x: number; y: number; w: number; h: number};

// Zona reservada arriba para el titular y los subtítulos: el teléfono nunca sube su borde por encima de esta línea.
export const TOP_MIN = 556;
const BOTTOM_MAX = 1820; // el centro de lo enfocado nunca baja de aquí

// Pose que deja el centro de una caja (en pt de la pantalla) en el punto `target` del lienzo con zoom `s`, sin invadir
// la zona del texto: si para enfocarla habría que subir el teléfono sobre el titular, se baja hasta TOP_MIN; si con
// eso la caja quedaría fuera del cuadro, se reduce el zoom (hasta 1).
export const focus = (box: Box, s: number, target: {x: number; y: number} = {x: 540, y: 1180}): Pose => {
  const bx = (box.x + box.w / 2) * PT - SCREEN_W / 2;
  const by = (box.y + box.h / 2) * PT - SCREEN_H / 2;
  for (let z = s; z >= 1; z -= 0.02) {
    const y = Math.max(target.y - by * z, TOP_MIN + (PHONE_H / 2) * z);
    if (y + by * z <= BOTTOM_MAX || z - 0.02 < 1) {
      // En x: el centro de la caja al centro, pero sin despegar el borde del teléfono más de lo necesario.
      const x = target.x - bx * z;
      return {x, y, s: z, r: 0};
    }
  }
  return {x: 540, y: REST.y, s: 1, r: 0};
};

// Punto del lienzo donde cae un punto de la pantalla (pt) con una pose dada.
export const toCanvas = (p: Pose, px: number, py: number) => ({x: p.x + (px * PT - SCREEN_W / 2) * p.s, y: p.y + (py * PT - SCREEN_H / 2) * p.s});
