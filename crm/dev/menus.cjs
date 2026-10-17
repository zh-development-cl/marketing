/* Prueba de los menús desplegables propios con Playwright y el mock de window.claude. Recorre: el
   menú de un filtro (título, marca en lo elegido, iniciales de los socios), elegir con el mouse y
   con el teclado (flechas, Enter, letras), apretar y soltar sobre una opción, el color de cada
   etapa en la ficha, que Escape cierre el menú sin cerrar la ficha, que un clic afuera solo lo
   cierre, el menú de la inicial en una tarjeta del embudo, el buscador en una lista larga, un
   select dentro de una ventana, que no se salga de la pantalla, que con el dedo quede el selector
   del teléfono, y modo oscuro y pantalla angosta. Usa datos inventados.

   Uso:
     python3 crm/dev/build_preview.py
     NODE_PATH=$(npm root -g) VENDOR_DIR=<carpeta con preact.umd.min.js, hooks.umd.min.js, htm.umd.min.js> \
       node crm/dev/menus.cjs [carpeta-de-capturas]
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
const errors = [];
const notes = [];
const ok = (cond, msg) => { if (!cond) errors.push("falló: " + msg); else notes.push("ok: " + msg); };
const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const T = keyFmt.format(new Date());
const addDays = (k, n) => { const d = new Date(k + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const iso = (n) => new Date(Date.now() + n * 864e5).toISOString();
const lead = (o) => ({ cargo: "", correo: "", origen: "prospeccion", trato: "tu", intentos: 0, proxima: null, prioridad: "media", necesidad: "", responsable: "lorenzo", creado: iso(-20), actualizado: iso(-1), creadoPor: ME, ...o });
const CLIENTES = ["Ferretería Andes", "Ferretería Lago", "Clínica Norte", "Óptica Central", "Taller Sur", "Imprenta Sur", "Café Central", "Vivero Sur", "Textil Norte", "Fletes Paz", "Transportes Río", "Librería Mar", "Bodega Este", "Panadería Sol"];

const SEED = {
  ["equipo/" + ME]: { nombre: "Lorenzo Bozzo", cargo: "Socio", telefono: "+56955551234", correo: "lorenzo@zhdevelopment.cl" },
  ["equipo/" + NICO]: { nombre: "Nicolás Valdivia", cargo: "Socio", telefono: "+56955554321", correo: "nicolas@zhdevelopment.cl" },
  "config/general": { agendaUrl: "https://zhdevelopment.cl/#agendar" },
  "leads/lead-a": lead({ nombre: "Andrea Fuentes", empresa: "Ferretería Andes", telefono: "+56922223333", etapa: "nuevo" }),
  "leads/lead-b": lead({ nombre: "Bruno Díaz", empresa: "Viña Norte", telefono: "+56933334444", etapa: "contactado", responsable: "nicolas" }),
  "leads/lead-c": lead({ nombre: "Clara Soto", empresa: "Imprenta Sur", telefono: "+56944445555", etapa: "propuesta", valor: 3000000, origen: "referido" }),
  "leads/lead-d": lead({ nombre: "Diego Ruiz", empresa: "Taller Norte", telefono: "+56955556666", etapa: "nuevo", responsable: null }),
  ...Object.fromEntries(CLIENTES.map((n, i) => [`clientes/cli-${i}`, { nombre: n, razonSocial: n + " SpA", rut: "", contactos: [], responsable: "lorenzo", trato: "tu", leadIds: [], estado: "activo", notas: "", creado: iso(-30), actualizado: iso(-30), creadoPor: ME }])),
  "proyectos/pro-a": { clienteId: "cli-0", nombre: "Inventario", tipo: "software", valor: 4000000, estado: "construir", inicio: addDays(T, -20), entregaEstimada: addDays(T, 20), produccion: "", garantiaDias: 60, hitos: [], enlaces: [], caso: "", alcance: "", responsable: "lorenzo", creado: iso(-20), actualizado: iso(-2), creadoPor: ME },
  "cobros/cob-1": { clienteId: "cli-0", proyectoId: "pro-a", tipo: "anticipo", concepto: "Anticipo (30%)", monto: 1200000, fecha: addDays(T, -20), estado: "pagado", factura: "101", fechaFactura: addDays(T, -20), vence: "", fechaPago: addDays(T, -10), notas: "", creado: iso(-20), actualizado: iso(-10), creadoPor: ME },
  "cobros/cob-2": { clienteId: "cli-0", proyectoId: "pro-a", tipo: "hito", concepto: "Pago intermedio (40%)", monto: 1600000, fecha: addDays(T, 5), estado: "por_facturar", factura: "", fechaFactura: "", vence: "", fechaPago: "", notas: "", creado: iso(-20), actualizado: iso(-2), creadoPor: ME },
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  async function open(opts) {
    const context = await browser.newContext({ viewport: opts.viewport || { width: 1360, height: 900 }, colorScheme: opts.dark ? "dark" : "light", hasTouch: !!opts.touch, isMobile: !!opts.touch });
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
  const toast = (page, text) => page.locator(".toast", { hasText: text }).first().waitFor({ timeout: 8000 }).then(() => true, () => false);
  const visto = (loc, ms) => loc.first().waitFor({ timeout: ms || 4000 }).then(() => true, () => false);
  const store = (page) => page.evaluate(() => Object.fromEntries(window.__mockStore));
  const nav = (page, re) => page.locator(".side .nav button", { hasText: re }).click();
  const menu = (page) => page.locator(".menu-sel");
  const opcion = (page, texto) => page.locator('.menu-sel [role="option"]', { hasText: texto });
  const textos = (page) => page.locator('.menu-sel [role="option"] .ms-txt').allInnerTexts();
  const foco = (page) => page.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.className));
  const cerrado = (page) => menu(page).waitFor({ state: "detached", timeout: 3000 }).then(() => true, () => false);
  const dentro = (page) => page.evaluate(() => { const r = document.querySelector(".menu-sel").getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= document.documentElement.clientWidth && r.bottom <= window.innerHeight; });

  const page = await open({ name: "menus" });
  await nav(page, /^Leads/);
  await page.locator("#f-resp").waitFor();

  /* ---------------- un filtro con el mouse ---------------- */
  await page.click("#f-resp");
  ok(await visto(menu(page)), "al hacer clic en un select se abre el menú propio, no el del sistema");
  ok((await page.locator(".menu-sel .menu-sel-tit").innerText()).trim().toLowerCase() === "responsable", "el menú de un filtro lleva su título");
  ok((await textos(page)).join("|") === "Todo el equipo|Lorenzo|Nicolás|Sin responsable", "con las mismas opciones del select");
  ok((await page.locator('.menu-sel [aria-selected="true"]').innerText()).includes("Todo el equipo") && await page.locator('.menu-sel [aria-selected="true"] .ms-ok').isVisible(), "lo elegido va marcado");
  ok((await opcion(page, "Lorenzo").locator(".avatar").innerText()) === "L" && (await opcion(page, "Nicolás").locator(".avatar.r2").innerText()) === "N" && await opcion(page, "Sin responsable").locator(".avatar.vacio").isVisible(), "cada socio con su inicial y «Sin responsable» con el círculo punteado");
  ok((await page.locator("#f-resp").getAttribute("data-abierto")) !== null, "el select se ve abierto mientras está el menú");
  await page.waitForTimeout(220);
  await shot(page, "m01-filtro.png");
  await opcion(page, "Nicolás").click();
  ok(await cerrado(page), "elegir cierra el menú");
  ok((await page.inputValue("#f-resp")) === "nicolas" && (await page.locator("table.leads tbody tr").count()) === 1 && await page.locator("table.leads tbody tr", { hasText: "Viña Norte" }).isVisible(), "y aplica el filtro como el select de siempre");
  ok((await foco(page)) === "f-resp", "el foco vuelve al select");

  /* ---------------- con el teclado ---------------- */
  await page.keyboard.press("ArrowDown");
  ok(await visto(menu(page)), "con el select enfocado, la flecha abre el menú");
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  ok(await cerrado(page) && (await page.inputValue("#f-resp")) === "" && (await page.locator("table.leads tbody tr").count()) === 4, "Inicio y Enter eligen la primera opción");
  await page.focus("#f-origen");
  await page.keyboard.press("Enter");
  await menu(page).waitFor();
  await page.keyboard.type("ref");
  ok((await page.locator('.menu-sel [role="option"].activo').innerText()).includes("Referido"), "escribir unas letras salta a la opción");
  await page.keyboard.press("Enter");
  ok((await page.inputValue("#f-origen")) === "referido" && (await page.locator("table.leads tbody tr").count()) === 1, "y Enter la elige");
  await page.keyboard.press(" ");
  await menu(page).waitFor();
  await page.keyboard.press("ArrowUp");
  ok((await page.locator('.menu-sel [role="option"].activo').innerText()).includes("LinkedIn"), "las flechas recorren las opciones");
  await page.keyboard.press("Escape");
  ok(await cerrado(page) && (await page.inputValue("#f-origen")) === "referido", "Escape cierra sin cambiar nada");
  await page.selectOption("#f-origen", "");

  /* ---------------- apretar, deslizar y soltar ---------------- */
  const b = await page.locator("#f-orden").boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await menu(page).waitFor();
  await page.waitForTimeout(320);
  const o = await opcion(page, "Nombre").boundingBox();
  await page.mouse.move(o.x + o.width / 2, o.y + o.height / 2, { steps: 4 });
  await page.mouse.up();
  ok(await cerrado(page) && (await page.inputValue("#f-orden")) === "nombre", "apretar el select, deslizar hasta una opción y soltar la elige");

  /* ---------------- en la ficha: etapas, Escape y clic afuera ---------------- */
  await page.locator("table.leads tbody tr", { hasText: "Ferretería Andes" }).click();
  await page.locator("#lead-title").waitFor();
  await page.click("#lead-etapa");
  await menu(page).waitFor();
  ok((await page.locator(".menu-sel .ms-punto").count()) === 9 && (await opcion(page, "Perdido").locator(".ms-punto").evaluate((el) => getComputedStyle(el).backgroundColor)) !== (await opcion(page, "Ganado").locator(".ms-punto").evaluate((el) => getComputedStyle(el).backgroundColor)), "las etapas llevan su color");
  ok((await page.locator(".menu-sel .menu-sel-tit").count()) === 0, "un select con su etiqueta a la vista no repite el título");
  await page.waitForTimeout(220);
  await shot(page, "m02-ficha-etapa.png");
  await page.keyboard.press("Escape");
  ok(await cerrado(page) && await page.locator("#lead-title").isVisible(), "Escape cierra el menú y deja la ficha abierta");
  await page.click("#lead-resp");
  await menu(page).waitFor();
  await page.mouse.click(40, 450);
  ok(await cerrado(page), "un clic afuera cierra el menú");
  await page.waitForTimeout(250);
  ok(await page.locator("#lead-title").isVisible(), "y no hace nada más: la ficha sigue abierta");
  await page.click("#lead-etapa");
  await opcion(page, "Contactado").click();
  ok(await toast(page, "Contactado"), "elegir una etapa en el menú la cambia, con su aviso");
  ok((await store(page))["leads/lead-a"].etapa === "contactado", "y queda guardada");
  await page.keyboard.press("Escape");
  await page.locator(".drawer").waitFor({ state: "detached" });

  /* ---------------- la inicial en una tarjeta del embudo ---------------- */
  await page.locator('.side .nav button[title="Embudo de leads"]').click();
  await page.locator(".board.embudo").waitFor();
  await page.locator(".kcard.lead", { hasText: "Taller Norte" }).locator(".avatar").click();
  await menu(page).waitFor();
  ok((await page.locator(".menu-sel .menu-sel-tit").textContent()) === "Responsable de Taller Norte", "la inicial de una tarjeta abre el menú de responsables");
  ok(await dentro(page), "y el menú queda dentro de la pantalla");
  await page.waitForTimeout(220);
  await shot(page, "m03-tarjeta.png");
  await opcion(page, "Nicolás").click();
  ok(await toast(page, "Taller Norte: lo lleva Nicolás."), "elegir ahí cambia el responsable");
  ok((await page.locator("#lead-title").count()) === 0, "sin abrir la ficha");

  /* ---------------- lista larga: buscador ---------------- */
  await nav(page, /^Cobros/);
  await page.locator("#f-cob-cli").waitFor();
  await page.click("#f-cob-cli");
  await menu(page).waitFor();
  ok(await page.locator(".menu-sel-buscar input").evaluate((el) => el === document.activeElement), "una lista larga trae un buscador, con el foco puesto");
  await page.keyboard.type("ferre");
  ok((await page.locator('.menu-sel [role="option"]:visible').count()) === 2, "el buscador filtra sin importar tildes");
  await page.waitForTimeout(220);
  await shot(page, "m04-buscador.png");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  ok(await cerrado(page) && (await page.inputValue("#f-cob-cli")) === "cli-1", "flecha y Enter eligen entre lo filtrado");
  await page.click("#f-cob-cli");
  await page.keyboard.type("zzz");
  ok(await page.locator(".menu-sel-vacio").isVisible(), "si nada coincide, lo dice");
  await page.keyboard.press("Escape");
  await cerrado(page);

  /* ---------------- dentro de una ventana ---------------- */
  await nav(page, /^Leads/);
  await page.locator(".page-head .btn.primary", { hasText: "Nuevo lead" }).click();
  await page.locator(".modal").waitFor();
  await page.click("#nl-resp");
  await menu(page).waitFor();
  const encima = await page.evaluate(() => { const r = document.querySelector(".menu-sel").getBoundingClientRect(); const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!el && !!el.closest(".menu-sel"); });
  ok(encima, "en una ventana, el menú queda encima");
  ok(await dentro(page), "y dentro de la pantalla");
  await opcion(page, "Nicolás").click();
  ok((await page.inputValue("#nl-resp")) === "nicolas", "y elegir funciona igual");
  await page.keyboard.press("Escape");
  await page.locator(".modal").waitFor({ state: "detached" });
  await page.close();

  /* ---------------- con el dedo: el selector del teléfono ---------------- */
  const tel = await open({ name: "tactil", viewport: { width: 390, height: 844 }, touch: true });
  await tel.locator(".tabs button", { hasText: /^Leads/ }).click();
  await tel.locator("#f-resp").waitFor();
  await tel.tap("#f-resp");
  await tel.waitForTimeout(400);
  ok((await menu(tel).count()) === 0, "con el dedo no se reemplaza el selector del teléfono");
  await tel.close();

  /* ---------------- oscuro y angosto ---------------- */
  const dark = await open({ name: "oscuro", dark: true });
  await nav(dark, /^Leads/);
  await dark.click("#f-etapa");
  await menu(dark).waitFor();
  await dark.waitForTimeout(200);
  await shot(dark, "m05-oscuro.png");
  await dark.close();
  const angosto = await open({ name: "angosto", viewport: { width: 720, height: 900 } });
  await angosto.locator(".tabs button", { hasText: /^Leads/ }).click();
  await angosto.click("#f-resp");
  await menu(angosto).waitFor();
  ok(await dentro(angosto), "en una pantalla angosta, el menú cabe");
  await angosto.waitForTimeout(200);
  await shot(angosto, "m06-angosto.png");
  await angosto.close();

  await browser.close();
  for (const n of notes) console.log(n);
  if (errors.length) { console.error("\n" + errors.join("\n")); process.exit(1); }
  console.log("\nTodo bien. Capturas en " + OUT);
})().catch((e) => { for (const n of notes) console.log(n); if (errors.length) console.error(errors.join("\n")); console.error(e); process.exit(1); });
