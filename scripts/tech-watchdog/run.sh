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

# Pre-check : working tree Mac mini sync. Si pollué depuis longtemps,
# envoie un mail séparé à Marc. N'arrête pas le watchdog.
echo "Pre-check git sync..." | tee -a "$RUN_LOG"
"$SCRIPT_DIR/check-git-sync.sh" >> "$RUN_LOG" 2>&1 || true

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

# Pre-check : AUTH claude (forfait Max / OAuth). Si "Not logged in", TOUS les crons claude du
# jour échouent sans rien publier — conciergerie (8h37), love-room (8h47), gsc-indexation (9h18),
# blog, fb. Aucune page dégradée n'est publiée (les crons avortent en exit 1), mais rien ne sort.
# On alerte Marc par EMAIL (chemin Resend, INDÉPENDANT de claude) pour qu'il se re-logge à temps.
# unset ANTHROPIC_API_KEY = forfait Max (cf incident api spike) ; prompt trivial haiku = coût ~nul.
echo "Pre-check auth claude..." | tee -a "$RUN_LOG"
AUTH_OUT="$(printf 'ping' | env -u ANTHROPIC_API_KEY "$CLAUDE_BIN" -p --model haiku --output-format text 2>&1 || true)"
if printf '%s' "$AUTH_OUT" | grep -qiE 'not logged in|please run /login|invalid api key|authentication_error|oauth token'; then
  echo "🚫 AUTH claude KO : $AUTH_OUT" | tee -a "$RUN_LOG"
  osascript -e 'display notification "Claude Max déconnecté — re-login requis" with title "tech-watchdog" subtitle "🚫 Crons claude HS" sound name "Sosumi"' || true
  SEND_REPORT="$SCRIPT_DIR/send-report.sh"
  [[ -x "$SEND_REPORT" ]] && "$SEND_REPORT" "[watchdog] 🚫 Claude Max déconnecté sur le Mac mini — re-login requis" >> "$RUN_LOG" 2>&1 <<EOF || true
Le forfait Claude Max n'est plus connecté sur le Mac mini.

Conséquence : les crons claude du jour vont échouer sans rien publier —
conciergerie (8h37), love-room (8h47), gsc-indexation (9h18), blog, fb.
Aucune page dégradée n'est publiée (les crons avortent proprement, exit 1),
mais rien ne sortira tant que la connexion n'est pas relancée.

ACTION : sur le Mac mini, ouvrir une session et lancer 'claude' puis /login.

--- sortie du check ---
$AUTH_OUT
EOF
fi

# Lancer Claude avec le prompt
# --dangerously-skip-permissions: nécessaire en headless 8h sans humain pour approuver
# (approvals via push notif peu fiables tôt le matin). Garde-fous via watchdog-prompt.md.
"$CLAUDE_BIN" -p "$(cat "$PROMPT_FILE")" \
  --output-format text \
  --dangerously-skip-permissions \
  >> "$RUN_LOG" 2>&1 || {
    echo "ERREUR: claude -p a échoué (exit $?)" | tee -a "$RUN_LOG"
    osascript -e 'display notification "Échec exécution Claude" with title "tech-watchdog" subtitle "⚠️ Voir log" sound name "Sosumi"' || true
    exit 1
  }

echo "===== tech-watchdog end $(date -Iseconds) =====" | tee -a "$RUN_LOG"
