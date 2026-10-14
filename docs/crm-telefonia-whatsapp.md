# Llamadas y WhatsApp para el CRM

Investigación al 14-10-2026, con fuentes al final. Lo que no se pudo confirmar dice **por
confirmar**. La parte legal resume lo que dicen las fuentes; no es asesoría legal.

## Resumen

| Tema | Qué hacer ahora | Si después quieren que sea automático |
|---|---|---|
| WhatsApp | Poner el número de negocios en la app **WhatsApp Business** (gratis) y abrirla en el computador con WhatsApp Web; el CRM abre cada chat con el texto listo. | WhatsApp Business Platform (API) en **coexistencia** con la app, a través de un proveedor, y un servidor chico que registre cada mensaje en el CRM. |
| Grabar llamadas | Grabación nativa del iPhone en la línea de negocios: avisa sola a las dos partes y deja audio y transcripción en Notas. | Un número chileno nuevo en una central en la nube (Zadarma, CloudTalk, JustCall o Twilio): llamadas desde el computador, grabadas y transcritas solas. |
| Transcribir | Copiar la transcripción del iPhone y pegarla en «Registrar llamada»; Claude hace el resumen. El iPhone transcribe llamadas en español de México y de EE.UU.; **español de Chile no figura: hay que probarlo**. | Si el iPhone no transcribe, un servicio por API transcribe el audio por menos de US$0,20 por llamada de 30 minutos. |
| Legal | Avisar que se graba y pedir el acuerdo; respetar a quien pide no ser contactado; antes del 1-12-2026, actualizar la política de privacidad de la web (Ley 21.719). | Lo mismo, más los avisos que exija el proveedor que se use. |

## 1. WhatsApp Business con el número de negocios

### Pasos

1. **Instalar WhatsApp Business** en el teléfono que tiene la línea de negocios y registrarla con
   ese número. En un teléfono con dos líneas pueden convivir WhatsApp (número personal) y WhatsApp
   Business (número de negocios). Si el número de negocios ya está en WhatsApp normal, se pasa a
   WhatsApp Business con respaldo y restauración y se conservan los chats, según guías de terceros
   (el FAQ oficial está **por confirmar**). Un número no puede estar en las dos apps a la vez.
2. **Perfil de empresa:** nombre «ZH Development», descripción («Software a medida,
   automatización e IA que conectan tu operación»), sitio `zhdevelopment.cl`, correo
   `contacto@zhdevelopment.cl` y horario (el de la agenda: lunes a viernes, 9:00 a 19:00, hora de
   Chile). Conviene dejar un mensaje de ausencia y respuestas rápidas.
3. **En el computador:** vincular WhatsApp Web o la app de escritorio con la cuenta Business. Lo
   más ordenado es un perfil de navegador solo para ZH, con el CRM y WhatsApp Web de negocios, para
   que los enlaces no caigan en la sesión personal.
4. **En el CRM:** Ajustes → «Abrir WhatsApp en: WhatsApp Web» y guardar el número de negocios.
   «Abrir en WhatsApp» abre el chat del lead con el texto escrito; el mensaje no se envía solo: se
   revisa y se aprieta enviar.
5. **En el celular:** si están instaladas las dos apps, **está por confirmar** cuál abre un enlace
   `wa.me`. Prueben una vez; si abre la personal, usen «Copiar texto» y péguenlo en WhatsApp
   Business.

La app y los mensajes que se mandan desde ella son gratis.

### Más adelante: la API (WhatsApp Business Platform)

Sirve para que cada mensaje que entra y sale quede registrado solo en el CRM, y para plantillas y
respuestas automáticas.

- **Coexistencia:** permite seguir usando la app y, a la vez, la API con el mismo número. La
  documentación de Meta no restringe Chile. Se conecta a través de un proveedor que la ofrezca: por
  ejemplo, 360dialog sí. Twilio, en cambio, pide borrar la cuenta de WhatsApp del número, así que
  queda descartado para esto. Trae hasta 6 meses de chats 1:1 y espeja lo que se manda desde la app.
- **Lo que se pierde en la app:**
  - Mensajes temporales, «ver una vez» y ubicación en tiempo real.
  - Las listas de difusión quedan solo de lectura y los grupos no se sincronizan.
  - WhatsApp para Windows no se puede volver a vincular.
  - Hay que abrir la app en el teléfono al menos cada 2 semanas.
- **Precios para Chile desde el 1-10-2026:**
  - Mensajes de marketing: US$0,0889 (unos $78).
  - Mensajes de utilidad, autenticación y servicio: US$0,02 (unos $18).
  - Los primeros 1.000 mensajes de servicio del mes son gratis, y lo que se manda desde la app
    sigue gratis.
- **Requiere un servidor** (por ejemplo, una función en Vercel) que reciba los avisos de Meta. El
  CRM es una página dentro de claude.ai y no puede recibirlos directamente.

## 2. Grabar y transcribir las llamadas

### Ahora: la grabación del iPhone

- **Disponible en Chile:** Apple publica los países donde no está (Unión Europea, Rusia, Turquía y
  algunos países de Medio Oriente y África, entre otros) y Chile no está en esa lista.
- **Aviso automático:** durante la llamada se toca el botón de grabar. El iPhone reproduce un
  aviso a las dos personas, y Apple pide además asegurarse de que la otra persona esté de acuerdo.
- **Dónde queda:**
  - En la app Notas, carpeta «Grabaciones de llamadas»: el audio y la transcripción, separada
    por persona.
  - Se puede «Copiar transcripción», «Compartir audio» o «Guardar archivos de audio».
  - Si se borra el audio, se borra también la transcripción.
- **Español de Chile por confirmar:**
  - Apple lista la transcripción de llamadas solo en español de México y de EE.UU.
  - Prueben con una llamada corta en la línea de negocios.
  - Si no aparece la transcripción, hay dos salidas. Una: probar con el iPhone en «Español
    (México)» (no verificado). Otra: exportar el audio y transcribirlo aparte (ver abajo).
- **Resumen de Apple:** requiere iPhone 15 Pro o posterior y solo existe en español de México y
  EE.UU. No hace falta: el resumen lo hace Claude en el CRM.
- **Doble línea:** Apple no dice si la grabación funciona en la segunda línea, así que hay que
  probarla en la de negocios. Antes de llamar, elijan la línea de negocios en el iPhone.

**Android:**
- La app Teléfono de Google graba con aviso a las dos partes, pero no transcribe; su
  disponibilidad en Chile está **por confirmar**.
- Samsung documenta en Chile la grabación de llamadas, y Galaxy AI transcribe en español de
  México, España y EE.UU.; español de Chile **por confirmar**.

### Si el teléfono no transcribe: transcribir el audio

Servicios por API que reconocen español y separan a quién habla (precios a octubre de 2026):

| Servicio | Precio aproximado | Nota |
|---|---|---|
| Deepgram Nova-3 | US$0,0043/min | US$200 de crédito inicial; español latinoamericano (`es-419`) |
| AssemblyAI | US$0,0035/min + US$0,02/h por separar voces | Cubre todos los dialectos del español |
| ElevenLabs Scribe v2 | US$0,0037/min | Separa hasta 32 voces |
| OpenAI gpt-4o-transcribe-diarize | US$0,006/min | Archivos de hasta 25 MB |

Una llamada de 30 minutos cuesta menos de US$0,20. Para usarlo hay que crear la cuenta y guardar
la clave como secreto del entorno, nunca en este repositorio. Con eso se puede armar el paso
«audio → transcripción → análisis → ficha del lead», ya sea en una conversación con Claude o como
botón del CRM a través de un conector.

### Más adelante: llamadas grabadas y transcritas solas

- **El número móvil actual no se puede llevar a Twilio:** Chile no está en sus guías de
  portabilidad. Usar el móvil como identificador verificado en llamadas de Twilio es posible, pero
  Twilio no garantiza que se vea bien en Chile.
- **La ruta realista es un número chileno nuevo** en una central en la nube, que graba,
  transcribe y avisa a un servidor:

| Opción | Número chileno | Costo aproximado | Transcripción en español | Conexión |
|---|---|---|---|---|
| Zadarma | Móvil +56 9: US$9 de alta + US$9/mes | Central gratis con grabación | US$0,014/min | API y webhooks gratis |
| CloudTalk | Móvil +56 9: US$15/mes + US$15 de alta; fijos desde US$6/mes | Desde €19–27 por usuario/mes, mínimo 1 | Complemento de €9 por usuario/mes | Webhooks desde el plan de €29–39 |
| JustCall | Móvil y fijo (con documentos y domicilio en Chile) | US$29 por usuario/mes, mínimo 2 | Incluida (español de Latinoamérica) | API y webhooks |
| Twilio | Móvil +56 9: US$10/mes (con documentos y domicilio en Chile) | US$0,0746/min a móviles + US$0,0025/min de grabación | Por lotes o en tiempo real (Google o Deepgram) | Todo programable, incluido llamar desde el navegador |

- **WhatsApp Business Calling API:** llamadas por WhatsApp con grabación y transcripción en
  español incluidas y gratis por ahora. Las que inicia el cliente son gratis; las que inicia la
  empresa hacia Chile cuestan US$0,0121/min y necesitan su permiso. Exige que el número esté en la
  API y no en la app, y un límite de mensajería de 2.000 destinatarios diarios. Conviene evaluarla
  más adelante.

## 3. Lo legal en Chile

> Resumen de las fuentes, no asesoría legal. Antes de grabar en forma sistemática, conviene una
> revisión de un abogado.

- **Grabar una llamada en la que uno participa:**
  - El artículo 161-A del Código Penal castiga grabar conversaciones privadas «sin autorización
    del afectado».
  - Según las fuentes citadas, la Corte Suprema ha entendido que ese delito supone que grabe un
    tercero, no un participante.
  - Igual, la práctica correcta es avisar al inicio, decir para qué se graba y pedir el acuerdo.
    Frase sugerida: «Antes de partir: voy a grabar la llamada para tomar bien las notas y mandarte
    un resumen. ¿Te parece?».
  - En el CRM, «Registrar llamada» tiene la casilla «Avisé al inicio que la llamada se grababa».
- **Ley 21.719 de datos personales, vigente desde el 1-12-2026** (hay un proyecto en trámite para
  postergarla un año):
  - Hace falta una base para tratar los datos de los leads: consentimiento (puede ser verbal),
    interés legítimo o medidas precontractuales que pidió la persona.
  - Hay que publicar una política con:
    - finalidades;
    - plazo de conservación;
    - origen de los datos;
    - transferencias al extranjero (claude.ai de Anthropic, Google, Resend, Vercel y el
      proveedor de telefonía que se use);
    - un canal para ejercer los derechos: acceso, rectificación, supresión y oposición, incluida
      la oposición al marketing directo.
  - Pendiente: actualizar `privacidad.html` de la landing antes de esa fecha.
- **«No molestar»** (art. 28 B de la Ley del Consumidor):
  - Cubre teléfono, SMS, WhatsApp y correo; a quien pide no ser contactado se le saca de las
    bases en un día hábil.
  - Aplica a consumidores; a micro y pequeñas empresas podría aplicar por el Estatuto Pyme
    (**por confirmar**).
  - En el CRM: «Pidió no ser contactado», en los datos del lead, lo saca de las listas y bloquea
    llamar, escribir y redactar.
- **Proyecto antispam:**
  - Pide consentimiento previo, expreso y específico para llamadas y mensajería con fines
    publicitarios, con multas de hasta 1.000 UTM.
  - El Senado lo aprobó en general el 7-10-2026, con plazo de indicaciones hasta el 6-11-2026.
  - Si queda así, el primer WhatsApp en frío a alguien que no pidió contacto queda en duda.
    Prioricen leads que llegaron por la web, por referidos o que entregaron su contacto.
- **Prefijos 600 y 809:** son solo para comunicaciones masivas automatizadas. Las llamadas
  persona a persona se hacen con el número normal.

## 4. Cómo queda todo en el CRM

1. **Antes de llamar:** en **Hoy** está la lista de a quién llamar, con lo atrasado primero. En la
   ficha, «Registrar llamada» muestra el número grande con «Copiar» y «Llamar».
2. **Durante la llamada:** llamas desde la línea de negocios y, al empezar, avisas que vas a
   grabar.
3. **Al cortar:**
   - Pegas la transcripción («Copiar transcripción» en Notas) o subes un `.txt`, `.vtt` o `.srt`.
   - Marcas el resultado y el aviso de grabación, y agregas tus notas.
4. **«Analizar con Claude»:**
   - Deja el resumen, lo que necesita, las objeciones, lo que prometimos y el siguiente paso.
   - Propone la etapa y la próxima acción. Revisas y guardas.
5. **Si quedó en mandar algo:**
   - «Redactar con Claude» arma el correo o el WhatsApp con el contexto de la llamada.
   - Lo revisas en Borradores y lo mandas con «Copiar y abrir Gmail» o «Abrir en WhatsApp».
   - Al final, «Marcar como enviado».

## Fuentes

- Apple, grabación de llamadas en iPhone: https://support.apple.com/es-cl/guide/iphone/iph57c6590e9/ios
- Apple, idiomas por función (iOS 27): https://www.apple.com/ios/feature-availability/
- Google, grabación en la app Teléfono: https://support.google.com/phoneapp/answer/9803950?hl=es-419
- Samsung Chile, grabación de llamadas: https://www.samsung.com/cl/support/mobile-devices/how-to-record-play-back-and-share-voice-recordings-on-your-samsung-galaxy-phone/
- Twilio, portabilidad: https://www.twilio.com/en-us/guidelines/porting · requisitos Chile: https://www.twilio.com/en-us/guidelines/cl/regulatory · precios de voz Chile: https://www.twilio.com/en-us/voice/pricing/cl · guía de voz Chile: https://www.twilio.com/en-us/guidelines/cl/chile--voice-guidelines---twilio
- Zadarma: https://zadarma.com/en/tariffs/numbers/chile/mobile/ · https://zadarma.com/en/services/speech-analytics/
- CloudTalk: https://www.cloudtalk.io/pricing/ · https://www.cloudtalk.io/virtual-number-chile/
- JustCall: https://justcall.io/pricing/ · https://help.justcall.io/en/articles/8607664-phone-numbers-availability-and-requirements-in-justcall
- Meta, coexistencia: https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users/ · precios: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/ · llamadas: https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/
- 360dialog, coexistencia: https://docs.360dialog.com/docs/hub/embedded-signup/whatsapp-coexistence
- Twilio, alta de WhatsApp: https://www.twilio.com/docs/whatsapp/self-sign-up
- Código Penal, art. 161-A: https://iura.cl/cp/161-a · Radio UChile (caso Cordero): https://radio.uchile.cl/?p=752847
- Ley 21.719: https://www.bcn.cl/leychile/navegar?idNorma=1209272 · proyecto de postergación (Boletín 18.623-07): https://tramitacion.senado.cl/appsenado/templates/tramitacion/index.php?boletin_ini=18623-07
- SERNAC, «No molestar»: https://www.sernac.cl/portal/604/w3-article-56353.html · proyecto antispam: https://www.senado.cl/comunicaciones/noticias/fin-al-spam-podria-ser-una-realidad
- Subtel, prefijos 600 y 809: https://www.subtel.gob.cl/wp-content/uploads/2025/03/Oficio_Circular_N575_2025_Inf_aplicacion_Resolucion_1319_de_2024.pdf
- Transcripción: https://deepgram.com/pricing · https://www.assemblyai.com/pricing · https://elevenlabs.io/pricing/api · https://developers.openai.com/api/docs/pricing
