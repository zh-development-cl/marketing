// Genera la voz en off por escena con ElevenLabs: audio en public/vo/ y tiempos en src/vo.json.
// Uso: node scripts/voiceover.mjs [voiceId]
// Requiere ELEVENLABS_API_KEY en video/.env (no se sube al repo).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = fs.existsSync(path.join(root, '.env')) ? fs.readFileSync(path.join(root, '.env'), 'utf8') : '';
const key = process.env.ELEVENLABS_API_KEY || env.match(/ELEVENLABS_API_KEY=(.+)/)?.[1]?.trim();
if (!key) throw new Error('Falta ELEVENLABS_API_KEY');

const voiceId = process.argv[2] || '0cheeVA5B3Cv6DGq65cT'; // Alejandro - Conversations (chileno)
const model = 'eleven_multilingual_v2';

// Texto por escena. `say` es lo que se pronuncia; `show` (opcional) es el subtítulo si difiere.
const script = {
  hook: [{say: '¿Qué es ZH Development?'}],
  imagine: [{say: 'Imagina que esta es tu empresa:'}],
  chaos: [{say: 'mensajes, planillas, correos, cobros…'}, {say: 'todo a mano.'}],
  step1: [
    {say: 'En ZH partimos con una llamada de treinta minutos', show: 'En ZH partimos con una llamada de 30 minutos'},
    {say: 'para entender tu operación y encontrar lo que más tiempo te quita.'},
  ],
  step2: [{say: 'Después recibes una propuesta escrita,'}, {say: 'con alcance, plazo y precio.'}],
  step3: [
    {say: 'Construimos por etapas, con entregas que puedes probar,'},
    {say: 'y usamos IA solo donde aporta, siempre con revisión humana.'},
  ],
  step4: [{say: 'Y todo queda a nombre de tu empresa.'}],
  outro: [
    {say: 'ZH Development: software a medida que conecta tu operación.', show: 'Software a medida que conecta tu operación.'},
    {say: 'Agenda tu llamada de treinta minutos.', show: 'Agenda tu llamada de 30 minutos.'},
  ],
};

const outDir = path.join(root, 'public', 'vo');
fs.mkdirSync(outDir, {recursive: true});

const result = {voiceId, model, scenes: {}};
let totalChars = 0;

for (const [scene, segments] of Object.entries(script)) {
  const text = segments.map((s) => s.say).join(' ');
  totalChars += text.length;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {'xi-api-key': key, 'content-type': 'application/json'},
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: {stability: 0.5, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true},
    }),
  });
  if (!res.ok) throw new Error(`${scene}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const file = `${scene}.mp3`;
  fs.writeFileSync(path.join(outDir, file), Buffer.from(data.audio_base64, 'base64'));

  const chars = data.alignment.characters;
  const starts = data.alignment.character_start_times_seconds;
  const ends = data.alignment.character_end_times_seconds;
  const duration = ends[ends.length - 1];

  // Inicio de cada segmento: primer carácter no-espacio de ese segmento dentro del texto completo.
  const joined = chars.join('');
  let cursor = 0;
  const captions = segments.map((s, i) => {
    const idx = joined.indexOf(s.say, cursor);
    if (idx < 0) throw new Error(`${scene}: no encuentro "${s.say}" en la alineación`);
    cursor = idx + s.say.length;
    const start = starts[idx];
    const end = i === segments.length - 1 ? duration : null; // se completa abajo
    return {text: s.show ?? s.say, start, end};
  });
  for (let i = 0; i < captions.length - 1; i++) captions[i].end = captions[i + 1].start;

  result.scenes[scene] = {file: `vo/${file}`, duration, captions};
  console.log(`${scene}: ${duration.toFixed(2)} s · ${text.length} chars`);
}

fs.writeFileSync(path.join(root, 'src', 'vo.json'), JSON.stringify(result, null, 2));
console.log(`total: ${totalChars} caracteres`);
