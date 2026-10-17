/* Prueba de las tareas y del flujo automático con Playwright y el mock de window.claude.
   Recorre: grabar una llamada y que al detener Claude la analice y se guarde sola (tareas, reunión,
   etapa y borradores); completar tareas desde la tarjeta del embudo y desde Hoy («Agendar reunión»
   pide el día y pasa a «Reunión agendada»; la reunión pasada pregunta si se hizo y pasa a «Reunión
   concretada»; «Enviar propuesta» pasa a «Propuesta enviada» con su seguimiento y se puede
   deshacer); registrar la reunión; el borrador enviado cumple su tarea; la «próxima acción» del
   lead sigue a su primera tarea; el menú lateral contraído y el tablero de 7 columnas. Usa datos
   inventados.

   Uso:
     python3 crm/dev/build_preview.py
     NODE_PATH=$(npm root -g) VENDOR_DIR=<carpeta con preact.umd.min.js, hooks.umd.min.js, htm.umd.min.js> \
       node crm/dev/tareas.cjs [carpeta-de-capturas]
   Sale con código 1 si algo falla. */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { irA } = require("./ir.cjs");

const PREVIEW = path.join(__dirname, "preview.html");
const OUT = process.argv[2] || path.join(__dirname, "shots");
const VENDOR = process.env.VENDOR_DIR || "";
const ME = "u_lorenzoAAAAAAAAAAAAAAAAAA";
const errors = [];
const notes = [];
const ok = (cond, msg) => { if (!cond) errors.push("falló: " + msg); else notes.push("ok: " + msg); };
const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit" });
const T = keyFmt.format(new Date());
const addDays = (k, n) => { const d = new Date(k + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const habil = (k, n) => { let d = k, left = n; while (left > 0) { d = addDays(d, 1); const w = new Date(d + "T12:00:00Z").getUTCDay(); if (w !== 0 && w !== 6) left -= 1; } return d; };
const iso = (n) => new Date(Date.now() + n * 864e5).toISOString();
const lead = (o) => ({ cargo: "", correo: "", origen: "prospeccion", trato: "tu", intentos: 0, proxima: null, prioridad: "media", necesidad: "", responsable: "lorenzo", creado: iso(-5), actualizado: iso(-1), creadoPor: ME, ...o });
const tarea = (o) => ({ estado: "pendiente", hora: "", responsable: "lorenzo", origen: "manual", creado: iso(-2), actualizado: iso(-2), creadoPor: ME, ...o });
const FRASES = ["hola andrea te llamo de zh por lo del inventario", "la verdad lo encuentro un poco caro", "nos interesa ver una demo la próxima semana", "mándame la propuesta al correo"];

const SEED = {
  ["equipo/" + ME]: { nombre: "Lorenzo Bozzo", cargo: "Socio", telefono: "+56955551234", correo: "lorenzo@zhdevelopment.cl" },
  "config/general": { agendaUrl: "https://zhdevelopment.cl/#agendar", gmailCuenta: "contacto@zhdevelopment.cl" },
  "leads/lead-a": lead({ nombre: "Andrea Fuentes", empresa: "Ferretería Andes", telefono: "+56922223333", etapa: "nuevo" }),
  "tareas/tar-a": tarea({ leadId: "lead-a", tipo: "llamar", titulo: "Primera llamada", fecha: T }),
  "leads/lead-b": lead({ nombre: "Bruno Díaz", empresa: "Viña Norte", telefono: "+56933334444", correo: "bruno@vinanorte.cl", etapa: "contactado" }),
  "tareas/tar-ag": tarea({ leadId: "lead-b", tipo: "agendar", titulo: "Agendar la demo", fecha: T }),
  "leads/lead-c": lead({ nombre: "Clara Soto", empresa: "Imprenta Sur", telefono: "+56944445555", etapa: "reunion_agendada" }),
  "tareas/tar-r": tarea({ leadId: "lead-c", tipo: "reunion", titulo: "Reunión de descubrimiento", fecha: addDays(T, -1), hora: "10:00", duracion: 30 }),
  "leads/lead-d": lead({ nombre: "Diego Ruiz", empresa: "Taller Norte", telefono: "+56955556666", etapa: "reunion_concretada", responsable: "nicolas" }),
  "tareas/tar-p": tarea({ leadId: "lead-d", tipo: "propuesta", titulo: "Enviar la propuesta", fecha: T, responsable: "nicolas" }),
  "leads/lead-e": lead({ nombre: "Elena Vidal", empresa: "Café Central", telefono: "+56966667777", etapa: "reunion_agendada" }),
  "tareas/tar-r2": tarea({ leadId: "lead-e", tipo: "reunion", titulo: "Reunión por Meet", fecha: addDays(T, -2), hora: "16:00", duracion: 30 }),
  /* Un lead con la «próxima acción» antigua, sin tarea: se ve como tarea. */
  "leads/lead-f": lead({ nombre: "Felipe Mena", empresa: "Ferretería Este", telefono: "+56977778888", etapa: "contactado", proxima: { tipo: "whatsapp", fecha: T, hora: "", nota: "Mandarle el resumen por WhatsApp" } }),
  /* Uno con una reunión agendada para arrastrarlo a «Reunión concretada». */
  "leads/lead-g": lead({ nombre: "Gabriela Rivas", empresa: "Panadería Rivas", telefono: "+56988889999", etapa: "reunion_agendada" }),
  "tareas/tar-g": tarea({ leadId: "lead-g", tipo: "reunion", titulo: "Reunión de diagnóstico", fecha: T, hora: "09:00", duracion: 30 }),
  /* Para las llamadas con otros resultados. */
  "leads/lead-h": lead({ nombre: "Hugo Paz", empresa: "Fletes Paz", telefono: "+56912121212", etapa: "contactado" }),
  "leads/lead-i": lead({ nombre: "Irene Lagos", empresa: "Clínica Lagos", telefono: "+56913131313", etapa: "nuevo" }),
  /* Para «No se presentó»: una primera vez y una segunda. */
  "leads/lead-j": lead({ nombre: "Javiera Soto", empresa: "Óptica Central", telefono: "+56914141414", etapa: "reunion_agendada" }),
  "tareas/tar-r3": tarea({ leadId: "lead-j", tipo: "reunion", titulo: "Reunión de descubrimiento", fecha: addDays(T, -1), hora: "15:00", duracion: 30 }),
  "leads/lead-k": lead({ nombre: "Karen Mella", empresa: "Bodega Mella", telefono: "+56915151515", etapa: "reunion_agendada", inasistencias: 1 }),
  "tareas/tar-r4": tarea({ leadId: "lead-k", tipo: "reunion", titulo: "Reunión reagendada", fecha: addDays(T, -3), hora: "10:00", duracion: 30 }),
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
    await page.addInitScript((o) => { window.__MOCK_SEED = o.seed; window.__MOCK_MIC = o.mic; }, { seed: opts.seed, mic: opts.mic || null });
    await page.goto("file://" + PREVIEW);
    await page.getByRole("heading", { name: "Hoy", exact: true }).waitFor({ timeout: 15000 });
    return page;
  }
  const shot = (page, name) => page.screenshot({ path: path.join(OUT, name), fullPage: false });
  const toast = (page, text) => page.locator(".toast", { hasText: text }).first().waitFor({ timeout: 8000 });
  const visto = (loc, ms) => loc.first().waitFor({ timeout: ms || 5000 }).then(() => true, () => false);
  const store = (page) => page.evaluate(() => Object.fromEntries(window.__mockStore));
  const docs = (dump, col) => Object.entries(dump).filter(([k]) => k.startsWith(col + "/")).map(([k, v]) => ({ id: k.split("/")[1], ...v }));
  const card = (page, nombre) => page.locator(".kcard.lead", { hasText: nombre });
  const col = (page, id) => page.locator(`.board [data-col="${id}"]`);
  const cerrarFicha = async (page) => { await page.keyboard.press("Escape"); await page.locator(".drawer").waitFor({ state: "detached" }); };
  const centro = async (loc) => { const b = await loc.boundingBox(); return { x: b.x + b.width / 2, y: b.y + Math.min(b.height / 2, 30) }; };
  const arrastrar = async (page, desde, hasta) => {
    const a = await centro(desde);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(a.x + 12, a.y + 4, { steps: 3 });
    const b = await centro(hasta);
    await page.mouse.move(b.x, b.y, { steps: 8 });
    await page.mouse.up();
  };

  const page = await open({ name: "tareas", seed: SEED, mic: { modo: "ok", frases: FRASES } });

  /* ---------------- menú contraído y tablero de 7 columnas ---------------- */
  ok(await page.locator(".app.mini").count() === 1, "en una pantalla de 1360 px el menú lateral parte con solo íconos");
  ok((await page.locator(".side .nav button .lbl-c").allInnerTexts()).join("|") === "Buscar|Hoy|Llamar|Leads|Clientes|Ajustes", "con el nombre bajo cada ícono: las cinco secciones");
  await irA(page, "embudo");
  await page.locator("h1", { hasText: "Embudo de leads" }).waitFor();
  const ancho = await page.locator(".board.embudo").evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }));
  ok(ancho.sw <= ancho.cw + 1, `las 7 columnas caben sin deslizar el tablero (${ancho.sw} <= ${ancho.cw})`);
  await shot(page, "t01-embudo.png");
  await page.locator(".side-toggle").click();
  ok(await page.locator(".app.mini").count() === 0 && await page.locator(".side .nav button .lbl", { hasText: "Clientes" }).isVisible(), "el botón de abajo muestra el menú completo");
  ok((await page.evaluate(() => localStorage.getItem("zhcrm:menuMini"))) === "false", "y lo recuerda en este navegador");
  await page.locator(".side-toggle").click();

  /* ---------------- tarjetas: próxima tarea ---------------- */
  ok(await card(page, "Viña Norte").locator(".knext.today", { hasText: "Agendar la demo" }).isVisible(), "la tarjeta muestra su próxima tarea");
  ok(await card(page, "Imprenta Sur").locator(".knext.ask", { hasText: "¿Se hizo la reunión?" }).isVisible(), "después de la hora de la reunión, la tarjeta pregunta si se hizo");
  ok(await card(page, "Ferretería Este").locator(".knext", { hasText: "Mandarle el resumen por WhatsApp" }).isVisible(), "una «próxima acción» antigua, sin tarea, se ve igual que una tarea");
  ok(await card(page, "Fletes Paz").locator(".knext.vacio", { hasText: "Sin tarea" }).isVisible(), "y sin tareas, avisa");
  ok(await card(page, "Bodega Mella").locator(".tag", { hasText: "No se presentó" }).isVisible(), "la tarjeta avisa si ya no se presentó a una reunión");

  /* ---------------- completar «Agendar» desde la tarjeta ---------------- */
  await card(page, "Viña Norte").locator(".tick").click();
  await page.locator("#agendar-title", { hasText: "Agendar reunión con Viña Norte" }).waitFor();
  ok((await page.locator("#lead-title").count()) === 0, "el círculo de la tarjeta abre «Agendar reunión» sin abrir la ficha");
  ok(await page.locator(".modal .seg button[aria-pressed=true]", { hasText: "WhatsApp" }).isVisible(), "propone dejar redactada la confirmación por WhatsApp");
  await page.fill("#ag-fecha", addDays(T, 4));
  await page.fill("#ag-hora", "12:00");
  await page.locator(".modal .seg button", { hasText: "45" }).click();
  const gcal = await page.locator(".cal-box a").getAttribute("href");
  const f4 = addDays(T, 4).replace(/-/g, "");
  ok(gcal.includes(`dates=${f4}T120000%2F${f4}T124500`) && gcal.includes("add=bruno%40vinanorte.cl") && gcal.includes("authuser=contacto%40zhdevelopment.cl"), "el evento de Google Calendar lleva la hora, el lead como invitado y la cuenta de ZH");
  ok(!gcal.includes("details=Notas") && (await page.locator(".cal-box .hint").innerText()).includes("contacto@zhdevelopment.cl"), "y se abre en contacto@zhdevelopment.cl");
  await shot(page, "t02-agendar.png");
  await page.locator(".modal .btn.primary", { hasText: "Agendar reunión" }).click();
  await toast(page, "Viña Norte: reunión");
  let dump = await store(page);
  ok(dump["leads/lead-b"].etapa === "reunion_agendada", "al completar «Agendar», el lead pasa a «Reunión agendada»");
  ok(dump["tareas/tar-ag"].estado === "hecha" && !!dump["tareas/tar-ag"].hecha, "la tarea de agendar queda hecha");
  const rb = docs(dump, "tareas").find((x) => x.leadId === "lead-b" && x.tipo === "reunion");
  ok(rb && rb.fecha === addDays(T, 4) && rb.hora === "12:00" && rb.duracion === 45 && rb.estado === "pendiente", "y la reunión queda como tarea con día, hora y duración");
  ok(docs(dump, "actividades").some((a) => a.leadId === "lead-b" && a.tipo === "etapa" && a.de === "contactado" && a.a === "reunion_agendada"), "el cambio de etapa queda en el historial");
  await toast(page, "Quedó redactado 1 borrador");
  dump = await store(page);
  const conf = docs(dump, "tareas").find((x) => x.leadId === "lead-b" && x.tipo === "whatsapp" && x.origen === "agendar");
  const bconf = conf && dump["borradores/" + conf.borradorId];
  ok(conf && conf.fecha === T && bconf && bconf.objetivo === "confirmar" && bconf.tareaId === conf.id, "la confirmación queda redactada por Claude, unida a una tarea para hoy");
  const rec = dump["tareas/tar-rec-" + rb.id];
  const antes = (() => { let d = addDays(addDays(T, 4), -1); while ([0, 6].includes(new Date(d + "T12:00:00Z").getUTCDay())) d = addDays(d, -1); return d; })();
  ok(rec && rec.tipo === "whatsapp" && rec.origen === "recordatorio" && rec.reunionId === rb.id && rec.fecha === antes && rec.estado === "pendiente", "queda el recordatorio por WhatsApp el día hábil anterior a la reunión");
  ok(rec && /^Hola Bruno, te escribo para recordarte nuestra reunión (de mañana|del \S+) a las 12:00\. ¡Nos vemos!$/.test(rec.mensaje), "con el mensaje listo, de tú y con la hora");
  ok(await col(page, "reunion_agendada").locator(".kcard.lead", { hasText: "Viña Norte" }).isVisible(), "la tarjeta queda en «Reunión agendada»");
  await page.waitForFunction(() => { const l = window.__mockStore.get("leads/lead-b"); return l.proxima && l.proxima.tareaId && l.proxima.tipo === "whatsapp"; }, null, { timeout: 5000 });
  ok(true, "la «próxima acción» del lead sigue a su primera tarea pendiente");

  /* ---------------- el borrador enviado cumple su tarea ---------------- */
  await card(page, "Viña Norte").locator(".kcard-titulo").click();
  await page.locator("#lead-title", { hasText: "Viña Norte" }).waitFor();
  await page.locator(".tareas-box .task", { hasText: "Confirmar la reunión" }).getByRole("button", { name: "Revisar y enviar" }).click();
  await page.locator("#draft-title", { hasText: "WhatsApp para Bruno Díaz" }).waitFor();
  await page.getByRole("button", { name: "Marcar como enviado" }).click();
  ok(await page.locator(".modal .note", { hasText: "Su tarea queda hecha" }).isVisible(), "al marcarlo como enviado avisa que su tarea queda hecha");
  ok(!(await page.locator(".modal .note label", { hasText: "llamar de seguimiento" }).locator("input").isChecked()), "sin seguimiento extra si el lead ya tiene otra tarea (la reunión)");
  await page.getByRole("button", { name: "Sí, registrar envío" }).click();
  await toast(page, "su tarea quedó hecha");
  dump = await store(page);
  ok(dump["tareas/" + conf.id].estado === "hecha", "la tarea de confirmar queda hecha al enviar el borrador");
  ok(docs(dump, "tareas").filter((x) => x.leadId === "lead-b" && x.estado === "pendiente").map((x) => x.tipo).sort().join(",") === "reunion,whatsapp", "y no se agrega un seguimiento (quedan la reunión y su recordatorio)");

  /* ---------------- tareas a mano en la ficha ---------------- */
  await page.locator("#lead-title", { hasText: "Viña Norte" }).waitFor();
  await page.locator(".tareas-box .sec-head button", { hasText: "Tarea" }).click();
  await page.locator(".task-form .chip", { hasText: "Correo" }).click();
  await page.fill("#tn-titulo", "Mandar el caso de una viña parecida");
  await page.locator(".task-form .btn", { hasText: "Mañana" }).click();
  await page.fill("#tn-hora", "09:30");
  await page.locator(".task-form .btn.primary", { hasText: "Agregar tarea" }).click();
  ok(await visto(page.locator(".tareas-box > .tasks > .task", { hasText: "Mandar el caso de una viña parecida" }).locator(".task-meta", { hasText: "mañana 09:30" })), "se agregan tareas a mano, con día y hora");
  await page.locator(".tareas-box > .tasks > .task", { hasText: "Mandar el caso" }).locator(".task-title button").click();
  await page.fill("#te-titulo", "Mandar el caso de éxito");
  await page.locator(".task-form .btn.primary", { hasText: "Guardar" }).click();
  ok(await visto(page.locator(".tareas-box > .tasks > .task", { hasText: "Mandar el caso de éxito" })), "y se editan tocando su título");
  await page.locator(".tareas-box > .tasks > .task", { hasText: "Mandar el caso de éxito" }).locator(".task-title button").click();
  await page.locator(".task-form .btn.danger", { hasText: "Descartar" }).click();
  await toast(page, "Tarea descartada.");
  ok(await page.locator(".tareas-box details.hechas .task.gone", { hasText: "Mandar el caso de éxito" }).first().waitFor({ state: "attached", timeout: 5000 }).then(() => true, () => false), "o se descartan (quedan en «Hechas y descartadas»)");
  await cerrarFicha(page);

  /* ---------------- la reunión pasada: ¿se hizo? ---------------- */
  await card(page, "Imprenta Sur").locator(".tick").click();
  await page.locator("#hecha-title", { hasText: "¿Se hizo la reunión con Imprenta Sur?" }).waitFor();
  await shot(page, "t03-se-hizo.png");
  await page.locator(".modal .btn.primary", { hasText: "Guardar y registrar la reunión" }).click();
  await page.locator("#lead-title", { hasText: "Imprenta Sur" }).waitFor();
  ok((await page.locator(".work-tabs button[aria-pressed=true]").innerText()).includes("Registrar reunión"), "«Sí, se hizo» abre la ficha en «Registrar reunión»");
  dump = await store(page);
  ok(dump["leads/lead-c"].etapa === "reunion_concretada" && dump["tareas/tar-r"].estado === "hecha", "y el lead pasa a «Reunión concretada» con la reunión hecha");
  ok((await page.locator(".work .field", { hasText: "Resultado" }).count()) === 0, "una reunión no pide el resultado de una llamada");
  await page.fill("#c-notas", "Vimos cómo cotizan hoy: todo por correo y planillas. Quieren una propuesta para ordenar las cotizaciones y los despachos entre bodegas.");
  await page.getByRole("button", { name: "Analizar y guardar" }).click();
  await page.locator(".done-card", { hasText: "Reunión guardada" }).waitFor();
  dump = await store(page);
  const pReunion = (await page.evaluate(() => window.__mockPrompts)).filter((x) => x.includes("Analiza esta reunión")).pop();
  ok(pReunion && pReunion.includes("Después de una reunión que se hizo") && pReunion.includes('"agendar"'), "Claude analiza la reunión con sus reglas (tareas, reunión y etapa)");
  const tc = docs(dump, "tareas").filter((x) => x.leadId === "lead-c" && x.estado === "pendiente");
  ok(tc.some((x) => x.tipo === "propuesta" && x.titulo === "Enviar la propuesta" && x.origen === "reunion") && tc.some((x) => x.tipo === "correo"), "de la reunión salen las tareas: enviar la propuesta y el resumen por correo");
  ok(docs(dump, "actividades").some((a) => a.leadId === "lead-c" && a.tipo === "reunion" && a.analisis && a.analisis.resumen), "la reunión queda en el historial con su análisis");
  ok(dump["leads/lead-c"].etapa === "reunion_concretada", "y el lead sigue en «Reunión concretada»");
  ok(await page.locator(".done-card li", { hasText: "Tarea nueva: Enviar la propuesta" }).isVisible(), "el resumen muestra las tareas nuevas");
  await toast(page, "Quedó redactado 1 borrador");
  await cerrarFicha(page);

  /* ---------------- arrastrar a «Reunión concretada» ---------------- */
  await arrastrar(page, card(page, "Panadería Rivas"), col(page, "reunion_concretada"));
  await toast(page, "Panadería Rivas: Reunión concretada.");
  ok(await page.locator(".toast button", { hasText: "Registrar la reunión" }).isVisible(), "el aviso ofrece registrar la reunión");
  dump = await store(page);
  ok(dump["tareas/tar-g"].estado === "hecha", "arrastrar a «Reunión concretada» da por hecha la reunión");

  /* ---------------- Hoy: completar y deshacer ---------------- */
  await irA(page, "hoy");
  const tareasHoy = page.locator(".lo-que-toca");
  ok(await tareasHoy.locator(".task-group.late", { hasText: "Atrasadas" }).isVisible(), "Hoy separa las tareas atrasadas");
  ok(await tareasHoy.locator(".task", { hasText: "Café Central" }).getByRole("button", { name: "¿Se hizo?" }).isVisible(), "una reunión pasada pide contar si se hizo");
  ok(await tareasHoy.locator(".task", { hasText: "Ferretería Andes" }).getByRole("button", { name: "Llamar" }).isVisible(), "una tarea de llamar trae el botón para llamar");
  await shot(page, "t04-hoy.png");
  await tareasHoy.locator(".task", { hasText: "Taller Norte" }).locator(".tick").click();
  await page.locator("#prop-title", { hasText: "Propuesta enviada a Taller Norte" }).waitFor();
  ok(true, "completar «Enviar propuesta» pide los datos de la propuesta");
  await page.fill("#prop-monto", "3200000");
  await page.locator(".modal .btn.primary", { hasText: "Propuesta enviada" }).click();
  await toast(page, "Taller Norte: Propuesta enviada por $3.200.000 + IVA. Queda una llamada de seguimiento");
  dump = await store(page);
  const seg = docs(dump, "tareas").find((x) => x.leadId === "lead-d" && x.titulo === "Seguimiento de la propuesta");
  ok(dump["leads/lead-d"].etapa === "propuesta" && dump["tareas/tar-p"].estado === "hecha", "al guardarla, el lead pasa a «Propuesta enviada» y la tarea queda hecha");
  ok(dump["leads/lead-d"].valor === 3200000 && dump["leads/lead-d"].propuesta.monto === 3200000 && dump["leads/lead-d"].propuesta.fecha === T, "el monto queda en la propuesta y como valor del lead");
  ok(seg && seg.tipo === "llamar" && seg.fecha === habil(T, 3) && seg.responsable === "nicolas", "y deja la llamada de seguimiento en 3 días hábiles, para quien lo lleva");
  await tareasHoy.locator(".task", { hasText: "Ferretería Andes" }).locator(".tick").click();
  await toast(page, "Hecho: Primera llamada.");
  ok((await store(page))["tareas/tar-a"].estado === "hecha", "una tarea común queda hecha con un clic");
  await page.locator(".toast button", { hasText: "Deshacer" }).click();
  await toast(page, "Listo: quedó como estaba.");
  ok((await store(page))["tareas/tar-a"].estado === "pendiente", "y «Deshacer» la deja pendiente otra vez");

  /* ---------------- la reunión que no se hizo ---------------- */
  await tareasHoy.locator(".task", { hasText: "Café Central" }).getByRole("button", { name: "¿Se hizo?" }).click();
  await page.locator("#hecha-title").waitFor();
  await page.locator(".modal .chip", { hasText: "No se hizo" }).click();
  await page.locator(".modal .btn.primary").click();
  await toast(page, "Café Central: queda la tarea de reagendar la reunión.");
  dump = await store(page);
  ok(dump["tareas/tar-r2"].estado === "descartada" && docs(dump, "tareas").some((x) => x.leadId === "lead-e" && x.tipo === "agendar" && x.titulo === "Reagendar la reunión" && x.fecha === T), "si no se hizo, la reunión se descarta y queda la tarea de reagendarla");

  /* ---------------- no se presentó: reagendar o perdido ---------------- */
  await tareasHoy.locator(".task", { hasText: "Óptica Central" }).getByRole("button", { name: "¿Se hizo?" }).click();
  await page.locator("#hecha-title", { hasText: "Óptica Central" }).waitFor();
  await page.locator(".modal .chip", { hasText: "No se presentó" }).click();
  ok(await page.locator(".modal .chip[aria-pressed=true]", { hasText: "Escribirle para reagendar" }).isVisible(), "«No se presentó» propone, la primera vez, escribirle para reagendar");
  await shot(page, "t09-no-se-presento.png");
  await page.locator(".modal .btn.primary", { hasText: "Guardar" }).click();
  await toast(page, "Óptica Central: queda la tarea de escribirle para reagendar.");
  dump = await store(page);
  ok(dump["tareas/tar-r3"].estado === "descartada" && dump["tareas/tar-r3"].resultado === "no_se_presento" && dump["leads/lead-j"].inasistencias === 1 && dump["leads/lead-j"].etapa === "reunion_agendada", "la reunión queda como «no se presentó», con la inasistencia anotada y el lead en su etapa");
  ok(docs(dump, "actividades").some((a) => a.leadId === "lead-j" && a.tipo === "nota" && String(a.resumen).startsWith("No se presentó a la reunión del")), "y queda en el historial");
  await toast(page, "Quedó redactado 1 borrador");
  dump = await store(page);
  const wr = docs(dump, "tareas").find((x) => x.leadId === "lead-j" && x.tipo === "whatsapp" && x.titulo === "Escribirle para reagendar la reunión");
  ok(wr && wr.fecha === T && wr.borradorId && dump["borradores/" + wr.borradorId] && dump["borradores/" + wr.borradorId].objetivo === "agendar", "queda la tarea de escribirle hoy, con el WhatsApp para reagendar redactado por Claude");
  const pReag = (await page.evaluate(() => window.__mockPrompts)).filter((x) => x.includes("Escribe un mensaje de WhatsApp") && x.includes("No se presentó a la reunión del")).pop();
  ok(pReag && pReag.includes("sin reproche"), "Claude sabe que no se presentó y escribe sin reproche");
  await tareasHoy.locator(".task", { hasText: "Bodega Mella" }).getByRole("button", { name: "¿Se hizo?" }).click();
  await page.locator("#hecha-title", { hasText: "Bodega Mella" }).waitFor();
  await page.locator(".modal .chip", { hasText: "No se presentó" }).click();
  ok(await page.locator(".modal .note", { hasText: "Es la segunda vez que no se presenta" }).isVisible() && await page.locator(".modal .chip[aria-pressed=true]", { hasText: "Darlo por perdido" }).isVisible(), "a la segunda vez, avisa y propone darlo por perdido");
  ok((await page.inputValue("#rh-det")).startsWith("No se presentó a la reunión del"), "con el motivo «No responde» y el detalle ya escritos");
  await page.locator(".modal .btn.primary", { hasText: "Pasar a Perdido" }).click();
  await toast(page, "Bodega Mella: perdido · No responde.");
  dump = await store(page);
  const lk = dump["leads/lead-k"];
  ok(lk.etapa === "perdido" && lk.motivoPerdida === "No responde" && lk.motivoDetalle.startsWith("No se presentó") && lk.inasistencias === 2 && lk.proxima === null && dump["tareas/tar-r4"].estado === "descartada", "y lo pasa a Perdido con su motivo, sin tareas pendientes");

  /* ---------------- «proxima» antigua: se vuelve tarea al editarla ---------------- */
  await tareasHoy.locator(".task", { hasText: "Ferretería Este" }).locator(".task-meta button", { hasText: "Ferretería Este" }).click();
  await page.locator("#lead-title", { hasText: "Ferretería Este" }).waitFor();
  await page.locator(".tareas-box .task", { hasText: "Mandarle el resumen" }).locator(".task-title button").click();
  await page.locator(".task-form .btn.primary", { hasText: "Agregar tarea" }).click();
  await page.waitForFunction(() => { const l = window.__mockStore.get("leads/lead-f"); return l.proxima && l.proxima.tareaId; }, null, { timeout: 5000 });
  ok(true, "al editar una «próxima acción» antigua, queda como tarea y el lead la sigue");
  await cerrarFicha(page);
  await page.close();

  /* ---------------- grabar y que se guarde solo ---------------- */
  const auto = await open({ name: "automático", seed: SEED, mic: { modo: "ok", frases: FRASES, cortar: false } });
  await irA(auto, "embudo");
  await card(auto, "Ferretería Andes").locator('.kact[title="Registrar llamada"]').click();
  await auto.locator("#lead-title", { hasText: "Ferretería Andes" }).waitFor();
  ok(await auto.locator(".work .switch input").isChecked(), "«Automático» viene prendido");
  await auto.getByRole("button", { name: "Transcribir en vivo" }).click();
  await auto.locator(".live.on", { hasText: "Escuchando" }).waitFor();
  await auto.waitForFunction(() => { const t = document.querySelector("#c-trans"); return t && t.value.includes("Mándame la propuesta"); }, null, { timeout: 8000 });
  await auto.getByRole("button", { name: "Detener" }).first().click();
  ok(await visto(auto.locator(".progreso", { hasText: "Claude está leyendo la llamada" }), 4000), "al detener, Claude analiza la llamada solo");
  await auto.locator(".done-card", { hasText: "Llamada guardada con el análisis de Claude" }).waitFor({ timeout: 10000 });
  ok(true, "y se guarda sola, sin tocar nada más");
  await shot(auto, "t05-automatico.png");
  dump = await store(auto);
  const act = docs(dump, "actividades").find((a) => a.leadId === "lead-a" && a.tipo === "llamada");
  ok(act && act.resultado === "contesto" && act.analisis && act.analisis.reunion && act.analisis.reunion.hora === "11:00", "la llamada queda como «Contestó», con su análisis");
  ok(dump["leads/lead-a"].etapa === "reunion_agendada" && dump["leads/lead-a"].ultimoContacto, "con la reunión acordada, el lead pasa solo a «Reunión agendada»");
  ok(dump["tareas/tar-a"].estado === "hecha" && dump["tareas/tar-a"].actividadId === act.id, "la llamada cumple la tarea de llamar que tocaba");
  const ta = docs(dump, "tareas").filter((x) => x.leadId === "lead-a" && x.estado === "pendiente");
  ok(ta.some((x) => x.tipo === "reunion" && x.hora === "11:00") && ta.some((x) => x.tipo === "propuesta") && ta.some((x) => x.tipo === "correo"), "quedan las tareas: la reunión con su hora, la propuesta y el correo");
  ok(!ta.some((x) => x.titulo.includes("planilla")), "lo que quedó en hacer el lead no es tarea de ZH");
  ok(await auto.locator(".done-card li", { hasText: "Etapa: Por contactar → Reunión agendada" }).isVisible(), "el resumen dice a qué etapa pasó");
  await toast(auto, "Quedó redactado 1 borrador");
  dump = await store(auto);
  const tcor = docs(dump, "tareas").find((x) => x.leadId === "lead-a" && x.tipo === "correo");
  ok(tcor && tcor.borradorId && dump["borradores/" + tcor.borradorId] && dump["borradores/" + tcor.borradorId].estado === "por_revisar", "el correo acordado queda redactado, unido a su tarea, para revisar y enviar");
  const pLl = (await auto.evaluate(() => window.__mockPrompts)).filter((x) => x.includes("Analiza esta llamada")).pop();
  ok(pLl && pLl.includes('"reunion": {"fecha"') && pLl.includes("Hoy es ") && pLl.includes("hecha en vivo con el micrófono"), "Claude recibe la fecha de hoy y pide la reunión con día y hora");
  ok((await auto.evaluate(() => localStorage.getItem("zhcrm:llamada:lead-a"))) === null, "lo recuperable se borra al guardar");
  await cerrarFicha(auto);

  /* ---------------- «no me interesa»: Claude sugiere, no mueve ---------------- */
  await card(auto, "Fletes Paz").locator('.kact[title="Registrar llamada"]').click();
  await auto.locator("#lead-title", { hasText: "Fletes Paz" }).waitFor();
  await auto.getByRole("button", { name: "Contestó", exact: true }).click();
  await auto.fill("#c-notas", "Dijo que no me interesa, que ya lo resolvieron con su contador.");
  await auto.getByRole("button", { name: "Analizar y guardar" }).click();
  await auto.locator(".done-card", { hasText: "Claude sugiere pasarlo a «Perdido»" }).waitFor({ timeout: 10000 });
  ok((await store(auto))["leads/lead-h"].etapa === "contactado", "si Claude sugiere «Perdido», lo propone en vez de moverlo solo");
  await auto.locator(".done-card button", { hasText: "Pasar a Perdido" }).click();
  await auto.locator(".modal", { hasText: "Perdido: Hugo Paz" }).waitFor();
  ok(true, "y con un clic se pasa a Perdido con su motivo");
  await auto.keyboard.press("Escape");
  await auto.locator(".modal").waitFor({ state: "detached" });
  await cerrarFicha(auto);

  /* ---------------- quedaron en reunirse, sin día: tarea de agendar ---------------- */
  await card(auto, "Clínica Lagos").locator('.kact[title="Registrar llamada"]').click();
  await auto.locator("#lead-title", { hasText: "Clínica Lagos" }).waitFor();
  await auto.getByRole("button", { name: "Contestó", exact: true }).click();
  await auto.fill("#c-notas", "Le interesa una demo. Quedé en que te escribo para agendar la próxima semana.");
  await auto.getByRole("button", { name: "Analizar y guardar" }).click();
  await auto.locator(".done-card").waitFor({ timeout: 10000 });
  dump = await store(auto);
  ok(dump["leads/lead-i"].etapa === "contactado" && docs(dump, "tareas").some((x) => x.leadId === "lead-i" && x.tipo === "agendar" && x.fecha === T), "si quedaron en reunirse sin día, queda la tarea de agendar (para hoy) y el lead en «Contactado»");
  await cerrarFicha(auto);

  /* ---------------- no contestó: la tarea de llamar se cumple y queda otra ---------------- */
  await irA(auto, "embudo");
  await card(auto, "Ferretería Andes").waitFor();
  dump = await store(auto);
  await auto.close();

  /* ---------------- modo oscuro ---------------- */
  const dark = await open({ name: "oscuro", seed: SEED, dark: true });
  await irA(dark, "embudo");
  await dark.locator("h1", { hasText: "Embudo de leads" }).waitFor();
  await shot(dark, "t06-embudo-oscuro.png");
  await irA(dark, "hoy");
  await shot(dark, "t07-hoy-oscuro.png");
  await dark.close();

  /* ---------------- teléfono ---------------- */
  const phone = await open({ name: "teléfono", seed: SEED, viewport: { width: 390, height: 844 } });
  const r = await phone.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: window.innerWidth }));
  ok(r.sw <= r.w + 1, `teléfono, Hoy con tareas: sin scroll horizontal (${r.sw} <= ${r.w})`);
  await shot(phone, "t08-movil-hoy.png");
  await phone.close();

  await browser.close();
  console.log(notes.join("\n"));
  if (errors.length) { console.error("\n" + errors.join("\n")); process.exit(1); }
  console.log(`\nTodo bien. Capturas en ${OUT}`);
})().catch((e) => { console.error(e); console.error(errors.join("\n")); process.exit(1); });
