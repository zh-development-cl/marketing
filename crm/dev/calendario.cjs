/* Prueba de la conexión con Google Calendar (capacidad «mcp») con Playwright y el conector simulado
   de mock-claude.js. Recorre: un evento con un lead queda como su tarea y el lead pasa a «Reunión
   agendada» (y la tarea de agendar queda hecha); un evento del mismo día se une a la reunión que ya
   estaba; una reserva de zhdevelopment.cl crea su lead; un evento que se mueve en el calendario
   mueve la tarea; la respuesta a la invitación; «Crear lead» desde el panel Calendario de Hoy; agendar
   desde el CRM crea el evento con Meet e invita al lead y al equipo; cambiar la reunión mueve el
   evento (o avisa si lo organizó otra cuenta); «Crear en Calendar»; una falla sin respuesta clara no
   se repite; los estados sin permiso y sin conector; Ajustes; modo oscuro y teléfono. Usa datos
   inventados.

   Uso:
     python3 crm/dev/build_preview.py
     NODE_PATH=$(npm root -g) VENDOR_DIR=<carpeta con preact.umd.min.js, hooks.umd.min.js, htm.umd.min.js> \
       node crm/dev/calendario.cjs [carpeta-de-capturas]
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
const errors = [];
const notes = [];
const ok = (cond, msg) => { if (!cond) errors.push("falló: " + msg); else notes.push("ok: " + msg); };
const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const T = keyFmt.format(new Date());
const addDays = (k, n) => { const d = new Date(k + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const iso = (n) => new Date(Date.now() + n * 864e5).toISOString();
const fmtCL = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
/* Una hora de Chile con su desfase, como la entrega Google («2026-10-19T11:00:00-03:00»). */
const chile = (k, hm) => {
  const local = `${k}T${hm}:00`;
  for (const off of ["-03:00", "-04:00"]) {
    const p = Object.fromEntries(fmtCL.formatToParts(new Date(local + off)).map((x) => [x.type, x.value]));
    if (`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}` === local.slice(0, 16)) return local + off;
  }
  return local + "-03:00";
};
const ANTES = iso(-1);
const evento = (o) => ({
  status: "confirmed", eventType: "DEFAULT", organizer: { email: CUENTA, self: true }, creator: { email: CUENTA, self: true },
  htmlLink: "https://www.google.com/calendar/event?eid=" + o.id, created: ANTES, updated: ANTES,
  start: { dateTime: chile(o.fecha, o.hora), timeZone: TZ }, end: { dateTime: chile(o.fecha, o.fin), timeZone: TZ },
  ...o,
});
const yo = { email: CUENTA, self: true, responseStatus: "accepted" };
const lead = (o) => ({ cargo: "", correo: "", telefono: "", origen: "prospeccion", trato: "tu", intentos: 0, proxima: null, prioridad: "media", necesidad: "", responsable: "lorenzo", creado: iso(-5), actualizado: iso(-1), creadoPor: ME, ...o });
const tarea = (o) => ({ estado: "pendiente", hora: "", responsable: "lorenzo", origen: "manual", creado: iso(-2), actualizado: iso(-2), creadoPor: ME, ...o });

const MEET_H = "https://meet.google.com/hil-mora-hoy";
const MEET_O = "https://meet.google.com/oma-fuen-tes";
const EVENTOS = [
  /* Un lead con correo y una tarea de agendar: el evento lo deja en «Reunión agendada». */
  evento({ id: "evvaleria01", summary: "Diagnóstico · Viñedos Sur y ZH Development", fecha: addDays(T, 3), hora: "15:00", fin: "15:30", conferenceUrl: "https://meet.google.com/val-eria-sur",
    attendees: [yo, { email: "valeria@vinedossur.cl", displayName: "Valeria Soto", responseStatus: "needsAction" }, { email: "nicolas.socio@gmail.com", responseStatus: "needsAction" }] }),
  /* Un lead con una reunión ese mismo día: se une a esa tarea (y toma la hora del evento). */
  evento({ id: "evmartin01", summary: "Reunión · Molinos Ruiz y ZH Development", fecha: addDays(T, 2), hora: "10:30", fin: "11:00",
    attendees: [yo, { email: "martin@molinosruiz.cl", responseStatus: "accepted" }] }),
  /* Una reserva de zhdevelopment.cl (formato de api/agenda.js): crea su lead. */
  evento({ id: "evweb01", summary: "Llamada de descubrimiento · Rosa Pinto (Panadería Pinto) · ZH Development", fecha: addDays(T, 1), hora: "09:30", fin: "10:00", conferenceUrl: "https://meet.google.com/ros-apin-too",
    description: "Agendada desde zhdevelopment.cl\n\nNombre:   Rosa Pinto\nEmpresa:  Panadería Pinto\nCorreo:   rosa@panaderiapinto.cl\nTeléfono: +56 9 8888 7777\n\nMensaje:\nQueremos ordenar los pedidos del local.",
    attendees: [{ email: "rosa@panaderiapinto.cl", displayName: "Rosa Pinto", responseStatus: "needsAction" }, { email: "nicolas.socio@gmail.com", responseStatus: "needsAction" }, yo] }),
  /* Alguien de afuera que no es lead: «Crear lead» en el panel. */
  evento({ id: "evcontador01", summary: "Revisión de impuestos", fecha: addDays(T, 1), hora: "12:00", fin: "12:45",
    attendees: [yo, { email: "contador@estudiocontable.cl", displayName: "Carla Contreras", responseStatus: "accepted" }] }),
  /* Solo el equipo: nada que hacer. */
  evento({ id: "evinterno01", summary: "Planificación semanal", fecha: addDays(T, 1), hora: "08:00", fin: "08:30",
    attendees: [yo, { email: "socio@zhdevelopment.cl", responseStatus: "accepted" }, { email: "nicolas.socio@gmail.com", responseStatus: "accepted" }] }),
  /* Un lead perdido: una reunión que ya pasó no crea nada; una nueva lo revive. */
  evento({ id: "evpaula01", summary: "Reunión · Pinturas Díaz", fecha: addDays(T, -1), hora: "15:00", fin: "15:30", attendees: [yo, { email: "paula@pinturasdiaz.cl", responseStatus: "accepted" }] }),
  evento({ id: "evpaula02", summary: "Segunda reunión · Pinturas Díaz", fecha: addDays(T, 5), hora: "11:00", fin: "11:30", attendees: [yo, { email: "paula@pinturasdiaz.cl", responseStatus: "needsAction" }] }),
  /* Una reunión de hoy, ya unida: el botón de Meet. */
  evento({ id: "evhilda01", summary: "Reunión · Hostal Mora y ZH Development", fecha: T, hora: "23:30", fin: "23:59", conferenceUrl: MEET_H, attendees: [yo, { email: "hilda@hostalmora.cl", responseStatus: "accepted" }] }),
  /* Una reunión que organizó otra cuenta: el CRM no la mueve, avisa. */
  evento({ id: "evomar01", summary: "Reunión · Ópticas Fuentes y ZH Development", fecha: addDays(T, 1), hora: "16:00", fin: "16:30", conferenceUrl: MEET_O, organizer: { email: "socio@zhdevelopment.cl" }, creator: { email: "socio@zhdevelopment.cl" },
    attendees: [{ email: "socio@zhdevelopment.cl", organizer: true, responseStatus: "accepted" }, { email: CUENTA, self: true, responseStatus: "needsAction" }, { email: "omar@opticasfuentes.cl", responseStatus: "accepted" }] }),
];
const evDe = (id) => EVENTOS.find((e) => e.id === id);
const unido = (id, respuesta, propio, organizador, meet) => ({ id, link: "https://www.google.com/calendar/event?eid=" + id, meet, respuesta, actualizado: ANTES, propio, organizador });

const SEED = {
  ["equipo/" + ME]: { nombre: "Lorenzo Bozzo", cargo: "Socio", telefono: "+56955551234", correo: "socio@zhdevelopment.cl" },
  "config/general": { agendaUrl: "https://zhdevelopment.cl/#agendar", gmailCuenta: CUENTA, correosEquipo: ["socio@zhdevelopment.cl", "nicolas.socio@gmail.com"] },
  "leads/lead-v": lead({ nombre: "Valeria Soto", empresa: "Viñedos Sur", correo: "valeria@vinedossur.cl", telefono: "+56921212121", etapa: "contactado" }),
  "tareas/tar-v-ag": tarea({ leadId: "lead-v", tipo: "agendar", titulo: "Agendar el diagnóstico", fecha: T }),
  "leads/lead-m": lead({ nombre: "Martín Ruiz", empresa: "Molinos Ruiz", correo: "martin@molinosruiz.cl", etapa: "reunion_agendada" }),
  "tareas/tar-m": tarea({ leadId: "lead-m", tipo: "reunion", titulo: "Reunión de descubrimiento", fecha: addDays(T, 2), hora: "10:00", duracion: 30 }),
  "leads/lead-p": lead({ nombre: "Paula Díaz", empresa: "Pinturas Díaz", correo: "paula@pinturasdiaz.cl", etapa: "perdido", motivoPerdida: "No responde" }),
  "leads/lead-n": lead({ nombre: "Nora Vega", empresa: "Notaría Vega", correo: "nora@notariavega.cl", telefono: "+56923232323", etapa: "contactado" }),
  "leads/lead-s": lead({ nombre: "Sergio Lagos", empresa: "Lagos Transportes", telefono: "+56924242424", etapa: "reunion_agendada" }),
  "tareas/tar-s": tarea({ leadId: "lead-s", tipo: "reunion", titulo: "Reunión por Meet", fecha: addDays(T, 6), hora: "09:00", duracion: 30 }),
  "leads/lead-z": lead({ nombre: "Zoe Ibáñez", empresa: "Zapatería Ibáñez", correo: "zoe@zapateriaibanez.cl", telefono: "+56925252525", etapa: "contactado" }),
  "leads/lead-h": lead({ nombre: "Hilda Mora", empresa: "Hostal Mora", correo: "hilda@hostalmora.cl", etapa: "reunion_agendada" }),
  "tareas/tar-h": tarea({ leadId: "lead-h", tipo: "reunion", titulo: "Reunión", fecha: T, hora: "23:30", duracion: 29, evento: unido("evhilda01", "accepted", true, CUENTA, MEET_H) }),
  "eventos/evhilda01": { leadId: "lead-h", tareaId: "tar-h", inicio: new Date(chile(T, "23:30")).toISOString(), evActualizado: ANTES, actualizado: ANTES },
  "leads/lead-o": lead({ nombre: "Omar Fuentes", empresa: "Ópticas Fuentes", correo: "omar@opticasfuentes.cl", etapa: "reunion_agendada" }),
  "tareas/tar-o": tarea({ leadId: "lead-o", tipo: "reunion", titulo: "Reunión", fecha: addDays(T, 1), hora: "16:00", duracion: 30, evento: unido("evomar01", "accepted", false, "socio@zhdevelopment.cl", MEET_O) }),
  "eventos/evomar01": { leadId: "lead-o", tareaId: "tar-o", inicio: new Date(chile(addDays(T, 1), "16:00")).toISOString(), evActualizado: ANTES, actualizado: ANTES },
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
  const llamadas = (page, tool) => page.evaluate((t) => window.__mcpCalls.filter((c) => c.tipo === "call" && c.tool === t), tool);
  const panelCal = (page) => page.locator(".panel", { has: page.locator("h2", { hasText: /^Calendario$/ }) });
  const cerrarFicha = async (page) => { await page.keyboard.press("Escape"); await page.locator(".drawer").waitFor({ state: "detached" }); };
  const abrirLead = async (page, empresa) => {
    await irA(page, "embudo");
    await page.locator(".kcard.lead", { hasText: empresa }).locator(".kcard-titulo").click();
    await page.locator("#lead-title", { hasText: empresa }).waitFor();
  };

  const page = await open({ name: "calendario", seed: SEED, mcp: { modo: "ok", eventos: EVENTOS } });

  /* ---------------- el calendario se lee y se une a los leads ---------------- */
  const w = await page.evaluate(() => window.__mcpCalls.find((c) => c.tipo === "watch"));
  ok(w && w.server === "Google Calendar" && w.tool === "list_events" && w.input.calendarId === "contacto@zhdevelopment.cl" && w.input.timeZone === "America/Santiago" && w.input.orderBy === "startTime" && w.input.pageSize === 250,
    "lee las reuniones de contacto@zhdevelopment.cl con list_events, en hora de Chile");
  ok(w && w.input.startTime === `${T}T00:00:00` && w.input.endTime === `${addDays(T, 60)}T00:00:00`, "de hoy a 60 días, sin desfase ni «Z»");
  ok(await esperar(page, () => window.__mockStore.has("tareas/tar-cal-evvaleria01") && window.__mockStore.has("leads/lead-web-evweb01") && window.__mockStore.get("tareas/tar-m").evento, null, 10000), "la sincronización corre sola al abrir");
  await page.waitForTimeout(2500);
  let dump = await store(page);
  const tv = dump["tareas/tar-cal-evvaleria01"] || {};
  ok(tv.leadId === "lead-v" && tv.tipo === "reunion" && tv.fecha === addDays(T, 3) && tv.hora === "15:00" && tv.duracion === 30 && tv.origen === "calendario" && tv.titulo === "Diagnóstico", "un evento con el correo de un lead queda como su reunión, con día, hora, duración y título");
  ok(tv.evento && tv.evento.id === "evvaleria01" && tv.evento.meet === "https://meet.google.com/val-eria-sur" && tv.evento.respuesta === "needsAction" && tv.evento.propio === true, "con el enlace de Meet, la respuesta del lead y que el evento es de la cuenta");
  ok(dump["leads/lead-v"].etapa === "reunion_agendada" && dump["tareas/tar-v-ag"].estado === "hecha", "el lead pasa a «Reunión agendada» y su tarea de agendar queda hecha");
  ok(docs(dump, "actividades").some((a) => a.leadId === "lead-v" && a.tipo === "etapa" && a.a === "reunion_agendada" && /Google Calendar/.test(a.resumen || "")), "con el cambio de etapa en el historial");
  ok(dump["eventos/evvaleria01"] && dump["eventos/evvaleria01"].leadId === "lead-v" && dump["eventos/evvaleria01"].tareaId === "tar-cal-evvaleria01", "eventos/ recuerda a qué lead y tarea quedó unido");
  ok(dump["tareas/tar-m"].hora === "10:30" && dump["tareas/tar-m"].evento && dump["tareas/tar-m"].evento.id === "evmartin01" && docs(dump, "tareas").filter((x) => x.leadId === "lead-m").length === 1, "un evento del mismo día se une a la reunión que ya estaba (y toma su hora), sin duplicarla");
  const lw = dump["leads/lead-web-evweb01"] || {};
  ok(lw.nombre === "Rosa Pinto" && lw.empresa === "Panadería Pinto" && lw.telefono === "+56988887777" && lw.correo === "rosa@panaderiapinto.cl" && lw.origen === "agenda" && lw.necesidad === "Queremos ordenar los pedidos del local.", "una reserva de zhdevelopment.cl crea su lead con nombre, empresa, teléfono, correo y mensaje");
  ok(lw.etapa === "reunion_agendada" && dump["tareas/tar-cal-evweb01"] && dump["tareas/tar-cal-evweb01"].origen === "agenda_web" && dump["tareas/tar-cal-evweb01"].titulo === "Llamada de descubrimiento", "en «Reunión agendada», con su tarea «Llamada de descubrimiento»");
  ok(!docs(dump, "leads").some((l) => /contador|Carla/.test(l.correo + l.nombre)) && !docs(dump, "leads").some((l) => l.correo === "nicolas.socio@gmail.com"), "alguien de afuera que no es lead, o del equipo, no crea un lead solo");
  ok(!dump["tareas/tar-cal-evpaula01"], "una reunión que ya pasó no crea nada");
  ok(dump["tareas/tar-cal-evpaula02"] && dump["leads/lead-p"].etapa === "reunion_agendada", "una reunión nueva de un lead perdido lo revive en «Reunión agendada»");
  ok(!dump["tareas/tar-cal-evhilda01"] && !dump["tareas/tar-cal-evomar01"] && !dump["tareas/tar-cal-evinterno01"], "lo que ya estaba unido, o es solo del equipo, no se toca");
  const escrituras = await page.evaluate(() => JSON.stringify([...window.__mockStore.entries()]));
  await page.waitForTimeout(3000);
  ok((await page.evaluate(() => JSON.stringify([...window.__mockStore.entries()]))) === escrituras, "y después no sigue escribiendo: la sincronización queda quieta");

  /* ---------------- Hoy: el panel Calendario y las tareas ---------------- */
  const pc = panelCal(page);
  ok(await visto(pc.locator(".cev-dia", { hasText: "Hoy" })) && await visto(pc.locator(".cev-dia", { hasText: "Mañana" })), "Hoy muestra el panel Calendario por día");
  ok(await visto(pc.locator(".cev", { hasText: "Hostal Mora" }).locator(`a[href="${MEET_H}"]`, { hasText: "Meet" })), "la reunión de hoy tiene el botón de Meet");
  ok(await visto(pc.locator(".cev", { hasText: "Panadería Pinto" }).locator(".cev-meta", { hasText: "Llamada de descubrimiento" })), "una reunión con lead muestra la empresa y el evento");
  const contador = pc.locator(".cev", { hasText: "Revisión de impuestos" });
  ok(await visto(contador.locator(".cev-meta", { hasText: "Carla Contreras" })) && await visto(contador.getByRole("button", { name: "Crear lead" })), "alguien de afuera que no es lead tiene «Crear lead»");
  const interno = pc.locator(".cev", { hasText: "Planificación semanal" });
  ok(await visto(interno.locator(".cev-meta", { hasText: "Solo el equipo" })) && (await interno.getByRole("button", { name: "Crear lead" }).count()) === 0, "una reunión del equipo no ofrece crear un lead");
  ok(await visto(pc.locator(".cal-pie", { hasText: "Actualizado" })), "y dice cuándo se leyó, con «Actualizar»");
  const tareaHoy = page.locator(".lo-que-toca .task", { hasText: "Hostal Mora" });
  ok(await visto(tareaHoy.locator(`a[href="${MEET_H}"]`, { hasText: "Unirse a Meet" })), "en Tareas, la reunión de hoy tiene «Unirse a Meet»");
  ok(await visto(tareaHoy.locator(".resp.ok", { hasText: "Confirmó la invitación" })), "y dice que el lead confirmó la invitación");
  await shot(page, "c01-hoy-calendario.png");

  /* ---------------- un evento que se mueve en el calendario ---------------- */
  await page.evaluate((o) => { const e = window.__MOCK_MCP.eventos.find((x) => x.id === "evvaleria01"); e.start = { dateTime: o.ini, timeZone: "America/Santiago" }; e.end = { dateTime: o.fin, timeZone: "America/Santiago" }; e.updated = new Date().toISOString(); window.__mcpRefrescar(); }, { ini: chile(addDays(T, 4), "16:00"), fin: chile(addDays(T, 4), "16:45") });
  ok(await esperar(page, (f) => { const t = window.__mockStore.get("tareas/tar-cal-evvaleria01"); return t && t.fecha === f && t.hora === "16:00"; }, addDays(T, 4)), "si el evento se mueve en Google Calendar, la tarea se mueve con él");
  ok(await toast(page, "Viñedos Sur: la reunión se movió en Google Calendar"), "con un aviso");
  dump = await store(page);
  ok(dump["tareas/tar-cal-evvaleria01"].duracion === 45 && docs(dump, "actividades").some((a) => a.leadId === "lead-v" && /se movió en Google Calendar/.test(a.resumen || "")), "con su nueva duración y una nota en el historial");

  /* ---------------- la respuesta a la invitación ---------------- */
  await page.evaluate(() => { const e = window.__MOCK_MCP.eventos.find((x) => x.id === "evmartin01"); e.attendees.find((a) => a.email === "martin@molinosruiz.cl").responseStatus = "declined"; e.updated = new Date().toISOString(); window.__mcpRefrescar(); });
  ok(await esperar(page, () => { const t = window.__mockStore.get("tareas/tar-m"); return t && t.evento && t.evento.respuesta === "declined"; }), "si el lead rechaza la invitación, la tarea lo sabe");
  ok(await toast(page, "Molinos Ruiz rechazó la invitación"), "con un aviso para buscar otro horario");
  dump = await store(page);
  ok(docs(dump, "actividades").some((a) => a.leadId === "lead-m" && /Rechazó la invitación/.test(a.resumen || "")) && dump["tareas/tar-m"].hora === "10:30", "y una nota en el historial, sin mover la reunión");

  /* ---------------- «Crear lead» desde el panel ---------------- */
  await contador.getByRole("button", { name: "Crear lead" }).click();
  await page.locator(".modal", { hasText: "Nuevo lead" }).waitFor();
  ok((await page.inputValue("#nl-nombre")) === "Carla Contreras" && (await page.inputValue("#nl-correo")) === "contador@estudiocontable.cl" && (await page.inputValue("#nl-fecha")) === "", "«Crear lead» abre el formulario con el nombre y el correo del invitado, sin primera tarea");
  ok(await visto(page.locator(".modal .note", { hasText: "se une sola a este lead" })), "y avisa que la reunión se une sola");
  await page.fill("#nl-empresa", "Estudio Contable Contreras");
  await page.locator(".modal .btn.primary", { hasText: "Agregar lead" }).click();
  await page.locator("#lead-title", { hasText: "Estudio Contable Contreras" }).waitFor();
  ok(await esperar(page, () => window.__mockStore.has("tareas/tar-cal-evcontador01")), "al guardarlo, la reunión queda como su tarea");
  await esperar(page, () => [...window.__mockStore.values()].some((v) => v.correo === "contador@estudiocontable.cl" && v.etapa === "reunion_agendada"));
  await page.waitForTimeout(800);
  dump = await store(page);
  const lc = docs(dump, "leads").find((l) => l.correo === "contador@estudiocontable.cl");
  ok(lc && lc.etapa === "reunion_agendada" && docs(dump, "tareas").filter((x) => x.leadId === lc.id).length === 1, "y el lead nuevo queda en «Reunión agendada» con esa sola tarea");
  ok(await visto(page.locator(".tareas-box .task", { hasText: "Revisión de impuestos" })), "la ficha muestra la reunión");
  await cerrarFicha(page);

  /* ---------------- agendar desde el CRM: el evento con Meet y la invitación ---------------- */
  await abrirLead(page, "Notaría Vega");
  await page.locator(".tareas-box .sec-head button", { hasText: "Agendar reunión" }).click();
  await page.locator("#agendar-title", { hasText: "Agendar reunión con Notaría Vega" }).waitFor();
  const sw = page.locator(".modal .cal-box .switch input");
  ok(await sw.isChecked(), "«Crear el evento en Google Calendar, con Meet» viene activado");
  const hint = await page.locator(".modal .cal-box .hint").innerText();
  ok(hint.includes("contacto@zhdevelopment.cl") && hint.includes("nora@notariavega.cl") && hint.includes("nicolas.socio@gmail.com") && hint.includes("socio@zhdevelopment.cl"), "dice en qué calendario queda y a quién invita: el lead y el equipo");
  ok((await page.locator(".modal .cal-box a", { hasText: "Agregar a Google Calendar" }).count()) === 0, "ya no hace falta el enlace para crearlo a mano");
  await page.fill("#ag-fecha", addDays(T, 5));
  await page.fill("#ag-hora", "10:00");
  await shot(page, "c02-agendar-calendario.png");
  await page.locator(".modal .btn.primary", { hasText: "Agendar reunión" }).click();
  ok(await toast(page, "Quedó en Google Calendar con Meet y Google le mandó la invitación a nora@notariavega.cl"), "al agendar, avisa que el evento quedó con Meet y la invitación");
  const ce = (await llamadas(page, "create_event"))[0] || {};
  const ci = ce.input || {};
  ok(ci.calendarId === "contacto@zhdevelopment.cl" && ci.summary === "Reunión de descubrimiento · Notaría Vega y ZH Development" && ci.startTime === `${addDays(T, 5)}T10:00:00` && ci.endTime === `${addDays(T, 5)}T10:30:00` && ci.timeZone === "America/Santiago" && ci.addGoogleMeetUrl === true,
    "create_event va con el calendario, el título, la hora local sin desfase, la zona de Chile y Meet");
  ok(Array.isArray(ci.attendees) && ci.attendees[0].email === "nora@notariavega.cl" && ci.attendees[0].displayName === "Nora Vega" && ci.attendees.some((a) => a.email === "nicolas.socio@gmail.com") && ci.attendees.some((a) => a.email === "socio@zhdevelopment.cl") && !ci.attendees.some((a) => a.email === CUENTA),
    "invita al lead con su nombre y al equipo, sin la cuenta del calendario");
  ok(!/Notas|nota/.test(ci.description || "") && (ci.description || "").includes("Google Meet"), "la descripción del evento no lleva notas internas");
  await page.waitForTimeout(1500);
  dump = await store(page);
  const tn = docs(dump, "tareas").find((x) => x.leadId === "lead-n" && x.tipo === "reunion") || {};
  const evN = (await page.evaluate(() => window.__MOCK_MCP.eventos)).find((e) => e.summary.includes("Notaría Vega")) || {};
  ok(tn.id === "tar-cal-" + evN.id && tn.evento && tn.evento.id === evN.id && tn.evento.meet === evN.conferenceUrl && tn.evento.propio === true, "la tarea guarda el evento, con su Meet");
  ok(dump["eventos/" + evN.id] && dump["eventos/" + evN.id].tareaId === tn.id && dump["leads/lead-n"].etapa === "reunion_agendada", "queda en eventos/ y el lead pasa a «Reunión agendada»");
  ok(await esperar(page, (m) => window.__mockPrompts.some((p) => p.includes("Confirma la reunión") && p.includes(m)), evN.conferenceUrl), "la confirmación que redacta Claude lleva el enlace de Meet");
  ok((await llamadas(page, "create_event")).length === 1, "y el evento se crea una sola vez (la sincronización no lo duplica)");

  /* ---------------- cambiar la reunión mueve el evento ---------------- */
  await page.locator(".tareas-box .sec-head button", { hasText: "Agendar reunión" }).click();
  await page.locator("#agendar-title", { hasText: "Cambiar la reunión con Notaría Vega" }).waitFor();
  ok(await visto(page.locator(".modal .cal-box", { hasText: "se mueve con la reunión" })), "al cambiarla, avisa que el evento se mueve y Google les avisa a los invitados");
  await page.fill("#ag-hora", "11:00");
  await page.locator(".modal .btn.primary", { hasText: "Guardar cambios" }).click();
  ok(await toast(page, "También se movió en Google Calendar"), "al guardar, el evento también se mueve");
  const ue = (await llamadas(page, "update_event"))[0] || {};
  ok(ue.input && ue.input.eventId === evN.id && ue.input.startTime === `${addDays(T, 5)}T11:00:00` && ue.input.endTime === `${addDays(T, 5)}T11:30:00` && ue.input.calendarId === CUENTA && !ue.input.summary, "update_event va con el evento, la hora nueva y sin cambiar el título");
  await page.waitForTimeout(2500);
  dump = await store(page);
  ok(dump["tareas/" + tn.id].hora === "11:00" && !docs(dump, "actividades").some((a) => a.leadId === "lead-n" && /se movió en Google Calendar/.test(a.resumen || "")), "la tarea queda a las 11:00 y la sincronización no lo toma como un cambio hecho en el calendario");
  await cerrarFicha(page);

  /* ---------------- un evento de otra cuenta: avisa en vez de moverlo ---------------- */
  await abrirLead(page, "Ópticas Fuentes");
  await page.locator(".tareas-box > .tasks > .task", { hasText: "Reunión" }).locator(".task-title button").click();
  await page.fill("#te-hora", "17:00");
  await page.locator(".task-form .btn.primary", { hasText: "Guardar" }).click();
  ok(await toast(page, "El evento lo organizó socio@zhdevelopment.cl: muévelo también en su Google Calendar"), "si el evento lo organizó otra cuenta, avisa que hay que moverlo allá");
  ok((await llamadas(page, "update_event")).length === 1, "y no intenta moverlo");
  await page.waitForTimeout(2000);
  dump = await store(page);
  ok(dump["tareas/tar-o"].hora === "17:00", "la tarea queda con la hora nueva (una lectura sin cambios del evento no la devuelve)");
  await cerrarFicha(page);

  /* ---------------- «Crear en Calendar» en una reunión sin evento ---------------- */
  await abrirLead(page, "Lagos Transportes");
  const fs1 = page.locator(".tareas-box > .tasks > .task", { hasText: "Reunión por Meet" });
  await fs1.getByRole("button", { name: "Crear en Calendar" }).click();
  ok(await toast(page, "la reunión quedó en Google Calendar con Meet"), "«Crear en Calendar» crea el evento de una reunión que no lo tenía");
  const ce2 = (await llamadas(page, "create_event"))[1] || {};
  ok(ce2.input && ce2.input.startTime === `${addDays(T, 6)}T09:00:00` && !ce2.input.attendees.some((a) => /lagos/i.test(a.email)), "con su día y hora; sin correo del lead, invita solo al equipo");
  ok(await esperar(page, () => { const t = window.__mockStore.get("tareas/tar-s"); return t && t.evento && t.evento.id; }), "y la tarea queda unida al evento");
  ok(await visto(fs1.locator("a[title='Abrir el evento en Google Calendar']")), "con el enlace para abrirlo en Google Calendar");
  await cerrarFicha(page);

  /* ---------------- una falla sin respuesta clara no se repite ---------------- */
  await page.evaluate(() => { window.__MOCK_MCP.fallaCrear = "server_unavailable"; });
  await abrirLead(page, "Zapatería Ibáñez");
  await page.locator(".tareas-box .sec-head button", { hasText: "Agendar reunión" }).click();
  await page.locator("#agendar-title").waitFor();
  await page.locator(".modal .seg button", { hasText: "No" }).first().click();
  await page.fill("#ag-fecha", addDays(T, 7));
  await page.fill("#ag-hora", "15:00");
  await page.locator(".modal .btn.primary", { hasText: "Agendar reunión" }).click();
  ok(await toast(page, "Google Calendar no confirmó el evento: puede que se haya creado igual"), "si Google Calendar no responde, avisa que el evento pudo crearse y que se revise antes de repetir");
  ok(await page.locator(".toast.bad").count() === 1, "como aviso de error");
  const intentos = (await llamadas(page, "create_event")).length;
  await page.waitForTimeout(1500);
  ok((await llamadas(page, "create_event")).length === intentos && intentos === 3, "y no lo vuelve a intentar solo");
  dump = await store(page);
  ok(docs(dump, "tareas").some((x) => x.leadId === "lead-z" && x.tipo === "reunion" && !x.evento) && dump["leads/lead-z"].etapa === "reunion_agendada", "la reunión queda igual en el CRM, sin evento");
  await page.evaluate(() => { window.__MOCK_MCP.fallaCrear = ""; });
  await cerrarFicha(page);

  /* ---------------- Ajustes ---------------- */
  await irA(page, "ajustes");
  await page.locator("h1", { hasText: "Ajustes" }).waitFor();
  ok((await page.inputValue("#c-equipo")) === "socio@zhdevelopment.cl, nicolas.socio@gmail.com", "Ajustes muestra los correos del equipo");
  ok(await visto(page.locator(".panel", { hasText: "Google Calendar" }).locator(".cal-pie", { hasText: "Lee las reuniones de contacto@zhdevelopment.cl" })), "y el estado de Google Calendar");
  await page.fill("#c-equipo", "socio@zhdevelopment.cl; nuevo.socio@gmail.com, no-es-correo");
  await page.getByRole("button", { name: "Guardar ajustes" }).click();
  ok(await esperar(page, () => JSON.stringify(window.__mockStore.get("config/general").correosEquipo) === JSON.stringify(["socio@zhdevelopment.cl", "nuevo.socio@gmail.com"])), "se guardan como lista, sin lo que no es correo");
  await shot(page, "c03-ajustes.png");

  /* ---------------- oscuro y teléfono ---------------- */
  const dark = await open({ name: "oscuro", seed: SEED, mcp: { modo: "ok", eventos: EVENTOS }, dark: true });
  await panelCal(dark).locator(".cev").first().waitFor();
  await dark.waitForTimeout(1500);
  await shot(dark, "c04-hoy-oscuro.png");
  const tel = await open({ name: "telefono", seed: SEED, mcp: { modo: "ok", eventos: EVENTOS }, viewport: { width: 390, height: 844 } });
  await panelCal(tel).locator(".cev").first().waitFor();
  await tel.waitForTimeout(1500);
  const sw2 = await tel.evaluate(() => document.documentElement.scrollWidth);
  ok(sw2 <= 390, `teléfono, Hoy con el calendario: sin scroll horizontal (${sw2} <= 390)`);
  await panelCal(tel).scrollIntoViewIfNeeded();
  await shot(tel, "c05-telefono.png");

  /* ---------------- sin permiso todavía ---------------- */
  const apr = await open({ name: "aprobacion", seed: SEED, mcp: { modo: "aprobacion", eventos: EVENTOS } });
  const pa = panelCal(apr);
  ok(await visto(pa.locator(".note", { hasText: "Falta tu permiso para que este CRM use Google Calendar." })), "sin permiso, el panel lo dice");
  ok(!(await apr.evaluate(() => window.__mockStore.has("tareas/tar-cal-evvaleria01"))), "y no sincroniza nada");
  await pa.getByRole("button", { name: "Permitir Google Calendar" }).click();
  ok(await visto(pa.locator(".cev", { hasText: "Hostal Mora" }), 8000), "«Permitir Google Calendar» hace la lectura una vez y muestra las reuniones");
  ok((await llamadas(apr, "list_events")).length === 1, "con una sola llamada a list_events");
  ok(await esperar(apr, () => window.__mockStore.has("tareas/tar-cal-evvaleria01"), null, 10000), "y después sincroniza");

  /* ---------------- sin conector ---------------- */
  const sin = await open({ name: "sin-conector", seed: SEED, mcp: { modo: "sin_conector", eventos: EVENTOS } });
  const ps = panelCal(sin);
  ok(await visto(ps.locator(".note", { hasText: "Google Calendar no está conectado en tu cuenta de claude.ai. Agrégalo en claude.ai → Ajustes → Conectores." })), "sin el conector, dice dónde agregarlo");
  ok((await ps.getByRole("button").count()) === 0, "sin un botón de reintentar que no puede funcionar");
  await irA(sin, "embudo");
  await sin.locator(".kcard.lead", { hasText: "Notaría Vega" }).locator(".kcard-titulo").click();
  await sin.locator("#lead-title", { hasText: "Notaría Vega" }).waitFor();
  await sin.locator(".tareas-box .sec-head button", { hasText: "Agendar reunión" }).click();
  await sin.locator("#agendar-title").waitFor();
  ok(await visto(sin.locator(".modal .cal-box a", { hasText: "Agregar a Google Calendar" })) && (await sin.locator(".modal .cal-box .switch").count()) === 0, "y al agendar vuelve al enlace para crear el evento a mano");

  /* ---------------- sin mcp (otra vista): todo como antes ---------------- */
  const off = await open({ name: "sin-mcp", seed: SEED });
  await off.waitForTimeout(1200);
  ok((await panelCal(off).count()) === 0, "sin la capacidad mcp, Hoy no muestra el panel Calendario");

  await browser.close();
  for (const n of notes) console.log(n);
  if (errors.length) { console.error("\n" + errors.join("\n")); process.exit(1); }
  console.log("\nTodo bien. Capturas en " + OUT);
})().catch((e) => { console.error(e); process.exit(1); });
