// Re-alinea los tiempos por palabra de la voz (src/v4/vo.json) con una transcripción STT (ElevenLabs scribe_v1)
// de los mp3 ya normalizados en public/vo-v4/. El `alignment` que devuelve eleven_v3 con etiquetas de emoción
// se desplaza hasta 0,5 s respecto a lo que realmente se dice; el STT mide el audio final tal cual se mezcla.
// Uso: node scripts/vo-align.mjs            (todas las escenas)
//      VO_ONLY=chaos,outro node scripts/vo-align.mjs
// Requiere ELEVENLABS_API_KEY en video/.env y ffprobe en el PATH. No gasta caracteres de TTS.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = fs.existsSync(path.join(root, '.env')) ? fs.readFileSync(path.join(root, '.env'), 'utf8') : '';
const key = process.env.ELEVENLABS_API_KEY || env.match(/ELEVENLABS_API_KEY=(.+)/)?.[1]?.trim();
if (!key) throw new Error('Falta ELEVENLABS_API_KEY');

const SET = process.env.VO_SET || 'v4';
const voPath = SET === 'v4' ? path.join(root, 'src', 'v4', 'vo.json') : path.join(root, 'src', 'vo.json');
const audioDir = path.join(root, 'public', SET === 'v4' ? 'vo-v4' : 'vo');
const vo = JSON.parse(fs.readFileSync(voPath, 'utf8'));
const only = process.env.VO_ONLY?.split(',').map((x) => x.trim()).filter(Boolean);

// Palabra mostrada → formas en que el STT puede devolverla (en orden de preferencia).
const forms = {
  ZH: ['zeta ache', 'zh', 'zeta hache', 'zetaache'],
  '30': ['treinta', '30'],
  IA: ['inteligencia artificial', 'ia'],
};
const strip = (w) =>
  w
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '');
const similar = (a, b) => {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  // Similitud por bigramas (tolera una letra distinta en la transcripción).
  const grams = (s) => new Set(Array.from({length: Math.max(1, s.length - 1)}, (_, i) => s.slice(i, i + 2)));
  const A = grams(a);
  const B = grams(b);
  let n = 0;
  for (const g of A) if (B.has(g)) n++;
  return (2 * n) / (A.size + B.size);
};

const probeDuration = (file) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());

const transcribe = async (file) => {
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(file)], {type: 'audio/mpeg'}), path.basename(file));
  form.append('model_id', 'scribe_v1');
  form.append('language_code', 'es');
  form.append('timestamps_granularity', 'word');
  form.append('tag_audio_events', 'false');
  const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {method: 'POST', headers: {'xi-api-key': key}, body: form});
  if (!res.ok) throw new Error(`STT ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.words.filter((w) => w.type === 'word').map((w) => ({text: w.text, start: w.start, end: w.end}));
};

for (const [scene, entry] of Object.entries(vo.scenes)) {
  if (only && !only.includes(scene)) continue;
  const file = path.join(root, 'public', entry.file);
  const heard = await transcribe(file);
  const duration = probeDuration(file);
  let k = 0;
  const warnings = [];
  const captions = entry.captions.map((cap) => {
    const words = cap.words.map((w) => {
      const base = w.text.replace(/[^\p{L}\p{N}]/gu, '');
      const candidates = (forms[base] ?? [w.text]).map((f) => f.split(' ').map(strip));
      let used = null;
      for (const cand of candidates) {
        const slice = heard.slice(k, k + cand.length);
        if (slice.length !== cand.length) continue;
        const ok = cand.every((c, i) => similar(c, strip(slice[i].text)) >= 0.6);
        if (ok) {
          used = slice;
          break;
        }
      }
      if (!used) {
        // Sin coincidencia: consume una palabra oída (la transcripción la escribió distinto) y avisa.
        const slice = heard.slice(k, k + 1);
        if (!slice.length) throw new Error(`${scene}: el STT oyó menos palabras de las esperadas (falta "${w.text}")`);
        warnings.push(`"${w.text}" ≈ "${slice[0].text}"`);
        used = slice;
      }
      k += used.length;
      return {text: w.text, start: Number(used[0].start.toFixed(3)), end: Number(used[used.length - 1].end.toFixed(3))};
    });
    return {text: cap.text, start: words[0].start, end: words[words.length - 1].end, words};
  });
  if (k !== heard.length) warnings.push(`sobran ${heard.length - k} palabras oídas: ${heard.slice(k).map((w) => w.text).join(' ')}`);
  const before = entry.captions.flatMap((c) => c.words);
  const after = captions.flatMap((c) => c.words);
  const shifts = after.map((w, i) => w.start - before[i].start);
  const maxShift = Math.max(...shifts.map(Math.abs));
  // La duración útil es hasta el fin de la última palabra (el mp3 trae silencio de cola que el timeline no debe contar).
  const lastEnd = captions[captions.length - 1].end;
  if (lastEnd > duration + 0.05) throw new Error(`${scene}: el STT devuelve tiempos más allá del archivo (${lastEnd} > ${duration})`);
  vo.scenes[scene] = {...entry, duration: Number(lastEnd.toFixed(3)), captions};
  fs.writeFileSync(voPath, JSON.stringify(vo, null, 2));
  console.log(`${scene}: ${heard.length} palabras oídas · desvío máx ${maxShift.toFixed(2)} s` + (warnings.length ? ` · ${warnings.join(' · ')}` : ''));
}
console.log(`listo: tiempos por palabra medidos sobre el audio final en ${path.relative(root, voPath)}`);
