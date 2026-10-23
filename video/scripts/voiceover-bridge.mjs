// Agrega UNA escena nueva a una voz en off ya aprobada sin regenerar la toma completa (que cambiaría la actuación de
// todas las frases). Se genera una toma "puente" con la frase nueva entre la escena anterior y la siguiente, para que la
// voz llegue y salga de ella con la misma entonación que en la toma única; se transcribe con STT, se corta solo la escena
// nueva por las mismas reglas de voiceover-single.mjs (palabras medidas + silencio de frontera) y su volumen se iguala al
// de la toma aprobada comparando las escenas vecinas, que están en las dos tomas.
// Uso: VO_SCENE=ciencia VO_SET=schot VO_JSON=src/schot/vo.json node scripts/voiceover-bridge.mjs <voiceId>
//      VO_TAKE=2 fuerza otra toma · VO_DRY_RUN=1 solo muestra el texto
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

const SET = process.env.VO_SET || 'schot';
const SCENE = process.env.VO_SCENE || 'ciencia';
const TAKE = process.env.VO_TAKE || '1';
const voPath = path.resolve(root, process.env.VO_JSON || 'src/schot/vo.json');
const outDir = path.join(root, 'public', `vo-${SET}`);
const vo = JSON.parse(fs.readFileSync(voPath, 'utf8'));
// Misma voz y mismos ajustes que la toma aprobada (quedan en vo.json).
const voiceId = process.argv[2] || vo.voiceId;
const MODEL = vo.model;
const STABILITY = vo.stability;
const TARGET_LUFS = vo.targetLufs ?? -16;
const TRUE_PEAK = -1.5;

// Escena nueva: su texto (tal como se muestra) y entre qué escenas va. El texto de las vecinas sale de vo.json.
const bridges = {
  schot: {
    ciencia: {after: 'tibia', before: 'expo', lines: ['En Ciencia están los trabajos seleccionados:', 'abstracts, e-pósters y videos.']},
  },
};
const def = bridges[SET]?.[SCENE];
if (!def) throw new Error(`No hay puente definido para ${SET}/${SCENE}`);
if (vo.scenes[SCENE] && !process.env.VO_REPLACE) throw new Error(`${SCENE} ya está en ${path.relative(root, voPath)} (VO_REPLACE=1 para reemplazarla)`);

const pronounce = {TibIA: 'Tibia', IA: 'inteligencia artificial', SCHOT: 'Schot', QR: 'cu erre'};
const forms = {epósters: ['e posters', 'eposters', 'i posters', 'iposters'], IA: ['inteligencia artificial', 'ia'], QR: ['cu erre', 'qr', 'cuerre']};
const cleanWord = (w) => w.replace(/[^\p{L}\p{N}]/gu, '');
const spokenFor = (word) => {
  const base = cleanWord(word);
  const p = pronounce[base];
  if (!p) return word;
  const i = word.indexOf(base);
  return `${word.slice(0, i)}${p}${word.slice(i + base.length)}`;
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
// Igual que voiceover-single.mjs (sin realce de agudos ni EQ: la toma aprobada se hizo sin ellos).
if (vo.treble || vo.eq) throw new Error('La toma aprobada usó realce o EQ: hay que replicarlos aquí antes de seguir');
const normalize = (input, output) => {
  const filter = `loudnorm=I=${TARGET_LUFS}:TP=${TRUE_PEAK}:LRA=15`;
  const measured = sh(`ffmpeg -hide_banner -nostats -i "${input}" -af "${filter}:print_format=json" -f null - 2>&1`);
  const s = JSON.parse(measured.match(/\{[\s\S]*\}/)[0]);
  ffmpeg(['-i', input, '-af', `${filter}:measured_I=${s.input_i}:measured_TP=${s.input_tp}:measured_LRA=${s.input_lra}:measured_thresh=${s.input_thresh}:offset=${s.target_offset}:linear=true`, '-ar', '44100', '-ac', '1', '-c:a', 'pcm_s16le', output]);
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

// ---------- 1. Toma puente: escena anterior + nueva + siguiente ----------
const shownOf = (lines) => lines.map((seg) => seg.split(/\s+/).filter(Boolean));
const linesOf = (k) => vo.scenes[k].captions.map((c) => c.text);
const parts = [
  {key: def.after, shown: shownOf(linesOf(def.after))},
  {key: SCENE, shown: shownOf(def.lines)},
  {key: def.before, shown: shownOf(linesOf(def.before))},
];
const fullText = parts.map((p) => p.shown.map((ws) => ws.map(spokenFor).join(' ')).join(' ')).join('\n\n');
console.log(`texto (${fullText.length} caracteres):\n${fullText}\n`);
if (process.env.VO_DRY_RUN) process.exit(0);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vob-'));
const raw = path.join(tmp, 'take.mp3');
const cacheDir = path.join(os.tmpdir(), 'zh-vo-raw');
fs.mkdirSync(cacheDir, {recursive: true});
const cachePath = path.join(cacheDir, `bridge-${createHash('sha1').update([voiceId, MODEL, fullText, TAKE, STABILITY].join('|')).digest('hex')}.mp3`);
if (fs.existsSync(cachePath)) {
  fs.copyFileSync(cachePath, raw);
  console.log('toma en caché');
} else {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {'xi-api-key': key, 'content-type': 'application/json'},
    body: JSON.stringify({text: fullText, model_id: MODEL, voice_settings: {stability: STABILITY, similarity_boost: 0.8, use_speaker_boost: true}}),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`);
  fs.writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
  fs.copyFileSync(raw, cachePath);
  console.log(`toma nueva (${fullText.length} caracteres)`);
}
const wav = path.join(tmp, 'take.wav');
ffmpeg(['-i', raw, '-af', vo.tempo && vo.tempo !== 1 ? `atempo=${vo.tempo}` : 'anull', '-ar', '44100', '-ac', '1', '-c:a', 'pcm_s16le', wav]);
const master = path.join(tmp, 'take-norm.wav');
normalize(wav, master);
fs.copyFileSync(master, path.join(os.tmpdir(), `bridge-${SET}-${SCENE}-take${TAKE}.wav`)); // para escucharla entera

// ---------- 2. Palabras medidas ----------
const heard = await transcribe(master);
let k = 0;
const warnings = [];
const words = {};
for (const p of parts) {
  words[p.key] = p.shown.map((ws) =>
    ws.map((w) => {
      const base = cleanWord(w);
      const candidates = (forms[base] ?? [w]).map((f) => f.split(' ').map(strip));
      let used = null;
      for (const cand of candidates) {
        const slice = heard.slice(k, k + cand.length);
        if (slice.length === cand.length && cand.every((c, i) => similar(c, strip(slice[i].text)) >= 0.6)) {
          used = slice;
          break;
        }
      }
      if (!used) {
        const slice = heard.slice(k, k + 1);
        if (!slice.length) throw new Error(`${p.key}: el STT oyó menos palabras de las esperadas (falta "${w}")`);
        warnings.push(`${p.key}: "${w}" ≈ "${slice[0].text}"`);
        used = slice;
      }
      k += used.length;
      return {text: w, start: used[0].start, end: used[used.length - 1].end};
    }),
  );
}
if (k !== heard.length) warnings.push(`sobran ${heard.length - k} palabras oídas: ${heard.slice(k).map((w) => w.text).join(' ')}`);
console.log(`oído: ${heard.map((w) => w.text).join(' ')}`);
if (warnings.length) console.warn(warnings.join('\n'));

// ---------- 3. Fronteras por energía (mismas reglas que voiceover-single.mjs) ----------
const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', master, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], {maxBuffer: 1 << 30});
const smp = new Float32Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 4));
const HOP = 160;
const nFr = Math.floor(smp.length / HOP);
const envDb = new Float32Array(nFr);
for (let i = 0; i < nFr; i++) {
  let e = 0;
  for (let j = i * HOP; j < (i + 1) * HOP; j++) e += smp[j] * smp[j];
  envDb[i] = 10 * Math.log10(e / HOP + 1e-12);
}
const firstGap = (from, upTo) => {
  let run = -1;
  for (let i = Math.max(0, Math.floor(from * 100)); i <= Math.min(nFr - 1, Math.ceil(upTo * 100)); i++) {
    if (envDb[i] < -42) {
      if (run < 0) run = i;
    } else if (run >= 0) {
      if (i - run >= 12) return [run / 100, i / 100];
      run = -1;
    }
  }
  return null;
};
const flat = (key) => words[key].flat();
for (const [a, b] of [[def.after, SCENE], [SCENE, def.before]]) {
  const lastW = flat(a).at(-1);
  const firstW = flat(b)[0];
  const g = firstGap(lastW.start + 0.05, lastW.start + 3);
  if (!g) continue;
  if (lastW.end < g[0]) lastW.end = g[0];
  if (firstW.start < g[1]) {
    firstW.start = g[1];
    if (firstW.end < g[1] + 0.1) firstW.end = g[1] + 0.1;
  }
}
const cutOf = (key, prevEnd, nextStart) => {
  const ws = flat(key);
  const first = ws[0].start;
  const last = ws.at(-1).end;
  return {first, last, cutStart: Math.max(prevEnd + 0.02, first - 0.12), cutEnd: Math.max(last + 0.03, Math.min(nextStart - 0.12, last + 0.2))};
};
const total = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', master]).toString().trim());
const cuts = {
  [def.after]: cutOf(def.after, 0, flat(SCENE)[0].start),
  [SCENE]: cutOf(SCENE, flat(def.after).at(-1).end, flat(def.before)[0].start),
  [def.before]: cutOf(def.before, flat(SCENE).at(-1).end, total),
};
const cut = (c, out, gainDb = 0) =>
  ffmpeg(['-i', master, '-af', `atrim=${c.cutStart.toFixed(3)}:${c.cutEnd.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=${(c.cutEnd - c.cutStart - 0.03).toFixed(3)}:d=0.03${gainDb ? `,volume=${gainDb.toFixed(2)}dB` : ''}`, '-ar', '44100', '-ac', '1', '-c:a', 'pcm_s16le', out]);

// ---------- 4. Volumen igual al de la toma aprobada ----------
// Las vecinas están en las dos tomas: la diferencia media entre su volumen en la toma aprobada y en la puente es la
// corrección que necesita la escena nueva para sonar igual que todo lo demás.
const deltas = [def.after, def.before].map((nb) => {
  const t = path.join(tmp, `${nb}.wav`);
  cut(cuts[nb], t);
  return measureI(path.join(root, 'public', vo.scenes[nb].file)) - measureI(t);
});
const gain = deltas.reduce((a, b) => a + b, 0) / deltas.length;
console.log(`vecinas: ${deltas.map((d) => d.toFixed(2)).join(' / ')} dB → corrección ${gain.toFixed(2)} dB`);
const file = `${SCENE}.wav`;
const c = cuts[SCENE];
cut(c, path.join(outDir, file), gain);

// ---------- 5. vo.json: la escena nueva entra entre sus vecinas ----------
const captions = words[SCENE].map((ws) => ({
  text: ws.map((w) => w.text).join(' '),
  start: Number((ws[0].start - c.cutStart).toFixed(3)),
  end: Number((ws.at(-1).end - c.cutStart).toFixed(3)),
  words: ws.map((w) => ({text: w.text, start: Number((w.start - c.cutStart).toFixed(3)), end: Number((w.end - c.cutStart).toFixed(3))})),
}));
const entry = {file: `vo-${SET}/${file}`, duration: Number((c.last - c.cutStart).toFixed(3)), captions, bridge: {take: TAKE, between: [def.after, def.before], gainDb: Number(gain.toFixed(2))}};
const scenes = {};
for (const [name, v] of Object.entries(vo.scenes)) {
  if (name === SCENE) continue;
  scenes[name] = v;
  if (name === def.after) scenes[SCENE] = entry;
}
vo.scenes = scenes;
fs.writeFileSync(voPath, JSON.stringify(vo, null, 2));
fs.rmSync(tmp, {recursive: true, force: true});
console.log(`${SCENE}: ${entry.duration.toFixed(2)} s · ${path.relative(root, path.join(outDir, file))} · ${path.relative(root, voPath)}`);
