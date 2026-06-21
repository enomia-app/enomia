#!/bin/bash
# gsc-indexation-claude — wrapper launchd Mac mini, 6h12 quotidien.
# Lance la skill « gsc-indexation-quotidienne » via claude -p,
# puis envoie un récap email via Resend (scripts/tech-watchdog/send-report.sh).
# (Ancien pipeline Playwright supprimé 2026-05-24 ; historique dans la branche wip/macmini-rescue-2026-05-24)

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

# Auth claude -p : sur le Mac mini en contexte launchd, le keychain n'est pas fiable
# (token OAuth périmé non rafraîchi, et SSH/launchctl setenv ne propagent pas) → on
# source un token OAuth depuis un fichier hors-Git (chmod 600). Cf incident 2026-06-21.
if [[ -f "$HOME/.config/claude-cron-secrets.env" ]]; then
  set -a; . "$HOME/.config/claude-cron-secrets.env"; set +a
fi

echo "===== gsc-indexation-claude start $(date -Iseconds) =====" | tee -a "$RUN_LOG"

# Garde-fou anti-zombie : tue un éventuel claude -p GSC resté figé d'un run précédent.
# (Incident 2026-06-12 → 06-20 : un claude -p --chrome pendu 8 jours a bloqué launchd
#  qui refuse de lancer une 2e instance du même label tant que la 1re vit → zéro run, zéro mail.)
if pkill -f "claude -p .*indexation GSC quotidien" 2>/dev/null; then
  echo "WARN: process claude -p GSC zombie détecté et tué avant démarrage" | tee -a "$RUN_LOG"
  sleep 2
fi

# Lancer claude -p en arrière-plan + watchdog (pas de `timeout`/`gtimeout` sur le Mac mini).
# Capture la sortie dans CLAUDE_OUT (pour l'email) et réplique dans RUN_LOG (debug local).
# Si claude pend > TIMEOUT_SECS, le watchdog le tue (lui + ses enfants) → run.sh sort,
# l'email part en ❌, et le lendemain n'est plus bloqué.
TIMEOUT_SECS=2700  # 45 min
set +e
claude -p "Tu es l'agent d'indexation GSC quotidien. Lance la skill « gsc-indexation-quotidienne » depuis le projet ~/projects/eunomia. Elle soumettra les URLs prioritaires non-indexées via Google Search Console." \
  --model claude-sonnet-4-6 \
  --chrome \
  --allowedTools "Bash Read Write Edit Glob Grep Skill mcp__Claude_in_Chrome" \
  --dangerously-skip-permissions \
  > "$CLAUDE_OUT" 2>&1 &
CLAUDE_PID=$!

( # watchdog
  sleep "$TIMEOUT_SECS"
  if kill -0 "$CLAUDE_PID" 2>/dev/null; then
    { echo ""; echo "TIMEOUT: claude -p a dépassé ${TIMEOUT_SECS}s — kill $CLAUDE_PID"; } >> "$CLAUDE_OUT"
    pkill -P "$CLAUDE_PID" 2>/dev/null
    kill -TERM "$CLAUDE_PID" 2>/dev/null
    sleep 10
    pkill -9 -P "$CLAUDE_PID" 2>/dev/null
    kill -9 "$CLAUDE_PID" 2>/dev/null
  fi
) &
WATCHDOG_PID=$!

wait "$CLAUDE_PID"
EXIT=$?
# claude a rendu la main (fini ou tué) → on coupe le watchdog s'il dort encore
kill "$WATCHDOG_PID" 2>/dev/null
wait "$WATCHDOG_PID" 2>/dev/null
set -e

# Bilan d'indexation ventilé par section (conciergerie/love-room/cabane/blog) → ajouté à l'email du
# jour + enrichit .claude/gsc-tracking/state.json (clé `bilans`, lue chaque lundi par gsc-cadence-weekly).
# La skill a déjà rafraîchi index-status.json + écrit state.json ; le bilan est du node pur (read-modify-write).
{ echo ""; echo "────────── Bilan indexation GSC (par section) ──────────"; node scripts/gsc-bilan.mjs 2>&1 || echo "(bilan indisponible)"; } >> "$CLAUDE_OUT"

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
