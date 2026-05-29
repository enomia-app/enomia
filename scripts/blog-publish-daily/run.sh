#!/bin/bash
# blog-publish-daily — wrapper launchd Mac mini.
# Publie 1 article blog (status: brouillon → en-ligne) tous les 2 jours (jours impairs),
# commit + push sur main, puis envoie un email récap via Resend (send-report.sh).
#
# PAS de claude -p : opération git + node pure, AUCUN coût API (cf. incident spike mai 2026).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"
DATE_TAG="$(date +%Y-%m-%d)"
RUN_LOG="$LOGS_DIR/run-$DATE_TAG.log"
OUT_FILE="/tmp/blog-publish-out-$$.txt"

mkdir -p "$LOGS_DIR"
cd "$REPO_ROOT"

echo "===== blog-publish-daily start $(date -Iseconds) =====" | tee -a "$RUN_LOG"

# Espacement : publier uniquement les jours impairs (~1 article tous les 2 jours).
# 10# force la base 10 (évite l'interprétation octale de 08/09).
DAY=$(date +%d)
if (( 10#$DAY % 2 == 0 )); then
  echo "Jour pair ($DAY) — pas de publication aujourd'hui." | tee -a "$RUN_LOG"
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
  echo "Le cron blog-publish-daily n'a pas publié : working tree Mac mini sale. Nettoyer le repo (cf. procédure rescue)." \
    | "$SCRIPT_DIR/send-report.sh" "⚠️ blog-publish : working tree sale" >> "$RUN_LOG" 2>&1 || true
  exit 0
fi

git pull --ff-only origin main >> "$RUN_LOG" 2>&1 || {
  echo "ERREUR: git pull échoué" | tee -a "$RUN_LOG"
  exit 1
}

# Publier le prochain article. Le script écrit published_slug / published_title
# dans le fichier pointé par GITHUB_OUTPUT (réutilisation du mécanisme GitHub Actions).
rm -f "$OUT_FILE"
GITHUB_OUTPUT="$OUT_FILE" "$NODE_BIN" scripts/publish-next-blog-article.mjs >> "$RUN_LOG" 2>&1

if [[ -f "$OUT_FILE" ]] && grep -q "^published_slug=" "$OUT_FILE"; then
  PUBLISHED_SLUG=$(grep "^published_slug=" "$OUT_FILE" | head -1 | cut -d= -f2-)
  PUBLISHED_TITLE=$(grep "^published_title=" "$OUT_FILE" | head -1 | cut -d= -f2-)
  echo "Publié : $PUBLISHED_SLUG ($PUBLISHED_TITLE)" | tee -a "$RUN_LOG"

  # Commit + push
  git add -A
  git commit -m "chore(blog): publish next article ($DATE_TAG) — $PUBLISHED_SLUG" >> "$RUN_LOG" 2>&1
  git push origin main >> "$RUN_LOG" 2>&1
  echo "Commit + push OK." | tee -a "$RUN_LOG"

  # Email récap via Resend
  cat <<EOF | "$SCRIPT_DIR/send-report.sh" "📝 Article blog publié : $PUBLISHED_TITLE" >> "$RUN_LOG" 2>&1 || true
Nouvel article publié automatiquement sur le blog Enomia.

Titre : $PUBLISHED_TITLE
URL   : https://www.enomia.app/blog/$PUBLISHED_SLUG

Publié par le cron blog-publish-daily (1 article tous les 2 jours, jours impairs 08h17).
Pour réordonner ou ajouter des articles : scripts/blog-publish-queue.json
Pour mettre en pause : bash scripts/blog-publish-daily/uninstall.sh (sur le Mac mini)
EOF
  echo "Email récap envoyé." | tee -a "$RUN_LOG"
else
  echo "Aucun article publié (queue vide ou tout déjà en-ligne)." | tee -a "$RUN_LOG"
fi

rm -f "$OUT_FILE"
echo "===== blog-publish-daily end $(date -Iseconds) =====" | tee -a "$RUN_LOG"
