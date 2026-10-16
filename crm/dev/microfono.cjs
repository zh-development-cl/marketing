/* Prueba de «Transcribir en vivo» con Playwright, el mock de window.claude y un micrófono simulado.
   Recorre: una llamada transcrita en vivo (con el corte de sesión que hace Chrome tras un
   silencio), el análisis de Claude sabiendo que la transcripción viene del micrófono, el
   diagnóstico en la base, una reunión con un cliente, y los casos en que claude.ai bloquea el
   micrófono o el navegador no transcribe. Usa datos inventados.

   Uso:
     python3 crm/dev/build_preview.py
     NODE_PATH=$(npm root -g) VENDOR_DIR=<carpeta con preact.umd.min.js, hooks.umd.min.js, htm.umd.min.js> \
       node crm/dev/microfono.cjs [carpeta-de-capturas]
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
const iso = (n) => new Date(Date.now() + n * 864e5).toISOString();

const SEED = {
  ["equipo/" + ME]: { nombre: "Lorenzo Bozzo", cargo: "Socio fundador", telefono: "+56955551234", correo: "lorenzo@zhdevelopment.cl" },
  "config/general": { agendaUrl: "https://zhdevelopment.cl/#agendar" },
  "leads/lead-mic": { nombre: "Andrea Fuentes", empresa: "Ferretería Andes", cargo: "", telefono: "+56922223333", correo: "", etapa: "nuevo", prioridad: "media", trato: "tu", intentos: 0, proxima: null, origen: "web", necesidad: "Ordenar el inventario", dolor: "Cuentan el inventario a mano cada mes", comoAyudamos: "Inventario en línea con alertas de quiebre de stock", guion: "Objeción propia: «Ya tenemos planilla» → La planilla se queda; lo que cambia es que el conteo sale solo.", creado: iso(-2), actualizado: iso(-2), creadoPor: ME },
  "clientes/cli-mic": { nombre: "Taller Sur", razonSocial: "", rut: "", contactos: [{ id: "ct-1", nombre: "Jorge Pérez", cargo: "Dueño", correo: "jorge@tallersur.cl", telefono: "+56944445555", rol: "decisor", principal: true }], responsable: ME, trato: "tu", leadIds: [], estado: "activo", notas: "", creado: iso(-30), actualizado: iso(-30), creadoPor: ME },
};
const FRASES = ["hola andrea te llamo de zh por lo del inventario", "la verdad lo encuentro un poco caro", "nos interesa ver una demo la próxima semana", "mándame la propuesta al correo"];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

  async function open(opts) {
    const context = await browser.newContext({ viewport: { width: 1360, height: 900 } });
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
    await page.addInitScript((o) => { window.__MOCK_SEED = o.seed; window.__MOCK_MIC = o.mic; }, { seed: opts.seed, mic: opts.mic });
    await page.goto("file://" + PREVIEW);
    await page.getByRole("heading", { name: "Hoy", exact: true }).waitFor({ timeout: 15000 });
    return page;
  }
  const shot = (page, name) => page.screenshot({ path: path.join(OUT, name), fullPage: false });
  const toast = (page, text) => page.locator(".toast", { hasText: text }).first().waitFor({ timeout: 8000 });
  const store = (page) => page.evaluate(() => Object.fromEntries(window.__mockStore));
  const abrirLlamada = async (page) => {
    await page.locator(".side .nav button", { hasText: /^Leads/ }).click();
    await page.locator("table.leads tbody tr", { hasText: "Andrea Fuentes" }).click();
    await page.locator("#lead-title", { hasText: "Ferretería Andes" }).waitFor();
    await page.locator(".work-tabs button", { hasText: "Registrar llamada" }).click();
  };

  /* ---------------- llamada transcrita en vivo ---------------- */
  const page = await open({ name: "micrófono", seed: SEED, mic: { modo: "ok", frases: FRASES, cortar: true } });
  await abrirLlamada(page);
  /* Aquí se prueba revisar antes de guardar; lo automático se prueba en tareas.cjs. */
  await page.locator(".work .switch input").uncheck();
  await page.getByRole("button", { name: "Transcribir en vivo" }).click();
  await page.locator(".live.on", { hasText: "Escuchando" }).waitFor();
  await page.locator(".live-text").first().waitFor();
  await shot(page, "m01-escuchando.png");
  await page.waitForFunction(() => { const t = document.querySelector("#c-trans"); return t && t.value.includes("Mándame la propuesta"); }, null, { timeout: 8000 });
  ok(true, "lo dictado llega a la transcripción");
  await page.waitForFunction(() => window.__srStarts >= 2, null, { timeout: 5000 });
  ok(true, "si el navegador corta la sesión tras un silencio, se retoma sola");
  ok((await page.evaluate(() => window.__srLang)) === "es-CL", "transcribe en español de Chile");
  ok(await page.locator(".live.on", { hasText: "Escuchando" }).isVisible(), "sigue escuchando después del corte");

  /* apoyo en vivo: la objeción destaca el botón y Haiku sugiere qué decir */
  ok(await page.locator(".coach-pista", { hasText: "Parece una objeción de precio" }).isVisible(), "detecta la objeción de precio sin llamar a Claude");
  ok(await page.locator(".coach .btn.pulse").isVisible(), "y destaca el botón «¿Qué le respondo?»");
  const antes = (await page.evaluate(() => window.__mockPrompts)).length;
  ok(antes === 0, "mientras nadie toca el botón, no se consulta a Claude");
  await page.getByRole("button", { name: "¿Qué le respondo?" }).click();
  await page.locator(".coach-say").waitFor();
  ok((await page.locator(".coach-say").innerText()).includes("¿Cuántas horas a la semana"), "muestra qué decirle al lead");
  ok(await page.locator(".coach-card", { hasText: "Después pregunta" }).isVisible() && await page.locator(".coach-card", { hasText: "Evita" }).isVisible(), "y qué preguntar después y qué evitar");
  const opts = await page.evaluate(() => window.__mockOpts);
  const pVivo = (await page.evaluate(() => window.__mockPrompts)).pop();
  ok(opts.length === 1 && opts[0].model === "claude-haiku-5-5" && opts[0].modelTier === "quick" && opts[0].cache === false, "la consulta va a Claude Haiku, rápida y sin caché");
  ok(pVivo.includes("La verdad lo encuentro un poco caro") && pVivo.includes("Ferretería Andes") && pVivo.includes("no separa quién habla"), "Haiku recibe lo último de la llamada y los datos del lead");
  ok(pVivo.includes("Cuentan el inventario a mano cada mes") && pVivo.includes("Inventario en línea con alertas"), "y el dolor y cómo ayudamos que se prepararon antes de llamar");
  ok(pVivo.includes("La planilla se queda; lo que cambia es que el conteo sale solo"), "y el guion, con sus respuestas a objeciones");
  ok((await page.locator(".coach-pista").count()) === 0, "al usar la ayuda se apaga el aviso");
  await shot(page, "m03-apoyo.png");
  await page.getByRole("button", { name: "Detener" }).click();
  await page.getByRole("button", { name: "Transcribir en vivo" }).waitFor();
  const trans = await page.inputValue("#c-trans");
  ok(trans === "Hola andrea te llamo de zh por lo del inventario\nLa verdad lo encuentro un poco caro\nNos interesa ver una demo la próxima semana\nMándame la propuesta al correo", "cada frase queda en su línea, con mayúscula y sin repetirse");
  ok((await page.inputValue("#c-dur")) === "", "una prueba de segundos no inventa la duración");

  /* si se cierra la ficha a mitad de camino, lo transcrito no se pierde */
  await page.keyboard.press("Escape");
  await page.locator(".scrim").first().waitFor({ state: "detached" });
  await abrirLlamada(page);
  ok(await page.locator(".work .note", { hasText: "Recuperé lo que quedó sin guardar" }).isVisible(), "si se cierra la ficha, lo transcrito se recupera al volver");
  ok((await page.inputValue("#c-trans")) === trans, "la transcripción recuperada está completa");

  await page.getByRole("button", { name: "Contestó", exact: true }).click();
  await page.getByRole("button", { name: "Analizar con Claude" }).click();
  await page.locator(".work .analysis").waitFor();
  const prompts = await page.evaluate(() => window.__mockPrompts);
  const pLlamada = prompts[prompts.length - 1];
  ok(pLlamada.includes("hecha en vivo con el micrófono del computador") && pLlamada.includes("Mándame la propuesta al correo"), "Claude recibe la transcripción y sabe que viene del micrófono, sin separar voces");
  ok(pLlamada.includes("Dolor que suponemos (hipótesis sin confirmar") && pLlamada.includes("Cuentan el inventario a mano"), "el análisis sabe qué dolor suponíamos, marcado como hipótesis");
  ok(pLlamada.includes('"tareas"') && pLlamada.includes("descubrimiento (hizo preguntas abiertas"), "Claude debe devolver las tareas acordadas y evaluar con los criterios");
  ok((await page.locator(".work .eval-score").innerText()).startsWith("67"), "el puntaje es el promedio de los criterios × 20 (67)");
  ok(await page.locator(".work .crit", { hasText: "Objeciones" }).locator("i.on").count() === 2, "cada criterio muestra su nota");
  ok(await page.locator(".work .analysis", { hasText: "Tareas de ZH" }).locator("li", { hasText: "Enviar la propuesta por correo" }).isVisible(), "lista las tareas de ZH");
  ok(await page.locator(".work .analysis", { hasText: "Tareas del lead" }).locator("li", { hasText: "Mandar la planilla de inventario" }).isVisible(), "y las del lead");
  ok(await page.locator(".work .suggest label", { hasText: "Tarea: Enviar la propuesta por correo" }).locator("input").isChecked(), "propone crear las tareas de ZH");
  ok((await page.locator(".work .suggest label", { hasText: "Tarea: Mandar la planilla" }).count()) === 0, "lo que quedó en hacer el lead no se vuelve tarea de ZH");
  ok(await page.locator(".work .suggest label", { hasText: "Agendar la reunión" }).locator("input").isChecked(), "y agendar la reunión acordada");
  ok(await page.locator(".work .suggest label", { hasText: "Que Claude deje redactados" }).locator("input").isChecked(), "y dejar redactado el correo acordado");
  await page.locator(".work .eval").scrollIntoViewIfNeeded();
  await shot(page, "m04-evaluacion.png");
  await page.getByRole("button", { name: "Guardar llamada" }).click();
  await page.locator(".done-card").waitFor();
  await toast(page, "Quedó redactado 1 borrador");
  await page.waitForTimeout(250);
  ok((await page.evaluate(() => localStorage.getItem("zhcrm:llamada:lead-mic"))) === null, "al guardar la llamada se borra lo recuperable");
  let dump = await store(page);
  const diag = dump["diagnostico/microfono-" + ME];
  ok(diag && diag.ok === true && diag.paso === "texto" && diag.politica === true && typeof diag.navegador === "string", "la base anota que el micrófono y la transcripción funcionaron");
  const llamada = Object.entries(dump).find(([k, v]) => k.startsWith("actividades/") && v.tipo === "llamada");
  ok(llamada && llamada[1].transcripcion === null && llamada[1].analisis, "por defecto se guardan las notas y el análisis, sin la transcripción completa");
  ok(llamada && llamada[1].analisis.evaluacion && llamada[1].analisis.evaluacion.puntaje === 67 && llamada[1].analisis.tareas.length === 3, "la llamada guarda el puntaje y las tareas");
  const borr = Object.entries(dump).filter(([k]) => k.startsWith("borradores/")).map(([, v]) => v);
  ok(borr.length === 1 && borr[0].leadId === "lead-mic" && borr[0].canal === "correo" && borr[0].generadoPor === "claude" && borr[0].estado === "por_revisar", "el correo acordado queda redactado por Claude en «Borradores por revisar»");
  ok(borr[0] && borr[0].instrucciones.includes("Mandar por correo el resumen de la llamada") && borr[0].instrucciones.includes("Mandar la planilla de inventario"), "el borrador sabe lo que quedó en hacer cada uno");
  const tareas = Object.entries(dump).filter(([k]) => k.startsWith("tareas/")).map(([id, v]) => ({ id: id.split("/")[1], ...v }));
  const tCorreo = tareas.find((x) => x.tipo === "correo");
  ok(tCorreo && tCorreo.borradorId && borr[0].tareaId === tCorreo.id, "el borrador queda unido a su tarea");
  ok(tareas.some((x) => x.tipo === "propuesta" && x.titulo === "Enviar la propuesta por correo" && x.estado === "pendiente"), "la propuesta queda como tarea");
  ok(tareas.some((x) => x.tipo === "reunion" && x.hora === "11:00") && dump["leads/lead-mic"].etapa === "reunion_agendada", "con la reunión acordada el lead pasa a «Reunión agendada»");
  const pBorr = (await page.evaluate(() => window.__mockPrompts)).filter((x) => x.includes("Quedó acordado en la conversación de hoy")).pop();
  ok(pBorr && pBorr.includes("Análisis: Carolina coordina"), "Claude redacta con la llamada recién guardada en el historial");
  await page.keyboard.press("Escape");
  await page.locator(".scrim").first().waitFor({ state: "detached" });
  await page.locator(".side .nav button", { hasText: /^Hoy/ }).click();
  ok(await page.locator(".summary .stat", { hasText: "tu puntaje en llamadas (1)" }).filter({ hasText: "67" }).isVisible(), "Hoy muestra tu puntaje promedio en llamadas");

  /* ---------------- reunión con un cliente ---------------- */
  await page.locator(".side .nav button", { hasText: /^Clientes/ }).click();
  await page.locator("table.leads tbody tr", { hasText: "Taller Sur" }).click();
  await page.locator("#cli-title", { hasText: "Taller Sur" }).waitFor();
  await page.locator(".work-tabs button", { hasText: "Registrar" }).first().click();
  ok(await page.locator(".work .live").isVisible(), "la reunión con el cliente también se puede transcribir en vivo");
  await page.getByRole("button", { name: "Nota", exact: true }).click();
  ok((await page.locator(".work .live").count()) === 0, "en una nota no aparece el micrófono");
  await page.getByRole("button", { name: "Reunión", exact: true }).click();
  await page.fill("#cl-texto", "Revisamos el avance.");
  await page.getByRole("button", { name: "Transcribir en vivo" }).click();
  await page.locator(".live.on", { hasText: "Escuchando" }).waitFor();
  await page.evaluate(() => window.__srDictar(["quedamos en enviar la cotización del módulo de reportes"]));
  await page.waitForFunction(() => document.querySelector("#cl-texto").value.includes("Quedamos en enviar la cotización"), null, { timeout: 8000 });
  await page.getByRole("button", { name: "Detener" }).click();
  await page.getByRole("button", { name: "Transcribir en vivo" }).waitFor();
  ok((await page.inputValue("#cl-texto")) === "Revisamos el avance.\nQuedamos en enviar la cotización del módulo de reportes", "lo transcrito se suma a las notas que ya había");
  await page.getByRole("button", { name: "Ordenar en acta con Claude" }).click();
  await page.waitForFunction(() => window.__mockPrompts.some((x) => x.includes("Ordena las notas de una reunión")), null, { timeout: 8000 });
  const pActa = (await page.evaluate(() => window.__mockPrompts)).filter((x) => x.includes("Ordena las notas de una reunión")).pop();
  ok(pActa.includes("incluyen una transcripción en vivo") && pActa.includes("módulo de reportes"), "Claude sabe que las notas de la reunión traen una transcripción en vivo");
  await page.close();

  /* ---------------- claude.ai bloquea el micrófono ---------------- */
  const bloq = await open({ name: "bloqueado", seed: SEED, mic: { modo: "bloqueado" } });
  await abrirLlamada(bloq);
  await bloq.getByRole("button", { name: "Transcribir en vivo" }).click();
  await bloq.locator(".live .note", { hasText: "claude.ai no deja que el CRM use el micrófono" }).waitFor();
  ok(await bloq.locator(".live .note li", { hasText: "Escritura por voz" }).isVisible(), "si claude.ai bloquea el micrófono, explica el plan B con Google Docs");
  await shot(bloq, "m02-bloqueado.png");
  await bloq.waitForTimeout(250);
  dump = await store(bloq);
  const diagB = dump["diagnostico/microfono-" + ME];
  ok(diagB && diagB.ok === false && diagB.tipo === "politica" && diagB.error === "NotAllowedError", "la base anota que claude.ai bloqueó el micrófono");
  await bloq.close();

  /* ---------------- navegador sin reconocimiento de voz ---------------- */
  const sin = await open({ name: "sin soporte", seed: SEED, mic: { modo: "sin_soporte" } });
  await abrirLlamada(sin);
  await sin.getByRole("button", { name: "Transcribir en vivo" }).click();
  ok(await sin.locator(".live .note", { hasText: "Abre el CRM en Google Chrome o Microsoft Edge" }).isVisible(), "si el navegador no transcribe, pide abrirlo en Chrome o Edge");
  await sin.close();

  /* ---------------- sin micrófono ---------------- */
  const nomic = await open({ name: "sin micrófono", seed: SEED, mic: { modo: "sin_micro" } });
  await abrirLlamada(nomic);
  await nomic.getByRole("button", { name: "Transcribir en vivo" }).click();
  await nomic.locator(".live .note", { hasText: "No se encontró un micrófono" }).waitFor();
  ok((await nomic.locator(".live .note li").count()) === 0, "sin micrófono avisa sin el plan B de Google Docs");
  await nomic.close();

  await browser.close();
  console.log(notes.join("\n"));
  if (errors.length) { console.error("\n" + errors.join("\n")); process.exit(1); }
  console.log(`\nTodo bien. Capturas en ${OUT}`);
})().catch((e) => { console.error(e); console.error(errors.join("\n")); process.exit(1); });
