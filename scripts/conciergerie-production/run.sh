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
# par les vraies données Places API — UNIQUEMENT pour les villes que Claude vient d'ajouter.
#
# ⚠️ RÈGLE D'OR : ce flux n'écrit JAMAIS dans les snapshots canoniques
#    scripts/places-audit-output.json ni scripts/places-corrections-changelog.json
#    (~350 items, écrits uniquement par le refresh mensuel avec l'audit COMPLET). On passe
#    par des fichiers /tmp via --input/--changelog-out. Historique : écrire l'audit partiel
#    (~24 items) dans le fichier canonique laissait un working tree sale en permanence →
#    blocage de la sync launchd app.enomia.git-pull. Les nouvelles villes entreront dans le
#    snapshot canonique au prochain refresh mensuel (qui ré-audite TOUTES les villes).
# NON-BLOQUANT : si ça échoue, les villes restent en ligne (notes approx) et le refresh
#    mensuel les corrigera. En cas d'échec on restaure cities.ts → tree toujours clean.
CP_AUDIT="/tmp/cp-audit-$DATE_TAG.json"
CP_CHANGELOG="/tmp/cp-changelog-$DATE_TAG.json"

# Restaure un working tree propre (règle d'or) sans jamais perdre un commit déjà créé :
# - cities.ts ramené à HEAD (annule les corrections non commitées)
# - garde-fou : les snapshots canoniques ne doivent jamais rester modifiés par ce cron
restore_clean_tree() {
  git checkout HEAD -- src/data/cities.ts 2>/dev/null || true
  git checkout -- scripts/places-audit-output.json scripts/places-corrections-changelog.json 2>/dev/null || true
}

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

  # Combine les audits par ville dans un fichier TEMP (jamais le snapshot canonique).
  if ! node -e 'const fs=require("fs");const slugs=fs.readFileSync("/tmp/cp-slugs.txt","utf8").trim().split("\n");const all=slugs.flatMap(s=>JSON.parse(fs.readFileSync("/tmp/cp-"+s+".json")));fs.writeFileSync(process.argv[1],JSON.stringify(all,null,2));' "$CP_AUDIT" 2>>"$RUN_LOG"; then
    echo "  ⚠️ combinaison audit KO, skip" | tee -a "$RUN_LOG"; return 0
  fi

  # Apply depuis le TEMP → patche cities.ts uniquement (changelog en /tmp, pas le canonique).
  if ! node scripts/apply-places-corrections.mjs --input="$CP_AUDIT" --changelog-out="$CP_CHANGELOG" >>"$RUN_LOG" 2>&1; then
    echo "  ⚠️ apply KO — restauration cities.ts" | tee -a "$RUN_LOG"; restore_clean_tree; return 0
  fi
  node scripts/clean-conciergerie-descriptions.mjs >>"$RUN_LOG" 2>&1 || true
  if ! node scripts/validate-cities.mjs >>"$RUN_LOG" 2>&1; then
    echo "  ⚠️ validate KO après correction — restauration cities.ts" | tee -a "$RUN_LOG"; restore_clean_tree; return 0
  fi

  if [[ -z "$(git status --porcelain src/data/cities.ts)" ]]; then
    echo "  notes déjà exactes (rien à committer)" | tee -a "$RUN_LOG"; restore_clean_tree; return 0
  fi

  # Commit FIABLE : seulement cities.ts. Si le commit échoue (hook pre-commit, etc.), on
  # restaure cities.ts pour ne JAMAIS laisser le tree sale (le refresh mensuel recorrigera).
  git add src/data/cities.ts
  if ! git commit -m "fix(conciergerie): notes Places exactes sur les villes auto ($DATE_TAG)" >>"$RUN_LOG" 2>&1; then
    echo "  ⚠️ commit KO (hook ?) — restauration cities.ts pour garder le tree clean" | tee -a "$RUN_LOG"
    restore_clean_tree; return 0
  fi
  if git push origin main >>"$RUN_LOG" 2>&1; then
    echo "  ✅ notes corrigées + poussées" | tee -a "$RUN_LOG"
  else
    # Push KO : le commit local est conservé (tree clean). Tentative pull --ff-only + repush.
    if git pull --ff-only origin main >>"$RUN_LOG" 2>&1 && git push origin main >>"$RUN_LOG" 2>&1; then
      echo "  ✅ notes corrigées + poussées (après pull)" | tee -a "$RUN_LOG"
    else
      echo "  ⚠️ push KO — commit local conservé, sera poussé au prochain run" | tee -a "$RUN_LOG"
    fi
  fi
  restore_clean_tree
}
echo "--- Correction Places des nouvelles villes ---" | tee -a "$RUN_LOG"
correct_places || true

echo "===== conciergerie-production end $(date -Iseconds) =====" | tee -a "$RUN_LOG"
