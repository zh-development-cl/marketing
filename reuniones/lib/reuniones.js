/* Las transcripciones: las de Google Meet que manda TranscripTonic (la extensión de Chrome que guarda
   los subtítulos, con el nombre de quien habla) al terminar cada reunión, y las de «Transcribir en
   vivo» (/vivo), que escucha una llamada o una reunión presencial y la pasa a texto para un lead o un
   cliente del CRM. Esperan en el almacén hasta que se registran en el CRM y se borran a los DIAS días
   de llegar. Cada una es un archivo (transcripciones/<id>.json) y todas están en un índice sin el
   texto (indice.json): el CRM solo lee el índice para saber qué llegó, y el texto, al registrar una. */
import { createHash } from "node:crypto";
import { Falla } from "./http.js";
import { guardarJson, leerJson, cambiarJson, listar, borrar } from "./almacen.js";

export const DIAS = 14;
const MAX_TEXTO = 300000;
const MAX_INDICE = 200;
const INDICE = "indice.json";
const TEXTOS = "transcripciones/";
const TEXTO = (id) => `${TEXTOS}${id}.json`;
const ID = /^tt-[a-z0-9]+-[a-f0-9]{8}$/;
const vieja = (ms) => !(Date.now() - ms <= DIAS * 864e5);
const vigente = (t) => !!t && ID.test(t.id) && !vieja(Date.parse(t.recibida));
/* Segundos que el caché de Vercel puede servir cada archivo (al cambiarlo se renueva en un minuto). */
const CACHE_INDICE = 300;
const CACHE_TEXTO = 3600;

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

/* Borra los archivos de más de DIAS días, también los que no alcanzaron a quedar en el índice. */
async function barrer() {
  const archivos = await listar(TEXTOS);
  await borrar(archivos.filter((a) => vieja(a.subido)).map((a) => a.nombre));
}

/* Saca del índice las que ya cumplieron DIAS días y borra sus archivos. */
async function quitarViejas() {
  let viejas = [];
  await cambiarJson(INDICE, (lista) => {
    viejas = Array.isArray(lista) ? lista.filter((t) => !vigente(t)) : [];
    return viejas.length ? lista.filter(vigente) : undefined;
  }, CACHE_INDICE);
  await borrar(viejas.filter((t) => t && ID.test(t.id)).map((t) => TEXTO(t.id)));
}

/* Guarda lo que llega del webhook. La misma reunión mandada otra vez (por ejemplo, desde «Last 10
   meetings») reemplaza a la anterior; una de hace más de DIAS días no se guarda. */
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
  if (vieja(inicio)) return { guardada: false, motivo: `La reunión es de hace más de ${DIAS} días.` };
  const titulo = limpiar(d.meetingTitle, 200);
  const software = limpiar(d.meetingSoftware, 40) || "Google Meet";
  const id = `tt-${inicio.toString(36)}-${createHash("sha256").update(`${titulo}|${inicio}|${software}`).digest("hex").slice(0, 8)}`;
  let texto = lineas.map((l) => `${l.quien}: ${l.texto}`).join("\n");
  if (chat.length) texto += "\n\n[Chat de la reunión]\n" + chat.map((l) => `${l.quien}: ${l.texto}`).join("\n");
  if (texto.length > MAX_TEXTO) texto = texto.slice(0, MAX_TEXTO) + "\n[transcripción recortada]";
  const doc = { id, origen: "meet", tipo: "reunion", titulo, codigo: codigoMeet(titulo), software, inicio: new Date(inicio).toISOString(), fin: new Date(fin).toISOString(), recibida: new Date(ahora).toISOString(), participantes: [...new Set(lineas.map((l) => l.quien))].slice(0, 40), intervenciones: lineas.length, texto };
  await guardarDoc(doc);
  try { await barrer(); } catch (e) { console.error("[zh-reuniones] barrer", e && e.message); }
  return { guardada: true, id };
}

/* Primero el texto y después el índice: si el índice falla, el archivo suelto se borra con el barrido. */
async function guardarDoc(doc) {
  const { texto: _, ...resumen } = doc;
  await guardarJson(TEXTO(doc.id), doc, CACHE_TEXTO);
  await cambiarJson(INDICE, (lista) => [...(Array.isArray(lista) ? lista : []).filter((t) => vigente(t) && t.id !== doc.id), resumen].slice(-MAX_INDICE), CACHE_INDICE);
}

/* Lo que manda la página «Transcribir en vivo»: las frases que reconoció el navegador, sin el nombre
   de quien habla, para el lead o el cliente `ref` (su id en el CRM). La misma, mandada otra vez,
   reemplaza a la anterior. No barre el almacén: las llamadas pueden ser muchas y cada barrido se cobra. */
export const REF = /^[A-Za-z0-9_.~:@+-]{1,100}$/;
export async function guardarEnVivo(d) {
  if (!d || typeof d !== "object" || Array.isArray(d)) throw new Falla("Falta la transcripción.", "sin_datos");
  const ref = d.ref == null || d.ref === "" ? "" : String(d.ref);
  if (ref && !REF.test(ref)) throw new Falla("El lead o cliente de la transcripción no es válido.", "sin_ref");
  const tipo = d.tipo === "reunion" ? "reunion" : "llamada";
  const frases = (Array.isArray(d.lineas) ? d.lineas.slice(0, 20000) : []).map((x) => limpiar(x, 20000)).filter(Boolean);
  if (!frases.length) return { guardada: false, motivo: "No se transcribió nada." };
  const ahora = Date.now();
  let fin = iso(d.fin);
  if (!Number.isFinite(fin) || fin > ahora + 300000) fin = ahora;
  let inicio = iso(d.inicio);
  if (!Number.isFinite(inicio) || inicio > fin) inicio = fin;
  if (vieja(inicio)) return { guardada: false, motivo: `La transcripción es de hace más de ${DIAS} días.` };
  const id = `tt-${inicio.toString(36)}-${createHash("sha256").update(`vivo|${ref}|${inicio}|${tipo}`).digest("hex").slice(0, 8)}`;
  let texto = frases.join("\n");
  if (texto.length > MAX_TEXTO) texto = texto.slice(0, MAX_TEXTO) + "\n[transcripción recortada]";
  await guardarDoc({ id, origen: "vivo", tipo, ...(ref ? { ref } : {}), titulo: tipo === "llamada" ? "Llamada" : "Reunión", codigo: "", software: "ZH Reuniones", inicio: new Date(inicio).toISOString(), fin: new Date(fin).toISOString(), recibida: new Date(ahora).toISOString(), participantes: [], intervenciones: frases.length, texto });
  return { guardada: true, id };
}

/* De dónde viene una transcripción y para quién: Meet (TranscripTonic) o en vivo, para un lead o cliente. */
const procedencia = (t) => ({ origen: t.origen === "vivo" ? "vivo" : "meet", tipo: t.tipo === "llamada" ? "llamada" : "reunion", ...(t.ref ? { ref: t.ref } : {}) });

/* Las transcripciones de los últimos días, sin el texto: id, título, cuándo fue y quiénes hablaron.
   Con `fresco`, el índice se lee directo del almacén y no del caché (para ver una recién llegada). */
export async function transcripciones(args) {
  const dias = Math.min(30, Math.max(1, Math.round(Number(args && args.dias)) || DIAS));
  const desde = Date.now() - dias * 864e5;
  const indice = await leerJson(INDICE, { directo: !!(args && args.fresco === true) });
  const todas = Array.isArray(indice) ? indice : [];
  const lista = todas
    .filter((t) => vigente(t) && Date.parse(t.inicio) >= desde)
    .map((t) => ({ id: t.id, ...procedencia(t), titulo: t.titulo, codigo: t.codigo, software: t.software, inicio: t.inicio, fin: t.fin, estado: "lista", participantes: t.participantes, intervenciones: t.intervenciones }))
    .sort((a, b) => Date.parse(b.inicio) - Date.parse(a.inicio));
  if (todas.some((t) => !vigente(t))) {
    try { await quitarViejas(); } catch (e) { console.error("[zh-reuniones] limpiar", e && e.message); }
  }
  return { transcripciones: lista };
}

/* El texto de una transcripción. Las de Meet: «Nombre: lo que dijo», una línea por intervención, y el
   chat al final. Las en vivo: una frase por línea, sin el nombre de quien habla. */
export async function leerTranscripcion(args) {
  const id = String((args && args.id) || "");
  if (!ID.test(id)) throw new Falla("Falta la transcripción que hay que leer.", "sin_id");
  const t = await leerJson(TEXTO(id));
  if (!vigente(t)) throw new Falla(`La transcripción ya no está: se borra sola ${DIAS} días después de llegar.`, "no_existe");
  return { id: t.id, ...procedencia(t), titulo: t.titulo, participantes: t.participantes, intervenciones: t.intervenciones, texto: t.texto };
}
