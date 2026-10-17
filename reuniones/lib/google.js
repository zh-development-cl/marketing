/* Google: el inicio de sesión (OpenID) y la API de Meet con la cuenta de ZH (GOOGLE_REFRESH_TOKEN). */
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const MEET = "https://meet.googleapis.com/v2";

/* Permisos de la cuenta de ZH: cambiar la configuración de sus reuniones (para prender la
   transcripción) y leer sus registros y transcripciones. */
export const ALCANCES_DATOS = ["openid", "email", "https://www.googleapis.com/auth/meetings.space.settings", "https://www.googleapis.com/auth/meetings.space.readonly"];
export const ALCANCES_LOGIN = ["openid", "email", "profile"];

export function urlAutorizar({ redirectUri, state, alcances, offline, loginHint }) {
  const p = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID || "", redirect_uri: redirectUri, response_type: "code", scope: alcances.join(" "), state });
  if (offline) { p.set("access_type", "offline"); p.set("prompt", "consent"); } else p.set("prompt", "select_account");
  if (loginHint) p.set("login_hint", loginHint);
  return `${AUTH_URL}?${p}`;
}

async function pedirToken(campos) {
  const r = await fetch(TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID || "", client_secret: process.env.GOOGLE_CLIENT_SECRET || "", ...campos }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(d.error === "invalid_grant" ? "La autorización de Google de la cuenta de ZH venció o se revocó: vuelve a conectarla desde la página de inicio de zh-reuniones." : "Google no respondió bien al pedir el acceso.");
    e.code = d.error === "invalid_grant" ? "google_reconectar" : "google";
    throw e;
  }
  return d;
}

export const canjearCodigo = ({ code, redirectUri }) => pedirToken({ code: String(code || ""), redirect_uri: redirectUri, grant_type: "authorization_code" });

/* El correo del id_token. Llega directo del endpoint de tokens de Google por TLS (con nuestro
   secreto), así que basta revisar emisor, audiencia, vencimiento y que el correo esté verificado. */
export function correoDeIdToken(idToken) {
  let p;
  try { p = JSON.parse(Buffer.from(String(idToken).split(".")[1], "base64url").toString("utf8")); } catch { p = null; }
  if (!p || p.aud !== process.env.GOOGLE_CLIENT_ID || !["accounts.google.com", "https://accounts.google.com"].includes(p.iss) || (p.exp || 0) * 1000 < Date.now() || p.email_verified === false || !p.email) throw new Error("Google no confirmó la cuenta.");
  return String(p.email).toLowerCase();
}

let cache = { token: "", vence: 0, llave: "" };
export async function tokenDatos() {
  const llave = process.env.GOOGLE_REFRESH_TOKEN || "";
  if (!llave) { const e = new Error("Falta conectar la cuenta de Google de ZH (página de inicio de zh-reuniones)."); e.code = "google_reconectar"; throw e; }
  if (cache.token && cache.llave === llave && cache.vence > Date.now() + 60000) return cache.token;
  const d = await pedirToken({ refresh_token: llave, grant_type: "refresh_token" });
  cache = { token: d.access_token, vence: Date.now() + (Number(d.expires_in) || 3600) * 1000, llave };
  return cache.token;
}
export const olvidarToken = () => { cache = { token: "", vence: 0, llave: "" }; };

export async function meet(ruta, { method = "GET", body, query } = {}) {
  const token = await tokenDatos();
  const r = await fetch(`${MEET}/${ruta}${query ? "?" + new URLSearchParams(query) : ""}`, { method, headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error((d.error && d.error.message) || `Meet respondió ${r.status}`);
    e.status = r.status;
    e.google = (d.error && d.error.status) || "";
    throw e;
  }
  return d;
}

export const codigoMeet = (s) => { const m = String(s || "").match(/\b([a-z]{3,}-[a-z]{3,}-[a-z]{3,})\b/i); return m ? m[1].toLowerCase() : ""; };
