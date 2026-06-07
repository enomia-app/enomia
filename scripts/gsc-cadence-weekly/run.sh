#!/bin/bash
# gsc-cadence-weekly : lundi ~9h45 (après le bilan GSC du lundi). Lit l'historique d'indexation
# (state.json → bilans), demande à Claude une décision de cadence par niche, l'applique avec
# garde-fous DURS (clamp [1,6] + plafond 20 pages/sem via gsc-cadence-apply.mjs), commit + push
# publication-cadence.json, et envoie un mail à Marc avec la décision + le pourquoi.
# ⚠️ Créé/activé DEPUIS le Mac mini. IA sur OAuth Max (jamais l'API au token).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"; mkdir -p "$LOGS_DIR"
DATE_TAG="$(date +%Y-%m-%d)"
RUN_LOG="$LOGS_DIR/run-$DATE_TAG.log"
SEND_REPORT="$REPO_ROOT/scripts/tech-watchdog/send-report.sh"
cd "$REPO_ROOT"; export REPO="$REPO_ROOT"
unset ANTHROPIC_API_KEY || true

echo "===== gsc-cadence-weekly start $(date -Iseconds) =====" | tee -a "$RUN_LOG"
git pull --ff-only origin main >>"$RUN_LOG" 2>&1 || true

email() { [[ -x "$SEND_REPORT" ]] && printf '%s\n' "$2" | "$SEND_REPORT" "$1" >>"$RUN_LOG" 2>&1 || true; }

# Bilans des ~14 derniers jours (depuis state.json, écrit par gsc-bilan.mjs). Vide si pas encore de data.
BILANS="$(node -e 'try{const s=require(process.env.REPO+"/.claude/gsc-tracking/state.json");const b=s.bilans||{};const ds=Object.keys(b).sort().slice(-14);if(!ds.length){process.exit(2)}console.log(ds.map(d=>d+" : "+JSON.stringify(b[d].perSection||b[d])).join("\n"))}catch(e){process.exit(2)}' 2>>"$RUN_LOG")" || {
  echo "Pas encore de bilans GSC dans state.json — cadence inchangée." | tee -a "$RUN_LOG"
  email "[cadence] $DATE_TAG — pas encore de data GSC, cadence inchangée" "L'agent de cadence n'a pas trouvé de bilans d'indexation (state.json.bilans vide). Cadence laissée telle quelle. Reviendra lundi prochain."
  exit 0
}

CADENCE="$(cat scripts/publication-cadence.json)"
PROMPT="Tu es l'agent de cadence de publication SEO d'Enomia. Décide combien de villes/zones publier PAR RUN pour chaque niche (conciergerie, love-room, cabane), selon la santé d'indexation Google.

SANTÉ GSC (bilans des derniers jours, par section : total/indexed/pending/blocked) :
$BILANS

CADENCE ACTUELLE + bornes :
$CADENCE

RÈGLES :
- Objectif : publier le plus possible TANT QUE Google indexe bien.
- Si une niche a beaucoup de pages 'pending' qui ne passent pas 'indexed' au fil des jours → Google ne suit pas : NE PAS monter, voire baisser de 1.
- Si une niche indexe bien (taux élevé, peu de pending) → tu peux monter de +1 (max).
- Bouge d'au plus ±1 par niche par semaine. Domaine jeune (2 mois) → prudence.
- Bornes : [1,6] par run par niche ; plafond global 20 pages/semaine (le script le forcera de toute façon).

Réponds UNIQUEMENT par un objet JSON, rien d'autre :
{\"conciergerie\": N, \"love-room\": N, \"cabane\": N, \"reason\": \"2-3 phrases : la décision par niche et pourquoi\"}"

OUT="$(printf '%s' "$PROMPT" | claude -p --model haiku --dangerously-skip-permissions --output-format text 2>>"$RUN_LOG")" || true
echo "Sortie IA : $OUT" >>"$RUN_LOG"

if ! printf '%s' "$OUT" | grep -q '{'; then
  echo "🚫 Pas de JSON (auth claude ?) — cadence inchangée" | tee -a "$RUN_LOG"
  email "[cadence] $DATE_TAG — 🚫 décision impossible (auth claude ?)" "L'agent n'a pas pu décider (sortie sans JSON, possible déconnexion claude sur le Mac mini). Cadence INCHANGÉE. Sortie : $OUT"
  exit 1
fi

APPLY="$(printf '%s' "$OUT" | node scripts/gsc-cadence-apply.mjs 2>>"$RUN_LOG")" || {
  echo "❌ apply KO" | tee -a "$RUN_LOG"; email "[cadence] $DATE_TAG — ❌ apply KO" "Échec d'application de la décision. Cadence inchangée. Voir log."; exit 1;
}
echo "$APPLY" | tee -a "$RUN_LOG"

if ! git diff --quiet scripts/publication-cadence.json; then
  git add scripts/publication-cadence.json
  git commit -m "chore(cadence): ajustement hebdo selon santé GSC ($DATE_TAG)" >>"$RUN_LOG" 2>&1
  git push origin main >>"$RUN_LOG" 2>&1 || { git pull --ff-only origin main >>"$RUN_LOG" 2>&1 && git push origin main >>"$RUN_LOG" 2>&1 || echo "⚠️ push KO" | tee -a "$RUN_LOG"; }
  echo "✅ cadence commitée + poussée" | tee -a "$RUN_LOG"
  email "[cadence] $DATE_TAG — cadence ajustée" "$APPLY

(Tu peux rectifier en éditant scripts/publication-cadence.json puis commit/push.)"
else
  echo "Cadence inchangée (décision = statu quo)" | tee -a "$RUN_LOG"
  email "[cadence] $DATE_TAG — statu quo" "$APPLY"
fi

echo "===== gsc-cadence-weekly end $(date -Iseconds) =====" | tee -a "$RUN_LOG"
