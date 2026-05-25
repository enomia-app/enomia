#!/bin/bash
# Vérifie l'état du sync git Mac mini.
# Si git-pull-eunomia.sh skip depuis >= THRESHOLD pulls consécutifs (= working
# tree pollué depuis longtemps), envoie une alerte email à Marc via Resend.
#
# Lancé par tech-watchdog/run.sh avant le claude -p.
# Exit 0 toujours (ne bloque pas le watchdog).

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PULL_LOG="$REPO_ROOT/.git/last-pull.log"

# Seuil : 12 pulls consécutifs skippés = 1 heure de working tree pollué
# (git-pull-eunomia.sh tourne toutes les 5 min)
THRESHOLD=12

if [[ ! -f "$PULL_LOG" ]]; then
  exit 0
fi

# Compte les "skip pull" consécutifs en fin de log (reset à 0 sur tout pull réussi)
CONSECUTIVE_SKIPS=$(awk '
  /skip pull/ { skip++ }
  /already up to date|fast-forwarded/ { skip=0 }
  END { print skip+0 }
' "$PULL_LOG")

if [[ "$CONSECUTIVE_SKIPS" -lt "$THRESHOLD" ]]; then
  exit 0
fi

# Récupère un peu de contexte pour le mail
CURRENT_BRANCH=$(cd "$REPO_ROOT" && git branch --show-current 2>/dev/null || echo "?")
CURRENT_HEAD=$(cd "$REPO_ROOT" && git rev-parse --short HEAD 2>/dev/null || echo "?")
ORIGIN_HEAD=$(cd "$REPO_ROOT" && git rev-parse --short origin/main 2>/dev/null || echo "?")
COMMITS_BEHIND=$(cd "$REPO_ROOT" && git rev-list --count HEAD..origin/main 2>/dev/null || echo "?")
DIRTY_FILES=$(cd "$REPO_ROOT" && git status --porcelain 2>/dev/null | head -20)
DIRTY_COUNT=$(cd "$REPO_ROOT" && git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
MINUTES_STUCK=$((CONSECUTIVE_SKIPS * 5))

BODY="Le working tree Mac mini est pollué depuis $MINUTES_STUCK minutes ($CONSECUTIVE_SKIPS pulls auto consécutifs skippés).

État Mac mini :
- Branche : $CURRENT_BRANCH
- HEAD : $CURRENT_HEAD
- origin/main : $ORIGIN_HEAD
- Retard : $COMMITS_BEHIND commits

Risque : launchd jobs tournent sur du code obsolète (figés sur $CURRENT_HEAD alors que main est à $ORIGIN_HEAD).

Fichiers dirty ($DIRTY_COUNT total, top 20) :
$DIRTY_FILES

Pour diagnostiquer :
  ssh marc@100.81.185.92 \"cd ~/projects/eunomia && git status\"

Pour résoudre :
  Procédure rescue dans memory/global/project_setup_machines.md
"

"$SCRIPT_DIR/send-report.sh" "[tech-watchdog] 🚨 Mac mini repo pollué ($MINUTES_STUCK min, $COMMITS_BEHIND commits de retard)" <<<"$BODY" || true

exit 0
