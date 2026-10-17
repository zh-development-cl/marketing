/* Imita window.claude (db, user, sample, downloads, assets, permissions y, si la prueba lo pide,
   mcp con Google Calendar) para probar el CRM fuera de claude.ai, y el micrófono con el
   reconocimiento de voz del navegador para «Transcribir en vivo».
   Solo para desarrollo: build_preview.py lo inyecta antes de la página en crm/dev/preview.html.
   - db: almacén en memoria con la misma forma de la API (doc/collection, where/orderBy/limit,
     get/set/update/delete, onSnapshot). Rechaza valores undefined como lo haría el JSON real.
   - sample: respuestas fijas según el tipo de instrucción; guarda las instrucciones en
     window.__mockPrompts para revisarlas.
   - window.__MOCK_SEED = { "leads/l1": {...}, ... } carga datos iniciales. */
(() => {
  "use strict";
  const ME = "u_lorenzoAAAAAAAAAAAAAAAAAA";
  const store = new Map();
  const listeners = new Set();
  const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  const tick = (ms) => new Promise((r) => setTimeout(r, ms || 8));
  const segs = (p) => String(p).split("/");
  window.__mockPrompts = [];
  window.__downloads = [];
  window.__mockStore = store;

  const seed = window.__MOCK_SEED || {};
  for (const [p, d] of Object.entries(seed)) store.set(p, clone(d));
  /* Los recordatorios en pantalla dependen de la hora: apagados, salvo que la prueba los pida con
     window.__MOCK_RECORDATORIOS = true. */
  try { if (!window.__MOCK_RECORDATORIOS) localStorage.setItem("zhcrm:recordatorios", "false"); } catch (e) { /* sin almacenamiento */ }

  function assertJson(v, path) {
    if (v === undefined) throw { code: "invalid_argument", message: "undefined en " + path };
    if (typeof v === "function") throw { code: "invalid_argument", message: "función en " + path };
    if (typeof v === "number" && !isFinite(v)) throw { code: "invalid_argument", message: "número inválido en " + path };
    if (Array.isArray(v)) v.forEach((x, i) => assertJson(x, path + "[" + i + "]"));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) assertJson(x, path + "." + k);
  }
  function check(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw { code: "invalid_argument", message: "el documento debe ser un objeto" };
    assertJson(data, "doc");
    if (JSON.stringify(data).length > 256 * 1024) throw { code: "invalid_argument", message: "documento de más de 256 KiB" };
  }
  function merge(a, b) {
    const o = { ...a };
    for (const [k, v] of Object.entries(b)) {
      if (v && typeof v === "object" && !Array.isArray(v) && o[k] && typeof o[k] === "object" && !Array.isArray(o[k])) o[k] = merge(o[k], v);
      else o[k] = v;
    }
    return o;
  }
  function notify() { for (const l of [...listeners]) setTimeout(l.fire, 5); }
  const meta = { fromCache: false, hasPendingWrites: false };
  const snapDoc = (id, data) => ({ id, exists: data !== undefined, data: () => clone(data), metadata: meta });
  function cmp(a, op, b) {
    switch (op) {
      case "==": return a === b;
      case "!=": return a !== b;
      case "<": return a < b;
      case "<=": return a <= b;
      case ">": return a > b;
      case ">=": return a >= b;
      case "in": return b.includes(a);
      case "not-in": return !b.includes(a);
      case "array-contains": return Array.isArray(a) && a.includes(b);
      default: throw { code: "invalid_argument", message: "operador " + op };
    }
  }
  function docsOf(colPath) {
    const n = segs(colPath).length;
    const out = [];
    for (const [p, d] of store) { const s = segs(p); if (s.length === n + 1 && p.startsWith(colPath + "/")) out.push({ id: s[n], data: d }); }
    return out.sort((a, b) => (a.id < b.id ? -1 : 1));
  }
  function makeQuery(colPath, filters, order, lim) {
    const run = () => {
      let docs = docsOf(colPath).filter(({ data }) => filters.every(([f, op, v]) => cmp(data[f], op, v)));
      if (order) {
        const [f, dir] = order;
        docs.sort((a, b) => {
          const x = a.data[f], y = b.data[f];
          if (x === undefined) return 1;
          if (y === undefined) return -1;
          return (x < y ? -1 : x > y ? 1 : 0) * (dir === "desc" ? -1 : 1);
        });
      }
      if (lim) docs = docs.slice(0, lim);
      const snaps = docs.map((d) => snapDoc(d.id, d.data));
      return { docs: snaps, size: snaps.length, empty: !snaps.length, docChanges: () => [], metadata: meta };
    };
    return {
      where(f, op, v) { if (filters.length >= 10) throw { code: "invalid_argument", message: "máximo 10 filtros" }; return makeQuery(colPath, [...filters, [f, op, v]], order, lim); },
      orderBy(f, dir) { return makeQuery(colPath, filters, [f, dir || "asc"], lim); },
      limit(n) { if (!(n >= 1 && n <= 1000)) throw { code: "invalid_argument", message: "limit fuera de rango" }; return makeQuery(colPath, filters, order, n); },
      async get() { await tick(); return run(); },
      onSnapshot(next) { const l = { fire: () => next(run()) }; listeners.add(l); setTimeout(l.fire, 15); return () => listeners.delete(l); },
    };
  }
  const SEG = /^(?!\.\.?$)[A-Za-z0-9_\-.~:@+]{1,200}$/;
  function validPath(path) { const s = segs(path); if (!s.every((x) => SEG.test(x))) throw new TypeError("segmento inválido en " + path); return s; }
  function docRef(path) {
    const s = validPath(path);
    if (s.length % 2) throw new TypeError("un documento necesita un número par de segmentos: " + path);
    const id = s[s.length - 1];
    return {
      id, path,
      async get() { await tick(); return snapDoc(id, store.get(path)); },
      async set(data) { await tick(); check(data); store.set(path, clone(data)); notify(); },
      async update(data) { await tick(); if (!store.has(path)) throw { code: "invalid_argument", message: "update de un documento que no existe: " + path }; check(data); store.set(path, merge(store.get(path), clone(data))); notify(); },
      async delete() { await tick(); store.delete(path); notify(); },
      async acquire() { return { acquired: true, version: 1 }; },
      onSnapshot(next) { const l = { fire: () => next(snapDoc(id, store.get(path))) }; listeners.add(l); setTimeout(l.fire, 15); return () => listeners.delete(l); },
      collection(sub) { return colRef(path + "/" + sub); },
    };
  }
  function colRef(path) {
    const s = validPath(path);
    if (s.length % 2 === 0) throw new TypeError("una colección necesita un número impar de segmentos: " + path);
    const q = makeQuery(path, [], null, null);
    const ref = {
      ...q, path,
      doc(id) { return docRef(path + "/" + (id || "m" + Math.random().toString(36).slice(2, 12))); },
      async add(data) { const r = ref.doc(); await r.set(data); return r; },
    };
    return ref;
  }
  const db = Object.freeze({ doc: docRef, collection: colRef });

  const user = Object.freeze({
    isOwner: async () => true,
    canEdit: async () => true,
    can: async () => true,
    id: async () => ME,
    me: async () => ({ id: ME, name: "Lorenzo Bozzo", avatarUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 26 26'><circle cx='13' cy='13' r='13' fill='%23245CE4'/></svg>", color: "#245CE4", email: null, isOwner: true, canEdit: true }),
    profiles: async (ids) => Object.fromEntries([].concat(ids).map((id) => [id, { id, name: id === ME ? "Lorenzo Bozzo" : "", avatarUrl: "", color: "#888", email: null, isMe: id === ME, guest: false }])),
    name: async () => "Lorenzo Bozzo",
    search: async () => [],
  });

  const plus = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  function answer(p) {
    if (p.includes("reunión semanal de los socios")) return {
      titular: "Semana con más reuniones, pero dos propuestas sin respuesta.",
      bien: ["Se agendaron reuniones nuevas", "Las llamadas se registraron con su análisis"],
      atencion: ["Taller Norte lleva días con la propuesta sin respuesta", "Quedan leads nuevos sin llamar"],
      proximos: ["Llamar a Taller Norte por la propuesta", "Llamar a los leads nuevos de la lista", "Preparar la reunión del martes"],
    };
    if (p.includes("Resume en qué va la relación de ZH con este lead")) {
      window.__ahoraPedidos = (window.__ahoraPedidos || 0) + 1;
      return { enQueVa: "Contestó la última llamada y quiere ver cómo cotizar más rápido; quedó en revisar la idea con su socio.", queHacer: "Llamarlo para confirmar si su socio puede estar en la reunión." };
    }
    if (p.includes("Prepara a un socio de ZH Development para una reunión")) return {
      objetivo: "Entender cómo cotizan hoy y acordar si vale la pena una propuesta escrita.",
      agenda: ["5 min: presentarnos y confirmar el objetivo", "15 min: que muestre cómo cotiza hoy", "7 min: qué le cuesta y quién decide", "3 min: siguiente paso"],
      preguntas: ["¿Cómo llega hoy un pedido de cotización?", "¿Cuántas cotizaciones hacen a la semana?", "¿Qué parte les toma más tiempo?", "¿Quién más participa en la decisión?", "¿Para cuándo lo necesitan?"],
      senales: ["Tiene un problema con costo claro", "Quiere verlo funcionando pronto"],
      riesgos: ["Dice que es caro: preguntar cuánto le cuesta hoy el problema", "No decide solo: pedir una reunión con quien decide"],
      cierre: "Proponer enviar la propuesta escrita en 3 días hábiles y agendar 20 minutos para revisarla.",
    };
    if (p.includes("Estás ayudando en vivo")) return {
      detecte: "Dice que lo encuentra caro.", respuesta: "Te entiendo. ¿Cuántas horas a la semana se les van hoy en cuadrar el inventario a mano? Con eso vemos si se paga solo.",
      pregunta: "¿Quién más participa en la decisión?", evitar: "Dar un precio antes de conocer el alcance.",
    };
    if (p.includes("Clasifica la solicitud de un cliente")) return {
      cobertura: "garantia", motivo: "Es un error del informe entregado y el proyecto sigue en garantía.", tipo: "error", prioridad: "alta", titulo: "El informe mensual no carga",
      resumen: "El informe mensual queda en blanco desde ayer.", pasos: ["Revisar el registro de errores del informe", "Corregir y avisar al cliente"], preguntas: ["¿Desde qué navegador lo abre?"],
      respuesta: "Hola Marcela, gracias por avisar. Es un error del sistema y está cubierto por la garantía, así que lo corregimos sin costo. Te escribo apenas quede listo, hoy mismo.",
    };
    if (p.includes("Ordena las notas de una reunión")) return {
      resumen: "Revisamos el avance del diseño. El cliente aprobó las pantallas principales.", acuerdos: ["Diseño aprobado"], pendientesZH: ["Enviar el calendario de pruebas"], pendientesCliente: ["Mandar el acceso al ERP"],
      solicitudes: [{ titulo: "Agregar exportación a Excel", descripcion: "Pidieron exportar el reporte de ventas a Excel.", cobertura: "evolutivo" }], proximaReunion: plus(7),
    };
    if (p.includes("CLIENTE actual de ZH")) {
      if (p.includes("Escribe un mensaje de WhatsApp")) return { texto: "Hola Marcela, te cuento que el diseño quedó aprobado y esta semana partimos con la construcción. ¿Nos puedes enviar el acceso al ERP antes del viernes?" };
      return {
        asunto: "Avance del proyecto: diseño aprobado", preheader: "Lo que viene y lo que necesitamos de ustedes", etiqueta: "Avance", titular: "El diseño quedó aprobado",
        saludo: "Hola Marcela,", parrafos: ["Te cuento en qué va el proyecto: **el diseño quedó aprobado** y esta semana partimos con la construcción.", "Para seguir sin atrasos necesitamos el acceso al ERP antes del viernes."],
        puntos: ["Diseño aprobado", "Construcción desde esta semana"], cta: null, cierre: "Saludos,", posdata: "",
      };
    }
    if (p.includes("Cambios que pide")) {
      if (p.includes("un mensaje de WhatsApp")) return { texto: "Hola Carolina, soy Lorenzo de ZH Development. ¿Te acomoda el jueves a las 11 para una llamada de 30 minutos?" };
      return { asunto: "Retomemos lo de los despachos", preheader: "Te propongo una llamada corta", etiqueta: "Seguimiento", titular: "Ordenemos tus despachos", saludo: "Hola Carolina,", parrafos: ["Versión más corta, como pediste.", "¿Te acomoda el jueves a las 11?"], puntos: [], cta: { texto: "Agendar llamada", url: "https://zhdevelopment.cl/#agendar" }, cierre: "Saludos,", posdata: "" };
    }
    if (p.includes("Escribe un mensaje de WhatsApp")) return { texto: "Hola Carolina, soy Lorenzo de ZH Development. Te escribo por lo que conversamos de los despachos: ¿te acomoda una llamada de 30 minutos esta semana? Puedes elegir horario aquí: https://zhdevelopment.cl/#agendar" };
    if (p.includes("Escribe un correo")) return {
      asunto: "Ordenar los despachos de Transportes Andes", preheader: "Una llamada de 30 minutos para ver por dónde partir", etiqueta: "Seguimiento", titular: "Ordenemos los despachos",
      saludo: "Hola Carolina,", parrafos: ["Gracias por la conversación de hoy. Me quedó claro que hoy los despachos se coordinan entre **planillas, correo y WhatsApp**, y que eso hace difícil saber en qué estado está cada pedido.", "Te propongo una llamada de 30 minutos para levantar el proceso y ver qué conviene conectar primero. Después te enviamos una propuesta escrita con alcance, plazo y precio."],
      puntos: ["Un solo lugar para ver cada despacho", "Avisos automáticos cuando algo se atrasa"], cta: { texto: "Agendar llamada", url: "https://zhdevelopment.cl/#agendar" }, cierre: "Saludos,", posdata: "",
    };
    if (p.includes("Analiza esta reunión")) return {
      resumen: "Revisamos cómo coordinan hoy los despachos. Quieren una propuesta para ordenar el seguimiento de pedidos.", puntos: ["Tres bodegas", "Usan una planilla compartida"], necesidades: ["Ver el estado de cada pedido sin llamar"],
      objeciones: ["Les preocupa el tiempo de implementación"], compromisos: ["Enviar la propuesta"], proximosPasos: ["Propuesta escrita"], interes: "alto", etapaSugerida: "reunion_concretada", reunion: null,
      datos: { cargo: "", empresa: "", correo: "", necesidad: "" },
      tareas: [{ quien: "zh", que: "Enviar la propuesta", tipo: "propuesta", fecha: plus(3), hora: "" }, { quien: "zh", que: "Mandar el resumen de la reunión por correo", tipo: "correo", fecha: "", hora: "" }, { quien: "lead", que: "Mandar la planilla de despachos", tipo: "otro", fecha: "", hora: "" }],
      evaluacion: null,
    };
    if (p.includes("Analiza esta llamada")) {
      const evaluacion = /Transcripción[^:]*:\n\(sin transcripción\)/.test(p) ? null : {
        criterios: { apertura: { nota: 4, comentario: "Se presentó y dijo para qué llamaba." }, descubrimiento: { nota: 3, comentario: "Preguntó por el problema, pero no por el impacto." }, escucha: { nota: 4, comentario: "Dejó hablar." },
          valor: { nota: 3, comentario: "Conectó con el inventario." }, objeciones: { nota: 2, comentario: "Ante el precio, cambió de tema." }, cierre: { nota: 4, comentario: "Quedó una demo agendada." } },
        bien: ["Abrió con el motivo de la llamada"], mejorar: ["Ante «es caro», pregunta cuánto les cuesta hoy el problema"],
      };
      const base = { puntos: [], necesidades: [], objeciones: [], compromisos: [], proximosPasos: [], datos: { cargo: "", empresa: "", correo: "", necesidad: "" }, evaluacion };
      if (/no me interesa/i.test(p)) return { ...base, resumen: "Dijo que no le interesa por ahora.", interes: "bajo", etapaSugerida: "perdido", reunion: null, tareas: [] };
      if (/te escribo para agendar/i.test(p)) return { ...base, resumen: "Quiere ver una demo, pero no dio día.", interes: "medio", etapaSugerida: "contactado", reunion: null, tareas: [{ quien: "zh", que: "Coordinar el día de la demo", tipo: "agendar", fecha: "", hora: "" }] };
      return {
        ...base,
        resumen: "Carolina coordina los despachos con planillas y WhatsApp. Quiere ver el estado de cada pedido sin preguntar.", puntos: ["Tienen 3 bodegas", "Usan una planilla compartida"], necesidades: ["Saber en qué estado está cada despacho"],
        objeciones: ["Les preocupa que el equipo no lo use"], compromisos: ["Enviar un correo con la propuesta de llamada"], proximosPasos: ["Agendar llamada de descubrimiento"], interes: "alto",
        etapaSugerida: "reunion_agendada", reunion: { fecha: plus(2), hora: "11:00", duracion: 30, titulo: "Llamada de descubrimiento" }, datos: { cargo: "Jefa de operaciones", empresa: "", correo: "", necesidad: "" },
        tareas: /propuesta al correo/i.test(p)
          ? [{ quien: "zh", que: "Enviar la propuesta por correo", tipo: "propuesta", fecha: plus(3) }, { quien: "lead", que: "Mandar la planilla de inventario", tipo: "otro", fecha: "" }, { quien: "zh", que: "Mandar por correo el resumen de la llamada", tipo: "correo", fecha: "" }]
          : [{ quien: "zh", que: "Mandar por WhatsApp el enlace de la reunión", tipo: "whatsapp", fecha: "" }],
      };
    }
    if (p.includes("Extrae los contactos")) return { leads: [
      { nombre: "Matías Rojas", empresa: "Ferretería Sur", cargo: "Dueño", telefono: "9 8765 4321", correo: "matias@ferreteriasur.cl", origen: "instagram", necesidad: "Cotizaciones por WhatsApp", notas: "" },
      { nombre: "Carolina Pérez", empresa: "Transportes Andes", telefono: "+56 9 1234 5678", correo: "", origen: "", necesidad: "", notas: "" },
      { nombre: "Daniela Soto", empresa: "Clínica Norte", cargo: "Administradora", telefono: "", correo: "dsoto@clinicanorte.cl", origen: "web", necesidad: "Agenda y fichas", notas: "" },
    ] };
    return { texto: "Respuesta de prueba" };
  }
  function delay(signal) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(resolve, 250);
      if (signal) {
        if (signal.aborted) { clearTimeout(t); reject({ code: "cancelled", message: "cancelado" }); return; }
        signal.addEventListener("abort", () => { clearTimeout(t); reject({ code: "cancelled", message: "cancelado" }); }, { once: true });
      }
    });
  }
  async function sample(input, opts) {
    const o = opts || {};
    window.__mockPrompts.push(String(input));
    await delay(o.signal);
    const text = JSON.stringify(answer(String(input)));
    if (o.onText) o.onText({ text, delta: text });
    return { text, truncated: false, modelTierApplied: o.modelTier || "default" };
  }
  window.__mockOpts = [];
  sample.json = async (input, opts) => { const o = opts || {}; window.__mockPrompts.push(String(input)); window.__mockOpts.push({ model: o.model || null, modelTier: o.modelTier || null, cache: o.cache }); await delay(o.signal); return answer(String(input)); };
  sample.limits = async () => ({ maxPromptBytes: 262144 });

  const downloads = Object.freeze({ save: async ({ filename, data }) => { window.__downloads.push({ filename, size: typeof data === "string" ? data.length : 0, head: typeof data === "string" ? data.slice(0, 400) : "" }); return { status: "saved" }; } });
  const permissions = Object.freeze({ state: async () => "granted", request: async () => ({}), manage: async () => {} });

  /* Micrófono y reconocimiento de voz simulados para «Transcribir en vivo». Con
     window.__MOCK_MIC = { modo: "ok", frases: [...], cortar: true } el micrófono entrega un tono y
     el reconocimiento dicta las frases (con «cortar», termina la sesión como Chrome tras un
     silencio, para probar que se retoma). Otros modos: "bloqueado" (claude.ai no deja usar el
     micrófono), "sin_micro" y "sin_soporte" (navegador sin reconocimiento de voz). */
  const mic = window.__MOCK_MIC;
  if (mic) {
    window.__srStarts = 0;
    if (mic.modo === "sin_soporte") {
      window.SpeechRecognition = undefined;
      window.webkitSpeechRecognition = undefined;
    } else {
      if (!navigator.mediaDevices) Object.defineProperty(navigator, "mediaDevices", { value: {}, configurable: true });
      navigator.mediaDevices.getUserMedia = async () => {
        await tick(60);
        if (mic.modo === "bloqueado") throw new DOMException("Permission denied by permissions policy", "NotAllowedError");
        if (mic.modo === "sin_micro") throw new DOMException("Requested device not found", "NotFoundError");
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const dst = ctx.createMediaStreamDestination();
        osc.connect(dst);
        osc.start();
        return dst.stream;
      };
      let dictadas = false;
      class FakeSR {
        constructor() { this.lang = ""; this.continuous = false; this.interimResults = false; this.onstart = this.onresult = this.onerror = this.onend = null; this._t = []; this._on = false; this._res = []; }
        _at(ms, fn) { this._t.push(setTimeout(fn, ms)); }
        start() {
          if (this._on) throw new DOMException("ya iniciado", "InvalidStateError");
          this._on = true;
          window.__srStarts += 1;
          window.__srLang = this.lang;
          window.__srActual = this;
          this._at(40, () => this.onstart && this.onstart({}));
          if (dictadas) return;
          dictadas = true;
          const frases = mic.frases || [];
          this.dictar(frases, 120);
          if (mic.cortar) this._at(260 + frases.length * 160, () => { this.onerror && this.onerror({ error: "no-speech" }); this._end(); });
        }
        /* Cada frase llega primero a medias y después como resultado final, como en Chrome. */
        dictar(frases, desde) {
          const t0 = desde || 60;
          const i0 = this._res.length;
          frases.forEach((f, k) => {
            const i = i0 + k;
            this._res[i] = null;
            this._at(t0 + k * 160, () => { this._res[i] = { 0: { transcript: f.split(" ").slice(0, 2).join(" ") }, isFinal: false, length: 1 }; this.onresult && this.onresult({ resultIndex: i, results: this._res.slice(0, i + 1) }); });
            this._at(t0 + 80 + k * 160, () => { this._res[i] = { 0: { transcript: " " + f }, isFinal: true, length: 1 }; this.onresult && this.onresult({ resultIndex: i, results: this._res.slice(0, i + 1) }); });
          });
        }
        _end() { if (!this._on) return; this._on = false; this._t.forEach(clearTimeout); this._t = []; if (this.onend) this.onend({}); }
        stop() { this._t.push(setTimeout(() => this._end(), 30)); }
        abort() { this._end(); }
      }
      window.__srDictar = (frases) => { const r = window.__srActual; if (r && r._on) r.dictar(frases); };
      window.SpeechRecognition = FakeSR;
      window.webkitSpeechRecognition = FakeSR;
    }
  }


  /* Google Calendar simulado (capacidad «mcp»), solo si la prueba lo pide con
     window.__MOCK_MCP = { modo: "ok" | "aprobacion" | "sin_conector" | "reauth" | "error_lectura",
     eventos: [...], fallaCrear: "<código>", fallaMover: "<código>", rechazarPermiso: true }.
     Los eventos tienen la forma que entrega list_events del conector real. window.__mcpCalls guarda
     cada llamada; window.__mcpRefrescar() simula la lectura siguiente (después de cambiar eventos). */
  const mcpCfg = window.__MOCK_MCP;
  let mcp = null;
  if (mcpCfg) {
    window.__mcpCalls = [];
    const cuenta = mcpCfg.cuenta || "contacto@zhdevelopment.cl";
    const watchers = new Set();
    let aprobado = mcpCfg.modo !== "aprobacion";
    const fmtCL = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    const conZona = (local) => {
      for (const off of ["-03:00", "-04:00"]) {
        const p = Object.fromEntries(fmtCL.formatToParts(new Date(local + off)).map((x) => [x.type, x.value]));
        if (`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}` === local.slice(0, 16)) return local + off;
      }
      return local + "-03:00";
    };
    const lista = () => ({ events: clone((mcpCfg.eventos || []).filter((e) => e.status !== "cancelled")), summary: cuenta, timeZone: "America/Santiago", accessRole: "owner" });
    const falla = (code, message) => ({ code, server: "Google Calendar", message: message || "simulado: " + code, ...(code === "server_unavailable" ? { retryable: true } : {}) });
    const entregar = (w) => setTimeout(() => {
      if (!watchers.has(w)) return;
      const m = mcpCfg.modo;
      if (m === "sin_conector") w.handler({ type: "error", error: falla("server_not_connected") });
      else if (m === "reauth") w.handler({ type: "error", error: falla("needs_reauth") });
      else if (m === "error_lectura") w.handler({ type: "error", error: falla("server_unavailable") });
      else if (!aprobado) w.handler({ type: "error", error: falla("approval_required") });
      else w.handler({ type: "data", result: { content: [], payload: lista() } });
    }, 30);
    /* Con «allDay», el evento es de día completo: start y end con «date» (el fin es el día siguiente). */
    const tiempo = (s, input) => (input.allDay ? { date: String(s).slice(0, 10) } : { dateTime: conZona(s), timeZone: input.timeZone || "America/Santiago" });
    const crear = (input) => {
      const id = "ev" + Math.random().toString(36).slice(2, 12);
      const ahora = new Date().toISOString();
      const meet = "https://meet.google.com/abc-" + id.slice(2, 6) + "-xyz";
      const ev = {
        id, summary: input.summary, description: input.description || "", status: "confirmed", eventType: "DEFAULT",
        start: tiempo(input.startTime, input),
        end: tiempo(input.endTime, input),
        ...(input.availability === "AVAILABILITY_FREE" ? { transparency: "transparent" } : {}),
        attendees: [{ email: cuenta, organizer: true, self: true, responseStatus: "accepted" }, ...(input.attendees || []).map((a) => ({ email: a.email, ...(a.displayName ? { displayName: a.displayName } : {}), responseStatus: "needsAction" }))],
        organizer: { email: cuenta, self: true }, creator: { email: cuenta, self: true },
        htmlLink: "https://www.google.com/calendar/event?eid=" + id,
        ...(input.addGoogleMeetUrl ? { conferenceUrl: meet, conferenceData: { solutionName: "Google Meet", videoEntryPoint: { uri: meet } } } : {}),
        created: ahora, updated: ahora,
      };
      mcpCfg.eventos = [...(mcpCfg.eventos || []), ev];
      return ev;
    };
    mcp = Object.freeze({
      watchTool(server, tool, input, handler) {
        if (typeof handler !== "function") throw new TypeError("handler");
        window.__mcpCalls.push({ tipo: "watch", server, tool, input: clone(input) });
        const w = { handler };
        if (server !== "Google Calendar" || tool !== "list_events") { setTimeout(() => handler({ type: "error", error: falla("not_in_manifest") }), 10); return () => {}; }
        watchers.add(w);
        entregar(w);
        return () => watchers.delete(w);
      },
      async callTool(server, tool, input) {
        window.__mcpCalls.push({ tipo: "call", server, tool, input: clone(input) });
        await tick(60);
        if (server !== "Google Calendar" || !["list_events", "create_event", "update_event"].includes(tool)) throw falla("not_in_manifest");
        if (mcpCfg.modo === "sin_conector") throw falla("server_not_connected");
        if (mcpCfg.modo === "reauth") throw falla("needs_reauth");
        if (tool === "list_events") {
          if (mcpCfg.rechazarPermiso) throw falla("approval_required");
          aprobado = true;
          for (const w of watchers) entregar(w);
          return { content: [], payload: lista() };
        }
        if (!aprobado) throw falla("approval_required");
        if (tool === "create_event") {
          if (mcpCfg.fallaCrear) throw falla(mcpCfg.fallaCrear);
          return { content: [], payload: clone(crear(input)) };
        }
        const ev = (mcpCfg.eventos || []).find((e) => e.id === input.eventId);
        if (!ev) throw falla("tool_error", "Not Found");
        if (mcpCfg.fallaMover) throw falla(mcpCfg.fallaMover);
        if (input.startTime) ev.start = tiempo(input.startTime, input);
        if (input.endTime) ev.end = tiempo(input.endTime, input);
        if (input.summary) ev.summary = input.summary;
        ev.updated = new Date().toISOString();
        return { content: [], payload: clone(ev) };
      },
      async invalidate(server, tool) { window.__mcpCalls.push({ tipo: "invalidate", server, tool }); for (const w of watchers) entregar(w); },
      async listTools() { return { servers: [{ server: "Google Calendar", authStatus: "connected", tools: ["list_events", "create_event", "update_event"].map((name) => ({ name, description: "" })) }] }; },
    });
    window.__mcpRefrescar = () => { for (const w of watchers) entregar(w); };
  }

  /* Archivos (capacidad «assets»): guarda los archivos en memoria. Con window.__MOCK_ASSETS =
     { off: true } la vista no puede subir (como un lector); { falla: "<código>" } rechaza cada
     subida y { fallaUnaVez: "store_unavailable" } solo la primera. window.__assetCalls guarda cada
     llamada y window.__assets los archivos guardados. */
  const asCfg = window.__MOCK_ASSETS || {};
  window.__assetCalls = [];
  window.__assets = new Map();
  const TIPOS_OK = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml", "video/mp4", "video/webm", "application/pdf", "font/woff2", "font/woff", "font/ttf", "font/otf", "text/csv", "text/markdown", "application/json", "text/plain", "text/css", "text/javascript"];
  let fallaUna = asCfg.fallaUnaVez || "";
  const assets = asCfg.off ? null : Object.freeze({
    async upload(blob, options) {
      const type = (options && options.type) || (blob && blob.type) || "";
      window.__assetCalls.push({ tipo: "upload", type, size: blob && blob.size, nombre: blob && blob.name });
      await tick(40);
      if (!(blob instanceof Blob) || !blob.size) throw { code: "invalid_request", message: "simulado: blob vacío" };
      if (fallaUna) { const c = fallaUna; fallaUna = ""; throw { code: c, message: "simulado: " + c }; }
      if (asCfg.falla) throw { code: asCfg.falla, message: "simulado: " + asCfg.falla };
      if (!TIPOS_OK.includes(type)) throw { code: "unsupported_type", message: "simulado: " + type };
      if (blob.size > (type === "image/svg+xml" ? 2 : 20) * 1024 * 1024) throw { code: "too_large", message: "simulado: muy grande" };
      const id = Array.from({ length: 32 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
      window.__assets.set(id, { type, size: blob.size, nombre: blob.name || "" });
      return { id, url: "/_blob/" + id, sizeBytes: blob.size, contentType: type };
    },
    async list() { return { assets: [...window.__assets].map(([id, a]) => ({ id, url: "/_blob/" + id, contentType: a.type, sizeBytes: a.size, createdAt: new Date().toISOString() })), usage: { files: window.__assets.size, bytes: 0, maxFiles: 1000, maxBytes: 1 << 30 } }; },
    async delete(ref) {
      window.__assetCalls.push({ tipo: "delete", ref });
      await tick(30);
      const id = String(ref).replace(/^\/_blob\//, "");
      return { deleted: window.__assets.delete(id) };
    },
  });

  /* Con window.__MOCK_SIN_CLAUDE = true la vista no tiene Claude (como si no se diera el permiso). */
  const caps = { db, user, ...(window.__MOCK_SIN_CLAUDE ? {} : { sample }), downloads, permissions, ...(assets ? { assets } : {}), ...(mcp ? { mcp } : {}) };
  const memo = {};
  window.claude = Object.freeze({ use: (name) => (memo[name] = memo[name] || tick(30).then(() => caps[name] || null)) });
})();
