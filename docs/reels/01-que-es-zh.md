# Reel 01 · ¿Qué es ZH Development?

Formato: 1080x1920, 30 fps, 45,2 s (la duración la fija la voz). Versión actual: **v5** (`video/src/v4/`). Nivel de
producción tomado del reel de referencia de @nexacgs (composición continua sin cortes secos, desenfoque de movimiento
por velocidad, grano y viñeta, mockups realistas, efectos de sonido por cue, cama musical), pero con **concepto propio**
pedido por Lorenzo: la apertura no copia la de la referencia (nada de texto→píldora→teléfono ni "imagina que esta es
tu empresa" con notificaciones). Voz en off en una sola toma con la voz "JC" de ElevenLabs (modelo v3), misma voz y
tono de principio a fin; "ZH" se pronuncia "zeta hache" (verificado fonéticamente). Render final masterizado a −14 LUFS.

Composición: `video/src/v4/Reel.tsx` (escenas en `video/src/v4/scenes/`). Timing en frames en `video/src/v4/timeline.ts`,
calculado desde `video/src/v4/vo.json` (tiempos por palabra medidos con STT sobre el audio final).

## Voz en off (una sola toma)

> ¿Qué es ZH Development?
> En una pyme, el día se va en lo mismo: cotizar por WhatsApp, cuadrar planillas, perseguir pagos.
> Hacemos el software que lo resuelve.
> Partimos con una llamada de 30 minutos para encontrar lo que más tiempo te quita.
> Después, una propuesta escrita: alcance, plazo y precio. Sin sorpresas.
> Construimos por etapas, con entregas que puedes probar, y usamos IA con revisión humana.
> Y todo queda a nombre de tu empresa.
> ZH Development: software a medida que conecta tu operación.
> Agenda tu llamada de 30 minutos. Link en la bio.

En el script se escribe "Zeta Hache", "treinta" e "inteligencia artificial" (ver `pronounce` en
`video/scripts/voiceover-single.mjs`). La toma completa queda en `video/public/vo-v5/toma-completa.wav` y se corta por
escena; una sola etiqueta de interpretación (`[confident, warm]`) para toda la toma y estirado 1,2x.

## Escenas, segundo a segundo

| # | Tiempo | Pantalla | Voz |
|---|--------|----------|-----|
| 1 | 0.0 – 2.6 | Gancho en consola: "~/tu-empresa $" y la pregunta se escribe letra a letra en display ("¿qué es / ZH / Development?") con un cursor de bloque azul que parpadea; sale hacia arriba con latigazo. | ¿Qué es ZH Development? |
| 2 | 2.6 – 9.8 | Un día en time-lapse: regla de 08:00 a 19:00 con cabezal que acelera; tarjetas reales (WhatsApp, Excel, Gmail, facturas, post-its, Instagram, banco) entran por la derecha con su hora y se amontonan; en los beats se iluminan las de cada tipo; contador "tareas repetidas hoy" 0 → 47. | En una pyme, el día se va en lo mismo: cotizar por WhatsApp, cuadrar planillas, perseguir pagos. |
| 3 | 9.8 – 12.8 | Ventana de app ZH ("Tu Empresa · sistema"): el montón vuela adentro y se ordena en tres columnas (cotizaciones · stock · cobros) con checks. | Hacemos el software que lo resuelve. |
| 4 | 12.8 – 18.8 | `paso 01` · **entender**: tarjeta de videollamada (Lorenzo · ZH / Tu Empresa) con contador que llega a 30:00 en "quita" y se sostiene; debajo, "Notas de la llamada" escritas en vivo con tres hallazgos marcados y mini tarjetas de prueba. | Partimos con una llamada de 30 minutos para encontrar lo que más tiempo te quita. |
| 5 | 18.8 – 24.8 | `paso 02` · **diseñar**: anillo que se completa (porcentaje → ✓, "propuesta escrita") y fichas alcance · plazo · precio; la propuesta en papel se despliega desde una línea de luz y cae el timbre "SIN SORPRESAS". | Después, una propuesta escrita: alcance, plazo y precio. Sin sorpresas. |
| 6 | 24.8 – 32.0 | `paso 03` · **construir**: "Plan por etapas" → calendario con semanas tachadas y la celda "entrega" encendida en "probar" → panel "Leads que avanzan solos" + chat de WhatsApp (escribiendo… → respuesta → sello "IA · revisado por tu equipo") + tira de KPI. Se desenfoca bajo lo que entra. | Construimos por etapas, con entregas que puedes probar, y usamos IA con revisión humana. |
| 7 | 32.0 – 35.4 | `paso 04` · **mejorar**: tarjeta de propiedad "Propiedad de Tu Empresa" (código fuente · repositorio y accesos · cuentas y dominio) con checks en los beats; se encoge hasta un punto. | Y todo queda a nombre de tu empresa. |
| 8 | 35.4 – 45.2 | El punto es el bloque azul del logo: monograma dibujado, "ZH Development", frase palabra por palabra, botón "Agenda tu llamada de 30 min →" con cursor y clic, dominio, equipo (Lorenzo y Nico). Cierre: ícono de Instagram a color con sting grave y @ZHDEVELOPMENT.CL. | ZH Development: software a medida que conecta tu operación. Agenda tu llamada de 30 minutos. Link en la bio. |

Zonas seguras de Instagram respetadas: nada esencial sobre los 220 px superiores ni bajo los 1500 px; la marca de agua
va en fila arriba a la derecha.

## Audio

- Voz: `node scripts/voiceover-single.mjs` (ElevenLabs eleven_v3, una sola llamada con todo el guion; STT scribe_v1 para
  los tiempos por palabra; corte por escena a `public/vo-v5/`; `VO_TAKE=2` pide otra toma). Verificación fonética de
  "ZH" con faster-whisper (debe transcribir "zeta hache", no "age").
- Efectos y música: `node scripts/sfx.mjs` → `public/sfx/*.mp3`, `public/music/bed.mp3` (50 s, −20 LUFS, con graves) y
  `src/v4/audio.ts`. Cues por escena (`sfxCues`) agregados en `src/v4/sound.ts` (`MUSIC_GAIN` 0,8).
- Master: `bash scripts/master.sh out/reel-01-v5.mp4` nivela a −14 LUFS con limitador a −1 dBTP →
  `out/reel-01-v5-master.mp4` (el que se publica).

## Texto para la publicación

Caption: "¿Qué es ZH Development? Software a medida, automatización e IA para empresas que todavía hacen todo a mano. Llamada de 30 min → propuesta escrita → construcción por etapas. Todo queda a tu nombre. Agenda en el link de la bio."

Hashtags (máx. 5): #softwareamedida #automatizacion #pymeschile #inteligenciaartificial #chile

## Cómo se revisó

Cada render pasa por `bash scripts/review.sh out/reel-01-v5.mp4 out/review-v4 10` (hojas de contacto cada 10 frames,
fotogramas por segundo, duración y loudness) y por una verificación independiente de tres lentes (movimiento y
transiciones, estética y legibilidad en celular, audio: niveles, cues y sincronía de la voz por STT). Los hallazgos se
aplican y se vuelve a renderizar.

## Comandos

```
cd video
npm run studio                      # Remotion Studio
npx remotion render src/v4/index.ts ReelV4 out/reel-01-v5.mp4 --concurrency=4
bash scripts/review.sh out/reel-01-v5.mp4 out/review-v4 10
bash scripts/master.sh out/reel-01-v5.mp4
```
