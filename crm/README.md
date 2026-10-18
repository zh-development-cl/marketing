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

El menú tiene **cinco secciones**: Hoy, Llamar, Leads, Clientes y Ajustes (en el teléfono, en la barra
de abajo). Hoy y Clientes tienen pestañas arriba del contenido. Leads y Clientes se ven en tabla o en
tablero y vuelven a lo último que se usó. El número junto a cada sección es lo que hay que hacer: en Hoy,
las tareas de hoy y los borradores por revisar; en Llamar, las llamadas de hoy; en Leads, los abiertos;
en Clientes, las solicitudes abiertas y los pagos vencidos.

| Sección | Para qué |
|---|---|
| **Hoy** | Tres pestañas: Para hoy, Borradores y Métricas. |
| Para hoy | **Una sola lista, «Lo que toca»**, en orden: las **reuniones transcritas** por registrar (ver «Reuniones transcritas»); lo atrasado; lo de hoy (las reuniones a su hora, las llamadas y lo demás), cada tarea con su círculo para completarla y su botón (llamar, revisar el borrador, agendar, «Unirse a Meet», «¿Se hizo?»); los borradores por revisar; lo de clientes que vence (pagos atrasados, cobros por facturar, hitos y garantías) y el soporte abierto; y los que **se están enfriando** (7 días o más en la misma etapa después de la reunión). Los **próximos 7 días** van plegados (se acuerda si los dejaste abiertos). Arriba, los **avisos** (la reunión de las próximas dos horas con su Meet, las invitaciones rechazadas y los pagos vencidos; ver «Avisos y recordatorios») y, si hay leads abiertos sin tarea, «Planificar la semana». Al lado, solo **Esta semana** (llamadas y reuniones agendadas contra la meta, y tu puntaje en llamadas), el **Calendario** de `contacto@zhdevelopment.cl` y la actividad reciente. El filtro de arriba muestra lo de Lorenzo o lo de Nicolás. |
| Borradores | Correos y WhatsApp redactados con Claude o a mano, con vista previa y acciones de envío. |
| Métricas | El embudo de hoy con su valor y el pronóstico ponderado por etapa; en el período elegido (7, 30 o 90 días, o 12 meses): llamadas y cuántas contestaron, reuniones, ganados, hasta dónde llegaron los leads nuevos, por qué se perdieron, la actividad de cada socio, el puntaje de las llamadas por criterio (y dónde mejorar) y, con clientes, lo vencido, lo por cobrar en 30 días y lo pagado. **Resumen con Claude**: para la reunión de los socios, un titular, lo que va bien, lo que preocupa y tres acciones para la próxima semana, solo con los datos del CRM (se puede copiar). |
| **Llamar** | Las llamadas de hoy, una tras otra: primero las tareas de llamar atrasadas y de hoy, después los leads nuevos sin tarea (prioridad alta primero), solo con teléfono. Cada una muestra el teléfono grande, la tarea, el dolor, cómo ayudamos, el guion y los últimos contactos; «Contestó: registrar» abre el registro de la llamada (con «Transcribir en vivo»), «No contestó» deja el intento y el paso que sigue, «Pidió otro día» deja la llamada para el día y la hora que pidió, y al terminar pasa sola a la siguiente. «Saltar», la lista «Después» y el filtro por socio. En el teléfono está en la barra de abajo. |
| **Leads** | Tabla con búsqueda por nombre, empresa, correo o teléfono, y filtros por etapa, origen y responsable. «Tabla / Tablero» cambia al embudo: un tablero por etapa, al estilo de HubSpot, donde las tarjetas se arrastran de una etapa a otra, hasta «Ganado» (ver «Embudo de leads»). Con la casilla de cada fila se eligen varios para asignarlos a un socio, moverlos a Por contactar, Contactado, En pausa o Perdido (con su motivo) o agregarles una tarea. |
| **Clientes** | Cuatro pestañas: Clientes, Proyectos, Soporte y Cobros. |
| Clientes | Lista de clientes con su etapa, sus servicios (proyecto en curso, garantía, mantención), las solicitudes abiertas y lo que falta cobrar. «Tabla / Tablero» cambia al embudo de clientes: por iniciar, en desarrollo, en garantía, con mantención, nueva propuesta y sin servicio (ver «Embudo de clientes»). |
| Proyectos | Tablero por las etapas de trabajo de ZH. |
| Soporte | Solicitudes de los clientes, con su cobertura: garantía, mantención o evolutivo. |
| Cobros | Anticipos, pagos por hito, evolutivos y mensualidades: por facturar, facturado, vencido y pagado. |
| **Ajustes** | Firma de cada socio, metas de la semana (llamadas y reuniones agendadas por socio), avisos de este navegador (recordatorios en pantalla y sonido), WhatsApp de la empresa (opcional: si no está, cada firma usa el teléfono de su socio), enlace para agendar, cuenta de Google de ZH (`contacto@zhdevelopment.cl`: su calendario es el que lee y escribe el CRM, y Gmail se abre en ella), correos del equipo (se invitan a las reuniones y nunca se confunden con un lead), estado de Google Calendar, garantía y plazo de pago por defecto, exportación. |

**Buscar** (⌘K o Ctrl+K, «/» o el botón «Buscar» del menú): leads, clientes, proyectos y acciones
(nuevo lead, importar, ir a una sección), por palabras sueltas, sin tildes o por los dígitos del
teléfono. Las flechas eligen y Enter abre; sin texto, muestra los leads con algo para hoy.

**Menús desplegables:** los filtros y las listas para elegir (etapa, responsable, orden, cliente…)
abren un menú con el diseño del CRM y no el del sistema: el título en los filtros, la marca en lo
elegido, el color de cada etapa, la inicial de cada socio y, en las listas de 12 opciones o más, un
buscador. Se usan con el mouse (también apretando, deslizando y soltando) o con el teclado:
flechas, Enter, Escape o las primeras letras. Un clic afuera solo cierra el menú. En el teléfono
queda el selector del sistema, que ahí es más cómodo.

**Aspecto y movimiento:** el menú lateral va sobre el mismo papel que la página (en modo oscuro,
sobre la tinta) y la sección elegida queda como una pastilla blanca; el contenido va en paneles
blancos con bordes y sombras leves. Cada vista entra con un fundido corto y las tarjetas de los
tableros aparecen escalonadas. La ficha es una hoja flotante que entra desde la derecha y sale más
rápido; las ventanas y los avisos aparecen y se desvanecen. La pastilla de los selectores (Tabla /
Tablero, socio, período) y la raya de las pestañas se deslizan a lo elegido, y los plegables se
abren con su alto. Si el sistema pide reducir el movimiento, no hay animaciones. En el teléfono, las
barras de arriba y de abajo son esmeriladas.

**Ficha del lead** (se abre al tocar un lead): arriba, la empresa, la persona, la etapa y quién lo
lleva. Después, **una tarjeta con lo de ahora**: «En qué va» y «Qué hacer», el teléfono y el correo
con copiar, llamar y WhatsApp, y los botones del resultado de una llamada. «En qué va» y «Qué hacer»
los escribe Claude (el modelo rápido) con el historial y quedan guardados en `resumenes`: se vuelven a
pedir solo cuando hay algo nuevo (un contacto, otra próxima tarea u otra etapa), o con «Actualizar».
Sin historial, o sin Claude, salen de los datos: el último contacto y la próxima tarea (y si está
atrasada). Los ganados y perdidos no la llevan. Luego **la propuesta**, si se envió (ver «Propuestas,
estancados, metas y archivos»); **las tareas** (ver «Tareas y flujo automático»); el dolor, cómo
ayudamos y el guion, plegables (abiertos mientras no hay reunión hecha); los borradores, **los
archivos** y el historial (lo último, con «Ver los N» para todo); y cuatro herramientas:

- **Registrar llamada:** se toca «Transcribir en vivo» (se abre ZH Reuniones en otra pestaña), se
  habla y al tocar «Terminar» la transcripción vuelve sola y **Claude arma el plan** (con notas en vez de grabación, «Armar el plan con Claude»): qué pasó, el resultado
  (contestó, no contestó, pidió que lo llamemos…), la etapa, la reunión si quedó una con día y
  hora, las tareas de ZH, lo que quedó en hacer el lead, los datos nuevos y el puntaje de la
  llamada. **Nada se guarda ni se agenda hasta confirmar:** todo se puede corregir (el texto, el
  resultado, la etapa, el día y la hora de la reunión, las tareas, agregar o quitar), y «Volver a
  armar» lo pide de nuevo. Al confirmar quedan la llamada con su análisis, la etapa, las tareas, la
  reunión (en el Google Calendar de la cuenta de ZH, con Meet, el lead y los correos del equipo de
  Ajustes invitados, y la confirmación por WhatsApp o correo si se pidió) y los borradores de los
  mensajes acordados; arriba de la ficha queda un resumen de lo que cambió. Si Claude propone
  cerrar el lead (Perdido, Ganado o En pausa), al confirmar se abre su ventana (el motivo, el
  cliente). Si no contesta, el plan trae la tarea de volver a llamar el día hábil siguiente. Sin
  Claude, o para anotar rápido, queda «Registrar a mano» (plegado): el resultado, la duración y las
  notas (ver «Llamadas: qué hacer según cómo salió»).
- **Registrar reunión:** igual que la llamada, para la reunión de descubrimiento o de seguimiento
  (por Meet o en persona): el plan deja el lead en «Reunión concretada» y trae las tareas, como
  enviar la propuesta o el resumen, y la próxima reunión si quedó una. Las reuniones por Meet se
  transcriben solas con TranscripTonic y llegan desde Hoy con la transcripción (ver «Reuniones
  transcritas»).
- **Redactar:** con Claude, canal (WhatsApp o correo), objetivo (primer contacto, seguimiento,
  agendar reunión, confirmar reunión, enviar propuesta, recordatorio, reactivar, agradecer u otro),
  trato (tú o usted), diseño del correo e instrucciones libres. Claude recibe los datos del lead y
  su historial, el contexto de ZH y las reglas de tono; no inventa precios, plazos ni casos.
- **Nota:** notas, o WhatsApp y correos mandados por fuera (cumplen la tarea de ese mensaje).

**El teléfono** de la ficha es el del lead: cada socio lo llama desde su celular (no hay una línea
de la empresa). En el computador, «Llamar» abre la app de teléfono si está enlazada con el
celular; si no, se marca a mano o se copia. Debajo, mientras el lead esté abierto, tres atajos:
**«No contestó»**, **«Pidió otro día»** y **«Me llamó y no contesté»** (ver «Llamadas: qué hacer
según cómo salió»).

**Responsables:** solo Lorenzo y Nicolás, en leads, clientes, proyectos y solicitudes. El CRM
reconoce quién lo abre por el nombre de su firma o de su perfil y lo propone al crear un lead; si no
lo reconoce, propone al último que se eligió.

**Dolor, cómo ayudamos y guion:** lo que suponemos que le duele al lead (hipótesis hasta que lo
confirme), el primer proyecto que le ofreceríamos y el guion de la llamada (qué decir, respuestas a
sus objeciones y el WhatsApp si no contesta), que en la ficha se abre en «Guion y preparación». Se
editan en «Datos del lead» y Claude los usa en el apoyo en vivo, el análisis de la llamada y los
borradores, sin afirmar el dolor como un hecho.

En «Datos del lead», **«Pidió no ser contactado»** deja registrada la fecha, saca al lead de las
listas de trabajo y bloquea llamar, escribir y redactar (ver `docs/crm-telefonia-whatsapp.md`).
Al registrar una llamada se guardan las notas y el análisis de Claude; la transcripción completa
se guarda solo si se marca esa opción.

Las etapas son: Por contactar → Contactado → **Reunión agendada** → **Reunión concretada** →
Propuesta enviada → Negociación, más Ganado, Perdido y En pausa. Un perdido lleva su motivo: **no
responde**, **mal timing**, **no hay fit** o **está con la competencia**, más lo que dijo, si se
tiene. (Lo que quedó guardado con la etapa antigua «Reunión» se lee como «Reunión agendada».)

## Tareas y flujo automático

Cada lead tiene sus **tareas**: llamar, WhatsApp, correo, agendar reunión, la reunión misma, enviar
propuesta u otra, con día, hora opcional y responsable. Salen solas de las llamadas y reuniones
(lo que quedó en hacer ZH), del «No contestó», de agendar una reunión y de los cambios de etapa; también
se agregan, editan o descartan a mano en la ficha. La primera pendiente es la «próxima acción» del
lead: se ve en su tarjeta y la página la copia en `proxima` para la tabla, el CSV y Claude.

Completar una tarea (el círculo, en la tarjeta del embudo, en Hoy o en la ficha) hace lo que
corresponde:

- **Agendar reunión** pide el día, la hora y la duración, con los **horarios libres** de ese día
  según el calendario (de 9 a 19) y un aviso si la hora choca con otro evento: crea el evento en
  Google Calendar con Meet (Google le manda la invitación al lead y al equipo), queda la tarea de
  la reunión unida al evento, el lead pasa a **Reunión agendada** y, si se pide, Claude deja
  redactada la confirmación por WhatsApp o correo, con el enlace de Meet, y una tarea para
  enviarla hoy (ver «Google Calendar»). Las demás tareas de agendar del lead quedan hechas.
- **Recordatorio:** cada reunión con un lead que tiene teléfono deja una tarea de WhatsApp para el
  día hábil anterior, con el mensaje listo (día, hora y enlace de Meet, de tú o de usted):
  «Enviar por WhatsApp» abre el chat con el texto escrito y también se puede copiar. Se mueve si
  la reunión se mueve y se descarta si la reunión se cierra. Nunca se envía solo; se apaga en
  Ajustes → Google Calendar.
- **Preparar con Claude** (en la tarea de la reunión): el objetivo, la agenda con minutos, las
  preguntas, las señales de que hay proyecto, los riesgos con cómo responder y el cierre. Queda
  guardado en la tarea («Preparación de Claude»); Claude no propone precios.
- **La reunión**, pasada su hora, pregunta **«¿Se hizo?»**: «Sí» la da por hecha, pasa el lead a
  **Reunión concretada** y abre «Registrar reunión»; **«No se presentó»** anota la inasistencia y
  deja la tarea de escribirle hoy para reagendar (con el WhatsApp redactado por Claude, sin
  reproche) o, si se elige, lo pasa a Perdido con su motivo (a la segunda vez que no se presenta,
  propone esto último); «La cambiamos» le pone otro día (y mueve el evento); «No se hizo» la
  descarta y deja la tarea de reagendarla. Las tarjetas avisan «No se presentó» cuando ya pasó.
- **Enviar propuesta** pide el monto (sin IVA), el día en que se envió, el enlace al documento o
  el PDF y cuándo hacer el seguimiento (en 3 días hábiles, en una semana, otro día o sin
  seguimiento): el lead pasa a **Propuesta enviada**, el monto pasa a ser su valor, el PDF queda en
  sus archivos y queda la llamada «Seguimiento de la propuesta» para quien lo lleva.
- **Llamar, WhatsApp, correo y otras** quedan hechas. Registrar una llamada cumple las tareas de
  llamar que vencían; marcar como enviado un borrador cumple la tarea a la que está unido.

Las que se completan con un clic se pueden **deshacer** desde el aviso. Arrastrar en el embudo
también mueve las tareas: soltar en «Reunión agendada» pide el día (o «Mover sin día»), en «Reunión
concretada» da por hecha la reunión y en «Propuesta enviada» pide los datos de la propuesta (o
«Solo mover», que la pasa sin datos y, si no tiene otra tarea, deja el seguimiento a los 3 días
hábiles). Al perder, ganar o pausar un lead, sus tareas pendientes quedan descartadas.

Lo automático nunca retrocede ni cierra un lead: si Claude cree que hay que pasarlo a Perdido o a
En pausa, lo sugiere en el resumen con un botón.

## Planificar la semana

Cuando hay leads abiertos sin tarea, Hoy y Leads muestran el aviso «N leads sin tarea · M sin
responsable» con el botón **«Planificar la semana»**. Se elige quién llama (los dos o uno), cuántas
llamadas por día hace cada uno (de partida, la meta de la semana dividida en 5; sin meta, 5) y desde
cuándo (hoy, el día hábil siguiente o el lunes). La vista previa muestra el plan día por día, con los
nombres, y en «Leads incluidos» se puede sacar alguno. Al agendar:

- Cada lead queda con su tarea de llamar para su día, sin hora: «Primera llamada» si está por
  contactar y «Retomar el contacto» si no.
- Solo días hábiles, sin pasar de las llamadas por día de cada uno y contando las que ya tenía.
- Primero los de prioridad alta, después los que ya tienen guion o dolor, y los más antiguos.
- Un lead sin responsable queda con quien lo llama; el de un socio sigue con él (si llama uno solo,
  los del otro no se incluyen). Los que no tienen teléfono o pidieron no ser contactados quedan fuera.
- Llamar en serie los va mostrando cada día.

## Google Calendar

El CRM usa el conector de Google Calendar de claude.ai (la capacidad `mcp` del artifact) con la
cuenta de ZH (`config/general.gmailCuenta`, `contacto@zhdevelopment.cl`). Cada persona que abre el
CRM usa su propio conector: la primera vez claude.ai le pide permiso para que el CRM use Google
Calendar, y su cuenta conectada tiene que tener acceso a ese calendario.

- **Lee** las reuniones de hoy a 60 días al abrir, cada 5 minutos y al volver a la pestaña.
- **Une cada reunión con su lead** por el correo de los invitados. Si el lead ya tiene una reunión
  ese día, la tarea queda unida al evento (y toma su hora); si no, se crea la tarea de la reunión,
  sus tareas de agendar quedan hechas y el lead pasa a **Reunión agendada** (también uno perdido o
  en pausa: volvió). Un ganado o uno que pidió no ser contactado no cambia. Para reuniones que ya
  terminaron no se crea nada.
- **Reservas de zhdevelopment.cl:** la agenda de la web (`api/agenda.js` en la landing) crea el
  evento con el título «Llamada de descubrimiento · Nombre (Empresa) · ZH Development». El CRM crea
  ese lead solo, con nombre, empresa, correo y, si vienen en la descripción, teléfono y mensaje;
  si ya existe uno con ese teléfono, usa ese.
- **Si el evento se mueve** en Google Calendar, la tarea se mueve con él y queda una nota en el
  historial. Si el lead **acepta o rechaza** la invitación, la tarea lo muestra («Confirmó la
  invitación», «Rechazó la invitación») y queda la nota; un rechazo avisa para buscar otro horario.
- **Agendar desde el CRM** crea el evento (`create_event`) con Meet, el lead y el equipo invitados;
  cambiar el día o la hora (en «Agendar», «La cambiamos» o editando la tarea) lo mueve
  (`update_event`) y Google les avisa a los invitados. Un evento que organizó otra cuenta no se
  mueve desde el CRM: el aviso dice que hay que moverlo allá. Una reunión sin evento tiene «Crear en
  Calendar».
- Si Google Calendar no confirma la creación, el CRM avisa que el evento pudo crearse igual y no lo
  repite solo; si aparece en el calendario, se une a la reunión.
- **Anotar en Google Calendar** (el botón del calendario con un «+»): cualquier otra tarea, el día
  de facturar o el vencimiento de un cobro, y un hito de un proyecto. Con hora queda de 15 minutos
  a esa hora; sin hora, de todo el día y sin ocupar la agenda. Se invita, sin mandarle correo, al
  socio que lo lleva (con el correo de su firma en Ajustes), así su Google Calendar le avisa en el
  teléfono aunque el CRM esté cerrado. Al crear una tarea con hora en la ficha, o la de llamar a
  quien pidió que lo llamemos otro día, viene marcada la casilla «Anotar en Google Calendar»; en
  «No contestó» viene sin marcar, para no llenar el calendario de intentos. Si después cambia el día, la hora o el
  título en el CRM, se cambia allá; al revés no: moverlo en Google Calendar no mueve la tarea. Lo
  anotado lleva en la descripción «Anotado desde el CRM de ZH Development.», y por eso nunca se toma
  por una reunión ni sale repetido en Hoy → Calendario.
- **Lo que no hace:** no borra eventos. Al descartar la reunión o una tarea anotada, o al perder o
  pausar el lead, el aviso recuerda borrarlo en Google Calendar.
- **Hoy → Calendario** muestra las reuniones con su lead, el botón de Meet el día de la reunión, la
  respuesta a la invitación y «Crear lead» para alguien de afuera que todavía no es lead. Sin
  permiso, sin conector o con la conexión vencida, el panel dice qué hacer en cada caso; sin la
  capacidad, el CRM funciona como antes (con «Agregar a Google Calendar», que abre el evento lleno).

`eventos/<id del evento>` recuerda a qué lead y tarea quedó unido cada evento, para no procesarlo
dos veces aunque haya dos personas con el CRM abierto (las tareas y leads que crea el calendario
usan ids fijos: `tar-cal-<id>` y `lead-web-<id>`).

## Reuniones transcritas (Google Meet)

**TranscripTonic**, una extensión gratis de Chrome, guarda los subtítulos de cada reunión de Google
Meet con el nombre de quien habla y, al terminar, se los manda al conector propio **ZH Reuniones**
(`reuniones/` en este repositorio, en Vercel), que los guarda 14 días. La puesta en marcha está en
`docs/reuniones-transcripcion.md`. No hace falta Google Workspace Business Standard ni grabar nada
desde el CRM, pero quien entra a la reunión tiene que tener la extensión en su Chrome:

- **Antes:** las reuniones con Meet de los próximos 14 días con un lead o un cliente (un invitado
  con el correo del lead o de un contacto del cliente) quedan anotadas en `meets/`, una por reunión
  y día, con su lead o cliente; las del equipo solo, no. No se llama al servidor. Con ZH Reuniones
  conectado, la invitación que crea el CRM dice que la reunión se transcribe (dilo también al
  empezar: Google no avisa).
- **Después:** las transcripciones que llegaron en los últimos 14 días (se leen al abrir y cada 10
  minutos) aparecen en Hoy, arriba de «Lo que toca», en **«Reuniones transcritas»**, unidas a su
  lead o cliente por la hora y el título: la reunión de `meets/` o del calendario que se cruza con
  la transcripción (con 20 minutos de margen), mejor si tiene el mismo título; si ninguna se cruza,
  una del mismo código de Meet o el mismo título (las que se repiten usan el mismo enlace). Dos
  copias de la misma reunión (Lorenzo y Nicolás con la extensión) se ven una vez, la más completa;
  las del equipo solo no se muestran.
- **Registrar** abre la ficha con la transcripción (`leer_transcripcion`) y Claude arma solo,
  sabiendo quién habla por ZH (los socios, la cuenta de ZH y «You», que es quien la guardó):
  - en un **lead**, el plan de siempre (qué pasó, etapa, tareas, la próxima reunión con Meet en el
    calendario de la cuenta de ZH y el equipo invitado, la confirmación); la reunión queda con su
    hora y duración reales y quién participó, y la tarea de esa reunión queda hecha (la del mismo
    Meet o la de ese día, nunca una futura);
  - en un **cliente**, el acta con las **tareas de ZH** (con día y responsable, editables) y la
    **próxima reunión**, que se crea en Google Calendar con Meet invitando al contacto principal y
    al equipo (sin calendario o sin hora, queda la tarea de agendarla).
  Nada se guarda hasta confirmar. La transcripción completa se guarda solo si se marca.
- **Asignar:** una transcripción que el CRM no reconoce se asigna a un lead o a un cliente con un
  buscador; si la unió a quien no era, «No es de aquí» abre el mismo buscador. **Descartar** (con
  «Deshacer») la saca de la lista, por ejemplo una reunión interna. Una reunión registrada o
  descartada no vuelve aunque llegue otra copia.
- **En vivo:** las llamadas y reuniones en persona transcritas con «Transcribir en vivo» (ver
  «Llamadas y transcripción») llegan por el mismo conector, con el lead o cliente desde cuya ficha
  se abrió la página (`ref`): se unen a ese, sin cruzarlas con el calendario, y sin él quedan sin
  asociar. Con alguna llamada, el grupo de Hoy se llama «Reuniones y llamadas transcritas».
- **Ajustes → Transcripción de reuniones** dice si está conectado (cuántas transcripciones llegaron)
  y, si no, qué hacer: agregar el conector, «Permitir ZH Reuniones», dejar las herramientas en
  «Permitir siempre» o revisar el almacén del servidor en Vercel.

Las tareas de un cliente (las del acta) van con `clienteId` y sin `leadId`: se ven en Hoy (en «Lo
que toca», con el nombre del cliente) y en la ficha del cliente («Tareas de ZH»), y el círculo las
marca como hechas, con «Deshacer».

## Avisos y recordatorios

Todo esto sale mientras el CRM está abierto; no se mandan correos. Para que el teléfono avise con
el CRM cerrado, se anota en Google Calendar (ver arriba).

- **Avisos en Hoy:** arriba, la reunión de las próximas dos horas (o la que está en curso) con
  «Unirse a Meet», las invitaciones que un lead rechazó con «Reagendar» y los pagos vencidos con
  «Ver». Las tareas con hora tienen su recordatorio y, si pasó la hora, quedan en rojo en Tareas.
- **Recordatorios en pantalla:** en cualquier sección, 10 minutos antes de cada reunión y a la hora
  de cada tarea con hora (las de quien abre el CRM y las sin responsable), con el botón que toca
  (Meet, llamar, WhatsApp o abrir la ficha), «En 10 min» y cerrar. En el computador salen abajo a
  la derecha; en el teléfono, arriba. Suena una campana corta cuando aparece uno con el CRM ya
  abierto. Cada uno sale una vez: lo cerrado o pospuesto se recuerda en ese navegador.
- **Ajustes → Avisos:** apagar los recordatorios o el sonido. Es de cada navegador; no se guarda en
  la base.

## Embudo de leads

- **Columnas:** cada etapa es un carril con su color (una franja arriba y el fondo apenas teñido)
  y cuántos leads tiene. Las seis etapas abiertas van una al lado de la otra, con su total y su
  ponderado, y en la última columna, apiladas, las cerradas: **Ganado**, **Perdido** y **En pausa**,
  siempre a la vista, con su número junto al título, tarjetas cortas y lo último arriba. Si no
  caben, cada una cede alto según cuántas tarjetas tiene (Perdido, que suele ser la más larga, cede
  más) y el resto se desliza dentro; una cerrada sin leads deja solo su título.
- **Arrastrar:** con el mouse, se toma la tarjeta y se suelta en otra etapa; en el teléfono o la
  tablet, se mantiene apretada un momento y se arrastra (deslizar rápido sigue siendo scroll).
  Cerca de los bordes el tablero avanza solo y Escape cancela. Soltar en **Ganado** abre
  «Convertir en cliente» y en **Perdido** pide el motivo. Mientras se arrastra aparecen también
  abajo Perdido y En pausa, por si el tablero está corrido. Cada cambio queda en el historial del
  lead.
- **Ganados:** cada tarjeta dice a qué cliente pasó y en qué etapa va («Cliente · En desarrollo»,
  que abre su ficha), o trae «Convertir en cliente» si se marcó como ganado sin crearlo. La columna
  tiene el enlace al embudo de clientes.
- **Montos:** cada etapa abierta muestra su total y su valor ponderado, y la cabecera suma lo que
  está en juego. Probabilidad por etapa: Por contactar 5 %, Contactado 10 %, Reunión agendada 20 %, Reunión
  concretada 35 %, Propuesta enviada 50 %, Negociación 75 %.
- **Tarjetas:** la empresa y debajo la persona, valor, prioridad alta, la próxima tarea con su
  círculo para completarla (azul si es hoy, rojo si está atrasada, amarillo si hay que contar si se
  hizo la reunión; o «Sin tarea · agregar»), cuántas veces no contestó, desde los 7 días en la
  misma etapa «N d en la etapa» («Enviada hace N d» en una propuesta; amarillo desde 14, rojo desde
  21), última actividad, la inicial
  de quién lo lleva (un «+» punteado si no lo lleva nadie) y accesos a «No contestó», registrar
  llamada, WhatsApp y redactar. Tocando la inicial se cambia el responsable (Lorenzo, Nicolás o
  nadie) sin abrir la ficha.
- **No contestó:** el teléfono tachado abre la ventana que propone qué hacer según el intento (ver
  «Llamadas: qué hacer según cómo salió»); la tarjeta sigue en su etapa y cuenta las veces que no
  contestó.
- **Perdidos:** el carril muestra cuántos hay por motivo (los tres más comunes y «Otros») y cada
  tarjeta, su motivo y hace cuánto fue lo último. «Falta el motivo» abre la ventana para ponerlo.
- **Filtros:** búsqueda (sin importar tildes), responsable (todos, Lorenzo, Nicolás o sin
  responsable) y orden (próxima tarea, última actividad, valor, más tiempo en la etapa o más
  nuevos). Las etapas cerradas van siempre por lo último que pasó.

El menú lateral se contrae a solo íconos (el botón de abajo; por defecto en pantallas de menos de
1500 px) y así las siete columnas caben en una pantalla de 1360 px. Cada columna tiene el alto de la pantalla: se
ven las primeras tarjetas (unas tres) y el resto se desliza dentro de la columna; abajo, «N más ↓»
dice cuántas quedan y baja la lista. Si la tarjeta queda angosta, muestra solo las acciones de
llamar; redactar y anotar siguen en la ficha. Los tableros de clientes y de Proyectos funcionan
igual.

## Propuestas, estancados, metas y archivos

- **La propuesta en la ficha:** el monto con y sin IVA, hace cuántos días se envió, «Abrir el
  documento» y «Ver el PDF», y lo que respondió el cliente: «La aceptó» (pasa a Ganado y abre
  «Convertir en cliente»), «En negociación» o «No la aceptó» (pide el motivo). «Editar» cambia el
  monto, el enlace o el PDF sin mover la etapa.
- **Días en la etapa:** se cuentan desde el último cambio a esa etapa en el historial (en una
  propuesta, desde que se envió; en un lead nuevo, desde que llegó). Desde los 7 días se avisa en
  la tarjeta; **Estancados**, en Hoy, junta los de Reunión concretada, Propuesta enviada y
  Negociación que llevan 7 días o más, el más antiguo primero, con su próxima tarea.
- **Metas de la semana:** en Ajustes, cuántas llamadas y cuántas reuniones agendadas por socio y
  por semana. En Hoy, «Esta semana» muestra cuánto va de lunes a domingo (hora de Chile): las
  llamadas, por quién las registró, y las reuniones agendadas, por quién lleva el lead. Para todo
  el equipo la meta es la suma de los dos.
- **Archivos:** en la ficha del lead y en la pestaña «Archivos» del cliente: la propuesta, el
  contrato o lo que mande el cliente. PDF, imágenes (PNG, JPG, GIF, WebP, SVG) y texto (CSV,
  Markdown, JSON, TXT); los Word y Excel, guardados como PDF. Hasta 20 MB (2 MB los SVG). Se suben
  con «Subir» o arrastrándolos encima, se abren en una pestaña nueva y borrar pide confirmar (es
  definitivo). Solo quienes pueden editar el CRM suben y borran; quien lo ve sin poder editar,
  solo los abre. Viven con el artifact en claude.ai, no en este repositorio.

## Embudo de clientes

Después de «Ganado», cada cliente sigue en su propio embudo:

| Etapa | Qué significa |
|---|---|
| Por iniciar | Recién ganado: falta el anticipo o partir el proyecto. |
| En desarrollo | Proyecto en curso. |
| En garantía | En producción, dentro del plazo de garantía. |
| Con mantención | Mantención activa: ingreso todos los meses. |
| Nueva propuesta | Preparando o enviada otra propuesta: un evolutivo o un proyecto nuevo. |
| Sin servicio | Sin proyecto ni mantención: para reactivar. |

- **Automática o fija:** mientras nadie la mueva, la etapa sale de sus servicios: un proyecto por
  iniciar, uno en desarrollo, la garantía o la mantención activa. Al arrastrar la tarjeta la etapa
  queda fija; en la ficha del cliente, arriba, se cambia o se vuelve a «Automática».
- **Nueva propuesta:** al soltar ahí se anota qué le vamos a proponer y cuánto, más o menos. La
  tarjeta lo muestra y la columna suma lo propuesto. El caso comercial se arma en propuestaszh;
  cuando la ganen, el proyecto nuevo (desde la ficha del cliente o ganando un lead de ese cliente)
  devuelve al cliente a su etapa automática.
- **Tarjetas:** nombre, contacto principal, servicios (fase del proyecto, garantía, mantención),
  solicitudes abiertas, lo vencido, la inicial del responsable (se cambia tocándola) y atajos a
  «Registrar» y «Redactar con Claude».
- **Montos:** «Por iniciar» y «En desarrollo» suman sus proyectos; «Con mantención», lo que entra al
  mes; «Nueva propuesta», lo propuesto.
- **Filtros:** búsqueda, responsable e incluir archivados.

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
- **Registrar reunión con acta:** se pegan o se dictan las notas (o llega la transcripción de la
  reunión, desde Hoy) y Claude arma el acta (resumen, acuerdos, pendientes de ZH y del cliente, próxima
  reunión). Al guardar quedan las tareas de ZH (con día y responsable), la próxima reunión en Google
  Calendar con Meet y las solicitudes que salieron, cada cosa editable antes.

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
cuenta de WhatsApp que esté abierta en ese dispositivo: en el computador, WhatsApp Web o la app
de escritorio con la sesión de quien escribe. Ver `docs/crm-telefonia-whatsapp.md`.

## Llamadas: qué hacer según cómo salió

Cada socio llama desde su celular; el CRM muestra el número del lead y deja registrado lo que
pasó. Según cómo salió la llamada:

- **No contestó** (en la tarjeta del embudo, en la ficha o en Llamar en serie): una ventana corta
  que propone el paso que toca según el intento, con la secuencia a la vista:
  1. Primer intento: llamarlo el día hábil siguiente a otra hora del día (a las 16:00 si se
     llamó en la mañana; a las 10:00 si fue en la tarde).
  2. Segundo: escribirle hoy por WhatsApp (Claude lo deja redactado en Borradores, unido a la
     tarea) y, si no responde, llamarlo 2 días hábiles después.
  3. Tercero: un último llamado en una semana.
  4. Cuarto: cerrarlo como Perdido por «No responde» (es la acción principal; «Seguir
     intentando» deja otro llamado en una semana).

  Todo se puede cambiar: qué pasó (no contestó, buzón de voz u ocupado), cuándo (más tarde,
  mañana, en 2 días, en una semana, u otro día y hora) y si se llama o se escribe. La llamada
  queda en el historial, suma el intento, cumple la tarea de llamar que tocaba y deja la nueva;
  la tarjeta sigue en su etapa. Desde el tercer intento también se puede pasar a Perdido.
- **Pidió que lo llamemos otro día** («llámame el lunes a las 10»): «Pidió otro día», en la ficha
  y en Llamar en serie, pide el día (atajos «Mañana», «En 2 días», «El lunes» y «En una
  semana») y la hora (10:00 por defecto, con las horas frecuentes a un toque). La llamada queda
  en el historial como «Pidió que llamemos después», se cumple la tarea de llamar de hoy, un lead
  por contactar pasa a Contactado y queda la tarea «Volver a llamar (lo pidió)», con su
  recordatorio en pantalla a esa hora y, si se deja marcado, en Google Calendar. Si se quiere,
  Claude redacta un WhatsApp corto que le confirma el día y la hora. Lo mismo pasa al marcar
  «Pidió que llamemos después» en «Registrar llamada».
- **Me llamó y no contesté:** en la ficha, deja una nota en el historial y la tarea «Devolverle
  la llamada» para dentro de 5 minutos, a cargo de quien la anota, con su recordatorio en
  pantalla.

## Llamadas y transcripción

Ningún celular deja que otra app grabe una llamada, así que se escucha desde el computador. Como
claude.ai no deja que el CRM use el micrófono, lo hace la página «Transcribir en vivo» de ZH
Reuniones (`reuniones/`, el mismo servidor que recibe las reuniones de Meet):

1. En el computador, abre la ficha del lead → «Registrar llamada» → **«Transcribir en vivo»**. Se
   abre ZH Reuniones en otra pestaña con el lead y el tipo (llamada o reunión). La primera vez en
   ese navegador pide la clave del equipo (dura 6 meses) y Chrome pide permiso para el micrófono.
2. Toca «Empezar» y llama desde el celular en altavoz, junto al computador.
3. Al cortar, «Terminar». La transcripción queda en ZH Reuniones para ese lead, una línea por
   frase. Al volver a la pestaña del CRM, la ficha la lee sola (sin caché) y Claude arma el plan de
   la llamada para confirmarlo o corregirlo (sabe que no separa quién habla). Si la ficha ya no
   estaba abierta, la llamada aparece en Hoy, en «Reuniones y llamadas transcritas», unida al lead:
   «Registrar» abre «Registrar llamada» con ella.

Funciona en Chrome o Edge, que pasan la voz a texto con su servicio de voz (Google o Microsoft).
El audio no se guarda, solo el texto, que ZH Reuniones borra a los 14 días; en el CRM, por defecto,
quedan las notas y el análisis, sin la transcripción completa. Si Chrome corta la escucha tras un
silencio, se retoma sola. Lo transcrito queda en ese navegador hasta mandarlo: si la pestaña se
cierra a medias, al volver ofrece mandarlo. Lo mismo sirve para las reuniones en persona con leads
(«Registrar reunión») y con clientes («Registrar» → Reunión o Llamada; en una reunión, Claude arma
el acta).

Sin ZH Reuniones conectado, «Transcribir en vivo» intenta usar el micrófono desde el CRM y, como
claude.ai no lo deja, muestra el plan B: la escritura por voz de Google Docs, pegando el texto al
final. Cada intento deja su resultado en `diagnostico/microfono-<usuario>` de la base, para
revisarlo sin capturas de pantalla. El «Apoyo en vivo» de abajo solo funciona cuando el CRM mismo
escucha (no con la página de ZH Reuniones).

También se puede dictar las notas justo al cortar (micrófono del teclado del teléfono) o pegar una
transcripción hecha en otra herramienta. Las demás opciones, sus costos y lo legal están en
`docs/crm-telefonia-whatsapp.md`.

### Apoyo en vivo

Mientras el CRM escucha una llamada con un lead, aparece **«¿Qué le respondo?»**. Cada toque manda
a Claude Haiku (`claude-haiku-5-5`, el modelo rápido, sin caché) lo último de la transcripción y los
datos del lead (con el dolor y cómo ayudamos), y en uno o dos segundos muestra qué decir ahora, qué preguntar después y qué evitar.
Claude solo se consulta cuando alguien toca el botón: la plataforma no permite llamarlo en bucle ni
con temporizador. Lo que sí corre solo, en la página y sin Claude, es la detección de objeciones
(precio, postergar, «ya tenemos algo», «mándame información», dudas de confianza): destaca el botón
y dice de qué se trata.

### Al cortar: tareas y puntaje

El análisis de Claude devuelve, además del resumen:

- **Las tareas acordadas**, de ZH y del lead, con día y hora si se dijeron, y **la reunión** si
  quedó con día (si quedaron en reunirse sin día, la tarea es «agendar»). Las de ZH quedan como
  tareas; las del lead, en el análisis. Los correos y WhatsApp que quedó en mandar ZH quedan
  redactados: Claude los escribe en segundo plano (aunque se cierre la ficha), unidos a su tarea y
  en «Borradores por revisar», con lo que quedó en hacer el lead.
- **La etapa:** con una reunión con día, «Reunión agendada»; después de una reunión, «Reunión
  concretada»; nunca hacia atrás.
- **El desempeño de quien llamó**, solo si hay transcripción: nota de 1 a 5 en apertura,
  descubrimiento, escucha, propuesta de valor, objeciones y cierre, con un comentario por criterio,
  lo que salió bien y qué mejorar. El puntaje lo calcula la página (promedio × 20, de 20 a 100) para
  que se pueda comparar entre llamadas. Queda en el historial, y en Hoy cada socio ve el promedio de
  sus llamadas de los últimos 30 días.

Todo esto usa el plan de Claude de quien abre el CRM: no tiene costo aparte y no usa una clave de
la API ni créditos de la Claude Platform (para usarlos haría falta un servidor propio, porque en
la página la clave quedaría a la vista).

## Datos

Colecciones de la base del artifact (documentos JSON). Montos en CLP sin IVA, enteros; fechas de
calendario `AAAA-MM-DD` en hora de Chile; marcas de tiempo en ISO. En todas las colecciones,
`responsable` es `lorenzo`, `nicolas` o `null`.

| Colección | Documento | Campos principales |
|---|---|---|
| `leads` | un lead | `nombre`, `empresa`, `cargo`, `telefono` (E.164, `+569…`), `correo`, `sitio`, `rubro`, `ciudad`, `origen` (`web`, `agenda`, `instagram`, `linkedin`, `referido`, `evento`, `prospeccion`, `otro`), `etapa` (`nuevo`, `contactado`, `reunion_agendada`, `reunion_concretada`, `propuesta`, `negociacion`, `ganado`, `perdido`, `pausa`; un `reunion` antiguo se lee como `reunion_agendada`), `prioridad` (`alta`, `media`, `baja`), `trato` (`tu`, `usted`), `necesidad` (lo que pide, confirmado), `dolor` (lo que suponemos), `comoAyudamos`, `guion`, `notas`, `responsable` (`lorenzo`, `nicolas` o `null`), `proxima` (copia de su primera tarea pendiente: `{tipo, fecha AAAA-MM-DD, hora, nota, tareaId}` o `null`; la página la pone al día sola, y una `proxima` sin `tareaId` se muestra como tarea), `intentos` (llamadas seguidas sin respuesta), `ultimoContacto`, `ultimoIntento`, `motivoPerdida` (`No responde`, `Mal timing`, `No hay fit`, `Está con la competencia`; vacío = falta; puede quedar un texto antiguo), `motivoDetalle` (lo que dijo), `inasistencias` (reuniones a las que no se presentó), `noContactar`, `noContactarDesde`, `valor`, `propuesta` (`{monto, fecha AAAA-MM-DD, enlace, archivo}`: lo enviado; `archivo` es el id del PDF), `archivos[]` (`{id, nombre, tipo, bytes, subido, por, etiqueta}`: `id` es el del archivo guardado en el artifact, que se abre en `/_blob/<id>`; `etiqueta` = `propuesta` o vacío), `caso` (id en `propuestaszh`), `clienteId` (si se convirtió), `creado`, `actualizado`, `creadoPor` |
| `tareas` | una tarea de un lead o de un cliente | `leadId` (o, en las de un cliente, `clienteId` y `proyectoId`, sin `leadId`: lo que quedó en hacer ZH en una reunión), `tipo` (`llamar`, `whatsapp`, `correo`, `agendar`, `reunion`, `propuesta`, `otro`), `titulo`, `nota` (detalle interno), `fecha` (`AAAA-MM-DD`), `hora` (`HH:MM` o vacío), `duracion` (minutos, en reuniones), `responsable`, `estado` (`pendiente`, `hecha`, `descartada`), `resultado` (en reuniones: `no_se_presento`), `hecha` (ISO), `hechaPor`, `origen` (`llamada`, `reunion`, `no_contesto`, `plan`, `agendar`, `etapa`, `borrador`, `manual`, `migracion`, `calendario`, `agenda_web`, `recordatorio`), `actividadId` (la llamada o reunión de la que salió o que la cumplió), `borradorId` (el mensaje redactado para ella), `mensaje` (en WhatsApp: el texto listo, como el del recordatorio), `reunionId` (en el recordatorio: la reunión; su id es `tar-rec-<id de la reunión>`), `preparacion` y `preparada` (en reuniones: la preparación de Claude y cuándo se hizo), `calendario` (en las que no son reuniones, si se anotó en Google Calendar: `{id, link, fecha, hora}` del evento), `evento` (en reuniones unidas a Google Calendar: `{id, link, meet, respuesta, actualizado, propio, organizador}`, con `respuesta` = `needsAction`, `accepted`, `declined` o `tentative` del lead y `propio` = si lo organiza la cuenta del calendario) |
| `eventos` | uno por evento de Google Calendar (id del evento) | `leadId`, `tareaId`, `inicio` (ISO), `evActualizado` (el `updated` del evento que se vio), `actualizado` |
| `meets` | una por reunión con Meet de un lead o un cliente y día (id = `<código de Meet>~<AAAA-MM-DD>`, como `abc-defg-hij~2026-10-20`), para unir las transcripciones | `codigo`, `eventoId`, `titulo`, `inicio`, `fin`, `leadId` o `clienteId` |
| `transcripciones` | una por transcripción ya registrada, descartada o repetida (id `tr-<id de la transcripción>`, como `tr-tt-mgv3k2a1-0a1b2c3d`) | `transcripcion` (el id de ZH Reuniones), `codigo`, `inicio`, `fin`, `reunion` (la reunión de ese día: `m:<id de meets>`, `e:<id del evento>` o `t:<título>~<día>`), `estado` (`registrada`, `descartada`, `repetida`: otra copia de una reunión ya registrada), `repetidaDe`, `leadId` o `clienteId`, `actividadId`, `por` |
| `clientes` | un cliente | `nombre`, `razonSocial`, `rut`, `giro`, `direccion`, `ciudad`, `correoFacturacion`, `sitio`, `rubro`, `contactos[]` (`{id, nombre, cargo, correo, telefono, rol, principal}`, con `rol` = `decisor`, `usuario`, `facturacion`, `tecnico` u `otro`), `responsable`, `trato`, `leadIds[]`, `estado` (`activo`, `archivado`), `etapa` (embudo de clientes: `inicio`, `desarrollo`, `garantia`, `mantencion`, `propuesta`, `sin_servicio`; vacío o `null` = automática, según sus servicios), `propuesta` (`{titulo, valor}` en «Nueva propuesta»), `archivos[]` (como en los leads), `notas` |
| `proyectos` | un proyecto | `clienteId`, `leadId`, `nombre`, `tipo` (`software`, `automatizacion`, `ia`, `web`, `procesos`, `consultoria`, `otro`), `valor`, `estado` (`por_iniciar`, `entender`, `disenar`, `construir`, `probar`, `mejorar`, `cerrado`, `pausado`, `cancelado`), `inicio`, `entregaEstimada`, `produccion` (desde aquí corre la garantía), `garantiaDias`, `cierre`, `hitos[]` (`{id, nombre, fecha, hecho, fechaHecho, calendario}`, con `calendario` = `{id, link, fecha, hora}` si se anotó), `enlaces[]` (`{id, titulo, url}`), `caso`, `alcance`, `responsable`, `notas` |
| `cobros` | un cobro | `clienteId`, `proyectoId`, `mantencionId`, `solicitudId`, `tipo` (`anticipo`, `hito`, `cierre`, `mensualidad`, `evolutivo`, `otro`), `concepto`, `monto`, `fecha` (cuándo facturar), `estado` (`por_facturar`, `facturado`, `pagado`, `anulado`), `factura`, `fechaFactura`, `vence`, `fechaPago`, `notas`, `generado`, `ultimoRecordatorio`, `calendario` (si se anotó: `{id, link, fecha, hora, que}`, con `que` = `facturar` o `vence`). Las mensualidades usan el id `cob-m-<id de la mantención>-<AAAA-MM>` |
| `mantenciones` | un plan mensual | `clienteId`, `proyectoId`, `plan`, `monto` (al mes), `incluye`, `inicio`, `diaCobro` (1-28), `estado` (`activa`, `pausada`, `terminada`), `fin`, `notas` |
| `solicitudes` | un pedido de un cliente | `clienteId`, `proyectoId`, `titulo`, `descripcion`, `canal` (`correo`, `whatsapp`, `llamada`, `reunion`, `otro`), `tipo` (`error`, `cambio`, `consulta`, `acceso`, `otro`), `cobertura` (`garantia`, `mantencion`, `evolutivo`, `por_definir`), `prioridad` (`alta`, `media`, `baja`), `estado` (`nueva`, `en_curso`, `esperando_cliente`, `resuelta`, `descartada`), `responsable`, `horasEstimadas`, `horasReales`, `cotizacion` (`{monto, estado, cobroId}`, con `estado` = `por_enviar`, `enviada`, `aprobada` o `rechazada`), `resolucion`, `analisis`, `resuelta` (ISO) |
| `actividades` | un contacto o cambio | `leadId` o `clienteId` (más `proyectoId`, `cobroId`, `solicitudId`), `tipo` (`llamada`, `whatsapp`, `correo`, `reunion`, `nota`, `etapa`, `cliente`, `proyecto`, `cobro`, `solicitud`), `fecha` (ISO; en una reunión de Meet, cuando empezó), `autor`, `resultado` (en llamadas: `contesto`, `no_contesto`, `buzon`, `ocupado`, `volver` = pidió que llamemos después, `equivocado`), `linea` (solo en llamadas antiguas: ya no se usa), `duracion`, `resumen`, `notas` (lo escrito, si no es el resumen), `transcripcion`, `meet` (en reuniones transcritas: `{codigo, transcripcion, doc, inicio, fin, participantes[]}`), `vivo` (en las transcritas con «Transcribir en vivo»: `{transcripcion, inicio, fin}`), `grabacionAvisada`, `analisis`, `acta` (en reuniones con cliente: `{resumen, acuerdos[], pendientesZH[], pendientesCliente[], solicitudes[], proximaReunion, proximaHora}`), en llamadas y reuniones con leads `analisis` (`resumen`, `necesidades`, `objeciones`, `etapaSugerida`, `reunion` (`{fecha, hora, duracion, titulo}` o `null`), `tareas[]` con `{quien: zh|lead, que, tipo, fecha, hora}` y `evaluacion` con `{puntaje, criterios: {apertura, descubrimiento, escucha, valor, objeciones, cierre: {nota, comentario}}, bien[], mejorar[]}`), `accion` (en cobros y solicitudes), `de`, `a`, `borradorId` |
| `borradores` | un correo o WhatsApp | `leadId`, o `clienteId` con `contactoId`, `proyectoId`, `cobroId` y `solicitudId`; `canal` (`correo`, `whatsapp`), `estado` (`por_revisar`, `listo`, `enviado`, `descartado`), `objetivo` (a clientes: `avance`, `entrega`, `cobro`, `solicitud`, `reunion`, `feedback`, `mantencion`, `libre`), `instrucciones`, `firma` (id de usuario), `generadoPor`, `tareaId` (la tarea que cumple al enviarse); correo: `plantilla` (`carta`, `destacado`), `asunto`, `preheader`, `etiqueta`, `titular`, `saludo`, `parrafos[]`, `puntos[]`, `cta {texto, url}`, `cierre`, `posdata`; WhatsApp: `texto` |
| `equipo` | uno por usuario (id `u_…`) | `nombre`, `cargo`, `telefono`, `correo` (la firma) |
| `diagnostico` | `microfono-<id de usuario>` | último resultado de «Transcribir en vivo»: `ok`, `paso`, `tipo`, `error`, `politica`, `enMarco`, `navegador`, `fecha` |
| `archivo` | un documento guardado | `titulo`, `ruta`, `rama`, `commit`, `contenido`, `guardado`, `nota`: copias de documentos que salieron del repositorio público por tener datos de contacto (por ejemplo, el playbook y los guiones de la prospección de octubre de 2026). No se ven en la página; entran en el respaldo JSON |
| `resumenes` | uno por lead (su id es el del lead) | `enQueVa`, `queHacer`, `firma` (el último contacto, la próxima tarea y la etapa con que se escribió: si cambian, se pide de nuevo), `creado`, `por`, `autor: "claude"`. Lo escribe la página; no hace falta tocarlo. |
| `config` | `general` | `whatsappNegocios`, `agendaUrl`, `gmailCuenta` (la cuenta de Google de ZH: `contacto@zhdevelopment.cl`, cuyo calendario usa el CRM), `correosEquipo` (lista de correos del equipo), `recordatorioReunion` (`false` apaga el recordatorio por WhatsApp; si no está, va prendido), `metas` (`{llamadas, reuniones}`: por socio y por semana; 0 o vacío = sin meta), `abrirWhatsapp` (`app`, `web`), `garantiaDias` (60 si no está), `plazoPago` (30 si no está) |

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
NODE_PATH=$(npm root -g) node crm/dev/envivo.cjs    # «Transcribir en vivo» con ZH Reuniones: el botón abre su página, la ficha espera y carga la transcripción, Hoy, el cliente y el plan B
NODE_PATH=$(npm root -g) node crm/dev/embudo.cjs    # embudos de leads y de clientes, y Proyectos: carriles, arrastrar (mouse y dedo), montos, filtros, responsables, no contestó y motivos de pérdida
NODE_PATH=$(npm root -g) node crm/dev/tareas.cjs    # tareas y flujo automático: grabar y guardar solo, agendar, ¿se hizo?, propuesta y deshacer, menú contraído
NODE_PATH=$(npm root -g) node crm/dev/calendario.cjs # Google Calendar: unir eventos con leads, reservas de la web, mover, invitaciones, crear y mover eventos, permisos
NODE_PATH=$(npm root -g) node crm/dev/mejoras.cjs   # buscar, llamar en serie, horarios libres, recordatorio, preparar con Claude, métricas, selección múltiple
NODE_PATH=$(npm root -g) node crm/dev/seguimiento.cjs # propuesta enviada, días en la etapa y estancados, archivos, metas, WhatsApp de «No contestó» y resumen con Claude
NODE_PATH=$(npm root -g) node crm/dev/ahora.cjs     # ficha ordenada («En qué va» y «Qué hacer» con Claude, guardado y al día) y Hoy como una sola lista
NODE_PATH=$(npm root -g) node crm/dev/plan.cjs      # menú de cinco secciones y pestañas, y «Planificar la semana»: reparto, llamadas por día, teléfono y oscuro
NODE_PATH=$(npm root -g) node crm/dev/menus.cjs     # menús desplegables: mouse, teclado, buscador, Escape y clic afuera, tarjetas, ventanas, teléfono y oscuro
NODE_PATH=$(npm root -g) node crm/dev/avisos.cjs    # avisos de Hoy, recordatorios en pantalla, anotar en Google Calendar tareas, cobros e hitos, y qué hacer según cómo salió la llamada
NODE_PATH=$(npm root -g) node crm/dev/registro.cjs  # el plan de Claude al registrar una llamada: editarlo, confirmar, la reunión en el calendario de ZH con Meet e invitados, no contestó y a mano
NODE_PATH=$(npm root -g) node crm/dev/reuniones.cjs # reuniones transcritas con ZH Reuniones: meets/, Hoy (unir por hora y título, juntar copias), el plan y el acta con la transcripción, tareas del cliente, asignar, descartar, Ajustes y permisos
```

`crm/dev/mock-claude.js` imita `window.claude` (base de datos en memoria, Claude con respuestas
fijas, usuario, descargas y archivos en memoria; `window.__MOCK_SIN_CLAUDE = true` simula una vista
sin Claude; `window.__MOCK_ASSETS` simula una vista sin
archivos o las fallas al subir; los recordatorios en pantalla dependen de la hora y vienen apagados
salvo con `window.__MOCK_RECORDATORIOS = true`), con `window.__MOCK_MIC` el micrófono y el reconocimiento de voz, y
con `window.__MOCK_MCP` el conector de Google Calendar (eventos con la forma de `list_events`,
`create_event` y `update_event`, y los casos sin permiso o sin conector) y con `window.__MOCK_REU`
el de ZH Reuniones (transcripciones y textos con la forma del servidor de `reuniones/`, sin permiso,
sin conector o sin el almacén del servidor). Las pruebas van a cada vista
por el menú, como una persona, con `irA(page, vista)` de `crm/dev/ir.cjs`. Al cerrarse, la ficha y
las ventanas quedan un momento en pantalla para la salida (dentro de `.capa.saliendo`, sin recibir
clics): después de cerrar una, las pruebas esperan a que se vaya (`waitFor({ state: "detached" })`)
antes de contar o tocar lo de la página; y después de abrir un plegable, a que aparezca lo de adentro.
Para probar sin red, `VENDOR_DIR` apunta a una carpeta con
`preact.umd.min.js`, `hooks.umd.min.js` y `htm.umd.min.js` de cdnjs. Las pruebas usan datos
inventados.

Para publicar cambios se usa la herramienta Artifact de Claude con `file_path` = `crm/index.html`
y `url` = la del CRM (desde otra conversación, sin `url` se crearía un artifact nuevo). Las
capacidades declaradas son `db`, `user` (alcance `profile`), `sample`, `downloads`, `assets` (los
archivos; solo para quienes pueden editar) y `mcp` con `Google Calendar` (`list_events`,
`create_event`, `update_event`) y `ZH Reuniones` (`transcripciones`, `leer_transcripcion`); al
republicar sin pasar `capabilities` se conservan. Si se pasan, hay que
repetirlas todas.

## Próximos pasos posibles

- **Gmail de `contacto@zhdevelopment.cl`:** con el conector de Gmail de claude.ai, el CRM podría
  mandar desde esa cuenta los correos ya revisados (hoy se copian y se abre Gmail) y ver las
  respuestas de los leads. El calendario ya está conectado (ver «Google Calendar»).
- **Llamadas y WhatsApp desde el CRM (en pausa):** se está evaluando una central en la nube con
  número +56 9 y transcripción (Zadarma) o un teléfono Android que grabe las llamadas, y WhatsApp
  por la API de Meta; ver `docs/crm-telefonia-whatsapp.md`.
- **Enviar desde el CRM con el dominio de ZH:** completar la conexión del conector de Resend en
  claude.ai (ya está instalado, falta autorizarlo) y agregar un botón «Enviar» que use ese
  conector, sin claves en la página.
- **Leads de la web automáticos:** hoy el aviso del formulario y de la agenda llega por correo y
  se pega en «Importar» (Claude lo ordena). Para que entren solos hay que guardar cada envío de
  `api/contact.js` y `api/agenda.js` en un lugar que el CRM pueda leer.
