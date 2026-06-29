#!/bin/bash
# Lancé par launchd app.enomia.backlinks-send-daily — Lun-Ven 10h17.
# Envoi quotidien : pitches blog (send-daily) + badge conciergerie/niches
# (send-badge-daily). Budget TOTAL de prospection 20/j sur marc@enomia.app,
# PARTAGÉ avec les relances (backlinks-track-replies-v2, 10h31), RELANCES
# PRIORITAIRES : on réserve la place des relances dues du jour, les neufs
# (blog+badge) ne remplissent que le reste. Cf. track-replies.mjs (en-tête).

set -euo pipefail

REPO="/Users/marc/projects/eunomia"
SCRIPT_DIR="$REPO/scripts/backlinks-send-daily"
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/run-$(date +%Y-%m-%d).log"

cd "$REPO"

{
  echo "===== backlinks-send-daily start $(date -Iseconds) ====="

  # Budget neufs = 20 − relances dues aujourd'hui (réservation, cf. en-tête).
  # compute-new-budget imprime l'entier sur stdout, ses diagnostics sur stderr (→ LOG).
  NEW_BUDGET="$(node "$SCRIPT_DIR/compute-new-budget.mjs" 2>>"$LOG")" || NEW_BUDGET=10
  case "$NEW_BUDGET" in (''|*[!0-9]*) NEW_BUDGET=10 ;; esac   # garde-fou : entier sinon fallback 10
  # Répartition : blog jusqu'à 7, badge prend le reste du budget (conservateur —
  # si le blog en envoie moins, le badge n'en profite pas, mais total ≤ budget).
  BLOG_MAX=$(( NEW_BUDGET < 7 ? NEW_BUDGET : 7 ))
  BADGE_MAX=$(( NEW_BUDGET - BLOG_MAX ))
  echo "budget neufs du jour = $NEW_BUDGET → blog --max=$BLOG_MAX, badge --max=$BADGE_MAX"

  node "$SCRIPT_DIR/send-daily.mjs" --max="$BLOG_MAX" || echo "⚠️ send-daily a échoué ($?)"               # blog
  echo "----- badge (niches love room / cabane ; conciergerie en pause) -----"
  node "$SCRIPT_DIR/send-badge-daily.mjs" --max="$BADGE_MAX" || echo "⚠️ send-badge-daily a échoué ($?)"   # badge camp 4/5
  echo "----- to-do formulaires (mail copy-paste à Marc, niches) -----"
  node "$SCRIPT_DIR/form-todo-daily.mjs" --max=10 || echo "⚠️ form-todo a échoué ($?)"          # formulaires-seul niches (mail à Marc, hors budget envois prospects)
  echo "===== backlinks-send-daily end $(date -Iseconds) ====="
} >> "$LOG" 2>&1
