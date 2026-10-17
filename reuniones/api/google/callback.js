/* Regreso de conectar la cuenta de ZH: muestra una vez la llave para pegarla en Vercel. Solo la ve
   quien entró con esa cuenta y aceptó los permisos. */
import { html, base, esc, configurado, faltaHtml } from "../../lib/http.js";
import { verificar } from "../../lib/jwt.js";
import { canjearCodigo, correoDeIdToken, ALCANCES_DATOS } from "../../lib/google.js";

export async function GET(req) {
  if (!configurado()) return faltaHtml();
  const q = new URL(req.url).searchParams;
  if (!verificar(q.get("state"), "conectar")) return html("<h1>El enlace venció</h1><p>Vuelve a la página de inicio de zh-reuniones y toca «Conectar la cuenta de Google de ZH».</p>", 400);
  if (q.get("error") || !q.get("code")) return html("<h1>No se autorizó</h1><p>Google no dio los permisos. Vuelve a intentar y acepta todos los que pide.</p>", 400);
  const cuenta = String(process.env.GOOGLE_CUENTA || "").toLowerCase();
  let t;
  let correo;
  try {
    t = await canjearCodigo({ code: q.get("code"), redirectUri: `${base(req)}/api/google/callback` });
    correo = correoDeIdToken(t.id_token);
  } catch (e) {
    return html(`<h1>No se pudo conectar</h1><p>${esc(e.message)}</p>`, 502);
  }
  if (!cuenta || correo !== cuenta) return html(`<h1>Esa no es la cuenta de ZH</h1><p>Entraste con ${esc(correo)}. Vuelve a intentar con ${esc(cuenta || "la cuenta de Google de ZH (GOOGLE_CUENTA en Vercel)")}.</p>`, 403);
  const faltan = ALCANCES_DATOS.filter((s) => s.startsWith("https://") && !String(t.scope || "").split(" ").includes(s));
  if (faltan.length) return html("<h1>Faltan permisos</h1><p>Vuelve a conectar y marca todos los permisos de Google Meet que pide Google.</p>", 400);
  if (!t.refresh_token) return html("<h1>Google no entregó la llave</h1><p>Quita el acceso de esta app en tu cuenta de Google (Seguridad → Apps de terceros con acceso) y vuelve a conectar.</p>", 400);
  return html(`<h1>Cuenta conectada</h1>
<div class="card"><p>Copia esta llave y pégala en Vercel → proyecto <b>zh-reuniones</b> → Settings → Environment Variables, como <code>GOOGLE_REFRESH_TOKEN</code> (Production y Preview, tipo Sensitive). Después vuelve a desplegar (Deployments → Redeploy).</p>
<textarea readonly rows="4" aria-label="Llave de Google">${esc(t.refresh_token)}</textarea>
<p class="bad">No la compartas ni la pegues en un chat: da acceso a las reuniones de ${esc(correo)}.</p></div>`);
}
