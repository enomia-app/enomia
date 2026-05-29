#!/bin/bash
# conciergerie-production — wrapper launchd lundi/mercredi/vendredi 8h30.
# Génère 2 nouvelles villes conciergerie via Claude + SEMrush + WebFetch, push direct, email récap.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROMPT_FILE="$SCRIPT_DIR/prompt.md"
LOGS_DIR="$SCRIPT_DIR/logs"
DATE_TAG="$(date +%Y-%m-%d)"
RUN_LOG="$LOGS_DIR/run-$DATE_TAG.log"

mkdir -p "$LOGS_DIR"

cd "$REPO_ROOT"

# Snapshot des slugs AVANT génération → permet de détecter les villes ajoutées par Claude
# pour corriger leurs notes via l'API Places juste après (déterministe, source de vérité).
SLUGS_BEFORE="$(grep -oE "slug: '[^']+'" src/data/cities.ts | sort)"

echo "===== conciergerie-production start $(date -Iseconds) =====" | tee -a "$RUN_LOG"
echo "Repo: $REPO_ROOT" | tee -a "$RUN_LOG"
echo "Prompt: $PROMPT_FILE" | tee -a "$RUN_LOG"

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "ERREUR: prompt introuvable à $PROMPT_FILE" | tee -a "$RUN_LOG"
  exit 1
fi

# Localiser claude
CLAUDE_BIN="$(which claude 2>/dev/null || true)"
if [[ -z "$CLAUDE_BIN" ]]; then
  for candidate in "$HOME/.claude/local/claude" "/opt/homebrew/bin/claude" "/usr/local/bin/claude"; do
    if [[ -x "$candidate" ]]; then
      CLAUDE_BIN="$candidate"
      break
    fi
  done
fi
if [[ -z "$CLAUDE_BIN" ]]; then
  echo "ERREUR: binaire 'claude' introuvable." | tee -a "$RUN_LOG"
  exit 1
fi
echo "Claude bin: $CLAUDE_BIN" | tee -a "$RUN_LOG"

# Lancer Claude avec le prompt depuis fichier
"$CLAUDE_BIN" -p "$(cat "$PROMPT_FILE")" \
  --output-format text \
  --dangerously-skip-permissions \
  >> "$RUN_LOG" 2>&1 || {
    EXIT_CODE=$?
    echo "ERREUR: claude -p a échoué (exit $EXIT_CODE)" | tee -a "$RUN_LOG"
    osascript -e 'display notification "Échec production conciergerie" with title "conciergerie" subtitle "⚠️ Voir log" sound name "Sosumi"' || true
    exit 1
  }

# === Correction Places des villes nouvellement créées ===========================
# Claude génère les notes depuis des snippets Google (approximatives). On les remplace
# par les vraies données Places API. NON-BLOQUANT : si ça échoue, les villes restent en
# ligne (notes approx) et le refresh mensuel les corrigera de toute façon.
correct_places() {
  if [[ -z "${GOOGLE_PLACES_API_KEY:-}" ]]; then
    for envf in "$HOME/projects/Neocamino/.env" "/Users/marc/Desktop/Neocamino/.env" "$REPO_ROOT/.env"; do
      if [[ -f "$envf" ]] && grep -q '^GOOGLE_PLACES_API_KEY=' "$envf"; then
        GOOGLE_PLACES_API_KEY="$(grep '^GOOGLE_PLACES_API_KEY=' "$envf" | head -1 | cut -d= -f2-)"
        GOOGLE_PLACES_API_KEY="${GOOGLE_PLACES_API_KEY//\"/}"; GOOGLE_PLACES_API_KEY="${GOOGLE_PLACES_API_KEY//\'/}"
        GOOGLE_PLACES_API_KEY="$(printf '%s' "$GOOGLE_PLACES_API_KEY" | tr -d '[:space:]')"
        export GOOGLE_PLACES_API_KEY; break
      fi
    done
  fi
  [[ -z "${GOOGLE_PLACES_API_KEY:-}" ]] && { echo "  ⚠️ clé Places absente, skip correction" | tee -a "$RUN_LOG"; return 0; }

  git pull --ff-only origin main >>"$RUN_LOG" 2>&1 || true
  local SLUGS_AFTER NEW
  SLUGS_AFTER="$(grep -oE "slug: '[^']+'" src/data/cities.ts | sort)"
  NEW="$(comm -13 <(echo "$SLUGS_BEFORE") <(echo "$SLUGS_AFTER") | sed "s/.*slug: '//; s/'.*//")"
  [[ -z "$NEW" ]] && { echo "  aucune nouvelle ville détectée" | tee -a "$RUN_LOG"; return 0; }
  echo "  nouvelles villes : $(echo $NEW | tr '\n' ' ')" | tee -a "$RUN_LOG"

  : > /tmp/cp-slugs.txt
  for slug in $NEW; do
    if node scripts/refresh-conciergeries-google.mjs --ville="$slug" --json > "/tmp/cp-$slug.json" 2>>"$RUN_LOG"; then
      echo "$slug" >> /tmp/cp-slugs.txt
    fi
  done
  [[ ! -s /tmp/cp-slugs.txt ]] && { echo "  aucun refresh réussi, skip" | tee -a "$RUN_LOG"; return 0; }
  node -e 'const fs=require("fs");const slugs=fs.readFileSync("/tmp/cp-slugs.txt","utf8").trim().split("\n");const all=slugs.flatMap(s=>JSON.parse(fs.readFileSync("/tmp/cp-"+s+".json")));fs.writeFileSync("scripts/places-audit-output.json",JSON.stringify(all,null,2));' || return 0

  node scripts/apply-places-corrections.mjs >>"$RUN_LOG" 2>&1 || { echo "  ⚠️ apply KO" | tee -a "$RUN_LOG"; git checkout -- src/data/cities.ts scripts/places-audit-output.json 2>/dev/null; return 0; }
  node scripts/clean-conciergerie-descriptions.mjs >>"$RUN_LOG" 2>&1 || true
  if ! node scripts/validate-cities.mjs >>"$RUN_LOG" 2>&1; then
    echo "  ⚠️ validate KO après correction, rollback" | tee -a "$RUN_LOG"; git checkout -- src/data/cities.ts 2>/dev/null; return 0
  fi
  if [[ -n "$(git status --porcelain src/data/cities.ts)" ]]; then
    git add src/data/cities.ts scripts/places-audit-output.json scripts/places-corrections-changelog.json
    git commit -m "fix(conciergerie): notes Places exactes sur les villes auto ($DATE_TAG)" >>"$RUN_LOG" 2>&1
    git push origin main >>"$RUN_LOG" 2>&1 && echo "  ✅ notes corrigées + poussées" | tee -a "$RUN_LOG" || echo "  ⚠️ push correction KO" | tee -a "$RUN_LOG"
  else
    echo "  notes déjà exactes" | tee -a "$RUN_LOG"
  fi
}
echo "--- Correction Places des nouvelles villes ---" | tee -a "$RUN_LOG"
correct_places || true

echo "===== conciergerie-production end $(date -Iseconds) =====" | tee -a "$RUN_LOG"
