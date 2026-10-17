/* El conector MCP (HTTP, sin sesión). Sin llave válida responde 401 con dónde autorizarse. */
import { json, base, equipo, configurado } from "../lib/http.js";
import { verificar } from "../lib/jwt.js";
import { atender } from "../lib/mcp.js";

const sinAcceso = (req) => new Response(JSON.stringify({ error: "invalid_token", error_description: "Falta conectar ZH Reuniones." }), {
  status: 401,
  headers: { "content-type": "application/json", "cache-control": "no-store", "www-authenticate": `Bearer resource_metadata="${base(req)}/.well-known/oauth-protected-resource/mcp"` },
});

function usuario(req) {
  if (!configurado()) return null;
  const m = (req.headers.get("authorization") || "").match(/^Bearer\s+(\S+)$/i);
  const t = m && verificar(m[1], "acceso");
  if (!t || !equipo().includes(t.e)) return null;
  /* La llave es para este conector (mismo servidor), aunque la dirección traiga otra forma. */
  try { if (t.aud && new URL(t.aud).host !== new URL(base(req)).host) return null; } catch { return null; }
  return t.e;
}

export async function POST(req) {
  if (!usuario(req)) return sinAcceso(req);
  let cuerpo;
  try { cuerpo = await req.json(); } catch { return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON inválido." } }, 400); }
  const mensajes = Array.isArray(cuerpo) ? cuerpo : [cuerpo];
  const respuestas = (await Promise.all(mensajes.map(atender))).filter(Boolean);
  if (!respuestas.length) return new Response(null, { status: 202 });
  return json(Array.isArray(cuerpo) ? respuestas : respuestas[0]);
}

export function GET(req) {
  return usuario(req) ? new Response(null, { status: 405, headers: { allow: "POST" } }) : sinAcceso(req);
}

export function DELETE() {
  return new Response(null, { status: 405, headers: { allow: "POST" } });
}
