/* Respuestas y utilidades comunes. */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });

export const redirect = (url) => new Response(null, { status: 302, headers: { location: url, "cache-control": "no-store" } });

export const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* Una página simple, con los colores de ZH (tinta, papel y señal azul) y sin scripts. `formularios`
   dice adónde pueden ir sus formularios (por defecto, a ninguna parte). */
export const html = (cuerpo, status = 200, formularios = "'none'") =>
  new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ZH Reuniones</title>
<style>:root{color-scheme:light dark;--bg:#F6F7F9;--fg:#0B0F17;--fg2:#5D6777;--line:#E6E9EF;--card:#FFFFFF;--accent:#245CE4;--on:#FFFFFF;--ok:#17784A;--bad:#B3261E}
@media (prefers-color-scheme:dark){:root{--bg:#07090F;--fg:#EDF0F5;--fg2:#A3ADBE;--line:#1C2331;--card:#0D1119;--accent:#8FB0FF;--on:#07090F;--ok:#63D394;--bad:#FF8F86}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding-block:48px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
main{max-width:40rem;margin:0 auto;display:grid;gap:16px}h1{margin:0;font-size:28px;line-height:1.15;letter-spacing:-.02em}p{margin:0;color:var(--fg2)}
.card{display:grid;gap:10px;padding:18px;border:1px solid var(--line);border-radius:16px;background:var(--card)}code,textarea{font:14px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace}
textarea,input{width:100%;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--fg)}input{font:inherit}label{display:grid;gap:6px;font-weight:600}
a.btn,button{display:inline-block;padding:10px 16px;border:0;border-radius:999px;background:var(--accent);color:var(--on);text-decoration:none;font:inherit;font-weight:600;justify-self:start;cursor:pointer}
.ok{color:var(--ok)}.bad{color:var(--bad)}ul,ol{margin:0;padding-left:20px;color:var(--fg2)}li+li{margin-top:4px}</style></head><body><main>${cuerpo}</main></body></html>`,
  { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "content-security-policy": `default-src 'none'; style-src 'unsafe-inline'; form-action ${formularios}; frame-ancestors 'none'; base-uri 'none'` } });

/* La dirección pública de este despliegue (la de la solicitud, o BASE_URL si está). */
export const base = (req) => {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/+$/, "");
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
};

/* La clave del equipo (CLAVE_EQUIPO en Vercel): con ella se conecta el conector en claude.ai y de
   ella sale la dirección donde TranscripTonic deja las transcripciones. Si se cambia, las dos dejan
   de servir: cada uno vuelve a conectar y se pega la dirección nueva en la extensión. */
export const claveEquipo = () => String(process.env.CLAVE_EQUIPO || "");
export const listo = () => claveEquipo().length >= 16;
const resumen = (s) => createHash("sha256").update(String(s == null ? "" : s)).digest();
export const igual = (a, b) => timingSafeEqual(resumen(a), resumen(b));
export const claveOk = (dada) => listo() && igual(dada, claveEquipo());
export const tokenWebhook = () => createHmac("sha256", claveEquipo()).update("zh-reuniones/webhook").digest("base64url").slice(0, 32);
export const urlWebhook = (req) => `${base(req)}/api/transcripcion?t=${tokenWebhook()}`;

export const FALTA_CLAVE = "Falta la clave del equipo de ZH Reuniones en Vercel (CLAVE_EQUIPO, de 16 caracteres o más).";
export const faltaJson = () => json({ error: "temporarily_unavailable", error_description: FALTA_CLAVE }, 503);
export const faltaHtml = () => html(`<h1>Todavía no está listo</h1><p>${FALTA_CLAVE}</p>`, 503);

/* Un error que se puede mostrar tal cual, con su código para el CRM. */
export class Falla extends Error {
  constructor(mensaje, code) { super(mensaje); this.code = code || "falla"; }
}

export const ipDe = (req) => req.headers.get("x-real-ip") || String(req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "sin-ip";
