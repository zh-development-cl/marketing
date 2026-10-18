/* Pruebas del servidor con un almacén en memoria (hace lo que hace Vercel Blob: versiones con ETag,
   escritura condicional y «crear solo si no existe») y datos inventados. Uso: npm test */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

const { firmar, verificar, sha256b64u } = await import("../lib/jwt.js");
const { usarAlmacen } = await import("../lib/almacen.js");
const { claveEquipo, claveCorrecta, tokenWebhook, olvidarClave, olvidarFallas } = await import("../lib/clave.js");
const { codigoMeet } = await import("../lib/reuniones.js");
const register = await import("../api/oauth/register.js");
const authorize = await import("../api/oauth/authorize.js");
const token = await import("../api/oauth/token.js");
const mcp = await import("../api/mcp.js");
const webhook = await import("../api/transcripcion.js");
const equipoPag = await import("../api/equipo.js");
const wellKnown = await import("../api/well-known.js");
const inicio = await import("../api/inicio.js");

const CLAVE = "Prueba1$";
const H = "https://zh.test";
const CLAUDE = "https://claude.ai/api/mcp/auth_callback";

/* El almacén en memoria. Cada operación espera un turno, para que dos solicitudes se crucen como en
   Vercel; `ops` cuenta lo que cobraría el plan gratis. */
let archivos;
let caido;
let etagRoto;
let ops;
let version = 0;
const turno = () => new Promise((r) => setImmediate(r));
const revisar = async () => { await turno(); if (caido) throw new Error("almacén caído (simulado)"); };
const memoria = {
  async leer(nombre, directo) {
    await revisar();
    ops[directo ? "directas" : "cache"] += 1;
    const a = archivos.get(nombre);
    return a ? { texto: a.texto, etag: a.etag } : null;
  },
  async escribir(nombre, texto, { etag, crear } = {}) {
    await revisar();
    ops.escrituras += 1;
    const a = archivos.get(nombre);
    if (etag && (etagRoto || !a || a.etag !== etag)) throw new Error("Precondition failed: ETag mismatch.");
    if (crear && a) throw new Error("This blob already exists");
    version += 1;
    archivos.set(nombre, { texto, etag: `"v${version}"`, subido: Date.now() });
  },
  async listar(prefijo) {
    await revisar();
    ops.listados += 1;
    return [...archivos].filter(([n]) => n.startsWith(prefijo)).map(([nombre, a]) => ({ nombre, subido: a.subido }));
  },
  async borrar(nombres) {
    await revisar();
    for (const n of nombres) archivos.delete(n);
  },
};
const contar = () => { ops = { cache: 0, directas: 0, escrituras: 0, listados: 0 }; };
const leerArchivo = (nombre) => JSON.parse(archivos.get(nombre).texto);
beforeEach(() => {
  archivos = new Map();
  caido = false;
  etagRoto = false;
  contar();
  usarAlmacen(memoria);
  olvidarClave();
  olvidarFallas();
});

const get = (mod, ruta) => mod.GET(new Request(H + ruta));
const postJson = (mod, ruta, body, headers = {}) => mod.POST(new Request(H + ruta, { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", ...headers } }));
const postForm = (mod, ruta, campos, headers = {}) => mod.POST(new Request(H + ruta, { method: "POST", body: new URLSearchParams(campos), headers: { "content-type": "application/x-www-form-urlencoded", ...headers } }));
const loc = (r) => new URL(r.headers.get("location"));
const estadoDe = (htmlTexto) => htmlTexto.match(/name="estado" value="([^"]+)"/)[1];
const crearLaClave = (clave = CLAVE, repetida = clave) => postForm(equipoPag, "/api/equipo", { accion: "crear", clave, repetida });
async function conClave() {
  const r = await crearLaClave();
  assert.equal(r.status, 200);
  return claveEquipo();
}

/* Recorre el flujo completo de claude.ai y devuelve las llaves. */
async function conectarConector(clave = CLAVE) {
  const reg = await (await postJson(register, "/api/oauth/register", { redirect_uris: [CLAUDE], client_name: "Claude" })).json();
  const verificador = "verificador-de-prueba-largo-1234567890";
  const a = await get(authorize, `/api/oauth/authorize?${new URLSearchParams({ client_id: reg.client_id, redirect_uri: CLAUDE, response_type: "code", code_challenge: sha256b64u(verificador), code_challenge_method: "S256", state: "estado-claude", resource: H + "/mcp" })}`);
  const formulario = await a.text();
  const p = await postForm(authorize, "/api/oauth/authorize", { estado: estadoDe(formulario), clave });
  if (p.status !== 302) return { a, formulario, p };
  const vuelta = loc(p);
  const t = await postForm(token, "/api/oauth/token", { grant_type: "authorization_code", code: vuelta.searchParams.get("code"), client_id: reg.client_id, redirect_uri: CLAUDE, code_verifier: verificador });
  return { reg, a, formulario, p, vuelta, t, llaves: await t.json() };
}
const rpc = (llave, method, params, id = 1) => postJson(mcp, "/mcp", { jsonrpc: "2.0", id, method, params }, llave ? { authorization: "Bearer " + llave } : {});
const llamar = async (llave, name, args) => (await (await rpc(llave, "tools/call", { name, arguments: args })).json()).result;
const mandar = async (cuerpo, t) => postJson(webhook, `/api/transcripcion?t=${t || tokenWebhook(await claveEquipo())}`, cuerpo);

const hace = (min) => new Date(Date.now() - min * 60000).toISOString();
const reunion = (extra = {}) => ({
  webhookBodyType: "advanced",
  meetingSoftware: "Google Meet",
  meetingTitle: "Diagnóstico · Panadería Ejemplo",
  meetingStartTimestamp: hace(40),
  meetingEndTimestamp: hace(5),
  transcript: [
    { personName: "Contacto ZH Development", timestamp: hace(39), transcriptText: "Hola, ¿cómo están?" },
    { personName: "Contacto ZH Development", timestamp: hace(39), transcriptText: "Partamos por el inventario." },
    { personName: "Ana Ejemplo", timestamp: hace(38), transcriptText: "Lo llevamos en una planilla." },
    { personName: "Ana Ejemplo", timestamp: hace(37), transcriptText: "   " },
  ],
  chatMessages: [{ personName: "Ana Ejemplo", timestamp: hace(20), chatMessageText: "Les mando la planilla por correo." }],
  ...extra,
});

test("las fichas firmadas no se pueden cambiar y vencen", () => {
  const t = firmar("secreto", { typ: "acceso", e: "equipo" }, 60);
  assert.equal(verificar("secreto", t, "acceso").e, "equipo");
  assert.equal(verificar("secreto", t, "codigo"), null);
  assert.equal(verificar("otro-secreto", t, "acceso"), null);
  const [h, , s] = t.split(".");
  const otro = Buffer.from(JSON.stringify({ typ: "acceso", e: "intruso" })).toString("base64url");
  assert.equal(verificar("secreto", `${h}.${otro}.${s}`, "acceso"), null);
  assert.equal(verificar("secreto", firmar("secreto", { typ: "acceso" }, -1), "acceso"), null);
  assert.equal(codigoMeet("Meet - abc-defg-hij"), "abc-defg-hij");
  assert.equal(codigoMeet("Diagnóstico · Panadería"), "");
});

test("los documentos de descubrimiento apuntan a este servidor", async () => {
  const r = await (await get(wellKnown, "/api/well-known?doc=recurso")).json();
  assert.deepEqual([r.resource, r.authorization_servers[0]], [H + "/mcp", H]);
  const s = await (await get(wellKnown, "/api/well-known?doc=servidor")).json();
  assert.equal(s.registration_endpoint, H + "/api/oauth/register");
  assert.deepEqual(s.code_challenge_methods_supported, ["S256"]);
});

test("sin la clave del equipo, todo dice dónde crearla", async () => {
  const pag = await (await get(inicio, "/")).text();
  assert.equal((pag.match(/>Listo</g) || []).length, 1);
  assert.equal((pag.match(/>Falta</g) || []).length, 1);
  assert.match(pag, /<a class="btn" href="\/api\/equipo">Crear la clave del equipo<\/a>/);
  assert.match(pag, /https:\/\/zh\.test\/mcp/);
  const reg = await postJson(register, "/api/oauth/register", { redirect_uris: [CLAUDE] });
  assert.equal(reg.status, 503);
  assert.match((await reg.json()).error_description, /página de inicio/);
  const a = await get(authorize, "/api/oauth/authorize?client_id=x&redirect_uri=y");
  assert.equal(a.status, 503);
  assert.match(await a.text(), /href="\/api\/equipo"/);
  assert.equal((await mandar(reunion(), "cualquiera")).status, 503);
  assert.equal((await rpc(null, "tools/list", {})).status, 401);
  const f = await get(equipoPag, "/api/equipo");
  assert.equal(f.status, 200);
  assert.match(f.headers.get("content-security-policy"), /form-action 'self';/);
  const formulario = await f.text();
  assert.match(formulario, /Crear la clave del equipo/);
  assert.equal((formulario.match(/type="password"/g) || []).length, 2);
});

test("crear la clave: se valida, se guarda solo su resumen y se muestra la dirección", async () => {
  const corta = await crearLaClave("Prueba1", "Prueba1");
  assert.equal(corta.status, 400);
  assert.match(await corta.text(), /entre 8 y 200 caracteres/);
  const distinta = await crearLaClave(CLAVE, CLAVE + "x");
  assert.equal(distinta.status, 400);
  assert.match(await distinta.text(), /no son iguales/);
  assert.equal((await postForm(equipoPag, "/api/equipo", { clave: CLAVE })).status, 200);
  assert.equal(archivos.size, 0);
  const r = await crearLaClave();
  assert.equal(r.status, 200);
  const pag = await r.text();
  assert.match(pag, /Clave creada/);
  const cfg = await claveEquipo();
  assert.ok(pag.includes(`${H}/api/transcripcion?t=${tokenWebhook(cfg)}`));
  assert.match(pag, /Advanced webhook body/);
  assert.match(pag, /<code>https:\/\/zh\.test\/mcp<\/code>/);
  const guardado = archivos.get("config/clave.json").texto;
  assert.deepEqual(Object.keys(JSON.parse(guardado)).sort(), ["creada", "resumen", "sal", "secreto"]);
  assert.ok(!guardado.includes(CLAVE));
  assert.ok(claveCorrecta(cfg, CLAVE));
  assert.ok(!claveCorrecta(cfg, CLAVE + "x"));
  const otra = await crearLaClave("otra-clave-del-equipo-456789");
  assert.equal(otra.status, 409);
  assert.match(await otra.text(), /Ya hay una clave del equipo/);
  olvidarClave();
  assert.ok(claveCorrecta(await claveEquipo(), CLAVE));
  const lista = await (await get(inicio, "/")).text();
  assert.equal((lista.match(/>Listo</g) || []).length, 2);
  assert.match(lista, /creada el \d+ de \w+ de \d{4}/);
  assert.match(lista, /Ver la dirección para TranscripTonic/);
  assert.match(await (await get(equipoPag, "/api/equipo")).text(), /Ver la dirección/);
});

test("dos socios que crean la clave a la vez: queda una sola", async () => {
  const [a, b] = await Promise.all([crearLaClave(), crearLaClave("otra-clave-del-equipo-456789")]);
  assert.deepEqual([a.status, b.status].sort(), [200, 409]);
  const ganadora = a.status === 200 ? CLAVE : "otra-clave-del-equipo-456789";
  olvidarClave();
  assert.ok(claveCorrecta(await claveEquipo(), ganadora));
});

test("el flujo de claude.ai: clave del equipo, código con PKCE y llaves", async () => {
  await conClave();
  const { a, formulario, vuelta, t, llaves } = await conectarConector();
  assert.equal(a.status, 200);
  assert.match(a.headers.get("content-security-policy"), /form-action 'self' https:\/\/claude\.ai;/);
  assert.match(formulario, /Clave del equipo/);
  assert.equal(vuelta.origin + vuelta.pathname, CLAUDE);
  assert.equal(vuelta.searchParams.get("state"), "estado-claude");
  assert.equal(t.status, 200);
  assert.equal(llaves.token_type, "Bearer");
  assert.ok(llaves.access_token && llaves.refresh_token);
});

test("con la clave equivocada no hay código, y a los 10 intentos se bloquea", async () => {
  await conClave();
  const { p } = await conectarConector("no-es-la-clave");
  assert.equal(p.status, 403);
  assert.match(await p.text(), /no es la del equipo/);
  for (let i = 0; i < 9; i += 1) await conectarConector("otra-clave-mala");
  const { p: bloqueo } = await conectarConector();
  assert.equal(bloqueo.status, 429);
  assert.match(await bloqueo.text(), /Espera una hora/);
});

test("la dirección para TranscripTonic solo se muestra con la clave", async () => {
  const cfg = await conClave();
  const malo = await postForm(equipoPag, "/api/equipo", { clave: "no-es" });
  assert.equal(malo.status, 403);
  assert.doesNotMatch(await malo.text(), /api\/transcripcion/);
  const bueno = await postForm(equipoPag, "/api/equipo", { clave: CLAVE });
  assert.equal(bueno.status, 200);
  const texto = await bueno.text();
  assert.ok(texto.includes(`${H}/api/transcripcion?t=${tokenWebhook(cfg)}`));
  assert.doesNotMatch(texto, /Clave creada/);
});

test("sin PKCE, el regreso lleva el error; un regreso ajeno no se acepta", async () => {
  await conClave();
  const reg = await (await postJson(register, "/api/oauth/register", { redirect_uris: [CLAUDE] })).json();
  const r = await get(authorize, `/api/oauth/authorize?${new URLSearchParams({ client_id: reg.client_id, redirect_uri: CLAUDE, response_type: "code", state: "s" })}`);
  assert.equal(loc(r).searchParams.get("error"), "invalid_request");
  const otro = await get(authorize, `/api/oauth/authorize?${new URLSearchParams({ client_id: reg.client_id, redirect_uri: "https://evil.example/cb", response_type: "code" })}`);
  assert.equal(otro.status, 400);
  assert.equal((await postJson(register, "/api/oauth/register", { redirect_uris: ["https://evil.example/cb"] })).status, 400);
  const vencido = await postForm(authorize, "/api/oauth/authorize", { estado: "x.y.z", clave: CLAVE });
  assert.equal(vencido.status, 400);
});

test("el verificador PKCE equivocado no da llaves", async () => {
  await conClave();
  const reg = await (await postJson(register, "/api/oauth/register", { redirect_uris: [CLAUDE] })).json();
  const a = await get(authorize, `/api/oauth/authorize?${new URLSearchParams({ client_id: reg.client_id, redirect_uri: CLAUDE, response_type: "code", code_challenge: sha256b64u("bueno"), code_challenge_method: "S256" })}`);
  const p = await postForm(authorize, "/api/oauth/authorize", { estado: estadoDe(await a.text()), clave: CLAVE });
  const t = await postForm(token, "/api/oauth/token", { grant_type: "authorization_code", code: loc(p).searchParams.get("code"), client_id: reg.client_id, redirect_uri: CLAUDE, code_verifier: "malo" });
  assert.equal(t.status, 400);
  assert.equal((await t.json()).error, "invalid_grant");
});

test("la llave de renovación da otra; si se crea otra clave, ninguna llave ni la dirección vieja sirven", async () => {
  const cfg = await conClave();
  const { reg, llaves } = await conectarConector();
  const r = await postForm(token, "/api/oauth/token", { grant_type: "refresh_token", refresh_token: llaves.refresh_token, client_id: reg.client_id });
  assert.equal(r.status, 200);
  const vieja = tokenWebhook(cfg);
  archivos.delete("config/clave.json");
  olvidarClave();
  assert.equal((await crearLaClave("otra-clave-del-equipo-456789")).status, 200);
  const r2 = await postForm(token, "/api/oauth/token", { grant_type: "refresh_token", refresh_token: llaves.refresh_token, client_id: reg.client_id });
  assert.equal(r2.status, 400);
  assert.equal((await rpc(llaves.access_token, "tools/list", {})).status, 401);
  assert.equal((await mandar(reunion(), vieja)).status, 401);
});

test("el conector pide autorización y responde initialize y tools/list", async () => {
  await conClave();
  const sin = await rpc(null, "initialize", { protocolVersion: "2025-06-18" });
  assert.equal(sin.status, 401);
  assert.match(sin.headers.get("www-authenticate"), /resource_metadata="https:\/\/zh\.test\/\.well-known\/oauth-protected-resource\/mcp"/);
  const { llaves } = await conectarConector();
  const ini = await (await rpc(llaves.access_token, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } })).json();
  assert.equal(ini.result.protocolVersion, "2025-06-18");
  assert.equal(ini.result.serverInfo.name, "zh-reuniones");
  const notif = await postJson(mcp, "/mcp", { jsonrpc: "2.0", method: "notifications/initialized" }, { authorization: "Bearer " + llaves.access_token });
  assert.equal(notif.status, 202);
  const lista = await (await rpc(llaves.access_token, "tools/list", {})).json();
  assert.deepEqual(lista.result.tools.map((t) => t.name), ["transcripciones", "leer_transcripcion"]);
  assert.ok(lista.result.tools.every((t) => t.annotations.readOnlyHint));
});

test("el webhook solo acepta la dirección con el token del equipo", async () => {
  const cfg = await conClave();
  const pre = await webhook.OPTIONS(new Request(H + "/api/transcripcion", { method: "OPTIONS" }));
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get("access-control-allow-origin"), "*");
  assert.equal((await get(webhook, "/api/transcripcion")).status, 405);
  const malo = await mandar(reunion(), "token-falso");
  assert.equal(malo.status, 401);
  assert.equal(malo.headers.get("access-control-allow-origin"), "*");
  assert.deepEqual([...archivos.keys()], ["config/clave.json"]);
  const noJson = await webhook.POST(new Request(`${H}/api/transcripcion?t=${tokenWebhook(cfg)}`, { method: "POST", body: "hola" }));
  assert.equal(noJson.status, 400);
});

test("una reunión que llega por el webhook se lista y se lee con el nombre de quien habla", async () => {
  await conClave();
  contar();
  const r = await mandar(reunion());
  assert.equal(r.status, 200);
  const g = await r.json();
  assert.deepEqual([g.ok, g.guardada], [true, true]);
  assert.match(g.id, /^tt-[a-z0-9]+-[a-f0-9]{8}$/);
  assert.deepEqual([ops.escrituras, ops.listados], [2, 1]);
  assert.equal(leerArchivo(`transcripciones/${g.id}.json`).id, g.id);
  const [enIndice] = leerArchivo("indice.json");
  assert.equal(enIndice.id, g.id);
  assert.equal(enIndice.texto, undefined);
  const { llaves } = await conectarConector();
  contar();
  const lista = await llamar(llaves.access_token, "transcripciones", {});
  assert.deepEqual(ops, { cache: 1, directas: 0, escrituras: 0, listados: 0 });
  assert.equal(lista.isError, false);
  const [t] = lista.structuredContent.transcripciones;
  assert.deepEqual({ id: t.id, titulo: t.titulo, codigo: t.codigo, estado: t.estado, participantes: t.participantes, intervenciones: t.intervenciones }, { id: g.id, titulo: "Diagnóstico · Panadería Ejemplo", codigo: "", estado: "lista", participantes: ["Contacto ZH Development", "Ana Ejemplo"], intervenciones: 2 });
  assert.ok(Math.abs(Date.parse(t.inicio) - (Date.now() - 40 * 60000)) < 5000);
  assert.equal(t.texto, undefined);
  const leida = await llamar(llaves.access_token, "leer_transcripcion", { id: g.id });
  assert.equal(leida.structuredContent.texto, "Contacto ZH Development: Hola, ¿cómo están? Partamos por el inventario.\nAna Ejemplo: Lo llevamos en una planilla.\n\n[Chat de la reunión]\nAna Ejemplo: Les mando la planilla por correo.");
  assert.deepEqual(leida.structuredContent.participantes, ["Contacto ZH Development", "Ana Ejemplo"]);
});

test("la misma reunión mandada dos veces queda una; la vacía y la de hace más de 14 días no se guardan", async () => {
  await conClave();
  const misma = reunion();
  const uno = await (await mandar(misma)).json();
  const dos = await (await mandar(misma)).json();
  assert.equal(uno.id, dos.id);
  assert.equal(leerArchivo("indice.json").length, 1);
  const vacia = await (await mandar(reunion({ transcript: [], meetingTitle: "Prueba" }))).json();
  assert.deepEqual([vacia.ok, vacia.guardada], [true, false]);
  const antigua = await (await mandar(reunion({ meetingTitle: "Antigua", meetingStartTimestamp: hace(20 * 1440), meetingEndTimestamp: hace(20 * 1440 - 30) }))).json();
  assert.equal(antigua.guardada, false);
  assert.match(antigua.motivo, /14 días/);
  const { llaves } = await conectarConector();
  const lista = (await llamar(llaves.access_token, "transcripciones", { dias: 30 })).structuredContent.transcripciones;
  assert.deepEqual(lista.map((t) => t.titulo), ["Diagnóstico · Panadería Ejemplo"]);
});

test("dos reuniones que llegan a la vez quedan las dos en el índice", async () => {
  await conClave();
  await mandar(reunion({ meetingTitle: "Reunión previa" }));
  const [a, b] = await Promise.all([mandar(reunion({ meetingTitle: "Reunión A" })), mandar(reunion({ meetingTitle: "Reunión B" }))]);
  assert.deepEqual([a.status, b.status], [200, 200]);
  const { llaves } = await conectarConector();
  const lista = (await llamar(llaves.access_token, "transcripciones", {})).structuredContent.transcripciones;
  assert.deepEqual(lista.map((t) => t.titulo).sort(), ["Reunión A", "Reunión B", "Reunión previa"]);
});

test("si Vercel no acepta el ETag y nadie más escribió, el índice se escribe igual", async () => {
  await conClave();
  etagRoto = true;
  await mandar(reunion({ meetingTitle: "Reunión A" }));
  const b = await mandar(reunion({ meetingTitle: "Reunión B" }));
  assert.equal(b.status, 200);
  assert.deepEqual(leerArchivo("indice.json").map((t) => t.titulo), ["Reunión A", "Reunión B"]);
});

test("el cuerpo «simple» también sirve: nombres del texto y hora de llegada", async () => {
  await conClave();
  const r = await (await mandar({ webhookBodyType: "simple", meetingSoftware: "Google Meet", meetingTitle: "abc-defg-hij", meetingStartTimestamp: "15-10-2026, 10:00 a. m.", meetingEndTimestamp: "15-10-2026, 10:30 a. m.", transcript: "Lorenzo (15-10-2026, 10:00 a. m.)\nBuenos días.\n\nCliente (15-10-2026, 10:01 a. m.)\nHola.\nTodo bien.\n\n", chatMessages: "" })).json();
  assert.equal(r.guardada, true);
  const { llaves } = await conectarConector();
  const [t] = (await llamar(llaves.access_token, "transcripciones", {})).structuredContent.transcripciones;
  assert.equal(t.codigo, "abc-defg-hij");
  assert.ok(Math.abs(Date.parse(t.fin) - Date.now()) < 5000);
  const leida = await llamar(llaves.access_token, "leer_transcripcion", { id: t.id });
  assert.equal(leida.structuredContent.texto, "Lorenzo: Buenos días.\nCliente: Hola. Todo bien.");
});

test("lo que cumple 14 días se borra: del índice al listar y los archivos sueltos al llegar otra", async () => {
  await conClave();
  const { id } = await (await mandar(reunion())).json();
  const quince = Date.now() - 15 * 864e5;
  const indice = archivos.get("indice.json");
  indice.texto = JSON.stringify(JSON.parse(indice.texto).map((t) => ({ ...t, recibida: new Date(quince).toISOString() })));
  indice.etag = '"envejecido"';
  archivos.get(`transcripciones/${id}.json`).subido = quince;
  archivos.set("transcripciones/tt-suelta-0123abcd.json", { texto: "{}", etag: '"suelta"', subido: quince });
  const { llaves } = await conectarConector();
  assert.deepEqual((await llamar(llaves.access_token, "transcripciones", {})).structuredContent.transcripciones, []);
  assert.deepEqual(leerArchivo("indice.json"), []);
  assert.ok(!archivos.has(`transcripciones/${id}.json`));
  assert.ok(archivos.has("transcripciones/tt-suelta-0123abcd.json"));
  assert.equal((await llamar(llaves.access_token, "leer_transcripcion", { id })).structuredContent.error, "no_existe");
  const nueva = await (await mandar(reunion({ meetingTitle: "Otra reunión" }))).json();
  assert.ok(!archivos.has("transcripciones/tt-suelta-0123abcd.json"));
  assert.deepEqual((await llamar(llaves.access_token, "transcripciones", {})).structuredContent.transcripciones.map((t) => t.id), [nueva.id]);
});

test("los errores llevan su código: sin id, ya no está, almacén caído y sin almacén", async () => {
  await conClave();
  const { llaves } = await conectarConector();
  const sinId = await llamar(llaves.access_token, "leer_transcripcion", { id: "conferenceRecords/x/transcripts/y" });
  assert.equal(sinId.structuredContent.error, "sin_id");
  const noEsta = await llamar(llaves.access_token, "leer_transcripcion", { id: "tt-abc123-0123abcd" });
  assert.equal(noEsta.isError, true);
  assert.equal(noEsta.structuredContent.error, "no_existe");
  assert.match(noEsta.content[0].text, /14 días/);
  caido = true;
  const caida = await llamar(llaves.access_token, "transcripciones", {});
  assert.deepEqual(caida.structuredContent, { error: "almacen", mensaje: "ZH Reuniones no pudo leer su almacén. Vuelve a intentar en un rato." });
  assert.equal((await mandar(reunion())).status, 502);
  olvidarClave();
  const sinLeer = await rpc(llaves.access_token, "tools/list", {});
  assert.equal(sinLeer.status, 502);
  assert.equal((await sinLeer.json()).error, "temporarily_unavailable");
  const pagCaida = await (await get(inicio, "/")).text();
  assert.match(pagCaida, /No responde/);
  assert.doesNotMatch(pagCaida, /api\/equipo/);
  caido = false;
  await claveEquipo();
  usarAlmacen(null);
  const sinAlmacen = await llamar(llaves.access_token, "transcripciones", {});
  assert.equal(sinAlmacen.structuredContent.error, "sin_almacen");
  assert.match(sinAlmacen.content[0].text, /Storage → Blob/);
  const w = await mandar(reunion());
  assert.equal(w.status, 503);
  assert.equal((await w.json()).code, "sin_almacen");
  olvidarClave();
  const e = await get(equipoPag, "/api/equipo");
  assert.equal(e.status, 503);
  assert.match(await e.text(), /Todavía no está listo/);
  const pag = await (await get(inicio, "/")).text();
  assert.equal((pag.match(/>Falta</g) || []).length, 2);
  assert.doesNotMatch(pag, /api\/equipo/);
});
