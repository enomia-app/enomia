#!/bin/bash
# gsc-indexation-quotidienne — wrapper exécuté par launchd chaque matin 7h03.
# Lance Claude pour identifier top 5 URLs non-indexées et les soumettre via Chrome MCP.

set -euo pipefail

# Résoudre les chemins relatifs au script lui-même
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROMPT_FILE="$SCRIPT_DIR/prompt.md"
LOGS_DIR="$SCRIPT_DIR/logs"
DATE_TAG="$(date +%Y-%m-%d)"
RUN_LOG="$LOGS_DIR/run-$DATE_TAG.log"

mkdir -p "$LOGS_DIR"

cd "$REPO_ROOT"

echo "===== gsc-indexation start $(date -Iseconds) =====" | tee -a "$RUN_LOG"
echo "Repo: $REPO_ROOT" | tee -a "$RUN_LOG"
echo "Prompt: $PROMPT_FILE" | tee -a "$RUN_LOG"

# Vérif prompt
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

# Lancer Claude avec le prompt depuis fichier
"$CLAUDE_BIN" -p "$(cat "$PROMPT_FILE")" \
  --output-format text \
  --dangerously-skip-permissions \
  >> "$RUN_LOG" 2>&1 || {
    EXIT_CODE=$?
    echo "ERREUR: claude -p a échoué (exit $EXIT_CODE)" | tee -a "$RUN_LOG"
    osascript -e 'display notification "Échec exécution gsc-indexation" with title "gsc-indexation" subtitle "⚠️ Voir log" sound name "Sosumi"' || true
    exit 1
  }

echo "===== gsc-indexation end $(date -Iseconds) =====" | tee -a "$RUN_LOG"
