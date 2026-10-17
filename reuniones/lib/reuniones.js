/* Lo que hace el conector con las reuniones de Google Meet de la cuenta de ZH. No guarda nada: cada
   llamada pregunta a Google. Google borra los registros de una reunión 30 días después. */
import { meet, codigoMeet } from "./google.js";

export class Falla extends Error {
  constructor(mensaje, code) { super(mensaje); this.code = code || "falla"; }
}

/* Prende la transcripción automática de una reunión: Google la transcribe sola apenas empieza, con
   el nombre de cada participante. Solo para reuniones de la cuenta de ZH (la que organiza). */
export async function prepararReunion(args) {
  const codigo = codigoMeet(args && args.meet);
  if (!codigo) throw new Falla("Falta el enlace de Google Meet de la reunión.", "sin_enlace");
  let espacio;
  try {
    espacio = await meet(`spaces/${codigo}`);
  } catch (e) {
    if (e.status === 403 || e.status === 404) throw new Falla("La reunión no es de la cuenta de Google de ZH: solo se transcriben solas las reuniones que organiza esa cuenta.", "ajena");
    throw e;
  }
  const t = espacio.config && espacio.config.artifactConfig && espacio.config.artifactConfig.transcriptionConfig;
  const yaEstaba = !!t && t.autoTranscriptionGeneration === "ON";
  if (!yaEstaba) {
    try {
      await meet(espacio.name, { method: "PATCH", query: { updateMask: "config.artifactConfig.transcriptionConfig.autoTranscriptionGeneration" }, body: { config: { artifactConfig: { transcriptionConfig: { autoTranscriptionGeneration: "ON" } } } } });
    } catch (e) {
      if (e.status === 400 || e.status === 403 || e.status === 412) throw new Falla("Google no dejó prender la transcripción automática. La cuenta de ZH necesita Google Workspace Business Standard o superior, y la reunión tiene que ser suya.", "sin_transcripcion");
      throw e;
    }
  }
  return { codigo, transcripcion: "automatica", yaEstaba };
}

/* Las transcripciones de los últimos días: id, código de la reunión, cuándo fue y si ya se puede
   leer («lista») o Google todavía la está procesando. */
export async function transcripciones(args) {
  const dias = Math.min(30, Math.max(1, Math.round(Number(args && args.dias)) || 14));
  const codigos = Array.isArray(args && args.codigos) ? [...new Set(args.codigos.map(codigoMeet).filter(Boolean))].slice(0, 20) : [];
  const filtro = [`start_time>="${new Date(Date.now() - dias * 864e5).toISOString()}"`];
  if (codigos.length === 1) filtro.push(`space.meeting_code = "${codigos[0]}"`);
  const registros = [];
  let pagina = "";
  for (let i = 0; i < 5; i += 1) {
    const d = await meet("conferenceRecords", { query: { filter: filtro.join(" AND "), pageSize: "100", ...(pagina ? { pageToken: pagina } : {}) } });
    registros.push(...(d.conferenceRecords || []));
    pagina = d.nextPageToken || "";
    if (!pagina) break;
  }
  const codigoDe = new Map();
  const lista = [];
  for (const r of registros) {
    if (!r.endTime) continue;
    if (!codigoDe.has(r.space)) {
      let c = "";
      try { c = (await meet(r.space)).meetingCode || ""; } catch { c = ""; }
      codigoDe.set(r.space, c);
    }
    const codigo = codigoDe.get(r.space);
    if (codigos.length && !codigos.includes(codigo)) continue;
    const d = await meet(`${r.name}/transcripts`, { query: { pageSize: "100" } });
    for (const t of d.transcripts || []) {
      if (t.state !== "FILE_GENERATED" && t.state !== "ENDED") continue;
      lista.push({ id: t.name, codigo, inicio: r.startTime, fin: r.endTime, estado: t.state === "FILE_GENERATED" ? "lista" : "procesando" });
    }
  }
  return { transcripciones: lista };
}

/* El texto de una transcripción: una línea por intervención, con el nombre de quien habla (las
   frases seguidas de la misma persona van juntas). */
export async function leerTranscripcion(args) {
  const id = String((args && args.id) || "");
  if (!/^conferenceRecords\/[\w-]+\/transcripts\/[\w-]+$/.test(id)) throw new Falla("Falta la transcripción que hay que leer.", "sin_id");
  const conferencia = id.split("/transcripts/")[0];
  const nombres = new Map();
  let pagina = "";
  for (let i = 0; i < 10; i += 1) {
    const d = await meet(`${conferencia}/participants`, { query: { pageSize: "250", ...(pagina ? { pageToken: pagina } : {}) } });
    for (const p of d.participants || []) nombres.set(p.name, (p.signedinUser && p.signedinUser.displayName) || (p.anonymousUser && p.anonymousUser.displayName) || (p.phoneUser && p.phoneUser.displayName) || "");
    pagina = d.nextPageToken || "";
    if (!pagina) break;
  }
  const lineas = [];
  let largo = 0;
  pagina = "";
  for (let i = 0; i < 300; i += 1) {
    const d = await meet(`${id}/entries`, { query: { pageSize: "100", ...(pagina ? { pageToken: pagina } : {}) } });
    for (const e of d.transcriptEntries || []) {
      const texto = String(e.text || "").replace(/\s+/g, " ").trim();
      if (!texto) continue;
      const quien = nombres.get(e.participant) || "Participante";
      const ultima = lineas[lineas.length - 1];
      if (ultima && ultima.quien === quien) ultima.texto += " " + texto;
      else lineas.push({ quien, texto });
      largo += texto.length;
    }
    pagina = d.nextPageToken || "";
    if (!pagina || largo > 400000) break;
  }
  let texto = lineas.map((l) => `${l.quien}: ${l.texto}`).join("\n");
  if (texto.length > 300000) texto = texto.slice(0, 300000) + "\n[transcripción recortada]";
  return { id, participantes: [...new Set(lineas.map((l) => l.quien))], intervenciones: lineas.length, texto };
}
