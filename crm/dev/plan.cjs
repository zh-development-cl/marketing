/* Prueba del menú de cinco secciones y de «Planificar la semana» con Playwright y el mock de
   window.claude. Recorre: las cinco secciones del menú, las pestañas de Hoy (Para hoy, Borradores,
   Métricas) y de Clientes (Clientes, Proyectos, Soporte, Cobros), que Leads recuerde el tablero,
   que Buscar lleve a una pestaña, y el planificador: el aviso en Hoy y en Leads, el reparto entre
   los socios sin pasar de las llamadas por día (contando las que ya tienen), quitar un lead, un
   solo socio, agendar, los responsables nuevos, y teléfono y modo oscuro. Usa datos inventados.

   Uso:
     python3 crm/dev/build_preview.py
     NODE_PATH=$(npm root -g) VENDOR_DIR=<carpeta con preact.umd.min.js, hooks.umd.min.js, htm.umd.min.js> \
       node crm/dev/plan.cjs [carpeta-de-capturas]
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
const D1 = habil(T, 1), D2 = habil(T, 2);
/* El día hábil siguiente se llama «Mañana» si es mañana; si no, «El lunes». */
const SIG = Math.round((Date.parse(D1 + "T12:00:00Z") - Date.parse(T + "T12:00:00Z")) / 864e5) === 1 ? "Mañana" : "El lunes";
const lead = (o) => ({ cargo: "", correo: "", origen: "prospeccion", trato: "tu", intentos: 0, proxima: null, prioridad: "media", necesidad: "", responsable: null, etapa: "nuevo", actualizado: iso(-1), creadoPor: ME, ...o });

const SEED = {
  ["equipo/" + ME]: { nombre: "Lorenzo Bozzo", cargo: "Socio", telefono: "+56955551234", correo: "lorenzo@zhdevelopment.cl" },
  ["equipo/" + NICO]: { nombre: "Nicolás Valdivia", cargo: "Socio", telefono: "+56955554321", correo: "nicolas@zhdevelopment.cl" },
  "config/general": { agendaUrl: "https://zhdevelopment.cl/#agendar" },
  /* Para planificar: seis con teléfono y sin tarea. */
  "leads/p1": lead({ nombre: "Andrea Fuentes", empresa: "Ferretería Andes", telefono: "+56922220001", responsable: "lorenzo", prioridad: "alta", creado: iso(-5) }),
  "leads/p2": lead({ nombre: "Bruno Díaz", empresa: "Viña Norte", telefono: "+56922220002", creado: iso(-10) }),
  "leads/p3": lead({ nombre: "Clara Soto", empresa: "Imprenta Sur", telefono: "+56922220003", guion: "Abrir con la pregunta por las cotizaciones.", creado: iso(-6) }),
  "leads/p4": lead({ nombre: "Diego Ruiz", empresa: "Taller Norte", telefono: "+56922220004", responsable: "nicolas", creado: iso(-9) }),
  "leads/p5": lead({ nombre: "Elena Vidal", empresa: "Café Central", telefono: "+56922220005", etapa: "contactado", creado: iso(-8) }),
  "leads/p6": lead({ nombre: "Javiera Soto", empresa: "Óptica Central", telefono: "+56922220006", creado: iso(-7) }),
  /* Fuera del plan: sin teléfono, no contactar y uno que ya tiene su llamada (de Lorenzo, el primer día). */
  "leads/x1": lead({ nombre: "Hugo Paz", empresa: "Bodega Este", telefono: "", creado: iso(-4) }),
  "leads/x2": lead({ nombre: "Irene Lagos", empresa: "Librería Mar", telefono: "+56922220008", noContactar: true, noContactarDesde: iso(-3), creado: iso(-4) }),
  "leads/x3": lead({ nombre: "Gabriela Rivas", empresa: "Fletes Paz", telefono: "+56922220009", etapa: "contactado", responsable: "lorenzo", creado: iso(-12) }),
  "tareas/tar-x3": { leadId: "x3", tipo: "llamar", titulo: "Volver a llamar", nota: "", fecha: D1, hora: "", responsable: "lorenzo", estado: "pendiente", origen: "manual", creado: iso(-1), actualizado: iso(-1), creadoPor: ME },
  "borradores/bor-1": { leadId: "x3", canal: "whatsapp", estado: "por_revisar", texto: "Hola Gabriela, ¿te acomoda conversar el jueves?", firma: ME, objetivo: "seguimiento", generadoPor: "claude", autor: "claude", creado: iso(-1), actualizado: iso(-1) },
  "clientes/cli-a": { nombre: "Clínica Norte", razonSocial: "Clínica Norte SpA", rut: "", contactos: [], responsable: "lorenzo", trato: "tu", leadIds: [], estado: "activo", notas: "", creado: iso(-30), actualizado: iso(-30), creadoPor: ME },
  "solicitudes/sol-a": { clienteId: "cli-a", proyectoId: "", titulo: "No llegan los recordatorios", descripcion: "", canal: "whatsapp", tipo: "error", cobertura: "por_definir", prioridad: "alta", estado: "nueva", responsable: ME, horasEstimadas: null, horasReales: null, resolucion: "", cotizacion: null, creado: iso(-2), actualizado: iso(-2), creadoPor: ME },
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  async function open(opts) {
    const context = await browser.newContext({ viewport: opts.viewport || { width: 1512, height: 900 }, colorScheme: opts.dark ? "dark" : "light" });
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
    await page.addInitScript((o) => { window.__MOCK_SEED = o.seed; window.__MOCK_RECORDATORIOS = false; }, { seed: SEED });
    await page.goto("file://" + PREVIEW);
    await page.getByRole("heading", { name: "Hoy", exact: true }).waitFor({ timeout: 15000 });
    return page;
  }
  const shot = (page, name) => page.screenshot({ path: path.join(OUT, name), fullPage: false });
  const toast = (page, text) => page.locator(".toast", { hasText: text }).first().waitFor({ timeout: 15000 }).then(() => true, () => false);
  const store = (page) => page.evaluate(() => Object.fromEntries(window.__mockStore));
  const textos = (loc) => loc.allInnerTexts().then((xs) => xs.map((t) => t.replace(/\s+/g, " ").trim()));
  const actual = (page, sel) => page.locator(sel + ' button[aria-current="page"]').innerText().then((t) => t.replace(/\d+/g, "").trim());
  const h1 = (page) => page.locator(".page-head h1").innerText();

  const page = await open({ name: "plan" });

  /* ---------------- el menú: cinco secciones ---------------- */
  ok((await textos(page.locator(".side .nav button:not(.nav-buscar) .lbl"))).join("|") === "Hoy|Llamar|Leads|Clientes|Ajustes", "el menú tiene cinco secciones: Hoy, Llamar, Leads, Clientes y Ajustes");
  ok((await textos(page.locator(".subnav button"))).map((t) => t.replace(/\d+/g, "").trim()).join("|") === "Para hoy|Borradores|Métricas", "Hoy trae sus pestañas: Para hoy, Borradores y Métricas");
  ok((await page.locator(".subnav button", { hasText: "Borradores" }).locator(".count").innerText()) === "1", "la pestaña Borradores cuenta los que hay por revisar");
  await page.locator(".subnav button", { hasText: "Borradores" }).click();
  ok((await h1(page)) === "Borradores" && (await actual(page, ".side .nav")) === "Hoy", "Borradores se abre dentro de Hoy, que sigue marcada en el menú");
  await page.locator(".subnav button", { hasText: "Métricas" }).click();
  ok((await h1(page)) === "Métricas", "y Métricas también");
  ok((await page.locator(".side .nav button", { hasText: /^Clientes/ }).locator(".count").innerText()) === "1", "Clientes muestra en el menú lo que hay que atender (una solicitud abierta)");
  await irA(page, "clientes");
  ok((await textos(page.locator(".subnav button"))).map((t) => t.replace(/\d+/g, "").trim()).join("|") === "Clientes|Proyectos|Soporte|Cobros", "Clientes trae sus pestañas: Clientes, Proyectos, Soporte y Cobros");
  await page.locator(".subnav button", { hasText: "Cobros" }).click();
  ok((await h1(page)) === "Cobros" && (await actual(page, ".side .nav")) === "Clientes", "Cobros se abre dentro de Clientes");
  await shot(page, "p01-pestanas.png");
  await irA(page, "embudo");
  ok((await h1(page)) === "Embudo de leads", "Leads se ve como tablero con «Tablero»");
  await irA(page, "hoy");
  await page.locator(".side .nav button", { hasText: /^Leads/ }).click();
  ok((await h1(page)) === "Embudo de leads", "y al volver a Leads, sigue en el tablero");
  await page.keyboard.press("Control+k");
  await page.locator(".cmdk-input input").fill("soporte");
  await page.keyboard.press("Enter");
  ok((await h1(page)) === "Soporte" && (await actual(page, ".subnav")) === "Soporte", "Buscar sigue llevando a cualquier vista, con su pestaña marcada");

  /* ---------------- planificar: el aviso ---------------- */
  await irA(page, "hoy");
  const aviso = page.locator(".plan-aviso");
  ok((await aviso.innerText()).includes("6 leads sin tarea · 4 sin responsable"), "Hoy avisa cuántos leads no tienen tarea ni responsable (sin contar los sin teléfono ni los de no contactar)");
  await irA(page, "leads");
  ok(await page.locator(".plan-aviso.corto").isVisible(), "Leads lo avisa en una línea");
  await page.locator(".plan-aviso .btn", { hasText: "Planificar la semana" }).click();
  await page.locator("#plan-title").waitFor();
  await page.locator(".modal .chip", { hasText: SIG }).click();
  await page.fill("#plan-dia", "2");
  const resumen = () => page.locator(".plan-resumen").innerText();
  ok((await resumen()).startsWith("6 llamadas: 3 para Lorenzo y 3 para Nicolás"), "reparte entre los dos: 3 y 3");
  const dia1 = page.locator(".plan-dias li").first();
  ok((await dia1.locator(".plan-socio").first().locator("b").innerText()) === "1", "a Lorenzo le deja una el primer día, porque ya tenía una llamada agendada");
  ok((await dia1.locator(".plan-socio").first().innerText()).includes("Ferretería Andes"), "y parte por el de prioridad alta, que ya era suyo");
  ok((await dia1.locator(".plan-socio").nth(1).innerText()).includes("Imprenta Sur, Viña Norte"), "a Nicolás, primero el que ya tiene guion y después el más antiguo");
  ok((await page.locator(".modal").innerText()).includes("1 sin teléfono queda fuera"), "avisa el que no tiene teléfono");
  await shot(page, "p02-planificar.png");
  await page.locator(".plan-leads summary").click();
  await page.locator(".plan-lista .check", { hasText: "Óptica Central" }).locator("input").click();
  ok((await resumen()).startsWith("5 llamadas"), "se puede sacar un lead del plan");
  await page.locator(".plan-lista .check", { hasText: "Óptica Central" }).locator("input").click();
  await page.locator(".modal .seg button", { hasText: "Lorenzo" }).click();
  ok((await resumen()).startsWith("5 llamadas: 5 para Lorenzo") && (await page.locator(".modal").innerText()).includes("1 lead es de Nicolás: no se incluyen"), "si llama uno solo, los del otro socio no se incluyen");
  await page.locator(".modal .seg button", { hasText: "Los dos" }).click();
  await page.locator(".modal .btn.primary", { hasText: "Agendar 6 llamadas" }).click();
  ok(await toast(page, "Quedaron 6 llamadas agendadas: 3 para Lorenzo y 3 para Nicolás"), "al agendar, el aviso dice cuántas y para quién");
  const st = await store(page);
  const tp = Object.values(st).filter((v) => v && v.origen === "plan");
  const de = (id) => tp.find((t) => t.leadId === id) || {};
  ok(tp.length === 6 && tp.every((t) => t.tipo === "llamar" && t.estado === "pendiente" && !t.hora), "quedan seis tareas de llamar, sin hora");
  ok(de("p1").responsable === "lorenzo" && de("p1").fecha === D1 && de("p3").responsable === "nicolas" && de("p3").fecha === D1 && de("p2").responsable === "nicolas" && de("p2").fecha === D1, "el primer día: Lorenzo con Ferretería Andes; Nicolás con Imprenta Sur y Viña Norte");
  ok(de("p4").responsable === "nicolas" && de("p4").fecha === D2 && de("p5").responsable === "lorenzo" && de("p5").fecha === D2 && de("p6").responsable === "lorenzo" && de("p6").fecha === D2, "el segundo: Nicolás con Taller Norte (era suyo); Lorenzo con Café Central y Óptica Central");
  ok(de("p1").titulo === "Primera llamada" && de("p5").titulo === "Retomar el contacto", "un lead por contactar queda con «Primera llamada»; uno ya contactado, con «Retomar el contacto»");
  ok(st["leads/p2"].responsable === "nicolas" && st["leads/p5"].responsable === "lorenzo" && st["leads/p4"].responsable === "nicolas", "los que no tenían responsable quedan con quien los llama; los demás siguen igual");
  ok(!Object.values(st).some((v) => v && v.origen === "plan" && ["x1", "x2", "x3"].includes(v.leadId)), "no toca al que no tiene teléfono, al que pidió no ser contactado ni al que ya tenía tarea");
  await irA(page, "hoy");
  ok((await page.locator(".plan-aviso").count()) === 0, "con todo agendado, el aviso desaparece");
  await page.close();

  /* ---------------- teléfono y oscuro ---------------- */
  const tel = await open({ name: "telefono", viewport: { width: 390, height: 844 } });
  ok((await textos(tel.locator("nav.tabs button"))).map((t) => t.replace(/\d+/g, "").trim()).join("|") === "Hoy|Llamar|Leads|Clientes|Ajustes", "en el teléfono, la barra de abajo trae las cinco secciones");
  await tel.locator(".plan-aviso .btn").click();
  await tel.locator("#plan-title").waitFor();
  const sw = await tel.evaluate(() => Math.max(document.documentElement.scrollWidth, document.querySelector(".modal").scrollWidth));
  ok(sw <= 390, `en el teléfono, la ventana de planificar cabe (${sw} <= 390)`);
  await shot(tel, "p03-telefono.png");
  await tel.close();
  const dark = await open({ name: "oscuro", dark: true });
  await dark.locator(".plan-aviso .btn").click();
  await dark.locator("#plan-title").waitFor();
  await dark.waitForTimeout(200);
  await shot(dark, "p04-oscuro.png");
  await dark.close();

  await browser.close();
  for (const n of notes) console.log(n);
  if (errors.length) { console.error("\n" + errors.join("\n")); process.exit(1); }
  console.log("\nTodo bien. Capturas en " + OUT);
})().catch((e) => { for (const n of notes) console.log(n); if (errors.length) console.error(errors.join("\n")); console.error(e); process.exit(1); });
