#!/bin/bash
# backlinks-validate-send — wrapper exécuté par launchd 4×/jour (10h30, 14h, 17h, 20h).
# Parse les replies Marc aux [backlinks] N pitches à valider, envoie les pitches validés.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROMPT_FILE="$SCRIPT_DIR/prompt.md"
LOGS_DIR="$SCRIPT_DIR/logs"
DATE_TAG="$(date +%Y-%m-%d)"
RUN_LOG="$LOGS_DIR/run-$DATE_TAG.log"

mkdir -p "$LOGS_DIR"

cd "$REPO_ROOT"

# Sourcer .env du repo pour récupérer les vars Gmail/Resend/etc.
# IMPORTANT : on unset ANTHROPIC_API_KEY juste après pour forcer claude -p à
# utiliser l'OAuth Max du keychain login (gratuit) plutôt que l'API key (payant).
# Le keychain login est accessible car les jobs launchd tournent dans gui/UID/.
if [[ -f "$REPO_ROOT/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$REPO_ROOT/.env"
  set +a
fi
unset ANTHROPIC_API_KEY

echo "===== backlinks-validate-send start $(date -Iseconds) =====" | tee -a "$RUN_LOG"

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "ERREUR: prompt introuvable à $PROMPT_FILE" | tee -a "$RUN_LOG"
  exit 1
fi

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
    osascript -e 'display notification "Échec exécution backlinks-validate-send" with title "backlinks-validate-send" subtitle "⚠️ Voir log" sound name "Sosumi"' || true
    exit 1
  }

echo "===== backlinks-validate-send end $(date -Iseconds) =====" | tee -a "$RUN_LOG"
