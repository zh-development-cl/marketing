# CRM de ZH Development

CRM comercial liviano para seguir a los leads: a quién hay que llamar, a quién ya llamamos y qué
quedó pendiente. Claude redacta los correos y los WhatsApp, y los deja como borradores para
revisarlos antes de enviarlos.

- **Dónde está:** https://claude.ai/artifact/N794eV9P45xRM4VJ6BL5vL (privado; para que Nicolás
  pueda editarlo hay que compartirlo con él como editor desde el menú Compartir).
- **Código:** `crm/index.html` (una sola página: HTML, CSS y JS, con Preact + htm desde cdnjs).
- **Datos:** viven en la base de datos del artifact en claude.ai, **no en este repositorio**, que
  es público. Nunca se suben al repo leads, teléfonos, correos ni transcripciones.

## Qué hace

| Sección | Para qué |
|---|---|
| Hoy | Lo que toca hoy (y lo atrasado), los leads nuevos sin contactar, los que no tienen próxima acción, los borradores por revisar y la actividad reciente. |
| Leads | Tabla con búsqueda por nombre, empresa, correo o teléfono, y filtros por etapa, origen y responsable. |
| Embudo | Tablero por etapa; se arrastra una tarjeta para cambiarla de etapa. |
| Borradores | Correos y WhatsApp redactados con Claude o a mano, con vista previa y acciones de envío. |
| Ajustes | Firma de cada socio, WhatsApp de negocios, enlace para agendar, cuenta de Gmail, exportación. |

**Ficha del lead** (se abre al tocar un lead): teléfono y correo con copiar, llamar y WhatsApp;
próxima acción con atajos (hoy, mañana, en 3 días hábiles, en una semana); y tres herramientas:

- **Registrar llamada:** resultado (contestó, no contestó, buzón, ocupado, pidió que llamemos
  después, número equivocado), línea (negocios o personal), duración, notas y transcripción
  (pegada o subida como `.txt`, `.vtt` o `.srt`). «Analizar con Claude» devuelve el resumen, las
  necesidades, las objeciones, lo que prometimos y los próximos pasos, y propone etapa, próxima
  acción y datos nuevos (por ejemplo, el cargo) para aplicarlos al guardar. Si no contesta,
  propone volver a llamar al día hábil siguiente y, desde el segundo intento, escribir por WhatsApp.
- **Redactar con Claude:** canal (WhatsApp o correo), objetivo (primer contacto, seguimiento,
  agendar reunión, enviar propuesta, recordatorio, reactivar, agradecer u otro), trato (tú o
  usted), diseño del correo e instrucciones libres. Claude recibe los datos del lead y su
  historial, el contexto de ZH y las reglas de tono; no inventa precios, plazos ni casos.
- **Otro registro:** notas, WhatsApp o correos mandados por fuera y reuniones.

En «Datos del lead», **«Pidió no ser contactado»** deja registrada la fecha, saca al lead de las
listas de trabajo y bloquea llamar, escribir y redactar (ver `docs/crm-telefonia-whatsapp.md`).
Al registrar una llamada se guardan las notas y el análisis de Claude; la transcripción completa
se guarda solo si se marca esa opción.

Las etapas son: Por contactar → Contactado → Reunión → Propuesta enviada → Negociación, más
Ganado, Perdido (con motivo y lo que dijo el cliente) y En pausa.

## Correos

Claude escribe el contenido y la página lo arma con el diseño de ZH: el mismo sistema que los
correos de la agenda de la landing (`api/agenda.js` en el repo `landing`): tarjeta de 580 px sobre
papel, tablas y estilos en línea para Gmail y Outlook, fuentes del sistema, ícono alojado en
`zhdevelopment.cl/apple-touch-icon.png` y pie con los datos de la empresa. Hay dos plantillas:

- **Carta:** correo uno a uno, con logo, etiqueta, cuerpo, viñetas opcionales, un botón y la firma.
- **Con cabecera:** cabecera en tinta con etiqueta, titular, bajada y botón a todo el ancho (para
  propuestas, invitaciones o avisos).

Para enviar: **«Copiar y abrir Gmail»** copia el correo con el diseño y abre un correo nuevo con
el destinatario y el asunto (en la cuenta configurada en Ajustes); se pega el cuerpo con ⌘V o
Ctrl+V y se envía. Después, **«Marcar como enviado»** lo registra en el historial y, si se quiere,
programa una llamada de seguimiento a los 3 días hábiles. «Copiar HTML» entrega el documento
completo para usarlo en otra herramienta (por ejemplo, Resend).

## WhatsApp

«Abrir en WhatsApp» abre `wa.me` (o WhatsApp Web, según Ajustes) con el número del lead y el
texto listo; se revisa y se envía desde WhatsApp. El mensaje sale de la cuenta de WhatsApp que
esté abierta en ese dispositivo, así que en el computador conviene tener WhatsApp Web o la app de
escritorio con la sesión de **WhatsApp Business del número de negocios**. Ver
`docs/crm-telefonia-whatsapp.md`.

## Llamadas y transcripción

El CRM no graba llamadas. Lo práctico es dictar las notas justo al cortar (micrófono del teclado
del teléfono) y dejar que Claude las ordene; si hay una transcripción, se pega o se sube en
«Registrar llamada». Las opciones para transcribir sin aviso, sus costos y lo legal están en
`docs/crm-telefonia-whatsapp.md`.

## Datos

Colecciones de la base del artifact (documentos JSON):

| Colección | Documento | Campos principales |
|---|---|---|
| `leads` | un lead | `nombre`, `empresa`, `cargo`, `telefono` (E.164, `+569…`), `correo`, `sitio`, `rubro`, `ciudad`, `origen` (`web`, `agenda`, `instagram`, `linkedin`, `referido`, `evento`, `prospeccion`, `otro`), `etapa` (`nuevo`, `contactado`, `reunion`, `propuesta`, `negociacion`, `ganado`, `perdido`, `pausa`), `prioridad` (`alta`, `media`, `baja`), `trato` (`tu`, `usted`), `necesidad`, `notas`, `responsable` (id de usuario), `proxima` (`{tipo, fecha AAAA-MM-DD, hora, nota}` o `null`), `intentos`, `ultimoContacto`, `ultimoIntento`, `motivoPerdida`, `noContactar`, `noContactarDesde`, `valor` (CLP sin IVA), `caso` (id en `propuestaszh`), `creado`, `actualizado`, `creadoPor` |
| `actividades` | un contacto o cambio | `leadId`, `tipo` (`llamada`, `whatsapp`, `correo`, `reunion`, `nota`, `etapa`), `fecha` (ISO), `autor`, `resultado`, `linea`, `duracion`, `resumen`, `transcripcion`, `grabacionAvisada`, `analisis`, `de`, `a`, `borradorId` |
| `borradores` | un correo o WhatsApp | `leadId`, `canal` (`correo`, `whatsapp`), `estado` (`por_revisar`, `listo`, `enviado`, `descartado`), `objetivo`, `instrucciones`, `firma` (id de usuario), `generadoPor`; correo: `plantilla` (`carta`, `destacado`), `asunto`, `preheader`, `etiqueta`, `titular`, `saludo`, `parrafos[]`, `puntos[]`, `cta {texto, url}`, `cierre`, `posdata`; WhatsApp: `texto` |
| `equipo` | uno por usuario (id `u_…`) | `nombre`, `cargo`, `telefono`, `correo` (la firma) |
| `config` | `general` | `whatsappNegocios`, `agendaUrl`, `gmailCuenta`, `abrirWhatsapp` (`app`, `web`) |

Ajustes → Datos exporta los leads en CSV (separado por `;`, abre bien en Excel) y un respaldo
completo en JSON.

## Trabajar con Claude desde una conversación

En una sesión de Claude Code en este repositorio, la skill `.claude/skills/zh-crm` explica cómo
leer y escribir el CRM con la herramienta `ArtifactData`: cargar leads desde una lista o planilla,
registrar una llamada con su análisis, dejar un correo o un WhatsApp en «Borradores por revisar»
o responder qué hay que hacer hoy. Claude nunca envía nada: los borradores siempre quedan para
que un socio los revise.

## Desarrollo

```bash
python3 crm/dev/build_preview.py                 # arma crm/dev/preview.html con un window.claude simulado
NODE_PATH=$(npm root -g) node crm/dev/smoke.cjs  # prueba de humo con Playwright (capturas en crm/dev/shots)
```

`crm/dev/mock-claude.js` imita `window.claude` (base de datos en memoria, Claude con respuestas
fijas, usuario y descargas). Para probar sin red, `VENDOR_DIR` apunta a una carpeta con
`preact.umd.min.js`, `hooks.umd.min.js` y `htm.umd.min.js` de cdnjs.

Para publicar cambios se usa la herramienta Artifact de Claude con `file_path` = `crm/index.html`
y `url` = la del CRM (desde otra conversación, sin `url` se crearía un artifact nuevo). Las
capacidades declaradas son `db`, `user` (alcance `profile`), `sample` y `downloads`; al
republicar sin pasar `capabilities` se conservan.

## Próximos pasos posibles

- **Enviar desde el CRM con el dominio de ZH:** completar la conexión del conector de Resend en
  claude.ai (ya está instalado, falta autorizarlo) y agregar un botón «Enviar» que use ese
  conector, sin claves en la página.
- **Leads de la web automáticos:** hoy el aviso del formulario y de la agenda llega por correo y
  se pega en «Importar» (Claude lo ordena). Para que entren solos hay que guardar cada envío de
  `api/contact.js` y `api/agenda.js` en un lugar que el CRM pueda leer.
- **Llamadas con transcripción automática:** central telefónica en la nube o Twilio; ver
  `docs/crm-telefonia-whatsapp.md`.
