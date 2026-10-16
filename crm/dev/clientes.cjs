/* Prueba de humo de la etapa con clientes, con Playwright y el mock de window.claude.
   Recorre: lead ganado → cliente, proyecto y calendario de cobros; hitos y etapas del proyecto
   (garantía al pasar a «Mejorar»); factura y pago; solicitud clasificada por Claude; acta de
   reunión; correo al cliente; mantención con su mensualidad; Hoy, Soporte y Cobros; teléfono y
   modo oscuro.

   Uso:
     python3 crm/dev/build_preview.py
     NODE_PATH=$(npm root -g) VENDOR_DIR=<carpeta con preact.umd.min.js, hooks.umd.min.js, htm.umd.min.js> \
       node crm/dev/clientes.cjs [carpeta-de-capturas]
   Sale con código 1 si algo falla. */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

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
const iso = (n) => new Date(Date.now() + n * 864e5).toISOString();
const MK = T.slice(0, 7);

const SEED = {
  ["equipo/" + ME]: { nombre: "Lorenzo Bozzo", cargo: "Socio fundador", telefono: "+56955551234", correo: "lorenzo@zhdevelopment.cl" },
  "config/general": { agendaUrl: "https://zhdevelopment.cl/#agendar", garantiaDias: 60, plazoPago: 30 },
  "leads/lead-ls": { nombre: "Marcela Díaz", empresa: "Logística Sur", cargo: "Gerenta de operaciones", telefono: "+56987654321", correo: "marcela@logisticasur.cl", etapa: "negociacion", prioridad: "alta", trato: "tu", intentos: 0, proxima: { tipo: "llamar", fecha: T, hora: "", nota: "Cerrar el acuerdo" }, valor: 4500000, necesidad: "Portal de seguimiento de despachos", origen: "referido", creado: iso(-10), actualizado: iso(-1), creadoPor: ME },
  "clientes/cli-cn": { nombre: "Clínica Norte", razonSocial: "Clínica Norte SpA", rut: "76.123.456-7", contactos: [{ id: "ct-1", nombre: "Daniela Soto", cargo: "Administradora", correo: "dsoto@clinicanorte.cl", telefono: "+56911112222", rol: "decisor", principal: true }, { id: "ct-2", nombre: "Pedro Rojas", cargo: "Contador", correo: "pagos@clinicanorte.cl", telefono: "", rol: "facturacion", principal: false }], responsable: ME, trato: "tu", leadIds: [], estado: "activo", notas: "", creado: iso(-120), actualizado: iso(-5), creadoPor: ME },
  "proyectos/pro-cn": { clienteId: "cli-cn", nombre: "Agenda y fichas", tipo: "software", valor: 6000000, estado: "mejorar", inicio: addDays(T, -120), entregaEstimada: addDays(T, -55), produccion: addDays(T, -50), garantiaDias: 60, hitos: [{ id: "h1", nombre: "Diseño aprobado por el cliente", fecha: addDays(T, -100), hecho: true }, { id: "h2", nombre: "Capacitación al equipo", fecha: addDays(T, 3), hecho: false }], enlaces: [], caso: "", alcance: "Agenda de horas y fichas de pacientes.", responsable: ME, creado: iso(-120), actualizado: iso(-50), creadoPor: ME },
  "cobros/cob-cn-1": { clienteId: "cli-cn", proyectoId: "pro-cn", tipo: "anticipo", concepto: "Anticipo (30%)", monto: 1800000, fecha: addDays(T, -120), estado: "pagado", factura: "101", fechaFactura: addDays(T, -120), vence: "", fechaPago: addDays(T, -110), notas: "", creado: iso(-120), actualizado: iso(-110), creadoPor: ME },
  "cobros/cob-cn-2": { clienteId: "cli-cn", proyectoId: "pro-cn", tipo: "cierre", concepto: "Pago final (70%)", monto: 4200000, fecha: addDays(T, -50), estado: "facturado", factura: "115", fechaFactura: addDays(T, -45), vence: addDays(T, -15), fechaPago: "", notas: "", creado: iso(-50), actualizado: iso(-45), creadoPor: ME },
  "mantenciones/man-cn": { clienteId: "cli-cn", proyectoId: "pro-cn", plan: "Mantención técnica", monto: 120000, incluye: "Respaldos, monitoreo y soporte básico.", inicio: addDays(T, -50), diaCobro: 5, estado: "activa", fin: "", notas: "", creado: iso(-50), actualizado: iso(-50), creadoPor: ME },
  "solicitudes/sol-cn-1": { clienteId: "cli-cn", proyectoId: "pro-cn", titulo: "No llegan los recordatorios por correo", descripcion: "Desde el lunes los pacientes no reciben el recordatorio.", canal: "whatsapp", tipo: "error", cobertura: "garantia", prioridad: "alta", estado: "nueva", responsable: ME, horasEstimadas: null, horasReales: null, resolucion: "", cotizacion: null, creado: iso(-2), actualizado: iso(-2), creadoPor: ME },
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

  async function open(opts) {
    const context = await browser.newContext({ viewport: opts.viewport || { width: 1360, height: 900 }, colorScheme: opts.dark ? "dark" : "light", hasTouch: !!opts.touch, isMobile: !!opts.touch });
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
    await page.addInitScript((s) => { window.__MOCK_SEED = s; }, opts.seed);
    await page.goto("file://" + PREVIEW);
    await page.getByRole("heading", { name: "Hoy", exact: true }).waitFor({ timeout: 15000 });
    return page;
  }
  const shot = (page, name) => page.screenshot({ path: path.join(OUT, name), fullPage: false });
  const toast = (page, text) => page.locator(".toast", { hasText: text }).first().waitFor({ timeout: 8000 });
  const store = (page) => page.evaluate(() => Object.fromEntries(window.__mockStore));
  const docs = (dump, col) => Object.entries(dump).filter(([k]) => k.startsWith(col + "/")).map(([k, v]) => ({ id: k.slice(col.length + 1), ...v }));
  const noOverflow = async (page, label) => {
    const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: window.innerWidth }));
    ok(r.sw <= r.w + 1, `${label}: sin scroll horizontal (${r.sw} <= ${r.w})`);
  };
  /* Por el nombre exacto: «Clientes» no debe tomar «Embudo de clientes». */
  const side = (page, name) => page.locator(".side .nav button", { hasText: new RegExp("^" + name) }).click();

  /* ---------------- Hoy con un cliente sembrado ---------------- */
  const page = await open({ name: "escritorio", seed: SEED });
  await toast(page, "mensualidad agregada");
  let dump = await store(page);
  ok(!!dump[`cobros/cob-m-man-cn-${MK}`], "la mantención activa genera la mensualidad del mes con id fijo");
  const panel = page.locator(".panel", { hasText: "Clientes: próximos 7 días" });
  await panel.waitFor();
  ok(await panel.locator(".irow", { hasText: "Termina la garantía" }).isVisible(), "Hoy avisa que termina la garantía");
  ok(await panel.locator(".irow", { hasText: "Pago atrasado: factura 115" }).isVisible(), "Hoy muestra el pago atrasado");
  ok(await panel.locator(".irow", { hasText: "Capacitación al equipo" }).isVisible(), "Hoy muestra el hito de la semana");
  ok(await page.locator(".panel", { hasText: "Soporte abierto" }).locator(".irow", { hasText: "No llegan los recordatorios" }).isVisible(), "Hoy muestra la solicitud abierta");
  ok(await page.locator(".stat.alert", { hasText: "vencido" }).isVisible(), "Hoy muestra lo vencido");
  await shot(page, "c01-hoy.png");

  /* ---------------- lead ganado → cliente ---------------- */
  await side(page, "Leads");
  await page.locator("table.leads tbody tr", { hasText: "Marcela Díaz" }).click();
  await page.locator("#lead-title", { hasText: "Marcela Díaz" }).waitFor();
  await page.selectOption("#lead-etapa", "ganado");
  await page.locator("#won-title").waitFor();
  ok((await page.inputValue("#w-nom")) === "Logística Sur", "el cliente nuevo toma el nombre de la empresa");
  ok((await page.inputValue("#w-val")) === "4500000", "el proyecto toma el valor del lead");
  await page.fill("#w-ent", addDays(T, 60));
  ok(await page.locator(".modal .irow", { hasText: "Pago intermedio (40%)" }).isVisible(), "el calendario 30/40/30 se previsualiza");
  await shot(page, "c02-ganado.png");
  await page.getByRole("button", { name: "Crear cliente y proyecto" }).click();
  await toast(page, "Quedó como cliente");
  await page.locator("#cli-title", { hasText: "Logística Sur" }).waitFor();
  await shot(page, "c03-cliente.png");
  dump = await store(page);
  const cliLS = docs(dump, "clientes").find((c) => c.nombre === "Logística Sur");
  ok(cliLS && cliLS.contactos.length === 1 && cliLS.contactos[0].nombre === "Marcela Díaz" && cliLS.contactos[0].principal, "el cliente queda con Marcela como contacto principal");
  const proLS = docs(dump, "proyectos").find((p) => p.clienteId === (cliLS || {}).id);
  ok(proLS && proLS.valor === 4500000 && proLS.estado === "por_iniciar", "se crea el proyecto con su valor");
  const cobLS = docs(dump, "cobros").filter((x) => x.proyectoId === (proLS || {}).id).sort((a, b) => a.monto - b.monto);
  ok(cobLS.length === 3 && cobLS.reduce((a, x) => a + x.monto, 0) === 4500000 && cobLS.some((x) => x.monto === 1800000), "se crean 3 cobros que suman el valor (30/40/30)");
  ok(docs(dump, "leads").find((l) => l.id === "lead-ls").clienteId === (cliLS || {}).id, "el lead queda ganado y enlazado al cliente");

  /* ---------------- proyecto: hitos, etapas, garantía, factura y pago ---------------- */
  await page.locator(".dtabs button", { hasText: "Proyectos" }).click();
  await page.locator(".drawer .kcard").first().click();
  await page.locator("#pro-title").waitFor();
  await page.locator(".hitos .btn", { hasText: "Diseño aprobado por el cliente" }).click();
  await page.locator(".hito", { has: page.locator('input[aria-label="Nombre del hito"]') }).first().waitFor();
  await page.locator('.hito input[type="checkbox"]').first().check();
  await page.waitForTimeout(150);
  await page.selectOption("#pro-estado", "construir");
  await toast(page, "Construir");
  await page.selectOption("#pro-estado", "mejorar");
  await toast(page, "Garantía hasta");
  dump = await store(page);
  const proLS2 = docs(dump, "proyectos").find((p) => p.id === proLS.id);
  ok(proLS2.produccion === T && proLS2.estado === "mejorar", "al pasar a «Mejorar» queda la puesta en producción de hoy");
  ok(proLS2.hitos.length === 1 && proLS2.hitos[0].hecho === true, "el hito queda marcado como listo");
  const rowAnticipo = page.locator(".drawer .irow", { hasText: "Anticipo (30%)" });
  await rowAnticipo.getByRole("button", { name: "Facturar" }).click();
  await rowAnticipo.locator(".box input").first().fill("1234");
  await rowAnticipo.getByRole("button", { name: "Guardar factura" }).click();
  await toast(page, "Factura registrada.");
  await rowAnticipo.getByRole("button", { name: "Registrar pago" }).click();
  await rowAnticipo.getByRole("button", { name: "Guardar pago" }).click();
  await toast(page, "Pago registrado.");
  await shot(page, "c04-proyecto.png");
  dump = await store(page);
  const anticipo = docs(dump, "cobros").find((x) => x.proyectoId === proLS.id && x.tipo === "anticipo");
  ok(anticipo.estado === "pagado" && anticipo.factura === "1234" && anticipo.vence === addDays(T, 30) && anticipo.fechaPago === T, "la factura guarda número, vencimiento a 30 días y el pago");

  /* ---------------- correo al cliente con Claude ---------------- */
  await page.locator(".drawer-title p button", { hasText: "Logística Sur" }).click();
  await page.locator("#cli-title", { hasText: "Logística Sur" }).waitFor();
  await page.locator(".work-tabs button", { hasText: "Redactar con Claude" }).click();
  await page.locator(".work-body .btn.claude", { hasText: "Redactar con Claude" }).click();
  await page.locator("#draft-title", { hasText: "Correo para Logística Sur · Marcela Díaz" }).waitFor();
  ok(await page.locator(".email-canvas", { hasText: "El diseño quedó aprobado" }).isVisible(), "el correo al cliente se arma con el diseño de ZH");
  const gm = await page.locator("a", { hasText: "Copiar y abrir Gmail" }).getAttribute("href");
  ok(gm.includes("to=marcela%40logisticasur.cl"), "el correo va al contacto del cliente");
  await shot(page, "c05-correo-cliente.png");
  await page.getByRole("button", { name: "Marcar como enviado" }).click();
  await page.getByRole("button", { name: "Sí, registrar envío" }).click();
  await toast(page, "historial del cliente");
  let prompts = await page.evaluate(() => window.__mockPrompts);
  const pCli = prompts.find((p) => p.includes("CLIENTE actual de ZH"));
  ok(pCli && pCli.includes("Logística Sur") && pCli.includes("Mejorar · en garantía") && pCli.includes("Garantía hasta"), "Claude recibe el proyecto, su etapa y la garantía");

  /* ---------------- acta de reunión con solicitud ---------------- */
  await page.locator(".work-tabs button", { hasText: "Registrar" }).click();
  await page.fill("#cl-texto", "Aprobaron el diseño. Piden exportar ventas a Excel. Nos mandan el acceso al ERP.");
  await page.getByRole("button", { name: "Ordenar en acta con Claude" }).click();
  await page.locator(".work .analysis").waitFor();
  ok(await page.locator(".work .suggest .check", { hasText: "Agregar exportación a Excel" }).isVisible(), "el acta propone registrar la solicitud");
  await shot(page, "c06-acta.png");
  await page.locator(".work").getByRole("button", { name: "Guardar", exact: true }).click();
  await toast(page, "1 solicitud creada");

  /* ---------------- solicitud clasificada por Claude ---------------- */
  await page.locator(".work-tabs button", { hasText: "Nueva solicitud" }).click();
  await page.locator("#sol-title").waitFor();
  await page.fill("#s-tit", "El informe mensual no carga");
  await page.fill("#s-desc", "Hola, desde ayer el informe mensual queda en blanco.");
  await page.getByRole("button", { name: "Clasificar y responder con Claude" }).click();
  await page.locator(".modal .analysis").waitFor();
  await page.getByRole("button", { name: "Aplicar clasificación" }).click();
  ok((await page.locator(".modal .seg button", { hasText: "Garantía" }).getAttribute("aria-pressed")) === "true", "la clasificación de Claude marca la cobertura (garantía)");
  ok((await page.inputValue("#s-prio")) === "alta", "y la prioridad");
  await shot(page, "c07-solicitud.png");
  await page.getByRole("button", { name: "Crear solicitud" }).click();
  await toast(page, "Solicitud creada.");
  prompts = await page.evaluate(() => window.__mockPrompts);
  const pSol = prompts.find((p) => p.includes("Clasifica la solicitud de un cliente"));
  ok(pSol && pSol.includes("El informe mensual no carga") && pSol.includes("garantia: corrección de errores"), "Claude recibe la solicitud y la política P-007");
  await page.keyboard.press("Escape");

  /* ---------------- soporte: resolver ---------------- */
  await side(page, "Soporte");
  await page.locator("h1", { hasText: "Soporte" }).waitFor();
  ok((await page.locator(".irow").count()) === 3, "Soporte lista las 3 solicitudes abiertas");
  await shot(page, "c08-soporte.png");
  await page.locator(".irow-main", { hasText: "El informe mensual no carga" }).click();
  await page.selectOption("#s-est", "resuelta");
  await page.fill("#s-res", "Se corrigió la consulta del informe.");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await toast(page, "Solicitud guardada.");
  dump = await store(page);
  const solRes = docs(dump, "solicitudes").find((s) => s.titulo === "El informe mensual no carga");
  ok(solRes.estado === "resuelta" && solRes.resuelta && solRes.cobertura === "garantia", "la solicitud queda resuelta con su fecha");
  ok(docs(dump, "solicitudes").some((s) => s.titulo === "Agregar exportación a Excel" && s.cobertura === "evolutivo"), "la solicitud del acta queda como evolutivo");
  ok(docs(dump, "actividades").some((a) => a.tipo === "solicitud" && a.accion === "resuelta"), "el historial registra la solicitud resuelta");

  /* ---------------- cobros: mantención nueva y recordatorio de pago ---------------- */
  await side(page, "Cobros");
  await page.locator("h1", { hasText: "Cobros" }).waitFor();
  ok(await page.locator(".kpi.alert", { hasText: "Vencido" }).isVisible(), "Cobros destaca lo vencido");
  await page.getByRole("button", { name: "Nueva mantención" }).click();
  await page.locator("#man-title").waitFor();
  await page.selectOption("#mt-cli", { label: "Logística Sur" });
  await page.fill("#mt-monto", "150000");
  await page.getByRole("button", { name: "Agregar mantención" }).click();
  await toast(page, "Mantención agregada");
  await page.waitForTimeout(400);
  dump = await store(page);
  const manLS = docs(dump, "mantenciones").find((m) => m.monto === 150000);
  ok(manLS && !!dump[`cobros/cob-m-${manLS.id}-${MK}`], "la mantención nueva genera su mensualidad");
  await page.locator(".irow", { hasText: "Pago final (70%)" }).getByRole("button", { name: "Recordar" }).click();
  await page.locator("#cc-title").waitFor();
  ok((await page.locator(".modal .chip", { hasText: "Recordatorio de pago" }).getAttribute("aria-pressed")) === "true", "el recordatorio parte con el objetivo de cobro");
  ok((await page.inputValue("#cc-para")) === "ct-2", "el recordatorio va al contacto de facturación");
  await page.locator(".modal .btn.claude", { hasText: "Redactar con Claude" }).click();
  await page.locator("#draft-title", { hasText: "Clínica Norte" }).waitFor();
  prompts = await page.evaluate(() => window.__mockPrompts);
  const pCobro = prompts[prompts.length - 1];
  ok(pCobro.includes("Recordatorio de pago") && pCobro.includes("Factura: 115") && pCobro.includes("4.998.000"), "Claude recibe el cobro con factura y total con IVA");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  await shot(page, "c09-cobros.png");
  await noOverflow(page, "escritorio, Cobros");
  /* una mensualidad que no se cobra se anula: el documento con id fijo se queda y no se vuelve a generar */
  await page.getByRole("button", { name: /^Mantención técnica · .+ Logística Sur$/ }).click();
  await page.locator("#cob-title").waitFor();
  await page.locator(".modal").getByRole("button", { name: "Anular", exact: true }).click();
  await page.locator(".modal").getByRole("button", { name: "Sí, anular" }).click();
  await toast(page, "Mensualidad anulada");
  await page.waitForTimeout(300);
  dump = await store(page);
  ok(dump[`cobros/cob-m-${manLS.id}-${MK}`] && dump[`cobros/cob-m-${manLS.id}-${MK}`].estado === "anulado", "la mensualidad generada se anula en vez de borrarse");

  /* ---------------- clientes y proyectos ---------------- */
  await side(page, "Clientes");
  await page.locator("table.leads tbody tr").first().waitFor();
  ok((await page.locator("table.leads tbody tr").count()) === 2, "Clientes lista los 2 clientes");
  await shot(page, "c10-clientes.png");
  await side(page, "Proyectos");
  await page.locator(".board .col").first().waitFor();
  ok((await page.locator(".board .kcard").count()) === 2, "el tablero muestra los 2 proyectos");
  await shot(page, "c11-proyectos.png");
  await noOverflow(page, "escritorio, Proyectos");

  /* ---------------- respaldo ---------------- */
  await side(page, "Ajustes");
  await page.getByRole("button", { name: "Exportar cobros (CSV)" }).click();
  await page.getByRole("button", { name: "Respaldo completo (JSON)" }).click();
  await page.waitForTimeout(400);
  const dls = await page.evaluate(() => window.__downloads);
  ok(dls.length === 2 && dls[0].head.includes("N° factura") && dls[1].filename.endsWith(".json"), "exporta los cobros y el respaldo completo");
  dump = await store(page);
  fs.writeFileSync(path.join(OUT, "seed-clientes.json"), JSON.stringify(dump, null, 1));

  /* ---------------- teléfono ---------------- */
  const phone = await open({ name: "teléfono", viewport: { width: 390, height: 844 }, touch: true, seed: dump });
  await page.close();
  await phone.waitForTimeout(800);
  const reabierto = await store(phone);
  ok(reabierto[`cobros/cob-m-${manLS.id}-${MK}`].estado === "anulado", "al abrir de nuevo, la mensualidad anulada no se vuelve a generar");
  await noOverflow(phone, "teléfono, Hoy");
  await phone.locator(".tabs button", { hasText: /^Más/ }).click();
  await phone.locator(".more").waitFor();
  await shot(phone, "c12-movil-mas.png");
  await phone.locator(".more button", { hasText: /^Soporte/ }).click();
  await phone.locator("h1", { hasText: "Soporte" }).waitFor();
  await noOverflow(phone, "teléfono, Soporte");
  await phone.locator(".tabs button", { hasText: /^Clientes/ }).click();
  await phone.locator(".only-narrow .irow").first().waitFor();
  await noOverflow(phone, "teléfono, Clientes");
  await phone.locator(".only-narrow .irow-main", { hasText: "Clínica Norte" }).click();
  await phone.locator("#cli-title").waitFor();
  await phone.locator(".dtabs button", { hasText: "Cobros" }).click();
  await shot(phone, "c13-movil-cliente.png");
  await noOverflow(phone, "teléfono, ficha del cliente");

  /* ---------------- modo oscuro ---------------- */
  const dark = await open({ name: "oscuro", dark: true, seed: dump });
  await phone.close();
  await side(dark, "Cobros");
  await dark.locator("h1", { hasText: "Cobros" }).waitFor();
  await shot(dark, "c14-oscuro-cobros.png");
  await side(dark, "Proyectos");
  await dark.locator(".board .kcard").first().click();
  await dark.locator("#pro-title").waitFor();
  await shot(dark, "c15-oscuro-proyecto.png");

  await browser.close();
  console.log(notes.join("\n"));
  if (errors.length) { console.error("\n" + errors.join("\n")); process.exit(1); }
  console.log(`\nTodo bien. Capturas en ${OUT}`);
})().catch((e) => { console.error(e); console.error(errors.join("\n")); process.exit(1); });
