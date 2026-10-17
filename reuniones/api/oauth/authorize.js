/* Autorización (OAuth 2.1 con PKCE): se entra con Google y solo el equipo de ZH recibe el código. */
import { html, base, redirect } from "../../lib/http.js";
import { firmar, verificar } from "../../lib/jwt.js";
import { urlAutorizar, ALCANCES_LOGIN } from "../../lib/google.js";

export function GET(req) {
  const q = new URL(req.url).searchParams;
  const clienteId = q.get("client_id") || "";
  const regreso = q.get("redirect_uri") || "";
  const cliente = verificar(clienteId, "cliente");
  if (!cliente || !Array.isArray(cliente.r) || !cliente.r.includes(regreso)) return html("<h1>No se puede conectar</h1><p>La aplicación que pidió el acceso no está registrada en ZH Reuniones. Vuelve a agregar el conector en claude.ai.</p>", 400);
  const volver = (error, descripcion) => redirect(`${regreso}${regreso.includes("?") ? "&" : "?"}${new URLSearchParams({ error, error_description: descripcion, ...(q.get("state") ? { state: q.get("state") } : {}) })}`);
  if (q.get("response_type") !== "code") return volver("unsupported_response_type", "Solo se acepta response_type=code.");
  if (q.get("code_challenge_method") !== "S256" || !q.get("code_challenge")) return volver("invalid_request", "Falta PKCE con S256.");
  const b = base(req);
  const estado = firmar({ typ: "estado", c: clienteId, r: regreso, ch: q.get("code_challenge"), s: q.get("state") || "", res: q.get("resource") || `${b}/mcp` }, 600);
  return redirect(urlAutorizar({ redirectUri: `${b}/api/oauth/google`, state: estado, alcances: ALCANCES_LOGIN }));
}
