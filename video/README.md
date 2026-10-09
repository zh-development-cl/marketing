# video

Reels de ZH Development hechos con Remotion (React → MP4 1080x1920, 30 fps).

```bash
cd video
npm install
# Vista previa
npx remotion studio src/index.ts
# Render
REMOTION_BROWSER=/ruta/a/chromium npx remotion render src/index.ts Reel01 out/reel-01.mp4
```

`REMOTION_BROWSER` es opcional: sin esa variable Remotion descarga su propio Chrome.

- `src/brand/`: tokens y fuentes de marca (las fuentes viven en `public/fonts/`).
- `src/components/`: piezas reutilizables (fondo, logo, teléfono, tarjetas, etiqueta de paso, subtítulos).
- `src/scenes/`: una carpeta por reel; `Reel01.tsx` arma las escenas con el timing de `src/timeline.ts`.
- Los renders van a `out/` y no se suben al repo.
