# Reel 01 · ¿Qué es ZH Development?

Formato: 1080x1920, 30 fps, 39 s (la duración la fija la voz). Las escenas se encadenan con fundidos cruzados de 10 frames. Motion graphics oscuros, sin personas, un acento de color (`#8FB0FF` sobre oscuro). Voz en off en español neutro con acento chileno suave. Subtítulos siempre visibles. Música: agregarla desde la biblioteca de Instagram al publicar.

Composición Remotion: `video/src/scenes/Reel01.tsx`. Timing en frames en `video/src/timeline.ts`.

## Voz en off (guion que se graba o se sintetiza)

> ¿Qué es ZH Development?
> Imagina que esta es tu empresa: mensajes, planillas, correos, cobros… todo a mano.
> Todo parte con una llamada de treinta minutos para entender tu operación y encontrar lo que más tiempo te quita.
> Después recibes una propuesta escrita, con alcance, plazo y precio.
> Construimos por etapas, con entregas que puedes probar, y usamos IA solo donde aporta, siempre con revisión humana.
> Cuando está en uso, lo seguimos mejorando contigo. Y todo queda a nombre de tu empresa.
> Somos ZH Development: software a medida que conecta tu operación.
> Agenda tu llamada de treinta minutos en el link de la bio.

El nombre se dice solo al abrir y al cerrar. Para la voz sintética "ZH" se escribe "Zeta Hache" e "IA" se dice "inteligencia artificial" (ver `pronounce` en `video/scripts/voiceover.mjs`); en pantalla se muestran "ZH" e "IA". Cada frase cae en una escena y los subtítulos (solo en los pasos 01 a 04) siguen la voz palabra por palabra.

## Escenas, segundo a segundo

| # | Tiempo | Pantalla | Voz |
|---|--------|----------|-----|
| 1 | 0.0 – 2.4 | Tipografía cinética palabra por palabra: "¿Qué es **ZH Development**?" El "?" y "ZH" en acento. | ¿Qué es ZH Development? |
| 2 | 2.1 – 4.7 | iPhone centrado con pantalla de bloqueo y notificaciones que caen: WhatsApp "¿Tienen stock?", Excel "Planilla ventas v7 FINAL", Correo "RE: RE: cotización", Factura "Vencida hace 12 días". Texto arriba: "imagina que esta es tu empresa". | Imagina que esta es tu empresa: |
| 3 | 4.3 – 8.4 | Caos: tarjetas de UI (chat, planilla, correo, factura) flotando y girando en 3D con desenfoque de profundidad. Etiquetas grandes que aparecen una a una: mensajes · planillas · correos · cobros. Cierra "todo a mano" en fuente manuscrita. | mensajes, planillas, correos, cobros… todo a mano. |
| 4 | 8.1 – 13.9 | Etiqueta `paso 01` · **Entender**. Las tarjetas del caos viajan hasta una grilla ordenada. Abajo, tarjeta de videollamada "Lorenzo · ZH Development" con contador que llega a 30:00 cuando la voz dice "minutos" y tres hallazgos que se marcan con "encontrar": preguntas repetidas, stock en 3 planillas, cobros a mano. | Todo parte con una llamada de treinta minutos para entender tu operación y encontrar lo que más tiempo te quita. |
| 5 | 13.6 – 18.2 | Etiqueta `paso 02` · **Diseñar**. Documento "Propuesta · tu empresa" cuyas filas entran cuando la voz las nombra: Alcance (3 ítems), Plazo (6 semanas), Precio (cerrado antes de empezar). | Después recibes una propuesta escrita, con alcance, plazo y precio. |
| 6 | 17.8 – 25.7 | Etiqueta `paso 03` · **Construir**. Seis semanas de entregas que se marcan con "etapas"; chat donde el cliente escribe, el asistente responde con "aporta" y aparece el sello "IA · revisado por tu equipo" con "revisión". | Construimos por etapas, con entregas que puedes probar, y usamos IA solo donde aporta, siempre con revisión humana. |
| 7 | 25.4 – 30.6 | Etiqueta `paso 04` · **Mejorar** y, con "nombre", la línea "Código, repositorio y cuentas, a tu nombre". El mismo iPhone seis semanas después, en calma: "Pedido #2231 confirmado · Revisado por Pedro", "Stock sincronizado con el ERP", "Factura N° 1042 pagada". | Cuando está en uso, lo seguimos mejorando contigo. Y todo queda a nombre de tu empresa. |
| 8 | 30.3 – 39.3 | Logo ZH con glow; "Software a medida que / conecta tu operación." en dos líneas con la voz; botón "Agenda tu llamada de 30 min" con "Agenda", debajo "Link en la bio" y zhdevelopment.cl. | Somos ZH Development: software a medida que conecta tu operación. Agenda tu llamada de treinta minutos en el link de la bio. |

## Texto para la publicación

Caption: "¿Qué es ZH Development? Software a medida, automatización e IA para empresas que todavía hacen todo a mano. Llamada de 30 min → propuesta escrita → construcción por etapas. Todo queda a tu nombre. Agenda en el link de la bio."

Hashtags (máx. 5): #softwareamedida #automatizacion #pymeschile #inteligenciaartificial #chile

## Voz

Generada con ElevenLabs (`video/scripts/voiceover.mjs`), voz "Alejandro - Conversations" (chileno, id `0cheeVA5B3Cv6DGq65cT`), modelo multilingual v2. Un clip por escena en `video/public/vo/` y los tiempos en `video/src/vo.json`; el timeline y los subtítulos se calculan desde ahí. Para cambiar la voz: `node scripts/voiceover.mjs <voiceId>` y volver a renderizar. Cada corrida gasta ~535 caracteres.

## Pendiente

- Revisar el nombre que aparece en la tarjeta de llamada ("Lorenzo · ZH Development").
