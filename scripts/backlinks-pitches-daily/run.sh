#!/bin/bash
# backlinks-pitches-daily — wrapper exécuté par launchd chaque jour à 10h00.
# Lance Claude pour enrichir jusqu'à 10 prospects backlinks et envoyer le récap email à Marc.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROMPT_FILE="$SCRIPT_DIR/prompt.md"
LOGS_DIR="$SCRIPT_DIR/logs"
DATE_TAG="$(date +%Y-%m-%d)"
RUN_LOG="$LOGS_DIR/run-$DATE_TAG.log"

mkdir -p "$LOGS_DIR"

cd "$REPO_ROOT"

# Sourcer .env du repo pour récupérer ANTHROPIC_API_KEY (nécessaire pour claude -p)
if [[ -f "$REPO_ROOT/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$REPO_ROOT/.env"
  set +a
fi

echo "===== backlinks-pitches-daily start $(date -Iseconds) =====" | tee -a "$RUN_LOG"
echo "Repo: $REPO_ROOT" | tee -a "$RUN_LOG"
echo "Prompt: $PROMPT_FILE" | tee -a "$RUN_LOG"

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "ERREUR: prompt introuvable à $PROMPT_FILE" | tee -a "$RUN_LOG"
  exit 1
fi

# Localiser claude
CLAUDE_BIN="$(which claude 2>/dev/null || true)"
if [[ -z "$CLAUDE_BIN" ]]; then
  for candidate in "$HOME/.claude/local/claude" "/opt/homebrew/bin/claude" "/usr/local/bin/claude"; do
    if [[ -x "$candidate" ]]; then
      CLAUDE_BIN="$candidate"
      break
    fi
  done
fi
if [[ -z "$CLAUDE_BIN" ]]; then
  echo "ERREUR: binaire 'claude' introuvable." | tee -a "$RUN_LOG"
  exit 1
fi
echo "Claude bin: $CLAUDE_BIN" | tee -a "$RUN_LOG"

"$CLAUDE_BIN" -p "$(cat "$PROMPT_FILE")" \
  --output-format text \
  --dangerously-skip-permissions \
  >> "$RUN_LOG" 2>&1 || {
    EXIT_CODE=$?
    echo "ERREUR: claude -p a échoué (exit $EXIT_CODE)" | tee -a "$RUN_LOG"
    osascript -e 'display notification "Échec exécution backlinks-pitches-daily" with title "backlinks-pitches-daily" subtitle "⚠️ Voir log" sound name "Sosumi"' || true
    exit 1
  }

echo "===== backlinks-pitches-daily end $(date -Iseconds) =====" | tee -a "$RUN_LOG"
