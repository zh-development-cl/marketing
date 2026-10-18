/* Llaves de acceso: el código (con su verificador PKCE) o la llave de renovación dan una llave de
   una hora y otra de renovación de 60 días. Si se crea otra clave del equipo, ninguna sirve más. */
import { json, faltaJson, conRespaldo } from "../../lib/http.js";
import { firmar, verificar, sha256b64u } from "../../lib/jwt.js";
import { claveEquipo } from "../../lib/clave.js";

const emitir = (secreto, quien, cliente, recurso) => json({
  access_token: firmar(secreto, { typ: "acceso", e: quien, c: cliente, aud: recurso }, 3600),
  token_type: "Bearer",
  expires_in: 3600,
  refresh_token: firmar(secreto, { typ: "renovar", e: quien, c: cliente, aud: recurso }, 60 * 86400),
  scope: "reuniones",
});
const malo = (descripcion) => json({ error: "invalid_grant", error_description: descripcion }, 400);

export const POST = conRespaldo(async (req) => {
  const cfg = await claveEquipo();
  if (!cfg) return faltaJson();
  const tipo = req.headers.get("content-type") || "";
  const d = tipo.includes("application/json") ? await req.json().catch(() => ({})) : Object.fromEntries(new URLSearchParams(await req.text()));
  if (d.grant_type === "authorization_code") {
    const c = verificar(cfg.secreto, d.code, "codigo");
    if (!c || c.c !== d.client_id || c.r !== d.redirect_uri) return malo("El código no sirve o venció.");
    if (!d.code_verifier || sha256b64u(d.code_verifier) !== c.ch) return malo("El verificador PKCE no coincide.");
    return emitir(cfg.secreto, c.e, sha256b64u(c.c), c.res);
  }
  if (d.grant_type === "refresh_token") {
    const r = verificar(cfg.secreto, d.refresh_token, "renovar");
    if (!r) return malo("La llave de renovación no sirve o venció.");
    if (d.client_id && sha256b64u(d.client_id) !== r.c) return malo("La llave es de otro cliente.");
    return emitir(cfg.secreto, r.e, r.c, r.aud);
  }
  return json({ error: "unsupported_grant_type" }, 400);
});
