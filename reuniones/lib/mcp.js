/* El protocolo MCP (JSON-RPC sobre HTTP, sin sesión): initialize, ping y las herramientas. */
import { prepararReunion, transcripciones, leerTranscripcion, Falla } from "./reuniones.js";

const VERSIONES = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

export const HERRAMIENTAS = [
  {
    name: "preparar_reunion",
    title: "Transcribir una reunión",
    description: "Prende la transcripción automática de Google Meet en una reunión de la cuenta de ZH: Google la transcribe sola apenas empieza, con el nombre de cada participante.",
    inputSchema: { type: "object", properties: { meet: { type: "string", description: "Enlace o código de la reunión de Google Meet (por ejemplo, https://meet.google.com/abc-defg-hij)." } }, required: ["meet"], additionalProperties: false },
    annotations: { title: "Transcribir una reunión", readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "transcripciones",
    title: "Transcripciones de las reuniones",
    description: "Lista las transcripciones de Google Meet de las reuniones de la cuenta de ZH de los últimos días (14 si no se dice), con el código de cada reunión y si ya están listas para leer.",
    inputSchema: { type: "object", properties: { dias: { type: "integer", minimum: 1, maximum: 30, description: "Cuántos días hacia atrás." }, codigos: { type: "array", items: { type: "string" }, maxItems: 20, description: "Solo estas reuniones (enlaces o códigos de Meet)." } }, additionalProperties: false },
    annotations: { title: "Transcripciones de las reuniones", readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "leer_transcripcion",
    title: "Leer una transcripción",
    description: "Devuelve el texto de una transcripción de Google Meet: una línea por intervención, con el nombre de quien habla.",
    inputSchema: { type: "object", properties: { id: { type: "string", description: "El id que entrega «transcripciones» (conferenceRecords/…/transcripts/…)." } }, required: ["id"], additionalProperties: false },
    annotations: { title: "Leer una transcripción", readOnlyHint: true, openWorldHint: false },
  },
];

const FUNCIONES = { preparar_reunion: prepararReunion, transcripciones, leer_transcripcion: leerTranscripcion };
const ok = (id, result) => ({ jsonrpc: "2.0", id, result });
const error = (id, code, message) => ({ jsonrpc: "2.0", id: id === undefined ? null : id, error: { code, message } });

/* Responde un mensaje; null si era una notificación (no lleva respuesta). */
export async function atender(msg) {
  if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return error(msg && msg.id, -32600, "Solicitud inválida.");
  const { id, method } = msg;
  const params = msg.params || {};
  const notificacion = id === undefined || id === null;
  if (method === "initialize") {
    const version = VERSIONES.includes(params.protocolVersion) ? params.protocolVersion : VERSIONES[0];
    return ok(id, {
      protocolVersion: version,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "zh-reuniones", title: "ZH Reuniones", version: "1.0.0" },
      instructions: "Transcripciones de Google Meet de las reuniones de ZH Development: prender la transcripción automática de una reunión y leer las transcripciones listas, con el nombre de quien habla.",
    });
  }
  if (method.startsWith("notifications/")) return null;
  if (method === "ping") return ok(id, {});
  if (method === "tools/list") return ok(id, { tools: HERRAMIENTAS });
  if (method === "tools/call") {
    const fn = FUNCIONES[params.name];
    if (!fn) return error(id, -32602, `No existe la herramienta «${params.name}».`);
    try {
      const res = await fn(params.arguments || {});
      return ok(id, { content: [{ type: "text", text: JSON.stringify(res) }], structuredContent: res, isError: false });
    } catch (e) {
      const conocida = e instanceof Falla || e.code === "google_reconectar";
      if (!conocida) console.error("[zh-reuniones]", params.name, e && e.status, e && e.message);
      return ok(id, { content: [{ type: "text", text: conocida ? e.message : "No se pudo hablar con Google Meet. Vuelve a intentar en un rato." }], isError: true });
    }
  }
  if (notificacion) return null;
  return error(id, -32601, `Método no disponible: ${method}.`);
}
