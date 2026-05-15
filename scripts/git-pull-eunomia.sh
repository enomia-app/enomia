#!/bin/bash
# git-pull-eunomia — pull main toutes les heures (Mac mini = ~/projects/eunomia, MBP = ~/Desktop/eunomia)
# Idempotent : si rien à pull, exit propre. Si conflits, log et notif.

set -euo pipefail

# Le path est passé en argument ou auto-détecté
REPO="${1:-}"
if [[ -z "$REPO" ]]; then
  for candidate in "$HOME/projects/eunomia" "$HOME/Desktop/eunomia"; do
    if [[ -d "$candidate/.git" ]]; then
      REPO="$candidate"
      break
    fi
  done
fi

if [[ -z "$REPO" ]] || [[ ! -d "$REPO/.git" ]]; then
  echo "[$(date -Iseconds)] ERREUR: repo eunomia introuvable" >&2
  exit 1
fi

LOG="$REPO/.git/last-pull.log"

cd "$REPO"

# Fetch + status, log court
echo "[$(date -Iseconds)] === pull origin main ===" >> "$LOG"

if ! git diff-index --quiet HEAD --; then
  echo "[$(date -Iseconds)] ⚠️  Uncommitted changes, skip pull (run git stash + git pull manually)" >> "$LOG"
  exit 0
fi

CURRENT=$(git rev-parse HEAD)
git fetch origin main 2>>"$LOG" || { echo "[$(date -Iseconds)] ❌ fetch failed" >> "$LOG"; exit 1; }
REMOTE=$(git rev-parse origin/main)

if [[ "$CURRENT" == "$REMOTE" ]]; then
  echo "[$(date -Iseconds)] ✓ already up to date ($CURRENT)" >> "$LOG"
  exit 0
fi

# Fast-forward seulement
if git merge-base --is-ancestor "$CURRENT" "$REMOTE"; then
  git merge --ff-only origin/main >>"$LOG" 2>&1 && echo "[$(date -Iseconds)] ✓ fast-forwarded $CURRENT → $REMOTE" >> "$LOG"
else
  echo "[$(date -Iseconds)] ⚠️  Diverged from origin/main, manual resolution needed" >> "$LOG"
  exit 1
fi
