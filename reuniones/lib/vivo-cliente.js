/* Lo que corre en el navegador en la página «Transcribir en vivo»: el reconocimiento de voz de Chrome o
   Edge escucha con el micrófono y lo pasa a texto (es-CL) y, al terminar, la página lo manda a
   /api/vivo-guardar. Mientras escucha, manda lo último a /api/vivo-avance para el CRM y lo guarda en
   el navegador: si la pestaña se cierra, al volver ofrece mandarlo. Con conf.sesion es el «Micrófono
   del CRM»: escucha seguido (Empezar y Pausar), manda cada frase con su hora y no guarda nada al
   terminar, porque el CRM toma lo de cada llamada. La función se manda como texto (no usa nada de este
   módulo). */
export function cliente(conf) {
  const $ = (id) => document.getElementById(id);
  const SES = !!conf.sesion;
  const destino = SES ? conf.sesion : conf.ref;
  const ULTIMAS = SES ? 80 : 40;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const LOCAL = "zhr:vivo";
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const hora = (v) => { try { return new Date(v).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
  const mmss = (n) => Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0");
  const SIN_PERMISO = "Chrome no dio permiso para usar el micrófono. Permítelo en el ícono junto a la dirección de la página y vuelve a intentar.";
  const SIN_SERVICIO = "El servicio de voz del navegador no respondió. Vuelve a intentar en Chrome o Edge, con internet.";
  let s = null;
  let lineas = [];
  let tiempos = [];
  let inicio = "";
  let ultima = null;

  const local = {
    leer() { try { const x = JSON.parse(localStorage.getItem(LOCAL) || "null"); return x && Array.isArray(x.lineas) && x.lineas.length ? x : null; } catch (e) { return null; } },
    poner(x) { try { localStorage.setItem(LOCAL, JSON.stringify(x)); } catch (e) { /* sin almacenamiento */ } },
    borrar() { try { localStorage.removeItem(LOCAL); } catch (e) { /* sin almacenamiento */ } },
  };
  /* La página del micrófono del CRM no tiene las tarjetas de «hecho», «fallo» ni «respaldo». */
  const ver = (id, si) => { const el = $(id); if (el) el.hidden = !si; };
  /* La barra: llena mientras el reconocimiento detecta sonido, casi vacía en silencio. */
  const oir = (si) => { const el = $("barra"); if (el) { el.style.transition = "transform .3s"; el.style.transform = "scaleX(" + (si ? 1 : 0.06) + ")"; } };
  const estado = (t) => { $("estado").textContent = t; };
  const aviso = (t) => { $("aviso").textContent = t || ""; ver("aviso", !!t); };
  const pintar = (parcial) => {
    const vistas = SES ? lineas.slice(-8) : lineas;
    const t = vistas.join("\n") + (parcial ? (vistas.length ? "\n" : "") + parcial : "");
    $("texto").textContent = t;
    ver("texto", !!t);
    $("texto").scrollTop = $("texto").scrollHeight;
  };
  const respaldar = () => { if (!SES) local.poner({ ref: conf.ref, tipo: conf.tipo, inicio, fin: new Date().toISOString(), lineas }); };
  /* Cada frase con su hora; en una sesión, solo las últimas 2000 (al CRM van las últimas 80). */
  const anotar = (t) => {
    lineas.push(cap(t));
    tiempos.push(Date.now());
    if (SES && lineas.length > 2000) { lineas.splice(0, lineas.length - 2000); tiempos.splice(0, tiempos.length - 2000); }
  };
  const postJson = (url, d) => fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(d), credentials: "same-origin" });

  /* Lo último de la llamada va al CRM cada 2,5 segundos como mucho, una solicitud a la vez: ahí se ve
     lo que se dice y Claude sugiere qué responder. Si falla da lo mismo: la transcripción completa se
     manda al terminar, después de la última de estas (si no, la pisaría en el CRM). */
  const avance = { ultimo: 0, t: null, p: null, otra: false, enviado: false };
  function avisar() {
    if (!destino || !s) return;
    if (avance.p) { avance.otra = true; return; }
    const falta = 2500 - (Date.now() - avance.ultimo);
    if (falta > 0) { if (!avance.t) avance.t = setTimeout(() => { avance.t = null; avisar(); }, falta); return; }
    avance.ultimo = Date.now();
    avance.enviado = true;
    avance.p = postJson("/api/vivo-avance", { ref: destino, tipo: SES ? "sesion" : conf.tipo, inicio, lineas: lineas.slice(-ULTIMAS), tiempos: tiempos.slice(-ULTIMAS), parcial: s.parcial || "", total: lineas.length })
      .catch(() => {})
      .finally(() => { avance.p = null; if (avance.otra) { avance.otra = false; avisar(); } });
  }
  const esperarAvance = async () => { clearTimeout(avance.t); avance.t = null; avance.otra = false; try { if (avance.p) await avance.p; } catch (e) { /* da lo mismo */ } };
  /* En una sesión, la pausa y el cierre de la ventana se avisan al tiro, para que el CRM lo sepa. */
  function avisarEstado(cual, alSalir) {
    const d = { ref: destino, tipo: "sesion", estado: cual, inicio, lineas: lineas.slice(-ULTIMAS), tiempos: tiempos.slice(-ULTIMAS), parcial: "", total: lineas.length };
    if (alSalir) { try { navigator.sendBeacon("/api/vivo-avance", new Blob([JSON.stringify(d)], { type: "application/json" })); } catch (e) { /* se borra sola en una hora */ } return; }
    esperarAvance().then(() => postJson("/api/vivo-avance", d).catch(() => {}));
  }
  /* Si no se escuchó nada, igual avisa que terminó: así el CRM deja de mostrarla en curso. */
  async function terminarSinTexto() {
    const d = { ref: conf.ref, tipo: conf.tipo, inicio, fin: new Date().toISOString(), lineas: [] };
    avance.enviado = false;
    await esperarAvance();
    postJson("/api/vivo-guardar", d).catch(() => {});
  }

  function soltar(x) {
    clearInterval(x.reloj); clearTimeout(x.reinicio); clearTimeout(x.corte); clearTimeout(x.silencio);
    oir(false);
    if (x.lock) x.lock.release().catch(() => {});
  }
  function cerrar(x, falla) {
    if (s !== x) return;
    s = null;
    if (x.parcial) { anotar(x.parcial); x.parcial = ""; }
    soltar(x);
    clearTimeout(avance.t);
    avance.t = null;
    ver("vivo", false);
    ver("terminar", false);
    ver("volver-crm", false);
    $("reloj").textContent = "";
    pintar("");
    aviso(falla || "");
    if (SES) {
      estado(falla ? "Se detuvo" : "En pausa");
      $("empezar").textContent = "Seguir";
      ver("empezar", true);
      avisarEstado("pausada");
      return;
    }
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
    r.onstart = () => { if (s === x) estado(SES ? "Escuchando para el CRM" : "Escuchando"); };
    r.onsoundstart = () => { if (s === x) { clearTimeout(x.silencio); oir(true); } };
    r.onsoundend = () => { if (s === x) oir(false); };
    r.onresult = (e) => {
      if (s !== x) return;
      clearTimeout(x.silencio);
      oir(true);
      x.silencio = setTimeout(() => oir(false), 1500);
      let parcial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const t = String((res[0] && res[0].transcript) || "").trim();
        if (!t) continue;
        if (res.isFinal) { x.fallasRed = 0; anotar(t); respaldar(); }
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
      x.falla = c === "not-allowed" || c === "service-not-allowed" ? SIN_PERMISO : c === "audio-capture" ? "No se pudo usar el micrófono. Revisa que esté conectado y que otra aplicación no lo esté usando." : SIN_SERVICIO;
    };
    /* Chrome corta la sesión tras un silencio largo o un problema de red: se retoma sola. */
    r.onend = () => {
      if (s !== x) return;
      oir(false);
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

  async function empezar() {
    if (s) return;
    aviso("");
    ver("hecho", false);
    ver("fallo", false);
    ver("respaldo", false);
    if (!SR) { aviso("Este navegador no transcribe en vivo. Abre esta página en Google Chrome o Microsoft Edge."); return; }
    const x = { quiere: true, lang: "es-CL", fallasRed: 0, parcial: "", falla: "" };
    s = x;
    /* En una sesión, lo anterior se queda: el CRM separa cada llamada por la hora de sus frases. */
    if (!SES) { lineas = []; tiempos = []; }
    pintar("");
    ver("empezar", false);
    estado("Pidiendo el micrófono… Si Chrome pregunta, toca «Permitir».");
    /* El micrófono lo abre solo el reconocimiento de voz: con otra captura abierta (getUserMedia para un
       medidor, que además puede bajar el volumen de entrada del sistema), Chrome oía mucho menos que la
       demo de Google, que no la tiene. La barra se mueve con el sonido que detecta el reconocimiento. */
    try { if (navigator.wakeLock) x.lock = await navigator.wakeLock.request("screen"); } catch (e) { x.lock = null; }
    if (s !== x) { soltar(x); return; }
    if (!SES || !inicio) inicio = new Date().toISOString();
    const t0 = Date.now();
    /* El reloj y, cada 30 segundos sin novedades, un aviso al CRM de que sigue escuchando. */
    x.reloj = setInterval(() => {
      $("reloj").textContent = mmss(Math.round((Date.now() - t0) / 1000));
      if (Date.now() - avance.ultimo > 30000) avisar();
    }, 1000);
    ver("vivo", true);
    ver("terminar", true);
    ver("volver-crm", !!destino);
    $("terminar").disabled = false;
    /* «Escuchando» lo pone onstart, cuando Chrome ya tiene el permiso y empezó a oír. */
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
  window.addEventListener("beforeunload", (e) => { if (s) { e.preventDefault(); e.returnValue = ""; } });
  if (SES) {
    window.addEventListener("pagehide", () => { if (avance.enviado) avisarEstado("terminada", true); });
    if (!SR) { aviso("Este navegador no transcribe en vivo. Abre esta página en Google Chrome o Microsoft Edge."); $("empezar").disabled = true; }
    return;
  }
  $("copiar").addEventListener("click", copiar);
  $("copiar2").addEventListener("click", copiar);
  $("reintentar").addEventListener("click", () => { if (ultima) mandar(ultima); });
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
