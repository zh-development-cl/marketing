/* Lo último de la llamada, cada pocos segundos mientras la página «Transcribir en vivo» escucha: el CRM
   lo muestra y Claude sugiere qué responder. No va al almacén (ver guardarAvance). */
import { json } from "../lib/http.js";
import { desdeLaPagina } from "../lib/desde-pagina.js";
import { guardarAvance } from "../lib/reuniones.js";

export const POST = desdeLaPagina(guardarAvance, {
  maximo: 64000,
  grande: "Lo que llegó es demasiado grande.",
  noSePudo: "No se pudo mandar lo último de la llamada.",
  etiqueta: "avance",
});

export function GET() {
  return json({ ok: false, error: "Esta dirección recibe lo último de la llamada desde la página «Transcribir en vivo» (POST)." }, 405, { allow: "POST" });
}
