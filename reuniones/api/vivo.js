/* «Transcribir en vivo»: escucha una llamada (con el celular en altavoz) o una reunión presencial y la
   pasa a texto con el reconocimiento de voz de Chrome. claude.ai no deja que el CRM use el micrófono;
   esta página sí. El CRM la abre con el lead o cliente (ref) y el tipo; al terminar, la transcripción
   queda en ZH Reuniones para ese lead o cliente, y mientras escucha el CRM ve lo último que se dijo.
   El nombre del lead o cliente (nombre) solo se muestra. Pide la clave del equipo una vez por navegador. */
import { html, esc, faltaHtml, conRespaldo } from "../lib/http.js";
import { claveEquipo, claveCorrecta, galleta, conGalleta, bloqueado, anotarFalla } from "../lib/clave.js";
import { REF, limpiar } from "../lib/reuniones.js";
import { scriptVivo } from "../lib/vivo-cliente.js";

const datos = (q) => {
  const ref = REF.test(String(q.get("ref") || "")) ? String(q.get("ref")) : "";
  return { ref, tipo: q.get("tipo") === "reunion" ? "reunion" : "llamada", nombre: ref ? limpiar(q.get("nombre"), 80) : "" };
};
const aqui = (d) => `/vivo?${new URLSearchParams({ ...(d.ref ? { ref: d.ref } : {}), tipo: d.tipo, ...(d.nombre ? { nombre: d.nombre } : {}) })}`;
const cosa = (d) => (d.tipo === "llamada" ? "Llamada" : "Reunión");

const pedirClave = (d, aviso, status = 200) => html(`<h1>Transcribir en vivo</h1>
<p>Para transcribir desde este navegador, escribe la clave del equipo de ZH. Se pide una sola vez (dura 6 meses).</p>
<form class="card" method="post" action="${esc(aqui(d))}"><input type="hidden" name="ref" value="${esc(d.ref)}"><input type="hidden" name="tipo" value="${esc(d.tipo)}"><input type="hidden" name="nombre" value="${esc(d.nombre)}">
<label>Clave del equipo<input type="password" name="clave" autocomplete="current-password" required autofocus></label>
${aviso ? `<p class="bad">${esc(aviso)}</p>` : ""}<button type="submit">Seguir</button></form>`, status, "'self'");

const ESTILO = `<style>.fila{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.vivo-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.rec{width:10px;height:10px;border-radius:50%;background:var(--bad);animation:latido 1.2s infinite}@keyframes latido{50%{opacity:.3}}
.medidor{flex:1;min-width:80px;height:6px;border-radius:3px;background:var(--line);overflow:hidden}.medidor span{display:block;height:100%;background:var(--accent);transform-origin:left;transform:scaleX(0);transition:transform .1s}
.texto{margin:0;white-space:pre-wrap;max-height:50vh;overflow:auto;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
button.sec{background:transparent;color:var(--accent);border:1px solid var(--line)}button:disabled{opacity:.5;cursor:default}#reloj{color:var(--fg2);font-variant-numeric:tabular-nums}
p.para{color:var(--fg)}
@media (prefers-reduced-motion:reduce){.rec{animation:none}}</style>`;

const pagina = (d) => html(`${ESTILO}<h1>Transcribir en vivo</h1>
${d.ref ? `<p class="para">${d.nombre ? `${cosa(d)} con <b>${esc(d.nombre)}</b>: llega a su ficha en el CRM.` : `${cosa(d)} para la ficha del CRM desde donde la abriste.`}</p>` : ""}
<p>${d.tipo === "llamada" ? "Pon el celular en altavoz al lado del computador" : "Deja el computador cerca de la conversación"} y toca «Empezar»: ZH Reuniones escucha y lo pasa a texto. El audio no se guarda, solo el texto. Avisa al otro lado que estás transcribiendo.</p>
${d.ref ? "" : `<p class="bad">Ábrela desde el CRM (botón «Transcribir en vivo» de la ficha) para que la transcripción llegue a ese lead o cliente. Si no, queda sin asociar en Hoy.</p>`}
<div class="card" id="respaldo" hidden><p id="respaldo-texto"></p><div class="fila"><button id="mandar-respaldo">Mandarla</button><button class="sec" id="descartar-respaldo">Descartar</button></div></div>
<div class="card">
<div class="vivo-head"><b id="estado" role="status">Listo para empezar</b><span id="reloj"></span></div>
<div class="vivo-head" id="vivo" hidden><i class="rec" aria-hidden="true"></i><span class="medidor" aria-hidden="true"><span id="barra"></span></span></div>
<div class="fila"><button id="empezar">Empezar</button><button id="terminar" hidden>Terminar</button></div>
<p id="volver-crm" hidden>Puedes volver a la pestaña del CRM: ahí ves lo que se va diciendo y Claude te sugiere qué responder. Esta pestaña sigue escuchando; no la cierres.</p>
<p class="bad" id="aviso" hidden></p>
<pre class="texto" id="texto" aria-live="polite" hidden></pre>
</div>
<div class="card" id="hecho" hidden><p class="ok" id="hecho-texto"></p><p id="hecho-volver">Vuelve a la pestaña del CRM: aparece sola en la ficha y en Hoy.</p>${d.ref ? "<p>Para otro lead o cliente, ábrela desde su ficha en el CRM.</p>" : ""}<div class="fila"><button class="sec" id="copiar">Copiar el texto</button></div></div>
<div class="card" id="fallo" hidden><p class="bad" id="fallo-texto"></p><div class="fila"><button id="reintentar">Volver a mandar</button><button class="sec" id="copiar2">Copiar el texto</button></div></div>`, 200, "'none'", scriptVivo(d));

export const GET = conRespaldo(async (req) => {
  const cfg = await claveEquipo();
  if (!cfg) return faltaHtml();
  const d = datos(new URL(req.url).searchParams);
  return conGalleta(req, cfg) ? pagina(d) : pedirClave(d);
}, true);

export const POST = conRespaldo(async (req) => {
  const cfg = await claveEquipo();
  if (!cfg) return faltaHtml();
  const f = Object.fromEntries(new URLSearchParams(await req.text()));
  const d = datos(new URLSearchParams({ ref: f.ref || "", tipo: f.tipo || "", nombre: f.nombre || "" }));
  if (bloqueado(req)) return pedirClave(d, "Demasiados intentos con una clave equivocada. Espera una hora y vuelve a intentar.", 429);
  if (!claveCorrecta(cfg, f.clave)) {
    anotarFalla(req);
    return pedirClave(d, "La clave no es la del equipo.", 403);
  }
  return new Response(null, { status: 303, headers: { location: aqui(d), "set-cookie": galleta(cfg), "cache-control": "no-store" } });
}, true);
