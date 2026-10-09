# Brief: Instagram de ZH Development

Fecha: 2026-10-09. Objetivo: conseguir clientes por inbound con videos cortos en Instagram.

## Quién es ZH

ZH Development SpA, empresa chilena de software a medida, automatización e integración de sistemas e IA aplicada con revisión humana. Cobertura: todo Chile, remoto. Correo: contacto@zhdevelopment.cl. Landing: https://zhdevelopment.cl (se está rediseñando; repo zh-development-cl/landing, proyecto Vercel `zhdevelopment`).

Mensajes clave de la landing:
- "Software a medida, automatización e IA que conectan tu operación."
- "Unimos tus sistemas, automatizamos lo repetitivo y aplicamos IA con revisión humana."
- "La IA lee el documento; tu equipo aprueba. Nada avanza sin revisión humana."
- "Todo queda a nombre de tu empresa": código, repositorio y cuentas.
- Propuesta escrita con alcance, plazo y precio antes de empezar.
- Proceso en cuatro etapas, cada una con entregable: 01 Entender (proceso levantado), 02 Diseñar (alcance definido), 03 Construir (entregas verificables), 04 Mejorar (solución en uso).
- CTA: "Agendar llamada", llamada de descubrimiento de 30 minutos por Google Meet. Responden en menos de 24 horas.

Servicios: desarrollo a medida, automatización e integración (ERP, CRM, flujos), IA aplicada (extracción, clasificación, asistentes), levantamiento de procesos, diseño web, consultoría e infraestructura.

## Tokens de marca (landing en producción, 2026-10-09)

Fondos oscuros: `#07090F` (ink-0), `#0D1119` (ink-1), `#141A25` (ink-2).
Texto sobre oscuro: `#EDF0F5` (principal), `#9AA4B5` (secundario), `#7C879A` (terciario).
Líneas: `#1B2230`, `#2A3345`. Trazos: `#8A95A8`, `#3A4459`.
Acento (signal): `#245CE4` sobre claro; `#8FB0FF` sobre oscuro; botón `#306BFF`, hover `#1F55D9`.
Fondos claros: `#F6F7F9`, `#EDF0F5`; texto sobre claro `#0B0F17`.
Fuentes: Funnel Display (títulos), Funnel Sans (texto), IBM Plex Mono (etiquetas y datos). Google Fonts tiene Funnel Display y Funnel Sans; IBM Plex Mono también.
Logo: `brand/zh-logo.svg` (viewBox 0 0 1000 630.685), monograma ZH con un bloque de acento azul.

La landing se está rediseñando: verificar los tokens contra la versión vigente antes de cerrar el brand kit.

## Referencia de estilo que le gusta a Lorenzo

Reel de @nexacgs: https://www.instagram.com/p/DeKx7BiP2SH/ (34 s, vertical, 30 fps). Motion graphics sobre fondo oscuro, sin personas en cámara, voz en off en español sobre música. Un solo color de acento (verde menta), tipografía sans blanca, etiquetas pequeñas tipo "paso 01".

Estructura, segundo a segundo:
1. 0 a 3 s: tipografía cinética "qué es Nexa?" palabra por palabra, el "?" en color de acento.
2. 3 a 5 s: "imagina que esta es tu empresa" sobre un iPhone con pantalla de bloqueo llena de notificaciones (WhatsApp, planillas, facturas).
3. 5 a 9 s: caos. Tarjetas de UI flotando y girando en 3D con desenfoque de profundidad; etiquetas que van apareciendo: mensajes, planillas, correos, cobros, y "todo a mano" en fuente manuscrita.
4. 9 a 13 s: "paso 01 diagnóstico". Las tarjetas se ordenan en grilla; abajo una llamada con "Cristóbal, de Nexa" y un contador que llega a 30:00.
5. 13 a 17 s: tres puntos del diagnóstico: "preguntas repetidas" (chat), "stock en 3 planillas" (archivos Excel apilados), "cobros a mano" (facturas con timbre VENCIDA).
6. 17 a 20 s: "paso 02 propuesta". Anillo de progreso 42h → 48h, luego un documento "Propuesta para Tu Empresa" con diagnóstico y plan en 4 semanas.
7. 20 a 25 s: "paso 03 implementación". Calendario de octubre 2026 marcando semanas, mockup de dashboard, y el agente de WhatsApp respondiendo a una clienta.
8. 25 a 27 s: el mismo iPhone, ahora con notificaciones resueltas por el agente.
9. 27 a 34 s: logo con glow, "software que piensa y resuelve", botón "Agenda tus 30 minutos →", dominio y avatares del equipo.

Guion de la voz en off: "¿Qué es Nexa? Imagina que esta es tu empresa: mensajes, planillas, correos, cobros, todo a mano. En Nexa partimos con una llamada de 30 minutos para encontrar lo que más tiempo te quita. En 48 horas te llega una propuesta concreta. Y en menos de 4 semanas tu software está funcionando con agentes de IA que responden por ti. Nexa, software que piensa y resuelve. Agenda tus 30 minutos."

Lo que hay que replicar: estructura caos → proceso en pasos → resultado → logo y CTA; mockups de UI reales (teléfono, chat, planillas, documentos); un acento de color; voz en off corta y concreta. Lo que no se copia: el guion, la marca, ni el video.

## Enfoque de producción propuesto

Motion graphics programáticos (Remotion: React renderizado a MP4 1080x1920 a 30 fps). Los mockups son HTML/CSS con los tokens reales de la landing; las animaciones 3D de tarjetas se hacen con transforms CSS; el timing se sincroniza con la voz en off. Voz: grabación de Lorenzo o voz sintética (requiere clave de ElevenLabs u otro proveedor). Música: agregarla desde la biblioteca de Instagram al publicar, para no tener problemas de licencia.

## Instagram: estado y pendientes

- @zhdevelopment ya existe: perfil privado, nombre "ZHDevelopment", 8 seguidores, 0 seguidos. Falta confirmar si es de ZH.
- Si no es de ZH, estaban libres el 2026-10-09: @zhdevelopment.cl (recomendado), @zh.development, @zh_development, @zhdev.cl. @zhdev está tomado.
- Lorenzo crea la cuenta (Claude no crea cuentas ni ingresa contraseñas). Conviene cuenta profesional vinculada a una página de Facebook para publicar por la API de Meta desde la nube más adelante.
- Extensión Claude in Chrome en el Mac de Lorenzo: pendiente de instalar e iniciar sesión. El Mac se usa solo para el navegador.
