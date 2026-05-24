#!/bin/bash
# gsc-indexation-claude — wrapper launchd Mac mini, 9h18 quotidien.
# Lance la skill « gsc-indexation-quotidienne » via claude -p,
# puis envoie un récap email via Resend (scripts/tech-watchdog/send-report.sh).
# Backup de l'ancien pipeline Playwright en scripts/gsc-indexation/run.sh.bak.*

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"
DATE_TAG="$(date +%Y-%m-%d)"
RUN_LOG="$LOGS_DIR/run-$DATE_TAG.log"
CLAUDE_OUT="$LOGS_DIR/claude-out-$DATE_TAG.txt"
SEND_REPORT="$REPO_ROOT/scripts/tech-watchdog/send-report.sh"

mkdir -p "$LOGS_DIR"
cd "$REPO_ROOT"

echo "===== gsc-indexation-claude start $(date -Iseconds) =====" | tee -a "$RUN_LOG"

# Lancer claude -p, capturer la sortie complète dans CLAUDE_OUT (pour l'email)
# et aussi répliquer dans RUN_LOG (pour le debug local).
set +e
claude -p "Tu es l'agent d'indexation GSC quotidien. Lance la skill « gsc-indexation-quotidienne » depuis le projet ~/projects/eunomia. Elle soumettra les URLs prioritaires non-indexées via Google Search Console." \
  --model claude-sonnet-4-6 \
  --chrome \
  --allowedTools "Bash Read Write Edit Glob Grep Skill mcp__Claude_in_Chrome" \
  --dangerously-skip-permissions \
  > "$CLAUDE_OUT" 2>&1
EXIT=$?
set -e

cat "$CLAUDE_OUT" >> "$RUN_LOG"
echo "===== gsc-indexation-claude end $(date -Iseconds) (exit=$EXIT) =====" | tee -a "$RUN_LOG"

# Email récap via Resend (best-effort, n'échoue pas le run si l'email plante)
if [[ -x "$SEND_REPORT" ]]; then
  case $EXIT in
    0) STATUS="✅ OK" ;;
    *) STATUS="❌ Échec (exit $EXIT)" ;;
  esac
  SUBJECT="[gsc-indexation] $DATE_TAG — $STATUS"
  set +e
  cat "$CLAUDE_OUT" | "$SEND_REPORT" "$SUBJECT" >> "$RUN_LOG" 2>&1
  EMAIL_EXIT=$?
  set -e
  if [[ $EMAIL_EXIT -ne 0 ]]; then
    echo "WARN email échoué (exit $EMAIL_EXIT) — run lui-même OK" | tee -a "$RUN_LOG"
  fi
else
  echo "WARN send-report.sh introuvable ou non-exécutable" | tee -a "$RUN_LOG"
fi

exit $EXIT
