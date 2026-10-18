/* La base donde esperan las transcripciones hasta que se registran: Upstash Redis, creada desde el
   proyecto en Vercel (Storage → Upstash for Redis), que deja KV_REST_API_URL y KV_REST_API_TOKEN.
   Se usa su API REST, sin librerías. */
import { Falla, ipDe } from "./http.js";

const url = () => String(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/+$/, "");
const llave = () => String(process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "");
export const hayAlmacen = () => !!(url() && llave());

async function enviar(ruta, cuerpo) {
  if (!hayAlmacen()) throw new Falla("Falta crear la base de ZH Reuniones en Vercel (Storage → Upstash for Redis).", "sin_almacen");
  const r = await fetch(url() + ruta, { method: "POST", headers: { authorization: `Bearer ${llave()}`, "content-type": "application/json" }, body: JSON.stringify(cuerpo) });
  const d = await r.json().catch(() => null);
  if (!r.ok || !d) {
    const e = new Error((d && d.error) || `La base respondió ${r.status}`);
    e.status = r.status;
    throw e;
  }
  return d;
}

/* Un comando: redis("GET", "llave"). */
export async function redis(...comando) {
  const d = await enviar("", comando.map(String));
  if (d.error) throw new Error(d.error);
  return d.result;
}

/* Varios comandos en una sola ida; devuelve el resultado de cada uno. */
export async function varios(comandos) {
  const d = await enviar("/pipeline", comandos.map((c) => c.map(String)));
  if (!Array.isArray(d)) throw new Error("La base no respondió bien.");
  const malo = d.find((x) => x && x.error);
  if (malo) throw new Error(malo.error);
  return d.map((x) => x && x.result);
}

/* Intentos con la clave del equipo equivocada: desde la décima en una hora, la misma dirección queda
   bloqueada hasta que pase una hora sin intentos. Sin base no se cuentan (la clave es larga). */
const LIMITE = 10;
const llaveFallas = (req) => `zhr:fallas:${ipDe(req)}`;
export async function bloqueado(req) {
  if (!hayAlmacen()) return false;
  try { return Number(await redis("GET", llaveFallas(req))) >= LIMITE; } catch { return false; }
}
export async function anotarFalla(req) {
  if (!hayAlmacen()) return;
  try { await varios([["INCR", llaveFallas(req)], ["EXPIRE", llaveFallas(req), 3600]]); } catch { /* sin base, sin límite */ }
}
