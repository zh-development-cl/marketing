/* Prueba de la ronda de mejoras con Playwright y el mock de window.claude (con Google Calendar
   simulado). Recorre: el buscador (⌘K, «/», flechas, teléfono, acciones); «Llamar en serie» (orden
   de la cola, saltar, elegir de la lista, «No contestó», registrar y pasar a la siguiente, filtro por
   socio); agendar con horarios libres y aviso de choque; el recordatorio por WhatsApp (mensaje listo,
   se mueve con la reunión, se apaga en Ajustes); «Preparar con Claude»; Métricas; selección múltiple
   en Leads; teléfono y modo oscuro. Usa datos inventados.

   Uso:
     python3 crm/dev/build_preview.py
     NODE_PATH=$(npm root -g) VENDOR_DIR=<carpeta con preact.umd.min.js, hooks.umd.min.js, htm.umd.min.js> \
       node crm/dev/mejoras.cjs [carpeta-de-capturas]
   Sale con código 1 si algo falla. */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { irA } = require("./ir.cjs");

const PREVIEW = path.join(__dirname, "preview.html");
const OUT = process.argv[2] || path.join(__dirname, "shots");
const VENDOR = process.env.VENDOR_DIR || "";
const ME = "u_lorenzoAAAAAAAAAAAAAAAAAA";
const NICO = "u_nicolasBBBBBBBBBBBBBBBBBB";
const TZ = "America/Santiago";
const CUENTA = "contacto@zhdevelopment.cl";
const errors = [];
const notes = [];
const ok = (cond, msg) => { if (!cond) errors.push("falló: " + msg); else notes.push("ok: " + msg); };
const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const T = keyFmt.format(new Date());
const addDays = (k, n) => { const d = new Date(k + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const finde = (k) => [0, 6].includes(new Date(k + "T12:00:00Z").getUTCDay());
const habil = (k, n) => { let d = k, left = n; while (left > 0) { d = addDays(d, 1); if (!finde(d)) left -= 1; } return d; };
const antesHabil = (k) => { let d = addDays(k, -1); while (finde(d)) d = addDays(d, -1); return d; };
const iso = (n) => new Date(Date.now() + n * 864e5).toISOString();
const fmtCL = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const chile = (k, hm) => {
  const local = `${k}T${hm}:00`;
  for (const off of ["-03:00", "-04:00"]) {
    const p = Object.fromEntries(fmtCL.formatToParts(new Date(local + off)).map((x) => [x.type, x.value]));
    if (`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}` === local.slice(0, 16)) return local + off;
  }
  return local + "-03:00";
};
const lead = (o) => ({ cargo: "", correo: "", telefono: "", origen: "prospeccion", trato: "tu", intentos: 0, proxima: null, prioridad: "media", necesidad: "", responsable: "lorenzo", creado: iso(-40), actualizado: iso(-1), creadoPor: ME, ...o });
const tarea = (o) => ({ estado: "pendiente", hora: "", responsable: "lorenzo", origen: "manual", creado: iso(-2), actualizado: iso(-2), creadoPor: ME, ...o });
const act = (o) => ({ autor: ME, fecha: iso(-3), ...o });
const evaluacion = (p, notas) => ({ puntaje: p, criterios: Object.fromEntries(["apertura", "descubrimiento", "escucha", "valor", "objeciones", "cierre"].map((k, i) => [k, { nota: notas[i], comentario: "" }])), bien: [], mejorar: [] });

/* El día de la reunión que se agenda: dos días hábiles más allá, para que haya un día hábil antes. */
const D = habil(T, 2);
const EVENTOS = [
  { id: "evotro01", summary: "Reunión con otro cliente", status: "confirmed", organizer: { email: CUENTA, self: true }, htmlLink: "https://www.google.com/calendar/event?eid=evotro01", updated: iso(-1),
    start: { dateTime: chile(D, "10:00"), timeZone: TZ }, end: { dateTime: chile(D, "11:00"), timeZone: TZ }, attendees: [{ email: CUENTA, self: true, responseStatus: "accepted" }] },
  { id: "evplan01", summary: "Planificación", status: "confirmed", organizer: { email: CUENTA, self: true }, htmlLink: "https://www.google.com/calendar/event?eid=evplan01", updated: iso(-1),
    start: { dateTime: chile(D, "15:00"), timeZone: TZ }, end: { dateTime: chile(D, "15:30"), timeZone: TZ }, attendees: [{ email: CUENTA, self: true, responseStatus: "accepted" }] },
];

const SEED = {
  ["equipo/" + ME]: { nombre: "Lorenzo Bozzo", cargo: "Socio", telefono: "+56955551234", correo: "socio@zhdevelopment.cl" },
  ["equipo/" + NICO]: { nombre: "Nicolás Valdivia", cargo: "Socio", telefono: "+56955554321", correo: "" },
  "config/general": { agendaUrl: "https://zhdevelopment.cl/#agendar", gmailCuenta: CUENTA, correosEquipo: ["socio@zhdevelopment.cl"] },
  /* Para llamar: una tarea atrasada, una de hoy, dos nuevos sin tarea y uno sin teléfono. */
  "leads/lead-a": lead({ nombre: "Andrea Fuentes", empresa: "Ferretería Andes", telefono: "+56922223333", etapa: "nuevo", prioridad: "alta", dolor: "Cotizan a mano por WhatsApp.", comoAyudamos: "Un cotizador conectado a su inventario.", guion: "Hola Andrea, te llamo de ZH por las cotizaciones." }),
  "tareas/tar-a1": tarea({ leadId: "lead-a", tipo: "llamar", titulo: "Primera llamada", fecha: T, hora: "09:00" }),
  "leads/lead-b": lead({ nombre: "Bruno Díaz", empresa: "Viña Norte", telefono: "+56933334444", correo: "bruno@vinanorte.cl", etapa: "contactado", intentos: 1 }),
  "tareas/tar-b1": tarea({ leadId: "lead-b", tipo: "llamar", titulo: "Volver a llamar (1 intento sin respuesta)", fecha: addDays(T, -1) }),
  "leads/lead-c": lead({ nombre: "Clara Soto", empresa: "Imprenta Sur", telefono: "+56944445555", etapa: "nuevo", responsable: null, creado: iso(-3) }),
  "leads/lead-d": lead({ nombre: "Diego Ruiz", empresa: "Taller Norte", telefono: "+56955556666", etapa: "nuevo", prioridad: "alta", responsable: "nicolas", creado: iso(-1) }),
  "leads/lead-e": lead({ nombre: "Eva Rojas", empresa: "Sin Teléfono SpA", etapa: "nuevo" }),
  /* Una reunión para preparar con Claude. */
  "leads/lead-f": lead({ nombre: "Elena Vidal", empresa: "Café Central", telefono: "+56966667777", correo: "elena@cafecentral.cl", etapa: "reunion_agendada", trato: "usted", creado: iso(-10) }),
  "tareas/tar-f1": tarea({ leadId: "lead-f", tipo: "reunion", titulo: "Reunión de descubrimiento", fecha: habil(T, 3), hora: "10:00", duracion: 30 }),
  /* Para agendar con horarios libres y recordatorio. */
  "leads/lead-g": lead({ nombre: "Gabriela Rivas", empresa: "Panadería Rivas", telefono: "+56988889999", correo: "gabi@panaderiarivas.cl", etapa: "contactado" }),
  /* Para las métricas: perdido, propuesta, negociación y ganado en el período. */
  "leads/lead-h": lead({ nombre: "Hugo Paz", empresa: "Fletes Paz", telefono: "+56912121212", etapa: "perdido", motivoPerdida: "No responde", creado: iso(-12) }),
  "leads/lead-i": lead({ nombre: "Irene Lagos", empresa: "Clínica Lagos", telefono: "+56913131313", etapa: "propuesta", valor: 4500000 }),
  "leads/lead-j": lead({ nombre: "Javiera Soto", empresa: "Óptica Central", telefono: "+56914141414", etapa: "negociacion", valor: 8000000 }),
  "leads/lead-k": lead({ nombre: "Karen Mella", empresa: "Bodega Mella", telefono: "+56915151515", etapa: "ganado", valor: 3000000, creado: iso(-20) }),
  /* Para la selección múltiple. */
  "leads/lead-l": lead({ nombre: "Luis Mora", empresa: "Molinos Sur", telefono: "+56916161616", etapa: "contactado" }),
  "tareas/tar-l1": tarea({ leadId: "lead-l", tipo: "whatsapp", titulo: "Mandarle el resumen", fecha: addDays(T, 2) }),
  "leads/lead-m": lead({ nombre: "Marta Gil", empresa: "Textil Norte", telefono: "+56917171717", etapa: "contactado" }),
  "actividades/a1": act({ leadId: "lead-h", tipo: "etapa", de: "nuevo", a: "contactado", fecha: iso(-11) }),
  "actividades/a2": act({ leadId: "lead-h", tipo: "etapa", de: "contactado", a: "perdido", resumen: "No responde", fecha: iso(-4) }),
  "actividades/a3": act({ leadId: "lead-k", tipo: "etapa", de: "contactado", a: "propuesta", fecha: iso(-15) }),
  "actividades/a4": act({ leadId: "lead-k", tipo: "etapa", de: "propuesta", a: "ganado", fecha: iso(-2) }),
  "actividades/a5": act({ leadId: "lead-f", tipo: "etapa", de: "contactado", a: "reunion_agendada", fecha: iso(-5) }),
  "actividades/a6": act({ leadId: "lead-b", tipo: "llamada", resultado: "no_contesto", fecha: iso(-1) }),
  "actividades/a7": act({ leadId: "lead-f", tipo: "llamada", resultado: "contesto", fecha: iso(-5), analisis: { resumen: "Interesada.", evaluacion: evaluacion(70, [4, 3, 4, 4, 2, 4]) } }),
  "actividades/a8": act({ leadId: "lead-k", tipo: "llamada", resultado: "contesto", autor: NICO, fecha: iso(-16), analisis: { resumen: "Pidió la propuesta.", evaluacion: evaluacion(80, [4, 4, 4, 4, 3, 5]) } }),
  "actividades/a9": act({ leadId: "lead-i", tipo: "whatsapp", fecha: iso(-6), resumen: "Le mandé la propuesta." }),
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  async function open(opts) {
    const context = await browser.newContext({ viewport: opts.viewport || { width: 1360, height: 900 }, colorScheme: opts.dark ? "dark" : "light" });
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
    await page.addInitScript((o) => { window.__MOCK_SEED = o.seed; window.__MOCK_MCP = o.mcp; }, { seed: opts.seed, mcp: opts.mcp || null });
    await page.goto("file://" + PREVIEW);
    await page.getByRole("heading", { name: "Hoy", exact: true }).waitFor({ timeout: 15000 });
    return page;
  }
  const shot = (page, name) => page.screenshot({ path: path.join(OUT, name), fullPage: false });
  const toast = (page, text) => page.locator(".toast", { hasText: text }).first().waitFor({ timeout: 8000 }).then(() => true, () => false);
  const visto = (loc, ms) => loc.first().waitFor({ timeout: ms || 5000 }).then(() => true, () => false);
  const store = (page) => page.evaluate(() => Object.fromEntries(window.__mockStore));
  const docs = (dump, col) => Object.entries(dump).filter(([k]) => k.startsWith(col + "/")).map(([k, v]) => ({ id: k.split("/")[1], ...v }));
  const esperar = (page, fn, arg, ms) => page.waitForFunction(fn, arg, { timeout: ms || 8000 }).then(() => true, () => false);
  const cerrarFicha = async (page) => { await page.keyboard.press("Escape"); await page.locator(".drawer").waitFor({ state: "detached" }); };
  const abrirLead = async (page, empresa) => {
    await irA(page, "embudo");
    await page.locator(".kcard.lead", { hasText: empresa }).locator(".kcard-titulo").click();
    await page.locator("#lead-title", { hasText: empresa }).waitFor();
  };
  const actual = (page) => page.locator(".llamar-card .fl-head h2").innerText();

  const page = await open({ name: "mejoras", seed: SEED, mcp: { modo: "ok", eventos: EVENTOS } });

  /* ---------------- buscador ---------------- */
  await page.keyboard.press("Control+k");
  await page.locator(".cmdk").waitFor();
  ok(await esperar(page, () => document.activeElement && document.activeElement.id === "buscar-global"), "Ctrl+K abre el buscador con el cursor listo para escribir");
  ok(await visto(page.locator(".cmdk-group", { hasText: "Con algo para hoy" }).locator(".cmdk-item", { hasText: "Viña Norte" })), "sin texto, muestra las acciones y los leads con algo para hoy");
  await page.keyboard.type("ferret andes");
  ok(await visto(page.locator(".cmdk-item.on", { hasText: "Ferretería Andes" })), "busca por palabras sueltas, sin tildes, y deja elegido el primero");
  await page.keyboard.press("Enter");
  ok(await visto(page.locator("#lead-title", { hasText: "Ferretería Andes" })), "Enter abre la ficha");
  await cerrarFicha(page);
  await page.keyboard.press("/");
  await page.locator(".cmdk").waitFor();
  await page.keyboard.type("4444");
  ok(await visto(page.locator(".cmdk-item", { hasText: "Viña Norte" })), "«/» también lo abre, y encuentra por los dígitos del teléfono");
  await page.fill("#buscar-global", "metricas");
  ok(await visto(page.locator(".cmdk-item", { hasText: "Ir a Métricas" })), "busca también entre las acciones y las secciones");
  await page.keyboard.press("Escape");
  ok(await page.locator(".cmdk").waitFor({ state: "detached", timeout: 2000 }).then(() => true, () => false), "Escape lo cierra");
  await page.locator(".nav-buscar").click();
  await page.fill("#buscar-global", "nuevo lead");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  ok(await visto(page.locator(".modal", { hasText: "Nuevo lead" })), "las flechas eligen y una acción se ejecuta con Enter (Nuevo lead)");
  await page.keyboard.press("Escape");
  await shot(page, "m01-hoy.png");

  /* ---------------- llamar en serie ---------------- */
  ok((await page.locator(".side .nav button", { hasText: /^Llamar/ }).locator(".count").innerText()) === "4", "el menú muestra cuántas llamadas hay para hoy");
  ok(await visto(page.locator(".lo-que-toca .panel-head button", { hasText: "Llamar en serie · 4" })), "y Hoy tiene el acceso a «Llamar en serie»");
  await irA(page, "llamar");
  await page.locator("h1", { hasText: "Llamar en serie" }).waitFor();
  ok((await actual(page)) === "Viña Norte", "parte por la llamada atrasada");
  ok(await visto(page.locator(".fl-num", { hasText: "+56 9 3333 4444" })), "con el teléfono grande para marcar");
  ok((await page.locator(".cola-item").allInnerTexts()).map((x) => x.split("\n")[0]).join("|") === "Ferretería Andes|Taller Norte|Imprenta Sur", "después las de hoy por hora y los nuevos sin tarea, prioridad alta primero");
  ok(await visto(page.locator(".toolbar", { hasText: "1 por llamar no tiene teléfono" })), "y avisa de los que no tienen teléfono");
  await page.getByRole("button", { name: "Saltar" }).click();
  ok((await actual(page)) === "Ferretería Andes", "«Saltar» pasa a la siguiente");
  ok(await visto(page.locator(".fl-pitch", { hasText: "Cotizan a mano por WhatsApp." })) && await visto(page.locator(".fl-guion", { hasText: "te llamo de ZH" })), "muestra el dolor, cómo ayudamos y el guion");
  await shot(page, "m02-llamar.png");
  await page.getByRole("button", { name: "No contestó" }).click();
  await page.locator(".modal", { hasText: "No contestó: Andrea Fuentes" }).waitFor();
  await page.locator(".modal .btn.primary", { hasText: "Guardar" }).click();
  ok(await esperar(page, () => document.querySelector(".llamar-card .fl-head h2") && document.querySelector(".llamar-card .fl-head h2").textContent === "Taller Norte"), "«No contestó» deja el intento y pasa sola a la siguiente");
  let dump = await store(page);
  ok(dump["tareas/tar-a1"].estado === "hecha" && docs(dump, "tareas").some((x) => x.leadId === "lead-a" && x.estado === "pendiente" && x.fecha > T), "la llamada de hoy queda hecha y queda otra para después");
  await page.locator(".cola-item", { hasText: "Imprenta Sur" }).click();
  ok((await actual(page)) === "Imprenta Sur", "se puede elegir otra de la lista");
  await page.getByRole("button", { name: "Contestó: registrar" }).click();
  await page.fill("#c-notas", "Le interesa. Quiere ver una demo la próxima semana; te escribo para agendar.");
  await page.locator(".llamar-reg").getByRole("button", { name: "Armar el plan con Claude" }).click();
  await page.locator(".llamar-reg .plan").waitFor();
  await page.locator(".llamar-reg").getByRole("button", { name: "Confirmar y guardar" }).click();
  ok(await visto(page.locator(".llamar-listo .done-card", { hasText: "Llamada guardada" }), 8000), "al guardar la llamada, queda el resumen arriba");
  ok(await esperar(page, () => { const h = document.querySelector(".llamar-card .fl-head h2"); return h && h.textContent === "Taller Norte"; }), "y pasa a la siguiente");
  dump = await store(page);
  ok(docs(dump, "actividades").some((a) => a.leadId === "lead-c" && a.tipo === "llamada" && a.resultado === "contesto") && dump["leads/lead-c"].etapa === "contactado", "la llamada queda registrada y el lead pasa a «Contactado»");
  await page.locator(".toolbar .seg button", { hasText: "Lorenzo" }).click();
  ok(await visto(page.locator(".llamar-fin", { hasText: "Solo quedan las que saltaste" })), "con el filtro de Lorenzo, solo queda la que saltó (Taller Norte es de Nicolás)");
  await page.getByRole("button", { name: "Volver a las saltadas" }).click();
  ok((await actual(page)) === "Viña Norte", "«Volver a las saltadas» las trae de vuelta");
  await page.locator(".toolbar .seg button", { hasText: "Todo el equipo" }).click();

  /* ---------------- agendar: horarios libres, choque y recordatorio ---------------- */
  await abrirLead(page, "Panadería Rivas");
  await page.locator(".tareas-box .sec-head button", { hasText: "Agendar reunión" }).click();
  await page.locator("#agendar-title").waitFor();
  await page.fill("#ag-fecha", D);
  const libres = await page.locator(".libres .btn").allInnerTexts();
  ok(libres[0] === "09:00" && libres.includes("11:00") && !libres.includes("10:00") && !libres.includes("10:30") && !libres.includes("15:00"), `los horarios libres salen del calendario (sin 10:00, 10:30 ni 15:00): ${libres.slice(0, 6).join(" ")}`);
  await page.fill("#ag-hora", "10:15");
  ok(await visto(page.locator(".modal .note.warn", { hasText: "ya está «Reunión con otro cliente» (10:00–11:00)" })), "avisa si la hora choca con algo del calendario");
  await page.locator(".libres .btn", { hasText: "11:00" }).click();
  ok((await page.inputValue("#ag-hora")) === "11:00" && (await page.locator(".modal .note.warn").count()) === 0, "un horario libre se elige con un clic y el aviso desaparece");
  await shot(page, "m03-agendar-libres.png");
  await page.locator(".modal .seg button", { hasText: "No" }).first().click();
  await page.locator(".modal .btn.primary", { hasText: "Agendar reunión" }).click();
  ok(await toast(page, "Panadería Rivas: reunión"), "se agenda");
  ok(await esperar(page, () => [...window.__mockStore.keys()].some((k) => k.startsWith("tareas/tar-rec-"))), "queda el recordatorio");
  dump = await store(page);
  const rg = docs(dump, "tareas").find((x) => x.leadId === "lead-g" && x.tipo === "reunion");
  const rec = dump["tareas/tar-rec-" + rg.id];
  const evG = (await page.evaluate(() => window.__MOCK_MCP.eventos)).find((e) => e.summary.includes("Panadería Rivas"));
  ok(rec && rec.fecha === antesHabil(D) && rec.reunionId === rg.id && rec.tipo === "whatsapp", "el recordatorio queda el día hábil anterior, unido a la reunión");
  ok(rec && /^Recordarle la reunión del \S+ \d+ \S+ a las 11:00$/.test(rec.titulo), `y dice para qué reunión es («${rec && rec.titulo}»)`);
  ok(rec && rec.mensaje.includes("Hola Gabriela") && rec.mensaje.includes("a las 11:00") && evG && rec.mensaje.includes(evG.conferenceUrl), "con el mensaje listo, la hora y el enlace de Meet");
  const filaRec = page.locator(".tareas-box > .tasks > .task", { hasText: "Recordarle la reunión" });
  ok(await visto(filaRec.locator(".task-nota.msg", { hasText: "Hola Gabriela" })), "la tarea muestra el mensaje");
  const href = await filaRec.locator("a", { hasText: "Enviar por WhatsApp" }).getAttribute("href");
  ok(href && href.startsWith("https://wa.me/56988889999?text=") && decodeURIComponent(href).includes("Hola Gabriela"), "«Enviar por WhatsApp» abre el chat con el mensaje escrito");
  ok(await visto(filaRec.getByRole("button", { name: "Copiar el mensaje" })), "y se puede copiar");
  await page.locator(".tareas-box .sec-head button", { hasText: "Agendar reunión" }).click();
  await page.locator("#agendar-title", { hasText: "Cambiar la reunión" }).waitFor();
  const D2 = habil(D, 1);
  await page.fill("#ag-fecha", D2);
  await page.fill("#ag-hora", "12:00");
  await page.locator(".modal .btn.primary", { hasText: "Guardar cambios" }).click();
  ok(await esperar(page, (o) => { const r = window.__mockStore.get("tareas/tar-rec-" + o.id); return r && r.fecha === o.f && r.mensaje.includes("a las 12:00"); }, { id: rg.id, f: antesHabil(D2) }), "si la reunión se mueve, el recordatorio se mueve con ella");
  ok(await toast(page, "También se movió en Google Calendar"), "y el evento también");
  await page.locator(".modal").waitFor({ state: "detached" });
  await cerrarFicha(page);

  /* ---------------- preparar con Claude ---------------- */
  await abrirLead(page, "Café Central");
  const filaF = page.locator(".tareas-box > .tasks > .task", { hasText: "Reunión de descubrimiento" });
  await filaF.getByRole("button", { name: "Preparar" }).click();
  ok(await toast(page, "Preparación lista"), "«Preparar» pide la preparación a Claude");
  dump = await store(page);
  ok((dump["tareas/tar-f1"].preparacion || "").startsWith("Objetivo: Entender cómo cotizan hoy") && dump["tareas/tar-f1"].preparacion.includes("Preguntas\n- ¿Cómo llega hoy un pedido de cotización?"), "y queda guardada en la tarea de la reunión");
  ok(await page.evaluate(() => window.__mockPrompts.some((p) => p.includes("Prepara a un socio") && p.includes("Café Central") && p.includes("no propongas precios"))), "Claude recibe los datos del lead y la regla de no dar precios");
  await filaF.locator("details.prep summary").click();
  ok(await visto(filaF.locator("details.prep p", { hasText: "Cierre: Proponer enviar la propuesta" })), "se lee desde la tarea");
  ok((await filaF.getByRole("button", { name: "Preparar", exact: true }).count()) === 0 && await visto(filaF.getByRole("button", { name: "Volver a prepararla" })), "y el botón se reemplaza por «Volver a prepararla»");
  await shot(page, "m04-preparacion.png");
  await cerrarFicha(page);

  /* ---------------- métricas ---------------- */
  await irA(page, "metricas");
  await page.locator("h1", { hasText: "Métricas" }).waitFor();
  await page.locator(".mtabla").first().waitFor();
  const kpi = async (t) => page.locator(".kpi", { hasText: t }).first().locator("b").innerText();
  ok((await kpi("Ganados")) === "1" && (await page.locator(".kpi", { hasText: "Ganados" }).innerText()).includes("$3.000.000"), "los ganados del período, con su valor");
  ok((await page.locator(".kpi", { hasText: "Pronóstico ponderado" }).locator("b").innerText()).startsWith("$"), "el pronóstico ponderado por etapa");
  const fila = (t) => page.locator(".hbar", { hasText: t }).first().locator(".hbar-v").innerText();
  ok((await fila("Propuesta enviada")).includes("$4.500.000") && (await fila("Negociación")).includes("$8.000.000"), "el embudo de hoy muestra cantidad y valor por etapa");
  const mot = page.locator(".panel[aria-label='Motivos de pérdida'] .hbar", { hasText: "No responde" }).locator(".hbar-v");
  ok((await mot.innerText()) === "1", "los perdidos del período por motivo");
  const filaLlamadas = page.locator(".panel[aria-label='Actividad'] tr", { hasText: "Llamadas" });
  const llam = (await filaLlamadas.locator("td").allInnerTexts()).map((x) => x.trim()).slice(0, 2).join(",");
  ok(llam === "4,1", `la actividad por socio: llamadas de Lorenzo (2 de antes y 2 de esta prueba) y de Nicolás (${llam})`);
  const cont = (await page.locator(".panel[aria-label='Actividad'] tr", { hasText: "Contestaron" }).locator("td").allInnerTexts()).map((x) => x.trim()).slice(0, 2).join(",");
  ok(cont === "2,1", `y cuántas contestaron (${cont})`);
  ok(await visto(page.locator(".panel[aria-label='Calidad de las llamadas']", { hasText: "Donde más hay que mejorar: objeciones" })), "y dónde mejorar según la nota de Claude");
  await shot(page, "m05-metricas.png");
  await page.locator(".page-head .seg button", { hasText: "7 días" }).click();
  ok(await esperar(page, () => { const b = [...document.querySelectorAll(".kpi")].find((k) => k.textContent.includes("Ganados")); return b && b.textContent.includes("7 días"); }), "el período se cambia arriba");

  /* ---------------- selección múltiple en Leads ---------------- */
  await irA(page, "leads");
  await page.locator("h1", { hasText: "Leads" }).waitFor();
  const filaL = (t) => page.locator("table.leads tbody tr", { hasText: t });
  await filaL("Molinos Sur").locator("td.sel input").check();
  await filaL("Textil Norte").locator("td.sel input").check();
  ok(await visto(page.locator(".masivo", { hasText: "2 seleccionados" })), "al marcar leads aparece la barra de acciones");
  await page.locator(".masivo select[aria-label='Asignar a']").selectOption("nicolas");
  ok(await toast(page, "2 leads para Nicolás"), "asigna varios a la vez");
  dump = await store(page);
  ok(dump["leads/lead-l"].responsable === "nicolas" && dump["leads/lead-m"].responsable === "nicolas", "los dos quedan para Nicolás");
  await filaL("Molinos Sur").locator("td.sel input").check();
  await filaL("Textil Norte").locator("td.sel input").check();
  await page.locator(".masivo").getByRole("button", { name: "Tarea" }).click();
  await page.locator(".masivo select[aria-label='Tipo de tarea']").selectOption("whatsapp");
  await page.locator(".masivo input[type=date]").fill(addDays(T, 3));
  await page.locator(".masivo").getByRole("button", { name: "Agregar" }).click();
  ok(await toast(page, "Tarea agregada a 2 leads"), "agrega una tarea a varios");
  dump = await store(page);
  ok(docs(dump, "tareas").filter((x) => ["lead-l", "lead-m"].includes(x.leadId) && x.tipo === "whatsapp" && x.fecha === addDays(T, 3)).length === 2, "una para cada uno, con el día elegido");
  await filaL("Molinos Sur").locator("td.sel input").check();
  await filaL("Textil Norte").locator("td.sel input").check();
  await page.locator(".masivo select[aria-label='Mover a']").selectOption("perdido");
  await page.locator(".masivo select[aria-label='Motivo de pérdida']").selectOption("Mal timing");
  await page.locator(".masivo").getByRole("button", { name: "Mover", exact: true }).click();
  ok(await toast(page, "2 leads en Perdido · Mal timing"), "mueve varios a Perdido con su motivo");
  dump = await store(page);
  ok(dump["leads/lead-l"].etapa === "perdido" && dump["leads/lead-l"].motivoPerdida === "Mal timing" && dump["tareas/tar-l1"].estado === "descartada", "con el motivo y sus tareas descartadas");
  ok(docs(dump, "actividades").filter((a) => ["lead-l", "lead-m"].includes(a.leadId) && a.tipo === "etapa" && a.a === "perdido").length === 2, "y el cambio de etapa en el historial de cada uno");
  await page.locator("#f-etapa").selectOption("todos");
  await page.locator("table.leads th.sel input").check();
  ok(await visto(page.locator(".masivo", { hasText: `${await page.locator("table.leads tbody tr").count()} seleccionados` })), "«Seleccionar todos» marca los de la lista");
  await page.locator(".masivo").getByRole("button", { name: "Quitar selección" }).click();
  ok((await page.locator(".masivo").count()) === 0, "y «Quitar selección» los desmarca");

  /* ---------------- recordatorios apagados ---------------- */
  await irA(page, "ajustes");
  await page.locator(".panel", { hasText: "Google Calendar" }).locator(".switch", { hasText: "Recordatorio por WhatsApp" }).locator("input").uncheck();
  ok(await toast(page, "Recordatorios desactivados"), "el recordatorio se apaga en Ajustes");
  await abrirLead(page, "Viña Norte");
  await page.locator(".tareas-box .sec-head button", { hasText: "Agendar reunión" }).click();
  await page.locator("#agendar-title").waitFor();
  await page.fill("#ag-fecha", habil(T, 4));
  await page.fill("#ag-hora", "16:00");
  await page.locator(".modal .seg button", { hasText: "No" }).first().click();
  await page.locator(".modal .btn.primary", { hasText: "Agendar reunión" }).click();
  await toast(page, "Viña Norte: reunión");
  await page.waitForTimeout(800);
  dump = await store(page);
  const rb = docs(dump, "tareas").find((x) => x.leadId === "lead-b" && x.tipo === "reunion");
  ok(rb && !dump["tareas/tar-rec-" + rb.id], "y con eso las reuniones nuevas no lo crean");
  await cerrarFicha(page);

  /* ---------------- teléfono y oscuro ---------------- */
  const tel = await open({ name: "telefono", seed: SEED, mcp: { modo: "ok", eventos: EVENTOS }, viewport: { width: 390, height: 844 } });
  ok(await visto(tel.locator(".tabs button", { hasText: "Llamar" })), "en el teléfono, «Llamar» está en la barra de abajo");
  await tel.locator(".tabs button", { hasText: "Llamar" }).click();
  await tel.locator(".llamar-card").waitFor();
  const sw = await tel.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= 390, `teléfono, Llamar en serie: sin scroll horizontal (${sw} <= 390)`);
  await shot(tel, "m06-telefono-llamar.png");
  await tel.locator(".topbar button[aria-label='Buscar']").click();
  ok(await visto(tel.locator(".cmdk")), "el buscador se abre desde la barra de arriba");
  await tel.keyboard.press("Escape");
  await irA(tel, "metricas");
  await tel.locator(".mtabla").first().waitFor();
  const sw2 = await tel.evaluate(() => document.documentElement.scrollWidth);
  ok(sw2 <= 390, `teléfono, Métricas: sin scroll horizontal (${sw2} <= 390)`);
  await shot(tel, "m07-telefono-metricas.png");
  const dark = await open({ name: "oscuro", seed: SEED, mcp: { modo: "ok", eventos: EVENTOS }, dark: true });
  await irA(dark, "metricas");
  await dark.locator(".mtabla").first().waitFor();
  await shot(dark, "m08-oscuro-metricas.png");
  await irA(dark, "llamar");
  await dark.locator(".llamar-card").waitFor();
  await shot(dark, "m09-oscuro-llamar.png");

  await browser.close();
  for (const n of notes) console.log(n);
  if (errors.length) { console.error("\n" + errors.join("\n")); process.exit(1); }
  console.log("\nTodo bien. Capturas en " + OUT);
})().catch((e) => { for (const n of notes) console.log(n); if (errors.length) console.error(errors.join("\n")); console.error(e); process.exit(1); });
