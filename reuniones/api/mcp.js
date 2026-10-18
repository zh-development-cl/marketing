/* El conector MCP (HTTP, sin sesión). Sin llave válida responde 401 con dónde autorizarse. */
import { json, base, conRespaldo } from "../lib/http.js";
import { verificar } from "../lib/jwt.js";
import { claveEquipo } from "../lib/clave.js";
import { atender } from "../lib/mcp.js";

const sinAcceso = (req) => new Response(JSON.stringify({ error: "invalid_token", error_description: "Falta conectar ZH Reuniones." }), {
  status: 401,
  headers: { "content-type": "application/json", "cache-control": "no-store", "www-authenticate": `Bearer resource_metadata="${base(req)}/.well-known/oauth-protected-resource/mcp"` },
});

async function usuario(req) {
  const m = (req.headers.get("authorization") || "").match(/^Bearer\s+(\S+)$/i);
  if (!m) return null;
  const cfg = await claveEquipo();
  const t = cfg && verificar(cfg.secreto, m[1], "acceso");
  if (!t) return null;
  /* La llave es para este conector (mismo servidor), aunque la dirección traiga otra forma. */
  try { if (t.aud && new URL(t.aud).host !== new URL(base(req)).host) return null; } catch { return null; }
  return t.e || "equipo";
}

export const POST = conRespaldo(async (req) => {
  if (!(await usuario(req))) return sinAcceso(req);
  let cuerpo;
  try { cuerpo = await req.json(); } catch { return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON inválido." } }, 400); }
  const mensajes = Array.isArray(cuerpo) ? cuerpo : [cuerpo];
  const respuestas = (await Promise.all(mensajes.map(atender))).filter(Boolean);
  if (!respuestas.length) return new Response(null, { status: 202 });
  return json(Array.isArray(cuerpo) ? respuestas : respuestas[0]);
});

export const GET = conRespaldo(async (req) => ((await usuario(req)) ? new Response(null, { status: 405, headers: { allow: "POST" } }) : sinAcceso(req)));

export function DELETE() {
  return new Response(null, { status: 405, headers: { allow: "POST" } });
}
