/* Donde la página «Transcribir en vivo» deja la transcripción al terminar. */
import { json } from "../lib/http.js";
import { desdeLaPagina } from "../lib/desde-pagina.js";
import { guardarEnVivo } from "../lib/reuniones.js";

export const POST = desdeLaPagina(guardarEnVivo, {
  maximo: 2000000,
  grande: "La transcripción es demasiado grande.",
  noSePudo: "No se pudo guardar la transcripción. Vuelve a intentar con «Volver a mandar».",
  etiqueta: "vivo",
});

export function GET() {
  return json({ ok: false, error: "Esta dirección recibe las transcripciones de la página «Transcribir en vivo» (POST)." }, 405, { allow: "POST" });
}
