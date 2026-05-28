#!/bin/bash
# Désinstalle l'agent launchd refresh-conciergeries-monthly (Mac mini).
set -euo pipefail
PLIST_DEST="$HOME/Library/LaunchAgents/app.enomia.conciergerie-refresh.plist"
if launchctl list | grep -q "app.enomia.conciergerie-refresh"; then
  launchctl unload "$PLIST_DEST" 2>/dev/null || true
  echo "↩︎  Déchargé."
fi
if [[ -f "$PLIST_DEST" ]]; then
  rm -f "$PLIST_DEST"
  echo "🗑️  $PLIST_DEST supprimé."
fi
echo "✅ refresh-conciergeries-monthly désinstallé."
