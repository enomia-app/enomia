#!/bin/bash
# tech-watchdog — wrapper exécuté par launchd chaque matin 8h.
# Lance Claude en mode non-interactif avec le prompt watchdog-prompt.md.

set -euo pipefail

# Résoudre les chemins relatifs au script lui-même
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROMPT_FILE="$SCRIPT_DIR/watchdog-prompt.md"
LOGS_DIR="$SCRIPT_DIR/logs"
DATE_TAG="$(date +%Y-%m-%d)"
RUN_LOG="$LOGS_DIR/run-$DATE_TAG.log"

mkdir -p "$LOGS_DIR"

# Aller dans le repo (claude -p attend un cwd valide)
cd "$REPO_ROOT"

echo "===== tech-watchdog start $(date -Iseconds) =====" | tee -a "$RUN_LOG"
echo "Repo: $REPO_ROOT" | tee -a "$RUN_LOG"
echo "Prompt: $PROMPT_FILE" | tee -a "$RUN_LOG"

# Localiser le binaire claude (PATH minimal sous launchd)
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
  echo "ERREUR: binaire 'claude' introuvable dans le PATH." | tee -a "$RUN_LOG"
  osascript -e 'display notification "Binaire claude introuvable" with title "tech-watchdog" subtitle "⚠️ Setup KO" sound name "Sosumi"' || true
  exit 1
fi
echo "Claude bin: $CLAUDE_BIN" | tee -a "$RUN_LOG"

# Lancer Claude avec le prompt
# --dangerously-skip-permissions n'est PAS utilisé : on garde les approvals routés via push notif.
"$CLAUDE_BIN" -p "$(cat "$PROMPT_FILE")" \
  --output-format text \
  >> "$RUN_LOG" 2>&1 || {
    echo "ERREUR: claude -p a échoué (exit $?)" | tee -a "$RUN_LOG"
    osascript -e 'display notification "Échec exécution Claude" with title "tech-watchdog" subtitle "⚠️ Voir log" sound name "Sosumi"' || true
    exit 1
  }

echo "===== tech-watchdog end $(date -Iseconds) =====" | tee -a "$RUN_LOG"
