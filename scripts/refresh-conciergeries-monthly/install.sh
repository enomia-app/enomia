#!/bin/bash
# refresh-conciergeries-monthly — installeur Mac mini.
# À lancer 1 fois sur le Mac mini après git pull (sur main, après merge de la branche).
# Idempotent : ré-exécutable pour re-installer après update.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
RUN_SH="$SCRIPT_DIR/run.sh"
LOGS_DIR="$SCRIPT_DIR/logs"
TEMPLATE="$SCRIPT_DIR/plist.template"

LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_NAME="app.enomia.conciergerie-refresh.plist"
PLIST_DEST="$LAUNCH_AGENTS_DIR/$PLIST_NAME"

echo "🔧 Installation refresh-conciergeries-monthly"
echo "   Repo: $REPO_ROOT"
echo "   Run script: $RUN_SH"
echo "   Plist: $PLIST_DEST"
echo ""

# 1. Vérifs préalables
if [[ "$(uname)" != "Darwin" ]]; then
  echo "❌ Installeur macOS-only (launchd)."; exit 1
fi
chmod +x "$RUN_SH" "$SCRIPT_DIR/send-report.sh" 2>/dev/null || true
if [[ ! -x "$RUN_SH" ]]; then
  echo "❌ $RUN_SH non exécutable."; exit 1
fi
for bin in node npm git; do
  command -v "$bin" >/dev/null 2>&1 || echo "⚠️  '$bin' introuvable dans le PATH — le refresh échouera."
done
# Clé Places API ?
if [[ -z "${GOOGLE_PLACES_API_KEY:-}" ]] \
   && ! grep -qs '^GOOGLE_PLACES_API_KEY=' "$HOME/projects/Neocamino/.env" "/Users/marc/Desktop/Neocamino/.env" "$REPO_ROOT/.env"; then
  echo "⚠️  GOOGLE_PLACES_API_KEY introuvable (env + Neocamino/.env + repo/.env)."
  echo "    Le refresh échouera tant que la clé n'est pas accessible sur cette machine."
fi
# Clé Resend ?
grep -qs '^RESEND_API_KEY=' "$REPO_ROOT/.env" || echo "⚠️  RESEND_API_KEY absent de $REPO_ROOT/.env — pas d'email récap."

# 2. Dossiers
mkdir -p "$LOGS_DIR" "$LAUNCH_AGENTS_DIR"

# 3. Décharger une version existante
if launchctl list | grep -q "app.enomia.conciergerie-refresh"; then
  echo "↻ Version existante détectée, déchargement..."
  launchctl unload "$PLIST_DEST" 2>/dev/null || true
fi

# 4. Générer le plist
echo "📝 Génération du plist..."
sed \
  -e "s|__RUN_SH_PATH__|$RUN_SH|g" \
  -e "s|__LOGS_DIR__|$LOGS_DIR|g" \
  -e "s|__HOME__|$HOME|g" \
  -e "s|__REPO_ROOT__|$REPO_ROOT|g" \
  "$TEMPLATE" > "$PLIST_DEST"

# 5. Charger
echo "🚀 Chargement launchd..."
launchctl load "$PLIST_DEST"

# 6. Vérif
if launchctl list | grep -q "app.enomia.conciergerie-refresh"; then
  echo ""
  echo "✅ refresh-conciergeries-monthly installé."
  echo "📅 Prochain run : le 3 du mois à 06:13 (heure locale Mac)."
  echo ""
  echo "Commandes utiles :"
  echo "   - Tester maintenant (vrai run, commit/push réel !) : bash $RUN_SH"
  echo "   - Statut       : launchctl list | grep conciergerie-refresh"
  echo "   - Logs         : ls -la $LOGS_DIR/"
  echo "   - Forcer un run: launchctl start app.enomia.conciergerie-refresh"
  echo "   - Désinstaller : bash $SCRIPT_DIR/uninstall.sh"
else
  echo "❌ Échec du chargement launchd."; exit 1
fi
