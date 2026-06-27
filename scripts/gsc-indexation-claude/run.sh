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

echo "===== gsc-indexation-claude start $(date -Iseconds) =====" | tee -a "$RUN_LOG"

# Garde-fou anti-zombie : tue un éventuel claude -p GSC resté figé d'un run précédent.
# (Incident 2026-06-12 → 06-20 : un claude -p --chrome pendu 8 jours a bloqué launchd
#  qui refuse de lancer une 2e instance du même label tant que la 1re vit → zéro run, zéro mail.)
if pkill -f "claude -p .*indexation GSC quotidien" 2>/dev/null; then
  echo "WARN: process claude -p GSC zombie détecté et tué avant démarrage" | tee -a "$RUN_LOG"
  sleep 2
fi

# Refresh SYNCHRONE de index-status.json AVANT claude -p (timeout maison, pas de `timeout` sur le Mac mini).
# ⚠️ L'agent claude -p est non-interactif one-shot : s'il lançait le refresh lui-même il le mettait en
#    arrière-plan puis sortait sans rien soumettre (incident 22→27/06 : 0 soumission 6 jours d'affilée).
#    On le fait donc ici, en bash, et l'agent reçoit des données fraîches → il n'a plus qu'à soumettre.
echo "── Refresh index-status (sync, avant claude) ──" | tee -a "$RUN_LOG"
REFRESH_TIMEOUT=1800  # 30 min
set +e
node scripts/gsc-fetch-index-status.mjs >> "$RUN_LOG" 2>&1 &
FETCH_PID=$!
(
  sleep "$REFRESH_TIMEOUT"
  if kill -0 "$FETCH_PID" 2>/dev/null; then
    echo "WARN: refresh index-status > ${REFRESH_TIMEOUT}s — kill (on continue avec le snapshot existant)" >> "$RUN_LOG"
    pkill -P "$FETCH_PID" 2>/dev/null; kill -9 "$FETCH_PID" 2>/dev/null
  fi
) &
FETCH_WD=$!
wait "$FETCH_PID"; FETCH_EXIT=$?
kill "$FETCH_WD" 2>/dev/null; wait "$FETCH_WD" 2>/dev/null
set -e
echo "refresh index-status terminé (exit=$FETCH_EXIT)" | tee -a "$RUN_LOG"

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

# Liste déterministe des URLs effectivement soumises aujourd'hui (lue depuis state.json, indépendante
# du rapport libre de l'agent) → garantit que l'email contient toujours les URLs poussées du jour.
{ echo ""; echo "────────── URLs soumises aujourd'hui ──────────"; node scripts/gsc-soumissions-jour.mjs "$DATE_TAG" 2>&1 || echo "(liste indisponible)"; } >> "$CLAUDE_OUT"

# Bilan d'indexation ventilé par section (conciergerie/love-room/cabane/blog) → ajouté à l'email du
# jour + enrichit .claude/gsc-tracking/state.json (clé `bilans`, lue chaque lundi par gsc-cadence-weekly).
# index-status.json a été rafraîchi en amont (ci-dessus) ; la skill a écrit state.json ; bilan = node pur.
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
