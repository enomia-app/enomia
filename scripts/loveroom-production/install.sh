#!/bin/bash
# Installe/active le cron loveroom-production. ⚠️ À LANCER DEPUIS LE MAC MINI (repo ~/projects/eunomia).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LABEL="app.enomia.loveroom-production"
PLIST="$SCRIPT_DIR/$LABEL.plist"
DEST="$HOME/Library/LaunchAgents/$LABEL.plist"
UID_N="$(id -u)"

[[ "$SCRIPT_DIR" == "$HOME/projects/eunomia/"* ]] || echo "⚠️  Attendu sous ~/projects/eunomia (Mac mini). Chemin actuel : $SCRIPT_DIR"

mkdir -p "$SCRIPT_DIR/logs"
cp "$PLIST" "$DEST"
launchctl bootout "gui/$UID_N/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$UID_N" "$DEST"
launchctl enable "gui/$UID_N/$LABEL"

echo "✅ $LABEL installé (mardi + samedi 8h47, 2 villes/run)."
echo "   Vérifier : launchctl print gui/$UID_N/$LABEL | grep -E 'state|runs'"
echo "   Test manuel immédiat : bash $SCRIPT_DIR/run.sh"
echo "   Logs : $SCRIPT_DIR/logs/"
