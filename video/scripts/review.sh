#!/usr/bin/env bash
# Genera hojas de contacto y fotogramas de un render para revisarlo sin verlo en movimiento.
# Uso: scripts/review.sh out/reel-01.mp4 [out/review] [cada_n_frames]
set -euo pipefail
in="${1:?video de entrada}"
dir="${2:-out/review}"
step="${3:-8}"
cd "$(dirname "$0")/.."

# Aviso si el render es más viejo que el código: toda revisión sobre él evalúa algo que no se va a publicar.
newest=$(ls -t src/*.ts src/*.json src/*/*.ts* 2>/dev/null | head -1)
if [ -n "$newest" ] && [ "$in" -ot "$newest" ]; then
  echo "AVISO: $in es más viejo que $newest; vuelve a renderizar antes de revisar."
fi

mkdir -p "$dir/frames"
rm -f "$dir"/sheet_*.jpg "$dir"/frames/*.jpg
# Hojas: un fotograma cada $step frames, 10 por fila, 3 filas por hoja.
ffmpeg -v error -y -i "$in" -vf "select=not(mod(n\,$step)),scale=216:384,tile=10x3:padding=4:color=0x333333" -vsync vfr "$dir/sheet_%02d.jpg"
# Fotogramas a resolución completa cada segundo.
ffmpeg -v error -y -i "$in" -vf "fps=1" -q:v 3 "$dir/frames/s%03d.jpg"
# Datos del render: frames, duración y loudness.
{
  echo "nb_frames=$(ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$in")"
  echo "duration=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")"
  ffmpeg -nostats -i "$in" -af ebur128=peak=true -f null - 2>&1 | grep -A4 "Summary" | grep -E "I:|LRA:" | tr -s ' '
} > "$dir/stats.txt" || true
echo "hojas: $(ls "$dir"/sheet_*.jpg | wc -l) · fotogramas: $(ls "$dir"/frames | wc -l) · $(tr '\n' ' ' < "$dir/stats.txt")"
