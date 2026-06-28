#!/bin/bash
# rentabilite-publish — wrapper launchd Mac mini.
# Publie 3 villes rentabilité (published false→true, par région) les MARDI, JEUDI et SAMEDI,
# commit + push sur main (→ rebuild Vercel), puis email récap via Resend (send-report.sh).
#
# PAS de claude -p : opération git + node pure, AUCUN coût API (cf. incident spike mai 2026).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"
DATE_TAG="$(date +%Y-%m-%d)"
RUN_LOG="$LOGS_DIR/run-$DATE_TAG.log"
OUT_FILE="/tmp/rentabilite-publish-out-$$.txt"
EMAIL_BODY_FILE="/tmp/rentabilite-publish-email-$$.txt"

mkdir -p "$LOGS_DIR"
cd "$REPO_ROOT"

echo "===== rentabilite-publish start $(date -Iseconds) =====" | tee -a "$RUN_LOG"

# Jours de publication : mardi (2), jeudi (4), samedi (6). Sinon rien (le plist se lance tous les jours).
DOW=$(date +%u)
if [[ "$DOW" != "2" && "$DOW" != "4" && "$DOW" != "6" ]]; then
  echo "Jour $DOW (ni mardi/jeudi/samedi) — pas de publication." | tee -a "$RUN_LOG"
  exit 0
fi

# Localiser node (PATH minimal sous launchd)
NODE_BIN="$(which node 2>/dev/null || true)"
for c in /opt/homebrew/bin/node /usr/local/bin/node; do
  [[ -z "$NODE_BIN" && -x "$c" ]] && NODE_BIN="$c"
done
if [[ -z "$NODE_BIN" ]]; then
  echo "ERREUR: node introuvable" | tee -a "$RUN_LOG"
  exit 1
fi

# Règle d'or Mac mini : working tree TOUJOURS clean. Si sale, on n'opère pas (sync à risque) + alerte.
if [[ -n "$(git status --porcelain)" ]]; then
  echo "⚠️ Working tree sale — publication annulée (sync à risque)." | tee -a "$RUN_LOG"
  echo "Le cron rentabilite-publish n'a pas publié : working tree Mac mini sale. Nettoyer le repo (cf. procédure rescue)." \
    | "$SCRIPT_DIR/send-report.sh" "⚠️ rentabilite-publish : working tree sale" >> "$RUN_LOG" 2>&1 || true
  exit 0
fi

git pull --ff-only origin main >> "$RUN_LOG" 2>&1 || {
  echo "ERREUR: git pull échoué" | tee -a "$RUN_LOG"
  exit 1
}

# Publier les 3 prochaines villes (écrit published_* dans GITHUB_OUTPUT + le corps email dans EMAIL_BODY_OUT).
rm -f "$OUT_FILE" "$EMAIL_BODY_FILE"
GITHUB_OUTPUT="$OUT_FILE" EMAIL_BODY_OUT="$EMAIL_BODY_FILE" "$NODE_BIN" scripts/publish-next-rentabilite-villes.mjs >> "$RUN_LOG" 2>&1

if [[ -f "$OUT_FILE" ]] && grep -q "^published_count=" "$OUT_FILE"; then
  PUBLISHED_COUNT=$(grep "^published_count=" "$OUT_FILE" | head -1 | cut -d= -f2-)
  PUBLISHED_SLUGS=$(grep "^published_slugs=" "$OUT_FILE" | head -1 | cut -d= -f2-)
  SUBJECT=$(grep "^published_subject=" "$OUT_FILE" | head -1 | cut -d= -f2-)
  echo "Publié $PUBLISHED_COUNT : $PUBLISHED_SLUGS" | tee -a "$RUN_LOG"

  git add -A
  git commit -m "chore(rentabilite): publish $PUBLISHED_COUNT villes ($DATE_TAG) — $PUBLISHED_SLUGS" >> "$RUN_LOG" 2>&1
  git push origin main >> "$RUN_LOG" 2>&1
  echo "Commit + push OK." | tee -a "$RUN_LOG"

  if [[ -f "$EMAIL_BODY_FILE" ]]; then
    "$SCRIPT_DIR/send-report.sh" "$SUBJECT" < "$EMAIL_BODY_FILE" >> "$RUN_LOG" 2>&1 || true
    echo "Email récap envoyé." | tee -a "$RUN_LOG"
  fi
else
  echo "Aucune ville publiée (toutes déjà publiées ?)." | tee -a "$RUN_LOG"
fi

rm -f "$OUT_FILE" "$EMAIL_BODY_FILE"
echo "===== rentabilite-publish end $(date -Iseconds) =====" | tee -a "$RUN_LOG"
