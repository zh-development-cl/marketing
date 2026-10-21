// Tokens de marca del 62º Congreso SCHOT para el video demo (fuente: schot-app-frontend/BRANDBOOK.md,
// src/index.css y src/lib/gradients.ts). Lienzo 1080 x 1920 a 30 fps; medidas en px del lienzo.

export const schot = {
  noche: '#2B0054', // base de marca: fondos, botones; lo más oscuro de la marca (nunca #000)
  uva: '#41027A', // tono medio de todos los degradés
  violeta: '#A200FF', // la LUZ: resplandores, anillos de toque. Nunca fondo plano grande
  violetaTexto: '#8A00E6', // inicio del «IA» sobre claro
  magenta: '#E6007E', // acento puntual (~2 %): una cosa por escena
  lila: '#C3AEF2', // cejas/eyebrows y filetes sobre oscuro
  lavanda: '#F9F6FC', // fondo de la app (dentro del teléfono)
  tinta: '#1C1224',
  tintaSuave: '#6B6178',
  casiNegro: '#130D17', // fondo modo oscuro de la app
  noche900: '#1A0033', // sombras de marca
  // Versiones con luz, para texto de acento sobre fondo oscuro
  violetaClaro: '#C38BFF',
  magentaClaro: '#FF4DA6',
} as const;

export const grad = {
  // Firma de la web de SCHOT (banner «Esquema Programa Científico»)
  firma: 'linear-gradient(135deg, #2B0054 0%, #41027A 60%, #E6007E 100%)',
  // Botón principal (.btn-primary), background-size 115 %
  cta: 'linear-gradient(115deg, #2B0054 0%, #41027A 38%, #8A00E6 72%, #E6007E 100%)',
  // Piezas chicas (chips, números, barras): SIN magenta
  fill: 'linear-gradient(135deg, #2B0054 0%, #41027A 45%, #A200FF 100%)',
  // Cuadro de ícono (.brand-tile)
  tile:
    'radial-gradient(90% 90% at 18% 10%, rgba(195,174,242,0.7) 0%, rgba(195,174,242,0) 55%), radial-gradient(85% 85% at 100% 100%, rgba(230,0,126,0.75) 0%, rgba(230,0,126,0) 62%), linear-gradient(150deg, #A200FF 0%, #41027A 55%, #2B0054 100%)',
  // Texto con degradé («IA», palabra destacada). Sobre oscuro va la versión con luz.
  textoSobreOscuro: 'linear-gradient(100deg, #C38BFF 0%, #FF4DA6 100%)',
  textoSobreClaro: 'linear-gradient(100deg, #8A00E6 0%, #E6007E 100%)',
  // Cabecera estática (HEADER_GRADIENT.css)
  cabecera:
    'radial-gradient(90% 150% at 92% 0%, rgba(162,0,255,.7) 0%, rgba(162,0,255,0) 60%), radial-gradient(70% 120% at 100% 100%, rgba(230,0,126,.6) 0%, rgba(230,0,126,0) 62%), linear-gradient(135deg, #2B0054 0%, #41027A 70%, #5A0690 100%)',
} as const;

export const font = {
  sans: '"Barlow", system-ui, sans-serif', // 400-800 (900 solo cifras gigantes)
  cond: '"Barlow Condensed", "Barlow", sans-serif', // 700-800 MAYÚSCULAS, solo momentos de afiche
} as const;

// Escala tipográfica del video (px del lienzo 1080 x 1920)
export const type = {
  eyebrow: {fontFamily: font.sans, fontWeight: 700, fontSize: 32, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: schot.lila},
  h1: {fontFamily: font.sans, fontWeight: 800, fontSize: 104, lineHeight: 1.0, letterSpacing: '-0.012em', color: '#fff'},
  h2: {fontFamily: font.sans, fontWeight: 800, fontSize: 84, lineHeight: 1.02, letterSpacing: '-0.01em', color: '#fff'},
  lead: {fontFamily: font.sans, fontWeight: 500, fontSize: 46, lineHeight: 1.2, color: 'rgba(255,255,255,0.88)'},
  caption: {fontFamily: font.sans, fontWeight: 600, fontSize: 46, lineHeight: 1.18, color: '#fff'},
} as const;

// Curvas de la app (src/components/sponsors/expo.css)
export const ease = {
  ios: [0.32, 0.72, 0, 1] as const, // navegación, hojas, movimientos de cámara del teléfono
  out: [0.23, 1, 0.32, 1] as const, // entradas, fundidos, textos
} as const;

export const shadow = {
  phone:
    '0 0 0 2px rgba(195,174,242,.18), inset 0 0 0 2px rgba(255,255,255,.10), 0 70px 140px -40px rgba(14,0,30,.9), 0 30px 60px -30px rgba(26,0,51,.8), 60px 80px 160px -60px rgba(230,0,126,.35)',
  card: 'inset 0 1px 0 rgba(255,255,255,.7), 0 2px 4px rgba(28,18,36,.05), 0 30px 60px -24px rgba(14,0,30,.7)',
  tile: 'inset 0 1px 0 rgba(255,255,255,.3), inset 0 0 0 1px rgba(255,255,255,.14), 0 14px 30px -12px rgba(30,8,60,.7)',
} as const;
