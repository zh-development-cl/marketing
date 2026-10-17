/* Prueba de la ficha ordenada y de Hoy como una sola lista, con Playwright y el mock de
   window.claude. Recorre: arriba de la ficha, «En qué va» y «Qué hacer» de Claude, guardado en
   `resumenes` y pedido de nuevo solo cuando hay algo nuevo; sin historial o sin Claude, desde los
   datos; el dolor y el guion plegables; el historial corto con «Ver todos»; y en Hoy, «Lo que toca»
   con sus grupos (atrasadas, hoy, por revisar, clientes, los que se enfrían y los próximos 7 días
   plegados, recordando si se abrieron), la columna de al lado, teléfono y modo oscuro. Usa datos
   inventados.

   Uso:
     python3 crm/dev/build_preview.py
     NODE_PATH=$(npm root -g) VENDOR_DIR=<carpeta con preact.umd.min.js, hooks.umd.min.js, htm.umd.min.js> \
       node crm/dev/ahora.cjs [carpeta-de-capturas]
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
const errors = [];
const notes = [];
const ok = (cond, msg) => { if (!cond) errors.push("falló: " + msg); else notes.push("ok: " + msg); };
const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const T = keyFmt.format(new Date());
const addDays = (k, n) => { const d = new Date(k + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const iso = (n) => new Date(Date.now() + n * 864e5).toISOString();
const lead = (o) => ({ cargo: "", correo: "", origen: "prospeccion", trato: "tu", intentos: 0, proxima: null, prioridad: "media", necesidad: "", responsable: "lorenzo", etapa: "contactado", creado: iso(-30), actualizado: iso(-1), creadoPor: ME, ...o });
const act = (leadId, d, o) => ({ leadId, tipo: "llamada", resultado: "contesto", fecha: iso(d), autor: ME, resumen: "", ...o });
const tarea = (o) => ({ estado: "pendiente", hora: "", responsable: "lorenzo", origen: "manual", nota: "", creado: iso(-2), actualizado: iso(-2), creadoPor: ME, ...o });

const SEED = {
  ["equipo/" + ME]: { nombre: "Lorenzo Bozzo", cargo: "Socio", telefono: "+56955551234", correo: "lorenzo@zhdevelopment.cl" },
  ["equipo/" + NICO]: { nombre: "Nicolás Valdivia", cargo: "Socio", telefono: "+56955554321", correo: "nicolas@zhdevelopment.cl" },
  "config/general": { agendaUrl: "https://zhdevelopment.cl/#agendar" },
  /* Con historial (siete contactos) y una tarea para hoy. */
  "leads/l-hist": lead({ nombre: "Andrea Fuentes", empresa: "Ferretería Andes", telefono: "+56922220001", dolor: "Cotizan a mano en planillas.", comoAyudamos: "Un cotizador conectado a su lista de precios." }),
  ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((n) => [`actividades/a-h${n}`, act("l-hist", -n * 2, { resumen: `Contacto número ${8 - n}: conversamos del cotizador.` })])),
  "tareas/t-hoy": tarea({ leadId: "l-hist", tipo: "llamar", titulo: "Llamar por la demo", fecha: T }),
  /* Por contactar, sin historial, con dolor: el dolor y el guion abiertos. */
  "leads/l-nuevo": lead({ nombre: "Bruno Díaz", empresa: "Viña Norte", telefono: "+56922220002", etapa: "nuevo", dolor: "Pierden pedidos por WhatsApp.", guion: "Abrir con la pregunta por los pedidos." }),
  /* Uno con una tarea atrasada y otro estancado (propuesta enviada hace 20 días). */
  "leads/l-atr": lead({ nombre: "Clara Soto", empresa: "Imprenta Sur", telefono: "+56922220003" }),
  "tareas/t-atr": tarea({ leadId: "l-atr", tipo: "whatsapp", titulo: "Mandarle el resumen", fecha: addDays(T, -2) }),
  "leads/l-est": lead({ nombre: "Diego Ruiz", empresa: "Taller Norte", telefono: "+56922220004", etapa: "propuesta", propuesta: { monto: 2500000, fecha: addDays(T, -20), enlace: "", archivo: "" } }),
  "actividades/a-est": { leadId: "l-est", tipo: "etapa", de: "reunion_concretada", a: "propuesta", fecha: iso(-20), autor: ME, resumen: "Propuesta enviada" },
  "tareas/t-prox": tarea({ leadId: "l-est", tipo: "llamar", titulo: "Seguimiento de la propuesta", fecha: addDays(T, 3) }),
  /* Un ganado y un borrador por revisar. */
  "leads/l-gan": lead({ nombre: "Elena Vidal", empresa: "Café Central", telefono: "+56922220005", etapa: "ganado" }),
  "actividades/a-gan": act("l-gan", -5, { resumen: "Aceptó la propuesta." }),
  "borradores/b-1": { leadId: "l-atr", canal: "whatsapp", estado: "por_revisar", texto: "Hola Clara, te mando el resumen de lo que conversamos.", firma: ME, objetivo: "seguimiento", generadoPor: "claude", autor: "claude", creado: iso(-1), actualizado: iso(-1) },
  /* Un cliente con una solicitud abierta. */
  "clientes/cli-a": { nombre: "Clínica Norte", razonSocial: "Clínica Norte SpA", rut: "", contactos: [], responsable: "lorenzo", trato: "tu", leadIds: [], estado: "activo", notas: "", creado: iso(-30), actualizado: iso(-30), creadoPor: ME },
  "solicitudes/s-1": { clienteId: "cli-a", proyectoId: "", titulo: "No llegan los recordatorios", descripcion: "", canal: "whatsapp", tipo: "error", cobertura: "por_definir", prioridad: "alta", estado: "nueva", responsable: ME, horasEstimadas: null, horasReales: null, resolucion: "", cotizacion: null, creado: iso(-2), actualizado: iso(-2), creadoPor: ME },
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  async function open(opts) {
    const context = opts.context || await browser.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, colorScheme: opts.dark ? "dark" : "light" });
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
    await page.addInitScript((o) => { window.__MOCK_SEED = o.seed; window.__MOCK_RECORDATORIOS = false; if (o.sinClaude) window.__MOCK_SIN_CLAUDE = true; }, { seed: SEED, sinClaude: !!opts.sinClaude });
    await page.goto("file://" + PREVIEW);
    await page.getByRole("heading", { name: "Hoy", exact: true }).waitFor({ timeout: 15000 });
    return page;
  }
  const shot = (page, name) => page.screenshot({ path: path.join(OUT, name), fullPage: false });
  const visto = (loc, ms) => loc.first().waitFor({ timeout: ms || 5000 }).then(() => true, () => false);
  const store = (page) => page.evaluate(() => Object.fromEntries(window.__mockStore));
  const esperar = (page, fn, arg, ms) => page.waitForFunction(fn, arg, { timeout: ms || 8000 }).then(() => true, () => false);
  const pedidos = (page) => page.evaluate(() => window.__ahoraPedidos || 0);
  const abrir = async (page, empresa) => {
    await irA(page, "leads");
    await page.locator("#f-etapa").selectOption("todos");
    await page.locator("table.leads tbody tr", { hasText: empresa }).click();
    await page.locator("#lead-title", { hasText: empresa }).waitFor();
  };
  const cerrar = async (page) => { await page.keyboard.press("Escape"); await page.locator(".drawer").waitFor({ state: "detached" }); };

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await open({ name: "ficha", context: ctx });

  /* ---------------- Hoy: una sola lista ---------------- */
  const lista = page.locator(".lo-que-toca");
  ok((await page.locator(".summary").count()) === 0, "Hoy ya no tiene la fila de cifras: el resumen está en la frase de arriba");
  ok(await lista.locator(".task-group.late", { hasText: "Atrasadas · 1" }).isVisible() && await lista.locator(".task", { hasText: "Mandarle el resumen" }).isVisible(), "«Lo que toca» parte por lo atrasado");
  ok(await lista.locator(".task", { hasText: "Llamar por la demo" }).isVisible(), "después, lo de hoy");
  ok(await lista.locator('.hoy-grupo[aria-label="Por revisar"] .ditem').count() === 1, "los borradores por revisar están en la misma lista");
  ok(await lista.locator('.hoy-grupo[aria-label="Clientes"] .irow', { hasText: "No llegan los recordatorios" }).isVisible(), "y lo de clientes: la solicitud abierta");
  ok(await lista.locator('.hoy-grupo[aria-label="Se están enfriando"] .lrow', { hasText: "Taller Norte" }).isVisible(), "y los que se están enfriando (la propuesta de hace 20 días)");
  const prox = lista.locator(".hoy-proximos");
  ok(!(await prox.evaluate((d) => d.open)) && (await prox.locator("summary").innerText()).includes("Próximos 7 días · 1"), "los próximos 7 días van plegados, con cuántos hay");
  await prox.locator("summary").click();
  ok(await lista.locator(".hoy-proximos .task", { hasText: "Seguimiento de la propuesta" }).isVisible(), "al abrirlos aparece lo que viene");
  ok((await page.locator(".hoy-cols > .stack:last-child > .panel h2").allInnerTexts()).join("|") === "Esta semana|Actividad reciente", "al lado, solo «Esta semana» y la actividad (el calendario, si está conectado)");
  await shot(page, "h01-hoy.png");
  await page.reload();
  await page.getByRole("heading", { name: "Hoy", exact: true }).waitFor();
  ok(await page.locator(".hoy-proximos").evaluate((d) => d.open), "y se acuerda de que los dejaste abiertos");

  /* ---------------- la ficha: lo de ahora arriba ---------------- */
  await abrir(page, "Ferretería Andes");
  const ia = page.locator(".ahora .ahora-ia");
  ok(await visto(ia.locator(".ahora-claude", { hasText: "Lo resumió Claude" })), "arriba de la ficha, Claude resume en qué va");
  ok((await ia.innerText()).includes("quedó en revisar la idea con su socio") && (await ia.innerText()).includes("Llamarlo para confirmar"), "con «En qué va» y «Qué hacer»");
  ok(await page.locator(".ahora .contact-lines").isVisible() && await page.locator(".ahora .quick-acts").isVisible(), "y en la misma tarjeta, el teléfono y los botones del resultado de la llamada");
  let st = await store(page);
  ok(!!(st["resumenes/l-hist"] && st["resumenes/l-hist"].enQueVa && st["resumenes/l-hist"].firma), "el resumen queda guardado para no pedirlo de nuevo");
  ok((await pedidos(page)) === 1, "se le pidió a Claude una vez");
  ok((await page.locator(".historial .feed-item").count()) === 5 && await page.locator(".historial .btn", { hasText: "Ver los 7" }).isVisible(), "el historial muestra lo último y «Ver los 7»");
  await page.locator(".historial .btn", { hasText: "Ver los 7" }).click();
  ok((await page.locator(".historial .feed-item").count()) === 7, "que muestra todo");
  ok(await page.locator("details.pitch").evaluate((d) => d.open), "un lead contactado, antes de la reunión, tiene el dolor a la vista");
  await shot(page, "h02-ficha.png");
  await cerrar(page);
  await abrir(page, "Ferretería Andes");
  await page.waitForTimeout(500);
  ok((await pedidos(page)) === 1 && (await ia.innerText()).includes("quedó en revisar la idea"), "al volver a abrirla, usa el resumen guardado");
  await page.locator(".work-tabs button", { hasText: "Nota" }).click();
  await page.fill("#o-texto", "Le mandé el folleto por correo.");
  await page.locator(".work .btn.primary", { hasText: "Guardar" }).click();
  ok(await esperar(page, () => (window.__ahoraPedidos || 0) === 2), "con un contacto nuevo, Claude lo vuelve a resumir");
  await cerrar(page);

  await abrir(page, "Viña Norte");
  ok((await page.locator(".ahora-ia").innerText()).includes("Todavía no hay contactos registrados.") && (await page.locator(".ahora-ia").innerText()).includes("Agendar la próxima tarea."), "sin historial no se le pide nada a Claude: sale de los datos");
  ok(await page.locator("details.pitch").evaluate((d) => d.open) && await page.locator(".pitch", { hasText: "Pierden pedidos por WhatsApp" }).isVisible(), "y el dolor está a la vista, para la primera llamada");
  ok((await pedidos(page)) === 2, "sin pedir otro resumen");
  await cerrar(page);
  await abrir(page, "Café Central");
  ok((await page.locator(".ahora-ia").count()) === 0, "un ganado no lleva «En qué va»");
  await cerrar(page);
  await page.close();

  /* ---------------- sin Claude ---------------- */
  const sin = await open({ name: "sin-claude", sinClaude: true });
  await abrir(sin, "Imprenta Sur");
  ok((await sin.locator(".ahora-ia").innerText()).includes("Mandarle el resumen · atrasada") && (await sin.locator(".ahora-ia .ahora-claude").count()) === 0, "sin Claude, «Qué hacer» es la próxima tarea (y dice si está atrasada)");
  await sin.close();

  /* ---------------- teléfono y oscuro ---------------- */
  const tel = await open({ name: "telefono", viewport: { width: 390, height: 844 } });
  const sw = await tel.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= 390, `teléfono, Hoy: sin scroll horizontal (${sw} <= 390)`);
  await shot(tel, "h03-telefono-hoy.png");
  await irA(tel, "leads");
  await tel.locator("#f-etapa").selectOption("todos");
  await tel.locator(".only-narrow .lrow-main, .only-narrow .irow-main", { hasText: "Ferretería Andes" }).first().click();
  await tel.locator("#lead-title").waitFor();
  await visto(tel.locator(".ahora-claude"));
  ok((await tel.locator(".ahora-fila").first().evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length)) === 1, "en el teléfono, «En qué va» y su texto van uno bajo el otro");
  await shot(tel, "h04-telefono-ficha.png");
  await tel.close();
  const dark = await open({ name: "oscuro", dark: true });
  await abrir(dark, "Ferretería Andes");
  await visto(dark.locator(".ahora-claude"));
  await shot(dark, "h05-oscuro-ficha.png");
  await dark.close();

  await browser.close();
  for (const n of notes) console.log(n);
  if (errors.length) { console.error("\n" + errors.join("\n")); process.exit(1); }
  console.log("\nTodo bien. Capturas en " + OUT);
})().catch((e) => { for (const n of notes) console.log(n); if (errors.length) console.error(errors.join("\n")); console.error(e); process.exit(1); });
