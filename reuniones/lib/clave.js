/* La clave del equipo. La crea un socio una sola vez en la página de ZH Reuniones (/api/equipo) y
   queda en el almacén solo como resumen con sal (scrypt), junto a un secreto al azar que nunca sale
   del servidor. Del secreto salen la firma de las llaves del conector y la dirección para
   TranscripTonic: si se crea otra clave, las dos cambian. Para cambiarla se borra config/clave.json
   del almacén (Vercel → Storage → zh-reuniones) y se crea otra en la página. */
import { scryptSync, randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { base, ipDe } from "./http.js";
import { leerJson, crearJson } from "./almacen.js";

export const ARCHIVO = "config/clave.json";
export const LARGO = 8;
export const MAXIMO = 200;
const CACHE = 3600;
const RECORDAR = 60000;
let guardada = null;
let hasta = 0;

/* La clave configurada (su resumen, no la clave), o null si todavía no se crea. Cada función la
   recuerda un minuto: si se borra del almacén, deja de servir en un par de minutos. */
export async function claveEquipo() {
  if (guardada && hasta > Date.now()) return guardada;
  const c = await leerJson(ARCHIVO);
  guardada = c && c.sal && c.resumen && c.secreto ? { sal: c.sal, resumen: c.resumen, secreto: c.secreto, creada: c.creada || "" } : null;
  hasta = Date.now() + RECORDAR;
  return guardada;
}

const resumir = (clave, sal) => scryptSync(String(clave), sal, 32);
export function claveCorrecta(cfg, dada) {
  if (!cfg || typeof dada !== "string" || !dada || dada.length > MAXIMO) return false;
  const esperado = Buffer.from(cfg.resumen, "base64url");
  const dado = resumir(dada, Buffer.from(cfg.sal, "base64url"));
  return dado.length === esperado.length && timingSafeEqual(dado, esperado);
}

/* La primera vez: guarda la clave nueva. null si ya había una (por ejemplo, la creó otro recién). */
export async function crearClave(nueva) {
  const sal = randomBytes(16);
  const doc = { sal: sal.toString("base64url"), resumen: resumir(nueva, sal).toString("base64url"), secreto: randomBytes(32).toString("base64url"), creada: new Date().toISOString() };
  if (!(await crearJson(ARCHIVO, doc, CACHE))) return null;
  guardada = doc;
  hasta = Date.now() + RECORDAR;
  return guardada;
}

export const tokenWebhook = (cfg) => createHmac("sha256", cfg.secreto).update("zh-reuniones/webhook").digest("base64url").slice(0, 32);
export const urlWebhook = (req, cfg) => `${base(req)}/api/transcripcion?t=${tokenWebhook(cfg)}`;
export const olvidarClave = () => { guardada = null; hasta = 0; };

/* Intentos con la clave equivocada: desde el décimo en una hora, la misma dirección queda bloqueada
   una hora. Se cuentan en la memoria de cada función: la clave es larga y esto solo frena. */
const LIMITE = 10;
const fallas = new Map();
export function bloqueado(req) {
  const f = fallas.get(ipDe(req));
  return !!f && f.hasta > Date.now() && f.n >= LIMITE;
}
export function anotarFalla(req) {
  const k = ipDe(req);
  const f = fallas.get(k);
  if (!f || f.hasta <= Date.now()) fallas.set(k, { n: 1, hasta: Date.now() + 36e5 });
  else f.n += 1;
  if (fallas.size > 5000) fallas.clear();
}
export const olvidarFallas = () => fallas.clear();
