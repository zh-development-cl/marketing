// Genera la voz en off por escena con ElevenLabs: audio normalizado en public/vo/ y tiempos por palabra en src/vo.json.
// Uso: node scripts/voiceover.mjs [voiceId]
// VO_ONLY=hook,outro regenera solo esas escenas (y conserva el resto en src/vo.json). VO_DRY_RUN=1 no llama a la API.
// Requiere ELEVENLABS_API_KEY en video/.env (no se sube al repo) y ffmpeg en el PATH.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = fs.existsSync(path.join(root, '.env')) ? fs.readFileSync(path.join(root, '.env'), 'utf8') : '';
const key = process.env.ELEVENLABS_API_KEY || env.match(/ELEVENLABS_API_KEY=(.+)/)?.[1]?.trim();
if (!key && !process.env.VO_DRY_RUN) throw new Error('Falta ELEVENLABS_API_KEY');

const voiceId = process.argv[2] || '0cheeVA5B3Cv6DGq65cT'; // Alejandro - Conversations (chileno)
const model = 'eleven_multilingual_v2';
const TARGET_LUFS = -16;
const TRUE_PEAK = -1.5;

// Texto tal como se muestra en los subtítulos. Lo que se pronuncia distinto va en `pronounce`.
// Cada escena es una lista de segmentos (frases) de subtítulo.
const script = {
  hook: ['¿Qué es ZH Development?'],
  imagine: ['Imagina que esta es tu empresa:'],
  chaos: ['mensajes, planillas, correos, cobros…', 'todo a mano.'],
  step1: ['Todo parte con una llamada de 30 minutos', 'para entender tu operación', 'y encontrar lo que más tiempo te quita.'],
  step2: ['Después recibes una propuesta escrita,', 'con alcance, plazo y precio.'],
  step3: ['Construimos por etapas,', 'con entregas que puedes probar,', 'y usamos IA solo donde aporta,', 'siempre con revisión humana.'],
  step4: ['Cuando está en uso, lo seguimos mejorando contigo.', 'Y todo queda a nombre de tu empresa.'],
  outro: ['Somos ZH Development:', 'software a medida que conecta tu operación.', 'Agenda tu llamada de 30 minutos en el link de la bio.'],
};

// Palabra mostrada → cómo se pronuncia (varias palabras permitidas). Se compara sin puntuación.
const pronounce = {
  ZH: 'Zeta Hache',
  '30': 'treinta',
  IA: 'inteligencia artificial',
};

const clean = (w) => w.replace(/[^\p{L}\p{N}]/gu, '');
const spokenFor = (word) => {
  const base = clean(word);
  const p = pronounce[base];
  if (!p) return {spoken: word, count: 1};
  // Conserva la puntuación que rodea a la palabra.
  const lead = word.slice(0, word.indexOf(base));
  const trail = word.slice(word.indexOf(base) + base.length);
  return {spoken: `${lead}${p}${trail}`, count: p.split(' ').length};
};

const outDir = path.join(root, 'public', 'vo');
fs.mkdirSync(outDir, {recursive: true});
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vo-'));

const normalizeTwoPass = (input, output) => {
  const filter = `loudnorm=I=${TARGET_LUFS}:TP=${TRUE_PEAK}:LRA=15`;
  // Pasada 1: medir. ffmpeg imprime el JSON por stderr.
  const measured = execFileSync('sh', ['-c', `ffmpeg -hide_banner -nostats -i "${input}" -af "${filter}:print_format=json" -f null - 2>&1`]).toString();
  const m = measured.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('loudnorm no devolvió medición');
  const s = JSON.parse(m[0]);
  // Pasada 2: aplicar en modo lineal (misma ganancia en todo el clip, sin cambiar la duración).
  execFileSync('ffmpeg', [
    '-hide_banner', '-nostats', '-y', '-i', input,
    '-af', `${filter}:measured_I=${s.input_i}:measured_TP=${s.input_tp}:measured_LRA=${s.input_lra}:measured_thresh=${s.input_thresh}:offset=${s.target_offset}:linear=true`,
    '-ar', '44100', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '160k', output,
  ], {stdio: ['ignore', 'pipe', 'pipe']});
  // Pasada 3: en clips cortos el modo lineal topa con el pico y se queda corto; se corrige con ganancia y limitador.
  const check = execFileSync('sh', ['-c', `ffmpeg -hide_banner -nostats -i "${output}" -af "${filter}:print_format=json" -f null - 2>&1`]).toString();
  const got = Number(JSON.parse(check.match(/\{[\s\S]*\}/)[0]).input_i);
  if (Math.abs(got - TARGET_LUFS) > 0.3) {
    const fixed = `${output}.fix.mp3`;
    execFileSync('ffmpeg', [
      '-hide_banner', '-nostats', '-y', '-i', output,
      '-af', `volume=${(TARGET_LUFS - got).toFixed(2)}dB,alimiter=limit=${Math.pow(10, TRUE_PEAK / 20).toFixed(3)}:attack=5:release=50`,
      '-ar', '44100', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '160k', fixed,
    ], {stdio: ['ignore', 'pipe', 'pipe']});
    fs.renameSync(fixed, output);
  }
};

const only = process.env.VO_ONLY?.split(',').map((x) => x.trim()).filter(Boolean);
const voPath = path.join(root, 'src', 'vo.json');
const previous = fs.existsSync(voPath) ? JSON.parse(fs.readFileSync(voPath, 'utf8')) : {scenes: {}};
const result = {voiceId, model, targetLufs: TARGET_LUFS, scenes: only ? {...previous.scenes} : {}};
let totalChars = 0;

for (const [scene, segments] of Object.entries(script)) {
  if (only && !only.includes(scene)) continue;
  // Palabras mostradas y su versión hablada, segmento por segmento.
  const shownWords = segments.map((seg) => seg.split(/\s+/).filter(Boolean));
  const spokenText = shownWords.map((ws) => ws.map((w) => spokenFor(w).spoken).join(' ')).join(' ');
  totalChars += spokenText.length;

  const raw = path.join(tmp, `${scene}.mp3`);
  const file = `${scene}.mp3`;
  let data;
  if (process.env.VO_DRY_RUN) {
    // Sin gastar caracteres: alineación uniforme (70 ms por carácter) y audio en silencio.
    const chars = [...spokenText];
    const starts = chars.map((_, i) => i * 0.07);
    data = {alignment: {characters: chars, character_start_times_seconds: starts, character_end_times_seconds: starts.map((t) => t + 0.07)}};
    execFileSync('ffmpeg', ['-hide_banner', '-nostats', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', String(chars.length * 0.07), '-c:a', 'libmp3lame', '-b:a', '64k', path.join(outDir, file)], {stdio: 'ignore'});
  } else {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {'xi-api-key': key, 'content-type': 'application/json'},
      body: JSON.stringify({
        text: spokenText,
        model_id: model,
        voice_settings: {stability: 0.55, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true},
      }),
    });
    if (!res.ok) throw new Error(`${scene}: ${res.status} ${await res.text()}`);
    data = await res.json();
    if (!data.alignment) throw new Error(`${scene}: la respuesta no trae alignment`);
    fs.writeFileSync(raw, Buffer.from(data.audio_base64, 'base64'));
    normalizeTwoPass(raw, path.join(outDir, file));
  }

  // Tiempos por palabra hablada a partir de los tiempos por carácter.
  const chars = data.alignment.characters;
  const starts = data.alignment.character_start_times_seconds;
  const ends = data.alignment.character_end_times_seconds;
  const duration = ends[ends.length - 1];
  const spokenWords = [];
  let cur = null;
  chars.forEach((c, i) => {
    if (/\s/.test(c)) {
      if (cur) spokenWords.push(cur);
      cur = null;
    } else {
      if (!cur) cur = {start: starts[i], end: ends[i]};
      cur.end = ends[i];
    }
  });
  if (cur) spokenWords.push(cur);

  // Mapea cada palabra mostrada a las palabras habladas que consume.
  let k = 0;
  const captions = shownWords.map((ws) => {
    const words = ws.map((w) => {
      const {count} = spokenFor(w);
      const slice = spokenWords.slice(k, k + count);
      if (slice.length !== count) throw new Error(`${scene}: faltan palabras habladas para "${w}"`);
      k += count;
      return {text: w, start: slice[0].start, end: slice[slice.length - 1].end};
    });
    return {text: ws.join(' '), start: words[0].start, end: words[words.length - 1].end, words};
  });
  if (k !== spokenWords.length) throw new Error(`${scene}: sobran palabras habladas (${spokenWords.length - k})`);

  result.scenes[scene] = {file: `vo/${file}`, duration, captions};
  // Se escribe después de cada escena: si algo falla a mitad, audio y tiempos quedan consistentes.
  fs.writeFileSync(voPath, JSON.stringify(result, null, 2));
  console.log(`${scene}: ${duration.toFixed(2)} s · ${spokenText.length} chars`);
}

fs.rmSync(tmp, {recursive: true, force: true});
console.log(`total: ${totalChars} caracteres · voz ${voiceId} · normalizado a ${TARGET_LUFS} LUFS`);
