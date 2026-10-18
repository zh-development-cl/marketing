/* Las transcripciones que manda TranscripTonic (la extensión de Chrome que guarda los subtítulos de
   Google Meet, con el nombre de quien habla) al terminar cada reunión. Esperan en la base hasta que
   se registran en el CRM y se borran solas a los DIAS días. */
import { createHash } from "node:crypto";
import { Falla } from "./http.js";
import { redis, varios } from "./almacen.js";

export const DIAS = 14;
const MAX_TEXTO = 300000;
const INDICE = "zhr:idx";
const llaveDe = (id) => `zhr:t:${id}`;
const limpiar = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
export const codigoMeet = (s) => { const m = String(s || "").match(/\b([a-z]{3,}-[a-z]{3,}-[a-z]{3,})\b/i); return m ? m[1].toLowerCase() : ""; };

/* El cuerpo «advanced» trae los bloques; el «simple», el texto ya armado («Nombre (hora)\ntexto»). */
function bloquesDe(v, campoTexto) {
  if (Array.isArray(v)) return v.slice(0, 50000).map((b) => ({ quien: b && b.personName, texto: b && b[campoTexto] }));
  return String(v || "").split(/\n\s*\n/).map((bloque) => {
    const [cabeza = "", ...resto] = bloque.split("\n");
    const m = cabeza.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
    return m ? { quien: m[1], texto: resto.join(" ") } : { quien: "", texto: bloque };
  });
}

/* Una línea por intervención: las frases seguidas de la misma persona van juntas. */
function intervenciones(bloques) {
  const lineas = [];
  for (const b of bloques) {
    const texto = limpiar(b.texto, 20000);
    if (!texto) continue;
    const quien = limpiar(b.quien, 80) || "Participante";
    const ultima = lineas[lineas.length - 1];
    if (ultima && ultima.quien === quien) ultima.texto += " " + texto;
    else lineas.push({ quien, texto });
  }
  return lineas;
}

/* Solo las fechas ISO: las del cuerpo «simple» vienen en el formato del computador, sin zona horaria. */
const iso = (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v) ? Date.parse(v) : NaN);

/* Guarda lo que llega del webhook. La misma reunión mandada otra vez (por ejemplo, desde «Last 10
   meetings») reemplaza a la anterior. */
export async function guardarTranscripcion(d) {
  if (!d || typeof d !== "object" || Array.isArray(d)) throw new Falla("Falta la transcripción.", "sin_datos");
  const lineas = intervenciones(bloquesDe(d.transcript, "transcriptText"));
  if (!lineas.length) return { guardada: false, motivo: "La reunión no tiene nada transcrito." };
  const chat = intervenciones(bloquesDe(d.chatMessages, "chatMessageText"));
  const bloques = Array.isArray(d.transcript) ? d.transcript : [];
  const ahora = Date.now();
  let fin = iso(d.meetingEndTimestamp);
  if (!Number.isFinite(fin)) fin = iso(bloques.length ? bloques[bloques.length - 1].timestamp : "");
  if (!Number.isFinite(fin) || fin > ahora + 300000) fin = ahora;
  let inicio = iso(d.meetingStartTimestamp);
  if (!Number.isFinite(inicio)) inicio = iso(bloques.length ? bloques[0].timestamp : "");
  if (!Number.isFinite(inicio) || inicio > fin) inicio = fin;
  const titulo = limpiar(d.meetingTitle, 200);
  const software = limpiar(d.meetingSoftware, 40) || "Google Meet";
  const id = `tt-${inicio.toString(36)}-${createHash("sha256").update(`${titulo}|${inicio}|${software}`).digest("hex").slice(0, 8)}`;
  let texto = lineas.map((l) => `${l.quien}: ${l.texto}`).join("\n");
  if (chat.length) texto += "\n\n[Chat de la reunión]\n" + chat.map((l) => `${l.quien}: ${l.texto}`).join("\n");
  if (texto.length > MAX_TEXTO) texto = texto.slice(0, MAX_TEXTO) + "\n[transcripción recortada]";
  const doc = { id, titulo, codigo: codigoMeet(titulo), software, inicio: new Date(inicio).toISOString(), fin: new Date(fin).toISOString(), recibida: new Date(ahora).toISOString(), participantes: [...new Set(lineas.map((l) => l.quien))].slice(0, 40), intervenciones: lineas.length, texto };
  await varios([
    ["SET", llaveDe(id), JSON.stringify(doc), "EX", DIAS * 86400],
    ["ZADD", INDICE, inicio, id],
    ["ZREMRANGEBYSCORE", INDICE, "-inf", ahora - DIAS * 864e5],
    ["ZREMRANGEBYRANK", INDICE, 0, -501],
  ]);
  return { guardada: true, id };
}

/* Las transcripciones de los últimos días, sin el texto: id, título de la reunión, cuándo fue y quiénes hablaron. */
export async function transcripciones(args) {
  const dias = Math.min(30, Math.max(1, Math.round(Number(args && args.dias)) || DIAS));
  const ids = await redis("ZRANGEBYSCORE", INDICE, Date.now() - dias * 864e5, "+inf");
  const lista = [];
  if (Array.isArray(ids) && ids.length) {
    for (const crudo of (await redis("MGET", ...ids.slice(-200).map(llaveDe))) || []) {
      let t;
      try { t = JSON.parse(crudo); } catch { t = null; }
      if (!t || !t.id) continue;
      lista.push({ id: t.id, titulo: t.titulo, codigo: t.codigo, software: t.software, inicio: t.inicio, fin: t.fin, estado: "lista", participantes: t.participantes, intervenciones: t.intervenciones });
    }
  }
  lista.sort((a, b) => Date.parse(b.inicio) - Date.parse(a.inicio));
  return { transcripciones: lista };
}

/* El texto de una transcripción: «Nombre: lo que dijo», una línea por intervención, y el chat al final. */
export async function leerTranscripcion(args) {
  const id = String((args && args.id) || "");
  if (!/^tt-[a-z0-9]+-[a-f0-9]{8}$/.test(id)) throw new Falla("Falta la transcripción que hay que leer.", "sin_id");
  let t;
  try { t = JSON.parse(await redis("GET", llaveDe(id))); } catch { t = null; }
  if (!t) throw new Falla(`La transcripción ya no está: se borra sola ${DIAS} días después de llegar.`, "no_existe");
  return { id: t.id, titulo: t.titulo, participantes: t.participantes, intervenciones: t.intervenciones, texto: t.texto };
}
