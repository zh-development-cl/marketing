/* La página de inicio: qué falta para que funcione y la dirección del conector. */
import { html, base, esc, equipo } from "../lib/http.js";
import { tokenDatos } from "../lib/google.js";

export async function GET(req) {
  const b = base(req);
  const cliente = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const cuenta = process.env.GOOGLE_CUENTA || "";
  const personas = equipo().length;
  let google = "falta";
  if (cliente && process.env.GOOGLE_REFRESH_TOKEN) {
    try { await tokenDatos(); google = "ok"; } catch (e) { google = e.code === "google_reconectar" ? "reconectar" : "error"; }
  }
  const fila = (ok, texto) => `<li><span class="${ok ? "ok" : "bad"}">${ok ? "Listo" : "Falta"}</span> · ${texto}</li>`;
  return html(`<h1>ZH Reuniones</h1>
<p>Transcripciones de Google Meet de las reuniones de ZH Development, para el CRM.</p>
<div class="card"><ul>
${fila(cliente, "Cliente de Google (GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET)")}
${fila(!!cuenta && personas > 0, `Cuenta de ZH y equipo (GOOGLE_CUENTA${cuenta ? ": " + esc(cuenta) : ""}; EQUIPO: ${personas} ${personas === 1 ? "persona" : "personas"})`)}
${fila(google === "ok", google === "reconectar" ? "Cuenta de Google de ZH: la autorización venció, vuelve a conectarla" : "Cuenta de Google de ZH conectada (GOOGLE_REFRESH_TOKEN)")}
</ul>${cliente && cuenta ? `<a class="btn" href="/api/google/conectar">Conectar la cuenta de Google de ZH</a>` : ""}</div>
<div class="card"><p>En claude.ai → Configuración → Conectores → Agregar conector personalizado, con el nombre <b>ZH Reuniones</b> y esta dirección:</p><p><code>${esc(b)}/mcp</code></p></div>`);
}
