# Video demo · App del 62º Congreso SCHOT

Video vertical (1080x1920, 30 fps, ~57 s) para el lanzamiento de la web app oficial del 62º Congreso Chileno de
Ortopedia y Traumatología (SCHOT, Viña del Mar, noviembre 2026). SCHOT lo envía a los asistentes al lanzar la app
para que entiendan qué es, cómo se abre y qué pueden hacer. Mismo nivel de producción que el reel de ZH
(`docs/reels/01-que-es-zh.md`): composición continua, un solo teléfono que recorre todo el video con la app real
en pantalla, transiciones con easing, voz en una toma, subtítulos, efectos por cue y música propia.

Composición: `video/src/schot/` (entry `src/schot/index.ts`, composición `SchotDemo`). Tiempos desde la voz en
`video/src/schot/timeline.ts` (mismo motor que el reel de ZH).

## Público y criterios

- Médicos traumatólogos de ~60 años: una idea por toma, el dedo que toca visible, zoom suave a lo que importa,
  titulares grandes y subtítulos siempre (muchos lo verán sin sonido).
- Marca del congreso (`schot-app-frontend/BRANDBOOK.md`): noche `#2B0054`, uva `#41027A`, violeta `#A200FF` como
  luz, magenta `#E6007E` como acento puntual, lila `#C3AEF2`; tipografía Barlow; la palabra destacada de cada
  titular en degradé lila → rosa (como el «IA» de tibIA).
- Solo funciones que existen en producción. No se muestran: votación, concursos (vacíos), Wi-Fi, traslados,
  asistencia con QR ni certificados (sin confirmar por SCHOT), panel de administración.
- La URL que se comunica es **app.congresoschot2026.com** (congreso-schot.web.app se elimina).

## Voz en off (una toma, voz «Juan» de ElevenLabs, eleven_v3)

> Esta es la app oficial del Congreso SCHOT 2026. Todo el congreso, en tu celular.
> No se descarga: se abre en el navegador, y entras con tu correo y un código. Sin contraseñas.
> Cuéntale a TibIA qué te interesa, y te arma una agenda sin charlas que se crucen.
> En el programa ves lo que está pasando ahora, por sede y por especialidad.
> Agregas una charla con un toque, y la app te lleva hasta la puerta de la sala.
> Además, te avisa diez minutos antes de que empiece.
> ¿Una duda? Pregúntale a TibIA, la asistente con inteligencia artificial que conoce todo el congreso.
> En la expo, junta sellos en los stands, y conecta con colegas escaneando su código.
> Entra a app.congresoschot2026.com y agrégala a tu pantalla de inicio.

```
cd video
VO_SCRIPT=schot VO_SET=schot VO_JSON=src/schot/vo.json VO_TAG='' VO_STABILITY=0.5 VO_TREBLE=0 VO_TEMPO=1.0 \
VO_EQ='equalizer=f=7500:t=q:w=1.5:g=-2.5,highshelf=f=10000:g=-2' \
node scripts/voiceover-single.mjs VvYiNBPylZtUh8Bf6u8l
```

«SCHOT» se pronuncia «Schot» (verificado con Whisper: «Shot», también dentro de la URL). «QR» se evitó en la voz
(el TTS lo decía mal): «escaneando su código».

## Escenas

| # | Escena | Voz | Pantalla |
|---|--------|-----|----------|
| 1 | Apertura | Esta es la app oficial… Todo el congreso, en tu celular. | Sello SCHOT con su luz, «62º Congreso SCHOT»; sube el teléfono con el Programa real. |
| 2 | Entrar | No se descarga… Sin contraseñas. | Safari: la dirección se escribe y carga el ingreso real; correo, «Enviarme un código», 6 dígitos; «Hola, Carolina». |
| 3 | Agenda con IA | Cuéntale a TibIA… sin charlas que se crucen. | Intereses Rodilla y Cadera → «Armar mi agenda» → TibIA arma la agenda (secuencia real) → charlas elegidas. |
| 4 | Programa | En el programa ves lo que está pasando ahora… | Programa del jueves 19 a las 10:20 con la línea «Ahora»; sedes; filtro Rodilla. |
| 5 | Charlas | Agregas una charla con un toque… hasta la puerta de la sala. | Ficha «Lesiones meniscales» → «Agregar a mi agenda» → «Cómo llegar» → plano del Piso 3 con la ruta animada hasta el Auditorio Pacífico. |
| 6 | Avisos | Además, te avisa diez minutos antes… | Mi agenda «Lo próximo · en 10 min» y la notificación con el texto real del backend. |
| 7 | Asistente | ¿Una duda? Pregúntale a TibIA… | El chat sube desde el botón flotante; la mascota saluda; «¿Cuándo es la fiesta de clausura?» y TibIA responde con la tarjeta del lugar. |
| 8 | Expo | En la expo, junta sellos… escaneando su código. | Auspiciadores con logos reales y Pasaporte Virtual → «Sello agregado» → «Mi código QR». |
| 9 | Cierre | Entra a app.congresoschot2026.com y agrégala… | La dirección grande; la pantalla de inicio de iOS con el ícono SCHOT que aparece; sello y datos del congreso. |

## Capturas reales

Las pantallas son capturas reales del build de producción del frontend (`schot-app-frontend`), corrido en local y
conducido con Playwright como un iPhone (390x844 @3x, áreas seguras emuladas, modo instalado), con la API
interceptada: lo público responde con datos reales de producción (programa, sedes, auspiciadores) y lo personal con
una cuenta ficticia («Carolina», Rodilla y Cadera). No se escribe nada en producción. El reloj queda fijo en el
jueves 19 de noviembre a las 10:20, diez minutos antes de «Lesiones meniscales» (Pacífico, Piso 3, Enjoy), para que
toda la historia calce. Las microinteracciones (estrella, ruta del plano, agenda de TibIA, respuesta de TibIA,
sello) se grabaron cuadro a cuadro.

`node scripts/schot-shots.mjs <dir de capturas>` copia las capturas a `public/schot/shots/` y junta los
manifiestos (cajas de cada botón tocado) en `src/schot/shots.json`.

## Audio y render

- Música propia: `SFX_ONLY=music MUSIC_NAME=schot-bed MUSIC_SECONDS=66 MUSIC_PROMPT='…' node scripts/sfx.mjs`
  → `public/music/schot-bed.mp3` (no toca la cama del reel de ZH). Efectos: los de `public/sfx/`.
- Render y master:

```
REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell \
  npx remotion render src/schot/index.ts SchotDemo out/schot-demo.mp4 --concurrency=4
bash scripts/review.sh out/schot-demo.mp4 out/review-schot 10
bash scripts/master.sh out/schot-demo.mp4 out/schot-demo-master.mp4 -14
```
