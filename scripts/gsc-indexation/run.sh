#!/bin/bash
# gsc-indexation — wrapper launchd Mac mini, 7h03 quotidien.
# Pipeline 100% autonome (Playwright direct, plus de Claude Code / Chrome MCP).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"
DATE_TAG="$(date +%Y-%m-%d)"
RUN_LOG="$LOGS_DIR/run-$DATE_TAG.log"
TRACKING_FILE="$REPO_ROOT/.claude/gsc-tracking/urls.json"
INDEX_STATUS_FILE="$REPO_ROOT/.claude/gsc-tracking/index-status.json"
SEND_REPORT="$REPO_ROOT/scripts/tech-watchdog/send-report.sh"

mkdir -p "$LOGS_DIR"
cd "$REPO_ROOT"

echo "===== gsc-indexation start $(date -Iseconds) =====" | tee -a "$RUN_LOG"

# Anti-doublon journalier
LAST_RUN=$(jq -r '.last_run // ""' "$TRACKING_FILE" 2>/dev/null || echo "")
if [[ "$LAST_RUN" == "$DATE_TAG" ]]; then
  echo "Already ran today ($LAST_RUN) — STOP" | tee -a "$RUN_LOG"
  exit 0
fi

# 1. Refresh index-status si > 24h
NEED_REFRESH=0
if [[ ! -f "$INDEX_STATUS_FILE" ]]; then
  NEED_REFRESH=1
else
  LAST_MTIME=$(stat -f %m "$INDEX_STATUS_FILE")
  AGE=$(( $(date +%s) - LAST_MTIME ))
  [[ $AGE -gt 86400 ]] && NEED_REFRESH=1
fi
if [[ $NEED_REFRESH -eq 1 ]]; then
  echo "→ Refresh index-status (>24h)..." | tee -a "$RUN_LOG"
  node scripts/gsc-fetch-index-status.mjs >> "$RUN_LOG" 2>&1 || \
    echo "WARN refresh index-status échoué" | tee -a "$RUN_LOG"
fi

# 2. Compute top candidates
echo "→ Compute top candidates..." | tee -a "$RUN_LOG"
node scripts/gsc-indexation/compute-candidates.mjs >> "$RUN_LOG" 2>&1

# 3. Soumettre via Playwright
echo "→ Submit via Playwright (Chrome headless + cookies persistés)..." | tee -a "$RUN_LOG"
SUBMIT_EXIT=0
node scripts/gsc-indexation/submit-via-chrome.mjs >> "$RUN_LOG" 2>&1 || SUBMIT_EXIT=$?

# 4. Commit + push si urls.json changé
if ! git diff --quiet "$TRACKING_FILE" 2>/dev/null; then
  git add "$TRACKING_FILE" "$INDEX_STATUS_FILE" 2>/dev/null || true
  git commit -m "chore(gsc): indexation $DATE_TAG" >> "$RUN_LOG" 2>&1 || true
  git push origin main >> "$RUN_LOG" 2>&1 || \
    echo "WARN push échoué (sera retenté demain)" | tee -a "$RUN_LOG"
fi

# 5. Email récap
SUBJECT="[gsc-indexation] $DATE_TAG"
case $SUBMIT_EXIT in
  0) SUBJECT="$SUBJECT — OK" ;;
  2) SUBJECT="$SUBJECT — ⚠️ fichiers manquants (cookies ou candidates)" ;;
  3) SUBJECT="$SUBJECT — ⚠️ cookies GSC expirés, refaire export Cookie-Editor" ;;
  4) SUBJECT="$SUBJECT — ⚠️ stoppé en cours (quota Google ou CAPTCHA)" ;;
  *) SUBJECT="$SUBJECT — ❌ erreur fatale (exit $SUBMIT_EXIT)" ;;
esac

if [[ -x "$SEND_REPORT" ]]; then
  tail -150 "$RUN_LOG" | "$SEND_REPORT" "$SUBJECT" >> "$RUN_LOG" 2>&1 || \
    echo "WARN email échoué" | tee -a "$RUN_LOG"
fi

echo "===== gsc-indexation end $(date -Iseconds) (exit=$SUBMIT_EXIT) =====" | tee -a "$RUN_LOG"
exit $SUBMIT_EXIT
