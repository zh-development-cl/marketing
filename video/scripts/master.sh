#!/usr/bin/env bash
# Masterización del render: Remotion mezcla sin limitador, así que el reel queda ~2,5 LU por debajo de la referencia.
# Mide el nivel integrado, sube la ganancia hasta el objetivo y limita los picos a -1 dBTP. El video se copia tal cual.
# Uso: bash scripts/master.sh out/reel-01-v4.mp4 [out/reel-01-v4-master.mp4] [-14]
set -euo pipefail
IN="${1:?mp4 de entrada}"
OUT="${2:-${IN%.mp4}-master.mp4}"
TARGET="${3:--14}"
I=$(ffmpeg -hide_banner -nostats -i "$IN" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
GAIN=$(python3 -c "print(round($TARGET - ($I), 2))")
ffmpeg -hide_banner -nostats -y -i "$IN" -c:v copy -af "volume=${GAIN}dB,alimiter=limit=0.89:attack=5:release=100:level=false" -c:a aac -b:a 256k "$OUT" 2>/dev/null
I2=$(ffmpeg -hide_banner -nostats -i "$OUT" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
TP=$(ffmpeg -hide_banner -nostats -i "$OUT" -af "ebur128=peak=true" -f null - 2>&1 | grep -E "^\s+Peak:" | tail -1 | awk '{print $2}')
echo "master: $OUT · antes ${I} LUFS · ganancia ${GAIN} dB · después ${I2} LUFS · pico ${TP} dBTP"
