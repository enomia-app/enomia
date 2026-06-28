#!/bin/bash
# rentabilite-publish — désinstalleur Mac mini.
set -euo pipefail
PLIST_DEST="$HOME/Library/LaunchAgents/app.enomia.rentabilite-publish.plist"
if launchctl list | grep -q "app.enomia.rentabilite-publish"; then
  launchctl unload "$PLIST_DEST" 2>/dev/null || true
  echo "↩︎ Agent déchargé."
fi
rm -f "$PLIST_DEST"
echo "✅ rentabilite-publish désinstallé (le code reste, seul le cron launchd est retiré)."
