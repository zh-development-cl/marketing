# Reel 01 · ¿Qué es ZH Development?

Formato: 1080x1920, 30 fps, 47,7 s (la duración la fija la voz). Versión actual: **v4** (`video/src/v4/`), construida
replicando la estructura y el nivel de producción del reel de referencia de @nexacgs: una sola composición continua
(sin cortes secos), desenfoque de movimiento por velocidad, grano y viñeta, mockups realistas (teléfono, tarjetas de
WhatsApp/Excel/Gmail/facturas, propuesta en papel, calendario, panel), efectos de sonido por cue y cama musical.
Voz en off en español con la voz "JC" de ElevenLabs (modelo v3, con emoción). Render final masterizado a −14 LUFS.

Composición: `video/src/v4/Reel.tsx` (escenas en `video/src/v4/scenes/`). Timing en frames en `video/src/v4/timeline.ts`,
calculado desde `video/src/v4/vo.json` (tiempos por palabra medidos sobre el audio final).

## Voz en off

> ¿Qué es ZH Development?
> Imagina que esta es tu empresa: mensajes, planillas, correos, cobros… todo a mano.
> Partimos con una llamada de 30 minutos para encontrar lo que más tiempo te quita.
> Después, una propuesta escrita: alcance, plazo y precio. Sin sorpresas.
> Construimos por etapas, con entregas que puedes probar, y usamos IA con revisión humana.
> Y todo queda a nombre de tu empresa.
> ZH Development: software a medida que conecta tu operación.
> Agenda tu llamada de 30 minutos. Link en la bio.

"ZH" se pronuncia "zeta ache" (en el script se escribe "Zeta Ache"), "30" se dice "treinta" e "IA" "inteligencia
artificial" (ver `pronounce` en `video/scripts/voiceover.mjs`). Cada frase lleva una etiqueta de interpretación para
el modelo v3 (`[intrigued]`, `[warm]`, `[confident]`…) y se estira a 1,2x para ritmo de reel. No hay subtítulos: la
tipografía en pantalla es la voz.

## Escenas, segundo a segundo

| # | Tiempo | Pantalla | Voz |
|---|--------|----------|-----|
| 1 | 0.0 – 2.8 | Gancho: "qué es" con subrayado, **ZH** enorme entra con desenfoque, "?" en acento, "development". Una píldora se dibuja alrededor, se llena y se transforma en la pantalla del teléfono; el texto viaja dentro y se apaga cruzándose con el reloj. | ¿Qué es ZH Development? |
| 2 | 2.8 – 5.4 | iPhone con pantalla de bloqueo: caen seis notificaciones (Excel, Contabilidad, WhatsApp, Instagram, Banco, proveedor; las antiguas se pliegan) y el contador "sin responder" sube de 3 a 47 acelerando hasta el empuje de cámara. Texto tecleado arriba a la izquierda. | Imagina que esta es tu empresa: |
| 3 | 5.4 – 11.4 | Caos: 32 tarjetas reales caen en 3D con profundidad de campo; etiquetas grandes en distintos lugares (mensajes · planillas · correos · cobros); "todo a mano" manuscrito, centrado y sostenido ~1 s. | mensajes, planillas, correos, cobros… todo a mano. |
| 4 | 11.4 – 17.3 | `paso 01` · **entender**: las tarjetas se ordenan en un muro de 4×8. Abajo la barra de llamada (foto de Lorenzo) cuenta hasta 30:00 (verde, con campana) al decir "quita". Durante la llamada se iluminan por grupos las tarjetas de cada patrón (chats, planillas, facturas). El muro sale por oleadas fila a fila. | Partimos con una llamada de 30 minutos para encontrar lo que más tiempo te quita. |
| 5 | 17.3 – 20.7 | Tres patrones con latigazo horizontal: 1 preguntas repetidas (chats apilados) · 2 stock en 3 planillas (Excel apilados) · 3 cobros a mano (facturas VENCIDA). | — |
| 6 | 20.7 – 26.9 | `paso 02` · **diseñar**: anillo que se completa (porcentaje → ✓, "propuesta escrita") y fichas alcance · plazo · precio conectadas por líneas. Luego la propuesta en papel se despliega desde una línea de luz ("Propuesta para Tu Empresa · Diagnóstico") y cae el timbre "SIN SORPRESAS". | Después, una propuesta escrita: alcance, plazo y precio. Sin sorpresas. |
| 7 | 26.9 – 34.2 | `paso 03` · **construir**: página "Plan por etapas" → calendario de noviembre con semanas tachadas → panel "Leads que avanzan solos" + chat de WhatsApp (el agente "escribe…", responde, sello "IA · revisado por tu equipo") + tira de KPI. Todo se desenfoca bajo el teléfono que entra. | Construimos por etapas, con entregas que puedes probar, y usamos IA con revisión humana. |
| 8 | 34.2 – 37.2 | `paso 04` · **mejorar**: el mismo teléfono en calma (pantalla pasa de gris a azul), el contador baja de 47 a 0, dos notificaciones del sistema. El teléfono se encoge hasta un punto. | Y todo queda a nombre de tu empresa. |
| 9 | 37.2 – 47.7 | El punto es el bloque azul del logo: el monograma se dibuja, "ZH Development", frase palabra por palabra con negritas, botón "Agenda tu llamada de 30 min →" con cursor que hace clic, dominio, avatares de Lorenzo y Nico "con el equipo de ZH". Cierre: atenuación, ícono de Instagram a color con sting grave, @ZHDEVELOPMENT.CL. | ZH Development: software a medida que conecta tu operación. Agenda tu llamada de 30 minutos. Link en la bio. |

Zonas seguras de Instagram respetadas: nada esencial sobre los 220 px superiores ni bajo los 1500 px (caption y
usuario); la marca de agua va en fila arriba a la derecha.

## Audio

- Voz: `node scripts/voiceover.mjs` con `VO_SET=v4 VO_MODEL=eleven_v3 VO_TEMPO=1.2` → `public/vo-v4/*.mp3` (−16 LUFS).
  Después `node scripts/vo-align.mjs` mide los tiempos por palabra con STT sobre el audio final y los escribe en
  `src/v4/vo.json` (el alignment del modelo v3 se desplazaba hasta 0,5 s).
- Efectos y música: `node scripts/sfx.mjs` (ElevenLabs sound-generation y music) → `public/sfx/*.mp3`,
  `public/music/bed.mp3` (50 s, −20 LUFS, con refuerzo de graves) y `src/v4/audio.ts`. Los cues por escena viven en
  cada escena (`sfxCues`) y se juntan en `src/v4/sound.ts` (`MUSIC_GAIN` 0,8).
- Master: `bash scripts/master.sh out/reel-01-v4.mp4` nivela a −14 LUFS con limitador a −1 dBTP →
  `out/reel-01-v4-master.mp4` (el que se publica).

## Texto para la publicación

Caption: "¿Qué es ZH Development? Software a medida, automatización e IA para empresas que todavía hacen todo a mano. Llamada de 30 min → propuesta escrita → construcción por etapas. Todo queda a tu nombre. Agenda en el link de la bio."

Hashtags (máx. 5): #softwareamedida #automatizacion #pymeschile #inteligenciaartificial #chile

## Cómo se revisó

Cada render pasa por `bash scripts/review.sh out/reel-01-v4.mp4 out/review-v4 10` (hojas de contacto cada 10 frames,
fotogramas por segundo, duración y loudness) y por una verificación independiente de tres lentes contra la referencia
(movimiento y transiciones, estética y legibilidad en celular, audio: niveles, cues y sincronía de la voz por STT).
Los hallazgos se aplican y se vuelve a renderizar hasta que las tres lentes dan "al nivel".

## Comandos

```
cd video
npm run studio                      # Remotion Studio
npx remotion render src/v4/index.ts ReelV4 out/reel-01-v4.mp4 --concurrency=4
bash scripts/review.sh out/reel-01-v4.mp4 out/review-v4 10
bash scripts/master.sh out/reel-01-v4.mp4
```
