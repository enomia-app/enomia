#!/bin/bash
# Lancé par launchd app.enomia.backlinks-track-replies — Lun-Ven 9h13.
# Tracking des réponses + relances auto J+5/J+10/J+15.

set -euo pipefail

REPO="/Users/marc/projects/eunomia"
SCRIPT_DIR="$REPO/scripts/backlinks-track-replies-v2"
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/run-$(date +%Y-%m-%d).log"

cd "$REPO"

{
  echo "===== backlinks-track-replies-v2 start $(date -Iseconds) ====="
  node "$SCRIPT_DIR/track-replies.mjs"
  echo "===== backlinks-track-replies-v2 end $(date -Iseconds) ====="
} >> "$LOG" 2>&1
