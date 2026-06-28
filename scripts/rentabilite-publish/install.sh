#!/bin/bash
# rentabilite-publish — installeur Mac mini.
# À lancer 1 fois sur le Mac mini après git pull. Idempotent.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
RUN_SH="$SCRIPT_DIR/run.sh"
LOGS_DIR="$SCRIPT_DIR/logs"
TEMPLATE="$SCRIPT_DIR/plist.template"

LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_NAME="app.enomia.rentabilite-publish.plist"
PLIST_DEST="$LAUNCH_AGENTS_DIR/$PLIST_NAME"

echo "🔧 Installation rentabilite-publish"
echo "   Repo: $REPO_ROOT"
echo "   Run script: $RUN_SH"
echo "   Logs: $LOGS_DIR"
echo "   Plist: $PLIST_DEST"
echo ""

if [[ "$(uname)" != "Darwin" ]]; then
  echo "❌ Installeur macOS-only (launchd)."
  exit 1
fi
chmod +x "$RUN_SH" "$SCRIPT_DIR/send-report.sh" 2>/dev/null || true
if [[ ! -x "$RUN_SH" ]]; then
  echo "❌ $RUN_SH non exécutable."
  exit 1
fi
if ! command -v node >/dev/null 2>&1 && [[ ! -x /opt/homebrew/bin/node ]]; then
  echo "⚠️  node introuvable — le cron échouera tant que Node n'est pas installé."
fi
if ! grep -qs '^RESEND_API_KEY=' "$REPO_ROOT/.env"; then
  echo "⚠️  RESEND_API_KEY absent de $REPO_ROOT/.env — la publication marchera mais pas l'email récap."
fi

mkdir -p "$LOGS_DIR" "$LAUNCH_AGENTS_DIR"

if launchctl list | grep -q "app.enomia.rentabilite-publish"; then
  echo "↻ Version existante détectée, déchargement..."
  launchctl unload "$PLIST_DEST" 2>/dev/null || true
fi

echo "📝 Génération du plist..."
sed \
  -e "s|__RUN_SH_PATH__|$RUN_SH|g" \
  -e "s|__LOGS_DIR__|$LOGS_DIR|g" \
  -e "s|__HOME__|$HOME|g" \
  -e "s|__REPO_ROOT__|$REPO_ROOT|g" \
  "$TEMPLATE" > "$PLIST_DEST"

echo "🚀 Chargement du plist dans launchd..."
launchctl load "$PLIST_DEST"

if launchctl list | grep -q "app.enomia.rentabilite-publish"; then
  echo ""
  echo "✅ rentabilite-publish installé et chargé."
  echo ""
  echo "📅 Lancé tous les jours 09h23, publie 3 villes le mardi + samedi (par région, meilleur ratio d'abord)."
  echo ""
  echo "Commandes utiles :"
  echo "   - Test à blanc (sans rien changer) : node $REPO_ROOT/scripts/publish-next-rentabilite-villes.mjs --dry-run"
  echo "   - Forcer un run maintenant         : bash $RUN_SH   (ne publie que si on est mardi/samedi)"
  echo "   - Statut                           : launchctl list | grep rentabilite-publish"
  echo "   - Logs                             : ls -la $LOGS_DIR/"
  echo "   - Désinstaller                     : bash $SCRIPT_DIR/uninstall.sh"
else
  echo "❌ Échec du chargement launchd."
  exit 1
fi
