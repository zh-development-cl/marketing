/* Pruebas del servidor con la base simulada (fetch falso que imita la API REST de Upstash) y datos
   inventados. Uso: npm test */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

const CLAVE = "clave-del-equipo-de-prueba-123";
const REDIS = "https://redis.prueba.example";
process.env.CLAVE_EQUIPO = CLAVE;
process.env.KV_REST_API_URL = REDIS;
process.env.KV_REST_API_TOKEN = "token-redis";

const { firmar, verificar, sha256b64u } = await import("../lib/jwt.js");
const { tokenWebhook } = await import("../lib/http.js");
const { codigoMeet } = await import("../lib/reuniones.js");
const register = await import("../api/oauth/register.js");
const authorize = await import("../api/oauth/authorize.js");
const token = await import("../api/oauth/token.js");
const mcp = await import("../api/mcp.js");
const webhook = await import("../api/transcripcion.js");
const equipoPag = await import("../api/equipo.js");
const wellKnown = await import("../api/well-known.js");
const inicio = await import("../api/inicio.js");

const H = "https://zh.test";
const CLAUDE = "https://claude.ai/api/mcp/auth_callback";
const resp = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/* Redis en memoria: solo los comandos que usa el servidor. */
let datos;
let vence;
let falla = false;
const vivo = (k) => { if (vence.has(k) && vence.get(k) <= Date.now()) { datos.delete(k); vence.delete(k); } return datos.has(k); };
function ejecutar([cmd, ...a]) {
  const c = cmd.toUpperCase();
  if (c === "PING") return "PONG";
  if (c === "GET") return vivo(a[0]) ? datos.get(a[0]) : null;
  if (c === "MGET") return a.map((k) => (vivo(k) ? datos.get(k) : null));
  if (c === "SET") { datos.set(a[0], a[1]); vence.delete(a[0]); const i = a.findIndex((x) => x.toUpperCase() === "EX"); if (i > 0) vence.set(a[0], Date.now() + Number(a[i + 1]) * 1000); return "OK"; }
  if (c === "INCR") { const v = Number(vivo(a[0]) ? datos.get(a[0]) : 0) + 1; datos.set(a[0], String(v)); return v; }
  if (c === "EXPIRE") { if (!vivo(a[0])) return 0; vence.set(a[0], Date.now() + Number(a[1]) * 1000); return 1; }
  const z = () => { if (!datos.has(a[0])) datos.set(a[0], new Map()); return datos.get(a[0]); };
  const orden = (m) => [...m.entries()].sort((x, y) => x[1] - y[1] || (x[0] < y[0] ? -1 : 1));
  const num = (v) => (v === "-inf" ? -Infinity : v === "+inf" ? Infinity : Number(v));
  if (c === "ZADD") { const m = z(); const nuevo = !m.has(a[2]); m.set(a[2], Number(a[1])); return nuevo ? 1 : 0; }
  if (c === "ZRANGEBYSCORE") return orden(z()).filter(([, s]) => s >= num(a[1]) && s <= num(a[2])).map(([k]) => k);
  if (c === "ZREMRANGEBYSCORE") { const m = z(); let n = 0; for (const [k, s] of [...m]) if (s >= num(a[1]) && s <= num(a[2])) { m.delete(k); n += 1; } return n; }
  if (c === "ZREMRANGEBYRANK") { const m = z(); const l = orden(m); const fin = Number(a[2]) < 0 ? l.length + Number(a[2]) : Number(a[2]); let n = 0; l.forEach(([k], i) => { if (i >= Number(a[1]) && i <= fin) { m.delete(k); n += 1; } }); return n; }
  throw new Error("comando no simulado: " + c);
}
let llamadas = [];
globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  llamadas.push(u);
  if (!u.startsWith(REDIS)) return resp(404, { error: "no simulado: " + u });
  if (init.headers.authorization !== "Bearer token-redis") return resp(401, { error: "Unauthorized" });
  if (falla) return resp(500, { error: "ERR caída simulada" });
  const cuerpo = JSON.parse(init.body);
  if (u === REDIS + "/pipeline") return resp(200, cuerpo.map((c) => ({ result: ejecutar(c) })));
  return resp(200, { result: ejecutar(cuerpo) });
};
beforeEach(() => {
  datos = new Map(); vence = new Map(); falla = false; llamadas = [];
  process.env.CLAVE_EQUIPO = CLAVE; process.env.KV_REST_API_URL = REDIS; process.env.KV_REST_API_TOKEN = "token-redis";
});

const get = (mod, ruta) => mod.GET(new Request(H + ruta));
const postJson = (mod, ruta, body, headers = {}) => mod.POST(new Request(H + ruta, { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", ...headers } }));
const postForm = (mod, ruta, campos, headers = {}) => mod.POST(new Request(H + ruta, { method: "POST", body: new URLSearchParams(campos), headers: { "content-type": "application/x-www-form-urlencoded", ...headers } }));
const loc = (r) => new URL(r.headers.get("location"));
const estadoDe = (htmlTexto) => htmlTexto.match(/name="estado" value="([^"]+)"/)[1];

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
const mandar = (cuerpo, t = tokenWebhook()) => postJson(webhook, `/api/transcripcion?t=${t}`, cuerpo);

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
  const t = firmar({ typ: "acceso", e: "equipo" }, 60);
  assert.equal(verificar(t, "acceso").e, "equipo");
  assert.equal(verificar(t, "codigo"), null);
  const [h, , s] = t.split(".");
  const otro = Buffer.from(JSON.stringify({ typ: "acceso", e: "intruso" })).toString("base64url");
  assert.equal(verificar(`${h}.${otro}.${s}`, "acceso"), null);
  assert.equal(verificar(firmar({ typ: "acceso" }, -1), "acceso"), null);
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

test("solo se registran clientes con el regreso de claude.ai o local; sin clave, avisa", async () => {
  const malo = await postJson(register, "/api/oauth/register", { redirect_uris: ["https://evil.example/cb"] });
  assert.equal(malo.status, 400);
  const bueno = await postJson(register, "/api/oauth/register", { redirect_uris: [CLAUDE] });
  assert.equal(bueno.status, 201);
  assert.ok((await bueno.json()).client_id);
  process.env.CLAVE_EQUIPO = "corta";
  const sin = await postJson(register, "/api/oauth/register", { redirect_uris: [CLAUDE] });
  assert.equal(sin.status, 503);
  assert.match((await sin.json()).error_description, /CLAVE_EQUIPO/);
});

test("el flujo de claude.ai: clave del equipo, código con PKCE y llaves", async () => {
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
  const { p } = await conectarConector("no-es-la-clave");
  assert.equal(p.status, 403);
  assert.match(await p.text(), /no es la del equipo/);
  for (let i = 0; i < 9; i += 1) await conectarConector("otra-clave-mala");
  const { p: bloqueo } = await conectarConector();
  assert.equal(bloqueo.status, 429);
  assert.match(await bloqueo.text(), /Espera una hora/);
});

test("sin PKCE, el regreso lleva el error; un regreso ajeno no se acepta", async () => {
  const reg = await (await postJson(register, "/api/oauth/register", { redirect_uris: [CLAUDE] })).json();
  const r = await get(authorize, `/api/oauth/authorize?${new URLSearchParams({ client_id: reg.client_id, redirect_uri: CLAUDE, response_type: "code", state: "s" })}`);
  assert.equal(loc(r).searchParams.get("error"), "invalid_request");
  const otro = await get(authorize, `/api/oauth/authorize?${new URLSearchParams({ client_id: reg.client_id, redirect_uri: "https://evil.example/cb", response_type: "code" })}`);
  assert.equal(otro.status, 400);
  const vencido = await postForm(authorize, "/api/oauth/authorize", { estado: "x.y.z", clave: CLAVE });
  assert.equal(vencido.status, 400);
});

test("el verificador PKCE equivocado no da llaves", async () => {
  const reg = await (await postJson(register, "/api/oauth/register", { redirect_uris: [CLAUDE] })).json();
  const a = await get(authorize, `/api/oauth/authorize?${new URLSearchParams({ client_id: reg.client_id, redirect_uri: CLAUDE, response_type: "code", code_challenge: sha256b64u("bueno"), code_challenge_method: "S256" })}`);
  const p = await postForm(authorize, "/api/oauth/authorize", { estado: estadoDe(await a.text()), clave: CLAVE });
  const t = await postForm(token, "/api/oauth/token", { grant_type: "authorization_code", code: loc(p).searchParams.get("code"), client_id: reg.client_id, redirect_uri: CLAUDE, code_verifier: "malo" });
  assert.equal(t.status, 400);
  assert.equal((await t.json()).error, "invalid_grant");
});

test("la llave de renovación da otra; si cambia la clave del equipo, ninguna sirve", async () => {
  const { reg, llaves } = await conectarConector();
  const r = await postForm(token, "/api/oauth/token", { grant_type: "refresh_token", refresh_token: llaves.refresh_token, client_id: reg.client_id });
  assert.equal(r.status, 200);
  process.env.CLAVE_EQUIPO = "otra-clave-del-equipo-456789";
  const r2 = await postForm(token, "/api/oauth/token", { grant_type: "refresh_token", refresh_token: llaves.refresh_token, client_id: reg.client_id });
  assert.equal(r2.status, 400);
  assert.equal((await rpc(llaves.access_token, "tools/list", {})).status, 401);
});

test("el conector pide autorización y responde initialize y tools/list", async () => {
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
  const pre = await webhook.OPTIONS(new Request(H + "/api/transcripcion", { method: "OPTIONS" }));
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get("access-control-allow-origin"), "*");
  assert.equal((await get(webhook, "/api/transcripcion")).status, 405);
  const malo = await mandar(reunion(), "token-falso");
  assert.equal(malo.status, 401);
  assert.equal(malo.headers.get("access-control-allow-origin"), "*");
  assert.equal(datos.size, 0);
  const noJson = await webhook.POST(new Request(`${H}/api/transcripcion?t=${tokenWebhook()}`, { method: "POST", body: "hola" }));
  assert.equal(noJson.status, 400);
});

test("una reunión que llega por el webhook se lista y se lee con el nombre de quien habla", async () => {
  const r = await mandar(reunion());
  assert.equal(r.status, 200);
  const g = await r.json();
  assert.equal(g.ok, true);
  assert.equal(g.guardada, true);
  assert.match(g.id, /^tt-[a-z0-9]+-[a-f0-9]{8}$/);
  const { llaves } = await conectarConector();
  const lista = await llamar(llaves.access_token, "transcripciones", {});
  assert.equal(lista.isError, false);
  const [t] = lista.structuredContent.transcripciones;
  assert.deepEqual({ id: t.id, titulo: t.titulo, codigo: t.codigo, estado: t.estado, participantes: t.participantes, intervenciones: t.intervenciones }, { id: g.id, titulo: "Diagnóstico · Panadería Ejemplo", codigo: "", estado: "lista", participantes: ["Contacto ZH Development", "Ana Ejemplo"], intervenciones: 2 });
  assert.ok(Math.abs(Date.parse(t.inicio) - (Date.now() - 40 * 60000)) < 5000);
  assert.equal(t.texto, undefined);
  const leida = await llamar(llaves.access_token, "leer_transcripcion", { id: g.id });
  assert.equal(leida.structuredContent.texto, "Contacto ZH Development: Hola, ¿cómo están? Partamos por el inventario.\nAna Ejemplo: Lo llevamos en una planilla.\n\n[Chat de la reunión]\nAna Ejemplo: Les mando la planilla por correo.");
  assert.deepEqual(leida.structuredContent.participantes, ["Contacto ZH Development", "Ana Ejemplo"]);
  const ttl = vence.get(`zhr:t:${g.id}`) - Date.now();
  assert.ok(ttl > 13.9 * 864e5 && ttl <= 14 * 864e5);
});

test("la misma reunión mandada dos veces queda una; la vacía no se guarda; la vieja no se lista", async () => {
  const misma = reunion();
  const uno = await (await mandar(misma)).json();
  const dos = await (await mandar(misma)).json();
  assert.equal(uno.id, dos.id);
  const vacia = await (await mandar(reunion({ transcript: [], meetingTitle: "Prueba" }))).json();
  assert.deepEqual([vacia.ok, vacia.guardada], [true, false]);
  await mandar(reunion({ meetingTitle: "Antigua", meetingStartTimestamp: hace(20 * 1440), meetingEndTimestamp: hace(20 * 1440 - 30) }));
  const { llaves } = await conectarConector();
  const lista = (await llamar(llaves.access_token, "transcripciones", { dias: 30 })).structuredContent.transcripciones;
  assert.deepEqual(lista.map((t) => t.titulo), ["Diagnóstico · Panadería Ejemplo"]);
});

test("el cuerpo «simple» también sirve: nombres del texto y hora de llegada", async () => {
  const r = await (await mandar({ webhookBodyType: "simple", meetingSoftware: "Google Meet", meetingTitle: "abc-defg-hij", meetingStartTimestamp: "15-10-2026, 10:00 a. m.", meetingEndTimestamp: "15-10-2026, 10:30 a. m.", transcript: "Lorenzo (15-10-2026, 10:00 a. m.)\nBuenos días.\n\nCliente (15-10-2026, 10:01 a. m.)\nHola.\nTodo bien.\n\n", chatMessages: "" })).json();
  assert.equal(r.guardada, true);
  const { llaves } = await conectarConector();
  const [t] = (await llamar(llaves.access_token, "transcripciones", {})).structuredContent.transcripciones;
  assert.equal(t.codigo, "abc-defg-hij");
  assert.ok(Math.abs(Date.parse(t.fin) - Date.now()) < 5000);
  const leida = await llamar(llaves.access_token, "leer_transcripcion", { id: t.id });
  assert.equal(leida.structuredContent.texto, "Lorenzo: Buenos días.\nCliente: Hola. Todo bien.");
});

test("los errores llevan su código: sin id, ya no está, sin base y base caída", async () => {
  const { llaves } = await conectarConector();
  const sinId = await llamar(llaves.access_token, "leer_transcripcion", { id: "conferenceRecords/x/transcripts/y" });
  assert.equal(sinId.structuredContent.error, "sin_id");
  const noEsta = await llamar(llaves.access_token, "leer_transcripcion", { id: "tt-abc123-0123abcd" });
  assert.equal(noEsta.isError, true);
  assert.equal(noEsta.structuredContent.error, "no_existe");
  assert.match(noEsta.content[0].text, /14 días/);
  falla = true;
  const caida = await llamar(llaves.access_token, "transcripciones", {});
  assert.deepEqual(caida.structuredContent, { error: "almacen", mensaje: "No se pudo leer la base de ZH Reuniones. Vuelve a intentar en un rato." });
  assert.equal((await mandar(reunion())).status, 502);
  falla = false;
  delete process.env.KV_REST_API_URL;
  const sinBase = await llamar(llaves.access_token, "transcripciones", {});
  assert.equal(sinBase.structuredContent.error, "sin_almacen");
  assert.match(sinBase.content[0].text, /Upstash for Redis/);
  const w = await mandar(reunion());
  assert.equal(w.status, 503);
  assert.equal((await w.json()).code, "sin_almacen");
});

test("la dirección para TranscripTonic solo se muestra con la clave", async () => {
  const f = await get(equipoPag, "/api/equipo");
  assert.equal(f.status, 200);
  assert.match(f.headers.get("content-security-policy"), /form-action 'self';/);
  const malo = await postForm(equipoPag, "/api/equipo", { clave: "no-es" });
  assert.equal(malo.status, 403);
  assert.doesNotMatch(await malo.text(), /api\/transcripcion/);
  const bueno = await postForm(equipoPag, "/api/equipo", { clave: CLAVE });
  const texto = await bueno.text();
  assert.ok(texto.includes(`${H}/api/transcripcion?t=${tokenWebhook()}`));
  assert.match(texto, /Advanced webhook body/);
});

test("la página de inicio dice qué falta", async () => {
  delete process.env.KV_REST_API_URL;
  process.env.CLAVE_EQUIPO = "";
  const sin = await (await get(inicio, "/")).text();
  assert.equal((sin.match(/>Falta</g) || []).length, 2);
  assert.doesNotMatch(sin, /api\/equipo/);
  process.env.CLAVE_EQUIPO = CLAVE;
  process.env.KV_REST_API_URL = REDIS;
  const con = await (await get(inicio, "/")).text();
  assert.equal((con.match(/>Listo</g) || []).length, 2);
  assert.match(con, /href="\/api\/equipo"/);
  assert.match(con, /https:\/\/zh\.test\/mcp/);
});
