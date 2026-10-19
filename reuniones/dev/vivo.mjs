/* Prueba en Chromium de la página «Transcribir en vivo», con un servidor local, el almacén y el caché
   en memoria, un micrófono falso y un reconocimiento de voz simulado (dice dos frases). Recorre: la
   clave del equipo, la cookie, para quién es, empezar, lo último que ve el CRM mientras escucha,
   terminar, el guardado y lo que queda si la pestaña se cierra a medias.
   Uso (desde reuniones/): NODE_PATH=$(npm root -g) node dev/vivo.mjs */
import http from "node:http";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { usarAlmacen } = await import("../lib/almacen.js");
const { transcripciones, leerTranscripcion, usarCacheVivo } = await import("../lib/reuniones.js");
const vivo = await import("../api/vivo.js");
const guardar = await import("../api/vivo-guardar.js");
const avance = await import("../api/vivo-avance.js");
const equipo = await import("../api/equipo.js");

const archivos = new Map();
let version = 0;
usarAlmacen({
  async leer(n) { const a = archivos.get(n); return a ? { texto: a.texto, etag: a.etag } : null; },
  async escribir(n, texto, { etag, crear } = {}) {
    const a = archivos.get(n);
    if (etag && (!a || a.etag !== etag)) throw new Error("Precondition failed");
    if (crear && a) throw new Error("This blob already exists");
    archivos.set(n, { texto, etag: `"v${++version}"`, subido: Date.now() });
  },
  async listar(p) { return [...archivos].filter(([n]) => n.startsWith(p)).map(([nombre, a]) => ({ nombre, subido: a.subido })); },
  async borrar(ns) { for (const n of ns) archivos.delete(n); },
});
const enCache = new Map();
usarCacheVivo({ async get(k) { return enCache.has(k) ? JSON.parse(enCache.get(k)) : null; }, async set(k, v) { enCache.set(k, JSON.stringify(v)); } });

const CLAVE = "Prueba1$";
const rutas = { "/vivo": vivo, "/api/vivo-guardar": guardar, "/api/vivo-avance": avance, "/api/equipo": equipo };
const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const mod = rutas[url.pathname];
  const fn = mod && mod[req.method];
  if (!fn) { res.writeHead(404); res.end(); return; }
  const cuerpo = await new Promise((ok) => { const p = []; req.on("data", (c) => p.push(c)); req.on("end", () => ok(Buffer.concat(p))); });
  const r = await fn(new Request(`http://localhost:${puerto}${req.url}`, { method: req.method, headers: req.headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : cuerpo }));
  res.writeHead(r.status, Object.fromEntries(r.headers));
  res.end(Buffer.from(await r.arrayBuffer()));
});
await new Promise((ok) => servidor.listen(0, ok));
const puerto = servidor.address().port;
const B = `http://localhost:${puerto}`;

let fallas = 0;
const ok = (c, m) => { console.log(`${c ? "ok" : "FALLA"}: ${m}`); if (!c) fallas += 1; };

/* La clave del equipo, como la crearía un socio. */
const creada = await equipo.POST(new Request(`${B}/api/equipo`, { method: "POST", body: new URLSearchParams({ accion: "crear", clave: CLAVE, repetida: CLAVE }) }));
ok(creada.status === 200, "la clave del equipo queda creada");

/* Un reconocimiento de voz que «escucha» dos frases y después espera a que lo detengan. */
const vozFalsa = () => {
  class Voz {
    constructor() { this.lang = ""; this.continuous = false; this.interimResults = false; }
    start() {
      window.__vozIdioma = this.lang;
      setTimeout(() => this.onstart && this.onstart(), 20);
      const frases = window.__frases || [];
      frases.forEach((f, i) => setTimeout(() => {
        const res = [{ transcript: f }];
        res.isFinal = true;
        this.onresult && this.onresult({ resultIndex: 0, results: [res] });
      }, 150 * (i + 1)));
    }
    stop() { setTimeout(() => this.onend && this.onend(), 30); }
    abort() { this.stop(); }
  }
  window.SpeechRecognition = Voz;
  window.webkitSpeechRecognition = Voz;
};

const navegador = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
const ctx = await navegador.newContext({ permissions: ["microphone"] });
await ctx.addInitScript(vozFalsa);
const page = await ctx.newPage();
const errores = [];
page.on("pageerror", (e) => errores.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errores.push(m.text()); });

await page.goto(`${B}/vivo?ref=lead-prueba1&tipo=llamada&nombre=Taller%20Ejemplo`);
ok(await page.locator('input[name="clave"]').isVisible(), "sin la cookie pide la clave del equipo");
await page.fill('input[name="clave"]', "otra-cosa");
await page.click('button[type="submit"]');
ok((await page.textContent("main")).includes("no es la del equipo"), "una clave equivocada no entra");
await page.fill('input[name="clave"]', CLAVE);
await page.click('button[type="submit"]');
await page.waitForSelector("#empezar");
ok(page.url().endsWith("/vivo?ref=lead-prueba1&tipo=llamada&nombre=Taller+Ejemplo"), "con la clave vuelve a la misma página, con el lead, el tipo y el nombre");
ok((await page.textContent("main")).includes("Llamada con Taller Ejemplo: llega a su ficha en el CRM."), "dice para quién es la llamada");
const galletas = await ctx.cookies();
ok(galletas.some((c) => c.name === "zhr_equipo" && c.httpOnly && c.sameSite === "Lax"), "deja la cookie del equipo (HttpOnly, SameSite=Lax)");
errores.length = 0; /* el 403 de la clave equivocada es a propósito */

await page.evaluate(() => { window.__frases = ["hola buenas tardes", "le llamo de zh development por lo del inventario"]; });
await page.click("#empezar");
await page.waitForFunction(() => document.getElementById("estado").textContent === "Escuchando");
ok(await page.isVisible("#terminar"), "al empezar aparece «Terminar» y el medidor");
ok(await page.isVisible("#volver-crm"), "y el aviso de que puede volver al CRM mientras escucha");
const enVivo = () => leerTranscripcion({ id: "vivo:lead-prueba1" });
ok((await enVivo()).estado === "escuchando", "el CRM ve al tiro que la llamada está en curso");
await page.waitForFunction(() => document.getElementById("texto").textContent.includes("inventario"));
ok((await page.textContent("#texto")) === "Hola buenas tardes\nLe llamo de zh development por lo del inventario", "las frases aparecen en vivo, una por línea y con mayúscula");
ok((await page.evaluate(() => window.__vozIdioma)) === "es-CL", "escucha en español de Chile");
const t0 = Date.now();
while ((await enVivo()).lineas.length < 2 && Date.now() - t0 < 6000) await page.waitForTimeout(200);
const v = await enVivo();
ok(v.estado === "escuchando" && v.lineas.join(" | ") === "Hola buenas tardes | Le llamo de zh development por lo del inventario" && v.total === 2, "y a los pocos segundos, lo último que se dijo");
await page.click("#terminar");
await page.waitForSelector("#hecho:not([hidden])");
ok((await page.textContent("#hecho-texto")).includes("llegó a ZH Reuniones"), "al terminar la manda y avisa que llegó");
const [t] = (await transcripciones({ dias: 1 })).transcripciones;
ok(t && t.origen === "vivo" && t.tipo === "llamada" && t.ref === "lead-prueba1" && t.intervenciones === 2, "queda en ZH Reuniones como llamada en vivo del lead");
ok((await leerTranscripcion({ id: t.id })).texto === "Hola buenas tardes\nLe llamo de zh development por lo del inventario", "con el texto completo");
ok(await page.evaluate(() => localStorage.getItem("zhr:vivo") === null), "lo guardado en el navegador se borra al mandarla");
const fin = await enVivo();
ok(fin.estado === "terminada" && fin.transcripcion === t.id, "al terminar, el CRM ve que se guardó y con qué id");
ok((await page.textContent("#empezar")) === "Otra llamada con Taller Ejemplo" && !(await page.isVisible("#volver-crm")), "el botón para otra dice con quién");
await page.screenshot({ path: new URL("./vivo.png", import.meta.url).pathname, fullPage: true });

/* Si la pestaña se cierra a medias, al volver ofrece mandar lo que quedó. */
await page.evaluate(() => { window.__frases = ["una frase antes de cerrar"]; });
await page.click("#empezar");
await page.waitForFunction(() => document.getElementById("texto").textContent.includes("antes de cerrar"));
page.on("dialog", (d) => d.accept());
await page.reload();
await page.waitForSelector("#respaldo:not([hidden])");
ok((await page.textContent("#respaldo-texto")).startsWith("Quedó una transcripción sin mandar"), "si se cerró a medias, ofrece mandar lo que quedó");
await page.click("#mandar-respaldo");
await page.waitForSelector("#hecho:not([hidden])");
ok((await transcripciones({ dias: 1 })).transcripciones.length === 2, "y la manda");

/* Sin el lead (abierta a mano), avisa que quedará sin asociar. */
await page.goto(`${B}/vivo`);
ok((await page.textContent("main")).includes("sin asociar"), "abierta sin lead, avisa que queda sin asociar");
ok(!errores.length, "sin errores en la página" + (errores.length ? ": " + errores.join(" | ") : ""));

await navegador.close();
servidor.close();
console.log(fallas ? `\n${fallas} fallas.` : "\nTodo bien.");
process.exit(fallas ? 1 : 0);
