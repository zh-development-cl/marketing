// Copia las capturas reales de la app SCHOT (scratchpad/schot/shots) a public/schot/shots y junta los manifiestos
// en src/schot/shots.json ({id: {boxes, frames, fullHeight, ...}}), que las escenas leen para ubicar toques y zooms.
// Uso: node scripts/schot-shots.mjs <dir de capturas>
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2];
if (!src) throw new Error('falta el directorio de capturas');
const dst = path.join(root, 'public', 'schot', 'shots');
fs.mkdirSync(dst, {recursive: true});
const out = {};
for (const m of fs.readdirSync(src).filter((f) => /^manifest-.*\.json$/.test(f)).sort()) {
  for (const e of JSON.parse(fs.readFileSync(path.join(src, m), 'utf8'))) out[e.id] = {...(out[e.id] ?? {}), ...e};
}
let n = 0;
for (const f of fs.readdirSync(src)) {
  const p = path.join(src, f);
  if (fs.statSync(p).isDirectory()) {
    if (!/^seq-/.test(f)) continue;
    fs.mkdirSync(path.join(dst, f), {recursive: true});
    for (const g of fs.readdirSync(p).filter((g) => g.endsWith('.png'))) {
      fs.copyFileSync(path.join(p, g), path.join(dst, f, g));
      n++;
    }
  } else if (f.endsWith('.png')) {
    fs.copyFileSync(p, path.join(dst, f));
    n++;
  }
}
fs.writeFileSync(path.join(root, 'src', 'schot', 'shots.json'), JSON.stringify(out, null, 1));
console.log(`${n} imágenes copiadas · ${Object.keys(out).length} tomas en src/schot/shots.json`);
