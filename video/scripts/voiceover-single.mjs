// Voz en off del reel en UNA sola toma (misma voz, mismo tono de principio a fin) con ElevenLabs eleven_v3.
// El texto completo se genera de una vez; luego se transcribe con STT (scribe_v1) para medir cada palabra sobre el
// audio final y se corta por escena en public/vo-v5/<escena>.mp3 con los tiempos en src/v4/vo.json.
// Verificación fonética: Whisper (faster-whisper) debe oír "zeta ache/hache" (no "age/eich/eish"); si no, se pide otra toma.
// Uso: node scripts/voiceover-single.mjs            VO_TAKE=2 fuerza una toma nueva · VO_TEMPO=1.2 · VO_DRY_RUN=1
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

const voiceId = process.argv[2] || 'HkBAWtIjRg1c5ST2J7To'; // JC - Motivational & Uplifting (la voz elegida por Lorenzo)
const MODEL = process.env.VO_MODEL || 'eleven_v3';
const TEMPO = Number(process.env.VO_TEMPO || '1.2');
const TAKE = process.env.VO_TAKE || '1';
const TAG = process.env.VO_TAG || '[confident, warm]'; // una sola etiqueta para toda la toma
const TARGET_LUFS = -16;
const TRUE_PEAK = -1.5;
const SET = process.env.VO_SET || 'v5';
const outDir = path.join(root, 'public', `vo-${SET}`);
const voPath = path.join(root, 'src', 'v4', 'vo.json');

// Guion por escena (texto tal como se muestra). Lo que se pronuncia distinto va en `pronounce`.
const scripts = {
  v5: {
    hook: ['¿Qué es ZH Development?'],
    day: ['En una pyme, el día se va en lo mismo:', 'cotizar por WhatsApp, cuadrar planillas, perseguir pagos.'],
    pitch: ['Hacemos el software que lo resuelve.'],
    step1: ['Partimos con una llamada de 30 minutos', 'para encontrar lo que más tiempo te quita.'],
    step2: ['Después, una propuesta escrita:', 'alcance, plazo y precio. Sin sorpresas.'],
    step3: ['Construimos por etapas, con entregas que puedes probar,', 'y usamos IA con revisión humana.'],
    step4: ['Y todo queda a nombre de tu empresa.'],
    outro: ['ZH Development: software a medida que conecta tu operación.', 'Agenda tu llamada de 30 minutos. Link en la bio.'],
  },
};
const script = scripts[SET];
const pronounce = {ZH: 'Zeta Hache', '30': 'treinta', IA: 'inteligencia artificial'};
// Formas en que el STT puede devolver cada palabra mostrada.
const forms = {ZH: ['zeta hache', 'zeta ache', 'zh', 'zeta eich', 'zeta age'], '30': ['treinta', '30'], IA: ['inteligencia artificial', 'ia']};

const cleanWord = (w) => w.replace(/[^\p{L}\p{N}]/gu, '');
const spokenFor = (word) => {
  const base = cleanWord(word);
  const p = pronounce[base];
  if (!p) return word;
  const lead = word.slice(0, word.indexOf(base));
  const trail = word.slice(word.indexOf(base) + base.length);
  return `${lead}${p}${trail}`;
};
const strip = (w) => w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
const similar = (a, b) => {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const grams = (s) => new Set(Array.from({length: Math.max(1, s.length - 1)}, (_, i) => s.slice(i, i + 2)));
  const A = grams(a);
  const B = grams(b);
  let n = 0;
  for (const g of A) if (B.has(g)) n++;
  return (2 * n) / (A.size + B.size);
};

const sh = (cmd) => execFileSync('sh', ['-c', cmd]).toString();
const ffmpeg = (args) => execFileSync('ffmpeg', ['-hide_banner', '-nostats', '-y', ...args], {stdio: ['ignore', 'pipe', 'pipe']});
const measureI = (file) => {
  const out = sh(`ffmpeg -hide_banner -nostats -i "${file}" -af ebur128 -f null - 2>&1`);
  const m = out.match(/I:\s+(-?[\d.]+) LUFS/g);
  return Number(m[m.length - 1].match(/-?[\d.]+/)[0]);
};
const normalize = (input, output) => {
  const filter = `loudnorm=I=${TARGET_LUFS}:TP=${TRUE_PEAK}:LRA=15`;
  const measured = sh(`ffmpeg -hide_banner -nostats -i "${input}" -af "${filter}:print_format=json" -f null - 2>&1`);
  const s = JSON.parse(measured.match(/\{[\s\S]*\}/)[0]);
  ffmpeg(['-i', input, '-af', `treble=g=2:f=6000:w=0.7,${filter}:measured_I=${s.input_i}:measured_TP=${s.input_tp}:measured_LRA=${s.input_lra}:measured_thresh=${s.input_thresh}:offset=${s.target_offset}:linear=true`, '-ar', '44100', '-ac', '1', '-c:a', 'pcm_s16le', output]);
  for (let i = 0; i < 3; i++) {
    const got = measureI(output);
    if (Math.abs(got - TARGET_LUFS) <= 0.3) break;
    const g = TARGET_LUFS - got;
    const limiter = g > 0 ? `,alimiter=limit=${Math.pow(10, TRUE_PEAK / 20).toFixed(3)}:attack=3:release=60:level=false` : '';
    const fixed = `${output}.fix.wav`;
    ffmpeg(['-i', output, '-af', `volume=${g.toFixed(2)}dB${limiter}`, '-ar', '44100', '-ac', '1', '-c:a', 'pcm_s16le', fixed]);
    fs.renameSync(fixed, output);
  }
};

const transcribe = async (file) => {
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(file)], {type: 'audio/wav'}), path.basename(file));
  form.append('model_id', 'scribe_v1');
  form.append('language_code', 'es');
  form.append('timestamps_granularity', 'word');
  form.append('tag_audio_events', 'false');
  const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {method: 'POST', headers: {'xi-api-key': key}, body: form});
  if (!res.ok) throw new Error(`STT ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.words.filter((w) => w.type === 'word').map((w) => ({text: w.text, start: w.start, end: w.end}));
};

// ---------- 1. Toma única ----------
const order = Object.keys(script);
const shown = Object.fromEntries(order.map((k) => [k, script[k].map((seg) => seg.split(/\s+/).filter(Boolean))]));
const spokenScene = (k) => shown[k].map((ws) => ws.map(spokenFor).join(' ')).join(' ');
const fullText = `${TAG} ${order.map(spokenScene).join('\n\n')}`;
console.log(`texto (${fullText.length} caracteres):\n${fullText}\n`);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vo1-'));
const raw = path.join(tmp, 'take.mp3');
if (process.env.VO_DRY_RUN) {
  ffmpeg(['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', '40', '-c:a', 'libmp3lame', '-b:a', '64k', raw]);
} else {
  const cacheDir = path.join(os.tmpdir(), 'zh-vo-raw');
  fs.mkdirSync(cacheDir, {recursive: true});
  const cacheKey = createHash('sha1').update([voiceId, MODEL, fullText, TAKE].join('|')).digest('hex');
  const cachePath = path.join(cacheDir, `single-${cacheKey}.mp3`);
  if (fs.existsSync(cachePath)) {
    fs.copyFileSync(cachePath, raw);
    console.log('toma en caché');
  } else {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {'xi-api-key': key, 'content-type': 'application/json'},
      body: JSON.stringify({text: fullText, model_id: MODEL, voice_settings: {stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true}}),
    });
    if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`);
    fs.writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
    fs.copyFileSync(raw, cachePath);
    console.log(`toma nueva (${fullText.length} caracteres)`);
  }
}
const stretched = path.join(tmp, 'take-tempo.wav');
ffmpeg(['-i', raw, '-af', TEMPO !== 1 ? `atempo=${TEMPO}` : 'anull', '-ar', '44100', '-ac', '1', '-c:a', 'pcm_s16le', stretched]);
const master = path.join(tmp, 'take-norm.wav');
normalize(stretched, master);
fs.mkdirSync(outDir, {recursive: true});
fs.copyFileSync(master, path.join(outDir, 'toma-completa.wav'));

// ---------- 2. Palabras sobre el audio final ----------
const heard = process.env.VO_DRY_RUN ? [] : await transcribe(master);
let k = 0;
const warnings = [];
const perScene = {};
for (const scene of order) {
  const captions = shown[scene].map((ws) => {
    const words = ws.map((w) => {
      const base = cleanWord(w);
      const candidates = (forms[base] ?? [w]).map((f) => f.split(' ').map(strip));
      let used = null;
      for (const cand of candidates) {
        const slice = heard.slice(k, k + cand.length);
        if (slice.length !== cand.length) continue;
        if (cand.every((c, i) => similar(c, strip(slice[i].text)) >= 0.6)) {
          used = slice;
          break;
        }
      }
      if (!used) {
        const slice = heard.slice(k, k + 1);
        if (!slice.length) throw new Error(`${scene}: el STT oyó menos palabras de las esperadas (falta "${w}")`);
        warnings.push(`${scene}: "${w}" ≈ "${slice[0].text}"`);
        used = slice;
      }
      k += used.length;
      return {text: w, start: used[0].start, end: used[used.length - 1].end};
    });
    return {text: ws.join(' '), start: words[0].start, end: words[words.length - 1].end, words};
  });
  perScene[scene] = captions;
}
if (k !== heard.length) warnings.push(`sobran ${heard.length - k} palabras oídas: ${heard.slice(k).map((w) => w.text).join(' ')}`);
if (warnings.length) console.warn(warnings.join('\n'));

// ---------- 3. Corte por escena ----------
const total = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', master]).toString().trim());
const result = {voiceId, model: MODEL, tempo: TEMPO, take: TAKE, targetLufs: TARGET_LUFS, single: true, scenes: {}};
order.forEach((scene, i) => {
  const caps = perScene[scene];
  const first = caps[0].start;
  const last = caps[caps.length - 1].end;
  const prevEnd = i > 0 ? perScene[order[i - 1]].slice(-1)[0].end : 0;
  const nextStart = i < order.length - 1 ? perScene[order[i + 1]][0].start : total;
  const cutStart = Math.max(prevEnd + 0.02, first - 0.12);
  const cutEnd = Math.min(nextStart - 0.02, last + 0.2);
  const file = `${scene}.wav`; // WAV: una codificación con pérdida menos en la cadena (la voz llega con más aire arriba de 5 kHz)
  // La última escena termina donde termina la toma: se rellena 0,25 s y se funde en 120 ms para que la última palabra no muera cortada.
  const isLast = i === order.length - 1;
  const fadeOut = isLast ? `apad=pad_dur=0.25,afade=t=out:st=${(cutEnd - cutStart + 0.25 - 0.12).toFixed(3)}:d=0.12` : `afade=t=out:st=${(cutEnd - cutStart - 0.03).toFixed(3)}:d=0.03`;
  ffmpeg(['-i', master, '-af', `atrim=${cutStart.toFixed(3)}:${cutEnd.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,${fadeOut}`, '-ar', '44100', '-ac', '1', '-c:a', 'pcm_s16le', path.join(outDir, file)]);
  const captions = caps.map((c) => ({
    text: c.text,
    start: Number((c.start - cutStart).toFixed(3)),
    end: Number((c.end - cutStart).toFixed(3)),
    words: c.words.map((w) => ({text: w.text, start: Number((w.start - cutStart).toFixed(3)), end: Number((w.end - cutStart).toFixed(3))})),
  }));
  result.scenes[scene] = {file: `vo-${SET}/${file}`, duration: Number((last - cutStart).toFixed(3)), captions};
  console.log(`${scene}: ${(last - cutStart).toFixed(2)} s`);
});
fs.writeFileSync(voPath, JSON.stringify(result, null, 2));
fs.rmSync(tmp, {recursive: true, force: true});
console.log(`listo: toma única de ${total.toFixed(1)} s · ${order.length} escenas en ${path.relative(root, outDir)} · tiempos en ${path.relative(root, voPath)}`);
