# Reel v4 · convenciones para construir piezas

Objetivo: igualar el nivel del reel de referencia (@nexacgs). Fotogramas de referencia a resolución completa en
`/tmp/claude-0/-home-user-marketing/a68f421f-8caf-58b0-a645-245f1ecda726/scratchpad/ref/key/` (ver `row_*.jpg` para
comparar de un vistazo) y hojas de contacto en `../sheets/`. Míralos con la herramienta Read antes de diseñar.

## Lienzo y stack

- Remotion 4, React 19, TypeScript estricto. Lienzo 1080 x 1920 px, 30 fps. Todo en px del lienzo.
- Estilos inline (objetos `style`), sin CSS externo ni dependencias nuevas. Íconos como SVG inline.
- Determinista: nada de `Math.random()`, `Date` ni estado. Si hace falta variación, usar `hash(i)` de `src/v4/fx/ease.ts`.
- Tokens en `src/v4/tokens.ts` (colores, fuentes, radios, sombras). Úsalos; no inventes colores salvo los de "apps".
- Fuentes cargadas (familias exactas): `Funnel Display`, `Funnel Sans`, `Inter`, `IBM Plex Mono`, `Instrument Serif`
  (400 normal e italic), `Caveat` (600). Para mockups de apps usa **Inter**; para documentos en papel **Instrument Serif** en
  títulos e **Inter** en cuerpo; manuscrita **Caveat**.
- Helpers de animación en `src/v4/fx/`: `Moving` (motion blur por velocidad), `Streak`, `BlurIn`, `Pop`, `Typewriter`,
  `spreadWords`, `StepTitle`, `BottomLabel`, `tween`, `prog`, `keyframes`, `hash`. Las piezas de UI NO animan por sí
  solas salvo que se indique: reciben props y dibujan un estado. La escena decide cuándo y cómo entran.

## Nivel de acabado (lo que diferencia a la referencia)

- Las tarjetas parecen apps reales: cabecera verde de WhatsApp con avatar y hora, planilla con cabecera verde de Excel y
  grilla con celdas A/B/C y un `#REF!` en rojo, post-it amarillo con texto en Caveat y una esquina con sombra, factura
  blanca con "FACTURA ELECTRÓNICA · N° 1043" y timbre rojo rotado "VENCIDA", correo con la M de colores y asunto
  "RE: RE: RE: cotización", DM de Instagram con avatar y burbuja oscura, tarjeta de banco "Transferencia recibida",
  evento de calendario con bloques de colores, orden de compra. Textos creíbles en español chileno (nombres, montos
  en pesos "$ 384.900", horas "21:40").
- Sombras suaves y profundas (`shadow.card`), bordes de 1 px con un leve brillo arriba
  (`boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)'`), radios de 10 a 14 px, tipografía de 13 a 22 px dentro de las
  tarjetas (son muchas y chicas; lo que importa es que se reconozcan).
- Teléfono: iPhone con isla dinámica, estado (wifi, batería), fecha "lunes 13 de octubre", hora grande "21:47",
  notificaciones con ícono real de app, píldora "12 sin responder" abajo, botones de linterna y cámara, barra inferior.
  Pantalla con degradado azul-gris oscuro y leve reflejo. Bisel oscuro con brillo en el borde.
- Documentos: papel `apps.paper`, tipografía serif para "Propuesta para / Tu Empresa", numerales "01", listas con
  círculos numerados, pie con "ZH DEVELOPMENT SPA" y número de página, y páginas apiladas detrás (2 a 3 hojas
  desplazadas 6 px).

## Cómo verificar lo que construyes

Cada pieza se prueba renderizando un fotograma. Crea un entry propio en `src/v4/dev/<tu-nombre>.tsx` que haga
`registerRoot` con una `Composition` de 1080x1920 que muestre tus piezas sobre `Backdrop` (de `src/v4/fx/Grain.tsx`),
y renderiza con:

```bash
cd /home/user/marketing/video
REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell \
  npx remotion still src/v4/dev/<tu-nombre>.tsx <IdDeComposicion> out/dev/<tu-nombre>.png --frame=30 --log=error
```

Mira el PNG con Read y compáralo con la referencia. Itera hasta que la pieza se vea del mismo nivel. `npx tsc -p
tsconfig.json` debe pasar. No toques archivos fuera de tu carpeta/archivos asignados; no cambies `tokens.ts` ni `fx/`.
Exporta componentes nombrados con props tipadas y documenta en un comentario de una línea qué muestra cada uno.
