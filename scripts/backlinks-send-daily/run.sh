#!/bin/bash
# Lancé par launchd app.enomia.backlinks-send-daily — Lun-Ven 10h17.
# Envoi quotidien : pitches blog (send-daily) + badge conciergerie/niches
# (send-badge-daily). Cap 15/j partagé sur marc@enomia.app (7 blog + 8 badge).

set -euo pipefail

REPO="/Users/marc/projects/eunomia"
SCRIPT_DIR="$REPO/scripts/backlinks-send-daily"
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/run-$(date +%Y-%m-%d).log"

cd "$REPO"

{
  echo "===== backlinks-send-daily start $(date -Iseconds) ====="
  node "$SCRIPT_DIR/send-daily.mjs" --max=7 || echo "⚠️ send-daily a échoué ($?)"               # blog
  echo "----- badge (niches love room / cabane ; conciergerie en pause) -----"
  node "$SCRIPT_DIR/send-badge-daily.mjs" --max=8 || echo "⚠️ send-badge-daily a échoué ($?)"   # badge camp 4/5
  echo "----- to-do formulaires (mail copy-paste à Marc, niches) -----"
  node "$SCRIPT_DIR/form-todo-daily.mjs" --max=10 || echo "⚠️ form-todo a échoué ($?)"          # formulaires-seul niches
  echo "===== backlinks-send-daily end $(date -Iseconds) ====="
} >> "$LOG" 2>&1
