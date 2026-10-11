# Reel 01 · ¿Qué hacemos en ZH Development?

Formato: 1080x1920, 30 fps, 46,3 s (la duración la fija la voz). Versión actual: **v5** (`video/src/v4/`). Nivel de
producción tomado del reel de referencia de @nexacgs (composición continua sin cortes secos, desenfoque de movimiento
por velocidad, grano y viñeta, mockups realistas, efectos de sonido por cue, cama musical), pero con **concepto propio**
pedido por Lorenzo: la apertura no copia la de la referencia (nada de texto→píldora→teléfono ni "imagina que esta es
tu empresa" con notificaciones). Voz en off en una sola toma con la voz "Juan" de ElevenLabs (modelo v3, elegida por Lorenzo en un
casting de 8 voces), misma voz y tono de principio a fin; "ZH" se pronuncia "zeta hache" (verificado fonéticamente). Render final masterizado a −14 LUFS.

Composición: `video/src/v4/Reel.tsx` (escenas en `video/src/v4/scenes/`). Timing en frames en `video/src/v4/timeline.ts`,
calculado desde `video/src/v4/vo.json` (tiempos por palabra medidos con STT sobre el audio final).

## Voz en off (una sola toma)

> ¿Qué hacemos en ZH Development?
> En tu empresa, el día se va en lo mismo: cotizar por WhatsApp, cuadrar planillas, perseguir pagos.
> Hacemos el software que lo resuelve.
> Partimos con una llamada de 30 minutos para encontrar lo que más tiempo te quita.
> Después, una propuesta escrita: alcance, plazo y precio. Sin sorpresas.
> Construimos por etapas, con entregas que puedes probar, y usamos IA con revisión humana.
> Y todo queda a nombre de tu empresa.
> ZH Development: software a medida que conecta tu operación.
> Agenda tu llamada de 30 minutos. ¿Qué esperas?

En el script se escribe "Zeta Hache", "treinta" e "inteligencia artificial" (ver `pronounce` en
`video/scripts/voiceover-single.mjs`). La toma completa queda en `video/public/vo-v5/toma-completa.wav` y se corta por
escena, a su velocidad natural (sin estirar).

Elección de la voz: Lorenzo eligió a Juan (`VvYiNBPylZtUh8Bf6u8l`) por sonar "más narrador" y pidió emoción; las tomas
con etiquetas intensas y estabilidad baja le sonaron robóticas. Se midieron 19 tomas (ritmo, pausas, variación de tono,
brillo y sibilancia, artefactos y claridad con reconocimiento de voz) y un panel con cinco criterios eligió la toma de
Juan sin etiqueta, con estabilidad 0,5 y sin realce de agudos: la emoción sale de la propia voz. Se le aplica un corte
suave de sibilancia y se alargan tres pausas para que respiren el día y el timbre "Sin sorpresas":

```
VO_TAG='' VO_STABILITY=0.5 VO_TREBLE=0 VO_TEMPO=1.0 \
VO_EQ='equalizer=f=7500:t=q:w=1.5:g=-2.5,highshelf=f=10000:g=-2' \
VO_PAUSES='WhatsApp:0.15,planillas:0.2,precio:0.3' \
node scripts/voiceover-single.mjs VvYiNBPylZtUh8Bf6u8l
```

## Escenas, segundo a segundo

| # | Tiempo | Pantalla | Voz |
|---|--------|----------|-----|
| 1 | 0.0 – 3.0 | Gancho en consola: "~/tu-empresa $" y la pregunta se escribe letra a letra en display ("¿qué hacemos en / ZH / Development?") con un cursor de bloque azul que parpadea; sale hacia arriba con latigazo. | ¿Qué hacemos en ZH Development? |
| 2 | 3.0 – 10.2 | Un día en time-lapse: regla de 08:00 a 19:00 con cabezal que acelera y contador "tareas repetidas hoy" como HUD; tarjetas reales (WhatsApp, Excel, Gmail, facturas, post-its, Instagram, banco) entran por la derecha con su hora y se amontonan; en los beats se iluminan las de cada tipo. Hacia el final el día se desborda: 22 notificaciones más entran cada vez más rápido por los tres bordes, giradas y encimadas, la cámara tiembla y el contador llega a 73. | En tu empresa, el día se va en lo mismo: cotizar por WhatsApp, cuadrar planillas, perseguir pagos. |
| 3 | 10.2 – 13.2 | A las 19:00 nace detrás del montón la ventana de app ZH ("Tu Empresa · sistema") y las mismas 38 tarjetas que se amontonaron vuelan a ella columna por columna (cotizaciones · stock · cobros), se apilan en listas y reciben un check al aterrizar; los contadores por columna suben y en "resuelve" remata un check grande por columna. | Hacemos el software que lo resuelve. |
| 4 | 13.2 – 19.2 | `paso 01` · **entender**: videollamada con la grabación real de un Meet (habla Nico y luego Lorenzo, con fundido cruzado; `video/public/people/meet-a.mp4` y `meet-b.mp4`, silenciadas) y, al empezar la llamada, "Tu Empresa" se une con animación (el video se angosta, entra su recuadro y aparece "Tu Empresa se unió a la llamada"); contador que llega a 30:00 en "quita" y se sostiene; debajo, "Notas de la llamada" escritas en vivo con tres hallazgos marcados y mini tarjetas de prueba. | Partimos con una llamada de 30 minutos para encontrar lo que más tiempo te quita. |
| 5 | 19.2 – 25.5 | `paso 02` · **diseñar**: anillo "escribiendo la propuesta…" → ✓ y fichas alcance · plazo · precio; la propuesta en papel (Resumen: alcance, plazo, precio fijo) se despliega desde una línea de luz y cae el timbre "SIN SORPRESAS" sobre el precio. | Después, una propuesta escrita: alcance, plazo y precio. Sin sorpresas. |
| 6 | 25.5 – 32.7 | `paso 03` · **construir**: "Plan por etapas" → calendario con semanas tachadas y la celda "entrega" encendida en "probar" → panel "Clientes que avanzan solos" + chat de WhatsApp (escribiendo… → respuesta → sello grande "IA · revisado por tu equipo") + tira sobria con tres métricas. Se desenfoca bajo lo que entra. | Construimos por etapas, con entregas que puedes probar, y usamos IA con revisión humana. |
| 7 | 32.7 – 36.1 | `paso 04` · **mejorar**: tarjeta "Propiedad de Tu Empresa" (el sistema completo · claves y accesos · cuentas y dominio · mejoras continuas) con checks en los beats; se encoge hasta un punto. | Y todo queda a nombre de tu empresa. |
| 8 | 36.1 – 46.3 | El punto es el bloque azul del logo: monograma dibujado, "ZH Development", frase palabra por palabra, botón "Agenda tu llamada de 30 min →" con un toque (onda); en "¿Qué esperas?" salta la línea "¿qué esperas?" bajo el botón, y debajo "zhdevelopment.cl · link en la bio" y el equipo (Lorenzo y Nico, fotos de la presentación de la propuesta). El reel termina ahí, en "¿qué esperas?", con un fundido corto a negro (sin tarjeta de Instagram). | ZH Development: software a medida que conecta tu operación. Agenda tu llamada de 30 minutos. ¿Qué esperas? |

Zonas seguras de Instagram respetadas: nada esencial sobre los 220 px superiores ni bajo los 1500 px; la marca de agua
va en fila arriba a la derecha.

## Audio

- Voz: `scripts/voiceover-single.mjs` con los ajustes de arriba (ElevenLabs eleven_v3, una sola llamada con todo el
  guion; STT scribe_v1 para los tiempos por palabra; corte por escena a `public/vo-v5/`; `VO_TAKE=2` pide otra toma).
  `scripts/voice-casting.mjs` genera el mismo tramo con varias voces para comparar. Verificación fonética de
  "ZH" con faster-whisper (debe transcribir "zeta hache", no "age").
- Efectos y música: `node scripts/sfx.mjs` → `public/sfx/*.mp3`, `public/music/bed.mp3` (50 s, −20 LUFS, con graves) y
  `src/v4/audio.ts`. Cues por escena (`sfxCues`) agregados en `src/v4/sound.ts` (`MUSIC_GAIN` 0,8).
- Master: `bash scripts/master.sh out/reel-01-v5.mp4` nivela a −14 LUFS con limitador a −1 dBTP →
  `out/reel-01-v5-master.mp4` (el que se publica).

## Texto para la publicación

Caption: "¿Qué hacemos en ZH Development? Software a medida, automatización e IA para empresas que todavía hacen todo a mano. Llamada de 30 min → propuesta escrita → construcción por etapas. Todo queda a tu nombre. Agenda en el link de la bio."

Hashtags (máx. 5): #softwareamedida #automatizacion #pymeschile #inteligenciaartificial #chile

## Cómo se revisó

Además de las tres lentes técnicas, tres "espectadores" (dueño de pyme, director creativo, motion designer) ven el reel
segundo a segundo y reportan dónde se entiende y dónde no; sus confusiones se corrigen antes de publicar.

Cada render pasa por `bash scripts/review.sh out/reel-01-v5.mp4 out/review-v4 10` (hojas de contacto cada 10 frames,
fotogramas por segundo, duración y loudness) y por una verificación independiente de tres lentes (movimiento y
transiciones, estética y legibilidad en celular, audio: niveles, cues y sincronía de la voz por STT). Los hallazgos se
aplican y se vuelve a renderizar.

Suavidad ("todo smooth", pedido de Lorenzo): un detector de saltos por bloques (diferencia entre frames consecutivos,
`scratchpad/snaps2.py` en la sesión) marca cualquier cambio en seco, y un barrido por escena frame a frame confirma o
refuta cada uno. Regla de la pieza: ningún elemento aparece, desaparece, cambia de texto/estado o salta de posición de
un frame al siguiente sin una transición con easing (fundido, resorte o latigazo con estela de varios frames); los
contadores y relojes cambian de cifra con fundido cruzado, los colores de estado con rampa y los cursores con pulso.

## Comandos

```
cd video
npm run studio                      # Remotion Studio
npx remotion render src/v4/index.ts ReelV4 out/reel-01-v5.mp4 --concurrency=4
bash scripts/review.sh out/reel-01-v5.mp4 out/review-v4 10
bash scripts/master.sh out/reel-01-v5.mp4
```
