/* Regreso del inicio de sesión con Google: si la cuenta es del equipo, se entrega el código. */
import { html, base, redirect, esc, equipo } from "../../lib/http.js";
import { firmar, verificar } from "../../lib/jwt.js";
import { canjearCodigo, correoDeIdToken } from "../../lib/google.js";

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const est = verificar(q.get("state"), "estado");
  if (!est) return html("<h1>El enlace venció</h1><p>Vuelve a conectar ZH Reuniones desde claude.ai.</p>", 400);
  const volver = (params) => redirect(`${est.r}${est.r.includes("?") ? "&" : "?"}${new URLSearchParams({ ...params, ...(est.s ? { state: est.s } : {}) })}`);
  if (q.get("error") || !q.get("code")) return volver({ error: "access_denied", error_description: "No se completó el inicio de sesión con Google." });
  let correo;
  try {
    const t = await canjearCodigo({ code: q.get("code"), redirectUri: `${base(req)}/api/oauth/google` });
    correo = correoDeIdToken(t.id_token);
  } catch (e) {
    return html(`<h1>No se pudo iniciar sesión</h1><p>${esc(e.message)}</p>`, 502);
  }
  if (!equipo().includes(correo)) return html(`<h1>Esta cuenta no tiene acceso</h1><p>${esc(correo)} no está en el equipo de ZH. Vuelve a conectar desde claude.ai y entra con tu cuenta de ZH.</p>`, 403);
  return volver({ code: firmar({ typ: "codigo", c: est.c, r: est.r, ch: est.ch, e: correo, res: est.res }, 300) });
}
