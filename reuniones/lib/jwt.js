/* Fichas firmadas (JWT con HMAC-SHA256): el registro de cada cliente OAuth, el estado del inicio de
   sesión, los códigos y las llaves de acceso. No se guarda nada: lo que importa va firmado con el
   secreto de la clave del equipo, así que si la clave cambia, ninguna llave sirve más. */
import { createHmac, createHash, timingSafeEqual } from "node:crypto";

const b64u = (v) => Buffer.from(v).toString("base64url");
const llave = (secreto) => createHmac("sha256", String(secreto)).update("zh-reuniones/fichas").digest();

export function firmar(secreto, datos, segundos) {
  const ahora = Math.floor(Date.now() / 1000);
  const h = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const p = b64u(JSON.stringify({ ...datos, iat: ahora, ...(segundos ? { exp: ahora + segundos } : {}) }));
  return `${h}.${p}.${b64u(createHmac("sha256", llave(secreto)).update(`${h}.${p}`).digest())}`;
}

export function verificar(secreto, token, tipo) {
  const partes = String(token || "").split(".");
  if (partes.length !== 3) return null;
  const [h, p, s] = partes;
  const esperada = createHmac("sha256", llave(secreto)).update(`${h}.${p}`).digest();
  const dada = Buffer.from(s, "base64url");
  if (dada.length !== esperada.length || !timingSafeEqual(dada, esperada)) return null;
  let d;
  try { d = JSON.parse(Buffer.from(p, "base64url").toString("utf8")); } catch { return null; }
  if (!d || typeof d !== "object") return null;
  if (d.exp && d.exp < Math.floor(Date.now() / 1000)) return null;
  if (tipo && d.typ !== tipo) return null;
  return d;
}

export const sha256b64u = (s) => createHash("sha256").update(String(s)).digest("base64url");
