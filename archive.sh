#!/usr/bin/env bash
set -euo pipefail

# Usage: ./archive-project.sh [output-name]
SRC_DIR="$(pwd)"
OUT_DIR="$HOME/Documents/archived"
mkdir -p "$OUT_DIR"
OUT_NAME="${1:-project-backup-$(date +%Y%m%d-%H%M).zip}"
OUT_PATH="$OUT_DIR/$OUT_NAME"

zip -r "$OUT_PATH" . \
  -x "node_modules/*" \
  -x "*/node_modules/*" \
  -x "venv/*" \
  -x "*/venv/*" \
  -x "__pycache__/*" \
  -x "*/__pycache__/*" \
  -x "*.pyc" \
  -x ".git/*" \
  -x "*/.git/*" \
  -x "*.log" \
  -x "instance/*" \
  -x ".cache/*" \
  -x "*/.cache/*"

echo "Done: $OUT_PATH"
du -h "$OUT_PATH"
