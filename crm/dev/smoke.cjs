/* Prueba de humo del CRM con Playwright y el mock de window.claude.
   Recorre: firma y ajustes, lead nuevo, llamada con análisis de Claude, correo y WhatsApp
   redactados con Claude, importación, vistas, exportación; luego teléfono y modo oscuro.

   Uso:
     python3 crm/dev/build_preview.py
     NODE_PATH=$(npm root -g) VENDOR_DIR=<carpeta con preact.umd.min.js, hooks.umd.min.js, htm.umd.min.js> \
       node crm/dev/smoke.cjs [carpeta-de-capturas]
   Sin VENDOR_DIR intenta bajar las librerías desde cdnjs. Sale con código 1 si algo falla. */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const PREVIEW = path.join(__dirname, "preview.html");
const OUT = process.argv[2] || path.join(__dirname, "shots");
const VENDOR = process.env.VENDOR_DIR || "";
const errors = [];
const notes = [];
const ok = (cond, msg) => { if (!cond) errors.push("falló: " + msg); else notes.push("ok: " + msg); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

  async function open(opts) {
    const context = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 860 }, colorScheme: opts.dark ? "dark" : "light", hasTouch: !!opts.touch, isMobile: !!opts.touch });
    try { await context.grantPermissions(["clipboard-read", "clipboard-write"]); } catch (e) { /* no disponible en file:// */ }
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
    if (opts.seed) await page.addInitScript((s) => { window.__MOCK_SEED = s; }, opts.seed);
    await page.goto("file://" + PREVIEW);
    await page.getByRole("heading", { name: "Hoy", exact: true }).waitFor({ timeout: 15000 });
    return page;
  }
  const shot = (page, name) => page.screenshot({ path: path.join(OUT, name), fullPage: false });
  const toast = (page, text) => page.locator(".toast", { hasText: text }).first().waitFor({ timeout: 8000 });
  const noOverflow = async (page, label) => {
    const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: window.innerWidth }));
    ok(r.sw <= r.w + 1, `${label}: sin scroll horizontal (${r.sw} <= ${r.w})`);
  };

  /* ---------------- escritorio, base vacía ---------------- */
  const page = await open({ name: "escritorio" });
  await shot(page, "01-hoy-vacio.png");
  ok(await page.locator(".onboard").isVisible(), "estado vacío con los tres pasos");

  await page.locator(".side .nav button", { hasText: "Ajustes" }).click();
  ok((await page.inputValue("#f-nombre")) === "Lorenzo Bozzo", "la firma toma el nombre del perfil");
  await page.fill("#f-cargo", "Socio fundador · Producto y negocio");
  await page.fill("#f-tel", "9 5555 1234");
  await page.fill("#f-correo", "Lorenzo@ZHdevelopment.cl");
  await page.getByRole("button", { name: "Guardar firma" }).click();
  await toast(page, "Firma guardada.");
  await page.fill("#c-wa", "+56 9 5555 1234");
  await page.fill("#c-gmail", "equipo@example.com");
  await page.getByRole("button", { name: "Guardar ajustes" }).click();
  await toast(page, "Ajustes guardados.");

  await page.locator(".side").getByRole("button", { name: "Nuevo lead" }).click();
  await page.fill("#nl-nombre", "Carolina Pérez");
  await page.fill("#nl-empresa", "Transportes Andes");
  await page.fill("#nl-tel", "9 1234 5678");
  ok((await page.locator(".modal .hint").first().innerText()).includes("+56 9 1234 5678"), "el teléfono se normaliza a +56");
  await page.fill("#nl-correo", "carolina@andes.cl");
  await page.fill("#nl-nec", "Ordenar los despachos entre tres bodegas");
  await page.getByRole("button", { name: "Agregar lead" }).click();
  await page.locator("#lead-title", { hasText: "Carolina Pérez" }).waitFor();
  await shot(page, "02-ficha.png");

  await page.locator(".work-tabs button", { hasText: "Registrar llamada" }).click();
  await page.getByRole("button", { name: "Contestó", exact: true }).click();
  await page.fill("#c-notas", "Coordina despachos con planillas y WhatsApp. Quiere ver el estado de cada pedido.");
  await page.fill("#c-dur", "12");
  await page.getByRole("button", { name: "Analizar con Claude" }).click();
  await page.locator(".work .analysis").waitFor();
  await shot(page, "03-analisis.png");
  await page.getByRole("button", { name: "Guardar llamada" }).click();
  await toast(page, "Llamada registrada.");
  await page.waitForTimeout(200);
  ok((await page.inputValue("#lead-etapa")) === "reunion", "la etapa sugerida por Claude se aplica (Reunión)");
  ok(await page.locator(".drawer .tag", { hasText: "Reunión" }).first().isVisible(), "la próxima acción sugerida queda programada");

  await page.locator(".work-tabs button", { hasText: "Redactar con Claude" }).click();
  await page.locator(".work .seg button", { hasText: "Correo" }).click();
  await page.locator(".work-body .btn.claude", { hasText: "Redactar con Claude" }).click();
  await page.locator("#draft-title", { hasText: "Correo para Carolina Pérez" }).waitFor();
  ok(await page.locator(".email-canvas", { hasText: "Gracias por la conversación de hoy" }).isVisible(), "la vista previa muestra el correo");
  ok(await page.locator(".email-canvas", { hasText: "Socio fundador" }).isVisible(), "la firma aparece en el correo");
  await shot(page, "04-correo-carta.png");
  await page.locator(".editor .seg button", { hasText: "Con cabecera" }).click();
  await page.waitForTimeout(150);
  await shot(page, "05-correo-cabecera.png");
  const gmail = await page.locator("a", { hasText: "Copiar y abrir Gmail" }).getAttribute("href");
  ok(gmail.includes("to=carolina%40andes.cl") && gmail.includes("authuser=equipo%40example.com"), "el enlace de Gmail lleva destinatario y cuenta");
  await page.fill("#d-pedido", "más corto y propone el jueves a las 11");
  await page.getByRole("button", { name: "Aplicar cambios" }).click();
  await toast(page, "Borrador actualizado por Claude.");
  ok((await page.inputValue("#d-asunto")) === "Retomemos lo de los despachos", "Claude aplica los cambios pedidos");
  await page.getByRole("button", { name: "Marcar como enviado" }).click();
  await page.getByRole("button", { name: "Sí, registrar envío" }).click();
  await toast(page, "Marcado como enviado");

  await page.locator(".work-tabs button", { hasText: "Redactar con Claude" }).click();
  await page.locator(".work-body .btn.claude", { hasText: "Redactar con Claude" }).click();
  await page.locator("#draft-title", { hasText: "WhatsApp para Carolina Pérez" }).waitFor();
  const wa = await page.locator("a", { hasText: "Abrir en WhatsApp" }).getAttribute("href");
  ok(wa.startsWith("https://wa.me/56912345678?text=Hola%20Carolina"), "el enlace de WhatsApp lleva número y texto");
  await shot(page, "06-whatsapp.png");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);
  await page.keyboard.press("Escape");

  await page.locator(".side .nav button", { hasText: "Hoy" }).click();
  await page.locator(".page-head").getByRole("button", { name: "Importar" }).click();
  await page.fill("#imp-texto", "Matías Rojas, Ferretería Sur, 9 8765 4321\nCarolina Pérez, Transportes Andes\nDaniela Soto, Clínica Norte, dsoto@clinicanorte.cl");
  await page.getByRole("button", { name: "Ordenar con Claude" }).click();
  await page.locator(".import-table tbody tr").first().waitFor();
  ok((await page.locator(".import-table tbody tr").count()) === 3, "la importación muestra 3 contactos");
  ok(await page.locator(".import-table tr.dup", { hasText: "Carolina Pérez" }).isVisible(), "detecta el duplicado por teléfono");
  await page.getByRole("button", { name: "Agregar 2 leads" }).click();
  await toast(page, "2 leads agregados.");

  await page.locator(".side .nav button", { hasText: "Leads" }).click();
  await page.locator("table.leads tbody tr").first().waitFor();
  ok((await page.locator("table.leads tbody tr").count()) === 3, "la tabla muestra 3 leads");
  await shot(page, "07-leads.png");
  await page.fill("#buscar", "ferre");
  ok((await page.locator("table.leads tbody tr").count()) === 1, "la búsqueda filtra");
  await page.fill("#buscar", "8765");
  ok((await page.locator("table.leads tbody tr").count()) === 1, "la búsqueda por teléfono funciona");
  await page.fill("#buscar", "");

  await page.locator(".side .nav button", { hasText: "Embudo" }).click();
  await page.locator(".board .col").first().waitFor();
  await shot(page, "08-embudo.png");
  await page.locator(".side .nav button", { hasText: "Borradores" }).click();
  await page.locator(".side .nav button", { hasText: "Borradores" }).click();
  await page.locator(".seg button", { hasText: "Todos" }).click();
  ok((await page.locator(".ditem").count()) === 2, "Borradores lista el correo y el WhatsApp");
  await shot(page, "09-borradores.png");
  await page.locator(".side .nav button", { hasText: "Hoy" }).click();
  await page.waitForTimeout(150);
  await shot(page, "10-hoy.png");
  await noOverflow(page, "escritorio");

  await page.locator(".side .nav button", { hasText: "Ajustes" }).click();
  await page.getByRole("button", { name: "Exportar leads (CSV)" }).click();
  await page.getByRole("button", { name: "Respaldo completo (JSON)" }).click();
  await page.waitForTimeout(300);
  const downloads = await page.evaluate(() => window.__downloads);
  ok(downloads.length === 2 && downloads[0].head.includes("Nombre") && downloads[1].filename.endsWith(".json"), "exporta CSV y respaldo JSON");

  const dump = await page.evaluate(() => Object.fromEntries(window.__mockStore));
  const count = (pre) => Object.keys(dump).filter((k) => k.startsWith(pre + "/")).length;
  ok(count("leads") === 3, "3 leads en la base");
  ok(count("borradores") === 2, "2 borradores en la base");
  ok(count("actividades") >= 3, `actividades registradas (${count("actividades")})`);
  const lead = Object.values(dump).find((d) => d.nombre === "Carolina Pérez");
  ok(lead && lead.telefono === "+56912345678" && lead.cargo === "Jefa de operaciones", "el lead guarda teléfono E.164 y el cargo detectado en la llamada");
  const prompts = await page.evaluate(() => window.__mockPrompts);
  const mailPrompt = prompts.find((p) => p.includes("Escribe un correo"));
  ok(mailPrompt && mailPrompt.includes("Transportes Andes") && mailPrompt.includes("Llamada · Contestó"), "Claude recibe los datos y el historial del lead");
  ok(mailPrompt && mailPrompt.includes("Lorenzo Bozzo, Socio fundador"), "Claude sabe quién firma");
  fs.writeFileSync(path.join(OUT, "seed.json"), JSON.stringify(dump, null, 1));

  /* ---------------- teléfono ---------------- */
  const phone = await open({ name: "teléfono", viewport: { width: 390, height: 844 }, touch: true, seed: dump });
  await page.close();
  await shot(phone, "11-movil-hoy.png");
  await noOverflow(phone, "teléfono, Hoy");
  ok(await phone.locator(".tabs").isVisible(), "barra inferior visible en el teléfono");
  await phone.locator(".tabs button", { hasText: "Leads" }).click();
  await phone.locator(".only-narrow .lrow").first().waitFor();
  await noOverflow(phone, "teléfono, Leads");
  await phone.locator(".only-narrow .lrow-main").first().click();
  await phone.locator("#lead-title").waitFor();
  await shot(phone, "12-movil-ficha.png");
  await phone.locator(".work-tabs button", { hasText: "Registrar llamada" }).click();
  await shot(phone, "13-movil-llamada.png");

  /* ---------------- modo oscuro ---------------- */
  const dark = await open({ name: "oscuro", dark: true, seed: dump });
  await phone.close();
  await shot(dark, "14-oscuro-hoy.png");
  await dark.locator(".side .nav button", { hasText: "Borradores" }).click();
  await dark.locator(".seg button", { hasText: "Todos" }).click();
  await dark.locator(".ditem").first().click();
  await dark.locator("#draft-title").waitFor();
  await shot(dark, "15-oscuro-borrador.png");

  await browser.close();
  console.log(notes.join("\n"));
  if (errors.length) { console.error("\n" + errors.join("\n")); process.exit(1); }
  console.log(`\nTodo bien. Capturas en ${OUT}`);
})().catch((e) => { console.error(e); console.error(errors.join("\n")); process.exit(1); });
