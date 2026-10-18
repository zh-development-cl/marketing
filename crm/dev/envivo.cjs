/* Prueba de «Transcribir en vivo» con ZH Reuniones, con Playwright, el mock de window.claude y ZH
   Reuniones simulado. Como en claude.ai, la política de permisos no deja que el CRM use el micrófono:
   el botón abre la página «Transcribir en vivo» de ZH Reuniones en otra pestaña (con el lead o cliente
   y el tipo), la ficha espera y, al volver, lee el almacén sin caché y carga la transcripción que llegó
   para ese lead; Claude arma el plan sabiendo que viene del micrófono, sin separar voces, y al
   confirmar queda la llamada con su transcripción registrada. También: Hoy muestra una llamada
   transcrita en vivo unida a su lead («Registrar» abre «Registrar llamada»), una sin asociar, la ficha
   del cliente y, sin ZH Reuniones, el plan B con Google Docs. Usa datos inventados.

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
  "leads/lead-mic": { nombre: "Andrea Fuentes", empresa: "Ferretería Andes", cargo: "", telefono: "+56922223333", correo: "", etapa: "nuevo", prioridad: "media", trato: "tu", intentos: 0, proxima: null, origen: "web", necesidad: "Ordenar el inventario", creado: iso(-2), actualizado: iso(-2), creadoPor: ME },
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

  /* ---------------- una llamada transcrita en ZH Reuniones vuelve sola a la ficha ---------------- */
  const page = await open({ name: "en vivo", seed: SEED, mic: { modo: "politica" }, reu: { modo: "ok", transcripciones: [], textos: {} } });
  await abrirFicha(page, "Andrea Fuentes", "Ferretería Andes");
  await page.locator(".work-tabs button", { hasText: "Registrar llamada" }).click();
  const enlace = page.getByRole("link", { name: "Transcribir en vivo" });
  await enlace.waitFor();
  ok((await enlace.getAttribute("href")) === `${ZHR}/vivo?ref=lead-mic&tipo=llamada` && (await enlace.getAttribute("target")) === "_blank", "como claude.ai no deja usar el micrófono, «Transcribir en vivo» abre ZH Reuniones en otra pestaña, con el lead y el tipo");
  ok(await page.locator(".live", { hasText: "Se abre ZH Reuniones en otra pestaña y escucha la llamada con el celular en altavoz" }).isVisible(), "explica qué va a pasar");
  ok((await page.locator(".live .note li", { hasText: "Escritura por voz" }).count()) === 0, "sin el plan B de Google Docs");
  const [pestana] = await Promise.all([page.context().waitForEvent("page"), enlace.click()]);
  await pestana.waitForLoadState();
  ok(pestana.url() === `${ZHR}/vivo?ref=lead-mic&tipo=llamada`, "la pestaña abre la página de ZH Reuniones");
  await pestana.close();
  await page.locator(".live .note", { hasText: "Esperando la transcripción de ZH Reuniones" }).waitFor();
  ok(true, "la ficha queda esperando la transcripción");
  await shot(page, "v01-esperando.png");
  const llamadasAntes = (await page.evaluate(() => window.__mcpCalls)).length;
  const t0 = Date.now();
  const A = vivoDe("tt-abc123-0a1b2c3d", "lead-mic", "llamada", new Date(t0).toISOString(), new Date(t0 + 4 * 6e4).toISOString());
  const B = vivoDe("tt-abc124-0a1b2c3e", "lead-hoy", "llamada", haceMin(30), haceMin(26));
  await page.evaluate((o) => {
    window.__MOCK_REU.transcripciones.push(o.A, o.B);
    window.__MOCK_REU.textos[o.A.id] = { texto: o.TEXTO, participantes: [], intervenciones: 4 };
    window.__MOCK_REU.textos[o.B.id] = { texto: o.TEXTO.replace("Andrea", "Rodrigo"), participantes: [], intervenciones: 4 };
    window.dispatchEvent(new Event("focus"));
  }, { A, B, TEXTO });
  await page.locator(".work .meet-nota", { hasText: "Llamada transcrita en vivo con ZH Reuniones" }).waitFor({ timeout: 8000 });
  ok(true, "al volver a la pestaña, la transcripción de este lead se carga sola");
  const llamadas = (await page.evaluate(() => window.__mcpCalls)).slice(llamadasAntes);
  ok(llamadas.some((x) => x.tipo === "call" && x.tool === "transcripciones" && x.input && x.input.fresco === true), "para eso lee el almacén sin caché");
  await page.locator(".work .plan").waitFor({ timeout: 10000 });
  ok(true, "y Claude arma el plan solo");
  const prompts = await page.evaluate(() => window.__mockPrompts);
  const pLlamada = prompts.filter((x) => x.includes("esta llamada con un lead")).pop() || "";
  ok(pLlamada.includes("hecha en vivo con el micrófono del computador") && pLlamada.includes("Mándame la propuesta al correo"), "Claude recibe la transcripción y sabe que viene del micrófono, sin separar voces");
  ok(!pLlamada.includes("subtítulos de Google Meet"), "y no la trata como una de Meet");
  await shot(page, "v02-plan.png");
  await page.getByRole("button", { name: "Confirmar y guardar" }).click();
  await page.locator(".done-card").waitFor();
  await page.waitForTimeout(300);
  let dump = await store(page);
  const act = Object.entries(dump).find(([k, v]) => k.startsWith("actividades/") && v.tipo === "llamada" && v.leadId === "lead-mic");
  ok(act && act[1].vivo && act[1].vivo.transcripcion === A.id && act[1].fecha === A.inicio && !act[1].meet, "la llamada queda con su hora real y de qué transcripción salió");
  const reg = dump["transcripciones/tr-" + A.id];
  ok(reg && reg.estado === "registrada" && reg.leadId === "lead-mic" && reg.actividadId === act[0].split("/")[1], "y la transcripción queda registrada, unida a la llamada");
  await page.keyboard.press("Escape");
  await page.locator(".scrim").first().waitFor({ state: "detached" });

  /* ---------------- Hoy: una llamada transcrita en vivo, unida a su lead, y una sin asociar ---------------- */
  const C = vivoDe("tt-abc125-0a1b2c3f", "", "llamada", haceMin(90), haceMin(85));
  await page.evaluate((o) => { window.__MOCK_REU.transcripciones.push(o.C); window.__reuRefrescar(); }, { C });
  await irA(page, "hoy");
  const grupo = page.locator('.hoy-grupo[aria-label="Reuniones y llamadas transcritas"]');
  await grupo.waitFor();
  ok((await grupo.locator(".task-group").innerText()).includes("Reuniones y llamadas transcritas · 2"), "con llamadas, el grupo se llama «Reuniones y llamadas transcritas»");
  ok(await page.locator(".page-head p", { hasText: "2 transcripciones por registrar" }).isVisible() || (await page.textContent("main")).includes("2 transcripciones por registrar"), "y el resumen de Hoy las cuenta como transcripciones");
  const filaB = grupo.locator(".trans", { hasText: "Bodegas del Valle" });
  ok(await filaB.isVisible() && (await filaB.innerText()).includes("Llamada"), "Hoy muestra la llamada transcrita en vivo, unida a su lead");
  ok((await grupo.locator(".trans", { hasText: "Ferretería Andes" }).count()) === 0, "la ya registrada no vuelve");
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

  /* ---------------- la ficha del cliente ---------------- */
  await irA(page, "clientes");
  await page.locator("table.leads tbody tr", { hasText: "Taller Sur" }).click();
  await page.locator("#cli-title", { hasText: "Taller Sur" }).waitFor();
  await page.locator(".work-tabs button", { hasText: "Registrar" }).first().click();
  const enlaceC = page.getByRole("link", { name: "Transcribir en vivo" });
  await enlaceC.waitFor();
  ok((await enlaceC.getAttribute("href")) === `${ZHR}/vivo?ref=cli-mic&tipo=reunion`, "en la ficha del cliente abre ZH Reuniones con el cliente y «reunión»");
  ok(await page.locator(".live", { hasText: "escucha la conversación" }).isVisible(), "y dice que escucha la conversación");
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
