// Sistema visual v4 del reel: fondo casi negro, un acento azul, mockups que parecen apps reales.
// Lienzo 1080 x 1920 a 30 fps. Todas las medidas en px del lienzo.

export const bg = {
  base: '#07090D',
  deep: '#05070A',
  lift: '#0D1118',
  vignette: 'radial-gradient(ellipse 80% 60% at 50% 45%, rgba(20,26,38,0.55) 0%, rgba(7,9,13,0) 60%, rgba(0,0,0,0.6) 100%)',
} as const;

export const ink = {
  text: '#F2F4F8',
  text2: '#A3ACBC',
  text3: '#737D8F',
  line: '#1B2230',
  line2: '#2A3345',
  panel: '#11151D',
  panel2: '#161B25',
} as const;

export const accent = {
  text: '#8FB0FF', // acento sobre oscuro (textos, "?", etiquetas "paso 0N")
  strong: '#4D7CFF', // trazos, anillos, líneas tachadas
  button: '#306BFF', // botón CTA
  glow: 'rgba(48,107,255,0.45)',
} as const;

export const status = {
  ok: '#3DD68C',
  warn: '#F2A33A',
  danger: '#E5484D',
} as const;

// Colores "de app" para los mockups. Se parecen a las apps reales sin usar sus logos.
export const apps = {
  whatsapp: '#25D366',
  whatsappDark: '#075E54',
  whatsappBubbleIn: '#FFFFFF',
  whatsappBubbleOut: '#D9FDD3',
  whatsappBg: '#EFE7DD',
  excel: '#1D6F42',
  excelLight: '#E6F3EB',
  excelGrid: '#D0D7DE',
  gmailRed: '#EA4335',
  gmailBlue: '#4285F4',
  gmailYellow: '#FBBC04',
  gmailGreen: '#34A853',
  instagram: '#E1306C',
  sticky: '#F8E66A',
  stickyShade: '#E9D34E',
  stickyInk: '#3B3300',
  paper: '#FBFAF6',
  paperInk: '#1C1F26',
  paperMuted: '#6B7280',
  paperLine: '#E6E3DA',
  bank: '#0F172A',
  bankAccent: '#2563EB',
  stamp: '#D7263D',
} as const;

export const fonts = {
  display: 'Funnel Display', // títulos de marca
  sans: 'Funnel Sans', // texto de marca
  ui: 'Inter', // mockups de apps y sistema operativo
  mono: 'IBM Plex Mono', // etiquetas pequeñas, datos
  serif: 'Instrument Serif', // documentos en papel
  hand: 'Caveat', // manuscrita (post-its, "todo a mano")
} as const;

export const radius = {
  card: 14,
  cardSm: 10,
  pill: 999,
  phone: 96,
  screen: 80,
} as const;

export const shadow = {
  card: '0 24px 48px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.45)',
  cardFar: '0 40px 90px rgba(0,0,0,0.6)',
  paper: '0 30px 60px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.4) inset',
  phone: '0 60px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
  glow: (color: string, px = 40) => `0 0 ${px}px ${color}`,
} as const;

// Posición de la marca de agua (ícono de Instagram + usuario) que acompaña todo el reel.
export const watermark = {
  handle: '@ZHDEVELOPMENT.CL',
  x: 930,
  y: 300,
} as const;

export const canvas = {width: 1080, height: 1920, fps: 30} as const;
