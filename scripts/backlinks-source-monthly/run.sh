#!/bin/bash
# Lancé par launchd app.enomia.backlinks-source-monthly le 1er du mois à 9h47.
# Sourcing SEMrush des candidats backlinks pour le mois en cours.

set -euo pipefail

REPO="/Users/marc/projects/eunomia"
SCRIPT_DIR="$REPO/scripts/backlinks-source-monthly"
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/run-$(date +%Y-%m-%d).log"

cd "$REPO"

{
  echo "===== backlinks-source-monthly start $(date -Iseconds) ====="
  node "$SCRIPT_DIR/source-monthly.mjs"
  echo "===== backlinks-source-monthly end $(date -Iseconds) ====="
} >> "$LOG" 2>&1

# Envoi mail récap
node "$SCRIPT_DIR/send-recap-mail.mjs" >> "$LOG" 2>&1 || echo "⚠️ recap mail failed" >> "$LOG"
