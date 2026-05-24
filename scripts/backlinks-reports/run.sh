#!/bin/bash
# Lancé par launchd. Argument $1 = period (week|month|quarter|year).
# Plists distincts pour chaque période.

set -euo pipefail

PERIOD="${1:?usage: run.sh week|month|quarter|year}"

REPO="/Users/marc/projects/eunomia"
SCRIPT_DIR="$REPO/scripts/backlinks-reports"
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/run-$PERIOD-$(date +%Y-%m-%d).log"

cd "$REPO"

{
  echo "===== backlinks-reports $PERIOD start $(date -Iseconds) ====="
  node "$SCRIPT_DIR/reports.mjs" --period="$PERIOD"
  echo "===== backlinks-reports $PERIOD end $(date -Iseconds) ====="
} >> "$LOG" 2>&1
