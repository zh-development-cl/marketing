# Oportunidad: VinoPrint

Actualizado: 2026-10-15. Primera llamada hecha por Lorenzo el 15 de octubre.

## Lo que dijo César Aldana

- Usan **Twist Print**, un ERP para imprentas, y solo le sirve el módulo de cotizaciones.
- Siente que paga mucho por lo que usa y preferiría tener algo propio.
- Dio su correo: cesar.aldana@vinoprint.cl.
- Quedaron en un diagnóstico en reunión, el viernes o la próxima semana.

## Qué es Twist Print

ERP y MIS en la nube para imprentas. Nació en Chile, de la imprenta Imprex (ex Nuevamérica), en Recoleta, y lo revende Antalis Chile. Dice tener cientos de imprentas clientes en 17 países.

**Planes publicados en su sitio, en dólares por mes:**

| Plan | Precio | Qué incluye |
|------|--------|-------------|
| Go! | US$ 299 | CRM, producción, facturación, cotización en PDF, usuarios ilimitados |
| Lite | US$ 400 | "El motor de cotización que usan las imprentas grandes", hasta 10 usuarios |
| Pro | US$ 1.000 | Más producción, inventario, logística y KPI, hasta 50 usuarios |
| Enterprise | US$ 1.500 | Multiplanta, usuarios ilimitados |

Una imprenta de 7 personas que solo cotiza está, con toda probabilidad, en Go! o Lite. Son entre 3,4 y 4,6 millones de pesos al año por una función. Eso explica el "pago mucho".

**Qué hace su cotizador:** calculadoras separadas para impresión comercial, packaging, etiquetas y gran formato. Recibe cantidad, producto, colores, acabado y fecha; calcula imposición, merma, tiempo de máquina y terminaciones con los costos reales de la imprenta; entrega la cotización con precio y margen estimado, y el cliente la puede aceptar en línea. Tiene API abierta y webhooks, y se integra con QuickBooks y SAP. No menciona integración con el SII ni con facturadores chilenos.

**Lo que hay que respetar:** ese motor de cotización es el corazón del producto y llevan años afinándolo. Reemplazarlo completo sería un error. Lo que conviene es construir solo la parte que César usa, con sus fórmulas, no las de Twist.

## Qué le podemos ofrecer

**Un cotizador propio para etiquetas de vino, hecho a la medida de cómo cotiza César.**

- Entradas: tipo de etiqueta, material, ancho y alto, cantidad, tintas, acabados (barniz, laminado, hot stamping, relieve, troquel), plazo.
- Cálculo: imposición en el rollo o pliego, merma, tiempo de máquina y materiales, con sus costos y sus márgenes. Las fórmulas son las de él, levantadas en el diagnóstico.
- Salida: cotización en PDF con su marca, enviada por correo o WhatsApp, con un link para que el cliente la acepte. Historial por cliente, versiones y "repetir cotización".
- Todo a nombre de VinoPrint. Sin suscripción mensual: solo el hosting, que es marginal.

**Después, si funciona:** la cotización aceptada se convierte en orden de trabajo, y se conecta con el facturador que usen para la factura electrónica. Son fases separadas, cada una con su propuesta.

**La comparación que le importa:** un proyecto con precio cerrado contra 3,4 a 4,6 millones al año para siempre. Si el cotizador cuesta menos de un año de Twist, se paga solo en el primer año y después es gratis. Ese número hay que decirlo en la reunión, con su cifra real.

**De paso:** vinoprint.cl muestra la página de "sitio en construcción" del hosting. Mencionarlo al final de la reunión, no al principio.

## Riesgos

- **Las fórmulas son el proyecto.** Si César no sabe explicar cómo llega al precio, o si depende de la lógica interna de Twist, el levantamiento es más largo. Hay que verlo cotizar en vivo.
- **Migración.** Clientes, lista de precios e historial de cotizaciones están en Twist. Tiene API abierta, así que se pueden exportar, pero hay que confirmar que su plan lo permite.
- **Mientras no exista el cotizador, sigue pagando Twist.** El plazo de entrega importa: proponer algo usable en semanas, no meses.

## Diagnóstico: qué preguntar en la reunión

Pedirle que comparta pantalla y cotice un trabajo real en Twist. Con eso se responde casi todo. Preguntas:

1. ¿Cuántas cotizaciones hacen a la semana, y cuántas se convierten en trabajo?
2. ¿Qué campos de Twist usa y cuáles ignora?
3. ¿Cómo llega al precio? Costos de material, máquina, terminaciones, margen. ¿Lo revisa a mano después?
4. ¿Cómo le llega el pedido del cliente: correo, WhatsApp, con arte adjunto?
5. ¿Qué pasa después de que el cliente acepta? Orden de trabajo, producción, factura: ¿en qué sistema?
6. ¿Qué plan de Twist tiene y cuánto paga al mes?
7. ¿Qué más del ERP le gustaría tener, aunque hoy no lo use?
8. ¿Con qué facturan?

Con las respuestas sale la propuesta escrita: alcance, plazo y precio cerrado.

## Siguiente paso

Lorenzo lo llama el viernes 16 a las 10:00 para proponer el diagnóstico ese mismo día, y manda la invitación a cesar.aldana@vinoprint.cl durante la llamada. Guion en `seguimiento.md`.
