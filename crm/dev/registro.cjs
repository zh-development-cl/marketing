/* Prueba del plan de Claude al registrar una llamada, con Playwright y el mock de window.claude (y
   Google Calendar simulado). Recorre: Claude arma el plan (resultado, etapa, reunión y tareas) y nada
   se guarda antes de confirmar; el plan se edita (la hora y el título de la reunión, una tarea, una
   tarea nueva y otra quitada); al confirmar, la reunión se crea en el Google Calendar de la cuenta
   de ZH con Meet, el lead y los correos del equipo invitados, y quedan la etapa, las tareas y el
   mensaje redactado; «no contestó» sale del texto y deja la llamada que sigue; sin Claude, el
   registro a mano; teléfono y modo oscuro. Usa datos inventados.

   Uso:
     python3 crm/dev/build_preview.py
     NODE_PATH=$(npm root -g) VENDOR_DIR=<carpeta con preact.umd.min.js, hooks.umd.min.js, htm.umd.min.js> \
       node crm/dev/registro.cjs [carpeta-de-capturas]
   Sale con código 1 si algo falla. */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { irA } = require("./ir.cjs");

const PREVIEW = path.join(__dirname, "preview.html");
const OUT = process.argv[2] || path.join(__dirname, "shots");
const VENDOR = process.env.VENDOR_DIR || "";
const ME = "u_lorenzoAAAAAAAAAAAAAAAAAA";
const TZ = "America/Santiago";
const CUENTA = "contacto@zhdevelopment.cl";
const EQUIPO = ["socio@zhdevelopment.cl", "nico.socio@gmail.com"];
const errors = [];
const notes = [];
const ok = (cond, msg) => { if (!cond) errors.push("falló: " + msg); else notes.push("ok: " + msg); };
const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const T = keyFmt.format(new Date());
const iso = (n) => new Date(Date.now() + n * 864e5).toISOString();
const lead = (o) => ({ cargo: "", correo: "", origen: "prospeccion", trato: "tu", intentos: 0, proxima: null, prioridad: "media", necesidad: "", responsable: "lorenzo", etapa: "contactado", creado: iso(-10), actualizado: iso(-1), creadoPor: ME, ...o });

const SEED = {
  ["equipo/" + ME]: { nombre: "Lorenzo Bozzo", cargo: "Socio", telefono: "+56955551234", correo: "" },
  "config/general": { agendaUrl: "https://zhdevelopment.cl/#agendar", gmailCuenta: CUENTA, correosEquipo: EQUIPO },
  "leads/lead-a": lead({ nombre: "Andrea Fuentes", empresa: "Ferretería Andes", telefono: "+56922220001", correo: "andrea@ferreteriaandes.cl", etapa: "nuevo" }),
  "tareas/tar-a": { leadId: "lead-a", tipo: "llamar", titulo: "Primera llamada", fecha: T, hora: "", estado: "pendiente", responsable: "lorenzo", origen: "manual", nota: "", creado: iso(-1), actualizado: iso(-1), creadoPor: ME },
  "leads/lead-b": lead({ nombre: "Bruno Díaz", empresa: "Viña Norte", telefono: "+56922220002" }),
  "leads/lead-c": lead({ nombre: "Clara Soto", empresa: "Imprenta Sur", telefono: "+56922220003", etapa: "nuevo" }),
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  async function open(opts) {
    const context = await browser.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, colorScheme: opts.dark ? "dark" : "light", hasTouch: !!opts.touch, isMobile: !!opts.touch });
    const page = await context.newPage();
    page.on("console", (m) => { if (m.type() === "error") errors.push(`[${opts.name}] consola: ${m.text()}`); });
    page.on("pageerror", (e) => errors.push(`[${opts.name}] error: ${e.message}`));
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
    await page.addInitScript((o) => { window.__MOCK_SEED = o.seed; window.__MOCK_RECORDATORIOS = false; window.__MOCK_MCP = o.mcp; if (o.sinClaude) window.__MOCK_SIN_CLAUDE = true; }, { seed: SEED, mcp: opts.mcp || null, sinClaude: !!opts.sinClaude });
    /* Cada aviso que aparece queda anotado: con Claude simulado, el borrador llega en un instante y
       reemplaza el aviso anterior antes de que la prueba alcance a leerlo. */
    await page.addInitScript(() => {
      window.__avisos = [];
      const mo = new MutationObserver(() => { for (const t of document.querySelectorAll(".toast")) { const x = t.innerText; if (x && !window.__avisos.includes(x)) window.__avisos.push(x); } });
      document.addEventListener("DOMContentLoaded", () => mo.observe(document.body, { childList: true, subtree: true, characterData: true }));
    });
    await page.goto("file://" + PREVIEW);
    await page.getByRole("heading", { name: "Hoy", exact: true }).waitFor({ timeout: 15000 });
    return page;
  }
  const shot = (page, name) => page.screenshot({ path: path.join(OUT, name), fullPage: false });
  const toast = (page, text) => page.waitForFunction((t) => (window.__avisos || []).some((x) => x.includes(t)), text, { timeout: 8000 }).then(() => true, () => false);
  const store = (page) => page.evaluate(() => Object.fromEntries(window.__mockStore));
  const docs = (dump, col) => Object.entries(dump).filter(([k]) => k.startsWith(col + "/")).map(([k, v]) => ({ id: k.split("/")[1], ...v }));
  const llamadas = (page, tool) => page.evaluate((t) => (window.__mcpCalls || []).filter((c) => c.tipo === "call" && c.tool === t), tool);
  const abrirRegistro = async (page, empresa) => {
    await irA(page, "leads");
    await page.locator("#f-etapa").selectOption("todos");
    /* En el teléfono la tabla se ve como lista. */
    const fila = page.locator("table.leads tbody tr", { hasText: empresa });
    if (await fila.isVisible()) await fila.click();
    else await page.locator(".only-narrow .lrow-main", { hasText: empresa }).click();
    await page.locator("#lead-title", { hasText: empresa }).waitFor();
    await page.locator(".work-tabs button", { hasText: "Registrar llamada" }).click();
  };
  const cerrarFicha = async (page) => { await page.keyboard.press("Escape"); await page.locator(".drawer").waitFor({ state: "detached" }); };

  /* ---------------- el plan: se arma, se edita y se confirma ---------------- */
  const page = await open({ name: "plan", mcp: { modo: "ok", eventos: [] } });
  await abrirRegistro(page, "Ferretería Andes");
  ok((await page.locator(".work .switch").count()) === 0 && await page.locator(".work .a-mano").evaluate((d) => !d.open), "sin «Automático»: el plan con Claude adelante y el registro a mano plegado");
  await page.fill("#c-notas", "Hablé con Andrea. Coordinan los despachos con planillas y WhatsApp. Quedamos en una llamada de descubrimiento.");
  await page.getByRole("button", { name: "Armar el plan con Claude" }).click();
  await page.locator(".work .plan").waitFor();
  let dump = await store(page);
  ok(!docs(dump, "actividades").some((a) => a.leadId === "lead-a") && dump["leads/lead-a"].etapa === "nuevo" && (await llamadas(page, "create_event")).length === 0, "armar el plan no guarda ni agenda nada");
  ok((await page.inputValue("#pl-res")) === "contesto" && (await page.inputValue("#pl-etapa")) === "reunion_agendada", "el plan trae el resultado («Contestó») y la etapa («Reunión agendada»)");
  ok((await page.inputValue("#pl-resumen")).startsWith("Carolina coordina los despachos"), "y «Qué pasó», escrito por Claude y editable");
  const fechaR = await page.inputValue("#pl-r-fecha");
  ok(/^\d{4}-\d{2}-\d{2}$/.test(fechaR) && (await page.inputValue("#pl-r-hora")) === "11:00", "y la reunión acordada con su día y hora");
  ok(await page.locator(".work .plan .plan-nota", { hasText: `Se crea en el Google Calendar de ${CUENTA}, con Meet. Invitados: andrea@ferreteriaandes.cl, ${EQUIPO.join(", ")}.` }).isVisible(), "dice que la reunión se crea en el calendario de la cuenta de ZH, con Meet, y a quién invita");
  ok((await page.inputValue("#pl-r-conf")) === "", "como ya hay un WhatsApp acordado, no propone otra confirmación");

  /* editar el plan */
  await page.fill("#pl-r-hora", "12:30");
  await page.fill("#pl-r-tit", "Diagnóstico de despachos");
  await page.locator(".work .plan .t-tit").first().fill("Mandarle por WhatsApp el enlace de Meet");
  await page.getByRole("button", { name: "Agregar tarea" }).click();
  await page.locator(".work .plan .t-tit").last().fill("Preparar la demo");
  await page.locator(".work .plan .t-tipo").last().selectOption("otro");
  await page.getByRole("button", { name: "Agregar tarea" }).click();
  await page.locator(".work .plan .t-tit").last().fill("Esta no va");
  await page.getByRole("button", { name: "Quitar Esta no va" }).click();
  ok((await page.locator(".work .plan .plan-tarea").count()) === 2, "se agregan y se quitan tareas");
  await page.fill("#pl-dur", "9");
  await shot(page, "r01-plan.png");
  await page.getByRole("button", { name: "Confirmar y guardar" }).click();
  await page.locator(".done-card", { hasText: "Llamada guardada con el análisis de Claude" }).waitFor({ timeout: 10000 });
  ok(await toast(page, "Quedó en Google Calendar con Meet"), "al confirmar, el aviso dice que la reunión quedó en Google Calendar con Meet");
  const ce = (await llamadas(page, "create_event"))[0] || {};
  const ci = ce.input || {};
  ok((await llamadas(page, "create_event")).length === 1 && ci.calendarId === CUENTA && ci.addGoogleMeetUrl === true, "la reunión se crea una vez, en el calendario de la cuenta de ZH y con Meet");
  ok(ci.startTime === `${fechaR}T12:30:00` && ci.endTime === `${fechaR}T13:00:00` && ci.timeZone === TZ, "con el día y la hora corregidos, en hora de Chile");
  ok(ci.summary === "Diagnóstico de despachos · Ferretería Andes y ZH Development", "con el título corregido");
  ok(JSON.stringify(ci.attendees) === JSON.stringify([{ email: "andrea@ferreteriaandes.cl", displayName: "Andrea Fuentes" }, ...EQUIPO.map((email) => ({ email }))]), "invita al lead y a los correos del equipo de Ajustes, nada más");
  dump = await store(page);
  const act = docs(dump, "actividades").find((a) => a.leadId === "lead-a" && a.tipo === "llamada");
  ok(act && act.resultado === "contesto" && act.duracion === 9 && act.analisis && act.resumen.startsWith("Carolina coordina"), "queda la llamada con el resultado, la duración y lo que pasó");
  ok(dump["leads/lead-a"].etapa === "reunion_agendada" && dump["leads/lead-a"].ultimoContacto, "el lead pasa a «Reunión agendada»");
  const ta = docs(dump, "tareas").filter((x) => x.leadId === "lead-a" && x.estado === "pendiente");
  const reu = ta.find((x) => x.tipo === "reunion");
  ok(reu && reu.fecha === fechaR && reu.hora === "12:30" && reu.titulo === "Diagnóstico de despachos" && reu.evento && reu.evento.id, "la reunión queda como tarea, unida a su evento");
  ok(ta.some((x) => x.tipo === "whatsapp" && x.titulo === "Mandarle por WhatsApp el enlace de Meet") && ta.some((x) => x.tipo === "otro" && x.titulo === "Preparar la demo") && !ta.some((x) => x.titulo === "Esta no va"), "y las tareas como quedaron en el plan");
  ok(dump["tareas/tar-a"].estado === "hecha", "la llamada cumple la tarea de llamar que tocaba");
  ok(await toast(page, "Quedó redactado 1 borrador"), "y Claude deja redactado el WhatsApp acordado");
  await cerrarFicha(page);

  /* ---------------- no contestó: sale del texto y deja la llamada que sigue ---------------- */
  await abrirRegistro(page, "Viña Norte");
  await page.fill("#c-notas", "No contestó, sonó y nada.");
  await page.getByRole("button", { name: "Armar el plan con Claude" }).click();
  await page.locator(".work .plan").waitFor();
  ok((await page.inputValue("#pl-res")) === "no_contesto" && (await page.inputValue("#pl-etapa")) === "contactado", "Claude entiende que no contestó y la etapa sigue igual");
  ok((await page.locator(".work .plan .t-tit").first().inputValue()) === "Volver a llamar (1 intento sin respuesta)", "y el plan deja la llamada que sigue");
  ok(await page.locator(".work .plan .plan-nota", { hasText: "No quedó una reunión con día." }).isVisible(), "sin reunión");
  await page.getByRole("button", { name: "Confirmar y guardar" }).click();
  await page.locator(".done-card", { hasText: "Llamada guardada" }).waitFor({ timeout: 10000 });
  dump = await store(page);
  ok(dump["leads/lead-b"].intentos === 1 && dump["leads/lead-b"].ultimoIntento && !dump["leads/lead-b"].ultimoContacto, "suma el intento sin contar un contacto");
  ok(docs(dump, "actividades").some((a) => a.leadId === "lead-b" && a.tipo === "llamada" && a.resultado === "no_contesto") && docs(dump, "tareas").some((x) => x.leadId === "lead-b" && x.tipo === "llamar" && x.estado === "pendiente"), "queda el intento en el historial y la tarea de volver a llamar");
  await cerrarFicha(page);
  await page.context().close();

  /* ---------------- sin Claude: el registro a mano ---------------- */
  const sin = await open({ name: "sin-claude", sinClaude: true });
  await abrirRegistro(sin, "Imprenta Sur");
  ok((await sin.getByRole("button", { name: "Armar el plan con Claude" }).count()) === 0 && await sin.locator(".work .a-mano").evaluate((d) => d.open), "sin Claude, el registro a mano viene abierto");
  await sin.locator(".work .a-mano").getByRole("button", { name: "Contestó", exact: true }).click();
  await sin.fill("#c-notas", "Le interesa, que le escriba la próxima semana.");
  await sin.locator(".work .a-mano .btn.primary", { hasText: "Guardar llamada" }).click();
  ok(await toast(sin, "Llamada guardada · Contactado."), "se guarda a mano y el lead pasa a «Contactado»");
  await sin.context().close();

  /* ---------------- teléfono y modo oscuro ---------------- */
  const tel = await open({ name: "teléfono", viewport: { width: 390, height: 844 }, touch: true, mcp: { modo: "ok", eventos: [] } });
  await abrirRegistro(tel, "Ferretería Andes");
  await tel.fill("#c-notas", "Hablé con Andrea. Quedamos en una llamada de descubrimiento.");
  await tel.getByRole("button", { name: "Armar el plan con Claude" }).click();
  await tel.locator(".work .plan").waitFor();
  await tel.locator(".work .plan .plan-tarea").first().scrollIntoViewIfNeeded();
  ok(await tel.evaluate(() => document.querySelector(".drawer-body").scrollWidth <= document.querySelector(".drawer-body").clientWidth + 1), "en el teléfono, el plan cabe sin desplazarse hacia el lado");
  await shot(tel, "r02-plan-telefono.png");
  await tel.context().close();

  const dark = await open({ name: "oscuro", dark: true, mcp: { modo: "ok", eventos: [] } });
  await abrirRegistro(dark, "Ferretería Andes");
  await dark.fill("#c-notas", "Hablé con Andrea. Quedamos en una llamada de descubrimiento.");
  await dark.getByRole("button", { name: "Armar el plan con Claude" }).click();
  await dark.locator(".work .plan").waitFor();
  await shot(dark, "r03-plan-oscuro.png");
  await dark.context().close();

  await browser.close();
  for (const n of notes) console.log(n);
  if (errors.length) { for (const e of errors) console.log(e); process.exit(1); }
  console.log("\nTodo bien. Capturas en " + OUT);
})().catch((e) => { console.error(e); process.exit(1); });
