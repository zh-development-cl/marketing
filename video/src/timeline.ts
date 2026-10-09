// Timing del reel 01 en frames (30 fps). Un cambio aquí mueve escena y subtítulos juntos.
export const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

export const scenes = {
  hook: {from: s(0), dur: s(3)},
  imagine: {from: s(3), dur: s(2.5)},
  chaos: {from: s(5.5), dur: s(4.5)},
  step1: {from: s(10), dur: s(4)},
  step2: {from: s(14), dur: s(4)},
  step3: {from: s(18), dur: s(6)},
  step4: {from: s(24), dur: s(3)},
  outro: {from: s(27), dur: s(6)},
} as const;

export const TOTAL = s(33);

export type Caption = {from: number; to: number; text: string};

export const captions: Caption[] = [
  {from: s(0.2), to: s(2.9), text: '¿Qué es ZH Development?'},
  {from: s(3.0), to: s(5.4), text: 'Imagina que esta es tu empresa:'},
  {from: s(5.5), to: s(8.2), text: 'mensajes, planillas, correos, cobros…'},
  {from: s(8.2), to: s(9.9), text: 'todo a mano.'},
  {from: s(10.0), to: s(12.0), text: 'En ZH partimos con una llamada de 30 minutos'},
  {from: s(12.0), to: s(13.9), text: 'para encontrar lo que más tiempo te quita.'},
  {from: s(14.0), to: s(16.0), text: 'Después recibes una propuesta escrita,'},
  {from: s(16.0), to: s(17.9), text: 'con alcance, plazo y precio.'},
  {from: s(18.0), to: s(20.5), text: 'Construimos por etapas, con entregas que puedes probar,'},
  {from: s(20.5), to: s(23.9), text: 'y usamos IA solo donde aporta, siempre con revisión humana.'},
  {from: s(24.0), to: s(26.9), text: 'Y todo queda a nombre de tu empresa.'},
  {from: s(27.2), to: s(30.0), text: 'Software a medida que conecta tu operación.'},
  {from: s(30.0), to: s(32.8), text: 'Agenda tu llamada de 30 minutos.'},
];
