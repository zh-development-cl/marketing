/* La página de inicio: qué falta para que funcione, la dirección del conector y dónde ver la de
   TranscripTonic. */
import { html, base, esc, listo } from "../lib/http.js";
import { hayAlmacen, redis } from "../lib/almacen.js";

export async function GET(req) {
  const b = base(req);
  const clave = listo();
  let bd = "falta";
  if (hayAlmacen()) {
    try { bd = (await redis("PING")) === "PONG" ? "ok" : "error"; } catch { bd = "error"; }
  }
  const fila = (ok, texto) => `<li><span class="${ok ? "ok" : "bad"}">${ok ? "Listo" : "Falta"}</span> · ${texto}</li>`;
  return html(`<h1>ZH Reuniones</h1>
<p>Recibe las transcripciones de las reuniones de Google Meet que guarda TranscripTonic (la extensión de Chrome) y se las entrega al CRM de ZH Development.</p>
<div class="card"><ul>
${fila(clave, "Clave del equipo (CLAVE_EQUIPO en Vercel, de 16 caracteres o más)")}
${fila(bd === "ok", bd === "error" ? "Base de datos: está creada, pero no responde" : "Base de datos para las transcripciones (Vercel → Storage → Upstash for Redis)")}
</ul>${clave ? `<a class="btn" href="/api/equipo">Ver la dirección para TranscripTonic</a>` : ""}</div>
<div class="card"><p>En claude.ai → Configuración → Conectores → Agregar conector personalizado, con el nombre <b>ZH Reuniones</b> y esta dirección:</p><p><code>${esc(b)}/mcp</code></p></div>`);
}
