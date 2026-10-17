/* Prueba del embudo y del tablero de proyectos con Playwright y el mock de window.claude.
   Recorre: totales y ponderado por etapa, tarjetas con próxima acción, última actividad y
   responsable; arrastre con el mouse, con el dedo (mantener apretado) y cancelado con Escape;
   zonas de Ganado y Perdido que aparecen al arrastrar; acciones rápidas; búsqueda, responsable y
   orden; alternar tabla y tablero; arrastre en Proyectos; teléfono. Usa datos inventados.

   Uso:
     python3 crm/dev/build_preview.py
     NODE_PATH=$(npm root -g) VENDOR_DIR=<carpeta con preact.umd.min.js, hooks.umd.min.js, htm.umd.min.js> \
       node crm/dev/embudo.cjs [carpeta-de-capturas]
   Sale con código 1 si algo falla. */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { irA } = require("./ir.cjs");

const PREVIEW = path.join(__dirname, "preview.html");
const OUT = process.argv[2] || path.join(__dirname, "shots");
const VENDOR = process.env.VENDOR_DIR || "";
const ME = "u_lorenzoAAAAAAAAAAAAAAAAAA";
const NICO = "u_nicolasAAAAAAAAAAAAAAAAAA";
const errors = [];
const notes = [];
const ok = (cond, msg) => { if (!cond) errors.push("falló: " + msg); else notes.push("ok: " + msg); };
const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit" });
const T = keyFmt.format(new Date());
const addDays = (k, n) => { const d = new Date(k + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const iso = (n) => new Date(Date.now() + n * 864e5).toISOString();
const habil = (k, n) => { let d = k, left = n; while (left > 0) { d = addDays(d, 1); const w = new Date(d + "T12:00:00Z").getUTCDay(); if (w !== 0 && w !== 6) left -= 1; } return d; };
const base = (o) => ({ cargo: "", correo: "", origen: "web", trato: "tu", intentos: 0, proxima: null, prioridad: "media", necesidad: "", creadoPor: ME, ...o });
const LO = "lorenzo", NI = "nicolas";

const SEED = {
  ["equipo/" + ME]: { nombre: "Lorenzo Bozzo", cargo: "Socio", telefono: "+56955551234", correo: "lorenzo@zhdevelopment.cl" },
  ["equipo/" + NICO]: { nombre: "Nicolás Valdivia", cargo: "Socio", telefono: "", correo: "" },
  "config/general": { agendaUrl: "https://zhdevelopment.cl/#agendar" },
  "leads/lead-a": base({ nombre: "Paula Rojas", empresa: "Panadería Sol", telefono: "+56911110001", etapa: "nuevo", prioridad: "alta", responsable: LO, creado: iso(-9), actualizado: iso(-9) }),
  "leads/lead-b": base({ nombre: "Tomás Vera", empresa: "Viña Cerro", telefono: "+56911110002", etapa: "contactado", valor: 3000000, responsable: NI, proxima: { tipo: "llamar", fecha: T, hora: "", nota: "Confirmar reunión" }, creado: iso(-8), actualizado: iso(-1) }),
  "leads/lead-c": base({ nombre: "Isabel Mora", empresa: "Clínica Mar", telefono: "+56911110003", etapa: "propuesta", valor: 8000000, responsable: LO, dolor: "Agendan las horas por teléfono y anotan en un cuaderno", comoAyudamos: "Agenda en línea con recordatorio por WhatsApp", guion: "Parte 4: Vi que agendan las horas por teléfono.\nObjeción propia: «Ya tenemos un sistema» → Lo conectamos con lo que ya usan.\nWhatsApp si no contesta: Hola Isabel, te llamé recién.", proxima: { tipo: "correo", fecha: addDays(T, 3), hora: "", nota: "" }, creado: iso(-20), actualizado: iso(-2) }),
  "leads/lead-f": base({ nombre: "Luis Soto", empresa: "Imprenta Norte", telefono: "+56911110006", etapa: "propuesta", valor: 2000000, responsable: LO, proxima: { tipo: "llamar", fecha: addDays(T, 1), hora: "", nota: "" }, creado: iso(-3), actualizado: iso(-3) }),
  "leads/lead-d": base({ nombre: "Carlos Díaz", empresa: "Transportes Río", telefono: "+56911110004", etapa: "negociacion", valor: 5000000, responsable: LO, proxima: { tipo: "reunion", fecha: addDays(T, 2), hora: "", nota: "" }, creado: iso(-30), actualizado: iso(-4) }),
  "leads/lead-e": base({ nombre: "Rosa Pinto", empresa: "Ferretería Ola", telefono: "+56911110005", etapa: "perdido", motivoPerdida: "No es el momento", responsable: LO, creado: iso(-40), actualizado: iso(-10) }),
  "leads/lead-g": base({ nombre: "Ana Ruiz", empresa: "Vivero Sur", telefono: "+56911110007", etapa: "pausa", responsable: LO, proxima: { tipo: "llamar", fecha: T, hora: "", nota: "Retomar: quedó en hablar este mes" }, creado: iso(-15), actualizado: iso(-5) }),
  "leads/lead-h": base({ nombre: "Marta Gil", empresa: "Textil Norte", telefono: "+56911110008", etapa: "perdido", motivoPerdida: "", responsable: null, creado: iso(-6), actualizado: iso(-6) }),
  "leads/lead-i": base({ nombre: "Jorge Paz", empresa: "Fletes Paz", telefono: "+56911110009", etapa: "nuevo", intentos: 2, responsable: NI, proxima: { tipo: "llamar", fecha: addDays(T, 4), hora: "", nota: "Volver a llamar" }, creado: iso(-7), actualizado: iso(-2) }),
  "leads/lead-j": base({ nombre: "Pedro León", empresa: "Taller Sur", telefono: "+56911110010", etapa: "ganado", clienteId: "cli-x", responsable: LO, creado: iso(-60), actualizado: iso(-30) }),
  "actividades/act-b1": { leadId: "lead-b", tipo: "llamada", resultado: "contesto", fecha: new Date(Date.now() - 2 * 3600e3).toISOString(), autor: NICO, resumen: "Quiere ver una demo." },
  "clientes/cli-x": { nombre: "Taller Sur", razonSocial: "", rut: "", contactos: [], responsable: LO, trato: "tu", leadIds: [], estado: "activo", notas: "", creado: iso(-30), actualizado: iso(-30), creadoPor: ME },
  "proyectos/pro-x": { clienteId: "cli-x", nombre: "Agenda de taller", tipo: "software", valor: 4000000, estado: "entender", inicio: addDays(T, -5), entregaEstimada: addDays(T, 40), produccion: "", garantiaDias: 60, hitos: [], enlaces: [], caso: "", alcance: "", responsable: LO, creado: iso(-5), actualizado: iso(-5), creadoPor: ME },
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  async function open(opts) {
    const context = await browser.newContext({ viewport: opts.viewport || { width: 1360, height: 900 }, hasTouch: !!opts.touch, isMobile: !!opts.touch });
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
    await page.addInitScript((seed) => { window.__MOCK_SEED = seed; }, opts.seed);
    await page.goto("file://" + PREVIEW);
    await page.getByRole("heading", { name: "Hoy", exact: true }).waitFor({ timeout: 15000 });
    return page;
  }
  const shot = (page, name) => page.screenshot({ path: path.join(OUT, name), fullPage: false });
  const toast = (page, text) => page.locator(".toast", { hasText: text }).first().waitFor({ timeout: 8000 });
  const store = (page) => page.evaluate(() => Object.fromEntries(window.__mockStore));
  const card = (page, nombre) => page.locator(".kcard.lead", { hasText: nombre });
  const col = (page, id) => page.locator(`.board [data-col="${id}"]`);
  const centro = async (loc) => { const b = await loc.boundingBox(); return { x: b.x + b.width / 2, y: b.y + Math.min(b.height / 2, 40) }; };
  /* Arrastre con el mouse, en pasos, como una persona. */
  const arrastrar = async (page, desde, hasta, { soltar = true } = {}) => {
    const a = await centro(desde);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(a.x + 12, a.y + 4, { steps: 3 });
    const b = await centro(hasta);
    await page.mouse.move(b.x, b.y, { steps: 8 });
    if (soltar) await page.mouse.up();
  };
  /* La inicial del responsable (el select invisible que va encima no cuenta). */
  const ini = (loc) => loc.evaluate((el) => el.childNodes[0].textContent.trim());
  const noOverflow = async (page, label) => {
    const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: window.innerWidth }));
    ok(r.sw <= r.w + 1, `${label}: sin scroll horizontal (${r.sw} <= ${r.w})`);
  };

  const page = await open({ name: "escritorio", seed: SEED });
  const hoyPanel = page.locator(".lo-que-toca");
  ok(await hoyPanel.locator(".task", { hasText: "Vivero Sur" }).isVisible(), "un lead en pausa con fecha para retomarlo aparece en las tareas de hoy");
  ok(!(await page.locator(".plan-aviso").innerText().catch(() => "")).includes("Ana Ruiz"), "y no cuenta como lead sin tarea");
  await page.locator(".toolbar .seg button", { hasText: "Nicolás" }).click();
  ok(await hoyPanel.locator(".task", { hasText: "Viña Cerro" }).isVisible() && (await hoyPanel.locator(".task", { hasText: "Vivero Sur" }).count()) === 0, "en Hoy cada socio puede ver solo lo suyo");
  ok(await hoyPanel.locator(".task", { hasText: "Viña Cerro" }).locator(".task-meta", { hasText: "Nicolás" }).isVisible(), "con quién la lleva");
  await page.locator(".toolbar .seg button", { hasText: "Todo el equipo" }).click();
  ok(await hoyPanel.locator(".task", { hasText: "Vivero Sur" }).isVisible(), "y volver a ver todo el equipo");
  /* ---------------- tabla ↔ tablero ---------------- */
  await irA(page, "leads");
  await page.locator("h1", { hasText: "Leads" }).waitFor();
  await page.selectOption("#f-resp", NI);
  ok((await page.locator("table.leads tbody tr").count()) === 2, "en la tabla se filtra por responsable");
  ok((await page.locator("#f-resp option").allInnerTexts()).join("|") === "Todo el equipo|Lorenzo|Nicolás|Sin responsable", "y los responsables son solo Lorenzo y Nicolás");
  await page.selectOption("#f-resp", "");
  await page.locator(".page-head .seg button", { hasText: "Tablero" }).click();
  await page.locator("h1", { hasText: "Embudo" }).waitFor();
  ok(true, "desde Leads se pasa al tablero");

  /* ---------------- totales y tarjetas ---------------- */
  const eyebrow = await page.locator(".page-head .eyebrow").textContent();
  ok(eyebrow.includes("6 abiertos") && eyebrow.includes("$18.000.000 en juego") && eyebrow.includes("$9.050.000 ponderado"), "la cabecera suma lo que está en juego y lo ponderado por etapa");
  ok((await col(page, "propuesta").locator(".col-sum").innerText()).includes("$10.000.000 · $5.000.000 ponderado"), "cada etapa muestra su total y su ponderado");
  ok((await page.locator(".board > .col").count()) === 6 && (await page.locator(".board .col-par .col").evaluateAll((els) => els.map((x) => x.getAttribute("data-col")).join("|"))) === "ganado|perdido|pausa", "las 6 etapas abiertas, cada una en su carril, y al final Ganado, Perdido y En pausa apilados, siempre a la vista");
  ok((await page.locator(".board .col-title").allInnerTexts()).join("|") === "Por contactar|Contactado|Reunión agendada|Reunión concretada|Propuesta enviada|Negociación|Ganado|Perdido|En pausa", "con «Reunión agendada» y «Reunión concretada» como etapas");
  ok(await card(page, "Pedro León").locator(".tag", { hasText: /Cliente.+En desarrollo/ }).isVisible(), "la tarjeta ganada dice a qué cliente pasó y en qué etapa va");
  ok(await card(page, "Paula Rojas").locator(".knext.vacio", { hasText: "Sin tarea" }).isVisible(), "la tarjeta avisa cuando no hay una tarea pendiente");
  ok((await card(page, "Paula Rojas").locator(".kcard-titulo").innerText()) === "Panadería Sol", "la tarjeta muestra primero la empresa");
  ok(await card(page, "Tomás Vera").locator(".knext.today", { hasText: "Confirmar reunión" }).isVisible(), "y su próxima tarea, en azul si es para hoy");
  ok(await card(page, "Paula Rojas").locator(".prio").isVisible(), "y marca la prioridad alta");
  ok((await card(page, "Tomás Vera").locator(".kcard-act").innerText()).includes("Llamada"), "muestra la última actividad");
  ok((await ini(card(page, "Tomás Vera").locator(".avatar"))) === "N" && (await ini(card(page, "Isabel Mora").locator(".avatar"))) === "L", "y la inicial del responsable");
  ok(await card(page, "Tomás Vera").locator(".avatar.r2").isVisible() && await card(page, "Isabel Mora").locator(".avatar.r1").isVisible(), "con un color para cada socio");
  ok((await card(page, "Isabel Mora").locator(".kcard-valor").innerText()) === "$8.000.000 + IVA", "y el valor");
  await shot(page, "e01-embudo.png");

  /* ---------------- arrastrar con el mouse ---------------- */
  await arrastrar(page, card(page, "Paula Rojas"), col(page, "contactado"));
  await toast(page, "Panadería Sol: Contactado.");
  let dump = await store(page);
  ok(dump["leads/lead-a"].etapa === "contactado", "arrastrar con el mouse cambia la etapa");
  ok(Object.values(dump).some((v) => v.leadId === "lead-a" && v.tipo === "etapa" && v.de === "nuevo" && v.a === "contactado"), "y deja el cambio en el historial");
  await page.waitForTimeout(150);
  ok((await page.locator("#lead-title").count()) === 0, "soltar no abre la ficha");
  ok(await col(page, "contactado").locator(".kcard.lead", { hasText: "Paula Rojas" }).isVisible(), "la tarjeta queda en su nueva columna");

  /* ---------------- Escape cancela ---------------- */
  await arrastrar(page, card(page, "Luis Soto"), col(page, "negociacion"), { soltar: false });
  ok((await page.locator(".kghost").count()) === 1 && await col(page, "negociacion").evaluate((el) => el.classList.contains("drop")), "mientras arrastras, la tarjeta te sigue y la columna destino se marca");
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await page.waitForTimeout(150);
  ok((await page.locator(".kghost").count()) === 0 && (await store(page))["leads/lead-f"].etapa === "propuesta", "Escape cancela el arrastre");

  /* ---------------- Ganado es una columna; Perdido y En pausa aparecen al arrastrar ---------------- */
  /* Con seis columnas el tablero se desliza a lo ancho: «Ganado» queda a la derecha. */
  await col(page, "ganado").scrollIntoViewIfNeeded();
  await arrastrar(page, card(page, "Carlos Díaz"), col(page, "ganado"), { soltar: false });
  ok(await col(page, "ganado").evaluate((el) => el.classList.contains("drop")), "se arrastra a «Ganado» como a cualquier etapa");
  ok((await page.locator(".dropbar .dropzone").count()) === 2 && (await page.locator(".dropbar .dropzone.ganado").count()) === 0, "y abajo aparecen solo Perdido y En pausa");
  await shot(page, "e02-arrastrando.png");
  await page.mouse.up();
  await page.locator("#won-title").waitFor();
  ok(true, "soltar en Ganado abre «Convertir en cliente»");
  await page.keyboard.press("Escape");
  await page.locator("#won-title").waitFor({ state: "detached" });
  {
    const a = await centro(card(page, "Carlos Díaz"));
    await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(a.x + 20, a.y + 10, { steps: 4 });
    await page.locator(".dropbar").waitFor();
    const pz = await centro(page.locator(".dropbar .dropzone.perdido"));
    await page.mouse.move(pz.x, pz.y, { steps: 6 });
    ok(await page.locator(".dropzone.perdido.on").isVisible(), "la zona bajo el cursor se ilumina");
    await page.mouse.up();
  }
  await page.locator(".modal", { hasText: "Perdido: Carlos Díaz" }).waitFor();
  ok(true, "soltar en Perdido pide el motivo, aunque haya un aviso en pantalla");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  ok((await page.locator(".modal").count()) === 0, "Escape cierra la ventana de Perdido");
  ok((await store(page))["leads/lead-d"].etapa === "negociacion", "si se cancela, el lead se queda donde estaba");

  /* ---------------- con el dedo: mantener apretado ---------------- */
  const toque = (nombre, hasta, espera) => page.evaluate(async ({ nombre, hasta, espera }) => {
    const c = [...document.querySelectorAll(".kcard.lead")].find((x) => x.textContent.includes(nombre));
    const r = c.getBoundingClientRect();
    const ev = (type, x, y, el) => (el || window).dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: "touch", isPrimary: true, button: 0, clientX: x, clientY: y }));
    const x0 = r.left + r.width / 2, y0 = r.top + 14;
    ev("pointerdown", x0, y0, c);
    if (espera) await new Promise((res) => setTimeout(res, espera));
    const t = document.querySelector(`.board [data-col="${hasta}"]`).getBoundingClientRect();
    const x = espera ? t.left + t.width / 2 : x0, y = espera ? t.top + 40 : y0 + 30;
    ev("pointermove", x, y);
    await new Promise((res) => setTimeout(res, 60));
    const fantasma = !!document.querySelector(".kghost");
    ev("pointerup", x, y);
    return fantasma;
  }, { nombre, hasta, espera });
  ok((await toque("Tomás Vera", "reunion_agendada", 0)) === false, "deslizar rápido con el dedo es scroll, no arrastre");
  await page.waitForTimeout(400);
  ok((await store(page))["leads/lead-b"].etapa === "contactado" && (await page.locator(".kghost").count()) === 0, "y no mueve nada");
  ok((await toque("Tomás Vera", "reunion_agendada", 420)) === true, "mantener apretado con el dedo empieza el arrastre");
  await page.locator("#agendar-title").waitFor();
  ok(true, "soltar en «Reunión agendada» pide el día y la hora de la reunión");
  await page.fill("#ag-fecha", addDays(T, 3));
  await page.fill("#ag-hora", "10:30");
  const gcal = await page.locator(".cal-box a", { hasText: "Agregar a Google Calendar" }).getAttribute("href");
  const f3 = addDays(T, 3).replace(/-/g, "");
  ok(gcal.startsWith("https://calendar.google.com/calendar/render?action=TEMPLATE") && gcal.includes(`dates=${f3}T103000%2F${f3}T110000`) && gcal.includes("ctz=America%2FSantiago"), "con el evento de Google Calendar ya lleno (día, hora y zona de Chile)");
  await page.locator(".modal .btn.primary", { hasText: "Agendar reunión" }).click();
  await toast(page, "Viña Cerro: reunión");
  dump = await store(page);
  ok(dump["leads/lead-b"].etapa === "reunion_agendada", "al guardar, el lead queda en «Reunión agendada»");
  ok(Object.values(dump).some((v) => v.leadId === "lead-b" && v.tipo === "reunion" && v.fecha === addDays(T, 3) && v.hora === "10:30" && v.estado === "pendiente"), "y la reunión queda como tarea con día y hora");

  /* ---------------- clic y acciones rápidas ---------------- */
  await card(page, "Isabel Mora").locator(".kcard-top").click();
  await page.locator("#lead-title", { hasText: "Clínica Mar" }).waitFor();
  ok(true, "un clic abre la ficha del lead");
  ok(!(await page.locator("details.pitch").evaluate((d) => d.open)), "con la reunión hecha, el dolor y el guion quedan plegados");
  await page.locator("details.pitch > summary").click();
  const pitch = await page.locator(".pitch").innerText();
  ok(pitch.includes("Agendan las horas por teléfono") && pitch.includes("Agenda en línea con recordatorio"), "la ficha muestra el dolor y cómo ayudamos");
  ok((await page.locator("#lead-resp").evaluate((el) => el.options[el.selectedIndex].text)) === "Lo lleva Lorenzo", "y arriba, quién lo lleva");
  await page.selectOption("#lead-resp", NI);
  await page.waitForFunction(() => window.__mockStore.get("leads/lead-c").responsable === "nicolas", null, { timeout: 5000 });
  await page.selectOption("#lead-resp", LO);
  await page.waitForFunction(() => window.__mockStore.get("leads/lead-c").responsable === "lorenzo", null, { timeout: 5000 });
  ok(true, "el responsable se cambia desde la ficha");
  ok((await page.locator("#l-dolor").count()) === 1 && (await page.locator("#l-ayuda").count()) === 1 && (await page.locator("#l-guion").count()) === 1, "y en «Datos del lead» se editan el dolor, cómo ayudamos y el guion");
  await page.locator(".pitch details.guion summary").click();
  ok((await page.locator(".pitch details.guion p").innerText()).includes("WhatsApp si no contesta: Hola Isabel"), "el guion se abre en la ficha, completo");
  await page.keyboard.press("Escape");
  await page.locator(".scrim").first().waitFor({ state: "detached" });
  await card(page, "Luis Soto").locator('.kact[title="Registrar llamada"]').click();
  await page.locator("#lead-title", { hasText: "Imprenta Norte" }).waitFor();
  ok((await page.locator(".work-tabs button[aria-pressed=true]").innerText()).includes("Registrar llamada"), "el teléfono de la tarjeta abre «Registrar llamada»");
  await page.keyboard.press("Escape");
  await page.locator(".scrim").first().waitFor({ state: "detached" });
  ok((await card(page, "Luis Soto").locator('a.kact[href*="wa.me"], a.kact[href*="whatsapp"]').count()) === 1, "y trae el enlace de WhatsApp");

  /* ---------------- búsqueda, responsable y orden ---------------- */
  await page.fill("#buscar-emb", "clínica");
  ok((await page.locator(".kcard.lead").count()) === 1 && await card(page, "Isabel Mora").isVisible(), "la búsqueda filtra las tarjetas (sin importar tildes)");
  await page.fill("#buscar-emb", "");
  await page.selectOption("#emb-resp", NI);
  ok((await page.locator(".kcard.lead").count()) === 2 && await card(page, "Tomás Vera").isVisible() && await card(page, "Jorge Paz").isVisible(), "el filtro por responsable muestra solo los de Nicolás");
  await page.selectOption("#emb-resp", LO);
  ok((await card(page, "Tomás Vera").count()) === 0 && (await page.locator(".kcard.lead").count()) === 7, "o solo los de Lorenzo (4 abiertos, 1 ganado, 1 perdido y 1 en pausa)");
  ok((await page.locator("#emb-resp option").allInnerTexts()).join("|") === "Todos los responsables|Lorenzo|Nicolás|Sin responsable", "los responsables son solo Lorenzo y Nicolás");
  await page.selectOption("#emb-resp", "");
  await page.selectOption("#emb-orden", "valor");
  let orden = await col(page, "propuesta").locator(".kcard.lead .kcard-titulo").allInnerTexts();
  ok(orden[0] === "Clínica Mar" && orden[1] === "Imprenta Norte", "ordena por valor");
  await page.selectOption("#emb-orden", "creado");
  orden = await col(page, "propuesta").locator(".kcard.lead .kcard-titulo").allInnerTexts();
  ok(orden[0] === "Imprenta Norte", "y por los más nuevos");
  /* ---------------- responsable desde la tarjeta ---------------- */
  await card(page, "Paula Rojas").locator(".avatar select").selectOption(NI);
  await toast(page, "Panadería Sol: lo lleva Nicolás.");
  ok((await store(page))["leads/lead-a"].responsable === NI, "el responsable se cambia tocando la inicial de la tarjeta");
  ok((await ini(card(page, "Paula Rojas").locator(".avatar"))) === "N" && (await page.locator("#lead-title").count()) === 0, "la tarjeta muestra la nueva inicial, sin abrir la ficha");

  /* ---------------- no contestó, desde el embudo ---------------- */
  await card(page, "Luis Soto").locator('.kact[title="No contestó"]').click();
  await page.locator(".modal", { hasText: "No contestó: Luis Soto" }).waitFor();
  ok((await page.locator("#lead-title").count()) === 0, "«No contestó» abre una ventana corta, no la ficha");
  ok((await page.locator("#nc-fecha").inputValue()) === habil(T, 1), "propone volver a llamar el próximo día hábil");
  await page.locator(".modal .chip", { hasText: "Más tarde" }).click();
  ok(/^\d\d:\d\d$/.test(await page.locator("#nc-hora").inputValue()), "«Más tarde» le pone hora");
  await page.locator(".modal .chip", { hasText: "Mañana" }).click();
  await shot(page, "e04-no-contesto.png");
  await page.locator(".modal .btn.primary", { hasText: "Guardar" }).click();
  await toast(page, "Imprenta Norte: volver a llamar");
  await page.waitForFunction(() => { const l = window.__mockStore.get("leads/lead-f"); return l.proxima && l.proxima.tareaId; }, null, { timeout: 5000 });
  dump = await store(page);
  const lf = dump["leads/lead-f"];
  ok(lf.intentos === 1 && lf.proxima.tipo === "llamar" && lf.proxima.fecha === habil(T, 1) && lf.proxima.nota.includes("1 intento sin respuesta"), "queda el intento y cuándo volver a llamar (la «próxima acción» del lead sigue a su tarea)");
  ok(Object.values(dump).some((v) => v.leadId === "lead-f" && v.tipo === "llamar" && v.estado === "pendiente" && v.fecha === habil(T, 1) && v.origen === "no_contesto"), "como una tarea de volver a llamar");
  ok(lf.etapa === "propuesta" && !!lf.ultimoIntento, "sin cambiar la etapa");
  ok(Object.values(dump).some((v) => v.leadId === "lead-f" && v.tipo === "llamada" && v.resultado === "no_contesto"), "la llamada sin respuesta queda en el historial");
  ok(await card(page, "Luis Soto").locator(".tag", { hasText: "1 sin respuesta" }).isVisible(), "y la tarjeta cuenta las veces que no contestó");
  await card(page, "Jorge Paz").locator('.kact[title="No contestó"]').click();
  await page.locator(".modal", { hasText: "No contestó: Jorge Paz" }).waitFor();
  ok(await page.locator(".modal .note", { hasText: "Lleva 3 intentos" }).isVisible(), "al tercer intento ofrece cerrarlo");
  await page.locator(".modal button", { hasText: "Perdido · No responde" }).click();
  await toast(page, "Fletes Paz: perdido · No responde.");
  dump = await store(page);
  const li = dump["leads/lead-i"];
  ok(li.etapa === "perdido" && li.motivoPerdida === "No responde" && li.proxima === null && li.intentos === 3, "y lo pasa a Perdido con el motivo «No responde»");
  ok(Object.values(dump).some((v) => v.leadId === "lead-i" && v.tipo === "etapa" && v.a === "perdido"), "con el cambio de etapa en el historial");

  ok(await col(page, "perdido").locator(".kcard.lead.compacto", { hasText: "Ferretería Ola" }).isVisible() && (await col(page, "perdido").locator(".kcard.lead", { hasText: "Rosa Pinto" }).count()) === 0, "los perdidos se ven en su carril, con tarjetas cortas (la empresa, sin la persona)");
  ok(await col(page, "pausa").locator(".kcard.lead", { hasText: "Ana Ruiz" }).locator(".knext", { hasText: "Retomar" }).isVisible(), "la tarjeta en pausa muestra cuándo retomarlo");
  ok(await card(page, "Ferretería Ola").locator(".tag", { hasText: "No es el momento" }).isVisible(), "un perdido muestra su motivo, también uno antiguo");
  const resumen = await col(page, "perdido").locator(".col-motivos span").evaluateAll((els) => els.map((x) => x.getAttribute("title")));
  ok(resumen.includes("Sin motivo: 1") && resumen.includes("No responde: 1"), "el carril Perdido cuenta cuántos hay por motivo");
  await card(page, "Textil Norte").locator(".tagbtn", { hasText: "Falta el motivo" }).click();
  await page.locator(".modal", { hasText: "Motivo de pérdida: Marta Gil" }).waitFor();
  ok((await page.locator(".modal .chip").allInnerTexts()).join("|") === "No responde|Mal timing|No hay fit|Está con la competencia", "los motivos son: no responde, mal timing, no hay fit y está con la competencia");
  ok(await page.locator(".modal .btn.primary").isDisabled(), "sin motivo no se puede guardar");
  await page.locator(".modal .chip", { hasText: "Está con la competencia" }).click();
  await page.fill("#lost-det", "Trabaja con un proveedor de Iquique");
  await page.locator(".modal .btn.primary").click();
  await toast(page, "Textil Norte: perdido · Está con la competencia.");
  dump = await store(page);
  ok(dump["leads/lead-h"].motivoPerdida === "Está con la competencia" && dump["leads/lead-h"].motivoDetalle === "Trabaja con un proveedor de Iquique" && dump["leads/lead-h"].etapa === "perdido", "el motivo se pone desde la tarjeta del perdido");
  ok(Object.values(dump).some((v) => v.leadId === "lead-h" && v.tipo === "nota" && String(v.resumen).startsWith("Motivo de pérdida: Está con la competencia")), "y queda anotado en el historial");
  ok((await page.locator("#lead-title").count()) === 0, "sin abrir la ficha");
  await shot(page, "e05-perdidos.png");

  /* ---------------- Proyectos: mismo arrastre ---------------- */
  await irA(page, "proyectos");
  await page.locator(".board.fases .col").first().waitFor();
  await arrastrar(page, page.locator(".board.fases .kcard", { hasText: "Agenda de taller" }), page.locator('.board.fases [data-col="disenar"]'));
  await toast(page, "Agenda de taller: Diseñar.");
  dump = await store(page);
  ok(dump["proyectos/pro-x"].estado === "disenar", "en Proyectos también se arrastra entre etapas");
  await page.waitForTimeout(150);
  ok((await page.locator("#pro-title").count()) === 0, "y soltar no abre la ficha del proyecto");

  /* ---------------- embudo de clientes ---------------- */
  await irA(page, "embudo");
  await page.locator(".board .linkbtn", { hasText: "Embudo de clientes →" }).click();
  await page.locator("h1", { hasText: "Embudo de clientes" }).waitFor();
  ok(true, "desde «Ganado» se pasa al embudo de clientes");
  const ccard = (nombre) => page.locator(".kcard.lead", { hasText: nombre });
  ok((await page.locator(".board .col").count()) === 6, "el embudo de clientes tiene 6 etapas");
  ok(await col(page, "desarrollo").locator(".kcard.lead", { hasText: "Taller Sur" }).isVisible(), "un cliente sin etapa fija va según su proyecto: En desarrollo");
  ok((await col(page, "desarrollo").locator(".col-sum").innerText()).includes("$4.000.000 en proyectos"), "la etapa suma lo que hay en proyectos");
  await arrastrar(page, ccard("Taller Sur"), col(page, "mantencion"));
  await toast(page, "Taller Sur: Con mantención.");
  dump = await store(page);
  ok(dump["clientes/cli-x"].etapa === "mantencion", "arrastrar cambia la etapa del cliente");
  ok(Object.values(dump).some((v) => v.clienteId === "cli-x" && v.tipo === "etapa" && v.de === "desarrollo" && v.a === "mantencion"), "y el cambio queda en su historial");
  await arrastrar(page, ccard("Taller Sur"), col(page, "propuesta"));
  await page.locator(".modal", { hasText: "Nueva propuesta: Taller Sur" }).waitFor();
  await page.fill("#prop-titulo", "Evolutivo de reportes");
  await page.fill("#prop-valor", "1500000");
  await page.locator(".modal .btn.primary").click();
  await toast(page, "Taller Sur: Nueva propuesta.");
  dump = await store(page);
  const cx1 = dump["clientes/cli-x"];
  ok(cx1.etapa === "propuesta" && cx1.propuesta.titulo === "Evolutivo de reportes" && cx1.propuesta.valor === 1500000, "«Nueva propuesta» guarda qué le proponemos y cuánto");
  ok((await ccard("Taller Sur").locator(".tag", { hasText: "Evolutivo de reportes" }).innerText()).includes("$1.500.000"), "la tarjeta lo muestra");
  ok((await col(page, "propuesta").locator(".col-sum").innerText()).includes("$1.500.000 propuesto"), "y la columna suma lo propuesto");
  await shot(page, "e06-embudo-clientes.png");
  await ccard("Taller Sur").locator(".avatar select").selectOption(NI);
  await toast(page, "Taller Sur: lo lleva Nicolás.");
  ok((await store(page))["clientes/cli-x"].responsable === NI, "el responsable del cliente se cambia desde la tarjeta");
  await ccard("Taller Sur").locator(".kcard-top").click();
  await page.locator("#cli-title", { hasText: "Taller Sur" }).waitFor();
  ok((await page.inputValue("#cli-etapa")) === "propuesta", "la ficha del cliente muestra la etapa arriba");
  await page.selectOption("#cli-etapa", "");
  await page.waitForFunction(() => window.__mockStore.get("clientes/cli-x").etapa === null, null, { timeout: 5000 });
  ok(true, "y desde ahí vuelve a la etapa automática");
  await page.keyboard.press("Escape");
  await page.locator(".scrim").first().waitFor({ state: "detached" });
  const enDesarrollo = await col(page, "desarrollo").locator(".kcard.lead", { hasText: "Taller Sur" }).waitFor({ timeout: 5000 }).then(() => true, () => false);
  ok(enDesarrollo, "con la automática vuelve a seguir a su proyecto");
  await ccard("Taller Sur").locator('.kact[title="Redactar con Claude"]').click();
  await page.locator("#cli-title", { hasText: "Taller Sur" }).waitFor();
  ok((await page.locator(".work-tabs button[aria-pressed=true]").innerText()).includes("Redactar"), "el atajo de la tarjeta abre la ficha con «Redactar» listo");
  await page.keyboard.press("Escape");
  await page.locator(".scrim").first().waitFor({ state: "detached" });
  await page.locator(".page-head .seg button", { hasText: "Tabla" }).click();
  await page.locator("h1", { hasText: /^Clientes$/ }).waitFor();
  ok(await page.locator("table.leads tbody tr", { hasText: "Taller Sur" }).locator(".stage", { hasText: "En desarrollo" }).isVisible(), "la tabla de clientes muestra la etapa");
  await page.close();

  /* ---------------- columnas largas: se deslizan por dentro ---------------- */
  const muchos = { ...SEED };
  for (let i = 1; i <= 9; i++) muchos[`leads/lead-m${i}`] = base({ nombre: `Contacto ${i}`, empresa: `Empresa ${i}`, telefono: `+5691111020${i}`, etapa: "nuevo", responsable: null, creado: iso(-50 - i), actualizado: iso(-50 - i) });
  const larga = await open({ name: "columna larga", seed: muchos });
  await irA(larga, "embudo");
  await larga.locator("h1", { hasText: "Embudo de leads" }).waitFor();
  const cn = larga.locator('.board [data-col="nuevo"]');
  const medida = await cn.locator(".col-lista").evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight }));
  ok(medida.sh > medida.ch, "una columna con muchas tarjetas no se alarga: el resto queda dentro de la columna");
  const alto = await cn.evaluate((el) => el.getBoundingClientRect().height);
  ok(alto <= 900, `y la columna cabe en la pantalla (${Math.round(alto)} px)`);
  const mas = cn.locator(".col-mas");
  ok(await mas.isVisible() && /^\d+ más/.test(await mas.innerText()), "abajo dice cuántas tarjetas más hay");
  await shot(larga, "e07-columna-larga.png");
  await mas.click();
  const bajo = await larga.waitForFunction(() => document.querySelector('.board [data-col="nuevo"] .col-lista').scrollTop > 0, null, { timeout: 5000 }).then(() => true, () => false);
  ok(bajo, "y al tocarlo la columna se desliza hacia abajo");
  await larga.close();

  /* ---------------- teléfono ---------------- */
  const phone = await open({ name: "teléfono", viewport: { width: 390, height: 844 }, touch: true, seed: SEED });
  await irA(phone, "embudo");
  await phone.locator("h1", { hasText: "Embudo" }).waitFor();
  await noOverflow(phone, "teléfono, Embudo");
  ok((await phone.locator(".page-head .lede").innerText()).includes("Mantén apretada"), "en el teléfono explica que hay que mantener apretada la tarjeta");
  await shot(phone, "e03-movil.png");
  await irA(phone, "embudoClientes");
  await phone.locator("h1", { hasText: "Embudo de clientes" }).waitFor();
  await noOverflow(phone, "teléfono, Embudo de clientes");

  await browser.close();
  console.log(notes.join("\n"));
  if (errors.length) { console.error("\n" + errors.join("\n")); process.exit(1); }
  console.log(`\nTodo bien. Capturas en ${OUT}`);
})().catch((e) => { console.error(e); console.error(errors.join("\n")); process.exit(1); });
