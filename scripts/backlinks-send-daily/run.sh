#!/bin/bash
# Lancé par launchd app.enomia.backlinks-send-daily — Lun-Ven 10h17.
# Envoi quotidien automatique des pitches backlinks.

set -euo pipefail

REPO="/Users/marc/projects/eunomia"
SCRIPT_DIR="$REPO/scripts/backlinks-send-daily"
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/run-$(date +%Y-%m-%d).log"

cd "$REPO"

{
  echo "===== backlinks-send-daily start $(date -Iseconds) ====="
  node "$SCRIPT_DIR/send-daily.mjs"
  echo "===== backlinks-send-daily end $(date -Iseconds) ====="
} >> "$LOG" 2>&1
