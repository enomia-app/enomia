#!/bin/bash
# tech-watchdog — tests hebdo du site (appelé par run.sh le lundi).
#
# Lance, CONTRE LA PROD (baseURL par défaut = https://www.enomia.app) :
#   1. le smoke-test « toutes les pages » (lecture seule, suit le sitemap)
#   2. les tests ciblés tools.spec.ts (simulateur/contrat/facture/isolation)
#      → écrivent dans la base Supabase de prod puis nettoient (comptes e2e).
#
# Email (Resend) + notif macOS si rouge. N'échoue JAMAIS le watchdog (exit 0).
#
# Lançable à la main n'importe quand, ex. avant un déploiement :
#   bash scripts/tech-watchdog/run-weekly-tests.sh
# Surcharger la cible : E2E_BASE_URL=http://localhost:4321 bash …/run-weekly-tests.sh

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"
DATE_TAG="$(date +%Y-%m-%d)"
TEST_LOG="$LOGS_DIR/weekly-tests-$DATE_TAG.log"
SEND_REPORT="$SCRIPT_DIR/send-report.sh"

mkdir -p "$LOGS_DIR"
cd "$REPO_ROOT"

notify() {
  osascript -e "display notification \"$1\" with title \"tech-watchdog\" subtitle \"$2\" sound name \"Sosumi\"" 2>/dev/null || true
}

echo "===== weekly-tests start $(date -Iseconds) =====" | tee "$TEST_LOG"

# 1) Navigateur Playwright présent ? (sinon on prévient au lieu de planter)
if ! ls "$HOME/Library/Caches/ms-playwright/" 2>/dev/null | grep -qi chromium; then
  MSG="Navigateur Playwright absent. Une fois sur le Mac mini :
  cd $REPO_ROOT && npx playwright install chromium"
  echo "$MSG" | tee -a "$TEST_LOG"
  notify "Navigateur Playwright manquant" "Tests hebdo non lancés"
  [[ -x "$SEND_REPORT" ]] && printf '%s\n' "$MSG" | "$SEND_REPORT" "[watchdog] Tests hebdo : navigateur Playwright manquant" >> "$TEST_LOG" 2>&1 || true
  exit 0
fi

# 2) Charger SUPABASE_SERVICE_ROLE_KEY depuis .env (requis par tools.spec.ts pour
#    supprimer les comptes de test). Absente → on se rabat sur le smoke seul.
TOOLS_OK=1
if [[ -f "$REPO_ROOT/.env" ]]; then
  KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" "$REPO_ROOT/.env" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")
  if [[ -n "$KEY" ]]; then export SUPABASE_SERVICE_ROLE_KEY="$KEY"; else TOOLS_OK=0; fi
else
  TOOLS_OK=0
fi

if [[ "$TOOLS_OK" == "1" ]]; then
  SPECS="smoke-all-pages tools"
else
  echo "SUPABASE_SERVICE_ROLE_KEY absent de .env — tests ciblés ignorés, smoke seul." | tee -a "$TEST_LOG"
  SPECS="smoke-all-pages"
fi

# 3) Lancer les tests.
echo "Specs : $SPECS — cible : ${E2E_BASE_URL:-https://www.enomia.app}" | tee -a "$TEST_LOG"
npx playwright test $SPECS --reporter=line >> "$TEST_LOG" 2>&1
RESULT=$?

# 4) Notifier selon le résultat.
SUMMARY=$(grep -E "passed|failed|✗|\[smoke\]" "$TEST_LOG" | tail -25)
if [[ $RESULT -ne 0 ]]; then
  notify "Tests hebdo en échec — voir email" "Régression possible"
  [[ -x "$SEND_REPORT" ]] && printf 'Les tests hebdo du site ont échoué (%s).\n\nRésumé :\n%s\n\nLog complet sur le Mac mini : %s\n' "$DATE_TAG" "$SUMMARY" "$TEST_LOG" | "$SEND_REPORT" "[watchdog] Tests hebdo du site en échec" >> "$TEST_LOG" 2>&1 || true
else
  echo "Tests hebdo OK" | tee -a "$TEST_LOG"
fi

echo "===== weekly-tests end $(date -Iseconds) =====" | tee -a "$TEST_LOG"
exit 0
