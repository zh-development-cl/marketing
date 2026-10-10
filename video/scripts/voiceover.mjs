// Genera la voz en off por escena con ElevenLabs: audio normalizado en public/vo/ y tiempos por palabra en src/vo.json.
// Uso: node scripts/voiceover.mjs [voiceId]
// VO_ONLY=hook,outro regenera solo esas escenas (y conserva el resto en src/vo.json). VO_DRY_RUN=1 no llama a la API.
// Requiere ELEVENLABS_API_KEY en video/.env (no se sube al repo) y ffmpeg en el PATH.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = fs.existsSync(path.join(root, '.env')) ? fs.readFileSync(path.join(root, '.env'), 'utf8') : '';
const key = process.env.ELEVENLABS_API_KEY || env.match(/ELEVENLABS_API_KEY=(.+)/)?.[1]?.trim();
if (!key && !process.env.VO_DRY_RUN) throw new Error('Falta ELEVENLABS_API_KEY');

const voiceId = process.argv[2] || 'HkBAWtIjRg1c5ST2J7To'; // JC - Motivational & Uplifting (latino), elegido por Lorenzo
const TARGET_LUFS = -16;
const TRUE_PEAK = -1.5;
const SPEED = Number(process.env.VO_SPEED || '1.0'); // 0.7 a 1.2; JC lee pausado, 1.2 lo deja en ritmo de reel

// Texto tal como se muestra en los subtítulos. Lo que se pronuncia distinto va en `pronounce`.
// Cada escena es una lista de segmentos (frases) de subtítulo.
const SET = process.env.VO_SET || 'v3';
const MODEL = process.env.VO_MODEL || 'eleven_multilingual_v2';
const TEMPO = Number(process.env.VO_TEMPO || '1'); // estirado posterior con ffmpeg atempo (0.9 a 1.3)
const scripts = {
  v4: {
    hook: ['¿Qué es ZH Development?'],
    imagine: ['Imagina que esta es tu empresa:'],
    chaos: ['mensajes, planillas, correos, cobros…', 'todo a mano.'],
    step1: ['Partimos con una llamada de 30 minutos', 'para encontrar lo que más tiempo te quita.'],
    step2: ['Después, una propuesta escrita:', 'alcance, plazo y precio. Sin sorpresas.'],
    step3: ['Construimos por etapas, con entregas que puedes probar,', 'y usamos IA con revisión humana.'],
    step4: ['Y todo queda a nombre de tu empresa.'],
    outro: ['ZH Development: software a medida que conecta tu operación.', 'Agenda tu llamada de 30 minutos. Link en la bio.'],
  },
};
// Etiquetas de interpretación para eleven_v3 (no se pronuncian; se quitan de la alineación).
const tags = {
  hook: '[intrigued]', imagine: '[warm]', chaos: '[slightly tense, building]', step1: '[confident, friendly]',
  step2: '[reassuring]', step3: '[confident]', step4: '[warm]', outro: '[proud, inviting]',
};
const script = SET === 'v4' ? scripts.v4 : {
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
  ZH: 'Zeta Ache',
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

const outDir = path.join(root, 'public', SET === 'v4' ? 'vo-v4' : 'vo');
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
  // Pasada 3: ajuste fino con la misma medida que usamos para verificar (ebur128), sin limitador.
  const measure = (file) => {
    const out = execFileSync('sh', ['-c', `ffmpeg -hide_banner -nostats -i "${file}" -af ebur128 -f null - 2>&1`]).toString();
    const m = out.match(/I:\s+(-?[\d.]+) LUFS/g);
    return Number(m[m.length - 1].match(/-?[\d.]+/)[0]);
  };
  for (let i = 0; i < 3; i++) {
    const got = measure(output);
    if (Math.abs(got - TARGET_LUFS) <= 0.3) break;
    const fixed = `${output}.fix.mp3`;
    // Si hay que subir, un limitador suave mantiene el pico bajo TRUE_PEAK (sin él, chaos quedaba a 0 dBFS).
    const limiter = TARGET_LUFS - got > 0 ? `,alimiter=limit=${Math.pow(10, TRUE_PEAK / 20).toFixed(3)}:attack=3:release=60:level=false` : '';
    execFileSync('ffmpeg', ['-hide_banner', '-nostats', '-y', '-i', output, '-af', `volume=${(TARGET_LUFS - got).toFixed(2)}dB${limiter}`, '-ar', '44100', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '160k', fixed], {stdio: ['ignore', 'pipe', 'pipe']});
    fs.renameSync(fixed, output);
  }
};

const only = process.env.VO_ONLY?.split(',').map((x) => x.trim()).filter(Boolean);
const voPath = SET === 'v4' ? path.join(root, 'src', 'v4', 'vo.json') : path.join(root, 'src', 'vo.json');
const previous = fs.existsSync(voPath) ? JSON.parse(fs.readFileSync(voPath, 'utf8')) : {scenes: {}};
const result = {voiceId, model: MODEL, speed: SPEED, tempo: TEMPO, targetLufs: TARGET_LUFS, scenes: only ? {...previous.scenes} : {}};
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
    const bodyText = MODEL.startsWith('eleven_v3') && tags[scene] ? `${tags[scene]} ${spokenText}` : spokenText;
    const cacheDir = path.join(os.tmpdir(), 'zh-vo-raw');
    fs.mkdirSync(cacheDir, {recursive: true});
    const cacheKey = createHash('sha1').update([voiceId, MODEL, bodyText, SPEED].join('|')).digest('hex');
    const cachePath = path.join(cacheDir, `${scene}-${cacheKey}.json`);
    if (fs.existsSync(cachePath)) {
      data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      console.log(`${scene}: toma en caché`);
    } else {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {'xi-api-key': key, 'content-type': 'application/json'},
      body: JSON.stringify({
        text: bodyText,
        model_id: MODEL,
        voice_settings: MODEL.startsWith('eleven_v3')
          ? {stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true}
          : {stability: 0.5, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true, speed: SPEED},
      }),
    });
    if (!res.ok) throw new Error(`${scene}: ${res.status} ${await res.text()}`);
    data = await res.json();
    if (!data.alignment) throw new Error(`${scene}: la respuesta no trae alignment`);
    fs.writeFileSync(cachePath, JSON.stringify(data));
    }
    fs.writeFileSync(raw, Buffer.from(data.audio_base64, 'base64'));
    if (TEMPO !== 1) {
      const stretched = path.join(tmp, `${scene}-tempo.mp3`);
      execFileSync('ffmpeg', ['-hide_banner', '-nostats', '-y', '-i', raw, '-af', `atempo=${TEMPO}`, '-c:a', 'libmp3lame', '-b:a', '192k', stretched], {stdio: ['ignore', 'pipe', 'pipe']});
      fs.renameSync(stretched, raw);
    }
    normalizeTwoPass(raw, path.join(outDir, file));
  }

  // Tiempos por palabra hablada a partir de los tiempos por carácter.
  const chars = data.alignment.characters;
  const starts = data.alignment.character_start_times_seconds;
  const ends = data.alignment.character_end_times_seconds;
  const duration = ends[ends.length - 1] / TEMPO;
  let spokenWords = [];
  let cur = null;
  chars.forEach((c, i) => {
    if (/\s/.test(c)) {
      if (cur) spokenWords.push(cur);
      cur = null;
    } else {
      if (!cur) cur = {start: starts[i], end: ends[i], text: ''};
      cur.end = ends[i];
      cur.text += c;
    }
  });
  if (cur) spokenWords.push(cur);
  // Quita las palabras que forman la etiqueta "[...]" al inicio (eleven_v3).
  if (MODEL.startsWith('eleven_v3') && tags[scene]) {
    const tagWords = tags[scene].split(/\s+/).length;
    if (spokenWords.length >= tagWords && spokenWords[0].text.startsWith('[')) spokenWords = spokenWords.slice(tagWords);
  }

  // Mapea cada palabra mostrada a las palabras habladas que consume.
  let k = 0;
  const captions = shownWords.map((ws) => {
    const words = ws.map((w) => {
      const {count} = spokenFor(w);
      const slice = spokenWords.slice(k, k + count);
      if (slice.length !== count) throw new Error(`${scene}: faltan palabras habladas para "${w}"`);
      k += count;
      return {text: w, start: slice[0].start / TEMPO, end: slice[slice.length - 1].end / TEMPO};
    });
    return {text: ws.join(' '), start: words[0].start, end: words[words.length - 1].end, words};
  });
  if (k !== spokenWords.length) throw new Error(`${scene}: sobran palabras habladas (${spokenWords.length - k})`);

  result.scenes[scene] = {file: `${path.basename(outDir)}/${file}`, duration, captions};
  // Se escribe después de cada escena: si algo falla a mitad, audio y tiempos quedan consistentes.
  fs.writeFileSync(voPath, JSON.stringify(result, null, 2));
  console.log(`${scene}: ${duration.toFixed(2)} s · ${spokenText.length} chars`);
}

fs.rmSync(tmp, {recursive: true, force: true});
console.log(`total: ${totalChars} caracteres · voz ${voiceId} · normalizado a ${TARGET_LUFS} LUFS`);
