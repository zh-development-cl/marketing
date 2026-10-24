# Video demo · App del 62º Congreso SCHOT

Video vertical (1080x1920, 30 fps, ~92 s) para el lanzamiento de la web app oficial del 62º Congreso Chileno de
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

**Ritmo (v3, 22-10-2026).** La versión de 57 s era demasiado rápida para procesarla (lo dijo Nicolás, de 22 años; el
público tiene 50 a 70). Se bajó el ritmo sin quitar animación: la voz a su velocidad natural (una versión un 10 %
más lenta sonó «en cámara lenta» y se descartó) con pausas entre ideas (`VO_PAUSES`), aire antes y después de cada escena, resortes suaves,
salidas de al menos medio segundo, cada pieza flotante a la vista lo que tarda en leerse (`holds.ts` en la revisión),
una idea por vez (nada nuevo aparece mientras otra pieza todavía llega), cambios de escena tranquilos (el teléfono se
achica y gira apenas mientras la pantalla cambia con fundido; ya no sale de cuadro), subtítulos más grandes y legibles
antes de que la voz los diga, y efectos y música más bajos bajo la voz. Pasó de 57 a ~76 s.

- Médicos traumatólogos de ~60 años: una idea por toma, el dedo que toca visible, zoom suave a lo que importa,
  titulares grandes y subtítulos siempre (muchos lo verán sin sonido).
- Marca del congreso (`schot-app-frontend/BRANDBOOK.md`): noche `#2B0054`, uva `#41027A`, violeta `#A200FF` como
  luz, magenta `#E6007E` como acento puntual, lila `#C3AEF2`; tipografía Barlow; la palabra destacada de cada
  titular en degradé lila → rosa (como el «IA» de tibIA).
- Solo funciones que existen en producción. No se muestran: votación, concursos (vacíos), Wi-Fi, traslados,
  asistencia con QR ni certificados (sin confirmar por SCHOT), panel de administración.
- La URL que se comunica es **app.congresoschot2026.com** (congreso-schot.web.app se elimina).
- **Sin logos ni nombres de empresas (23-10-2026, Nicolás).** No está claro que se puedan mostrar las marcas de los
  auspiciadores, así que la pestaña Auspiciadores y la ceremonia del sello se recapturaron con la app real y los datos
  de producción anonimizados: todas las marcas se llaman «Auspiciador», sin descripción ni redes, y su logo es el ícono
  del apretón de manos de la propia pestaña; la ruta del sello va sin «?m=», así la app dice «Sumando tu sello…».
  Mismas cajas y misma animación que las capturas originales (que quedan en `video/out/capturas-con-marcas/`, no
  versionadas). Siguen a la vista, porque no son auspiciadores: las sedes del congreso (Sheraton Miramar, Enjoy,
  Valparaíso Sporting), los nombres reales de conferencistas del programa público, el botón «Continuar con Google» del
  ingreso real, la notificación tipo Gmail que se pidió para el código y la hoja de compartir de iOS.
- **Ciencia (23-10-2026, Nicolás).** Pidió incluir la parte científica (trabajos seleccionados, abstracts, e-pósters y
  videos) sin alargar mucho el video: una escena de 6,4 s entre TibIA y la expo (+6,4 s en total). Se muestran trabajos
  reales del endpoint público `/science/works` (787 trabajos al 23-10: 201 orales, 561 e-pósters y 25 videos; 20
  e-pósters ya tienen su PDF y 1 video su archivo): la lista «Destacados» de Rodilla, el resumen del #458, el e-póster
  #266 (gráficos, sin fotos clínicas) y la tarjeta del video #248 (degradé de la app, sin cuadros de cirugía). Quedan
  a la vista, como en el programa, nombres reales de autores y, en la cabecera del póster, el logo pequeño de la
  institución de los autores (no es un auspiciador). No hizo falta la cuenta de Nicolás: la sesión es la simulada.
  El póster es de columna aunque la lista es de Rodilla: en producción ningún e-póster tiene especialidad todavía y la
  app los muestra en todas («561 sin especialidad»). Los de rodilla con PDF son peores para el video: #313 trae tres
  logos grandes de clínicas y una jeringa con sangre, y #46, fotos de la cirugía. Si SCHOT asigna especialidades a los
  e-pósters, conviene volver a capturar uno de rodilla.

## Voz en off (una toma, voz «Oscar – Fluid pitch, easy to listen» de ElevenLabs, eleven_v4)

La toma está en caché (`/tmp/zh-vo-raw`): cambiar velocidad o pausas no vuelve a generar la voz, solo la
transcribe de nuevo. Las palabras de `VO_PAUSES` son las que oye el STT («2026», la URL sin puntos).

La primera versión usaba «Juan» (eleven_v3), la voz ganadora del reel de ZH; en este video sonaba plana. Se hizo
un casting con eleven_v4 (el modelo más expresivo) y ganó «Juan Carlos» (`G4IAP30yc6c1gK0csDfu`): la mejor
inteligibilidad medida con STT, la mayor variación de entonación y timbre cálido. Muestras en
`video/out/casting-schot/` (no se versionan).

**Cuenta Starter (23-10-2026).** Nicolás compró el plan Starter de ElevenLabs. Según el centro de ayuda de ElevenLabs,
lo generado con el plan gratuito no tiene licencia comercial (y este video es para un cliente); con un plan pagado sí.
Por eso la voz se regeneró con la cuenta Starter (clave en `video/.env`, que no se versiona). El plan también habilita
las voces de la biblioteca marcadas `free_users_allowed: false` (189 en español). Nuevo casting
(`video/out/casting-starter/`, 11 voces latinas y chilenas con el mismo texto) y tomas completas de las 4 mejores,
medidas con `voicemetrics` (ritmo, entonación, temblor del tono, artefactos, brillo/sibilancia, STT):
«Alejandro – Corporate and Elegant» (`sDh3eviBhiuHKi0MjTNq`, mexicano adulto, solo planes pagados, la voz de pago
más usada en español) quedó con el mismo ritmo que «Juan Carlos» (+3 %), la misma variación de entonación, el tono
más estable (temblor 0,16 vs 0,20 semitonos), menos artefactos (0,58 vs 0,73 picos/s), más dinámica, el timbre más
cálido y sin «s» silbantes. Descartadas: «Alejandro Ballesteros» (14 % más rápido y sibilante), «Santiago» (sibilante)
y «Enrique M. Nieto» (más rápido y menos melódico). Comparación para escuchar: `video/out/voces/`.

**Voz elegida por Nicolás (23-10-2026): «Oscar».** Le gustó la formalidad de «Santiago» pero le faltaba emoción. Se
buscaron voces parecidas con la API de voces similares de ElevenLabs (`POST /v1/similar-voices`, con la toma de
Santiago y la de Alejandro), se generó la misma muestra con 8 (más Santiago en modo «creativo») y se le pasaron 6 para
escuchar (`video/out/voces/opciones/`). Eligió «Oscar – Fluid pitch, easy to listen» (`3mmJ2Z5SLZ9OkeZZcv5p`, latino
adulto). En la toma completa es la más pausada (6,06 sílabas/s), la de mayor rango de entonación (14,1 semitonos),
la de tono más estable (0,15) y la de menos artefactos (0,24 picos/s, un tercio de la anterior), sin «s» silbantes.
Pendiente de Nicolás: decidir si se regenera la música (también se hizo con el plan gratuito; ver «Audio y render»).

> Esta es la app oficial del Congreso SCHOT 2026. Todo el congreso, en tu celular.
> Se abre en el navegador, y entras con tu correo y un código. Sin contraseñas.
> Cuéntale a TibIA qué te interesa, y te arma una agenda sin charlas que se crucen.
> En el programa ves lo que está pasando ahora, por sede y por especialidad.
> Agregas una charla con un toque, y la app te lleva hasta la puerta de la sala.
> Además, te avisa diez minutos antes de que empiece.
> ¿Una duda? Pregúntale a TibIA, la asistente con inteligencia artificial que conoce todo el congreso.
> En Ciencia están los trabajos seleccionados: abstracts, e-pósters y videos.
> En la expo, junta sellos en los stands, y conecta con colegas escaneando su código.
> Entra a app.congresoschot2026.com y agrégala a tu pantalla de inicio para usarla como una app.

**Cambio de texto (23-10-2026, Nicolás).** Antes la escena 2 decía «No se descarga» y tachaba «Descargar la app»,
lo que contradecía el cierre, que enseña a agregarla a la pantalla de inicio (la idea es que la instalen, para que
funcione mejor). Nicolás eligió entre opciones: la escena 2 solo dice cómo se entra (sin negación, sin insignia
tachada, titular «Entra con tu correo») y el cierre agrega «para usarla como una app».

```
cd video
VO_SCRIPT=schot VO_SET=schot VO_JSON=src/schot/vo.json VO_MODEL=eleven_v4 VO_TAG='' VO_STABILITY=0.5 \
VO_TREBLE=0 VO_TEMPO=1 \
VO_PAUSES='2026:0.6,navegador:0.7,código:1.4,interesa:0.75,ahora:0.6,toque:0.65,duda:0.45,artificial:0.25,expo:0.25,stands:1.4,appcongresoshot2026com:0.6' \
node scripts/voiceover-single.mjs 3mmJ2Z5SLZ9OkeZZcv5p
```

**Frase de Ciencia (23-10-2026).** Para no regenerar la toma aprobada (cambiaría la actuación de todas las frases),
`scripts/voiceover-bridge.mjs` genera una toma «puente» con la escena anterior, la frase nueva y la siguiente (misma
voz y ajustes, leídos de `vo.json`), la transcribe, corta solo la frase nueva con las mismas reglas de frontera e
iguala su volumen al de la toma aprobada comparando las escenas vecinas, que están en las dos (corrección −0,2 dB).
Se hicieron 3 tomas (262 caracteres cada una; `video/out/voces/ciencia/`): la 1 subía mucho el tono en «Ciencia»
(mediana 151 Hz contra ~125 Hz del resto) y la 3 no cerraba la frase; quedó la 2 (133 Hz, «videos» cae como fin de
frase, 2,1 palabras/s como el resto). Dice «e-pósters» como «i-pósters», como se dice en los congresos.

```
cd video
VO_SCENE=ciencia VO_SET=schot VO_JSON=src/schot/vo.json VO_TAKE=2 node scripts/voiceover-bridge.mjs
```

«SCHOT» se pronuncia «Schot» (verificado con Whisper: «Shot», también dentro de la URL). «QR» se evitó en la voz
(el TTS lo decía mal): «escaneando su código». Los cortes por escena se hacen en el silencio real entre frases
(envolvente de energía), no solo con los tiempos del STT, que a veces corría el inicio de una escena dentro de la
última palabra de la anterior.

## Escenas

| # | Escena | Voz | Pantalla y piezas que saltan |
|---|--------|-----|------------------------------|
| 1 | Apertura | Esta es la app oficial… Todo el congreso, en tu celular. | El primer cuadro ya es la portada (miniatura de WhatsApp): sello SCHOT, «App oficial · Viña del Mar 2026» en una píldora blanca, «62º Congreso SCHOT» y «Ortopedia y Traumatología». Durante la primera frase solo está el título: nada flota antes de que aparezca el celular (lo pidió Nicolás el 23-10-2026; el aviso y la sede ya aparecen en sus escenas). Una cosa a la vez: se va el título y sube el teléfono; ya quieto, en «Todo el congreso» saltan a su alrededor cuatro piezas de la app, una por una (QR, un sello de la expo, una charla, el chip Rodilla), y en «en tu celular» cada una entra a su pantalla. |
| 2 | Entrar | Se abre en el navegador… Sin contraseñas. | Titular «Entra con tu correo». La barra de Safari salta y la dirección se escribe en grande, se toca «Ir» y vuelve mientras carga el ingreso real; el campo del correo sale ya escrito; llega el correo con el código como notificación de Gmail (remitente, asunto y vista previa reales del backend: «Congreso SCHOT · 482915 es tu código para el Congreso SCHOT · Vence en 10 minutos y solo sirve una vez.»), se lee solo un segundo, el código se resalta y vuela entero a la fila de casilleros, donde queda escrito; insignia «Sin contraseñas» con estallido; «Hola, Carolina». |
| 3 | Agenda con IA | Cuéntale a TibIA… sin charlas que se crucen. | La mascota salta junto al titular; Rodilla y Cadera se marcan y saltan una a cada lado; «Armar mi agenda» y TibIA trabaja (secuencia real); salen los dos días de la agenda con su encabezado (jueves y viernes: dos charlas a las 08:00 en días distintos, no un cruce) y la insignia «Sin cruces de horario» los sella. |
| 4 | Programa | En el programa ves lo que está pasando ahora… | Programa del jueves 19 a las 10:20: salta la línea «Ahora 10:20» y vuelve en la pausa; «por sede y por especialidad» → la fila de filtros salta, un anillo marca las sedes y luego Rodilla, que se toca; el programa queda filtrado y la cámara se acerca a «Lesiones meniscales». |
| 5 | Charlas | Agregas una charla con un toque… hasta la puerta de la sala. | Ficha «Lesiones meniscales»: el botón «Agregar a mi agenda» salta, el dedo lo toca en grande y pasa a «En tu agenda» con estallido y temblor; «Cómo llegar» y el plano del Piso 3 sale inclinado como sobre una mesa; ahí, ya quieto y en grande, se dibuja la ruta real y cae el pin «Pacífico · Piso 3». |
| 6 | Avisos | Además, te avisa diez minutos antes… | Mi agenda; la notificación real del backend sale en grande y queda sola un momento; en «minutos» aparece debajo el dial «10 min» (el 10 fijo, el anillo se llena). |
| 7 | Asistente | ¿Una duda? Pregúntale a TibIA… | Insignia «¿Una duda?» y el chat sube desde el botón flotante; la mascota salta; la pregunta «¿Cuándo es la fiesta de clausura?» sale en grande, se lee unos dos segundos y se envía tocándola; insignia «Asistente con IA»; la respuesta con la tarjeta del lugar sale de la pantalla, sola, con tiempo para leerla. |
| 8 | Ciencia | En Ciencia están los trabajos seleccionados: abstracts, e-pósters y videos. | La pestaña Ciencia real (Rodilla, «Destacados»: «Orales 23 · E-pósters 561 · Videos 25» y los orales a premio de hoy). En «trabajos seleccionados» un halo marca «Trabajos libres seleccionados por el comité científico del 62º Congreso». El teléfono se aleja y, ya quieto, con «abstracts, e-pósters y videos» salta una pieza real por palabra, cada una desde su lugar en la pantalla: la tarjeta del primer trabajo (#458) se levanta de la lista (queda su hueco oscurecido), llega arriba y ahí se vuelve su resumen, ancho, para que se lea; un e-póster (#266, el PDF que dibuja la app) sale de la pestaña «E-pósters» hacia la izquierda, y la tarjeta de un video (#248) crece casi encima de la pestaña «Videos», a la derecha. Las tres quedan juntas algo más de un segundo y se encogen hacia la expo. |
| 9 | Expo | En la expo, junta sellos… escaneando su código. | La tarjeta del Pasaporte Virtual salta y se toca «Escanear sello» sobre ella; sube la hoja real y, ya quieta, el sello cae desde la cámara y se estampa (golpe leve y estallido); después salta el avance «13 de 35 sellos»; «Mi código QR»: el QR salta girando y una línea de escaneo lo recorre; insignia «Conecta con colegas». |
| 10 | Cierre | Entra a app.congresoschot2026.com y agrégala… | El teléfono muestra la app abierta en Safari (barra real de iOS 26); la dirección en una cápsula que se escribe letra a letra con la voz y debajo «y agrégala a tu pantalla de inicio». Luego el proceso completo dentro del teléfono, como una grabación de pantalla continua (sin cortes ni capturas sueltas): las piezas son las capturas reales de iOS 26 de la guía «Instalar la app» de la propia app (`public/schot/guia/`, las mismas de `InstallGuide.tsx`), recortadas por elemento y animadas como en iOS: se toca ⋯ y el menú crece desde el botón; se toca «Compartir» y sube la hoja; se toca «Ver más» y la hoja se expande con la lista (su fila pasa a «Ver menos», como en el iPhone); se toca «Agregar a Inicio» y sube esa hoja; se toca «Agregar» y Safari se cierra encogiéndose. El teléfono queda quieto y completo durante los pasos, y cada paso dura unos 2 s: arriba una sola etiqueta numerada de ancho fijo cambia con un fundido cruzado (texto de la guía y «en iPhone»): «1 Toca el botón ⋯» → «2 Toca «Compartir»» → «3 Toca «Ver más»» → «4 Toca «Agregar a Inicio»» → «5 Toca «Agregar»»; un marco señala el botón 1,3 s antes de que el dedo lo toque, y el anillo del dedo se apaga antes de que la pantalla responda. La etiqueta pasa a «El ícono SCHOT queda en tu pantalla de inicio» apenas se cierra Safari; la pantalla de inicio (fondo azul violeta, íconos de colores sin marca) recibe el ícono de SCHOT después de la última app, como en la captura real, cuando la cámara terminó de acercarse; el ícono se hunde al tocarlo y la app se abre creciendo desde él, a pantalla completa y sin la barra de Safari. Termina en la tarjeta con la dirección, «y agrégala a tu pantalla de inicio / para usarla como una app» y «En Android, la app también te guía» (quieta, donde estuvieron los pasos). Para cerrar (lo pidió Nicolás el 23-10-2026), el teléfono se funde en el fondo y salta en grande el sello de SCHOT con el mismo sonido de la apertura, con su luz y un estallido, justo cuando se detiene la música (89,5 s); debajo, «62º Congreso SCHOT · Viña del Mar · 18–21 nov 2026». La dirección se queda arriba (sin fundido a negro: WhatsApp se queda en el último cuadro). |

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

Ciencia (23-10-2026) se capturó con el mismo arnés y los datos públicos actuales de `/science/works` y
`/science/works/{n}`; el PDF del e-póster (bucket público del congreso) se sirve desde un archivo local. Como la
pestaña Ciencia y la ficha de un trabajo no usan el área segura de arriba, van en modo de barra opaca (igual que el
Pasaporte y el QR). El Chromium de captura no trae `Map.getOrInsertComputed` ni `Math.sumPrecise`, que usa pdf.js para
dibujar el póster: se agregan en la página y en el worker solo para la captura (la app no se toca).

`node scripts/schot-shots.mjs <dir de capturas>` copia las capturas a `public/schot/shots/` y junta los
manifiestos (cajas de cada botón tocado) en `src/schot/shots.json`.

## Cómo se revisó

- v3 (ritmo pausado): dos rondas de revisión independiente con varios agentes por tramos del video (comprensión de un
  médico de 50 a 70 años con y sin sonido, ritmo, sincronía con la voz, cortes, legibilidad, mezcla medida por stems),
  cada hallazgo intentado refutar por un verificador escéptico y un crítico de completitud. Primera ronda: 21
  problemas confirmados (la apertura con cinco cosas a la vez, el correo del código desarmado antes de leerse, dos
  charlas a las 08:00 que parecían cruzarse, el contador que parpadeaba, los pasos de instalación ilegibles,
  latigazos, música a 10 dB de la voz, entre otros); todos corregidos y confirmados en la segunda ronda, que dejó 7
  detalles menores, también corregidos (el correo se escribe letra a letra, Rodilla queda marcada en la fila
  flotante, la respuesta de TibIA sale junto con su pregunta y con más tiempo, menos efectos sobre «junta sellos»,
  el objetivo del cierre aparece con el primer paso).

- Cierre con el flujo continuo de instalación (23-10-2026): dos rondas independientes (comprensión de un médico de
  50 a 70 años, fidelidad a iOS 26, calidad cuadro a cuadro, código y audio), cada hallazgo intentado refutar por un
  verificador escéptico. Primera ronda: pasos demasiado rápidos (44 cuadros), toque del ícono invisible, anillos que
  quedaban sobre lo que se movía, unión visible en la hoja expandida, cápsula vacía entre pasos, entre otros; todo
  corregido. Segunda ronda (sobre el render final, con audio): confirmó las correcciones y dejó detalles menores
  (parpadeo de la cápsula, la nota de Android sobre la app al abrirse, el ícono en un hueco de la grilla), también
  corregidos. Sin problemas de audio confirmados.
- Escena 2 nueva (23-10-2026): revisión independiente enfocada (apertura y escena 2, sincronía del resto con la toma
  nueva, audio medido). Corregido: la pausa de 0,3 s tras «correo» cortaba la voz encadenada («correo y») con dos
  clics (se sacó; `voiceover-single.mjs` ahora corta en el tramo más silencioso, con fundidos, y avisa si cae en voz
  encadenada); «para usarla como una app» no se veía escrito (va en la tarjeta final); el destello de «toque» tapaba
  la palabra (va al final); el toque de «Ir» caía en el botón de recargar (ahora aparece la tecla «ir» azul de iOS);
  doble imagen al entrar el código (corte directo al código completo); «Sin contraseñas» tapaba el sello de la
  bienvenida (se va antes); el subtítulo dejaba «Sin» solo al final de una línea (espacio duro tras una palabra corta
  que abre oración).
- Escena de Ciencia (23-10-2026): revisión independiente con cuatro lentes (la escena cuadro a cuadro, comprensión de
  un médico de 50 a 70 años con y sin sonido, sincronía del resto del video tras el corrimiento de 193 cuadros, audio
  medido), cada una con verificador escéptico. Sin problemas en la sincronía del resto, el sello final (cae en el corte
  de la música, 89,5 s), la voz nueva (−16,5 LUFS contra −16,2/−16,1 de sus vecinas, tono y espectro dentro de lo de la
  toma aprobada, cortes limpios) ni el empalme de los 3 compases (sobre el tiempo fuerte, sin clic ni salto). Corregido:
  el resumen no se veía salir de la tarjeta #458 (nacía chico y transparente mientras el teléfono se movía; ahora la
  tarjeta se levanta con el teléfono quieto, llega arriba como tarjeta y ahí, nítida, se funde en su resumen; su
  estela de movimiento es más corta, `maxBlur` en `Pop.tsx`), el video parecía salir del póster (cambiaron de lado) y
  un comentario con el tiempo viejo del sello. Una segunda pasada sobre el render final confirmó las correcciones y
  pidió que el cambio de tarjeta a resumen no ocurriera dentro de la estela (corregido). Póster de columna bajo Rodilla: se deja (ver «Público y
  criterios»).
- Voz de Oscar (23-10-2026): revisión independiente del video completo (sincronía voz–imagen y subtítulos en cada
  escena, cierre, mezcla medida) con verificador escéptico. Sin problemas de sincronía, subtítulos ni cierre; un
  hallazgo de audio confirmado (el compás repetido en la música empezaba a mitad de compás), corregido. Como solo
  cambió la música, se volvió a generar solo el audio (`remotion render … --codec=wav` con una configuración sin CRF)
  y se unió al video ya renderizado; el audio nuevo coincide con el anterior (desfase 0) salvo en 74,5–75,5 s.
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

- Música propia: `public/music/schot-drive.mp3`, electrónica alegre y pareja (112 bpm) generada con la API de música
  de ElevenLabs (US$0,15 por minuto) con un plan por secciones que pide bajo y batería hasta el final (plan en
  `video/scripts/schot-music-plan.json`). Edición: el drop de la pista (17,17 s) cae en el toque de «Ir» de la escena 2,
  cuando la app se abre en el navegador (10,23 s; antes caía en el tachado de «Descargar la app», que se quitó). No se
  hizo caer en la llegada del correo (12,7 s) porque la entrada de la pista es una base suave sin bajo, 15 dB más
  baja: el video quedaba casi 13 s sin energía. Se repiten 2 compases exactos (4,284 s, corte en 22,68 s de la pista
  con 25 ms de fundido) y otros 4 compases (8,571 s, corte en 52,14 s) para cubrir la demostración de instalación; la
  música se apaga sola 2 s después de la tarjeta final (89,8 s). Para la escena de Ciencia se repiten 3 compases
  (6,4286 s) justo antes del compás 19 de la pista (57,88 s, tiempo fuerte verificado con el bombo), y la escena dura
  193 cuadros (3 compases redondeados): desde la expo la música es la misma, en el mismo lugar (correlación 0,999,
  desfase 5 ms). El nivel de la cama cambió hasta ±1,5 dB, lento y sin saltos: la pista aprobada (v13) había salido de
  `loudnorm` con ganancia dinámica y la nueva con ganancia lineal (la composición con su dinámica propia); medido, la
  voz sigue 12–15 dB sobre la música en cada escena. Para la próxima edición: cortar desde la edición sin normalizar y
  aplicar una sola ganancia fija o `loudnorm` lineal con valores medidos, y comprobar que sea lineal. La
  pista tiene un ciclo de 4 compases (La bemol – Sol – La bemol – Fa menor); 3 compases solo calzan donde un La bemol
  sigue a otro La bemol, que es justo ese punto. Si hace falta un compás más, repetir uno entero desde
  un tiempo fuerte (p. ej. 68,61–70,755 s de la pista, con el fundido terminando antes del golpe de bombo): en la
  revisión independiente se vio que un compás cortado a mitad dejaba oír 0,4 s del acorde siguiente.
  Licencia: la pista se generó cuando la cuenta estaba en el plan gratuito, que según ElevenLabs no da licencia
  comercial (la música del plan gratuito además exige atribución); para un video de cliente conviene regenerarla con
  la cuenta Starter (sería otra pista con el mismo plan, y habría que volver a editarla). Decisión pendiente de
  Nicolás. Normalizada a −20 LUFS. Bajo la voz queda
  ~15 dB por debajo (`MUSIC_LO` 0,3) y un poco más baja en el cierre, donde se dice la dirección.
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
