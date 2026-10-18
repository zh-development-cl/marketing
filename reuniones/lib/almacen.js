/* Dónde se guarda todo: un almacén privado de Vercel Blob conectado al proyecto (Vercel le da al
   servidor BLOB_READ_WRITE_TOKEN). Cada cosa es un archivo JSON: la clave del equipo, el índice de
   las transcripciones y cada transcripción. Las pruebas cambian el almacén por uno en memoria con
   usarAlmacen().

   El plan gratis de Vercel incluye 2.000 escrituras y listados y 10.000 lecturas fuera del caché al
   mes, y si se pasa, el almacén se bloquea 30 días. Por eso el CRM lee un solo archivo (el índice),
   casi siempre desde el caché de Vercel, que no se cobra, y solo se escribe cuando llega una reunión.
   Un cambio tarda hasta un minuto en llegar al caché: lo que no puede esperar se lee directo. */
import { Falla } from "./http.js";

const sdk = () => import("@vercel/blob");
const VERCEL = {
  async leer(nombre, directo) {
    const { get } = await sdk();
    const r = await get(nombre, { access: "private", useCache: !directo });
    if (!r || r.statusCode !== 200 || !r.stream) return null;
    /* Si el caché comprime el archivo, el ETag llega como «W/"…"»: para escribir sirve sin el W/. */
    return { texto: await new Response(r.stream).text(), etag: String(r.blob.etag || "").replace(/^W\//, "") };
  },
  /* Con etag, solo si nadie lo cambió desde esa lectura; con crear, solo si todavía no existe. */
  async escribir(nombre, texto, { etag, crear, cache }) {
    const { put } = await sdk();
    await put(nombre, texto, { access: "private", addRandomSuffix: false, contentType: "application/json", cacheControlMaxAge: cache, ...(etag ? { ifMatch: etag } : { allowOverwrite: !crear }) });
  },
  async listar(prefijo) {
    const { list } = await sdk();
    const archivos = [];
    let cursor;
    do {
      const r = await list({ prefix: prefijo, cursor, limit: 1000 });
      for (const b of r.blobs) archivos.push({ nombre: b.pathname, subido: new Date(b.uploadedAt).getTime() });
      cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor && archivos.length < 10000);
    return archivos;
  },
  async borrar(nombres) {
    const { del } = await sdk();
    await del(nombres);
  },
};

let otro = null;
export const usarAlmacen = (a) => { otro = a; };
export const hayAlmacen = () => !!(otro || process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const almacen = () => {
  if (!hayAlmacen()) throw new Falla("Falta conectar el almacén de ZH Reuniones en Vercel (Storage → Blob, privado, conectado al proyecto zh-reuniones).", "sin_almacen");
  return otro || VERCEL;
};

const leerTexto = (r) => { try { return JSON.parse(r.texto); } catch { return null; } };

/* Un archivo JSON, o null si no está. Si el caché no lo tiene (recién creado), se confirma directo. */
export async function leerJson(nombre, { directo = false } = {}) {
  let r = await almacen().leer(nombre, directo);
  if (!r && !directo) r = await almacen().leer(nombre, true);
  return r ? leerTexto(r) : null;
}

/* `cache`: cuántos segundos puede servirlo el caché de Vercel (al cambiarlo se renueva en un minuto). */
export const guardarJson = (nombre, datos, cache) => almacen().escribir(nombre, JSON.stringify(datos), { cache });

/* Lo crea solo si no existe: false si ya estaba, aunque otro lo haya creado recién. */
export async function crearJson(nombre, datos, cache) {
  if (await almacen().leer(nombre, true)) return false;
  try {
    await almacen().escribir(nombre, JSON.stringify(datos), { crear: true, cache });
    return true;
  } catch (e) {
    if (await almacen().leer(nombre, true)) return false;
    throw e;
  }
}

/* Cambia un archivo sin pisar lo que otro escribió entre medio: lee la última versión, le aplica
   `cambio` y la escribe solo si nadie la tocó; si alguien la tocó, lo intenta de nuevo. `cambio`
   devuelve lo nuevo, o undefined si no hay nada que cambiar. */
export async function cambiarJson(nombre, cambio, cache) {
  for (let intento = 0; intento < 5; intento += 1) {
    const antes = await almacen().leer(nombre, true);
    const nuevo = cambio(antes ? leerTexto(antes) : null);
    if (nuevo === undefined) return false;
    const texto = JSON.stringify(nuevo);
    try {
      await almacen().escribir(nombre, texto, antes ? { etag: antes.etag, cache } : { crear: true, cache });
      return true;
    } catch (e) {
      const ahora = await almacen().leer(nombre, true);
      if ((ahora && ahora.etag) !== (antes && antes.etag)) continue;
      if (!antes) throw e;
      /* Nadie lo tocó y aun así Vercel no aceptó el ETag: se escribe sin esa condición. */
      await almacen().escribir(nombre, texto, { cache });
      return true;
    }
  }
  throw new Error(`${nombre}: lo cambiaron muchas veces seguidas`);
}

export const listar = (prefijo) => almacen().listar(prefijo);
export async function borrar(nombres) {
  if (nombres.length) await almacen().borrar(nombres);
}
