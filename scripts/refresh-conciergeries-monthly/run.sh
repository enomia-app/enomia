#!/bin/bash
# refresh-conciergeries-monthly — wrapper launchd, exécuté le 3 de chaque mois (Mac mini).
#
# Rafraîchit les notes Google des conciergeries + la date « MAJ » des pages, puis
# commit/push sur main (Vercel redéploie). 100 % déterministe : AUCUN `claude -p`
# (donc zéro coût API LLM — cf. incident spike mai 2026). Seul coût = Google Places
# API (~$10, couvert par le crédit gratuit $200/mois Maps Platform).
#
# Étapes : pull main → refresh Places → apply (garde-fous) → bump dates MAJ →
#          validate → audit liens → commit/push main → email récap.
# Toute erreur → rollback working tree + email d'alerte + exit.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"
DATE_TAG="$(date +%Y-%m-%d)"
RUN_LOG="$LOGS_DIR/run-$DATE_TAG.log"
SEND_REPORT="$SCRIPT_DIR/send-report.sh"

mkdir -p "$LOGS_DIR"
cd "$REPO_ROOT"

log() { echo "$@" | tee -a "$RUN_LOG"; }
notify_fail() {
  # $1 = sujet court. Corps = fin du log.
  log "❌ $1"
  { echo "Refresh conciergeries ÉCHEC le $DATE_TAG sur le Mac mini."; echo ""; echo "Raison : $1"; echo ""; echo "--- fin du log ---"; tail -n 40 "$RUN_LOG"; } \
    | bash "$SEND_REPORT" "⚠️ Refresh conciergeries KO — $1 ($DATE_TAG)" || true
}

log "===== refresh-conciergeries-monthly start $(date -Iseconds) ====="
log "Repo: $REPO_ROOT"

# --- 0. Garde-fous environnement ------------------------------------------
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
if [[ "$BRANCH" != "main" ]]; then
  notify_fail "pas sur main (branche=$BRANCH) — refresh annulé"
  exit 0
fi

# Clé Places API : env d'abord, sinon emplacements connus (MBP vs Mac mini).
if [[ -z "${GOOGLE_PLACES_API_KEY:-}" ]]; then
  for envf in "$HOME/projects/Neocamino/.env" "/Users/marc/Desktop/Neocamino/.env" "$REPO_ROOT/.env"; do
    if [[ -f "$envf" ]] && grep -q '^GOOGLE_PLACES_API_KEY=' "$envf"; then
      GOOGLE_PLACES_API_KEY="$(grep '^GOOGLE_PLACES_API_KEY=' "$envf" | head -1 | cut -d'=' -f2-)"
      GOOGLE_PLACES_API_KEY="${GOOGLE_PLACES_API_KEY//\"/}"
      GOOGLE_PLACES_API_KEY="${GOOGLE_PLACES_API_KEY//\'/}"
      GOOGLE_PLACES_API_KEY="$(printf '%s' "$GOOGLE_PLACES_API_KEY" | tr -d '[:space:]')"
      export GOOGLE_PLACES_API_KEY
      log "Clé Places chargée depuis $envf"
      break
    fi
  done
fi
if [[ -z "${GOOGLE_PLACES_API_KEY:-}" ]]; then
  notify_fail "GOOGLE_PLACES_API_KEY introuvable (ni env, ni Neocamino/.env, ni repo/.env)"
  exit 1
fi

# --- 1. Sync main (working tree doit être clean) --------------------------
if [[ -n "$(git status --porcelain)" ]]; then
  notify_fail "working tree pollué avant refresh — abort (cf. règle d'or Mac mini)"
  exit 0
fi
git pull --ff-only origin main >>"$RUN_LOG" 2>&1 || { notify_fail "git pull --ff-only KO"; exit 1; }

# --- 2. Refresh Places API → snapshot -------------------------------------
log "Refresh Places API (toutes villes)..."
if ! node scripts/refresh-conciergeries-google.mjs --json > scripts/places-audit-output.json 2>>"$RUN_LOG"; then
  git checkout -- scripts/places-audit-output.json 2>/dev/null || true
  notify_fail "refresh-conciergeries-google.mjs a échoué (API ?)"
  exit 1
fi

# --- 3. Apply corrections (garde-fous 4 couches intégrés) -----------------
log "Apply corrections..."
if ! node scripts/apply-places-corrections.mjs >>"$RUN_LOG" 2>&1; then
  git checkout -- src/data/cities.ts scripts/places-audit-output.json 2>/dev/null || true
  notify_fail "apply-places-corrections.mjs a échoué (garde-fou déclenché ?)"
  exit 1
fi

# --- 4. Bump des dates « MAJ » (toutes villes + badge index) --------------
log "Bump dates MAJ..."
node scripts/refresh-conciergeries-monthly/bump-updated-dates.mjs >>"$RUN_LOG" 2>&1 || { notify_fail "bump-updated-dates KO"; git checkout -- . ; exit 1; }

# --- 4b. Auto-nettoyage des chiffres d'avis dans les descriptions ---------
# Le cron conciergerie-production ajoute des villes "pré-fix" (chiffres d'avis en
# prose) sur main. On purge avant le validate pour que le refresh ne plante pas.
log "Clean descriptions (purge chiffres d'avis)..."
node scripts/clean-conciergerie-descriptions.mjs >>"$RUN_LOG" 2>&1 || { notify_fail "clean-conciergerie-descriptions KO"; git checkout -- . ; exit 1; }

# --- 5. Validation garde-fou ----------------------------------------------
log "Validation cities..."
if ! node scripts/validate-cities.mjs >>"$RUN_LOG" 2>&1; then
  git checkout -- . 2>/dev/null || true
  notify_fail "validate-cities.mjs KO — changements annulés"
  exit 1
fi

# --- 6. Audit liens internes ----------------------------------------------
log "Audit liens internes..."
if ! npm run --silent audit:blog-links >>"$RUN_LOG" 2>&1; then
  git checkout -- . 2>/dev/null || true
  notify_fail "audit:blog-links KO — changements annulés"
  exit 1
fi

# --- 7. Commit + push (seulement si changement) ---------------------------
if [[ -z "$(git status --porcelain)" ]]; then
  log "Aucun changement à committer (notes stables ce mois-ci, dates déjà à jour)."
  echo "Refresh conciergeries OK le $DATE_TAG : aucun changement (notes stables)." \
    | bash "$SEND_REPORT" "✅ Refresh conciergeries OK (aucun changement) — $DATE_TAG" || true
  log "===== end $(date -Iseconds) ====="
  exit 0
fi

git add src/data/cities.ts src/pages/conciergerie-airbnb/index.astro \
        scripts/places-audit-output.json scripts/places-corrections-changelog.json >>"$RUN_LOG" 2>&1
git commit -m "chore(conciergerie): refresh mensuel notes Google + date MAJ ($DATE_TAG)" >>"$RUN_LOG" 2>&1 \
  || { notify_fail "git commit KO (hook pre-commit ?)"; git checkout -- . ; exit 1; }
git push origin main >>"$RUN_LOG" 2>&1 || { notify_fail "git push origin main KO"; exit 1; }

# --- 8. Email récap des changements ---------------------------------------
RECAP="$(node scripts/refresh-conciergeries-monthly/build-recap.mjs 2>>"$RUN_LOG" || echo 'récap indisponible')"
{ echo "Refresh conciergeries OK le $DATE_TAG — commit poussé sur main, Vercel redéploie."; echo ""; echo "$RECAP"; } \
  | bash "$SEND_REPORT" "✅ Refresh conciergeries — $DATE_TAG" || true

log "===== refresh-conciergeries-monthly end $(date -Iseconds) ====="
