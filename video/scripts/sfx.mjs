// Genera los efectos de sonido y la música de fondo del reel v4 con ElevenLabs, los normaliza con ffmpeg
// y escribe src/v4/audio.ts con las duraciones reales (medidas con ffprobe) para que no se desincronicen.
// Uso: node scripts/sfx.mjs           genera efectos + música y escribe audio.ts
//      node scripts/sfx.mjs check     sin llamar a la API: verifica archivos, mide loudness y reescribe audio.ts
// SFX_ONLY=pop,tick,music genera solo esos (el resto se conserva). MUSIC_FALLBACK=1 usa la música sintética sin llamar a la API.
// SFX_RAW_DIR=dir guarda las respuestas crudas de la API (por defecto en el tmp del sistema) y las reutiliza si el prompt no cambió.
// Requiere ELEVENLABS_API_KEY en video/.env (no se sube al repo) y ffmpeg/ffprobe en el PATH.
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] === 'check' ? 'check' : 'generate';
const env = fs.existsSync(path.join(root, '.env')) ? fs.readFileSync(path.join(root, '.env'), 'utf8') : '';
const key = process.env.ELEVENLABS_API_KEY || env.match(/ELEVENLABS_API_KEY=(.+)/)?.[1]?.trim();
const needKey = () => {
  if (!key) throw new Error('Falta ELEVENLABS_API_KEY');
  return key;
};

const SFX_LUFS = -18;
const SFX_TP = -1.5;
const MUSIC_LUFS = -20;
const MUSIC_TP = -2;
const PROMPT_INFLUENCE = 0.65; // 0 a 1: cuánto se apega al texto (0.3 por defecto); alto para efectos literales
const MIN_API_SECONDS = 0.5; // la API no genera menos; lo que sobra respecto a lo pedido se recorta después
const PAD_TO = 4; // s: bajo ~3 s el integrado EBU R128 no es fiable, así que se mide con relleno de silencio (la puerta lo ignora)

// nombre, duración objetivo (s), prompt
const SFX_LIST = [
  ['whoosh-soft', 0.7, 'soft airy whoosh transition, clean, subtle, no music'],
  ['whoosh-hard', 0.6, 'fast cinematic whoosh swish, tight, punchy, no music'],
  ['whip', 0.5, 'quick whip pan swoosh with doppler, short, clean'],
  ['pop', 0.3, 'soft UI pop notification bubble, short, clean'],
  ['tick', 0.2, 'subtle UI tick click, very short, clean'],
  ['click', 0.25, 'mouse click, crisp, single'],
  ['paper', 0.8, 'paper sheet slide and settle, soft, foley'],
  ['stamp', 0.5, 'rubber stamp thud on paper, short'],
  ['rise', 1.2, 'short rising synth riser swell, clean, no drums'],
  ['chime', 1.0, 'soft success chime, two notes, warm, short'],
  ['logo', 1.5, 'deep cinematic logo reveal boom with shimmer tail, short'],
];
const MUSIC_PROMPT =
  'Upbeat minimal corporate tech background music for a 45 second product reel: soft synth plucks, light electronic percussion, warm pads, optimistic and modern, instrumental only, no vocals, steady tempo around 100 bpm, clean intro, builds gently, ends cleanly';
// Con el prompt tal cual y 48 s pedidos, el modelo compuso ~42 s (los "45 segundos" del texto) y rellenó el resto con silencio.
// Se le pide explícitamente que llene la pista y se generan 4 s de margen; el corte final a MUSIC_MS lo hace ffmpeg con fade.
const MUSIC_PROMPT_SUFFIX = '. The music keeps playing at full energy until the very end of the track: no silence, no fade-out and no early ending';
// Duración final de public/music/bed.mp3. MUSIC_SECONDS=52 la alarga hasta lo generado sin volver a llamar a la API
// (la respuesta cruda queda en caché): el timeline v4 hoy suma ~50.6 s, más que los 48 s pedidos.
const MUSIC_MS = Math.round(Number(process.env.MUSIC_SECONDS || '48') * 1000);
const MUSIC_GEN_MS = Math.max(52000, MUSIC_MS + 4000); // duración pedida a la API (margen por si el modelo cierra antes)

const sfxDir = path.join(root, 'public', 'sfx');
const musicDir = path.join(root, 'public', 'music');
const musicFile = path.join(musicDir, 'bed.mp3');
const audioTs = path.join(root, 'src', 'v4', 'audio.ts');
const rawDir = process.env.SFX_RAW_DIR || path.join(os.tmpdir(), 'zh-sfx-raw');
const only = process.env.SFX_ONLY?.split(',').map((x) => x.trim()).filter(Boolean);
const wanted = (name) => !only || only.includes(name);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- ffmpeg ----------
const ffmpeg = (args) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-y', ...args], {encoding: 'utf8', maxBuffer: 64 << 20});
  if (r.status !== 0) throw new Error(`ffmpeg falló (${r.status}): ${(r.stderr || '').trim().split('\n').slice(-4).join(' | ')}`);
  return r.stderr; // ffmpeg escribe mediciones y avisos por stderr
};
// Duración real: suma de muestras decodificadas. En mp3, format.duration incluye el retardo y relleno del codificador
// (~50 ms) que el decodificador descarta, y ese desfase ya se notaría en los cues.
const probeDuration = (file) => {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=sample_rate:frame=nb_samples', '-of', 'json', file], {encoding: 'utf8', maxBuffer: 64 << 20});
  const j = r.status === 0 ? JSON.parse(r.stdout) : null;
  const rate = Number(j?.streams?.[0]?.sample_rate);
  const samples = (j?.frames ?? []).reduce((a, f) => a + Number(f.nb_samples ?? 0), 0);
  if (!rate || !samples) throw new Error(`ffprobe no pudo leer ${path.basename(file)}`);
  return samples / rate;
};
const padFilter = (d) => (d < PAD_TO ? `apad=whole_dur=${PAD_TO},` : '');
const num = (s) => (s === undefined ? NaN : Number(s)); // loudnorm imprime "-inf" en silencio → NaN

// Pasada de medición con loudnorm (JSON por stderr). Clips cortos se miden con relleno.
const measureLoudnorm = (file, lufs, tp) => {
  const d = probeDuration(file);
  const log = ffmpeg(['-i', file, '-af', `${padFilter(d)}loudnorm=I=${lufs}:TP=${tp}:LRA=15:print_format=json`, '-f', 'null', '-']);
  const m = log.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('loudnorm no devolvió medición');
  const s = JSON.parse(m[0]);
  return {d, i: num(s.input_i), tp: num(s.input_tp), lra: num(s.input_lra), thresh: num(s.input_thresh), offset: num(s.target_offset)};
};
// Medida de verificación con ebur128 (la misma que pide la entrega). pad=true rellena clips cortos a PAD_TO s.
const measureEbur = (file, pad) => {
  const d = probeDuration(file);
  const log = ffmpeg(['-i', file, '-af', `${pad ? padFilter(d) : ''}ebur128=peak=true`, '-f', 'null', '-']);
  const I = [...log.matchAll(/I:\s+(-?[\d.]+|-inf) LUFS/g)].pop();
  const P = [...log.matchAll(/Peak:\s+(-?[\d.]+|-inf) dBFS/g)].pop();
  return {d, i: I ? Number(I[1]) : NaN, tp: P ? Number(P[1]) : NaN};
};

// Normaliza a `lufs` LUFS integrados con techo `tp` dBTP, dos pasadas de loudnorm en modo lineal (misma ganancia en todo el
// clip, sin tocar la dinámica). Clips cortos se rellenan a PAD_TO s para medir/aplicar y se recortan a su duración original.
const normalize = (input, output, {lufs, tp, channels, bitrate}) => {
  const s = measureLoudnorm(input, lufs, tp);
  if (!Number.isFinite(s.i)) throw new Error('el audio está en silencio');
  const gain = lufs - s.i;
  let filter;
  let peakLimited = false;
  if (s.tp + gain <= tp) {
    // loudnorm solo entra en modo lineal si measured_LRA ≠ 0; en clips cortos mide 0.00, así que se le pasa 1 (no afecta la ganancia).
    filter = `loudnorm=I=${lufs}:TP=${tp}:LRA=15:measured_I=${s.i}:measured_TP=${s.tp}:measured_LRA=${Math.max(s.lra, 1)}:measured_thresh=${s.thresh}:offset=${s.offset}:linear=true`;
  } else {
    // El pico quedaría sobre el techo: se sube solo hasta el techo. Queda más suave que el objetivo, pero sin aplastar el transitorio.
    filter = `volume=${(tp - s.tp).toFixed(2)}dB`;
    peakLimited = true;
  }
  const trim = s.d < PAD_TO ? `,atrim=0:${s.d.toFixed(4)}` : '';
  // 1) WAV normalizado en float (queda junto a la entrada, en el tmp).
  const wav = path.join(path.dirname(input), `${path.basename(output)}.norm.wav`);
  ffmpeg(['-i', input, '-af', `${padFilter(s.d)}${filter}${trim}`, '-ar', '44100', '-ac', String(channels), '-c:a', 'pcm_f32le', wav]);
  // 2) Codifica y comprueba con la misma medida con la que se verifica (ebur128), hasta ±0.3 LU. El mp3 recorta agudos y en
  //    sonidos tipo ruido (whoosh) baja ~0.5 LU; la corrección se aplica sobre el WAV y se recodifica desde ahí, nunca mp3→mp3
  //    (cada generación vuelve a perder nivel y no converge). Sin pasar del techo de true peak medido en el WAV.
  const enc = ['-ar', '44100', '-ac', String(channels), '-c:a', 'libmp3lame', '-b:a', bitrate];
  const headroom = tp - (s.tp + gain);
  let extra = 0;
  for (let i = 0; i < 3; i++) {
    ffmpeg(['-i', wav, ...(extra ? ['-af', `volume=${extra.toFixed(2)}dB`] : []), ...enc, output]);
    if (peakLimited) break;
    const got = measureEbur(output, true).i;
    if (!Number.isFinite(got) || Math.abs(got - lufs) <= 0.3) break;
    extra = Math.min(extra + (lufs - got), headroom);
  }
  return {peakLimited, gain: (peakLimited ? tp - s.tp : gain) + extra};
};

// ---------- ElevenLabs ----------
const isMp3 = (buf) => buf.length > 1000 && (buf.subarray(0, 3).toString() === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe6) === 0xe2));
// POST JSON → mp3. Reintenta una vez; `bodies` permite un cuerpo alternativo en el reintento.
const fetchMp3 = async (label, url, bodies, timeoutMs) => {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    const body = bodies[Math.min(attempt, bodies.length - 1)];
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {'xi-api-key': needKey(), 'content-type': 'application/json', accept: 'audio/mpeg'},
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const buf = Buffer.from(await res.arrayBuffer());
      if (!res.ok) throw new Error(`HTTP ${res.status} ${buf.toString('utf8').slice(0, 300).replace(/\s+/g, ' ')}`);
      if (!isMp3(buf)) throw new Error(`la respuesta no es mp3 (${res.headers.get('content-type')}, ${buf.length} bytes)`);
      return buf;
    } catch (e) {
      lastErr = e;
      console.warn(`${label}: intento ${attempt + 1} falló: ${e.message}`);
      if (attempt === 0) await sleep(2500);
    }
  }
  throw lastErr;
};
// Respuesta cruda en caché por hash del cuerpo: si el prompt no cambió no se vuelve a gastar crédito.
const cachedMp3 = async (label, url, bodies, timeoutMs) => {
  fs.mkdirSync(rawDir, {recursive: true});
  const hash = createHash('sha1').update(JSON.stringify(bodies[0])).digest('hex').slice(0, 8);
  const file = path.join(rawDir, `${label}-${hash}.mp3`);
  if (fs.existsSync(file)) {
    console.log(`${label}: reutilizo respuesta cruda ${path.basename(file)}`);
    return file;
  }
  fs.writeFileSync(file, await fetchMp3(label, url, bodies, timeoutMs));
  return file;
};

// ---------- efectos ----------
// Mono, sin silencio inicial (-45 dB por pico, deja 5 ms antes del ataque) ni cola inaudible (-55 dB, deja 80 ms). Si la API
// tuvo que generar más de lo pedido (mínimo 0.5 s), se recorta a la duración objetivo con un fade de 30 ms.
const prepareSfx = (raw, target, base) => {
  const clean = `${base}-clean.wav`;
  ffmpeg([
    '-i', raw, '-af',
    'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.005:detection=peak,' +
      'areverse,silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.08:detection=peak,areverse',
    '-ar', '44100', '-ac', '1', '-c:a', 'pcm_f32le', clean,
  ]);
  const d = probeDuration(clean);
  if (d <= target + 0.08) return clean;
  const cut = `${base}-cut.wav`;
  ffmpeg(['-i', clean, '-af', `atrim=0:${target},afade=t=out:st=${(target - 0.03).toFixed(3)}:d=0.03`, '-c:a', 'pcm_f32le', cut]);
  return cut;
};

const makeSfx = async (name, target, prompt, tmp) => {
  const body = {text: prompt, duration_seconds: Math.max(target, MIN_API_SECONDS), prompt_influence: PROMPT_INFLUENCE};
  const raw = await cachedMp3(name, 'https://api.elevenlabs.io/v1/sound-generation', [body], 60_000);
  const prepared = prepareSfx(raw, target, path.join(tmp, name));
  const out = path.join(sfxDir, `${name}.mp3`);
  const {peakLimited, gain} = normalize(prepared, out, {lufs: SFX_LUFS, tp: SFX_TP, channels: 1, bitrate: '160k'});
  const got = measureEbur(out, true);
  console.log(
    `${name.padEnd(12)} ${got.d.toFixed(3)} s · ${got.i.toFixed(1)} LUFS · TP ${got.tp.toFixed(1)} dBTP · ganancia ${gain >= 0 ? '+' : ''}${gain.toFixed(1)} dB` +
      (peakLimited ? ' (limitado por pico: queda bajo el objetivo para no pasar el techo)' : ''),
  );
};

// ---------- música ----------
// Fallback sintético: Cmaj7 · Am7 · Fmaj7 · G(add9), 4 s por acorde (~100 bpm), 48 s. Pad cálido, arpegio de plucks que
// entra de a poco, pulso suave y un hi-hat leve. Estéreo por desafinación cruzada de 2 cents.
const synthMusic = (out) => {
  const channel = (detune) => {
    const i = 'mod(floor(t/4),4)';
    const root = `(if(eq(${i},0),261.63,if(eq(${i},1),220,if(eq(${i},2),174.61,196)))*${detune})`;
    const third = `if(eq(${i},1),1.2,1.25)`; // menor solo en Am
    const seventh = `if(eq(${i},3),2.25,1.875)`; // novena en G, séptima mayor en el resto
    const n = 'mod(floor(t/0.3),8)';
    const ratio = `if(eq(${n},0),1,if(eq(${n},1),1.5,if(eq(${n},2),ld(1),if(eq(${n},3),2,if(eq(${n},4),1.5,if(eq(${n},5),ld(2),if(eq(${n},6),ld(1),3)))))))`;
    const env = 'min(1,mod(t,4)*2)*min(1,(4-mod(t,4))*4)';
    const pad = `0.09*${env}*(sin(2*PI*ld(0)*t)+0.7*sin(2*PI*ld(0)*ld(1)*t)+0.6*sin(2*PI*ld(0)*1.5*t)+0.45*sin(2*PI*ld(0)*ld(2)*t)+0.35*sin(PI*ld(0)*t))`;
    const tt = 'mod(t,0.3)';
    const pluck = `0.13*min(1,t/12)*exp(-${tt}*9)*(sin(2*PI*2*ld(0)*ld(3)*${tt})+0.4*sin(2*PI*4*ld(0)*ld(3)*${tt}))`;
    const tb = 'mod(t,0.6)';
    const kick = `0.28*min(1,t/8)*exp(-${tb}*16)*sin(2*PI*(48+60*exp(-${tb}*30))*${tb})`;
    const hat = `0.04*min(1,t/16)*(random(0)*2-1)*exp(-mod(t+0.3,0.6)*60)`;
    // if(st(..), ...) encadena las asignaciones en orden antes de evaluar la mezcla.
    return `if(st(0,${root}),if(st(1,${third}),if(st(2,${seventh}),if(st(3,${ratio}),${pad}+${pluck}+${kick}+${hat}))))`;
  };
  ffmpeg([
    '-f', 'lavfi', '-i', `aevalsrc='${channel(1.0012)}|${channel(0.9988)}':s=44100:c=stereo:d=${MUSIC_MS / 1000}`,
    '-af', `lowpass=f=6500,aecho=0.8:0.45:80|170:0.18|0.1,atrim=0:${MUSIC_MS / 1000},afade=t=in:d=1`,
    '-c:a', 'pcm_f32le', out,
  ]);
};

// Instante en que la música deja de sonar: inicio del último silencio (< -50 dB) si llega hasta el final; si no, la duración.
const musicalEnd = (file, d) => {
  const log = ffmpeg(['-i', file, '-af', 'silencedetect=n=-50dB:d=0.5', '-f', 'null', '-']);
  const starts = [...log.matchAll(/silence_start: (-?[\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...log.matchAll(/silence_end: (-?[\d.]+)/g)].map((m) => Number(m[1]));
  if (!starts.length) return d;
  const last = starts[starts.length - 1];
  const closed = ends.length === starts.length && ends[ends.length - 1] < d - 0.1;
  return closed ? d : last;
};

const makeMusic = async (tmp) => {
  let raw = null;
  let source = 'elevenlabs';
  if (!process.env.MUSIC_FALLBACK) {
    try {
      const body = {prompt: MUSIC_PROMPT + MUSIC_PROMPT_SUFFIX, music_length_ms: MUSIC_GEN_MS};
      // Primer intento pide instrumental explícito; si el servidor no acepta el campo, el reintento va con el cuerpo mínimo.
      raw = await cachedMp3('music', 'https://api.elevenlabs.io/v1/music', [{...body, force_instrumental: true}, body], 240_000);
    } catch (e) {
      console.warn(`music: la API falló (${e.message}); genero el fallback sintético con ffmpeg`);
    }
  }
  if (!raw) {
    raw = path.join(tmp, 'music-synth.wav');
    synthMusic(raw);
    source = 'synth';
  }
  // Fin real de la música: si la pista termina en silencio antes de MUSIC_MS, se corta ahí (y se avisa) en vez de entregar silencio.
  const d = probeDuration(raw);
  const musicEnd = musicalEnd(raw, d);
  let end = Math.min(MUSIC_MS / 1000, d);
  if (musicEnd < end - 0.5) {
    console.warn(`music: la pista termina a los ${musicEnd.toFixed(1)} s y el resto es silencio; bed.mp3 queda de ${(musicEnd + 0.5).toFixed(1)} s`);
    end = musicEnd + 0.5;
  }
  // Cierre limpio: corte en `end` con fade de 1.5 s, pase lo que pase con la generación.
  const faded = path.join(tmp, 'music-faded.wav');
  // Refuerzo de graves (la referencia tiene energía continua en 60–300 Hz); normalize() vuelve a nivelar después.
  ffmpeg(['-i', raw, '-af', `bass=g=5:f=120:w=0.7,atrim=0:${end.toFixed(3)},afade=t=out:st=${Math.max(0, end - 1.5).toFixed(3)}:d=1.5`, '-ar', '44100', '-ac', '2', '-c:a', 'pcm_f32le', faded]);
  const {peakLimited, gain} = normalize(faded, musicFile, {lufs: MUSIC_LUFS, tp: MUSIC_TP, channels: 2, bitrate: '192k'});
  const got = measureEbur(musicFile, false);
  console.log(
    `${'music/bed'.padEnd(12)} ${got.d.toFixed(2)} s · ${got.i.toFixed(1)} LUFS · TP ${got.tp.toFixed(1)} dBTP · ganancia ${gain >= 0 ? '+' : ''}${gain.toFixed(1)} dB · origen ${source}` +
      (peakLimited ? ' (limitado por pico)' : ''),
  );
  return source;
};

// ---------- audio.ts + verificación ----------
const writeAudioTs = (durations, musicDuration) => {
  const lines = [
    '// Generado por scripts/sfx.mjs: no editar a mano (se reescribe en cada ejecución).',
    '// Rutas relativas a public/ (para staticFile) y duraciones reales medidas con ffprobe.',
    'export const SFX = {',
    ...durations.map(([name, d]) => `  '${name}': {file: 'sfx/${name}.mp3', durationSec: ${d}},`),
    '} as const;',
    '',
    'export type SfxName = keyof typeof SFX;',
    '',
    musicDuration === null
      ? "export const MUSIC = {file: 'music/bed.mp3', durationSec: 0}; // FALTA public/music/bed.mp3: ejecuta node scripts/sfx.mjs"
      : `export const MUSIC = {file: 'music/bed.mp3', durationSec: ${musicDuration}} as const;`,
    '',
  ];
  fs.writeFileSync(audioTs, lines.join('\n'));
};

// Comprueba con ffprobe/ebur128 cada archivo esperado y devuelve las duraciones para audio.ts.
const verify = () => {
  const round = (d) => Number(d.toFixed(3));
  const durations = [];
  const missing = [];
  console.log('\nverificación (ebur128 · entre paréntesis la medida con relleno a 4 s, la válida para clips cortos):');
  for (const [name, target] of SFX_LIST) {
    const file = path.join(sfxDir, `${name}.mp3`);
    if (!fs.existsSync(file)) {
      missing.push(`sfx/${name}.mp3`);
      console.log(`  ${name.padEnd(12)} FALTA`);
      continue;
    }
    const raw = measureEbur(file, false);
    const pad = raw.d < 3 ? measureEbur(file, true) : raw;
    durations.push([name, round(raw.d)]);
    console.log(
      `  ${name.padEnd(12)} ${raw.d.toFixed(3)} s (objetivo ${target}) · I ${String(raw.i).padStart(6)} (${pad.i.toFixed(1)}) LUFS · TP ${raw.tp.toFixed(1)} dBTP`,
    );
  }
  let musicDuration = null;
  if (fs.existsSync(musicFile)) {
    const m = measureEbur(musicFile, false);
    musicDuration = round(m.d);
    console.log(`  ${'music/bed'.padEnd(12)} ${m.d.toFixed(3)} s (objetivo ${MUSIC_MS / 1000}) · I ${m.i.toFixed(1)} LUFS · TP ${m.tp.toFixed(1)} dBTP`);
  } else {
    missing.push('music/bed.mp3');
    console.log(`  ${'music/bed'.padEnd(12)} FALTA`);
  }
  writeAudioTs(durations, musicDuration);
  console.log(`escrito ${path.relative(root, audioTs)} (${durations.length} efectos${musicDuration === null ? ', sin música' : ', música'})`);
  return missing;
};

// ---------- main ----------
fs.mkdirSync(sfxDir, {recursive: true});
fs.mkdirSync(musicDir, {recursive: true});
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sfx-'));
const failed = [];
try {
  if (mode === 'generate') {
    // La música tarda bastante más: se pide primero y se procesa mientras salen los efectos.
    const music = wanted('music') ? makeMusic(tmp).catch((e) => failed.push(`music/bed.mp3 (${e.message})`)) : null;
    for (const [name, target, prompt] of SFX_LIST) {
      if (!wanted(name)) continue;
      try {
        await makeSfx(name, target, prompt, tmp);
      } catch (e) {
        failed.push(`sfx/${name}.mp3 (${e.message})`);
        console.warn(`${name}: FALLÓ: ${e.message}`);
      }
    }
    await music;
  }
  const missing = verify();
  if (failed.length) console.warn(`\nfallaron en esta ejecución: ${failed.join('; ')}`);
  if (missing.length) {
    console.warn(`faltan archivos: ${missing.join(', ')}`);
    process.exitCode = 2;
  } else if (mode === 'generate') {
    console.log(`listo: ${SFX_LIST.length} efectos a ${SFX_LUFS} LUFS y música a ${MUSIC_LUFS} LUFS · respuestas crudas en ${rawDir}`);
  }
} finally {
  fs.rmSync(tmp, {recursive: true, force: true});
}
