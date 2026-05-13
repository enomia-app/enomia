#!/bin/bash
# tech-watchdog — désinstalleur Mac mini.
# Décharge launchd + supprime le plist installé. Garde les logs.

set -euo pipefail

PLIST_NAME="app.enomia.tech-watchdog.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"

echo "🧹 Désinstallation tech-watchdog"

if launchctl list | grep -q "app.enomia.tech-watchdog"; then
  echo "↻ Déchargement launchd..."
  launchctl unload "$PLIST_DEST" 2>/dev/null || true
fi

if [[ -f "$PLIST_DEST" ]]; then
  echo "🗑  Suppression du plist : $PLIST_DEST"
  rm "$PLIST_DEST"
fi

echo ""
echo "✅ tech-watchdog désinstallé."
echo "ℹ️  Logs conservés dans scripts/tech-watchdog/logs/ (à supprimer manuellement si besoin)."
