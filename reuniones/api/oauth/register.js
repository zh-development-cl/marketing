/* Registro dinámico de clientes (RFC 7591): el client_id es la ficha firmada con sus direcciones de
   regreso, así que no hay nada que guardar. Solo se aceptan las de claude.ai y las locales. */
import { json, configurado, faltaJson } from "../../lib/http.js";
import { firmar } from "../../lib/jwt.js";

const PERMITIDAS = ["https://claude.ai/api/mcp/auth_callback", "https://claude.com/api/mcp/auth_callback"];
const permitida = (u) => PERMITIDAS.includes(u) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/[^\s]*$/.test(u);

export async function POST(req) {
  if (!configurado()) return faltaJson();
  let d;
  try { d = await req.json(); } catch { return json({ error: "invalid_client_metadata", error_description: "El cuerpo no es JSON." }, 400); }
  const uris = Array.isArray(d && d.redirect_uris) ? d.redirect_uris.map(String) : [];
  if (!uris.length || uris.length > 5 || !uris.every(permitida)) return json({ error: "invalid_redirect_uri", error_description: "Solo se aceptan las direcciones de regreso de claude.ai." }, 400);
  const nombre = String((d && d.client_name) || "Cliente MCP").slice(0, 80);
  return json({
    client_id: firmar({ typ: "cliente", r: uris, n: nombre }),
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: nombre,
    redirect_uris: uris,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  }, 201);
}
