/* Lo que corre en el navegador en la página «Transcribir en vivo»: escucha con el micrófono, el
   reconocimiento de voz de Chrome o Edge lo pasa a texto (es-CL) y, al terminar, lo manda a
   /api/vivo-guardar. Mientras escucha, manda lo último a /api/vivo-avance para el CRM y lo guarda en
   el navegador: si la pestaña se cierra, al volver ofrece mandarlo. La función se manda como texto
   (no usa nada de este módulo). */
export function cliente(conf) {
  const $ = (id) => document.getElementById(id);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const LOCAL = "zhr:vivo";
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const hora = (v) => { try { return new Date(v).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
  const mmss = (n) => Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0");
  const SIN_PERMISO = "Chrome no dio permiso para usar el micrófono. Permítelo en el ícono junto a la dirección de la página y vuelve a intentar.";
  const SIN_SERVICIO = "El servicio de voz del navegador no respondió. Vuelve a intentar en Chrome o Edge, con internet.";
  let s = null;
  let lineas = [];
  let inicio = "";
  let ultima = null;

  const local = {
    leer() { try { const x = JSON.parse(localStorage.getItem(LOCAL) || "null"); return x && Array.isArray(x.lineas) && x.lineas.length ? x : null; } catch (e) { return null; } },
    poner(x) { try { localStorage.setItem(LOCAL, JSON.stringify(x)); } catch (e) { /* sin almacenamiento */ } },
    borrar() { try { localStorage.removeItem(LOCAL); } catch (e) { /* sin almacenamiento */ } },
  };
  const ver = (id, si) => { $(id).hidden = !si; };
  const estado = (t) => { $("estado").textContent = t; };
  const aviso = (t) => { $("aviso").textContent = t || ""; ver("aviso", !!t); };
  const pintar = (parcial) => {
    const t = lineas.join("\n") + (parcial ? (lineas.length ? "\n" : "") + parcial : "");
    $("texto").textContent = t;
    ver("texto", !!t);
    $("texto").scrollTop = $("texto").scrollHeight;
  };
  const respaldar = () => local.poner({ ref: conf.ref, tipo: conf.tipo, inicio, fin: new Date().toISOString(), lineas });
  const postJson = (url, d) => fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(d), credentials: "same-origin" });

  /* Lo último de la llamada va al CRM cada 2,5 segundos como mucho, una solicitud a la vez: ahí se ve
     lo que se dice y Claude sugiere qué responder. Si falla da lo mismo: la transcripción completa se
     manda al terminar, después de la última de estas (si no, la pisaría en el CRM). */
  const avance = { ultimo: 0, t: null, p: null, otra: false, enviado: false };
  function avisar() {
    if (!conf.ref || !s) return;
    if (avance.p) { avance.otra = true; return; }
    const falta = 2500 - (Date.now() - avance.ultimo);
    if (falta > 0) { if (!avance.t) avance.t = setTimeout(() => { avance.t = null; avisar(); }, falta); return; }
    avance.ultimo = Date.now();
    avance.enviado = true;
    avance.p = postJson("/api/vivo-avance", { ref: conf.ref, tipo: conf.tipo, inicio, lineas: lineas.slice(-40), parcial: s.parcial || "", total: lineas.length })
      .catch(() => {})
      .finally(() => { avance.p = null; if (avance.otra) { avance.otra = false; avisar(); } });
  }
  const esperarAvance = async () => { clearTimeout(avance.t); avance.t = null; avance.otra = false; try { if (avance.p) await avance.p; } catch (e) { /* da lo mismo */ } };
  /* Si no se escuchó nada, igual avisa que terminó: así el CRM deja de mostrarla en curso. */
  async function terminarSinTexto() {
    const d = { ref: conf.ref, tipo: conf.tipo, inicio, fin: new Date().toISOString(), lineas: [] };
    avance.enviado = false;
    await esperarAvance();
    postJson("/api/vivo-guardar", d).catch(() => {});
  }

  function soltar(x) {
    clearInterval(x.reloj); clearInterval(x.medidor); clearTimeout(x.reinicio); clearTimeout(x.corte);
    if (x.stream) x.stream.getTracks().forEach((t) => t.stop());
    if (x.audio) x.audio.close().catch(() => {});
    if (x.lock) x.lock.release().catch(() => {});
  }
  function cerrar(x, falla) {
    if (s !== x) return;
    s = null;
    if (x.parcial) { lineas.push(cap(x.parcial)); x.parcial = ""; }
    soltar(x);
    clearTimeout(avance.t);
    avance.t = null;
    ver("vivo", false);
    ver("terminar", false);
    ver("volver-crm", false);
    $("reloj").textContent = "";
    pintar("");
    aviso(falla || "");
    if (lineas.length) mandar({ ref: conf.ref, tipo: conf.tipo, inicio, fin: new Date().toISOString(), lineas: lineas.slice() });
    else {
      estado(falla ? "No se pudo transcribir" : "No se escuchó nada");
      ver("empezar", true);
      if (conf.ref && avance.enviado) terminarSinTexto();
    }
  }
  function sesion(x) {
    const r = new SR();
    r.lang = x.lang;
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onstart = () => { if (s === x) estado("Escuchando"); };
    r.onresult = (e) => {
      if (s !== x) return;
      let parcial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const t = String((res[0] && res[0].transcript) || "").trim();
        if (!t) continue;
        if (res.isFinal) { x.fallasRed = 0; lineas.push(cap(t)); respaldar(); }
        else parcial += (parcial ? " " : "") + t;
      }
      x.parcial = parcial;
      pintar(parcial);
      avisar();
    };
    r.onerror = (e) => {
      if (s !== x) return;
      const c = (e && e.error) || "";
      if (c === "no-speech" || c === "aborted") return;
      if (c === "network") { x.fallasRed += 1; return; }
      if (c === "language-not-supported" && x.lang !== "es-ES") { x.lang = "es-ES"; return; }
      x.quiere = false;
      x.falla = c === "not-allowed" || c === "service-not-allowed" ? SIN_PERMISO : c === "audio-capture" ? "No se encontró un micrófono en este computador." : SIN_SERVICIO;
    };
    /* Chrome corta la sesión tras un silencio largo o un problema de red: se retoma sola. */
    r.onend = () => {
      if (s !== x) return;
      if (!x.quiere) { cerrar(x, x.falla); return; }
      if (x.fallasRed >= 4) { cerrar(x, "Se cortó la conexión con el servicio de voz. Lo transcrito hasta ahora se manda igual."); return; }
      const espera = x.fallasRed ? Math.min(4000, 500 * 2 ** x.fallasRed) : 250;
      x.reinicio = setTimeout(() => { if (s === x && x.quiere) arrancar(x); }, espera);
    };
    return r;
  }
  function arrancar(x) {
    try { x.rec = sesion(x); x.rec.start(); } catch (e) { x.quiere = false; cerrar(x, SIN_SERVICIO); }
  }
  function medir(x) {
    const an = x.audio.createAnalyser();
    an.fftSize = 512;
    x.audio.createMediaStreamSource(x.stream).connect(an);
    const buf = new Uint8Array(an.fftSize);
    x.medidor = setInterval(() => {
      an.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
      $("barra").style.transform = "scaleX(" + Math.min(1, Math.sqrt(sum / buf.length) * 5).toFixed(2) + ")";
    }, 120);
    if (x.audio.state === "suspended") x.audio.resume().catch(() => {});
  }

  async function empezar() {
    if (s) return;
    aviso("");
    ver("hecho", false);
    ver("fallo", false);
    ver("respaldo", false);
    if (!SR || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { aviso("Este navegador no transcribe en vivo. Abre esta página en Google Chrome o Microsoft Edge."); return; }
    const x = { quiere: true, lang: "es-CL", fallasRed: 0, parcial: "", falla: "" };
    s = x;
    lineas = [];
    pintar("");
    ver("empezar", false);
    estado("Pidiendo el micrófono… Si Chrome pregunta, toca «Permitir».");
    /* El medidor se crea con el clic: después de esperar el permiso el navegador podría no dejarlo andar. */
    const AC = window.AudioContext || window.webkitAudioContext;
    try { if (AC) x.audio = new AC(); } catch (e) { x.audio = null; }
    try {
      x.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const n = (e && e.name) || "";
      s = null;
      soltar(x);
      ver("empezar", true);
      estado("Listo para empezar");
      aviso(n === "NotFoundError" || n === "OverconstrainedError" ? "No se encontró un micrófono en este computador." : n === "NotReadableError" || n === "AbortError" ? "Otra aplicación está usando el micrófono. Ciérrala y vuelve a intentar." : SIN_PERMISO);
      return;
    }
    if (s !== x) { soltar(x); return; }
    if (x.audio) { try { medir(x); } catch (e) { /* sin medidor */ } }
    try { if (navigator.wakeLock) x.lock = await navigator.wakeLock.request("screen"); } catch (e) { x.lock = null; }
    if (s !== x) { soltar(x); return; }
    inicio = new Date().toISOString();
    const t0 = Date.now();
    /* El reloj y, cada 30 segundos sin novedades, un aviso al CRM de que sigue escuchando. */
    x.reloj = setInterval(() => {
      $("reloj").textContent = mmss(Math.round((Date.now() - t0) / 1000));
      if (Date.now() - avance.ultimo > 30000) avisar();
    }, 1000);
    ver("vivo", true);
    ver("terminar", true);
    ver("volver-crm", !!conf.ref);
    $("terminar").disabled = false;
    estado("Escuchando");
    arrancar(x);
    avisar();
  }
  function terminar() {
    const x = s;
    if (!x) return;
    x.quiere = false;
    estado("Terminando…");
    $("terminar").disabled = true;
    if (!x.rec) { cerrar(x, ""); return; }
    try { x.rec.stop(); } catch (e) { cerrar(x, ""); return; }
    /* Si el navegador no avisa que terminó, se cierra igual con lo que haya. */
    x.corte = setTimeout(() => { try { x.rec.abort(); } catch (e) { /* ya terminó */ } cerrar(x, ""); }, 2500);
  }
  async function mandar(d) {
    ultima = d;
    local.poner(d);
    estado("Mandando la transcripción…");
    ver("fallo", false);
    ver("hecho", false);
    ver("respaldo", false);
    await esperarAvance();
    try {
      const r = await postJson("/api/vivo-guardar", d);
      let j = {};
      try { j = await r.json(); } catch (e) { j = {}; }
      if (!r.ok || !j.ok) throw new Error(j.error || "No se pudo mandar la transcripción.");
      avance.enviado = false;
      local.borrar();
      estado(j.guardada ? "Listo" : "No se guardó");
      $("hecho-texto").textContent = j.guardada ? "Listo: la transcripción llegó a ZH Reuniones." : j.motivo || "No se guardó.";
      ver("hecho-volver", !!j.guardada);
      ver("hecho", true);
    } catch (e) {
      estado("No se pudo mandar");
      $("fallo-texto").textContent = (e && e.message) || "No se pudo mandar la transcripción.";
      ver("fallo", true);
    }
    /* Otra con el mismo lead o cliente (el de la dirección): el botón lo dice. */
    $("empezar").textContent = conf.nombre ? "Otra " + (conf.tipo === "llamada" ? "llamada" : "reunión") + " con " + conf.nombre : "Transcribir otra";
    ver("empezar", true);
  }
  async function copiar() {
    const t = (ultima ? ultima.lineas : lineas).join("\n");
    try {
      await navigator.clipboard.writeText(t);
      estado("Texto copiado");
    } catch (e) {
      const sel = window.getSelection();
      const rango = document.createRange();
      rango.selectNodeContents($("texto"));
      sel.removeAllRanges();
      sel.addRange(rango);
      estado("Quedó seleccionado: cópialo con Cmd + C (o Ctrl + C)");
    }
  }

  $("empezar").addEventListener("click", empezar);
  $("terminar").addEventListener("click", terminar);
  $("copiar").addEventListener("click", copiar);
  $("copiar2").addEventListener("click", copiar);
  $("reintentar").addEventListener("click", () => { if (ultima) mandar(ultima); });
  window.addEventListener("beforeunload", (e) => { if (s) { e.preventDefault(); e.returnValue = ""; } });
  const quedo = local.leer();
  if (quedo) {
    $("respaldo-texto").textContent = "Quedó una transcripción sin mandar" + (quedo.inicio ? " (de las " + hora(quedo.inicio) + ")" : "") + ".";
    ver("respaldo", true);
    $("mandar-respaldo").addEventListener("click", () => { lineas = quedo.lineas.slice(); pintar(""); mandar({ ref: quedo.ref || "", tipo: quedo.tipo || "llamada", inicio: quedo.inicio || "", fin: quedo.fin || "", lineas: quedo.lineas }); });
    $("descartar-respaldo").addEventListener("click", () => { local.borrar(); ver("respaldo", false); });
  }
  if (!SR) { aviso("Este navegador no transcribe en vivo. Abre esta página en Google Chrome o Microsoft Edge."); $("empezar").disabled = true; }
}

/* El script de la página, con lo que necesita (el lead o cliente y el tipo) ya validado. */
export const scriptVivo = (conf) => `(${cliente.toString()})(${JSON.stringify(conf).replace(/</g, "\\u003c")});`;
