/* Prueba de la ronda de seguimiento con Playwright y el mock de window.claude (con archivos
   simulados). Recorre: los días en la etapa (aviso en la tarjeta, orden del embudo y el panel
   «Estancados» de Hoy); «Propuesta enviada» (desde la tarea, con monto, enlace, PDF y seguimiento;
   al arrastrar, con «Solo mover»; la propuesta en la ficha, editarla y moverla); los archivos de la
   ficha del lead y del cliente (subir, tipo no aceptado, borrar, reintento, espacio lleno y una
   vista que no puede subir); las metas de la semana (Hoy y Ajustes); el WhatsApp que redacta Claude
   en «No contestó»; el resumen de Métricas con Claude; teléfono y modo oscuro. Usa datos inventados.

   Uso:
     python3 crm/dev/build_preview.py
     NODE_PATH=$(npm root -g) VENDOR_DIR=<carpeta con preact.umd.min.js, hooks.umd.min.js, htm.umd.min.js> \
       node crm/dev/seguimiento.cjs [carpeta-de-capturas]
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
const finde = (k) => [0, 6].includes(new Date(k + "T12:00:00Z").getUTCDay());
const habil = (k, n) => { let d = k, left = n; while (left > 0) { d = addDays(d, 1); if (!finde(d)) left -= 1; } return d; };
const iso = (n) => new Date(Date.now() + n * 864e5).toISOString();
/* Hace n segundos: siempre dentro de esta semana (salvo en el primer minuto del lunes). */
const ahora = (s) => new Date(Date.now() - s * 1000).toISOString();
/* El mediodía de hace n días en Chile: los días en la etapa salen exactos. */
const fmtCL = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const diaISO = (n) => {
  const local = `${addDays(T, -n)}T12:00:00`;
  for (const off of ["-03:00", "-04:00"]) {
    const d = new Date(local + off);
    const p = Object.fromEntries(fmtCL.formatToParts(d).map((x) => [x.type, x.value]));
    if (`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}` === local.slice(0, 16)) return d.toISOString();
  }
  return new Date(local + "-03:00").toISOString();
};
const lead = (o) => ({ cargo: "", correo: "", telefono: "", origen: "prospeccion", trato: "tu", intentos: 0, proxima: null, prioridad: "media", necesidad: "", responsable: "lorenzo", creado: iso(-30), actualizado: iso(-1), creadoPor: ME, ...o });
const tarea = (o) => ({ estado: "pendiente", hora: "", responsable: "lorenzo", origen: "manual", creado: iso(-2), actualizado: iso(-2), creadoPor: ME, ...o });
const act = (o) => ({ autor: ME, ...o });
const PDF_LAGOS = "b".repeat(32);
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

const SEED = {
  ["equipo/" + ME]: { nombre: "Lorenzo Bozzo", cargo: "Socio", telefono: "+56955551234", correo: "socio@zhdevelopment.cl" },
  ["equipo/" + NICO]: { nombre: "Nicolás Valdivia", cargo: "Socio", telefono: "+56955554321", correo: "" },
  "config/general": { agendaUrl: "https://zhdevelopment.cl/#agendar" },
  /* Después de la reunión: 9 días (estancado), 2 días (no) y la propuesta por enviar. */
  "leads/lead-p": lead({ nombre: "Diego Ruiz", empresa: "Taller Norte", telefono: "+56955556666", etapa: "reunion_concretada", responsable: "nicolas" }),
  "tareas/tar-p": tarea({ leadId: "lead-p", tipo: "propuesta", titulo: "Enviar la propuesta", fecha: T, responsable: "nicolas" }),
  "leads/lead-s": lead({ nombre: "Gabriela Rivas", empresa: "Panadería Rivas", telefono: "+56988889999", etapa: "reunion_concretada", creado: iso(-3) }),
  /* Propuesta enviada hace 16 días (sin el cambio de etapa en el historial) y negociación de 25. */
  "leads/lead-q": lead({ nombre: "Irene Lagos", empresa: "Clínica Lagos", telefono: "+56913131313", etapa: "propuesta", valor: 4500000,
    propuesta: { monto: 4500000, fecha: addDays(T, -16), enlace: "https://docs.google.com/document/d/propuesta-lagos", archivo: PDF_LAGOS },
    archivos: [{ id: PDF_LAGOS, nombre: "propuesta-clinica-lagos.pdf", tipo: "application/pdf", bytes: 245000, subido: diaISO(16), por: ME, etiqueta: "propuesta" }] }),
  "leads/lead-r": lead({ nombre: "Javiera Soto", empresa: "Óptica Central", telefono: "+56914141414", etapa: "negociacion", valor: 8000000 }),
  /* Para «No contestó» y para las metas. */
  "leads/lead-t": lead({ nombre: "Luis Mora", empresa: "Molinos Sur", telefono: "+56916161616", etapa: "contactado", intentos: 2 }),
  "leads/lead-v": lead({ nombre: "Elena Vidal", empresa: "Café Central", telefono: "+56966667777", etapa: "reunion_agendada" }),
  "leads/lead-w": lead({ nombre: "Karen Mella", empresa: "Bodega Mella", telefono: "+56915151515", etapa: "reunion_agendada", responsable: "nicolas" }),
  "clientes/cli-a": { nombre: "Clínica Norte", razonSocial: "Clínica Norte SpA", contactos: [{ id: "ct-1", nombre: "Daniela Soto", cargo: "Administradora", correo: "dsoto@clinicanorte.cl", telefono: "+56911112222", rol: "decisor", principal: true }], responsable: ME, trato: "tu", leadIds: [], estado: "activo", notas: "", creado: iso(-90), actualizado: iso(-5), creadoPor: ME },
  "actividades/e1": act({ leadId: "lead-p", tipo: "etapa", de: "reunion_agendada", a: "reunion_concretada", fecha: diaISO(9) }),
  "actividades/e2": act({ leadId: "lead-s", tipo: "etapa", de: "reunion_agendada", a: "reunion_concretada", fecha: diaISO(2) }),
  "actividades/e3": act({ leadId: "lead-r", tipo: "etapa", de: "contactado", a: "reunion_agendada", fecha: diaISO(40) }),
  "actividades/e4": act({ leadId: "lead-r", tipo: "etapa", de: "reunion_agendada", a: "reunion_concretada", fecha: diaISO(33) }),
  "actividades/e5": act({ leadId: "lead-r", tipo: "etapa", de: "propuesta", a: "negociacion", fecha: diaISO(25) }),
  /* Esta semana: 3 llamadas de Lorenzo, 1 de Nicolás y una reunión agendada de cada uno. */
  "actividades/l1": act({ leadId: "lead-t", tipo: "llamada", resultado: "no_contesto", fecha: ahora(50) }),
  "actividades/l2": act({ leadId: "lead-t", tipo: "llamada", resultado: "no_contesto", fecha: ahora(45) }),
  "actividades/l3": act({ leadId: "lead-v", tipo: "llamada", resultado: "contesto", fecha: ahora(40), resumen: "Quiere ver cómo ordenar los pedidos." }),
  "actividades/l4": act({ leadId: "lead-w", tipo: "llamada", resultado: "contesto", autor: NICO, fecha: ahora(35) }),
  "actividades/l5": act({ leadId: "lead-t", tipo: "llamada", resultado: "no_contesto", fecha: diaISO(10) }),
  "actividades/r1": act({ leadId: "lead-v", tipo: "etapa", de: "contactado", a: "reunion_agendada", fecha: ahora(30) }),
  "actividades/r2": act({ leadId: "lead-w", tipo: "etapa", de: "contactado", a: "reunion_agendada", autor: NICO, fecha: ahora(25) }),
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  async function open(opts) {
    const context = await browser.newContext({ viewport: opts.viewport || { width: 1360, height: 900 }, colorScheme: opts.dark ? "dark" : "light" });
    try { await context.grantPermissions(["clipboard-read", "clipboard-write"]); } catch (e) { /* file:// */ }
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
    await page.addInitScript((o) => { window.__MOCK_SEED = o.seed; if (o.assets) window.__MOCK_ASSETS = o.assets; }, { seed: opts.seed, assets: opts.assets || null });
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
  const sinScroll = async (page, label) => {
    const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: window.innerWidth }));
    ok(r.sw <= r.w, `${label}: sin scroll horizontal (${r.sw} <= ${r.w})`);
  };
  const subidas = (page) => page.evaluate(() => window.__assetCalls.filter((c) => c.tipo === "upload").length);

  const page = await open({ name: "seguimiento", seed: SEED });
  const semana = page.locator(".panel[aria-label='Esta semana']");
  const meta = (label) => semana.locator(".meta", { hasText: label });
  const cuenta = async (label) => (await meta(label).locator(".meta-top b").innerText()).trim();

  /* ---------------- Hoy: estancados y la semana ---------------- */
  const est = page.locator(".panel[aria-label=Estancados]");
  await est.waitFor();
  ok((await est.locator(".lrow-name").allInnerTexts()).join("|") === "Óptica Central|Clínica Lagos|Taller Norte", "«Estancados» muestra los que llevan 7 días o más después de la reunión, el más antiguo primero");
  ok(await visto(est.locator(".lrow", { hasText: "Óptica Central" }).locator(".tag.late", { hasText: "25 d en la etapa" })), "con los días en la etapa (25: en rojo)");
  ok(await visto(est.locator(".lrow", { hasText: "Clínica Lagos" }).locator(".tag.warn", { hasText: "Enviada hace 16 d" })), "una propuesta cuenta desde que se envió, aunque el cambio de etapa no esté en el historial");
  ok(await visto(est.locator(".lrow", { hasText: "Clínica Lagos" }).locator(".lrow-sub", { hasText: "$4.500.000 + IVA" })), "y muestra el monto de la propuesta");
  ok((await est.locator(".lrow", { hasText: "Panadería Rivas" }).count()) === 0, "uno con 2 días en la etapa no está estancado");
  ok((await cuenta("Llamadas")) === "4" && (await cuenta("Reuniones agendadas")) === "2", "«Esta semana» cuenta las llamadas y las reuniones agendadas desde el lunes");
  ok(await visto(semana.locator(".linkbtn", { hasText: "Ponerse una meta" })), "sin metas, invita a ponerse una");
  await shot(page, "s01-hoy.png");

  /* ---------------- metas en Ajustes ---------------- */
  await semana.locator(".linkbtn", { hasText: "Ponerse una meta" }).click();
  await page.locator("#m-llamadas").waitFor();
  await page.fill("#m-llamadas", "5");
  await page.fill("#m-reuniones", "1");
  await page.getByRole("button", { name: "Guardar metas" }).click();
  ok(await toast(page, "Metas guardadas."), "las metas se guardan en Ajustes");
  let dump = await store(page);
  ok(JSON.stringify(dump["config/general"].metas) === JSON.stringify({ llamadas: 5, reuniones: 1 }), "como números, en la configuración del equipo");
  await irA(page, "hoy");
  await semana.waitFor();
  ok((await cuenta("Llamadas")) === "4 de 10" && await visto(meta("Llamadas").locator("small", { hasText: "Faltan 6" })), "para el equipo, la meta es la de los dos socios (4 de 10, faltan 6)");
  ok((await cuenta("Reuniones agendadas")) === "2 de 2" && await visto(meta("Reuniones agendadas").locator("small.ok", { hasText: "Meta cumplida" })), "y avisa cuando se cumple");
  ok((await meta("Llamadas").locator("[role=meter]").getAttribute("aria-valuenow")) === "4", "la barra dice cuánto va, para lectores de pantalla");
  await page.locator(".toolbar .seg button", { hasText: "Lorenzo" }).click();
  ok(await esperar(page, () => { const b = document.querySelector(".panel[aria-label='Esta semana'] .meta .meta-top b"); return b && b.textContent.trim() === "3 de 5"; }), "con el filtro de Lorenzo, sus llamadas contra su meta (3 de 5)");
  ok((await cuenta("Reuniones agendadas")) === "1 de 1", "y las reuniones de sus leads (1 de 1)");
  await page.locator(".toolbar .seg button", { hasText: "Todo el equipo" }).click();
  ok(await esperar(page, () => { const p = [...document.querySelectorAll(".cols .stack:last-child > .panel")].map((x) => x.getAttribute("aria-label") || x.querySelector("h2").textContent); return p.indexOf("Estancados") === 1; }), "«Estancados» va arriba, después de la semana");
  await shot(page, "s01b-metas.png");

  /* ---------------- embudo: días en la etapa y orden ---------------- */
  await irA(page, "embudo");
  await page.locator("h1", { hasText: "Embudo de leads" }).waitFor();
  ok(await visto(card(page, "Taller Norte").locator(".tag", { hasText: "9 d en la etapa" })), "la tarjeta avisa los días en la etapa desde 7");
  ok(await visto(card(page, "Clínica Lagos").locator(".tag.warn", { hasText: "Enviada hace 16 d" })), "y en una propuesta, hace cuánto se envió");
  ok((await card(page, "Panadería Rivas").locator(".tag", { hasText: "en la etapa" }).count()) === 0, "con menos de 7 días no muestra nada");
  const orden = () => col(page, "reunion_concretada").locator(".kcard-titulo").allInnerTexts();
  await page.selectOption("#emb-orden", "creado");
  ok((await orden()).join("|") === "Panadería Rivas|Taller Norte", "«Más nuevos primero» deja arriba el lead más nuevo");
  await page.selectOption("#emb-orden", "etapa");
  ok((await orden()).join("|") === "Taller Norte|Panadería Rivas", "«Más tiempo en la etapa» deja arriba el que lleva más días");
  await shot(page, "s02-embudo.png");

  /* ---------------- arrastrar a «Propuesta enviada»: solo mover ---------------- */
  await arrastrar(page, card(page, "Panadería Rivas"), col(page, "propuesta"));
  await page.locator("#prop-title", { hasText: "Propuesta enviada a Panadería Rivas" }).waitFor();
  ok(await visto(page.locator(".modal", { hasText: "El lead pasa a «Propuesta enviada»" })), "al arrastrar a «Propuesta enviada» pregunta por la propuesta");
  await page.locator(".modal .btn", { hasText: "Solo mover" }).click();
  ok(await toast(page, "Panadería Rivas: Propuesta enviada. Queda una llamada de seguimiento"), "«Solo mover» la pasa sin datos");
  dump = await store(page);
  const segS = docs(dump, "tareas").find((x) => x.leadId === "lead-s" && x.titulo === "Seguimiento de la propuesta");
  ok(dump["leads/lead-s"].etapa === "propuesta" && !dump["leads/lead-s"].propuesta, "el lead queda en «Propuesta enviada», sin datos de propuesta");
  ok(segS && segS.fecha === habil(T, 3) && segS.responsable === "lorenzo", "y, sin otras tareas, con la llamada de seguimiento en 3 días hábiles");

  /* ---------------- propuesta enviada desde la tarea, con PDF ---------------- */
  await card(page, "Taller Norte").locator(".kcard-titulo").click();
  await page.locator("#lead-title", { hasText: "Taller Norte" }).waitFor();
  await page.locator(".drawer .tareas-box .task", { hasText: "Enviar la propuesta" }).locator(".tick").click();
  await page.locator("#prop-title", { hasText: "Propuesta enviada a Taller Norte" }).waitFor();
  ok(await visto(page.locator(".modal", { hasText: "y la tarea queda hecha" })), "completar la tarea abre el formulario de la propuesta");
  await page.fill("#prop-monto", "3200000");
  ok(await visto(page.locator(".modal .hint", { hasText: "$3.200.000 + IVA · $3.808.000 con IVA" })), "el monto se muestra con y sin IVA");
  await page.fill("#prop-enlace", "https://docs.google.com/document/d/propuesta-taller");
  await page.setInputFiles("#prop-pdf", { name: "propuesta-taller-norte.pdf", mimeType: "application/pdf", buffer: PDF });
  await page.locator(".modal .btn", { hasText: "En una semana" }).click();
  ok(await visto(page.locator(".modal .hint", { hasText: "Queda una llamada «Seguimiento de la propuesta»" })), "el seguimiento se elige con un clic");
  await shot(page, "s03-propuesta.png");
  await page.locator(".modal .btn.primary", { hasText: "Propuesta enviada" }).click();
  ok(await toast(page, "Taller Norte: Propuesta enviada por $3.200.000 + IVA. Queda una llamada de seguimiento"), "al guardar, el aviso dice el monto y el seguimiento");
  dump = await store(page);
  const lp = dump["leads/lead-p"];
  const pdf = (lp.archivos || []).find((x) => x.nombre === "propuesta-taller-norte.pdf");
  ok(lp.etapa === "propuesta" && dump["tareas/tar-p"].estado === "hecha", "el lead pasa a «Propuesta enviada» y la tarea queda hecha");
  ok(lp.propuesta && lp.propuesta.monto === 3200000 && lp.propuesta.fecha === T && lp.propuesta.enlace === "https://docs.google.com/document/d/propuesta-taller" && lp.valor === 3200000, "la propuesta guarda monto, fecha y enlace, y el monto pasa a ser el valor del lead");
  ok(pdf && pdf.tipo === "application/pdf" && pdf.etiqueta === "propuesta" && pdf.por === ME && /^[0-9a-f]{32}$/.test(pdf.id) && lp.propuesta.archivo === pdf.id, "el PDF queda en los archivos del lead, marcado como la propuesta");
  ok((await page.evaluate(() => window.__assetCalls.find((c) => c.tipo === "upload"))).type === "application/pdf", "y se sube con su tipo");
  const segP = docs(dump, "tareas").find((x) => x.leadId === "lead-p" && x.titulo === "Seguimiento de la propuesta");
  ok(segP && segP.fecha === addDays(T, 7) && segP.responsable === "nicolas" && segP.tipo === "llamar", "el seguimiento queda en una semana, para quien lleva el lead");
  ok(docs(dump, "actividades").some((a) => a.leadId === "lead-p" && a.tipo === "etapa" && a.a === "propuesta" && a.resumen === "Propuesta enviada: $3.200.000 + IVA"), "y el historial dice cuánto se propuso");

  /* ---------------- la propuesta en la ficha ---------------- */
  const caja = page.locator(".drawer .prop-box");
  await caja.waitFor();
  ok(await visto(caja.locator(".tag", { hasText: "Enviada hoy" })) && await visto(caja.locator(".prop-monto", { hasText: "$3.200.000" })), "la ficha muestra la propuesta: enviada hoy, con su monto");
  ok((await caja.locator("a", { hasText: "Abrir el documento" }).getAttribute("href")) === "https://docs.google.com/document/d/propuesta-taller", "con el enlace al documento");
  ok((await caja.locator("a", { hasText: "Ver el PDF" }).getAttribute("href")) === "/_blob/" + pdf.id, "y el PDF guardado");
  ok(await visto(caja.getByRole("button", { name: "La aceptó" })) && await visto(caja.getByRole("button", { name: "No la aceptó" })), "con los botones para lo que respondió el cliente");
  await shot(page, "s04-ficha-propuesta.png");
  await caja.getByRole("button", { name: "Editar" }).click();
  await page.locator("#prop-title", { hasText: "Propuesta de Taller Norte" }).waitFor();
  ok((await page.inputValue("#prop-monto")) === "3200000" && (await page.locator(".modal .btn", { hasText: "En una semana" }).count()) === 0, "«Editar» trae los datos, sin volver a pedir el seguimiento");
  await page.fill("#prop-monto", "3500000");
  await page.locator(".modal .btn.primary", { hasText: "Guardar" }).click();
  ok(await toast(page, "Propuesta actualizada."), "y guarda los cambios");
  dump = await store(page);
  ok(dump["leads/lead-p"].propuesta.monto === 3500000 && dump["leads/lead-p"].valor === 3500000 && dump["leads/lead-p"].propuesta.archivo === pdf.id && dump["leads/lead-p"].etapa === "propuesta", "el monto cambia y el PDF y la etapa siguen igual");
  await caja.getByRole("button", { name: "En negociación" }).click();
  ok(await toast(page, "Taller Norte: Negociación."), "«En negociación» mueve el lead");
  ok(await visto(caja.locator(".tag.today", { hasText: "En negociación" })) && (await caja.getByRole("button", { name: "En negociación" }).count()) === 0, "y la propuesta lo muestra");

  /* ---------------- archivos del lead ---------------- */
  const arch = page.locator(".drawer .archivos");
  ok(await visto(arch.locator(".arch", { hasText: "propuesta-taller-norte.pdf" }).locator("span", { hasText: "Propuesta" })), "en «Archivos» está el PDF, marcado como la propuesta");
  await arch.locator("input[type=file]").setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: PNG });
  ok(await toast(page, "Archivo guardado."), "se sube un archivo con el botón «Subir»");
  ok(await esperar(page, () => document.querySelectorAll(".drawer .archivos .arch").length === 2), "y aparece en la lista");
  const antes = await subidas(page);
  await arch.locator("input[type=file]").setInputFiles({ name: "planilla.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: Buffer.from("PK\u0003\u0004 planilla") });
  ok(await toast(page, "planilla.xlsx: ese tipo de archivo no se puede subir"), "un Excel no se acepta y el aviso dice qué hacer");
  ok((await subidas(page)) === antes, "y ni siquiera se intenta subir");
  const filaPdf = arch.locator(".arch", { hasText: "propuesta-taller-norte.pdf" });
  await filaPdf.getByRole("button", { name: "Borrar propuesta-taller-norte.pdf" }).click();
  ok(await visto(filaPdf.locator(".arch-del")), "borrar pide confirmar en la misma fila");
  await filaPdf.locator(".arch-del .btn", { hasText: "Borrar" }).click();
  ok(await toast(page, "Archivo borrado."), "al confirmar, se borra");
  dump = await store(page);
  ok((dump["leads/lead-p"].archivos || []).map((x) => x.nombre).join("|") === "logo.png" && dump["leads/lead-p"].propuesta.archivo === "", "sale de la ficha y la propuesta deja de apuntarlo");
  ok(await page.evaluate((id) => window.__assetCalls.some((c) => c.tipo === "delete" && c.ref === id) && !window.__assets.has(id), pdf.id), "y el archivo se borra del almacén");
  ok(await esperar(page, () => ![...document.querySelectorAll(".drawer .prop-box a")].some((a) => a.textContent.includes("Ver el PDF"))), "la propuesta ya no ofrece «Ver el PDF»");
  await shot(page, "s05-archivos.png");
  await cerrarFicha(page);

  /* ---------------- «No contestó»: Claude redacta el WhatsApp ---------------- */
  await card(page, "Molinos Sur").locator('.kact[title="No contestó"]').click();
  await page.locator(".modal", { hasText: "No contestó: Luis Mora" }).waitFor();
  await page.locator(".modal .seg button", { hasText: "Escribirle por WhatsApp" }).click();
  const chk = page.locator(".modal .check", { hasText: "Claude redacta el WhatsApp" }).locator("input");
  ok(await chk.isChecked(), "al elegir WhatsApp, Claude se ofrece a redactarlo (marcado)");
  await page.locator(".modal .btn.primary", { hasText: "Guardar" }).click();
  ok(await toast(page, "Claude está redactando el WhatsApp"), "el aviso dice que Claude lo está redactando");
  ok(await esperar(page, () => [...window.__mockStore].some(([k, v]) => k.startsWith("borradores/") && v.leadId === "lead-t")), "queda el borrador");
  dump = await store(page);
  const bt = docs(dump, "borradores").find((x) => x.leadId === "lead-t");
  const tt = docs(dump, "tareas").find((x) => x.leadId === "lead-t" && x.origen === "no_contesto");
  ok(bt && bt.canal === "whatsapp" && bt.estado === "por_revisar" && bt.texto && tt && tt.tipo === "whatsapp" && bt.tareaId === tt.id, "un WhatsApp por revisar, unido a la tarea de escribirle");
  ok(await esperar(page, () => [...window.__mockStore].some(([k, v]) => k.startsWith("tareas/") && v.leadId === "lead-t" && v.borradorId)), "y la tarea apunta al borrador");
  ok(await page.evaluate(() => window.__mockPrompts.some((p) => p.includes("Lo llamamos y no contestó (3 intentos sin respuesta)") && p.includes("Sin presionar ni reprochar"))), "Claude sabe cuántas veces no contestó y que no debe presionar");

  /* ---------------- métricas: resumen con Claude ---------------- */
  await irA(page, "metricas");
  await page.locator(".mtabla").first().waitFor();
  await page.getByRole("button", { name: "Resumen con Claude" }).click();
  const res = page.locator(".panel.resumen");
  ok(await visto(res.locator("h2", { hasText: "Semana con más reuniones" })), "«Resumen con Claude» muestra el titular");
  ok((await res.locator(".resumen-cols > div").count()) === 3 && await visto(res.locator("li", { hasText: "Llamar a Taller Norte por la propuesta" })), "con lo que va bien, lo que preocupa y lo de la próxima semana");
  const pr = (await page.evaluate(() => window.__mockPrompts)).filter((p) => p.includes("reunión semanal de los socios")).pop() || "";
  ok(pr.includes("Clínica Lagos (Propuesta enviada, 16 días)") && pr.includes("Óptica Central (Negociación, 25 días)") && !pr.includes("Panadería Rivas (") && !pr.includes("Taller Norte ("), "Claude recibe solo los estancados de verdad, con sus días");
  ok(pr.includes("Quiere ver cómo ordenar los pedidos.") && pr.includes("no inventes cifras"), "y lo que se habló, con la regla de no inventar");
  await shot(page, "s06-resumen.png");
  await res.getByRole("button", { name: "Copiar" }).click();
  ok(await toast(page, /Resumen copiado\.|No se pudo copiar\./), "«Copiar» responde");
  await res.getByRole("button", { name: "Cerrar" }).click();
  ok((await page.locator(".panel.resumen").count()) === 0, "y «Cerrar» lo quita");

  /* ---------------- Hoy después de todo ---------------- */
  await irA(page, "hoy");
  await semana.waitFor();
  ok((await cuenta("Llamadas")) === "5 de 10", "la llamada sin respuesta de recién suma a la semana");
  ok((await est.locator(".lrow-name").allInnerTexts()).join("|") === "Óptica Central|Clínica Lagos", "Taller Norte sale de «Estancados» al mover la propuesta");
  await page.close();

  /* ---------------- archivos del cliente: reintento y espacio lleno ---------------- */
  const cli = await open({ name: "cliente", seed: SEED, assets: { fallaUnaVez: "store_unavailable" } });
  await irA(cli, "clientes");
  await cli.locator("table.leads tbody tr", { hasText: "Clínica Norte" }).click();
  await cli.locator("#cli-title", { hasText: "Clínica Norte" }).waitFor();
  await cli.locator(".drawer .dtabs button", { hasText: "Archivos" }).click();
  ok(await visto(cli.locator(".drawer .archivos .empty", { hasText: "Sube la propuesta, el contrato" })), "la ficha del cliente tiene su pestaña «Archivos»");
  await cli.locator(".drawer .archivos input[type=file]").setInputFiles({ name: "contrato-firmado.pdf", mimeType: "application/pdf", buffer: PDF });
  ok(await toast(cli, "Archivo guardado."), "si el almacén falla una vez, se reintenta solo y se guarda");
  ok((await subidas(cli)) === 2, "(dos intentos)");
  dump = await store(cli);
  ok((dump["clientes/cli-a"].archivos || []).map((x) => x.nombre).join("|") === "contrato-firmado.pdf", "el archivo queda en la ficha del cliente");
  ok(await visto(cli.locator(".drawer .dtabs button", { hasText: "Archivos" }).locator(".count", { hasText: "1" })), "y la pestaña cuenta los archivos");
  await cli.evaluate(() => { window.__MOCK_ASSETS.falla = "quota_or_state"; });
  await cli.locator(".drawer .archivos input[type=file]").setInputFiles({ name: "acta.pdf", mimeType: "application/pdf", buffer: PDF });
  ok(await toast(cli, "acta.pdf: se llenó el espacio de archivos del CRM"), "si el espacio se llenó, lo dice");
  ok((await store(cli))["clientes/cli-a"].archivos.length === 1, "y no deja nada a medias");
  await shot(cli, "s07-cliente-archivos.png");
  await cli.close();

  /* ---------------- una vista que no puede subir archivos ---------------- */
  const lector = await open({ name: "lector", seed: SEED, assets: { off: true } });
  await irA(lector, "embudo");
  await card(lector, "Clínica Lagos").locator(".kcard-titulo").click();
  await lector.locator("#lead-title", { hasText: "Clínica Lagos" }).waitFor();
  const archL = lector.locator(".drawer .archivos");
  ok((await archL.locator(".arch-main").getAttribute("href")) === "/_blob/" + PDF_LAGOS, "sin la capacidad de archivos, los guardados se siguen abriendo");
  ok((await archL.locator("input[type=file]").count()) === 0 && (await archL.locator("button[aria-label^='Borrar']").count()) === 0, "pero no se puede subir ni borrar");
  ok((await lector.locator(".drawer .prop-box a", { hasText: "Ver el PDF" }).getAttribute("href")) === "/_blob/" + PDF_LAGOS, "y la propuesta muestra su PDF");
  await lector.locator(".drawer .prop-box").getByRole("button", { name: "Editar" }).click();
  await lector.locator("#prop-title").waitFor();
  ok((await lector.locator("#prop-pdf").count()) === 0, "el formulario de la propuesta no ofrece subir el PDF");
  await lector.close();

  /* ---------------- teléfono y oscuro ---------------- */
  const tel = await open({ name: "telefono", seed: SEED, viewport: { width: 390, height: 844 } });
  await tel.locator(".panel[aria-label='Esta semana']").waitFor();
  await sinScroll(tel, "teléfono, Hoy");
  await tel.locator(".panel[aria-label='Esta semana']").scrollIntoViewIfNeeded();
  await shot(tel, "s08-telefono-semana.png");
  await tel.locator(".panel[aria-label=Estancados] .lrow-main", { hasText: "Clínica Lagos" }).click();
  await tel.locator("#lead-title", { hasText: "Clínica Lagos" }).waitFor();
  await tel.locator(".drawer .prop-box").scrollIntoViewIfNeeded();
  await sinScroll(tel, "teléfono, ficha con la propuesta");
  await shot(tel, "s09-telefono-propuesta.png");
  await tel.close();
  const dark = await open({ name: "oscuro", seed: SEED, dark: true });
  await dark.locator(".panel[aria-label=Estancados]").scrollIntoViewIfNeeded();
  await shot(dark, "s10-oscuro-hoy.png");
  await dark.locator(".panel[aria-label=Estancados] .lrow-main", { hasText: "Clínica Lagos" }).click();
  await dark.locator("#lead-title", { hasText: "Clínica Lagos" }).waitFor();
  await dark.locator(".drawer .archivos").scrollIntoViewIfNeeded();
  await shot(dark, "s11-oscuro-ficha.png");
  await dark.close();

  await browser.close();
  for (const n of notes) console.log(n);
  if (errors.length) { console.error("\n" + errors.join("\n")); process.exit(1); }
  console.log("\nTodo bien. Capturas en " + OUT);
})().catch((e) => { for (const n of notes) console.log(n); if (errors.length) console.error(errors.join("\n")); console.error(e); process.exit(1); });
