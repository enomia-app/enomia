#!/bin/bash
# tech-watchdog — installeur Mac mini.
# À lancer 1 fois sur Mac mini après git pull.
# Idempotent : peut être ré-exécuté pour re-installer après update.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
RUN_SH="$SCRIPT_DIR/run.sh"
LOGS_DIR="$SCRIPT_DIR/logs"
TEMPLATE="$SCRIPT_DIR/plist.template"

LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_NAME="app.enomia.tech-watchdog.plist"
PLIST_DEST="$LAUNCH_AGENTS_DIR/$PLIST_NAME"

echo "🔧 Installation tech-watchdog"
echo "   Repo: $REPO_ROOT"
echo "   Run script: $RUN_SH"
echo "   Logs: $LOGS_DIR"
echo "   Plist: $PLIST_DEST"
echo ""

# 1. Vérifs préalables
if [[ "$(uname)" != "Darwin" ]]; then
  echo "❌ Cet installeur est macOS-only (launchd)."
  exit 1
fi
if [[ ! -x "$RUN_SH" ]]; then
  echo "❌ $RUN_SH n'est pas exécutable. chmod +x manqué ?"
  exit 1
fi
if ! command -v claude >/dev/null 2>&1 && [[ ! -x "$HOME/.claude/local/claude" ]]; then
  echo "⚠️  Binaire 'claude' introuvable. Le watchdog échouera tant que Claude Code CLI n'est pas installé."
  echo "    Installation : voir https://docs.claude.com/en/docs/claude-code/setup"
fi

# 2. Préparer le dossier logs
mkdir -p "$LOGS_DIR"

# 3. Préparer le dossier LaunchAgents
mkdir -p "$LAUNCH_AGENTS_DIR"

# 4. Si une version est déjà chargée, la décharger d'abord
if launchctl list | grep -q "app.enomia.tech-watchdog"; then
  echo "↻ Version existante détectée, déchargement..."
  launchctl unload "$PLIST_DEST" 2>/dev/null || true
fi

# 5. Générer le plist depuis le template
echo "📝 Génération du plist..."
sed \
  -e "s|__RUN_SH_PATH__|$RUN_SH|g" \
  -e "s|__LOGS_DIR__|$LOGS_DIR|g" \
  -e "s|__HOME__|$HOME|g" \
  -e "s|__REPO_ROOT__|$REPO_ROOT|g" \
  "$TEMPLATE" > "$PLIST_DEST"

# 6. Charger
echo "🚀 Chargement du plist dans launchd..."
launchctl load "$PLIST_DEST"

# 7. Vérification
if launchctl list | grep -q "app.enomia.tech-watchdog"; then
  echo ""
  echo "✅ tech-watchdog installé et chargé."
  echo ""
  echo "📅 Prochain run : demain matin 8h00 (heure locale Mac)."
  echo ""
  echo "Commandes utiles :"
  echo "   - Tester manuellement maintenant : bash $RUN_SH"
  echo "   - Voir le statut          : launchctl list | grep tech-watchdog"
  echo "   - Voir les logs run       : ls -la $LOGS_DIR/"
  echo "   - Forcer un run via cron  : launchctl start app.enomia.tech-watchdog"
  echo "   - Désinstaller            : bash $SCRIPT_DIR/uninstall.sh"
else
  echo "❌ Échec du chargement launchd. Vérifie : log show --predicate 'subsystem == \"com.apple.xpc.launchd\"' --last 5m"
  exit 1
fi
