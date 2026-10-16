# CRM de ZH Development

CRM interno de ZH: sigue a los leads desde el primer contacto (a quién hay que llamar, a quién ya
llamamos y qué quedó pendiente) y, cuando se ganan, el trabajo con el cliente: proyectos, cobros,
mantenciones y soporte. Claude redacta los correos y los WhatsApp, y los deja como borradores para
revisarlos antes de enviarlos.

- **Dónde está:** https://claude.ai/artifact/N794eV9P45xRM4VJ6BL5vL (privado; para que Nicolás
  pueda editarlo hay que compartirlo con él como editor desde el menú Compartir).
- **Código:** `crm/index.html` (una sola página: HTML, CSS y JS, con Preact + htm desde cdnjs).
- **Datos:** viven en la base de datos del artifact en claude.ai, **no en este repositorio**, que
  es público. Nunca se suben al repo leads, clientes, teléfonos, correos, RUT, facturas, montos ni
  transcripciones.

## Qué hace

| Sección | Para qué |
|---|---|
| Hoy | Lo que toca hoy (y lo atrasado), los leads nuevos sin contactar, los que no tienen próxima acción, los borradores por revisar y la actividad reciente. Con clientes: pagos atrasados, cobros por facturar, hitos y garantías que terminan en los próximos 7 días, y el soporte abierto. |
| **Ventas** | |
| Leads | Tabla con búsqueda por nombre, empresa, correo o teléfono, y filtros por etapa, origen y responsable. |
| Embudo | Tablero por etapa; se arrastra una tarjeta para cambiarla de etapa. |
| **Clientes** | |
| Clientes | Lista de clientes con sus servicios (proyecto en curso, garantía, mantención), las solicitudes abiertas y lo que falta cobrar. |
| Proyectos | Tablero por las etapas de trabajo de ZH. |
| Soporte | Solicitudes de los clientes, con su cobertura: garantía, mantención o evolutivo. |
| Cobros | Anticipos, pagos por hito, evolutivos y mensualidades: por facturar, facturado, vencido y pagado. |
| Borradores | Correos y WhatsApp redactados con Claude o a mano, con vista previa y acciones de envío. |
| Ajustes | Firma de cada socio, WhatsApp de negocios, enlace para agendar, cuenta de Gmail, garantía y plazo de pago por defecto, exportación. |

**Ficha del lead** (se abre al tocar un lead): teléfono y correo con copiar, llamar y WhatsApp;
próxima acción con atajos (hoy, mañana, en 3 días hábiles, en una semana); y tres herramientas:

- **Registrar llamada:** resultado (contestó, no contestó, buzón, ocupado, pidió que llamemos
  después, número equivocado), línea (negocios o personal), duración, notas y transcripción
  (en vivo desde el computador, pegada o subida como `.txt`, `.vtt` o `.srt`). «Analizar con
  Claude» devuelve el resumen, las necesidades, las objeciones, las tareas acordadas y, con
  transcripción, el puntaje de la llamada, y propone etapa, próxima acción, datos nuevos (por
  ejemplo, el cargo) y los borradores de lo acordado para aplicarlos al guardar (ver «Llamadas y
  transcripción»). Si no contesta,
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

## Etapa con clientes

Sigue las políticas de `propuestaszh`: pagos por hitos (P-013), las etapas de trabajo de ZH
(P-014) y la diferencia entre garantía, mantención técnica y desarrollo evolutivo (P-007).

**De lead a cliente.** Al pasar un lead a «Ganado» se abre «Convertir en cliente»: crea el cliente
(o suma el lead a uno existente) con el lead como contacto principal, el proyecto con el valor del
lead, el calendario de pagos (30/40/30, 50/50, 40/60, un solo pago o definir después; el último
cobro absorbe el redondeo) y, si se quiere, la mantención mensual. Un lead que ya estaba ganado
muestra «Convertir en cliente» en su ficha.

**Ficha del cliente.** Pestañas Resumen, Proyectos, Soporte, Cobros e Historial. Guarda los datos de
facturación (razón social, RUT, giro, dirección, ciudad, correo de facturación), los contactos con
su rol (decide, usuario, facturación, técnico) y uno principal, el responsable y el trato. Desde
la ficha:

- **Redactar para el cliente** (correo o WhatsApp), con objetivos: avance del proyecto, entrega y
  garantía, recordatorio de pago, respuesta a una solicitud, coordinar reunión, pedir opinión,
  mantención u otro. Claude recibe los datos del cliente, el proyecto (etapa, hitos y garantía),
  el cobro (factura, vencimiento y total con IVA), la solicitud y el historial.
- **Registrar reunión con acta:** se pegan o se dictan las notas y Claude arma el acta (resumen,
  acuerdos, pendientes de ZH y del cliente, próxima reunión) y propone las solicitudes que
  salieron, para crearlas con un clic.

**Proyectos.** Tablero por etapa: Por iniciar, Entender, Diseñar, Construir, Probar y Mejorar (en
producción, en garantía); Cerrado, En pausa y Cancelado se ven con «Mostrar cerrados». Cada
proyecto tiene fechas (inicio, entrega estimada, puesta en producción), hitos con fecha, enlaces
(repositorio, Figma, documentos), alcance, el caso en `propuestaszh` y sus cobros. Al pasar a
«Mejorar» se fija la puesta en producción (hoy, si no tenía) y empieza a correr la garantía:
60 días por defecto (P-007 dice de 30 a 60), configurable por proyecto y en Ajustes.

**Cobros.** Montos en CLP sin IVA; la página muestra también el total con IVA (19 %). Estados:
Por facturar → Facturado (n° de factura, fecha y vencimiento; si el vencimiento queda vacío, se
usa el plazo de pago de Ajustes, 30 días por defecto) → Pagado (fecha del pago), o Anulado. La
vista agrupa por mes (lo facturado, por su vencimiento), destaca lo vencido y tiene «Recordar»
para que Claude redacte el recordatorio de pago; al marcarlo como enviado queda la fecha del
último recordatorio en el cobro.

**Mantenciones.** Plan, monto mensual sin IVA, qué incluye, desde cuándo, día de cobro (1 a 28) y
estado (activa, pausada o terminada). Al abrir el CRM, cada mantención activa crea sola la
mensualidad del mes en Cobros, con un id fijo para que no se duplique aunque dos socios lo abran
a la vez. Si un mes no se cobra, la mensualidad se **anula** (si se borrara, se volvería a crear).

**Soporte.** Cada solicitud tiene cobertura:

- **Garantía:** error atribuible al desarrollo, dentro del plazo de garantía. Se corrige sin costo.
- **Mantención:** mantener el sistema funcionando, seguro y respaldado, y el soporte básico. Lo cubre
  la mensualidad.
- **Evolutivo:** cambio, mejora o funcionalidad nueva. Se cotiza aparte.
- **Por definir:** falta información.

«Clasificar con Claude» propone cobertura, tipo, prioridad, pasos, preguntas para el cliente y una
respuesta que queda como borrador. Un evolutivo lleva su cotización (por enviar, enviada,
aprobada, rechazada) y, al aprobarse, crea su cobro. Estados: Nueva, En curso, Esperando al
cliente, Resuelta y Descartada.

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
Ctrl+V y se envía. Después, **«Marcar como enviado»** lo registra en el historial (del lead o del
cliente) y, en un lead, si se quiere, programa una llamada de seguimiento a los 3 días hábiles.
«Copiar HTML» entrega el documento completo para usarlo en otra herramienta (por ejemplo, Resend).

## WhatsApp

«Abrir en WhatsApp» abre `wa.me` (o WhatsApp Web, según Ajustes) con el número del lead o del
contacto del cliente y el texto listo; se revisa y se envía desde WhatsApp. El mensaje sale de la
cuenta de WhatsApp que esté abierta en ese dispositivo, así que en el computador conviene tener
WhatsApp Web o la app de escritorio con la sesión de **WhatsApp Business del número de
negocios**. Ver `docs/crm-telefonia-whatsapp.md`.

## Llamadas y transcripción

Ningún celular deja que otra app grabe una llamada, así que el CRM la escucha desde el computador:

1. En el computador, abre la ficha del lead → «Registrar llamada» → **«Transcribir en vivo»** y
   permite el micrófono.
2. Llama desde el celular en altavoz, con el celular junto al computador.
3. Al cortar, «Detener». El texto queda en «Transcripción», una línea por frase, y «Analizar con
   Claude» lo ordena (Claude sabe que no separa quién habla).

Funciona en Chrome o Edge, que pasan la voz a texto con su servicio de voz (Google o Microsoft);
el audio no se guarda, solo el texto, y por defecto tampoco la transcripción completa: quedan las
notas y el análisis. Si Chrome corta la escucha tras un silencio, se retoma sola. Lo que se va
transcribiendo queda en el navegador hasta guardar la llamada, por si se cierra la ficha. Lo mismo
sirve para las reuniones con leads («Otro registro» → Reunión) y con clientes («Registrar» →
Reunión o Llamada).

Si claude.ai o el navegador no dejan usar el micrófono, el CRM lo dice y muestra el plan B: la
escritura por voz de Google Docs, pegando el texto al final. Cada intento deja su resultado en
`diagnostico/microfono-<usuario>` de la base, para revisarlo sin capturas de pantalla.

También se puede dictar las notas justo al cortar (micrófono del teclado del teléfono) o pegar una
transcripción hecha en otra herramienta. Las demás opciones, sus costos y lo legal están en
`docs/crm-telefonia-whatsapp.md`.

### Apoyo en vivo

Mientras el CRM escucha una llamada con un lead, aparece **«¿Qué le respondo?»**. Cada toque manda
a Claude Haiku (`claude-haiku-5-5`, el modelo rápido, sin caché) lo último de la transcripción y los
datos del lead, y en uno o dos segundos muestra qué decir ahora, qué preguntar después y qué evitar.
Claude solo se consulta cuando alguien toca el botón: la plataforma no permite llamarlo en bucle ni
con temporizador. Lo que sí corre solo, en la página y sin Claude, es la detección de objeciones
(precio, postergar, «ya tenemos algo», «mándame información», dudas de confianza): destaca el botón
y dice de qué se trata.

### Al cortar: tareas y puntaje

«Analizar con Claude» devuelve, además del resumen:

- **Las tareas acordadas**, de ZH y del lead, con fecha si se dijo. Los correos y WhatsApp que quedó
  en mandar ZH se pueden dejar redactados: al guardar, Claude los escribe en segundo plano (aunque se
  cierre la ficha) y quedan en «Borradores por revisar», con lo que quedó en hacer el lead. La
  primera tarea de ZH es la próxima acción.
- **El desempeño de quien llamó**, solo si hay transcripción: nota de 1 a 5 en apertura,
  descubrimiento, escucha, propuesta de valor, objeciones y cierre, con un comentario por criterio,
  lo que salió bien y qué mejorar. El puntaje lo calcula la página (promedio × 20, de 20 a 100) para
  que se pueda comparar entre llamadas. Queda en el historial, y en Hoy cada socio ve el promedio de
  sus llamadas de los últimos 30 días.

Todo esto usa el plan de Claude de quien abre el CRM: no tiene costo aparte.

## Datos

Colecciones de la base del artifact (documentos JSON). Montos en CLP sin IVA, enteros; fechas de
calendario `AAAA-MM-DD` en hora de Chile; marcas de tiempo en ISO.

| Colección | Documento | Campos principales |
|---|---|---|
| `leads` | un lead | `nombre`, `empresa`, `cargo`, `telefono` (E.164, `+569…`), `correo`, `sitio`, `rubro`, `ciudad`, `origen` (`web`, `agenda`, `instagram`, `linkedin`, `referido`, `evento`, `prospeccion`, `otro`), `etapa` (`nuevo`, `contactado`, `reunion`, `propuesta`, `negociacion`, `ganado`, `perdido`, `pausa`), `prioridad` (`alta`, `media`, `baja`), `trato` (`tu`, `usted`), `necesidad`, `notas`, `responsable` (id de usuario), `proxima` (`{tipo, fecha AAAA-MM-DD, hora, nota}` o `null`), `intentos`, `ultimoContacto`, `ultimoIntento`, `motivoPerdida`, `noContactar`, `noContactarDesde`, `valor`, `caso` (id en `propuestaszh`), `clienteId` (si se convirtió), `creado`, `actualizado`, `creadoPor` |
| `clientes` | un cliente | `nombre`, `razonSocial`, `rut`, `giro`, `direccion`, `ciudad`, `correoFacturacion`, `sitio`, `rubro`, `contactos[]` (`{id, nombre, cargo, correo, telefono, rol, principal}`, con `rol` = `decisor`, `usuario`, `facturacion`, `tecnico` u `otro`), `responsable`, `trato`, `leadIds[]`, `estado` (`activo`, `archivado`), `notas` |
| `proyectos` | un proyecto | `clienteId`, `leadId`, `nombre`, `tipo` (`software`, `automatizacion`, `ia`, `web`, `procesos`, `consultoria`, `otro`), `valor`, `estado` (`por_iniciar`, `entender`, `disenar`, `construir`, `probar`, `mejorar`, `cerrado`, `pausado`, `cancelado`), `inicio`, `entregaEstimada`, `produccion` (desde aquí corre la garantía), `garantiaDias`, `cierre`, `hitos[]` (`{id, nombre, fecha, hecho, fechaHecho}`), `enlaces[]` (`{id, titulo, url}`), `caso`, `alcance`, `responsable`, `notas` |
| `cobros` | un cobro | `clienteId`, `proyectoId`, `mantencionId`, `solicitudId`, `tipo` (`anticipo`, `hito`, `cierre`, `mensualidad`, `evolutivo`, `otro`), `concepto`, `monto`, `fecha` (cuándo facturar), `estado` (`por_facturar`, `facturado`, `pagado`, `anulado`), `factura`, `fechaFactura`, `vence`, `fechaPago`, `notas`, `generado`, `ultimoRecordatorio`. Las mensualidades usan el id `cob-m-<id de la mantención>-<AAAA-MM>` |
| `mantenciones` | un plan mensual | `clienteId`, `proyectoId`, `plan`, `monto` (al mes), `incluye`, `inicio`, `diaCobro` (1-28), `estado` (`activa`, `pausada`, `terminada`), `fin`, `notas` |
| `solicitudes` | un pedido de un cliente | `clienteId`, `proyectoId`, `titulo`, `descripcion`, `canal` (`correo`, `whatsapp`, `llamada`, `reunion`, `otro`), `tipo` (`error`, `cambio`, `consulta`, `acceso`, `otro`), `cobertura` (`garantia`, `mantencion`, `evolutivo`, `por_definir`), `prioridad` (`alta`, `media`, `baja`), `estado` (`nueva`, `en_curso`, `esperando_cliente`, `resuelta`, `descartada`), `responsable`, `horasEstimadas`, `horasReales`, `cotizacion` (`{monto, estado, cobroId}`, con `estado` = `por_enviar`, `enviada`, `aprobada` o `rechazada`), `resolucion`, `analisis`, `resuelta` (ISO) |
| `actividades` | un contacto o cambio | `leadId` o `clienteId` (más `proyectoId`, `cobroId`, `solicitudId`), `tipo` (`llamada`, `whatsapp`, `correo`, `reunion`, `nota`, `etapa`, `cliente`, `proyecto`, `cobro`, `solicitud`), `fecha` (ISO), `autor`, `resultado`, `linea`, `duracion`, `resumen`, `transcripcion`, `grabacionAvisada`, `analisis`, `acta` (en reuniones con cliente: `{resumen, acuerdos[], pendientesZH[], pendientesCliente[], solicitudes[], proximaReunion}`), en llamadas `analisis` (`resumen`, `necesidades`, `objeciones`, `proxima`, `tareas[]` con `{quien: zh|lead, que, tipo, fecha}` y `evaluacion` con `{puntaje, criterios: {apertura, descubrimiento, escucha, valor, objeciones, cierre: {nota, comentario}}, bien[], mejorar[]}`), `accion` (en cobros y solicitudes), `de`, `a`, `borradorId` |
| `borradores` | un correo o WhatsApp | `leadId`, o `clienteId` con `contactoId`, `proyectoId`, `cobroId` y `solicitudId`; `canal` (`correo`, `whatsapp`), `estado` (`por_revisar`, `listo`, `enviado`, `descartado`), `objetivo` (a clientes: `avance`, `entrega`, `cobro`, `solicitud`, `reunion`, `feedback`, `mantencion`, `libre`), `instrucciones`, `firma` (id de usuario), `generadoPor`; correo: `plantilla` (`carta`, `destacado`), `asunto`, `preheader`, `etiqueta`, `titular`, `saludo`, `parrafos[]`, `puntos[]`, `cta {texto, url}`, `cierre`, `posdata`; WhatsApp: `texto` |
| `equipo` | uno por usuario (id `u_…`) | `nombre`, `cargo`, `telefono`, `correo` (la firma) |
| `diagnostico` | `microfono-<id de usuario>` | último resultado de «Transcribir en vivo»: `ok`, `paso`, `tipo`, `error`, `politica`, `enMarco`, `navegador`, `fecha` |
| `config` | `general` | `whatsappNegocios`, `agendaUrl`, `gmailCuenta`, `abrirWhatsapp` (`app`, `web`), `garantiaDias` (60 si no está), `plazoPago` (30 si no está) |

Borrar un cliente borra sus proyectos, cobros, mantenciones, solicitudes, borradores e historial
(sus leads quedan, sin el enlace). Borrar un proyecto borra sus cobros pendientes; lo pagado, las
mensualidades, la mantención y las solicitudes quedan en el cliente.

Ajustes → Datos exporta los leads y los cobros en CSV (separado por `;`, abre bien en Excel) y un
respaldo completo en JSON con todas las colecciones.

## Trabajar con Claude desde una conversación

En una sesión de Claude Code en este repositorio, la skill `.claude/skills/zh-crm` explica cómo
leer y escribir el CRM con la herramienta `ArtifactData`: cargar leads, registrar una llamada con
su análisis, dejar un correo o un WhatsApp en «Borradores por revisar», responder qué hay que
hacer hoy, convertir un lead ganado en cliente, registrar solicitudes, facturas y pagos, o armar
el acta de una reunión. Claude nunca envía nada: los borradores siempre quedan para que un socio
los revise.

## Desarrollo

```bash
python3 crm/dev/build_preview.py                    # arma crm/dev/preview.html con un window.claude simulado
NODE_PATH=$(npm root -g) node crm/dev/smoke.cjs     # leads, llamadas y borradores (capturas en crm/dev/shots)
NODE_PATH=$(npm root -g) node crm/dev/clientes.cjs  # etapa con clientes: lead ganado, proyecto, cobros, soporte, acta
NODE_PATH=$(npm root -g) node crm/dev/microfono.cjs # transcribir en vivo, con micrófono simulado
```

`crm/dev/mock-claude.js` imita `window.claude` (base de datos en memoria, Claude con respuestas
fijas, usuario y descargas) y, con `window.__MOCK_MIC`, el micrófono y el reconocimiento de voz. Para probar sin red, `VENDOR_DIR` apunta a una carpeta con
`preact.umd.min.js`, `hooks.umd.min.js` y `htm.umd.min.js` de cdnjs. Las pruebas usan datos
inventados.

Para publicar cambios se usa la herramienta Artifact de Claude con `file_path` = `crm/index.html`
y `url` = la del CRM (desde otra conversación, sin `url` se crearía un artifact nuevo). Las
capacidades declaradas son `db`, `user` (alcance `profile`), `sample` y `downloads`; al
republicar sin pasar `capabilities` se conservan.

## Próximos pasos posibles

- **Llamadas y WhatsApp desde el CRM (en pausa):** se está evaluando una central en la nube con
  número +56 9 y transcripción (Zadarma) o un teléfono Android que grabe las llamadas, y WhatsApp
  por la API de Meta; ver `docs/crm-telefonia-whatsapp.md`.
- **Enviar desde el CRM con el dominio de ZH:** completar la conexión del conector de Resend en
  claude.ai (ya está instalado, falta autorizarlo) y agregar un botón «Enviar» que use ese
  conector, sin claves en la página.
- **Leads de la web automáticos:** hoy el aviso del formulario y de la agenda llega por correo y
  se pega en «Importar» (Claude lo ordena). Para que entren solos hay que guardar cada envío de
  `api/contact.js` y `api/agenda.js` en un lugar que el CRM pueda leer.
