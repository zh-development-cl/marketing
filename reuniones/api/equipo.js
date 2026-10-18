/* La clave del equipo y la dirección para TranscripTonic. La primera vez se crea la clave; después,
   con la clave se ve la dirección que va en la extensión. */
import { html, esc, base, conRespaldo } from "../lib/http.js";
import { LARGO, MAXIMO, claveEquipo, claveCorrecta, crearClave, urlWebhook, bloqueado, anotarFalla } from "../lib/clave.js";

const pagina = (cuerpo, status = 200) => html(cuerpo, status, "'self'");
const aviso = (texto) => (texto ? `<p class="bad">${esc(texto)}</p>` : "");

const crear = (texto, status = 200) => pagina(`<h1>Crear la clave del equipo</h1>
<p>Con esta clave los socios conectan ZH Reuniones en claude.ai y ven la dirección para TranscripTonic. Se crea una sola vez: elige una de ${LARGO} caracteres o más y guárdala en un lugar seguro (por ejemplo, el administrador de contraseñas de Chrome). ZH Reuniones guarda solo un resumen cifrado: no la puede mostrar de nuevo.</p>
<form class="card" method="post" action="/api/equipo"><input type="hidden" name="accion" value="crear">
<label>Clave del equipo<input type="password" name="clave" minlength="${LARGO}" maxlength="${MAXIMO}" autocomplete="new-password" required autofocus></label>
<label>Repite la clave<input type="password" name="repetida" minlength="${LARGO}" maxlength="${MAXIMO}" autocomplete="new-password" required></label>
${aviso(texto)}<button type="submit">Crear la clave</button></form>`, status);

const pedir = (texto, status = 200) => pagina(`<h1>Dirección para TranscripTonic</h1>
<p>Escribe la clave del equipo de ZH para ver la dirección que va en la extensión.</p>
<form class="card" method="post" action="/api/equipo">
<label>Clave del equipo<input type="password" name="clave" autocomplete="current-password" required autofocus></label>
${aviso(texto)}<button type="submit">Ver la dirección</button></form>`, status);

const direccion = (req, cfg, nueva) => pagina(`<h1>${nueva ? "Clave creada" : "Dirección para TranscripTonic"}</h1>
${nueva ? `<p class="ok">Listo: la clave del equipo quedó creada. Compártela solo con los socios.</p>` : ""}
<div class="card"><p><b>1. TranscripTonic.</b> Copia esta dirección y pégala en la extensión, en el Chrome de cada uno:</p>
<textarea readonly rows="3" aria-label="Dirección para TranscripTonic">${esc(urlWebhook(req, cfg))}</textarea>
<ol>
<li>Abre TranscripTonic (su ícono en la barra de Chrome) y toca <b>webhooks →</b>.</li>
<li>Pega la dirección en <b>Webhook URL</b> y toca <b>Save</b>. Si Chrome pide permiso para esa dirección, acepta.</li>
<li>Marca <b>Automatically post transcript to webhook URL, after each meeting</b> y elige <b>Advanced webhook body</b>.</li>
<li>Deja marcada también la descarga del archivo después de cada reunión: sirve de respaldo.</li>
</ol>
<p class="bad">No la compartas fuera del equipo: con ella se pueden mandar transcripciones a ZH Reuniones.</p></div>
<div class="card"><p><b>2. El conector en claude.ai.</b> En Configuración → Conectores → Agregar conector personalizado, con el nombre <b>ZH Reuniones</b> y esta dirección:</p>
<p><code>${esc(base(req))}/mcp</code></p>
<p>Al conectarlo se abre una página de ZH Reuniones que pide esta misma clave.</p></div>`);

export const GET = conRespaldo(async () => ((await claveEquipo()) ? pedir() : crear()), true);

export const POST = conRespaldo(async (req) => {
  const d = Object.fromEntries(new URLSearchParams(await req.text()));
  const clave = typeof d.clave === "string" ? d.clave : "";
  const cfg = await claveEquipo();
  if (!cfg) {
    if (d.accion !== "crear") return crear();
    if (clave.length < LARGO || clave.length > MAXIMO) return crear(`La clave tiene que tener entre ${LARGO} y ${MAXIMO} caracteres.`, 400);
    if (clave !== d.repetida) return crear("Las dos claves no son iguales.", 400);
    const nueva = await crearClave(clave);
    if (!nueva) return pedir("Alguien del equipo acaba de crear la clave. Escríbela para ver la dirección.", 409);
    return direccion(req, nueva, true);
  }
  if (d.accion === "crear") return pedir("Ya hay una clave del equipo: escríbela para ver la dirección. Si nadie del equipo la creó, bórrala en Vercel (Storage → zh-reuniones → config/clave.json) y crea otra.", 409);
  if (bloqueado(req)) return pedir("Demasiados intentos con una clave equivocada. Espera una hora y vuelve a intentar.", 429);
  if (!claveCorrecta(cfg, clave)) {
    anotarFalla(req);
    return pedir("La clave no es la del equipo.", 403);
  }
  return direccion(req, cfg, false);
}, true);
