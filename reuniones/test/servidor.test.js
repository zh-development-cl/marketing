/* Pruebas del servidor con Google simulado (fetch falso) y datos inventados. Uso: npm test */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

process.env.GOOGLE_CLIENT_ID = "cliente-prueba.apps.googleusercontent.com";
process.env.GOOGLE_CLIENT_SECRET = "secreto-de-prueba";
process.env.GOOGLE_CUENTA = "cuenta@zh.example";
process.env.EQUIPO = "socio@zh.example, otra@correo.example";
process.env.GOOGLE_REFRESH_TOKEN = "llave-de-prueba";

const { firmar, verificar, sha256b64u } = await import("../lib/jwt.js");
const { olvidarToken, codigoMeet } = await import("../lib/google.js");
const register = await import("../api/oauth/register.js");
const authorize = await import("../api/oauth/authorize.js");
const googleLogin = await import("../api/oauth/google.js");
const token = await import("../api/oauth/token.js");
const mcp = await import("../api/mcp.js");
const conectar = await import("../api/google/conectar.js");
const callback = await import("../api/google/callback.js");
const wellKnown = await import("../api/well-known.js");
const inicio = await import("../api/inicio.js");

const H = "https://zh.test";
const CLAUDE = "https://claude.ai/api/mcp/auth_callback";
const MEET_SCOPES = "openid email https://www.googleapis.com/auth/meetings.space.settings https://www.googleapis.com/auth/meetings.space.readonly";
const resp = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const idToken = (email) => `x.${Buffer.from(JSON.stringify({ iss: "https://accounts.google.com", aud: process.env.GOOGLE_CLIENT_ID, email, email_verified: true, exp: Math.floor(Date.now() / 1000) + 600 })).toString("base64url")}.y`;
const CODIGOS = {
  "codigo-socio": { id_token: idToken("socio@zh.example"), access_token: "a" },
  "codigo-ajeno": { id_token: idToken("ajeno@otro.example"), access_token: "a" },
  "codigo-cuenta": { id_token: idToken("cuenta@zh.example"), access_token: "a", refresh_token: "llave-nueva-123", scope: MEET_SCOPES },
  "codigo-cuenta-sin-permisos": { id_token: idToken("cuenta@zh.example"), access_token: "a", refresh_token: "x", scope: "openid email" },
};
let llamadas = [];
let rutas = {};
globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  llamadas.push({ url: u, method: init.method || "GET", body: init.body });
  if (u === "https://oauth2.googleapis.com/token") {
    const p = new URLSearchParams(String(init.body));
    if (p.get("grant_type") === "refresh_token") return p.get("refresh_token") === "revocada" ? resp(400, { error: "invalid_grant" }) : resp(200, { access_token: "ya29.prueba", expires_in: 3600 });
    const t = CODIGOS[p.get("code")];
    return t ? resp(200, t) : resp(400, { error: "invalid_grant" });
  }
  for (const [prefijo, fn] of Object.entries(rutas)) if (u.startsWith(prefijo)) return fn(u, init);
  return resp(404, { error: { message: "no simulado: " + u, status: "NOT_FOUND" } });
};
beforeEach(() => { llamadas = []; rutas = {}; olvidarToken(); process.env.EQUIPO = "socio@zh.example, otra@correo.example"; process.env.GOOGLE_REFRESH_TOKEN = "llave-de-prueba"; });

const get = (mod, ruta) => mod.GET(new Request(H + ruta));
const postJson = (mod, ruta, body, headers = {}) => mod.POST(new Request(H + ruta, { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", ...headers } }));
const postForm = (mod, ruta, campos) => mod.POST(new Request(H + ruta, { method: "POST", body: new URLSearchParams(campos), headers: { "content-type": "application/x-www-form-urlencoded" } }));
const loc = (r) => new URL(r.headers.get("location"));

/* Recorre el flujo completo de claude.ai y devuelve las llaves. */
async function conectarConector(codigoGoogle = "codigo-socio") {
  const reg = await (await postJson(register, "/api/oauth/register", { redirect_uris: [CLAUDE], client_name: "Claude" })).json();
  const verificador = "verificador-de-prueba-largo-1234567890";
  const a = await get(authorize, `/api/oauth/authorize?${new URLSearchParams({ client_id: reg.client_id, redirect_uri: CLAUDE, response_type: "code", code_challenge: sha256b64u(verificador), code_challenge_method: "S256", state: "estado-claude", resource: H + "/mcp" })}`);
  const estado = loc(a).searchParams.get("state");
  const g = await get(googleLogin, `/api/oauth/google?${new URLSearchParams({ state: estado, code: codigoGoogle })}`);
  if (g.status !== 302) return { g };
  const vuelta = loc(g);
  const t = await postForm(token, "/api/oauth/token", { grant_type: "authorization_code", code: vuelta.searchParams.get("code"), client_id: reg.client_id, redirect_uri: CLAUDE, code_verifier: verificador });
  return { reg, a, g, vuelta, t, llaves: await t.json() };
}
const rpc = (llave, method, params, id = 1) => postJson(mcp, "/mcp", { jsonrpc: "2.0", id, method, params }, llave ? { authorization: "Bearer " + llave } : {});

test("las fichas firmadas no se pueden cambiar y vencen", () => {
  const t = firmar({ typ: "acceso", e: "socio@zh.example" }, 60);
  assert.equal(verificar(t, "acceso").e, "socio@zh.example");
  assert.equal(verificar(t, "codigo"), null);
  const [h, , s] = t.split(".");
  const otro = Buffer.from(JSON.stringify({ typ: "acceso", e: "intruso@x.example" })).toString("base64url");
  assert.equal(verificar(`${h}.${otro}.${s}`, "acceso"), null);
  assert.equal(verificar(firmar({ typ: "acceso" }, -1), "acceso"), null);
  assert.equal(codigoMeet("https://meet.google.com/abc-defg-hij?authuser=1"), "abc-defg-hij");
});

test("los documentos de descubrimiento apuntan a este servidor", async () => {
  const r = await (await get(wellKnown, "/api/well-known?doc=recurso")).json();
  assert.deepEqual([r.resource, r.authorization_servers[0]], [H + "/mcp", H]);
  const s = await (await get(wellKnown, "/api/well-known?doc=servidor")).json();
  assert.equal(s.registration_endpoint, H + "/api/oauth/register");
  assert.deepEqual(s.code_challenge_methods_supported, ["S256"]);
});

test("solo se registran clientes con el regreso de claude.ai o local", async () => {
  const malo = await postJson(register, "/api/oauth/register", { redirect_uris: ["https://evil.example/cb"] });
  assert.equal(malo.status, 400);
  const bueno = await postJson(register, "/api/oauth/register", { redirect_uris: [CLAUDE] });
  assert.equal(bueno.status, 201);
  assert.ok((await bueno.json()).client_id);
});

test("el flujo de claude.ai: Google, código con PKCE y llaves", async () => {
  const { a, vuelta, t, llaves } = await conectarConector();
  const google = loc(a);
  assert.equal(google.host, "accounts.google.com");
  assert.equal(google.searchParams.get("redirect_uri"), H + "/api/oauth/google");
  assert.equal(vuelta.origin + vuelta.pathname, CLAUDE);
  assert.equal(vuelta.searchParams.get("state"), "estado-claude");
  assert.equal(t.status, 200);
  assert.equal(llaves.token_type, "Bearer");
  assert.ok(llaves.access_token && llaves.refresh_token);
});

test("sin PKCE, el regreso lleva el error", async () => {
  const reg = await (await postJson(register, "/api/oauth/register", { redirect_uris: [CLAUDE] })).json();
  const r = await get(authorize, `/api/oauth/authorize?${new URLSearchParams({ client_id: reg.client_id, redirect_uri: CLAUDE, response_type: "code", state: "s" })}`);
  assert.equal(loc(r).searchParams.get("error"), "invalid_request");
  const otro = await get(authorize, `/api/oauth/authorize?${new URLSearchParams({ client_id: reg.client_id, redirect_uri: "https://evil.example/cb", response_type: "code" })}`);
  assert.equal(otro.status, 400);
});

test("una cuenta que no es del equipo no recibe el código", async () => {
  const { g } = await conectarConector("codigo-ajeno");
  assert.equal(g.status, 403);
  assert.match(await g.text(), /no está en el equipo de ZH/);
});

test("el verificador PKCE equivocado no da llaves", async () => {
  const reg = await (await postJson(register, "/api/oauth/register", { redirect_uris: [CLAUDE] })).json();
  const a = await get(authorize, `/api/oauth/authorize?${new URLSearchParams({ client_id: reg.client_id, redirect_uri: CLAUDE, response_type: "code", code_challenge: sha256b64u("bueno"), code_challenge_method: "S256" })}`);
  const g = await get(googleLogin, `/api/oauth/google?${new URLSearchParams({ state: loc(a).searchParams.get("state"), code: "codigo-socio" })}`);
  const t = await postForm(token, "/api/oauth/token", { grant_type: "authorization_code", code: loc(g).searchParams.get("code"), client_id: reg.client_id, redirect_uri: CLAUDE, code_verifier: "malo" });
  assert.equal(t.status, 400);
  assert.equal((await t.json()).error, "invalid_grant");
});

test("la llave de renovación da otra; quien sale del equipo ya no renueva", async () => {
  const { reg, llaves } = await conectarConector();
  const r = await postForm(token, "/api/oauth/token", { grant_type: "refresh_token", refresh_token: llaves.refresh_token, client_id: reg.client_id });
  assert.equal(r.status, 200);
  process.env.EQUIPO = "otra@correo.example";
  const r2 = await postForm(token, "/api/oauth/token", { grant_type: "refresh_token", refresh_token: llaves.refresh_token, client_id: reg.client_id });
  assert.equal(r2.status, 400);
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
  assert.deepEqual(lista.result.tools.map((t) => t.name), ["preparar_reunion", "transcripciones", "leer_transcripcion"]);
  process.env.EQUIPO = "otra@correo.example";
  assert.equal((await rpc(llaves.access_token, "tools/list", {})).status, 401);
});

test("preparar_reunion prende la transcripción automática de la reunión", async () => {
  const { llaves } = await conectarConector();
  rutas["https://meet.googleapis.com/v2/spaces/abc-defg-hij"] = () => resp(200, { name: "spaces/EspacioXYZ", meetingCode: "abc-defg-hij", config: { accessType: "TRUSTED" } });
  rutas["https://meet.googleapis.com/v2/spaces/EspacioXYZ"] = (u, init) => resp(200, { name: "spaces/EspacioXYZ", config: JSON.parse(init.body).config });
  const r = await (await rpc(llaves.access_token, "tools/call", { name: "preparar_reunion", arguments: { meet: "https://meet.google.com/abc-defg-hij" } })).json();
  assert.equal(r.result.isError, false);
  assert.deepEqual(r.result.structuredContent, { codigo: "abc-defg-hij", transcripcion: "automatica", yaEstaba: false });
  const patch = llamadas.find((c) => c.method === "PATCH");
  assert.ok(patch && patch.url.includes("updateMask=config.artifactConfig.transcriptionConfig.autoTranscriptionGeneration"));
  assert.equal(JSON.parse(patch.body).config.artifactConfig.transcriptionConfig.autoTranscriptionGeneration, "ON");
  const auth = llamadas.filter((c) => c.url.startsWith("https://meet.googleapis.com"));
  assert.ok(auth.length === 2);
});

test("si Google no deja transcribir, el error lo explica", async () => {
  const { llaves } = await conectarConector();
  rutas["https://meet.googleapis.com/v2/spaces/abc-defg-hij"] = () => resp(200, { name: "spaces/EspacioXYZ", config: {} });
  rutas["https://meet.googleapis.com/v2/spaces/EspacioXYZ"] = () => resp(403, { error: { message: "The caller does not have permission", status: "PERMISSION_DENIED" } });
  const r = await (await rpc(llaves.access_token, "tools/call", { name: "preparar_reunion", arguments: { meet: "abc-defg-hij" } })).json();
  assert.equal(r.result.isError, true);
  assert.match(r.result.content[0].text, /Business Standard/);
  assert.equal(r.result.structuredContent.error, "sin_transcripcion");
  rutas["https://meet.googleapis.com/v2/spaces/abc-defg-hij"] = () => resp(404, { error: { message: "not found", status: "NOT_FOUND" } });
  const r2 = await (await rpc(llaves.access_token, "tools/call", { name: "preparar_reunion", arguments: { meet: "abc-defg-hij" } })).json();
  assert.match(r2.result.content[0].text, /no es de la cuenta de Google de ZH/);
  assert.equal(r2.result.structuredContent.error, "ajena");
  rutas["https://meet.googleapis.com/v2/spaces/abc-defg-hij"] = () => resp(500, { error: { message: "backend", status: "INTERNAL" } });
  const r4 = await (await rpc(llaves.access_token, "tools/call", { name: "preparar_reunion", arguments: { meet: "abc-defg-hij" } })).json();
  assert.deepEqual(r4.result.structuredContent, { error: "google", mensaje: "No se pudo hablar con Google Meet. Vuelve a intentar en un rato." });
  process.env.GOOGLE_REFRESH_TOKEN = "revocada";
  olvidarToken();
  const r3 = await (await rpc(llaves.access_token, "tools/call", { name: "preparar_reunion", arguments: { meet: "abc-defg-hij" } })).json();
  assert.match(r3.result.content[0].text, /vuelve a conectarla/);
  assert.equal(r3.result.structuredContent.error, "google_reconectar");
});

test("transcripciones lista las terminadas, con el código de la reunión", async () => {
  const { llaves } = await conectarConector();
  rutas["https://meet.googleapis.com/v2/conferenceRecords?"] = (u) => {
    assert.match(decodeURIComponent(new URL(u).searchParams.get("filter")), /^start_time>="/);
    return resp(200, { conferenceRecords: [
      { name: "conferenceRecords/c1", startTime: "2026-10-15T14:00:00Z", endTime: "2026-10-15T14:40:00Z", space: "spaces/S1" },
      { name: "conferenceRecords/c2", startTime: "2026-10-17T13:00:00Z", space: "spaces/S2" },
    ] });
  };
  rutas["https://meet.googleapis.com/v2/spaces/S1"] = () => resp(200, { name: "spaces/S1", meetingCode: "abc-defg-hij" });
  rutas["https://meet.googleapis.com/v2/conferenceRecords/c1/transcripts"] = () => resp(200, { transcripts: [
    { name: "conferenceRecords/c1/transcripts/t1", state: "FILE_GENERATED", docsDestination: { document: "d1", exportUri: "https://docs.google.com/document/d/d1/edit" } },
    { name: "conferenceRecords/c1/transcripts/t2", state: "STARTED" },
    { name: "conferenceRecords/c1/transcripts/t3", state: "ENDED", docsDestination: { exportUri: "javascript:alert(1)" } },
  ] });
  const r = await (await rpc(llaves.access_token, "tools/call", { name: "transcripciones", arguments: { dias: 7 } })).json();
  assert.deepEqual(r.result.structuredContent.transcripciones, [
    { id: "conferenceRecords/c1/transcripts/t1", codigo: "abc-defg-hij", inicio: "2026-10-15T14:00:00Z", fin: "2026-10-15T14:40:00Z", estado: "lista", doc: "https://docs.google.com/document/d/d1/edit" },
    { id: "conferenceRecords/c1/transcripts/t3", codigo: "abc-defg-hij", inicio: "2026-10-15T14:00:00Z", fin: "2026-10-15T14:40:00Z", estado: "procesando", doc: "" },
  ]);
});

test("leer_transcripcion junta las frases por persona, con su nombre", async () => {
  const { llaves } = await conectarConector();
  rutas["https://meet.googleapis.com/v2/conferenceRecords/c1/participants"] = () => resp(200, { participants: [
    { name: "conferenceRecords/c1/participants/p1", signedinUser: { user: "users/1", displayName: "Socia de ZH" } },
    { name: "conferenceRecords/c1/participants/p2", anonymousUser: { displayName: "Cliente Prueba" } },
  ] });
  rutas["https://meet.googleapis.com/v2/conferenceRecords/c1/transcripts/t1/entries"] = (u) => {
    const pagina = new URL(u).searchParams.get("pageToken");
    if (!pagina) return resp(200, { transcriptEntries: [{ participant: "conferenceRecords/c1/participants/p1", text: "Hola, ¿cómo están?" }, { participant: "conferenceRecords/c1/participants/p1", text: "Partamos." }], nextPageToken: "p2" });
    return resp(200, { transcriptEntries: [{ participant: "conferenceRecords/c1/participants/p2", text: "Hoy cotizamos en planillas." }, { participant: "conferenceRecords/c1/participants/p9", text: "Se escucha." }] });
  };
  const r = await (await rpc(llaves.access_token, "tools/call", { name: "leer_transcripcion", arguments: { id: "conferenceRecords/c1/transcripts/t1" } })).json();
  const d = r.result.structuredContent;
  assert.equal(d.texto, "Socia de ZH: Hola, ¿cómo están? Partamos.\nCliente Prueba: Hoy cotizamos en planillas.\nParticipante: Se escucha.");
  assert.deepEqual(d.participantes, ["Socia de ZH", "Cliente Prueba", "Participante"]);
  const malo = await (await rpc(llaves.access_token, "tools/call", { name: "leer_transcripcion", arguments: { id: "../otra" } })).json();
  assert.equal(malo.result.isError, true);
});

test("conectar la cuenta de ZH: solo esa cuenta y con todos los permisos", async () => {
  const c = await get(conectar, "/api/google/conectar");
  const google = loc(c);
  assert.equal(google.searchParams.get("access_type"), "offline");
  assert.equal(google.searchParams.get("login_hint"), "cuenta@zh.example");
  assert.match(google.searchParams.get("scope"), /meetings\.space\.settings/);
  const estado = google.searchParams.get("state");
  const bien = await get(callback, `/api/google/callback?${new URLSearchParams({ state: estado, code: "codigo-cuenta" })}`);
  assert.equal(bien.status, 200);
  assert.match(await bien.text(), /llave-nueva-123/);
  const otra = await get(callback, `/api/google/callback?${new URLSearchParams({ state: estado, code: "codigo-socio" })}`);
  assert.equal(otra.status, 403);
  const sinPermisos = await get(callback, `/api/google/callback?${new URLSearchParams({ state: estado, code: "codigo-cuenta-sin-permisos" })}`);
  assert.equal(sinPermisos.status, 400);
  const vencido = await get(callback, `/api/google/callback?${new URLSearchParams({ state: "x", code: "codigo-cuenta" })}`);
  assert.equal(vencido.status, 400);
});

test("sin el cliente de Google, avisa qué falta en vez de fallar", async () => {
  const secreto = process.env.GOOGLE_CLIENT_SECRET;
  process.env.GOOGLE_CLIENT_SECRET = "";
  try {
    const r = await postJson(register, "/api/oauth/register", { redirect_uris: [CLAUDE] });
    assert.equal(r.status, 503);
    assert.match((await r.json()).error_description, /GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET/);
    assert.equal((await get(conectar, "/api/google/conectar")).status, 503);
    assert.equal((await rpc("cualquiera", "tools/list", {})).status, 401);
  } finally { process.env.GOOGLE_CLIENT_SECRET = secreto; }
});

test("la página de inicio dice qué falta y la dirección del conector", async () => {
  const r = await inicio.GET(new Request(H + "/"));
  const t = await r.text();
  assert.match(t, /https:\/\/zh\.test\/mcp/);
  assert.match(t, /Listo<\/span> · Cuenta de Google de ZH conectada/);
  assert.ok(!t.includes("llave-de-prueba") && !t.includes("secreto-de-prueba"));
});
