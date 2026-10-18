/* La dirección donde TranscripTonic deja las transcripciones. Solo se muestra con la clave del equipo. */
import { html, esc, listo, claveOk, urlWebhook, faltaHtml } from "../lib/http.js";
import { bloqueado, anotarFalla } from "../lib/almacen.js";

const formulario = (aviso, status = 200) => html(`<h1>Dirección para TranscripTonic</h1>
<p>Escribe la clave del equipo de ZH (la de <code>CLAVE_EQUIPO</code> en Vercel) para ver la dirección que va en la extensión.</p>
<form class="card" method="post" action="/api/equipo"><label>Clave del equipo<input type="password" name="clave" autocomplete="current-password" required autofocus></label>
${aviso ? `<p class="bad">${esc(aviso)}</p>` : ""}<button type="submit">Ver la dirección</button></form>`, status, "'self'");

export function GET() {
  return listo() ? formulario() : faltaHtml();
}

export async function POST(req) {
  if (!listo()) return faltaHtml();
  if (await bloqueado(req)) return formulario("Demasiados intentos con una clave equivocada. Espera una hora y vuelve a intentar.", 429);
  const d = Object.fromEntries(new URLSearchParams(await req.text()));
  if (!claveOk(d.clave)) {
    await anotarFalla(req);
    return formulario("La clave no es la del equipo.", 403);
  }
  return html(`<h1>Dirección para TranscripTonic</h1>
<div class="card"><p>Cópiala y pégala en la extensión, en el Chrome de cada uno:</p>
<textarea readonly rows="3" aria-label="Dirección para TranscripTonic">${esc(urlWebhook(req))}</textarea>
<ol>
<li>Abre TranscripTonic (su ícono en la barra de Chrome) y toca <b>webhooks →</b>.</li>
<li>Pega la dirección en <b>Webhook URL</b> y toca <b>Save</b>. Si Chrome pide permiso para esa dirección, acepta.</li>
<li>Marca <b>Automatically post transcript to webhook URL, after each meeting</b> y elige <b>Advanced webhook body</b>.</li>
<li>Deja marcada también la descarga del archivo después de cada reunión: sirve de respaldo.</li>
</ol>
<p class="bad">No la compartas fuera del equipo: con ella se pueden mandar transcripciones a ZH Reuniones.</p></div>`);
}
