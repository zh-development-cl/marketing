/* Lo que manda la página «Transcribir en vivo» (/api/vivo-guardar y /api/vivo-avance): solo con la
   cookie del equipo (la deja esa misma página) y solo JSON, así un formulario de otro sitio no puede
   mandarlo. `fn` recibe el cuerpo y devuelve lo que se suma a la respuesta {ok: true}. */
import { json, Falla, FALTA_CLAVE } from "./http.js";
import { claveEquipo, conGalleta } from "./clave.js";

export function desdeLaPagina(fn, { maximo, grande, noSePudo, etiqueta }) {
  const fallo = (e) => {
    if (e instanceof Falla) return json({ ok: false, error: e.message, code: e.code }, e.code === "sin_almacen" ? 503 : 400);
    console.error(`[zh-reuniones] ${etiqueta}`, e && e.message);
    return json({ ok: false, error: noSePudo }, 502);
  };
  return async (req) => {
    let cfg;
    try { cfg = await claveEquipo(); } catch (e) { return fallo(e); }
    if (!cfg) return json({ ok: false, error: FALTA_CLAVE }, 503);
    if (!conGalleta(req, cfg)) return json({ ok: false, error: "Vuelve a abrir la página y escribe la clave del equipo." }, 401);
    if (!String(req.headers.get("content-type") || "").includes("application/json")) return json({ ok: false, error: "Lo que llegó no es JSON." }, 415);
    if (Number(req.headers.get("content-length") || 0) > maximo) return json({ ok: false, error: grande }, 413);
    let d;
    try { d = await req.json(); } catch { return json({ ok: false, error: "Lo que llegó no es JSON." }, 400); }
    try {
      return json({ ok: true, ...(await fn(d)) });
    } catch (e) {
      return fallo(e);
    }
  };
}
