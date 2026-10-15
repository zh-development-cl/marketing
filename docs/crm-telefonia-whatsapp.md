# Llamadas y WhatsApp para el CRM

Investigación al 14-10-2026, con fuentes al final. Lo que no se pudo confirmar dice **por
confirmar**. La parte legal resume lo que dicen las fuentes; no es asesoría legal.

## Resumen

| Tema | Qué hacer ahora | Si después quieren que sea automático |
|---|---|---|
| WhatsApp | Poner el número de negocios en la app **WhatsApp Business** (gratis) y abrirla en el computador con WhatsApp Web; el CRM abre cada chat con el texto listo. | WhatsApp Business Platform (API) en **coexistencia** con la app, a través de un proveedor, y un servidor chico que registre cada mensaje en el CRM. |
| Notas de las llamadas | Transcribir en vivo desde el computador, con el celular en altavoz al lado (gratis y sin aviso), o dictar las notas justo al cortar (micrófono del teclado del teléfono). Claude las ordena. | Una línea en la nube que grabe y transcriba sola, con un número nuevo. El iPhone no sirve para esto: siempre avisa a las dos personas. |
| Legal | Según la jurisprudencia citada, grabar sin avisar una llamada en la que uno participa no es el delito del 161-A. Desde el 1-12-2026 (Ley 21.719) hay que mencionarlo en la política de privacidad y guardar lo mínimo. | Lo mismo, según lo que haga el proveedor que se use. |

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

## 2. Notas de las llamadas, sin avisar al cliente

La idea es tener buenas notas de cada llamada para el seguimiento, sin que el cliente escuche un
aviso de grabación al empezar.

### Lo que ya funciona: dictar las notas al cortar

1. En la ficha del lead, «Registrar llamada» → «Notas de la llamada».
2. En el teléfono, toca el micrófono del teclado y dicta en 30 a 60 segundos lo que recuerdes, sin
   orden: qué necesita, qué le preocupa, qué quedaste en mandar.
3. «Analizar con Claude» lo ordena: resumen, necesidades, objeciones, lo que prometimos, próximos
   pasos, etapa y próxima acción. Revisas y guardas.

No se graba la voz del cliente, así que no hay nada que avisar ni audio que guardar. No cuesta nada
y funciona desde hoy.

### Transcribir en vivo desde el computador

Ninguna app del celular puede grabar una llamada (Apple y Google lo bloquean; solo la app
Teléfono del iPhone graba, y avisa a las dos personas). Lo que sí funciona sin comprar nada:

1. En el computador, en Chrome o Edge, «Registrar llamada» → «Transcribir en vivo».
2. Llamas desde el celular en altavoz, junto al computador. El CRM escucha y lo pasa a texto en
   español de Chile.
3. Al cortar, «Detener» y «Analizar con Claude».

No suena ningún aviso y no cuesta nada. El audio no se guarda: el navegador lo manda a su servicio
de voz (Google en Chrome, Microsoft en Edge) y vuelve solo el texto. La calidad es menor que una
grabación directa y no separa quién habla, así que conviene un lugar tranquilo. Si claude.ai no
deja usar el micrófono, el plan B es la escritura por voz de Google Docs (Herramientas → Escritura
por voz), pegando el texto en el CRM.

### Transcribir la conversación completa sin aviso

- **iPhone: no sirve.**
  - Su grabación nativa siempre reproduce un aviso a las dos personas.
  - Ese aviso no se puede quitar; solo se puede apagar la función completa.
- **App Teléfono de Google en Android:** tampoco; avisa a las dos partes.
- **Samsung:**
  - Samsung Chile documenta la grabación de llamadas, pero no dice si avisa a la otra persona:
    hay que probarlo.
  - Galaxy AI transcribe en español de México, España y EE.UU.; el de Chile está **por
    confirmar**.
- **Una línea en la nube:**
  - La central graba y transcribe. Si suena un aviso o no, lo define la configuración de cada
    proveedor (**por confirmar** en cada caso).
  - La llamada sale con un número nuevo, no con el móvil de negocios actual: Twilio no tiene a
    Chile en su lista de portabilidad, y usar el móvil como identificador verificado en Twilio no
    garantiza que se vea bien en Chile.

| Opción | Número chileno | Costo aproximado | Transcripción en español | Conexión |
|---|---|---|---|---|
| Zadarma | Móvil +56 9: US$9 de alta + US$9/mes | Central gratis con grabación | US$0,014/min | API y webhooks gratis |
| CloudTalk | Móvil +56 9: US$15/mes + US$15 de alta; fijos desde US$6/mes | Desde €19–27 por usuario/mes, mínimo 1 | Complemento de €9 por usuario/mes | Webhooks desde el plan de €29–39 |
| JustCall | Móvil y fijo (con documentos y domicilio en Chile) | US$29 por usuario/mes, mínimo 2 | Incluida (español de Latinoamérica) | API y webhooks |
| Twilio | Móvil +56 9: US$10/mes (con documentos y domicilio en Chile) | US$0,0746/min a móviles + US$0,0025/min de grabación | Por lotes o en tiempo real (Google o Deepgram) | Todo programable, incluido llamar desde el navegador |

**Si tienen un audio y hay que transcribirlo**, estos servicios por API reconocen español y
separan a quién habla (precios a octubre de 2026). Una llamada de 30 minutos cuesta menos de
US$0,20. La clave va como secreto del entorno, nunca en este repositorio.

| Servicio | Precio aproximado | Nota |
|---|---|---|
| Deepgram Nova-3 | US$0,0043/min | US$200 de crédito inicial; español latinoamericano (`es-419`) |
| AssemblyAI | US$0,0035/min + US$0,02/h por separar voces | Cubre todos los dialectos del español |
| ElevenLabs Scribe v2 | US$0,0037/min | Separa hasta 32 voces |
| OpenAI gpt-4o-transcribe-diarize | US$0,006/min | Archivos de hasta 25 MB |

**WhatsApp Business Calling API:** no sirve para esto. Graba y transcribe en español, pero
reproduce un aviso obligatorio a las dos personas.

## 3. Lo legal en Chile

> Resumen de las fuentes, no asesoría legal. Si van a transcribir llamadas de forma sistemática,
> conviene una consulta corta con un abogado.

- **Grabar sin avisar una llamada en la que uno participa:**
  - El artículo 161-A del Código Penal castiga grabar conversaciones privadas «sin autorización
    del afectado».
  - Según las fuentes citadas, la Corte Suprema ha entendido que ese delito supone que grabe un
    tercero, no alguien que participa en la llamada.
  - Hay doctrina que sostiene que sí podría haber delito si hay engaño. Si un cliente pregunta si
    lo están grabando, no lo nieguen.
  - Dictar las notas después de cortar no graba a nadie, así que no entra en esta discusión.
- **Ley 21.719 de datos personales, vigente desde el 1-12-2026** (hay un proyecto en trámite para
  postergarla un año):
  - Las notas y una transcripción de una llamada con un cliente son datos personales.
  - Sin consentimiento, la base posible es el interés legítimo: sin afectar los derechos de la
    persona, que puede pedir que se le explique cuál es.
  - La ley exige informarlo en la política de tratamiento: finalidad (notas internas de las
    llamadas comerciales), plazo de conservación, proveedores en el extranjero (claude.ai de
    Anthropic, Google, Resend, Vercel y el de telefonía, si se usa) y cómo pedir acceso,
    corrección o borrado. Si además exige un aviso en cada llamada está **por confirmar**.
  - Pendiente: agregar eso a `privacidad.html` de la landing antes de esa fecha.
  - Guarden lo mínimo: por defecto el CRM guarda las notas y el análisis, no la transcripción
    completa. Si graban audio con otra herramienta, bórrenlo después de transcribirlo.
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
2. **Durante la llamada:** llamas desde la línea de negocios.
3. **Al cortar:**
   - Dictas tus notas en «Registrar llamada» o, si tienes una transcripción, la pegas o subes un
     `.txt`, `.vtt` o `.srt`.
   - Marcas el resultado. La transcripción completa se guarda solo si marcas esa opción.
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
