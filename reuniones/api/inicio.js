/* La página de inicio: si el almacén y la clave del equipo están listos, el botón para crear la clave
   o ver la dirección para TranscripTonic, y la dirección del conector. */
import { html, base, esc } from "../lib/http.js";
import { hayAlmacen } from "../lib/almacen.js";
import { claveEquipo } from "../lib/clave.js";

const dia = (v) => (v ? new Date(v).toLocaleDateString("es-CL", { timeZone: "America/Santiago", day: "numeric", month: "long", year: "numeric" }) : "");

export async function GET(req) {
  let almacen = hayAlmacen() ? "ok" : "falta";
  let cfg = null;
  if (almacen === "ok") {
    try { cfg = await claveEquipo(); } catch (e) { console.error("[zh-reuniones] inicio", e && e.message); almacen = "error"; }
  }
  const fila = (ok, texto) => `<li><span class="${ok ? "ok" : "bad"}">${ok ? "Listo" : "Falta"}</span> · ${texto}</li>`;
  const filas = almacen === "error"
    ? `<li><span class="bad">No responde</span> · Almacén para las transcripciones (Vercel Blob): vuelve a intentar en un rato</li>`
    : `${fila(almacen === "ok", "Almacén para las transcripciones (Vercel Blob, privado)")}
${fila(!!cfg, cfg ? `Clave del equipo${cfg.creada ? ` (creada el ${esc(dia(cfg.creada))})` : ""}` : "Clave del equipo: la crea un socio, una sola vez")}`;
  const boton = almacen !== "ok" ? "" : `<a class="btn" href="/api/equipo">${cfg ? "Ver la dirección para TranscripTonic" : "Crear la clave del equipo"}</a>`;
  return html(`<h1>ZH Reuniones</h1>
<p>Recibe las transcripciones de las reuniones de Google Meet que guarda TranscripTonic (la extensión de Chrome) y se las entrega al CRM de ZH Development.</p>
<div class="card"><ul>
${filas}
</ul>${boton}</div>
<div class="card"><p>En claude.ai → Configuración → Conectores → Agregar conector personalizado, con el nombre <b>ZH Reuniones</b> y esta dirección:</p><p><code>${esc(base(req))}/mcp</code></p></div>`);
}
