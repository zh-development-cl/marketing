/* El protocolo MCP (JSON-RPC sobre HTTP, sin sesión): initialize, ping y las herramientas. */
import { transcripciones, leerTranscripcion } from "./reuniones.js";
import { Falla } from "./http.js";

const VERSIONES = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

export const HERRAMIENTAS = [
  {
    name: "transcripciones",
    title: "Transcripciones de las reuniones",
    description: "Lista las transcripciones de las reuniones de ZH (Google Meet, guardadas con TranscripTonic) que llegaron en los últimos días (14 si no se dice): título de la reunión, cuándo fue y quiénes hablaron.",
    inputSchema: { type: "object", properties: { dias: { type: "integer", minimum: 1, maximum: 30, description: "Cuántos días hacia atrás." } }, additionalProperties: false },
    annotations: { title: "Transcripciones de las reuniones", readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "leer_transcripcion",
    title: "Leer una transcripción",
    description: "Devuelve el texto de una transcripción: una línea por intervención, con el nombre de quien habla, y el chat de la reunión al final.",
    inputSchema: { type: "object", properties: { id: { type: "string", description: "El id que entrega «transcripciones» (tt-…)." } }, required: ["id"], additionalProperties: false },
    annotations: { title: "Leer una transcripción", readOnlyHint: true, openWorldHint: false },
  },
];

const FUNCIONES = { transcripciones, leer_transcripcion: leerTranscripcion };
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
      serverInfo: { name: "zh-reuniones", title: "ZH Reuniones", version: "2.0.0" },
      instructions: "Transcripciones de las reuniones de ZH Development por Google Meet (guardadas con la extensión TranscripTonic), con el nombre de quien habla, para registrarlas en el CRM.",
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
      /* El código va también en structuredContent: el CRM decide qué hacer según él, no según el texto. */
      const conocida = e instanceof Falla;
      if (!conocida) console.error("[zh-reuniones]", params.name, e && e.status, e && e.message);
      const mensaje = conocida ? e.message : "No se pudo leer la base de ZH Reuniones. Vuelve a intentar en un rato.";
      return ok(id, { content: [{ type: "text", text: mensaje }], structuredContent: { error: conocida ? e.code : "almacen", mensaje }, isError: true });
    }
  }
  if (notificacion) return null;
  return error(id, -32601, `Método no disponible: ${method}.`);
}
