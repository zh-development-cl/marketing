// Casting de voces para el reel: genera el mismo tramo del guion (gancho + día + pitch) con varias voces de
// ElevenLabs (eleven_v3, misma etiqueta y mapa de pronunciación que la toma real), normaliza a −16 LUFS y deja
// out/casting/NN-nombre.mp3 más un archivo único con todas las muestras separadas por silencio.
// Uso: node scripts/voice-casting.mjs            (las voces van en CANDIDATES; VO_MODEL=eleven_multilingual_v2 para probar v2)
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = fs.existsSync(path.join(root, '.env')) ? fs.readFileSync(path.join(root, '.env'), 'utf8') : '';
const key = process.env.ELEVENLABS_API_KEY || env.match(/ELEVENLABS_API_KEY=(.+)/)?.[1]?.trim();
if (!key) throw new Error('Falta ELEVENLABS_API_KEY');
const MODEL = process.env.VO_MODEL || 'eleven_v3';
const TAG = process.env.VO_TAG || '[confident, warm]';
const CANDIDATES = [
  ['antonio', 'htFfPSZGJwjBv1CL0aMD', 'Antonio · latino joven, claro y seguro'],
  ['mauricio', '94zOad0g7T7K4oa7zhDq', 'Mauricio · latino adulto, narrador calmado'],
  ['cristian', 'ClNifCEVq1smkl4M3aTk', 'Cristian · chileno, redes sociales, seguro'],
  ['alejandro', '0cheeVA5B3Cv6DGq65cT', 'Alejandro · chileno joven, conversacional'],
  ['alberto', 'l1zE9xgNpUTaQCZzpNJa', 'Alberto · latino adulto, narrador serio'],
  ['juan', 'VvYiNBPylZtUh8Bf6u8l', 'Juan · latino joven, amable y natural'],
  ['valeria', 'JddqVF50ZSIR7SRbJE6u', 'Valeria · mujer latina joven, cercana'],
  ['fernanda', 'JM2A9JbRp8XUJ7bdCXJc', 'Fernanda · mujer latina joven, segura'],
];
const pronounce = {ZH: 'Zeta Hache', 30: 'treinta', IA: 'inteligencia artificial'};
const lines = ['¿Qué hacemos en ZH Development?', 'En tu empresa, el día se va en lo mismo: cotizar por WhatsApp, cuadrar planillas, perseguir pagos.', 'Hacemos el software que lo resuelve.'];
let text = lines.join('\n\n');
for (const [k, v] of Object.entries(pronounce)) text = text.replace(new RegExp(`\\b${k}\\b`, 'g'), v);
text = `${TAG} ${text}`;
const outDir = path.join(root, 'out', 'casting');
fs.mkdirSync(outDir, {recursive: true});
const ffmpeg = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], {stdio: ['ignore', 'pipe', 'inherit']});
const files = [];
for (const [i, [slug, voiceId, label]] of CANDIDATES.entries()) {
  const n = String(i + 1).padStart(2, '0');
  const raw = path.join(outDir, `${n}-${slug}.raw.mp3`);
  const out = path.join(outDir, `${n}-${slug}.mp3`);
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {'xi-api-key': key, 'content-type': 'application/json'},
    body: JSON.stringify({text, model_id: MODEL, voice_settings: {stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true}}),
  });
  if (!res.ok) {
    console.error(`${n} ${slug}: ${res.status} ${(await res.text()).slice(0, 200)}`);
    continue;
  }
  fs.writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
  ffmpeg(['-i', raw, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=9', '-ar', '44100', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '160k', out]);
  fs.unlinkSync(raw);
  files.push({n, slug, label, out});
  console.log(`${n} ${label} → ${path.relative(root, out)}`);
}
// Archivo único: muestra, 0,7 s de silencio, siguiente…
if (files.length) {
  const list = path.join(outDir, 'concat.txt');
  const gap = path.join(outDir, 'gap.mp3');
  ffmpeg(['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', '0.7', '-c:a', 'libmp3lame', '-b:a', '160k', gap]);
  fs.writeFileSync(list, files.flatMap((f) => [`file '${f.out}'`, `file '${gap}'`]).join('\n'));
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', path.join(outDir, '00-todas-las-voces.mp3')]);
  fs.writeFileSync(path.join(outDir, 'LEEME.txt'), files.map((f) => `${f.n} · ${f.label}`).join('\n') + '\n');
  console.log(`listo: ${files.length} voces en out/casting (00-todas-las-voces.mp3 las junta en orden)`);
}
