/* Autorización (OAuth 2.1 con PKCE): se escribe la clave del equipo de ZH y recién ahí claude.ai
   recibe el código. La ficha «estado» lleva firmado todo lo de la solicitud. */
import { html, esc, base, redirect, listo, claveOk, faltaHtml } from "../../lib/http.js";
import { firmar, verificar } from "../../lib/jwt.js";
import { bloqueado, anotarFalla } from "../../lib/almacen.js";

const origen = (u) => { try { return new URL(u).origin; } catch { return ""; } };
const volverA = (regreso, params) => redirect(`${regreso}${regreso.includes("?") ? "&" : "?"}${new URLSearchParams(params)}`);

/* El formulario puede enviarse aquí y, al aceptar, seguir a claude.ai (form-action cubre el redireccionamiento). */
const formulario = (estado, regreso, aviso, status = 200) => html(`<h1>Conectar ZH Reuniones</h1>
<p>Escribe la clave del equipo de ZH (la de <code>CLAVE_EQUIPO</code> en Vercel) para conectar el conector con claude.ai.</p>
<form class="card" method="post" action="/api/oauth/authorize"><input type="hidden" name="estado" value="${esc(estado)}">
<label>Clave del equipo<input type="password" name="clave" autocomplete="current-password" required autofocus></label>
${aviso ? `<p class="bad">${esc(aviso)}</p>` : ""}<button type="submit">Conectar</button></form>`, status, `'self' ${origen(regreso)}`.trim());

export function GET(req) {
  if (!listo()) return faltaHtml();
  const q = new URL(req.url).searchParams;
  const clienteId = q.get("client_id") || "";
  const regreso = q.get("redirect_uri") || "";
  const cliente = verificar(clienteId, "cliente");
  if (!cliente || !Array.isArray(cliente.r) || !cliente.r.includes(regreso)) return html("<h1>No se puede conectar</h1><p>La aplicación que pidió el acceso no está registrada en ZH Reuniones. Vuelve a agregar el conector en claude.ai.</p>", 400);
  const estadoClaude = q.get("state") || "";
  const volver = (error, descripcion) => volverA(regreso, { error, error_description: descripcion, ...(estadoClaude ? { state: estadoClaude } : {}) });
  if (q.get("response_type") !== "code") return volver("unsupported_response_type", "Solo se acepta response_type=code.");
  if (q.get("code_challenge_method") !== "S256" || !q.get("code_challenge")) return volver("invalid_request", "Falta PKCE con S256.");
  const estado = firmar({ typ: "estado", c: clienteId, r: regreso, ch: q.get("code_challenge"), s: estadoClaude, res: q.get("resource") || `${base(req)}/mcp` }, 900);
  return formulario(estado, regreso);
}

export async function POST(req) {
  if (!listo()) return faltaHtml();
  const d = Object.fromEntries(new URLSearchParams(await req.text()));
  const est = verificar(d.estado, "estado");
  if (!est) return html("<h1>El enlace venció</h1><p>Vuelve a conectar ZH Reuniones desde claude.ai.</p>", 400);
  if (await bloqueado(req)) return formulario(d.estado, est.r, "Demasiados intentos con una clave equivocada. Espera una hora y vuelve a intentar.", 429);
  if (!claveOk(d.clave)) {
    await anotarFalla(req);
    return formulario(d.estado, est.r, "La clave no es la del equipo.", 403);
  }
  return volverA(est.r, { code: firmar({ typ: "codigo", c: est.c, r: est.r, ch: est.ch, e: "equipo", res: est.res }, 300), ...(est.s ? { state: est.s } : {}) });
}
