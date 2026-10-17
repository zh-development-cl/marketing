/* Los documentos que lee claude.ai para conectarse: el recurso protegido (RFC 9728) y el servidor de
   autorización (RFC 8414). */
import { json, base } from "../lib/http.js";

export function GET(req) {
  const b = base(req);
  const cache = { "cache-control": "public, max-age=300" };
  if (new URL(req.url).searchParams.get("doc") === "recurso") {
    return json({ resource: `${b}/mcp`, authorization_servers: [b], scopes_supported: ["reuniones"], bearer_methods_supported: ["header"], resource_name: "ZH Reuniones" }, 200, cache);
  }
  return json({
    issuer: b,
    authorization_endpoint: `${b}/api/oauth/authorize`,
    token_endpoint: `${b}/api/oauth/token`,
    registration_endpoint: `${b}/api/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["reuniones"],
  }, 200, cache);
}
