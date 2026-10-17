/* Conectar la cuenta de Google de ZH (GOOGLE_CUENTA): pide los permisos de Meet sin vencimiento. */
import { base, redirect, configurado, faltaHtml } from "../../lib/http.js";
import { firmar } from "../../lib/jwt.js";
import { urlAutorizar, ALCANCES_DATOS } from "../../lib/google.js";

export function GET(req) {
  if (!configurado()) return faltaHtml();
  return redirect(urlAutorizar({ redirectUri: `${base(req)}/api/google/callback`, state: firmar({ typ: "conectar" }, 600), alcances: ALCANCES_DATOS, offline: true, loginHint: process.env.GOOGLE_CUENTA || "" }));
}
