# Correos

Correos con el mismo marco que usa la landing para la agenda (`_tools/correos/` del repo
`landing`): tarjeta blanca de 580 px sobre papel `#EEF1F5`, cabecera en tinta `#07090F`,
rótulos mono, botones píldora `#0A54DC`, fuentes del sistema y todos los estilos en línea, para
que se vean bien en Gmail y Outlook.

Marca en la cabecera: `https://zhdevelopment.cl/marca/zh-logo-horizontal-blanco.png` a
200×29, con `max-width:100%` y `height:auto` para que en un teléfono angosto se achique en vez
de quedar bajo el logo del cliente, y con `alt="ZH Development"` estilizado (blanco, 15 px,
semibold, con `font-family`) para que, con las imágenes bloqueadas (Outlook las bloquea hasta
que el remitente es de confianza), se lea el nombre en vez de un ícono roto en Times.
El logo del cliente se carga desde su propio sitio, en una caja blanca a la derecha de la
cabecera, como en las portadas de propuesta (ZH a la izquierda, cliente a la derecha), con
`alt` para que se lea su nombre si no carga. Los botones de agenda apuntan a
`https://zhdevelopment.cl/agendar`, la agenda sola para enlaces de correo.

Fuentes siempre con propiedades separadas (`font-family`, `font-size`, `font-weight`,
`line-height`), nunca con `font:` abreviada: Outlook web descarta la abreviada cuando lleva
peso 600 y el texto cae a Times. Cada `<td>` lleva además su `font-family`, por si un cliente
descarta la de un elemento.

## rlog-presentacion.html

Correo a Walther (R-Log) al día siguiente de la llamada del 2026-10-14: qué hace ZH, dónde
podría servir en R-Log y cómo trabajamos, con la invitación a un diagnóstico sin compromiso
como mensaje principal (panel oscuro con el botón «Agendar diagnóstico»).

Asunto: `ZH Development · Qué hacemos y qué podría servir en R-Log`

Cómo enviarlo desde Gmail:

1. Abrir `rlog-presentacion.html` en Chrome (Cmd+O o arrastrarlo a una pestaña). Se debe ver el
   correo diseñado, no el código.
2. Seleccionar todo (Cmd+A) y copiar (Cmd+C).
3. Pegar en un correo nuevo de Gmail. Se conservan colores, botones y enlaces.
4. Revisar que los dos logos carguen y enviar.

Enlaces: «Agendar diagnóstico» va a `zhdevelopment.cl/agendar`; «Conocer ZH Development» (en el bloque «Qué hacemos») al inicio del sitio;
el teléfono abre WhatsApp. El logo de R-Log es
`https://r-log.cl/wp-content/uploads/2023/08/r-log-logo.png` (PNG con fondo transparente).

Versión en texto plano, por si se prefiere un correo simple:

```
Hola Walther:

Gracias por la conversación de ayer. Te dejo por escrito lo que te comenté, para que lo revises con tu socio.

En ZH Development hacemos software a medida, automatización e IA para optimizar procesos manuales: conectamos los sistemas que ya usan o creamos nuevos desde cero.

Dónde podría servir en R-Log lo definimos juntos después del diagnóstico, entendiendo cómo funcionan sus procesos y dónde se está perdiendo valor.

Partimos con un diagnóstico sin compromiso, donde exploraremos juntos su operación y las oportunidades de mejora. Si tiene sentido seguir, enviamos una propuesta escrita con alcance, plazo y precio cerrado. Todo queda a nombre de R-Log y, si lo prefieren, con mantención y soporte nuestro.

Si ven algo que les haga sentido, agendamos: https://zhdevelopment.cl/agendar
Más sobre nosotros en https://zhdevelopment.cl

Saludos,
Lorenzo
ZH Development · zhdevelopment.cl · +56 9 4209 8269
```
