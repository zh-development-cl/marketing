/* Prueba de los avisos y de «Anotar en Google Calendar» con Playwright y el mock de window.claude
   (con Google Calendar simulado). Recorre: los avisos de Hoy (reunión que viene, invitación
   rechazada y pago vencido); los recordatorios en pantalla (10 minutos antes de una
   reunión y a la hora de una tarea, solo los de quien abre el CRM, «En 10 min», cerrar y que no
   vuelvan al recargar); los ajustes de avisos; anotar en el calendario una tarea (desde su fila, al
   crearla con hora o sin hora, al moverla y desde «No contestó»), un cobro y un hito, sin que la
   sincronización lo tome por una reunión; sin calendario, no se ofrece; teléfono y modo oscuro.
   Usa datos inventados.

   Uso:
     python3 crm/dev/build_preview.py
     NODE_PATH=$(npm root -g) VENDOR_DIR=<carpeta con preact.umd.min.js, hooks.umd.min.js, htm.umd.min.js> \
       node crm/dev/avisos.cjs [carpeta-de-capturas]
   Sale con código 1 si algo falla. */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const PREVIEW = path.join(__dirname, "preview.html");
const OUT = process.argv[2] || path.join(__dirname, "shots");
const VENDOR = process.env.VENDOR_DIR || "";
const ME = "u_lorenzoAAAAAAAAAAAAAAAAAA";
const NICO = "u_nicolasBBBBBBBBBBBBBBBBBB";
const TZ = "America/Santiago";
const CUENTA = "contacto@zhdevelopment.cl";
const MARCA = "Anotado desde el CRM de ZH Development.";
const errors = [];
const notes = [];
const ok = (cond, msg) => { if (!cond) errors.push("falló: " + msg); else notes.push("ok: " + msg); };
const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const hmFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const T = keyFmt.format(new Date());
const addDays = (k, n) => { const d = new Date(k + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const finde = (k) => [0, 6].includes(new Date(k + "T12:00:00Z").getUTCDay());
const habil = (k, n) => { let d = k, left = n; while (left > 0) { d = addDays(d, 1); if (!finde(d)) left -= 1; } return d; };
const iso = (n) => new Date(Date.now() + n * 864e5).toISOString();
/* Día y hora de Chile dentro de n minutos (redondeado al minuto). */
const enMin = (n) => { const d = new Date(Date.now() + n * 6e4); return { fecha: keyFmt.format(d), hora: hmFmt.format(d) }; };
const fmtCL = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const chile = (k, hm) => {
  const local = `${k}T${hm}:00`;
  for (const off of ["-03:00", "-04:00"]) {
    const p = Object.fromEntries(fmtCL.formatToParts(new Date(local + off)).map((x) => [x.type, x.value]));
    if (`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}` === local.slice(0, 16)) return local + off;
  }
  return local + "-03:00";
};
const lead = (o) => ({ cargo: "", correo: "", telefono: "", origen: "prospeccion", trato: "tu", intentos: 0, proxima: null, prioridad: "media", necesidad: "", responsable: "lorenzo", creado: iso(-20), actualizado: iso(-1), creadoPor: ME, ...o });
const tarea = (o) => ({ estado: "pendiente", hora: "", responsable: "lorenzo", origen: "manual", creado: iso(-2), actualizado: iso(-2), creadoPor: ME, ...o });

const D = habil(T, 2);
const R = enMin(5);
const P = enMin(-3);
const MISMO_DIA = R.fecha === T && P.fecha === T && enMin(-2).fecha === T;
const EVENTOS = [
  { id: "evplan01", summary: "Planificación", status: "confirmed", organizer: { email: CUENTA, self: true }, htmlLink: "https://www.google.com/calendar/event?eid=evplan01", updated: iso(-1),
    start: { dateTime: chile(D, "15:00"), timeZone: TZ }, end: { dateTime: chile(D, "15:30"), timeZone: TZ }, attendees: [{ email: CUENTA, self: true, responseStatus: "accepted" }] },
];

const SEED = {
  ["equipo/" + ME]: { nombre: "Lorenzo Bozzo", cargo: "Socio", telefono: "+56955551234", correo: "lorenzo@zhdevelopment.cl" },
  ["equipo/" + NICO]: { nombre: "Nicolás Valdivia", cargo: "Socio", telefono: "+56955554321", correo: "nicolas@zhdevelopment.cl" },
  "config/general": { agendaUrl: "https://zhdevelopment.cl/#agendar", gmailCuenta: CUENTA },
  /* Para anotar desde la fila: una llamada con hora en dos días hábiles. */
  "leads/lead-a": lead({ nombre: "Andrea Fuentes", empresa: "Ferretería Andes", telefono: "+56922223333", etapa: "contactado" }),
  "tareas/tar-a1": tarea({ leadId: "lead-a", tipo: "llamar", titulo: "Primera llamada", fecha: D, hora: "10:00" }),
  "leads/lead-b": lead({ nombre: "Bruno Díaz", empresa: "Viña Norte", telefono: "+56933334444", etapa: "contactado" }),
  /* Una reunión en 5 minutos (con Meet) y una llamada de hace 3 minutos. */
  "leads/lead-c": lead({ nombre: "Clara Soto", empresa: "Imprenta Sur", telefono: "+56944445555", etapa: "reunion_agendada" }),
  "tareas/tar-c1": tarea({ leadId: "lead-c", tipo: "reunion", titulo: "Reunión de descubrimiento", fecha: R.fecha, hora: R.hora, duracion: 30, evento: { id: "evc1", link: "https://www.google.com/calendar/event?eid=evc1", meet: "https://meet.google.com/aaa-bbbb-ccc", respuesta: "accepted", actualizado: iso(-1), propio: true, organizador: CUENTA } }),
  "leads/lead-d": lead({ nombre: "Diego Ruiz", empresa: "Taller Norte", telefono: "+56955556666", etapa: "contactado" }),
  "tareas/tar-d1": tarea({ leadId: "lead-d", tipo: "llamar", titulo: "Volver a llamar", fecha: P.fecha, hora: P.hora }),
  /* Una invitación rechazada. */
  "leads/lead-e": lead({ nombre: "Elena Vidal", empresa: "Café Central", telefono: "+56966667777", correo: "elena@cafecentral.cl", etapa: "reunion_agendada" }),
  "tareas/tar-e1": tarea({ leadId: "lead-e", tipo: "reunion", titulo: "Reunión", fecha: D, hora: "16:00", duracion: 30, evento: { id: "eve1", link: "https://www.google.com/calendar/event?eid=eve1", meet: "", respuesta: "declined", actualizado: iso(-1), propio: true, organizador: CUENTA } }),
  /* Una llamada de Nicolás que ya pasó: sale en Hoy, pero no le salta a Lorenzo. */
  "leads/lead-f": lead({ nombre: "Javiera Soto", empresa: "Óptica Central", telefono: "+56914141414", etapa: "contactado", responsable: "nicolas" }),
  "tareas/tar-f1": tarea({ leadId: "lead-f", tipo: "llamar", titulo: "Llamar a Javiera", fecha: enMin(-2).fecha, hora: enMin(-2).hora, responsable: "nicolas" }),
  /* Para la secuencia de «No contestó» (segundo y cuarto intento) y el registro de la llamada. */
  "leads/lead-g": lead({ nombre: "Gabriela Rivas", empresa: "Panadería Rivas", telefono: "+56988889999", etapa: "contactado", intentos: 1 }),
  "leads/lead-h": lead({ nombre: "Hugo Paz", empresa: "Fletes Paz", telefono: "+56912121212", etapa: "contactado", intentos: 3 }),
  "leads/lead-i": lead({ nombre: "Irene Lagos", empresa: "Clínica Lagos", telefono: "+56913131313", etapa: "nuevo" }),
  /* Un cliente con un pago vencido, una factura por vencer y un hito. */
  "clientes/cli-a": { nombre: "Clínica Norte", razonSocial: "Clínica Norte SpA", contactos: [{ id: "ct-1", nombre: "Daniela Soto", cargo: "Administradora", correo: "dsoto@clinicanorte.cl", telefono: "+56911112222", rol: "decisor", principal: true }], responsable: "lorenzo", trato: "tu", leadIds: [], estado: "activo", notas: "", creado: iso(-90), actualizado: iso(-5), creadoPor: ME },
  "proyectos/pro-a": { clienteId: "cli-a", nombre: "Agenda y fichas", tipo: "software", valor: 6000000, estado: "construir", inicio: addDays(T, -60), entregaEstimada: addDays(T, 30), produccion: "", garantiaDias: 60, hitos: [{ id: "h1", nombre: "Capacitación al equipo", fecha: addDays(T, 5), hecho: false }], enlaces: [], caso: "", alcance: "", responsable: "lorenzo", creado: iso(-60), actualizado: iso(-5), creadoPor: ME },
  "cobros/cob-1": { clienteId: "cli-a", proyectoId: "pro-a", tipo: "cierre", concepto: "Pago final (70%)", monto: 4200000, fecha: addDays(T, -50), estado: "facturado", factura: "115", fechaFactura: addDays(T, -45), vence: addDays(T, -15), fechaPago: "", notas: "", creado: iso(-50), actualizado: iso(-45), creadoPor: ME },
  "cobros/cob-2": { clienteId: "cli-a", proyectoId: "pro-a", tipo: "hito", concepto: "Pago intermedio (40%)", monto: 1000000, fecha: addDays(T, -5), estado: "facturado", factura: "120", fechaFactura: addDays(T, -5), vence: addDays(T, 10), fechaPago: "", notas: "", creado: iso(-5), actualizado: iso(-5), creadoPor: ME },
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  async function open(opts) {
    const context = opts.context || await browser.newContext({ viewport: opts.viewport || { width: 1360, height: 900 }, colorScheme: opts.dark ? "dark" : "light" });
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
    await page.addInitScript((o) => { window.__MOCK_SEED = o.seed; window.__MOCK_MCP = o.mcp; window.__MOCK_RECORDATORIOS = o.rec; }, { seed: opts.seed, mcp: opts.mcp || null, rec: opts.rec !== false });
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
  const nav = (page, re) => page.locator(".side .nav button", { hasText: re }).click();
  const cerrarFicha = async (page) => { await page.keyboard.press("Escape"); await page.locator(".drawer").waitFor({ state: "detached" }); };
  const llamadas = (page, tool) => page.evaluate((t) => window.__mcpCalls.filter((c) => c.tipo === "call" && c.tool === t).map((c) => c.input), tool);
  const lsGet = (page, k) => page.evaluate((x) => { try { return JSON.parse(localStorage.getItem("zhcrm:" + x)); } catch (e) { return null; } }, k);
  const MCP = { modo: "ok", eventos: EVENTOS };

  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  let page = await open({ name: "avisos", seed: SEED, mcp: MCP, context: ctx });

  /* ---------------- Hoy: avisos ---------------- */
  const avisos = page.locator(".avisos .aviso");
  await page.locator(".avisos").waitFor();
  if (MISMO_DIA) {
    const r = avisos.filter({ hasText: "Reunión con Imprenta Sur" });
    ok(await visto(r) && /a las \d\d:\d\d · en [3-6] min/.test(await r.innerText()), "Hoy avisa la reunión que viene, con los minutos que faltan");
    ok((await r.locator("a", { hasText: "Unirse a Meet" }).getAttribute("href")) === "https://meet.google.com/aaa-bbbb-ccc", "con el botón para entrar a Meet");
    ok((await avisos.filter({ hasText: "Taller Norte" }).count()) === 0, "una tarea con hora no se repite en los avisos: tiene su recordatorio y queda en rojo en Tareas");
  } else notes.push("omitido: la reunión y la llamada de prueba caen en otro día (cerca de la medianoche)");
  ok(await visto(avisos.filter({ hasText: "Café Central rechazó la invitación a la reunión del" }).locator("button", { hasText: "Reagendar" })), "avisa la invitación rechazada, con «Reagendar»");
  ok(await visto(avisos.filter({ hasText: "Pago vencido: Pago final (70%) · Clínica Norte · $4.998.000 con IVA" })), "avisa el pago vencido, con IVA");
  ok((await avisos.filter({ hasText: "Pago intermedio" }).count()) === 0, "una factura que todavía no vence no es un aviso");

  /* ---------------- recordatorios en pantalla ---------------- */
  const recs = page.locator(".recs .rec");
  if (MISMO_DIA) {
    const rr = recs.filter({ hasText: "Reunión con Imprenta Sur" });
    ok(await visto(rr) && /En [3-6] min · \d\d:\d\d/.test(await rr.innerText()), "10 minutos antes de la reunión sale un recordatorio, en cualquier sección");
    ok(await visto(rr.locator("a", { hasText: "Unirse a Meet" })), "con el botón de Meet");
    const rl = recs.filter({ hasText: "Volver a llamar · Taller Norte" });
    ok(await visto(rl) && /Hace [2-5] min/.test(await rl.innerText()), "a la hora de una tarea con hora, también");
    ok(await visto(rl.locator("button", { hasText: "Llamar" })), "con el botón para llamar");
    ok((await recs.filter({ hasText: "Óptica Central" }).count()) === 0, "a Lorenzo no le saltan las tareas de Nicolás");
    await shot(page, "a01-hoy-avisos.png");
    await nav(page, /^Embudo de leads/);
    await page.locator("h1", { hasText: "Embudo de leads" }).waitFor();
    ok(await visto(recs.filter({ hasText: "Imprenta Sur" })), "el recordatorio sigue a la vista en otra sección");
    await rl.getByRole("button", { name: "En 10 min" }).click();
    ok(await esperar(page, () => ![...document.querySelectorAll(".recs .rec")].some((x) => x.textContent.includes("Taller Norte"))), "«En 10 min» lo esconde");
    const posp = (await lsGet(page, "pospuestos")) || {};
    ok(Object.entries(posp).some(([k, v]) => k.startsWith("tar-d1|") && v > Date.now() + 9 * 6e4), "y lo vuelve a mostrar en 10 minutos");
    await rr.getByRole("button", { name: "Cerrar el recordatorio" }).click();
    ok(await esperar(page, () => !document.querySelector(".recs")), "cerrar lo quita");
    ok(Object.keys((await lsGet(page, "avisados")) || {}).some((k) => k.startsWith("tar-c1|")), "y queda recordado en este navegador");
    /* El CRM vuelve a abrir en la última sección: se deja en Hoy. */
    await nav(page, /^Hoy/);
    await page.getByRole("heading", { name: "Hoy", exact: true }).waitFor();
    await page.close();
    page = await open({ name: "avisos-recarga", seed: SEED, mcp: MCP, context: ctx });
    await page.locator(".avisos").waitFor();
    await page.waitForTimeout(800);
    ok((await page.locator(".recs .rec").count()) === 0, "al volver a abrir el CRM, los cerrados y pospuestos no vuelven a salir");
  } else notes.push("omitido: recordatorios (cerca de la medianoche)");

  /* ---------------- ajustes de avisos ---------------- */
  await nav(page, /^Ajustes/);
  const panelAv = page.locator(".panel[aria-label=Avisos]");
  await panelAv.waitFor();
  await panelAv.locator(".switch", { hasText: "Recordatorios en pantalla" }).locator("input").uncheck();
  ok((await lsGet(page, "recordatorios")) === false, "los recordatorios se apagan en Ajustes (en este navegador)");
  ok(await panelAv.locator(".switch", { hasText: "Con sonido" }).locator("input").isDisabled(), "y sin recordatorios, el sonido no se puede elegir");
  await panelAv.locator(".switch", { hasText: "Recordatorios en pantalla" }).locator("input").check();
  await panelAv.locator(".switch", { hasText: "Con sonido" }).locator("input").uncheck();
  ok((await lsGet(page, "recordatorios")) === true && (await lsGet(page, "sonidoAvisos")) === false, "se vuelven a prender y el sonido se apaga aparte");
  ok(await visto(panelAv.locator("p", { hasText: "anota la tarea en Google Calendar" })), "Ajustes explica cómo hacer que avise el teléfono");

  /* ---------------- anotar una tarea desde su fila ---------------- */
  await nav(page, /^Hoy/);
  const filaA = page.locator(".task", { hasText: "Primera llamada" });
  await filaA.getByRole("button", { name: "Anotar en Google Calendar: Primera llamada" }).click();
  ok(await toast(page, "Anotada en Google Calendar: Primera llamada"), "«Anotar en Google Calendar» en la fila de una tarea");
  let creadas = await llamadas(page, "create_event");
  const evA = creadas[creadas.length - 1] || {};
  ok(evA.calendarId === CUENTA && evA.summary === "Primera llamada · Ferretería Andes" && evA.startTime === `${D}T10:00:00` && evA.endTime === `${D}T10:15:00` && !evA.allDay, `queda a su hora, 15 minutos, en el calendario de ${CUENTA}`);
  ok(JSON.stringify(evA.attendees) === JSON.stringify([{ email: "lorenzo@zhdevelopment.cl" }]) && evA.notificationLevel === "NONE", "invita a quien la lleva, sin mandarle correo");
  ok((evA.description || "").includes("Teléfono: +56 9 2222 3333") && (evA.description || "").includes(MARCA), "con el teléfono y la marca del CRM en la descripción");
  let dump = await store(page);
  const calA = dump["tareas/tar-a1"].calendario || {};
  ok(calA.id && calA.fecha === D && calA.hora === "10:00", "la tarea guarda el evento");
  ok(await visto(filaA.locator("a[aria-label='Abrir en Google Calendar']")) && (await filaA.locator(".task-meta").innerText()).includes("en Google Calendar"), "y la fila muestra que está en el calendario, con el enlace");
  ok((await filaA.getByRole("button", { name: /^Anotar en Google Calendar/ }).count()) === 0, "el botón para anotar ya no aparece");

  /* La sincronización no lo toma por una reunión y el panel del calendario no lo repite. */
  const tareasAntes = docs(dump, "tareas").length;
  await page.evaluate(() => window.__mcpRefrescar());
  await page.waitForTimeout(2600);
  dump = await store(page);
  ok(docs(dump, "tareas").length === tareasAntes && dump["leads/lead-a"].etapa === "contactado" && !dump["eventos/" + calA.id], "la sincronización con el calendario no lo toma por una reunión");
  const panelCal = page.locator(".panel[aria-label=Calendario]");
  ok(await visto(panelCal.locator(".cev", { hasText: "Planificación" })) && (await panelCal.locator(".cev", { hasText: "Primera llamada" }).count()) === 0, "el panel del calendario muestra las reuniones, sin repetir lo anotado");

  /* ---------------- moverla y crear tareas con la casilla ---------------- */
  await page.locator(".task", { hasText: "Primera llamada" }).locator(".task-meta button", { hasText: "Ferretería Andes" }).click();
  await page.locator("#lead-title", { hasText: "Ferretería Andes" }).waitFor();
  await page.locator(".tareas-box .task", { hasText: "Primera llamada" }).locator(".task-title button").click();
  ok(await visto(page.locator(".task-form .cal-nota", { hasText: "Está anotada en Google Calendar" })), "el formulario avisa que la tarea está en el calendario");
  await page.fill("#te-hora", "11:30");
  await page.locator(".task-form .btn.primary", { hasText: "Guardar" }).click();
  ok(await toast(page, "También se cambió en Google Calendar"), "al cambiarle la hora, se cambia en el calendario");
  const mov = (await llamadas(page, "update_event")).pop() || {};
  ok(mov.eventId === calA.id && mov.startTime === `${D}T11:30:00` && mov.endTime === `${D}T11:45:00`, "el mismo evento, a la hora nueva");
  ok(await esperar(page, () => { const t = window.__mockStore.get("tareas/tar-a1"); return t.calendario && t.calendario.hora === "11:30"; }), "y la tarea lo guarda");
  await page.locator(".tareas-box .sec-head button", { hasText: "Tarea" }).click();
  await page.fill("#tn-titulo", "Llamar para confirmar");
  await page.fill("#tn-fecha", D);
  await page.fill("#tn-hora", "09:30");
  const casilla = page.locator(".task-form .check", { hasText: "Anotar en Google Calendar" }).locator("input");
  ok(await casilla.isChecked(), "una tarea nueva con hora viene marcada para anotarla");
  await page.locator(".task-form .btn.primary", { hasText: "Agregar tarea" }).click();
  ok(await toast(page, "Anotada en Google Calendar: Llamar para confirmar"), "y se anota al agregarla");
  ok(await esperar(page, () => [...window.__mockStore].some(([k, v]) => k.startsWith("tareas/") && v.titulo === "Llamar para confirmar" && v.calendario && v.calendario.hora === "09:30")), "con su evento guardado");
  await page.locator(".tareas-box .sec-head button", { hasText: "Tarea" }).click();
  await page.locator(".task-form .chip", { hasText: "WhatsApp" }).click();
  await page.fill("#tn-titulo", "Mandar el resumen");
  await page.fill("#tn-fecha", D);
  const casilla2 = page.locator(".task-form .check", { hasText: "Anotar en Google Calendar (todo el día)" }).locator("input");
  ok(await visto(casilla2) && !(await casilla2.isChecked()), "sin hora, no viene marcada y dice que es de todo el día");
  await casilla2.check();
  await page.locator(".task-form .btn.primary", { hasText: "Agregar tarea" }).click();
  ok(await toast(page, "Anotada en Google Calendar: Mandar el resumen"), "marcándola, se anota igual");
  creadas = await llamadas(page, "create_event");
  const evDia = creadas[creadas.length - 1] || {};
  ok(evDia.allDay === true && evDia.startTime === `${D}T00:00:00` && evDia.endTime === `${addDays(D, 1)}T00:00:00` && evDia.availability === "AVAILABILITY_FREE", "como evento de todo el día que no ocupa la agenda");
  await shot(page, "a02-ficha-anotada.png");
  await cerrarFicha(page);

  /* ---------------- «No contestó» con hora ---------------- */
  await nav(page, /^Embudo de leads/);
  await page.locator(".kcard.lead", { hasText: "Viña Norte" }).locator('.kact[title="No contestó"]').click();
  await page.locator(".modal", { hasText: "No contestó: Bruno Díaz" }).waitFor();
  ok(await visto(page.locator(".modal .cadencia li.actual", { hasText: "Llamar mañana, a otra hora" })), "«No contestó» muestra la secuencia y marca el paso que toca");
  ok(["10:00", "16:00"].includes(await page.inputValue("#nc-hora")) && (await page.inputValue("#nc-fecha")) === habil(T, 1), "el primer intento propone mañana, a otra hora del día");
  await page.locator(".modal .chip", { hasText: "Más tarde" }).click();
  const casNC = page.locator(".modal .check", { hasText: "Anotar en Google Calendar" }).locator("input");
  ok(await visto(casNC) && !(await casNC.isChecked()), "con hora, ofrece anotarlo en el calendario, sin marcar (un reintento no llena el calendario)");
  await casNC.check();
  await page.locator(".modal .btn.primary", { hasText: "Guardar" }).click();
  ok(await toast(page, "Quedó anotado en Google Calendar"), "el aviso dice que quedó en el calendario");
  ok(await esperar(page, () => [...window.__mockStore].some(([k, v]) => k.startsWith("tareas/") && v.leadId === "lead-b" && v.origen === "no_contesto" && v.calendario && v.calendario.id)), "y la tarea nueva guarda su evento");

  /* ---------------- no contestó: segundo y cuarto intento ---------------- */
  await page.locator(".kcard.lead", { hasText: "Panadería Rivas" }).locator('.kact[title="No contestó"]').click();
  await page.locator(".modal", { hasText: "No contestó: Gabriela Rivas" }).waitFor();
  ok(await visto(page.locator(".modal .cadencia li.actual", { hasText: "WhatsApp y llamar en 2 días" })) && (await page.locator(".modal .cadencia li.hecho").count()) === 1, "al segundo intento, toca el WhatsApp");
  ok((await page.inputValue("#nc-fecha")) === T && await page.locator(".modal .seg button[aria-pressed=true]", { hasText: "Escribirle por WhatsApp" }).isVisible(), "propone escribirle hoy por WhatsApp");
  ok(await page.locator(".modal .check", { hasText: "volver a llamarlo 2 días hábiles después" }).locator("input").isChecked(), "y dejar el llamado siguiente");
  await page.locator(".modal .btn.primary", { hasText: "Guardar" }).click();
  ok(await toast(page, "escribirle por WhatsApp hoy y llamarlo el "), "el aviso dice las dos cosas: el WhatsApp de hoy y el llamado siguiente");
  ok(await esperar(page, (o) => { const ts = [...window.__mockStore].filter(([k, v]) => k.startsWith("tareas/") && v.leadId === "lead-g" && v.estado === "pendiente").map(([, v]) => v); return ts.some((t) => t.tipo === "whatsapp" && t.fecha === o.t) && ts.some((t) => t.tipo === "llamar" && t.fecha === o.d); }, { t: T, d: habil(T, 2) }), "quedan el WhatsApp de hoy y el llamado en 2 días hábiles");
  await page.locator(".kcard.lead", { hasText: "Fletes Paz" }).locator('.kact[title="No contestó"]').click();
  await page.locator(".modal", { hasText: "No contestó: Hugo Paz" }).waitFor();
  ok(await visto(page.locator(".modal .cadencia li.fin.actual", { hasText: "Perdido · No responde" })), "al cuarto intento, la secuencia llega a Perdido");
  ok(await page.locator(".modal .btn.primary.danger", { hasText: "Perdido · No responde" }).isVisible() && await page.locator(".modal .btn", { hasText: "Seguir intentando" }).isVisible(), "y lo propone como acción principal, con «Seguir intentando» al lado");
  await shot(page, "a06-no-contesto-4.png");
  await page.keyboard.press("Escape");
  await page.locator(".modal").waitFor({ state: "detached" });

  /* ---------------- pidió que lo llamemos otro día ---------------- */
  await page.locator(".kcard.lead", { hasText: "Taller Norte" }).locator(".kcard-titulo").click();
  await page.locator("#lead-title", { hasText: "Taller Norte" }).waitFor();
  ok(await visto(page.locator(".drawer .quick-acts button", { hasText: "Me llamó y no contesté" })), "la ficha trae el resultado rápido de una llamada");
  await page.locator(".drawer .quick-acts button", { hasText: "Pidió otro día" }).click();
  await page.locator("#otro-title", { hasText: "Pidió que lo llamemos otro día: Diego Ruiz" }).waitFor();
  await page.locator(".modal .chip", { hasText: "El lunes" }).click();
  const lunes = await page.inputValue("#od-fecha");
  ok(new Date(lunes + "T12:00:00Z").getUTCDay() === 1 && lunes > T, "«El lunes» pone el próximo lunes");
  await page.locator(".modal .horas .btn", { hasText: "10:00" }).click();
  await page.fill("#od-nota", "Está en terreno toda la semana");
  ok(await page.locator(".modal .check", { hasText: "Anotar en Google Calendar" }).locator("input").isChecked(), "con hora, viene marcado anotarlo en el calendario");
  await page.locator(".modal .check", { hasText: "Claude redacta un WhatsApp para confirmarle" }).locator("input").check();
  await shot(page, "a07-otro-dia.png");
  await page.locator(".modal .btn.primary", { hasText: "Guardar" }).click();
  ok(await toast(page, "Taller Norte: llamarlo el lun") && await toast(page, "a las 10:00. Quedó anotado en Google Calendar."), "el aviso dice cuándo y que quedó en el calendario");
  ok(await esperar(page, (o) => [...window.__mockStore].some(([k, v]) => k.startsWith("tareas/") && v.leadId === "lead-d" && v.titulo === "Volver a llamar (lo pidió)" && v.fecha === o && v.hora === "10:00" && v.calendario && v.calendario.id), lunes), "queda la llamada de ese día a esa hora, anotada en el calendario");
  dump = await store(page);
  ok(dump["tareas/tar-d1"].estado === "hecha" && dump["leads/lead-d"].intentos === 0 && !!dump["leads/lead-d"].ultimoContacto, "la llamada de hoy queda hecha y cuenta como contacto");
  ok(docs(dump, "actividades").some((a) => a.leadId === "lead-d" && a.tipo === "llamada" && a.resultado === "volver" && /^Pidió que lo llamemos (el lun, \d+ \w+|mañana) a las 10:00\. Está en terreno/.test(a.resumen)), "y en el historial: «Pidió que lo llamemos…», con la nota");
  ok(await esperar(page, () => [...window.__mockStore].some(([k, v]) => k.startsWith("borradores/") && v.leadId === "lead-d" && v.canal === "whatsapp" && v.tareaId)), "Claude deja el WhatsApp de confirmación, unido a su tarea");
  ok(await page.evaluate(() => window.__mockPrompts.some((p) => p.includes("pidió que lo llamemos el lun") && p.includes("Sin presionar"))), "con el día y la hora que pidió");

  /* ---------------- me llamó y no contesté ---------------- */
  await page.locator(".drawer .quick-acts button", { hasText: "Me llamó y no contesté" }).click();
  ok(await toast(page, "Taller Norte: quedó la tarea de devolverle la llamada"), "«Me llamó y no contesté» deja la tarea de devolverle la llamada");
  ok(await esperar(page, (o) => [...window.__mockStore].some(([k, v]) => k.startsWith("tareas/") && v.leadId === "lead-d" && v.titulo === "Devolverle la llamada" && v.fecha === o && v.responsable === "lorenzo"), T), "para hoy, para quien la perdió");
  await cerrarFicha(page);

  /* ---------------- registrar la llamada: pidió que llamemos después ---------------- */
  await page.locator(".kcard.lead", { hasText: "Clínica Lagos" }).locator(".kcard-titulo").click();
  await page.locator("#lead-title", { hasText: "Clínica Lagos" }).waitFor();
  await page.locator(".drawer .cline .btn.primary", { hasText: "Registrar llamada" }).click();
  ok((await page.locator(".drawer .work").innerText()).includes("Es el número del lead: llámalo desde tu celular") && (await page.locator(".drawer .work .field", { hasText: "Línea" }).count()) === 0, "registrar la llamada ya no habla de una línea de negocios");
  await page.locator(".drawer .work .chip", { hasText: "Pidió que llamemos después" }).click();
  await page.locator(".drawer .volver-box").waitFor();
  await page.locator(".drawer .volver-box .chip", { hasText: "Mañana" }).click();
  await page.locator(".drawer .volver-box .horas .btn", { hasText: "16:00" }).click();
  await page.locator(".drawer .work .btn.primary", { hasText: "Guardar llamada" }).click();
  ok(await toast(page, "Llamada guardada · 1 tarea nueva · Contactado."), "al guardar, queda la tarea y el lead pasa a «Contactado»");
  ok(await esperar(page, (o) => [...window.__mockStore].some(([k, v]) => k.startsWith("tareas/") && v.leadId === "lead-i" && v.titulo === "Volver a llamar (lo pidió)" && v.fecha === o && v.hora === "16:00" && v.calendario && v.calendario.id), habil(T, 1)), "la llamada que pidió, con su día y hora, anotada en el calendario");
  await cerrarFicha(page);

  /* ---------------- Llamar en serie: también «Pidió otro día» ---------------- */
  await nav(page, /^Llamar en serie/);
  await page.locator("h1", { hasText: "Llamar en serie" }).waitFor();
  ok(!(await page.locator(".llamar-card").count()) || await visto(page.locator(".llamar-acciones .btn", { hasText: "Pidió otro día" })), "«Llamar en serie» trae «Pidió otro día» junto a «No contestó»");

  /* ---------------- un cobro y un hito ---------------- */
  await nav(page, /^Cobros/);
  const filaCob = page.locator(".irow", { hasText: "Pago intermedio (40%)" });
  await filaCob.getByRole("button", { name: "Anotar en Google Calendar: Pago intermedio (40%)" }).click();
  ok(await toast(page, "Quedó anotado en Google Calendar: Vence la factura 120: Pago intermedio (40%) · Clínica Norte"), "el vencimiento de una factura se anota desde Cobros");
  creadas = await llamadas(page, "create_event");
  const evCob = creadas[creadas.length - 1] || {};
  ok(evCob.allDay === true && evCob.startTime === `${addDays(T, 10)}T00:00:00` && (evCob.description || "").includes("$1.000.000 + IVA ($1.190.000 con IVA)"), "todo el día, en la fecha de vencimiento, con el monto");
  ok(await esperar(page, () => { const c = window.__mockStore.get("cobros/cob-2"); return c.calendario && c.calendario.que === "vence" && c.calendario.id; }), "el cobro guarda el evento");
  ok(await visto(filaCob.locator("a[aria-label='Abrir en Google Calendar: Pago intermedio (40%)']")), "y la fila queda con el enlace");
  ok((await page.locator(".irow", { hasText: "Pago final (70%)" }).getByRole("button", { name: /Anotar en Google Calendar/ }).count()) === 0, "un pago ya vencido no se ofrece anotar");
  await nav(page, /^Proyectos/);
  await page.locator(".kcard", { hasText: "Agenda y fichas" }).click();
  await page.getByRole("button", { name: "Anotar en Google Calendar: Capacitación al equipo" }).click();
  ok(await toast(page, "Quedó anotado en Google Calendar: Capacitación al equipo"), "un hito se anota desde el proyecto");
  creadas = await llamadas(page, "create_event");
  const evHito = creadas[creadas.length - 1] || {};
  ok(evHito.allDay === true && evHito.summary === "Hito: Capacitación al equipo · Agenda y fichas" && evHito.startTime === `${addDays(T, 5)}T00:00:00`, "todo el día, con el nombre del proyecto");
  ok(await esperar(page, () => { const p = window.__mockStore.get("proyectos/pro-a"); return p.hitos[0].calendario && p.hitos[0].calendario.fecha === p.hitos[0].fecha; }), "el hito guarda el evento");
  await shot(page, "a03-proyecto-hito.png");
  await cerrarFicha(page);

  /* ---------------- sin calendario ---------------- */
  const sinCal = await open({ name: "sin-calendario", seed: SEED, rec: false });
  await sinCal.locator(".task", { hasText: "Primera llamada" }).waitFor();
  ok((await sinCal.getByRole("button", { name: /^Anotar en Google Calendar/ }).count()) === 0, "sin Google Calendar, no se ofrece anotar");
  ok((await sinCal.locator(".recs").count()) === 0, "y con los recordatorios apagados, no sale ninguno");
  await sinCal.close();

  /* ---------------- teléfono y oscuro ---------------- */
  const tel = await open({ name: "telefono", seed: SEED, mcp: MCP, viewport: { width: 390, height: 844 } });
  await tel.locator(".avisos").waitFor();
  const sw = await tel.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= 390, `teléfono, Hoy con avisos: sin scroll horizontal (${sw} <= 390)`);
  if (MISMO_DIA) ok(await visto(tel.locator(".recs .rec")), "en el teléfono, el recordatorio sale arriba");
  await shot(tel, "a04-telefono.png");
  await tel.close();
  const dark = await open({ name: "oscuro", seed: SEED, mcp: MCP, dark: true });
  await dark.locator(".avisos").waitFor();
  await dark.waitForTimeout(400);
  await shot(dark, "a05-oscuro.png");
  await dark.close();

  await browser.close();
  for (const n of notes) console.log(n);
  if (errors.length) { console.error("\n" + errors.join("\n")); process.exit(1); }
  console.log("\nTodo bien. Capturas en " + OUT);
})().catch((e) => { for (const n of notes) console.log(n); if (errors.length) console.error(errors.join("\n")); console.error(e); process.exit(1); });
