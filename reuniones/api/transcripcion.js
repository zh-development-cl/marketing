/* Donde TranscripTonic deja la transcripción al terminar cada reunión (su «webhook», con el cuerpo
   «advanced» o «simple»). La dirección lleva un token que sale de la clave del equipo; la extensión
   la guarda y no manda nada más. */
import { json, listo, igual, tokenWebhook, Falla, FALTA_CLAVE } from "../lib/http.js";
import { guardarTranscripcion } from "../lib/reuniones.js";

const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type", "access-control-max-age": "86400" };

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req) {
  if (!listo()) return json({ ok: false, error: FALTA_CLAVE }, 503, CORS);
  if (!igual(new URL(req.url).searchParams.get("t") || "", tokenWebhook())) return json({ ok: false, error: "Esta dirección no es la de ZH Reuniones: cópiala de nuevo desde la página de inicio." }, 401, CORS);
  if (Number(req.headers.get("content-length") || 0) > 4000000) return json({ ok: false, error: "La transcripción es demasiado grande." }, 413, CORS);
  let d;
  try { d = await req.json(); } catch { return json({ ok: false, error: "Lo que llegó no es JSON." }, 400, CORS); }
  try {
    return json({ ok: true, ...(await guardarTranscripcion(d)) }, 200, CORS);
  } catch (e) {
    if (e instanceof Falla) return json({ ok: false, error: e.message, code: e.code }, e.code === "sin_almacen" ? 503 : 400, CORS);
    console.error("[zh-reuniones] webhook", e && e.status, e && e.message);
    return json({ ok: false, error: "No se pudo guardar la transcripción. Vuelve a mandarla desde «Last 10 meetings»." }, 502, CORS);
  }
}

export function GET() {
  return json({ ok: false, error: "Esta dirección recibe las transcripciones de TranscripTonic (POST)." }, 405, { allow: "POST, OPTIONS" });
}
