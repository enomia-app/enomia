#!/bin/bash
# blog-publish-daily — désinstalleur Mac mini. Décharge le launchd + retire le plist.

set -euo pipefail

LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_NAME="app.enomia.blog-publish-daily.plist"
PLIST_DEST="$LAUNCH_AGENTS_DIR/$PLIST_NAME"

if launchctl list | grep -q "app.enomia.blog-publish-daily"; then
  echo "↻ Déchargement..."
  launchctl unload "$PLIST_DEST" 2>/dev/null || true
fi

if [[ -f "$PLIST_DEST" ]]; then
  rm -f "$PLIST_DEST"
  echo "🗑  Plist retiré : $PLIST_DEST"
fi

echo "✅ blog-publish-daily désinstallé (le cron ne tournera plus)."
