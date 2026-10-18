/* Prueba de las reuniones transcritas con ZH Reuniones (el conector propio: recibe las transcripciones
   que manda TranscripTonic, la extensión de Chrome que guarda los subtítulos de Google Meet), con
   Playwright, el mock de window.claude, Google Calendar simulado y ZH Reuniones simulado. Recorre: el
   CRM anota en meets/ las próximas reuniones con Meet de leads y clientes (no las internas); Hoy lista
   las transcripciones por registrar, unidas a su lead o cliente por la hora y el título, junta las
   copias de una misma reunión y no muestra las internas ni las ya registradas; «Registrar» abre la
   ficha del lead con la transcripción y Claude arma el plan (con quién habla por ZH), y al confirmar
   queda la reunión con su hora real y la transcripción registrada (y su copia, como repetida); la de
   un cliente abre su acta, con las tareas de ZH (con responsable) y la próxima reunión en Google
   Calendar con Meet; una reunión sin asociar se asigna a un lead y una mal unida se cambia; descartar
   y deshacer; Ajustes y los estados sin permiso, sin conector y sin la base; teléfono y modo oscuro.
   Usa datos inventados.

   Uso:
     python3 crm/dev/build_preview.py
     NODE_PATH=$(npm root -g) VENDOR_DIR=<carpeta con preact.umd.min.js, hooks.umd.min.js, htm.umd.min.js> \
       node crm/dev/reuniones.cjs [carpeta-de-capturas]
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
const hmFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const T = keyFmt.format(new Date());
const addDays = (k, n) => { const d = new Date(k + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const iso = (n) => new Date(Date.now() + n * 864e5).toISOString();
const haceMin = (m) => new Date(Date.now() - m * 6e4).toISOString();
const fmtCL = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
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
  start: o.start || { dateTime: chile(o.fecha, o.hora), timeZone: TZ }, end: o.end || { dateTime: chile(o.fecha, o.fin), timeZone: TZ },
  ...o,
});
const yo = { email: CUENTA, self: true, responseStatus: "accepted" };
const lead = (o) => ({ cargo: "", correo: "", telefono: "", origen: "prospeccion", trato: "tu", intentos: 0, proxima: null, prioridad: "media", necesidad: "", responsable: "lorenzo", etapa: "contactado", creado: iso(-10), actualizado: iso(-1), creadoPor: ME, ...o });

/* Las transcripciones, como las entrega el servidor (reuniones/lib/reuniones.js): el título es el de la
   reunión en Meet. T1b es la copia de T1 que guardó otra persona (entró 3 minutos después). */
const tr = (id, titulo, desde, hasta, n, codigo = "") => ({ id, titulo, codigo, software: "Google Meet", inicio: haceMin(desde), fin: haceMin(hasta), estado: "lista", participantes: [], intervenciones: n });
const T1 = tr("tt-lead1-a1a1a1a1", "Diagnóstico · Ferretería Andes y ZH Development", 180, 140, 4);
const T1b = tr("tt-lead1b-b1b1b1b1", "Diagnóstico · Ferretería Andes y ZH Development", 177, 141, 2);
const T2 = tr("tt-cli2-c2c2c2c2", "Avance semanal · Logística Sur", 26 * 60, 26 * 60 - 35, 4);
const T3 = tr("tt-sin3-d3d3d3d3", "Conversación con Bruno", 300, 270, 2);
const T4 = tr("tt-int4-e4e4e4e4", "Planificación del equipo", 118, 92, 6);
const T5 = tr("tt-vieja5-f5f5f5f5", "Diagnóstico · Imprenta Sur y ZH Development", 4000, 3970, 3);
const T6 = tr("tt-vieja6-a6a6a6a6", "Diagnóstico · Imprenta Sur y ZH Development", 3998, 3971, 2);
const TEXTOS = {
  [T1.id]: { participantes: ["Contacto ZH Development", "Andrea Fuentes"], intervenciones: 4, texto: "Contacto ZH Development: Hola Andrea, gracias por el tiempo. Cuéntanos cómo coordinan hoy los despachos.\nAndrea Fuentes: Hoy todo va por planillas y WhatsApp, y se nos pierden pedidos.\nContacto ZH Development: Entiendo. Te mandamos una propuesta esta semana con alcance, plazo y precio.\nAndrea Fuentes: Perfecto, y yo te mando la planilla de despachos." },
  [T2.id]: { participantes: ["Contacto ZH Development", "Marcela Rojas"], intervenciones: 4, texto: "Contacto ZH Development: Marcela, ¿cómo vieron el diseño?\nMarcela Rojas: Lo aprobamos. Necesitamos exportar el reporte de ventas a Excel.\nContacto ZH Development: Eso lo cotizamos aparte. Te mando el calendario de pruebas el lunes.\nMarcela Rojas: Perfecto. Nos vemos en una semana, a las 15:00." },
  [T3.id]: { participantes: ["Nicolás", "Bruno Díaz"], intervenciones: 2, texto: "Nicolás: Hola, ¿me escuchan bien?\nBruno Díaz: Sí, perfecto. Queremos ver con calma lo de las bodegas de la viña, porque hoy todo se anota en papel y se pierde." },
};
const fechaT1 = keyFmt.format(new Date(T1.inicio));
const MEET1 = "https://meet.google.com/ddd-eeee-fff";
const ID1 = `ddd-eeee-fff~${fechaT1}`;
const ID2 = `ggg-hhhh-iii~${keyFmt.format(new Date(T2.inicio))}`;
const ID5 = `jjj-kkkk-lll~${keyFmt.format(new Date(T5.inicio))}`;
const EVENTOS = [
  /* Próximas, con un lead y con un cliente: quedan anotadas en meets/. */
  evento({ id: "evfutura1", summary: "Revisión de propuesta · Ferretería Andes y ZH Development", fecha: addDays(T, 1), hora: "10:00", fin: "10:30", conferenceUrl: "https://meet.google.com/aaa-bbbb-ccc",
    attendees: [yo, { email: "andrea@ferreteriaandes.cl", displayName: "Andrea Fuentes", responseStatus: "accepted" }] }),
  evento({ id: "evcliente1", summary: "Avance del proyecto · Logística Sur", fecha: addDays(T, 2), hora: "15:00", fin: "15:45", conferenceUrl: "https://meet.google.com/ppp-qqqq-rrr",
    attendees: [yo, { email: "marcela@logisticasur.cl", displayName: "Marcela Rojas", responseStatus: "accepted" }] }),
  /* La organizó otra cuenta, con un lead: también se anota (la extensión transcribe igual). */
  evento({ id: "evajena1", summary: "Reunión · Viña Norte", fecha: addDays(T, 3), hora: "11:00", fin: "11:30", conferenceUrl: "https://meet.google.com/sss-tttt-uuu", organizer: { email: "socio@zhdevelopment.cl" }, creator: { email: "socio@zhdevelopment.cl" },
    attendees: [{ email: "socio@zhdevelopment.cl", organizer: true, responseStatus: "accepted" }, yo, { email: "bruno@vinanorte.cl", responseStatus: "needsAction" }] }),
  /* Solo el equipo: no se anota, y su transcripción (T4, de hace un rato) no se muestra. */
  evento({ id: "evinterno1", summary: "Planificación semanal", start: { dateTime: haceMin(120), timeZone: TZ }, end: { dateTime: haceMin(90), timeZone: TZ }, conferenceUrl: "https://meet.google.com/vvv-wwww-xxx",
    attendees: [yo, { email: EQUIPO[0], responseStatus: "accepted" }, { email: EQUIPO[1], responseStatus: "accepted" }] }),
];

const SEED = {
  ["equipo/" + ME]: { nombre: "Lorenzo Bozzo", cargo: "Socio", telefono: "+56955551234", correo: "" },
  "config/general": { agendaUrl: "https://zhdevelopment.cl/#agendar", gmailCuenta: CUENTA, correosEquipo: EQUIPO },
  "leads/lead-a": lead({ nombre: "Andrea Fuentes", empresa: "Ferretería Andes", telefono: "+56922220001", correo: "andrea@ferreteriaandes.cl", etapa: "reunion_agendada" }),
  "tareas/tar-reu-a": { leadId: "lead-a", tipo: "reunion", titulo: "Diagnóstico", fecha: fechaT1, hora: hmFmt.format(new Date(T1.inicio)), duracion: 40, estado: "pendiente", responsable: "lorenzo", origen: "calendario", nota: "",
    evento: { id: "evpasado1", link: "", meet: MEET1, respuesta: "accepted", actualizado: ANTES, propio: true, organizador: CUENTA }, creado: iso(-3), actualizado: iso(-3), creadoPor: ME },
  "leads/lead-b": lead({ nombre: "Bruno Díaz", empresa: "Viña Norte", telefono: "+56922220002", correo: "bruno@vinanorte.cl" }),
  "leads/lead-c": lead({ nombre: "Clara Soto", empresa: "Imprenta Sur", telefono: "+56922220003", correo: "clara@imprentasur.cl" }),
  "clientes/cli-1": { nombre: "Logística Sur", razonSocial: "Logística Sur SpA", rut: "", rubro: "Logística", ciudad: "Santiago", contactos: [{ id: "ct-1", nombre: "Marcela Rojas", cargo: "Gerenta de operaciones", correo: "marcela@logisticasur.cl", telefono: "+56933330001", rol: "decisor", principal: true }],
    responsable: "lorenzo", trato: "tu", estado: "activo", notas: "", leadIds: [], creado: iso(-60), actualizado: iso(-2), creadoPor: ME },
  "proyectos/pro-1": { clienteId: "cli-1", nombre: "Portal de despachos", tipo: "software", valor: 4500000, estado: "construir", inicio: addDays(T, -40), entregaEstimada: addDays(T, 30), produccion: "", garantiaDias: 60, hitos: [], enlaces: [], responsable: "lorenzo", creado: iso(-40), actualizado: iso(-2), creadoPor: ME },
  /* Lo que el CRM ya anotó antes (una por reunión y día): así se sabe de quién es cada transcripción. */
  ["meets/" + ID1]: { codigo: "ddd-eeee-fff", eventoId: "evpasado1", titulo: "Diagnóstico · Ferretería Andes y ZH Development", inicio: haceMin(180), fin: haceMin(140), leadId: "lead-a", clienteId: null },
  ["meets/" + ID2]: { codigo: "ggg-hhhh-iii", eventoId: "evpasado2", titulo: "Avance semanal · Logística Sur", inicio: T2.inicio, fin: T2.fin, leadId: null, clienteId: "cli-1" },
  ["meets/" + ID5]: { codigo: "jjj-kkkk-lll", eventoId: "evpasado5", titulo: "Diagnóstico · Imprenta Sur y ZH Development", inicio: T5.inicio, fin: T5.fin, leadId: "lead-c", clienteId: null },
  /* Una ya registrada: ni ella ni otra copia de esa reunión (T6) vuelven a aparecer. */
  ["transcripciones/tr-" + T5.id]: { transcripcion: T5.id, codigo: "jjj-kkkk-lll", inicio: T5.inicio, fin: T5.fin, reunion: "m:" + ID5, estado: "registrada", leadId: "lead-c", clienteId: null, actividadId: "act-x" },
};
const REU = { modo: "ok", transcripciones: [T1, T1b, T2, T3, T4, T5, T6], textos: TEXTOS };

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
    await page.addInitScript((o) => { window.__MOCK_SEED = o.seed; window.__MOCK_RECORDATORIOS = false; window.__MOCK_MCP = o.mcp; if (o.reu) window.__MOCK_REU = o.reu; }, { seed: opts.seed || SEED, mcp: opts.mcp || null, reu: opts.reu || null });
    /* Cada aviso queda anotado (con Claude simulado, uno puede reemplazar a otro en un instante). */
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
  const prompts = (page) => page.evaluate(() => window.__mockPrompts || []);
  const cerrarFicha = async (page) => { await page.keyboard.press("Escape"); await page.locator(".drawer").waitFor({ state: "detached" }); };
  const grupoDe = (page) => page.locator('.hoy-grupo[aria-label="Reuniones transcritas"]');
  const fila = (page, texto) => grupoDe(page).locator(".trans", { hasText: texto });

  /* ---------------- Hoy y las reuniones anotadas ---------------- */
  const page = await open({ name: "reuniones", mcp: { modo: "ok", eventos: EVENTOS }, reu: REU });
  const grupo = grupoDe(page);
  await grupo.waitFor({ timeout: 10000 });
  ok((await grupo.locator(".task-group").innerText()).includes("Reuniones transcritas · 3"), "Hoy cuenta las 3 reuniones transcritas por registrar");
  ok(await fila(page, "Ferretería Andes").isVisible() && await fila(page, "Logística Sur").isVisible(), "cada una unida a su lead o a su cliente, por la hora y el título");
  ok((await fila(page, "Ferretería Andes").count()) === 1, "las dos copias de la misma reunión se muestran una vez");
  ok(await fila(page, "Reunión sin asociar").getByRole("button", { name: "Asignar" }).isVisible() && await fila(page, "Reunión sin asociar").locator(".muted", { hasText: "Conversación con Bruno" }).isVisible(), "la que el CRM no reconoce se asigna, con el título que tenía en Meet");
  ok((await grupo.locator(".trans").count()) === 3, "la interna, la ya registrada y la copia de esa no aparecen");
  ok((await page.locator(".lede").innerText()).includes("3 reuniones transcritas por registrar"), "el resumen de Hoy las menciona");
  await shot(page, "t01-hoy.png");

  const fA = `meets/aaa-bbbb-ccc~${addDays(T, 1)}`;
  const fC = `meets/ppp-qqqq-rrr~${addDays(T, 2)}`;
  const fB = `meets/sss-tttt-uuu~${addDays(T, 3)}`;
  await page.waitForFunction((ks) => ks.every((k) => window.__mockStore.has(k)), [fA, fC, fB], { timeout: 15000 }).catch(() => {});
  let dump = await store(page);
  const mA = dump[fA] || {};
  const mC = dump[fC] || {};
  ok(mA.leadId === "lead-a" && mA.eventoId === "evfutura1" && mA.codigo === "aaa-bbbb-ccc" && mC.clienteId === "cli-1" && !("estado" in mA), "meets/ anota cada próxima reunión con Meet, con su lead o su cliente, sin llamar al servidor");
  ok((dump[fB] || {}).leadId === "lead-b", "también la que organizó otra cuenta");
  ok(!Object.keys(dump).some((k) => k.startsWith("meets/vvv-wwww-xxx")), "pero no la del equipo solo");
  ok((await page.locator('section[aria-label="Calendario"] .resp', { hasText: "transcribe" }).count()) === 0, "el calendario ya no dice si se transcribe (depende de quién entre con la extensión)");
  ok((await llamadas(page, "preparar_reunion")).length === 0, "y nada intenta prender la transcripción");

  /* ---------------- registrar la de un lead: el plan con la transcripción ---------------- */
  await fila(page, "Ferretería Andes").getByRole("button", { name: "Registrar" }).click();
  await page.locator("#lead-title", { hasText: "Ferretería Andes" }).waitFor();
  await page.locator(".work .plan").waitFor({ timeout: 10000 });
  ok((await page.locator(".work .meet-nota").innerText()).includes("guardados con TranscripTonic"), "la ficha dice de dónde salió la transcripción");
  let ps = await prompts(page);
  const pR = ps.find((p) => p.includes("Analiza esta reunión") && p.includes("se nos pierden pedidos"));
  ok(pR && pR.includes("de los subtítulos de Google Meet") && pR.includes("Por ZH hablan Lorenzo, Nicolás") && pR.includes("y quien entró con la cuenta de ZH (su nombre lleva «ZH Development»)") && pR.includes("«You» o «Tú» es quien guardó la transcripción") && pR.includes("participaron Contacto ZH Development, Andrea Fuentes"), "Claude recibe la transcripción y sabe quién habla por ZH");
  dump = await store(page);
  ok(!docs(dump, "actividades").some((a) => a.leadId === "lead-a" && a.tipo === "reunion") && !dump["transcripciones/tr-" + T1.id], "armar el plan no guarda nada");
  ok((await page.inputValue("#pl-dur")) === "40" && (await page.inputValue("#pl-etapa")) === "reunion_concretada", "la duración sale de la reunión y la etapa es «Reunión concretada»");
  await shot(page, "t02-plan-meet.png");
  await page.getByRole("button", { name: "Confirmar y guardar" }).click();
  await page.locator(".done-card", { hasText: "Reunión guardada con el análisis de Claude" }).waitFor({ timeout: 10000 });
  dump = await store(page);
  const actR = docs(dump, "actividades").find((a) => a.leadId === "lead-a" && a.tipo === "reunion");
  ok(actR && actR.meet && actR.meet.codigo === "ddd-eeee-fff" && actR.meet.transcripcion === T1.id && !("doc" in actR.meet) && actR.fecha === T1.inicio && actR.duracion === 40, "la reunión queda con su hora real, la duración y el código de Meet de la reunión anotada");
  ok(actR && !actR.transcripcion && actR.analisis && actR.meet.participantes.join("|") === "Contacto ZH Development|Andrea Fuentes", "con el análisis y quién participó, sin la transcripción completa");
  const regA = dump["transcripciones/tr-" + T1.id] || {};
  ok(regA.estado === "registrada" && regA.leadId === "lead-a" && actR && regA.actividadId === actR.id && regA.reunion === "m:" + ID1, "la transcripción queda registrada, unida a la actividad y a la reunión");
  const regB = dump["transcripciones/tr-" + T1b.id] || {};
  ok(regB.estado === "repetida" && regB.repetidaDe === T1.id, "y su copia, como repetida");
  ok(dump["tareas/tar-reu-a"].estado === "hecha", "la tarea de esa reunión queda hecha");
  ok(docs(dump, "tareas").some((x) => x.leadId === "lead-a" && x.tipo === "reunion" && x.estado === "pendiente" && x.fecha === addDays(T, 1)), "y la de mañana sigue pendiente");
  ok(dump["leads/lead-a"].etapa === "reunion_concretada" && docs(dump, "tareas").some((x) => x.leadId === "lead-a" && x.tipo === "propuesta" && x.estado === "pendiente"), "el lead pasa a «Reunión concretada» con la tarea de la propuesta");
  ok(await page.locator(".historial .feed-title", { hasText: "Reunión por Meet · 40 min" }).isVisible() && (await page.locator(".historial .feed-doc").count()) === 0, "el historial la muestra como reunión por Meet");
  await cerrarFicha(page);
  ok((await fila(page, "Ferretería Andes").count()) === 0, "ya no está en «Reuniones transcritas», ni su copia");

  /* ---------------- una mal unida se cambia ---------------- */
  await fila(page, "Logística Sur").getByRole("button", { name: "No es de aquí" }).click();
  await page.locator(".modal", { hasText: "¿De quién es esta reunión?" }).waitFor();
  ok(await page.locator(".modal", { hasText: "Avance semanal · Logística Sur" }).isVisible(), "«No es de aquí» abre el selector para registrarla en otro lead o cliente");
  await page.locator(".modal").getByRole("button", { name: "Cancelar" }).click();
  await page.locator(".modal").waitFor({ state: "detached" });

  /* ---------------- registrar la de un cliente: el acta, las tareas y la próxima reunión ---------------- */
  await fila(page, "Logística Sur").getByRole("button", { name: "Registrar" }).click();
  await page.locator("#cli-title", { hasText: "Logística Sur" }).waitFor();
  await page.locator(".work .analysis").waitFor({ timeout: 10000 });
  ps = await prompts(page);
  const pA = ps.find((p) => p.includes("Ordena las notas de una reunión") && p.includes("TRANSCRIPCIÓN DE LA REUNIÓN POR GOOGLE MEET (subtítulos) del") && p.includes("Lo aprobamos"));
  ok(pA && pA.includes("Por ZH hablan Lorenzo, Nicolás") && pA.includes("Los demás son del cliente"), "Claude arma el acta con la transcripción");
  ok((await page.locator(".work .acta-tarea .t-tit").first().inputValue()) === "Enviar el calendario de pruebas" && (await page.locator(".work .acta-tarea .t-fecha").first().inputValue()) === addDays(T, 2), "lo que quedó en hacer ZH llega como tarea, con su día");
  ok((await page.locator(".work .acta-tarea .t-tipo").first().inputValue()) === "lorenzo", "con el responsable del cliente");
  ok((await page.inputValue("#ac-r-fecha")) === addDays(T, 7) && (await page.inputValue("#ac-r-hora")) === "15:00", "y la próxima reunión con su día y hora");
  ok(await page.locator(".work .plan-nota", { hasText: `Se crea en el Google Calendar de ${CUENTA}, con Meet. Invitados: marcela@logisticasur.cl, ${EQUIPO.join(", ")}.` }).isVisible(), "dice dónde se crea y a quién invita");
  await page.locator(".work .acta-tarea .t-tipo").first().selectOption("nicolas");
  await page.locator(".work .acta-tareas").scrollIntoViewIfNeeded();
  await shot(page, "t03-acta-cliente.png");
  await page.locator(".work").getByRole("button", { name: "Guardar", exact: true }).click();
  ok(await toast(page, "Registrado · 1 tarea de ZH · 1 solicitud creada en Soporte."), "al guardar, el aviso cuenta la tarea y la solicitud");
  ok(await toast(page, "quedó en Google Calendar con Meet y Google le mandó la invitación a marcela@logisticasur.cl"), "y que la próxima reunión quedó en el calendario");
  const ce = (await llamadas(page, "create_event")).pop() || {};
  const ci = ce.input || {};
  ok(ci.calendarId === CUENTA && ci.addGoogleMeetUrl === true && ci.summary === "Reunión de seguimiento · Logística Sur y ZH Development" && ci.startTime === `${addDays(T, 7)}T15:00:00`, "la próxima reunión se crea en el calendario de la cuenta de ZH, con Meet");
  ok(JSON.stringify(ci.attendees) === JSON.stringify([{ email: "marcela@logisticasur.cl", displayName: "Marcela Rojas" }, ...EQUIPO.map((email) => ({ email }))]), "invita al contacto principal y al equipo");
  ok(String(ci.description || "").includes("Transcribimos la reunión para registrar los acuerdos."), "la invitación avisa que la reunión se transcribe");
  dump = await store(page);
  const tc = docs(dump, "tareas").find((x) => x.clienteId === "cli-1" && !x.leadId);
  ok(tc && tc.titulo === "Enviar el calendario de pruebas" && tc.responsable === "nicolas" && tc.fecha === addDays(T, 2) && tc.origen === "reunion" && tc.proyectoId === "pro-1", "la tarea de ZH queda en el cliente, con el responsable elegido");
  const actC = docs(dump, "actividades").find((a) => a.clienteId === "cli-1" && a.tipo === "reunion");
  ok(actC && actC.meet && actC.meet.codigo === "ggg-hhhh-iii" && actC.acta && !("tareasZH" in actC.acta) && actC.resumen.startsWith("Revisamos el avance del diseño") && actC.fecha === T2.inicio, "la reunión queda con el acta, su hora real y el resumen del acta");
  ok((dump["transcripciones/tr-" + T2.id] || {}).clienteId === "cli-1" && docs(dump, "solicitudes").some((s) => s.titulo === "Agregar exportación a Excel" && s.canal === "reunion"), "la transcripción queda registrada y la solicitud en Soporte");
  const box = page.locator('.drawer .tareas-box[aria-label="Tareas de ZH"]');
  ok(await box.locator(".task", { hasText: "Enviar el calendario de pruebas" }).isVisible(), "la ficha del cliente muestra sus tareas de ZH");
  await box.locator(".task", { hasText: "Enviar el calendario de pruebas" }).locator(".tick").click();
  ok(await toast(page, "Hecho: Enviar el calendario de pruebas."), "una tarea del cliente se completa con un toque");
  await page.locator(".toast button", { hasText: "Deshacer" }).click();
  await page.waitForFunction((id) => (window.__mockStore.get("tareas/" + id) || {}).estado === "pendiente", tc ? tc.id : "", { timeout: 5000 }).catch(() => {});
  ok(((await store(page))["tareas/" + (tc ? tc.id : "")] || {}).estado === "pendiente", "y se puede deshacer");
  await cerrarFicha(page);

  /* ---------------- una reunión sin asociar: se asigna a un lead; descartar y deshacer ---------------- */
  await fila(page, "Reunión sin asociar").getByRole("button", { name: "Asignar" }).click();
  await page.locator(".modal", { hasText: "¿De quién es esta reunión?" }).waitFor();
  await page.fill("#at-q", "viña");
  ok((await page.locator(".modal .lrow-main").count()) === 1, "el buscador filtra leads y clientes");
  await page.locator(".modal .lrow-main", { hasText: "Viña Norte" }).click();
  await page.locator("#lead-title", { hasText: "Viña Norte" }).waitFor();
  await page.locator(".work .plan").waitFor({ timeout: 10000 });
  ok(await page.locator(".work .meet-nota").isVisible(), "se abre la ficha del lead elegido con la transcripción y el plan");
  await page.locator(".work .plan").getByRole("button", { name: "Cancelar" }).click();
  await cerrarFicha(page);
  ok(await fila(page, "Reunión sin asociar").isVisible(), "si se cancela, sigue por registrar");
  await fila(page, "Reunión sin asociar").getByRole("button", { name: "Descartar la transcripción" }).click();
  ok(await toast(page, "Transcripción descartada"), "se puede descartar (por ejemplo, una reunión interna)");
  await fila(page, "Reunión sin asociar").waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
  ok((await fila(page, "Reunión sin asociar").count()) === 0 && ((await store(page))["transcripciones/tr-" + T3.id] || {}).estado === "descartada", "y queda anotada como descartada");
  await page.locator(".toast button", { hasText: "Deshacer" }).click();
  await fila(page, "Reunión sin asociar").waitFor({ timeout: 5000 }).catch(() => {});
  ok(await fila(page, "Reunión sin asociar").isVisible(), "deshacer la devuelve a la lista");

  /* ---------------- Ajustes ---------------- */
  await irA(page, "ajustes");
  const aj = page.locator('section[aria-label="Transcripción de reuniones"]');
  await aj.waitFor();
  ok(/Conectado: llegaron 7 transcripciones en los últimos 14 días/.test(await aj.innerText()), "Ajustes dice que ZH Reuniones está conectado y cuántas transcripciones llegaron");
  ok((await aj.innerText()).includes("TranscripTonic") && (await aj.innerText()).includes("docs/reuniones-transcripcion.md"), "explica lo de la extensión y dónde está la guía");
  await aj.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await shot(page, "t04-ajustes.png");
  await page.context().close();

  /* ---------------- sin permiso, sin conector y sin la base ---------------- */
  const apr = await open({ name: "permiso", mcp: { modo: "ok", eventos: [] }, reu: { modo: "aprobacion", transcripciones: [T3], textos: TEXTOS } });
  await irA(apr, "ajustes");
  const ajA = apr.locator('section[aria-label="Transcripción de reuniones"]');
  await ajA.locator(".reu-aviso", { hasText: "Falta tu permiso para que este CRM use ZH Reuniones." }).waitFor({ timeout: 8000 });
  await ajA.getByRole("button", { name: "Permitir ZH Reuniones" }).click();
  await ajA.locator(".cal-pie", { hasText: "Conectado: llegó 1 transcripción" }).waitFor({ timeout: 8000 }).catch(() => {});
  ok(await ajA.locator(".cal-pie", { hasText: "Conectado: llegó 1 transcripción" }).isVisible(), "sin permiso, «Permitir ZH Reuniones» lo conecta");
  await apr.context().close();

  const sinCon = await open({ name: "sin-conector", mcp: { modo: "ok", eventos: EVENTOS } });
  ok((await grupoDe(sinCon).count()) === 0, "sin el conector, Hoy no muestra reuniones transcritas");
  await irA(sinCon, "ajustes");
  const ajS = sinCon.locator('section[aria-label="Transcripción de reuniones"] .reu-aviso');
  await ajS.waitFor({ timeout: 8000 });
  ok((await ajS.innerText()).includes("ZH Reuniones no está conectado en tu cuenta de claude.ai") && (await ajS.innerText()).includes("https://zh-reuniones.vercel.app/mcp"), "Ajustes dice cómo agregar el conector, con su dirección");
  await sinCon.waitForTimeout(3500);
  ok(!Object.keys(await store(sinCon)).some((k) => k.startsWith("meets/aaa-bbbb-ccc") || k.startsWith("meets/ppp-qqqq-rrr")), "y no anota reuniones mientras no está conectado");
  await sinCon.context().close();

  const sinBase = await open({ name: "sin-base", mcp: { modo: "ok", eventos: [] }, reu: { modo: "error", transcripciones: [], textos: {} } });
  await irA(sinBase, "ajustes");
  const ajC = sinBase.locator('section[aria-label="Transcripción de reuniones"] .reu-aviso');
  await ajC.waitFor({ timeout: 8000 });
  ok((await ajC.innerText()).includes("Falta crear la base de ZH Reuniones en Vercel"), "si falta la base del servidor, Ajustes lo dice");
  ok((await ajC.locator("a", { hasText: "Abrir ZH Reuniones" }).getAttribute("href")) === "https://zh-reuniones.vercel.app", "con el enlace a la página del servidor");
  await sinBase.context().close();

  /* ---------------- teléfono y modo oscuro ---------------- */
  const tel = await open({ name: "teléfono", viewport: { width: 390, height: 844 }, touch: true, mcp: { modo: "ok", eventos: EVENTOS }, reu: REU });
  await grupoDe(tel).waitFor({ timeout: 10000 });
  await grupoDe(tel).scrollIntoViewIfNeeded();
  ok(await tel.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "en el teléfono, Hoy con las reuniones transcritas cabe sin desplazarse hacia el lado");
  await shot(tel, "t05-hoy-telefono.png");
  await fila(tel, "Logística Sur").getByRole("button", { name: "Registrar" }).click();
  await tel.locator(".work .analysis").waitFor({ timeout: 10000 });
  await tel.locator(".work .acta-tarea").first().scrollIntoViewIfNeeded();
  ok(await tel.evaluate(() => document.querySelector(".drawer-body").scrollWidth <= document.querySelector(".drawer-body").clientWidth + 1), "y el acta del cliente también");
  await shot(tel, "t06-acta-telefono.png");
  await tel.context().close();

  const dark = await open({ name: "oscuro", dark: true, mcp: { modo: "ok", eventos: EVENTOS }, reu: REU });
  await grupoDe(dark).waitFor({ timeout: 10000 });
  await shot(dark, "t07-hoy-oscuro.png");
  await dark.context().close();

  await browser.close();
  for (const n of notes) console.log(n);
  if (errors.length) { for (const e of errors) console.log(e); process.exit(1); }
  console.log("\nTodo bien. Capturas en " + OUT);
})().catch((e) => { console.error(e); process.exit(1); });
