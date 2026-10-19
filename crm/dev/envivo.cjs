/* Prueba de «Transcribir en vivo» con ZH Reuniones, con Playwright, el mock de window.claude y ZH
   Reuniones simulado. Como en claude.ai, la política de permisos no deja que el CRM use el micrófono:
   se abre una vez el micrófono del CRM (la página de ZH Reuniones con la sesión de este navegador, en
   una ventana aparte) y, cuando escucha, cada llamada se empieza y se termina en la ficha: llega lo
   que se dice desde «Empezar a transcribir» (no lo de antes ni lo de después de «Terminar»), con la
   pista de objeción y «¿Qué le respondo?» (con lo que hace la empresa y lo que investigamos), y al
   terminar Claude arma el plan. La siguiente llamada no abre nada; si el micrófono está en pausa, lo
   dice. También: Hoy muestra una llamada transcrita en vivo (de la página de un lead) unida a su lead
   y una sin asociar, lo que quedó sin guardar se descarta, la ficha del cliente usa el mismo micrófono
   y, sin ZH Reuniones, queda el plan B con Google Docs. Usa datos inventados.

   Uso:
     python3 crm/dev/build_preview.py
     NODE_PATH=$(npm root -g) VENDOR_DIR=<carpeta con preact.umd.min.js, hooks.umd.min.js, htm.umd.min.js> \
       node crm/dev/envivo.cjs [carpeta-de-capturas]
   Sale con código 1 si algo falla. */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { irA } = require("./ir.cjs");

const PREVIEW = path.join(__dirname, "preview.html");
const OUT = process.argv[2] || path.join(__dirname, "shots");
const VENDOR = process.env.VENDOR_DIR || "";
const ME = "u_lorenzoAAAAAAAAAAAAAAAAAA";
const ZHR = "https://zh-reuniones.vercel.app";
const errors = [];
const notes = [];
const ok = (cond, msg) => { if (!cond) errors.push("falló: " + msg); else notes.push("ok: " + msg); };
const iso = (n) => new Date(Date.now() + n * 864e5).toISOString();
const haceMin = (m) => new Date(Date.now() - m * 6e4).toISOString();

const SEED = {
  ["equipo/" + ME]: { nombre: "Lorenzo Bozzo", cargo: "Socio fundador", telefono: "+56955551234", correo: "lorenzo@zhdevelopment.cl" },
  "config/general": { agendaUrl: "https://zhdevelopment.cl/#agendar" },
  "leads/lead-mic": { nombre: "Andrea Fuentes", empresa: "Ferretería Andes", cargo: "", telefono: "+56922223333", correo: "", etapa: "nuevo", prioridad: "media", trato: "tu", intentos: 0, proxima: null, origen: "web", necesidad: "Ordenar el inventario", rubro: "Ferretería y materiales de construcción", notas: "Tienen tres sucursales en Santiago.", creado: iso(-2), actualizado: iso(-2), creadoPor: ME },
  "leads/lead-hoy": { nombre: "Rodrigo Soto", empresa: "Bodegas del Valle", cargo: "", telefono: "+56933334444", correo: "", etapa: "contactado", prioridad: "media", trato: "tu", intentos: 0, proxima: null, origen: "web", necesidad: "", creado: iso(-5), actualizado: iso(-5), creadoPor: ME },
  "clientes/cli-mic": { nombre: "Taller Sur", razonSocial: "", rut: "", contactos: [{ id: "ct-1", nombre: "Jorge Pérez", cargo: "Dueño", correo: "jorge@tallersur.cl", telefono: "+56944445555", rol: "decisor", principal: true }], responsable: ME, trato: "tu", leadIds: [], estado: "activo", notas: "", creado: iso(-30), actualizado: iso(-30), creadoPor: ME },
};
const TEXTO = "Hola Andrea, te llamo de ZH por lo del inventario\nLa verdad lo encuentro un poco caro\nNos interesa ver una demo la próxima semana\nMándame la propuesta al correo";
const vivoDe = (id, ref, tipo, ini, fin) => ({ id, origen: "vivo", tipo, ...(ref ? { ref } : {}), titulo: tipo === "llamada" ? "Llamada" : "Reunión", codigo: "", software: "ZH Reuniones", inicio: ini, fin, estado: "lista", participantes: [], intervenciones: 4 });

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

  async function open(opts) {
    const context = await browser.newContext({ viewport: { width: 1360, height: 900 } });
    const page = await context.newPage();
    page.on("console", (m) => { if (m.type() === "error") errors.push(`[${opts.name}] consola: ${m.text()}`); });
    page.on("pageerror", (e) => errors.push(`[${opts.name}] error: ${e.message}`));
    await context.route(ZHR + "/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>ZH Reuniones</title><p>Transcribir en vivo</p>" }));
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (url.startsWith("file:") || url.startsWith("data:")) return route.continue();
      if (url.includes("cdnjs.cloudflare.com") && VENDOR) {
        const f = path.join(VENDOR, url.split("/").pop());
        if (fs.existsSync(f)) return route.fulfill({ status: 200, contentType: "application/javascript", body: fs.readFileSync(f) });
      }
      if (url.includes("cdnjs.cloudflare.com")) return route.continue();
      if (url.includes("fonts.googleapis.com")) return route.fulfill({ status: 200, contentType: "text/css", body: "" });
      return route.abort();
    });
    await page.addInitScript((o) => { window.__MOCK_SEED = o.seed; window.__MOCK_MIC = o.mic; if (o.reu) window.__MOCK_REU = o.reu; }, { seed: opts.seed, mic: opts.mic, reu: opts.reu });
    await page.goto("file://" + PREVIEW);
    await page.getByRole("heading", { name: "Hoy", exact: true }).waitFor({ timeout: 15000 });
    return page;
  }
  const shot = (page, name) => page.screenshot({ path: path.join(OUT, name), fullPage: false });
  const store = (page) => page.evaluate(() => Object.fromEntries(window.__mockStore));
  const abrirFicha = async (page, nombre, titulo) => {
    await irA(page, "leads");
    await page.locator("table.leads tbody tr", { hasText: nombre }).click();
    await page.locator("#lead-title", { hasText: titulo }).waitFor();
  };

  /* ---------------- el micrófono del CRM: se abre una vez y cada llamada se transcribe desde la ficha ---------------- */
  const page = await open({ name: "en vivo", seed: SEED, mic: { modo: "politica" }, reu: { modo: "ok", transcripciones: [], textos: {}, enVivo: {} } });
  await abrirFicha(page, "Andrea Fuentes", "Ferretería Andes");
  await page.locator(".work-tabs button", { hasText: "Registrar llamada" }).click();
  const enlace = page.getByRole("link", { name: "Abrir el micrófono" });
  await enlace.waitFor();
  const href = new URL(await enlace.getAttribute("href"));
  const sid = href.searchParams.get("sesion") || "";
  ok(href.origin + href.pathname === `${ZHR}/vivo` && /^ses-[a-z0-9]{8,40}$/.test(sid) && (await enlace.getAttribute("target")) === "_blank", "como claude.ai no deja usar el micrófono, se abre el micrófono del CRM en ZH Reuniones, con la sesión de este navegador");
  ok(await page.locator(".live", { hasText: "Se abre una vez" }).isVisible(), "explica que se abre una vez y que cada llamada se transcribe desde la ficha");
  ok((await page.locator(".live .note li", { hasText: "Escritura por voz" }).count()) === 0, "sin el plan B de Google Docs");
  const [ventana] = await Promise.all([page.context().waitForEvent("page"), enlace.click()]);
  await ventana.waitForLoadState();
  ok(ventana.url() === href.toString(), "se abre en una ventana aparte");
  await ventana.close();
  await page.locator(".live .note", { hasText: "Esperando el micrófono" }).waitFor();
  ok(true, "la ficha espera a que el micrófono empiece a escuchar");
  await shot(page, "v01-microfono.png");
  /* ZH Reuniones empieza a escuchar: lo que se dijo antes de «Empezar a transcribir» no cuenta. */
  const ahora0 = Date.now();
  await page.evaluate((o) => { window.__MOCK_REU.enVivo[o.sid] = { estado: "escuchando", tipo: "sesion", inicio: new Date(o.t - 60000).toISOString(), actualizada: new Date(o.t).toISOString(), lineas: ["Algo que se dijo antes de la llamada"], tiempos: [o.t - 30000], parcial: "", total: 1 }; }, { sid, t: ahora0 });
  const empezar = page.getByRole("button", { name: "Empezar a transcribir" });
  await empezar.waitFor({ timeout: 8000 });
  ok(true, "cuando el micrófono escucha, aparece «Empezar a transcribir»");
  await empezar.click();
  await page.locator(".live.on", { hasText: "Transcribiendo" }).waitFor();
  const decir = (frases, parcial, desfase = 0) => page.evaluate((o) => {
    const v = window.__MOCK_REU.enVivo[o.sid];
    const t = Date.now() + o.desfase;
    o.frases.forEach((x, i) => { v.lineas.push(x); v.tiempos.push(t + i); });
    v.total = v.lineas.length;
    v.parcial = o.parcial;
    v.actualizada = new Date().toISOString();
  }, { sid, frases, parcial, desfase });
  await decir(["Hola andrea te llamo de zh por lo del inventario", "La verdad lo encuentro un poco caro"], "y no sé si");
  await page.waitForFunction(() => (document.querySelector("#c-trans") || {}).value && document.querySelector("#c-trans").value.includes("un poco caro"), null, { timeout: 8000 });
  const trans1 = await page.inputValue("#c-trans");
  ok(trans1 === "Hola andrea te llamo de zh por lo del inventario\nLa verdad lo encuentro un poco caro", "lo que se dice llega a la transcripción de la ficha, sin lo de antes de empezar");
  ok(await page.locator(".live.on .live-text", { hasText: "y no sé si" }).isVisible(), "con la frase que va a medias");
  ok(await page.locator(".coach-pista", { hasText: "Parece una objeción de precio." }).isVisible(), "y la pista de objeción");
  await shot(page, "v01b-transcribiendo.png");
  await page.getByRole("button", { name: "¿Qué le respondo?" }).click();
  await page.locator(".coach-card .coach-say").waitFor({ timeout: 5000 });
  const pAyuda = (await page.evaluate(() => window.__mockPrompts)).filter((x) => x.includes("Estás ayudando en vivo")).pop() || "";
  ok(pAyuda.includes("La verdad lo encuentro un poco caro") && !pAyuda.includes("Algo que se dijo antes"), "«¿Qué le respondo?» le pasa a Claude lo que va de la llamada");
  ok(pAyuda.includes("A qué se dedican: Ferretería y materiales de construcción") && pAyuda.includes("Tienen tres sucursales en Santiago") && pAyuda.includes("no lo cites tal cual"), "con lo que hace la empresa y lo que investigamos, como contexto interno");
  ok((await page.evaluate(() => window.__mockOpts)).pop().model === "claude-haiku-5-5", "con el modelo rápido");
  await decir(["Nos interesa ver una demo la próxima semana", "Mándame la propuesta al correo"], "");
  await page.waitForFunction(() => document.querySelector("#c-trans").value.includes("Mándame la propuesta"), null, { timeout: 8000 });
  await page.getByRole("button", { name: "Terminar" }).click();
  await decir(["Esto ya es después de cortar"], "", 6000);
  await page.locator(".work .plan").waitFor({ timeout: 15000 });
  ok(true, "al tocar «Terminar» en la ficha, Claude arma el plan solo");
  const pLlamada = (await page.evaluate(() => window.__mockPrompts)).filter((x) => x.includes("esta llamada con un lead")).pop() || "";
  ok(pLlamada.includes("hecha en vivo con el micrófono del computador") && pLlamada.includes("Mándame la propuesta al correo") && !pLlamada.includes("Algo que se dijo antes") && !pLlamada.includes("después de cortar"), "Claude recibe solo lo de la llamada y sabe que viene del micrófono, sin separar voces");
  await shot(page, "v02-plan.png");
  await page.getByRole("button", { name: "Confirmar y guardar" }).click();
  await page.locator(".done-card").waitFor();
  await page.waitForTimeout(300);
  let dump = await store(page);
  const act = Object.entries(dump).find(([k, v]) => k.startsWith("actividades/") && v.tipo === "llamada" && v.leadId === "lead-mic");
  ok(act && act[1].resumen, "la llamada queda registrada con su análisis");
  await page.keyboard.press("Escape");
  await page.locator(".scrim").first().waitFor({ state: "detached" });

  /* La siguiente llamada, sin volver a abrir nada: el micrófono sigue escuchando. */
  await abrirFicha(page, "Rodrigo Soto", "Bodegas del Valle");
  await page.locator(".work-tabs button", { hasText: "Registrar llamada" }).click();
  await page.getByRole("button", { name: "Empezar a transcribir" }).waitFor({ timeout: 8000 });
  ok(!(await page.getByRole("link", { name: "Abrir el micrófono" }).count()), "para la siguiente llamada no hay que abrir nada: está listo para empezar");
  await page.evaluate((o) => { window.__MOCK_REU.enVivo[o.sid].estado = "pausada"; window.__MOCK_REU.enVivo[o.sid].actualizada = new Date().toISOString(); }, { sid });
  await page.locator(".live", { hasText: "está en pausa" }).waitFor({ timeout: 10000 });
  ok(await page.getByRole("link", { name: "Ir al micrófono" }).isVisible(), "si el micrófono está en pausa, lo dice y lleva a su ventana");
  await page.evaluate((o) => { window.__MOCK_REU.enVivo[o.sid].estado = "escuchando"; window.__MOCK_REU.enVivo[o.sid].actualizada = new Date().toISOString(); }, { sid });
  await page.getByRole("button", { name: "Empezar a transcribir" }).waitFor({ timeout: 10000 });
  await page.keyboard.press("Escape");
  await page.locator(".scrim").first().waitFor({ state: "detached" });

  /* ---------------- Hoy: una llamada transcrita en vivo, unida a su lead, y una sin asociar ---------------- */
  const C = vivoDe("tt-abc125-0a1b2c3f", "", "llamada", haceMin(90), haceMin(85));
  const B = vivoDe("tt-abc124-0a1b2c3e", "lead-hoy", "llamada", haceMin(30), haceMin(26));
  await page.evaluate((o) => {
    window.__MOCK_REU.transcripciones.push(o.B, o.C);
    window.__MOCK_REU.textos[o.B.id] = { texto: o.TEXTO.replace("Andrea", "Rodrigo"), participantes: [], intervenciones: 4 };
    window.__reuRefrescar();
  }, { B, C, TEXTO });
  await irA(page, "hoy");
  const grupo = page.locator('.hoy-grupo[aria-label="Reuniones y llamadas transcritas"]');
  await grupo.waitFor();
  ok((await grupo.locator(".task-group").innerText()).includes("Reuniones y llamadas transcritas · 2"), "con llamadas, el grupo se llama «Reuniones y llamadas transcritas»");
  ok(await page.locator(".page-head p", { hasText: "2 transcripciones por registrar" }).isVisible() || (await page.textContent("main")).includes("2 transcripciones por registrar"), "y el resumen de Hoy las cuenta como transcripciones");
  const filaB = grupo.locator(".trans", { hasText: "Bodegas del Valle" });
  ok(await filaB.isVisible() && (await filaB.innerText()).includes("Llamada"), "Hoy muestra la llamada transcrita en vivo, unida a su lead");
  const suelta = grupo.locator(".trans", { hasText: "Llamada sin asociar" });
  ok(await suelta.isVisible() && !(await suelta.locator(".trans-titulo").innerText()).includes("· Llamada"), "y una sin lead queda como «Llamada sin asociar», sin repetir «Llamada»");
  await shot(page, "v03-hoy.png");
  await filaB.getByRole("button", { name: "Registrar" }).click();
  await page.locator(".work-tabs button[aria-pressed='true']", { hasText: "Registrar llamada" }).waitFor();
  ok(true, "«Registrar» abre «Registrar llamada» en la ficha del lead");
  await page.locator(".work .meet-nota", { hasText: "Llamada transcrita en vivo con ZH Reuniones" }).waitFor();
  await page.locator(".work .plan").waitFor({ timeout: 10000 });
  ok(true, "con la transcripción, y Claude arma el plan");
  await page.keyboard.press("Escape");
  await page.locator(".scrim").first().waitFor({ state: "detached" });

  /* ---------------- lo que quedó sin guardar se puede descartar ---------------- */
  await abrirFicha(page, "Andrea Fuentes", "Ferretería Andes");
  const registrar = () => page.locator(".work-tabs button", { hasText: "Registrar llamada" }).click();
  await registrar();
  await page.fill("#c-notas", "Notas de una prueba");
  await page.keyboard.press("Escape");
  await page.locator(".scrim").first().waitFor({ state: "detached" });
  await abrirFicha(page, "Andrea Fuentes", "Ferretería Andes");
  await registrar();
  const recuperado = page.locator(".work .note", { hasText: "Recuperé lo que quedó sin guardar" });
  await recuperado.waitFor();
  await recuperado.getByRole("button", { name: "Descartar" }).click();
  ok(!(await recuperado.count()) && (await page.inputValue("#c-notas")) === "", "lo que quedó sin guardar se descarta con un toque");
  await page.keyboard.press("Escape");
  await page.locator(".scrim").first().waitFor({ state: "detached" });
  await abrirFicha(page, "Andrea Fuentes", "Ferretería Andes");
  await registrar();
  await page.locator("#c-notas").waitFor();
  ok(!(await page.locator(".work .note", { hasText: "Recuperé lo que quedó sin guardar" }).count()), "y no vuelve a aparecer");
  await page.keyboard.press("Escape");
  await page.locator(".scrim").first().waitFor({ state: "detached" });

  /* ---------------- la ficha del cliente ---------------- */
  await irA(page, "clientes");
  await page.locator("table.leads tbody tr", { hasText: "Taller Sur" }).click();
  await page.locator("#cli-title", { hasText: "Taller Sur" }).waitFor();
  await page.locator(".work-tabs button", { hasText: "Registrar" }).first().click();
  const empezarC = page.getByRole("button", { name: "Empezar a transcribir" });
  await empezarC.waitFor({ timeout: 8000 });
  ok(await page.locator(".live", { hasText: "empiece la conversación" }).isVisible(), "en la ficha del cliente, el mismo micrófono sirve para la reunión");
  await empezarC.click();
  await decir(["Revisamos el avance del sistema de inventario", "Quedamos en probar la carga masiva el jueves"], "");
  await page.waitForFunction(() => (document.querySelector("#cl-texto") || {}).value && document.querySelector("#cl-texto").value.includes("carga masiva"), null, { timeout: 8000 });
  await page.getByRole("button", { name: "Terminar" }).click();
  await page.locator(".live .live-row", { hasText: "Empezar a transcribir" }).waitFor({ timeout: 10000 });
  ok((await page.inputValue("#cl-texto")).endsWith("Revisamos el avance del sistema de inventario\nQuedamos en probar la carga masiva el jueves"), "y lo dicho queda en las notas de la reunión del cliente");
  await page.close();

  /* ---------------- sin ZH Reuniones: el plan B con Google Docs ---------------- */
  const sin = await open({ name: "sin ZH Reuniones", seed: SEED, mic: { modo: "politica" } });
  await abrirFicha(sin, "Andrea Fuentes", "Ferretería Andes");
  await sin.locator(".work-tabs button", { hasText: "Registrar llamada" }).click();
  await sin.getByRole("button", { name: "Transcribir en vivo" }).click();
  await sin.locator(".live .note", { hasText: "claude.ai no deja que el CRM use el micrófono" }).waitFor();
  ok(await sin.locator(".live .note li", { hasText: "Escritura por voz" }).isVisible(), "sin ZH Reuniones conectado, queda el plan B con Google Docs");
  await sin.close();

  await browser.close();
  console.log(notes.join("\n"));
  if (errors.length) { console.error("\n" + errors.join("\n")); process.exit(1); }
  console.log(`\nTodo bien. Capturas en ${OUT}`);
})().catch((e) => { console.error(e); console.error(errors.join("\n")); process.exit(1); });
