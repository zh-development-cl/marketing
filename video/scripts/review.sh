#!/usr/bin/env bash
# Genera hojas de contacto y fotogramas de un render para revisarlo sin verlo en movimiento.
# Uso: scripts/review.sh out/reel-01.mp4 [out/review] [cada_n_frames]
set -euo pipefail
in="${1:?video de entrada}"
dir="${2:-out/review}"
step="${3:-8}"
mkdir -p "$dir/frames"
rm -f "$dir"/sheet_*.jpg "$dir"/frames/*.jpg
# Hojas: un fotograma cada $step frames, 10 por fila, 3 filas por hoja.
ffmpeg -v error -y -i "$in" -vf "select=not(mod(n\,$step)),scale=216:384,tile=10x3:padding=4:color=0x333333" -vsync vfr "$dir/sheet_%02d.jpg"
# Fotogramas a resolución completa cada segundo.
ffmpeg -v error -y -i "$in" -vf "fps=1" -q:v 3 "$dir/frames/s%03d.jpg"
# Loudness del render.
ffmpeg -nostats -i "$in" -af ebur128=peak=true -f null - 2>&1 | grep -A4 "Summary" | grep -E "I:|LRA:" | tr -s ' ' > "$dir/loudness.txt" || true
echo "hojas: $(ls "$dir"/sheet_*.jpg | wc -l) · fotogramas: $(ls "$dir"/frames | wc -l) · $(cat "$dir/loudness.txt" | tr '\n' ' ')"
