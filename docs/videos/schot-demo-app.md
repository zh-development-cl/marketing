# Video demo · App del 62º Congreso SCHOT

Video vertical (1080x1920, 30 fps, ~57 s) para el lanzamiento de la web app oficial del 62º Congreso Chileno de
Ortopedia y Traumatología (SCHOT, Viña del Mar, noviembre 2026). SCHOT lo envía a los asistentes al lanzar la app
para que entiendan qué es, cómo se abre y qué pueden hacer. Mismo lenguaje que el reel de ZH
(`docs/reels/01-que-es-zh.md`): composición continua, un solo teléfono que recorre todo el video con la app real
en pantalla, y encima de eso **piezas que saltan**: los contenedores reales de cada pantalla (la barra de Safari,
el campo del correo, los casilleros del código, los chips, las charlas, la notificación, el plano, el sello, el QR)
se desprenden del teléfono y flotan en grande con resorte, inclinación 3D, sombra, brillo y desenfoque de
movimiento; insignias que saltan («Sin contraseñas», «Sin cruces de horario»), estallidos de partículas, un dial que
cuenta, golpes de cámara con temblor, latigazos y volteos 3D entre escenas, titulares que entran palabra por palabra
y un «pop» con su propia altura en cada pieza. Voz en una toma, subtítulos y música propia con el drop sincronizado.

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

## Voz en off (una toma, voz «Juan Carlos» de ElevenLabs, eleven_v4)

La primera versión usaba «Juan» (eleven_v3), la voz ganadora del reel de ZH; en este video sonaba plana. Se hizo
un casting con eleven_v4 (el modelo más expresivo) y ganó «Juan Carlos» (`G4IAP30yc6c1gK0csDfu`): la mejor
inteligibilidad medida con STT, la mayor variación de entonación y timbre cálido. Muestras en
`video/out/casting-schot/` (no se versionan).

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
VO_SCRIPT=schot VO_SET=schot VO_JSON=src/schot/vo.json VO_MODEL=eleven_v4 VO_TAG='' VO_STABILITY=0.5 \
VO_TREBLE=0 VO_TEMPO=1.0 node scripts/voiceover-single.mjs G4IAP30yc6c1gK0csDfu
```

«SCHOT» se pronuncia «Schot» (verificado con Whisper: «Shot», también dentro de la URL). «QR» se evitó en la voz
(el TTS lo decía mal): «escaneando su código». Los cortes por escena se hacen en el silencio real entre frases
(envolvente de energía), no solo con los tiempos del STT, que a veces corría el inicio de una escena dentro de la
última palabra de la anterior.

## Escenas

| # | Escena | Voz | Pantalla y piezas que saltan |
|---|--------|-----|------------------------------|
| 1 | Apertura | Esta es la app oficial… Todo el congreso, en tu celular. | El primer cuadro ya es la portada (miniatura de WhatsApp): sello SCHOT y «62º Congreso SCHOT». Una pieza real de la app salta alrededor del título por palabra (aviso, QR, una charla, el sello de AO Trauma, la respuesta de TibIA, el chip Rodilla); en «Todo» el título se va hacia la cámara, las piezas vuelan al centro y el teléfono sube inclinado con un golpe y destello. Sale con latigazo. |
| 2 | Entrar | No se descarga… Sin contraseñas. | «Descargar la app» se tacha; la barra de Safari salta y la dirección se escribe en grande, se toca «Ir» y vuelve mientras carga el ingreso real; el campo del correo sale ya escrito; los seis casilleros salen y los dígitos caen uno a uno; insignia «Sin contraseñas» con estallido; «Hola, Carolina». |
| 3 | Agenda con IA | Cuéntale a TibIA… sin charlas que se crucen. | La mascota salta junto al titular; Rodilla y Cadera se marcan y saltan una a cada lado; «Armar mi agenda» y la cámara se acerca a TibIA trabajando (secuencia real); las cuatro charlas elegidas salen en cascada y la insignia «Sin cruces de horario» las sella. Volteo 3D del teléfono. |
| 4 | Programa | En el programa ves lo que está pasando ahora… | Programa del jueves 19 a las 10:20: saltan la línea «Ahora 10:20» y «10:30 · Empieza en 10 min»; luego los chips Sheraton y Enjoy; se toca Rodilla y el chip marcado salta con estallido. |
| 5 | Charlas | Agregas una charla con un toque… hasta la puerta de la sala. | Ficha «Lesiones meniscales»: el botón «Agregar a mi agenda» salta, el dedo lo toca en grande y pasa a «En tu agenda» con estallido y temblor; «Cómo llegar» y el plano del Piso 3 sale inclinado como sobre una mesa con la ruta real dibujándose; cae el pin «Pacífico · Piso 3». Latigazo hacia arriba. |
| 6 | Avisos | Además, te avisa diez minutos antes… | Mi agenda; la notificación real del backend salta en grande con golpe de cámara; un dial cuenta hasta «10 min»; la notificación se va y salta la tarjeta «Lo próximo · en 10 min». |
| 7 | Asistente | ¿Una duda? Pregúntale a TibIA… | Insignia «¿Una duda?» y el chat sube desde el botón flotante; la mascota salta; la pregunta «¿Cuándo es la fiesta de clausura?» sale en grande y se envía tocándola; insignia «Asistente con IA»; en «conoce todo el congreso» las secciones de la app saltan alrededor del teléfono; la respuesta con la tarjeta del lugar sale de la pantalla. Latigazo. |
| 8 | Expo | En la expo, junta sellos… escaneando su código. | La tarjeta del Pasaporte Virtual salta y se toca «Escanear sello» sobre ella; sube la hoja real y el sello de AO Trauma cae desde la cámara y se estampa (golpe, temblor, destello, estallido); el avance «13 de 35 sellos» salta y rueda; «Mi código QR»: el QR salta girando y una línea de escaneo lo recorre; insignia «Conecta con colegas». |
| 9 | Cierre | Entra a app.congresoschot2026.com y agrégala… | La dirección en una cápsula que se escribe letra a letra con la voz; los tres pasos de la guía «Instalar la app» saltan uno sobre otro y quedan en abanico; la pantalla de inicio de iOS recibe el ícono SCHOT con estallido; termina en la tarjeta con la dirección, el sello y «Viña del Mar · 18–21 nov 2026» (sin fundido a negro: WhatsApp se queda en el último cuadro). |

Piezas de animación en `video/src/schot/ui/Pop.tsx` (Lift, Badge, Burst, Rolling, Flash, toques sobre piezas
flotantes) y `ui/Stage.tsx` (inclinación 3D, latigazos, temblor, huecos oscurecidos, desenfoque por velocidad).
Todo se declara como datos por escena con frames absolutos derivados de la voz (`scenes/*.tsx`).

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

## Cómo se revisó

- Capturas: control de calidad independiente de cada toma (barra de pestañas opaca porque el desenfoque no se dibuja
  en headless, sugerencias de TibIA fijas entre tomas, brillo de los botones apagado, sin typos de los datos) y una
  ronda de recaptura.
- Video: cinco lentes independientes (comprensión de un médico de ~60 años con y sin sonido, suavidad cuadro a cuadro
  con el detector de saltos, sincronía voz–imagen, marca y legibilidad, audio por stems) y un escéptico que refuta
  cada hallazgo. Se corrigieron todos los confirmados: portada en el primer cuadro, el título detrás del teléfono,
  cortes secos de subtítulos y de la tinta de la barra de estado, halos que quedaban sobre la pantalla siguiente,
  desenfoque de movimiento en los empujes y hojas, cámara que nunca tapa el titular, sincronía de toques y efectos,
  efectos que tapaban palabras clave, y el cierre con la guía de instalación y la dirección legible al final.

## Audio y render

- Música propia: `public/music/schot-drive.mp3`, electrónica enérgica (~128 bpm) generada con la API de música de
  ElevenLabs con un plan por secciones (build de 4,6 s, drop, groove, subida, final y golpe de cierre; plan en
  `video/scripts/schot-music-plan.json`), normalizada a −20 LUFS. Sin desplazarla calza sola: el ritmo entra a los
  4,0 s (sale el título y sube el teléfono), el drop fuerte a los 7,5 s (se tacha «Descargar la app») y el golpe
  final a los ≈55 s (tarjeta de cierre). La cama tranquila anterior (`schot-bed.mp3`) quedó sin uso.
- Efectos: los de `public/sfx/` más variantes hechas con ffmpeg (sin API): `pop-hi`, `pop-mid`, `pop-lo` (el pop
  con otra altura, para que una serie de piezas no suene igual), `swish`, `sparkle` y `boom` (impacto grave
  sintetizado). Cada pieza que salta suena sola (`Demo.tsx`, `autoSfx`).
- Render y master:

```
REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell \
  npx remotion render src/schot/index.ts SchotDemo out/schot-demo.mp4 --concurrency=4
bash scripts/review.sh out/schot-demo.mp4 out/review-schot 10
bash scripts/master.sh out/schot-demo.mp4 out/schot-demo-master.mp4 -14
```
