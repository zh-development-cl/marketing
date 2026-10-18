/* Donde la página «Transcribir en vivo» deja la transcripción al terminar. Solo con la cookie del
   equipo (la deja esa misma página) y solo JSON: un formulario de otro sitio no puede mandarla. */
import { json, Falla, FALTA_CLAVE } from "../lib/http.js";
import { claveEquipo, conGalleta } from "../lib/clave.js";
import { guardarEnVivo } from "../lib/reuniones.js";

function fallo(e) {
  if (e instanceof Falla) return json({ ok: false, error: e.message, code: e.code }, e.code === "sin_almacen" ? 503 : 400);
  console.error("[zh-reuniones] vivo", e && e.message);
  return json({ ok: false, error: "No se pudo guardar la transcripción. Vuelve a intentar con «Volver a mandar»." }, 502);
}

export async function POST(req) {
  let cfg;
  try { cfg = await claveEquipo(); } catch (e) { return fallo(e); }
  if (!cfg) return json({ ok: false, error: FALTA_CLAVE }, 503);
  if (!conGalleta(req, cfg)) return json({ ok: false, error: "Vuelve a abrir la página y escribe la clave del equipo." }, 401);
  if (!String(req.headers.get("content-type") || "").includes("application/json")) return json({ ok: false, error: "Lo que llegó no es JSON." }, 415);
  if (Number(req.headers.get("content-length") || 0) > 2000000) return json({ ok: false, error: "La transcripción es demasiado grande." }, 413);
  let d;
  try { d = await req.json(); } catch { return json({ ok: false, error: "Lo que llegó no es JSON." }, 400); }
  try {
    return json({ ok: true, ...(await guardarEnVivo(d)) });
  } catch (e) {
    return fallo(e);
  }
}

export function GET() {
  return json({ ok: false, error: "Esta dirección recibe las transcripciones de la página «Transcribir en vivo» (POST)." }, 405, { allow: "POST" });
}
