#!/bin/bash
# loveroom-production : génère N villes love room par run (pipeline déterministe), push main, email récap.
#   pull → choisir N villes "todo" → source (Places, région auto) → ai-pass (Haiku/OAuth Max) → build → VALIDATE
#   → marquer "done" → commit/push main → email Resend.
# ⚠️ Créé/activé DEPUIS le Mac mini (jamais le MBP). Le validateur bloque le commit si une page est cassée.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"
DATE_TAG="$(date +%Y-%m-%d)"
RUN_LOG="$LOGS_DIR/run-$DATE_TAG.log"
mkdir -p "$LOGS_DIR"
cd "$REPO_ROOT"
export REPO="$REPO_ROOT"

echo "===== loveroom-production start $(date -Iseconds) =====" | tee -a "$RUN_LOG"

# IA (ai-pass) sur l'abonnement Claude Max, jamais l'API facturée au token
unset ANTHROPIC_API_KEY || true

# Cadence : pilotée par la boucle adaptative GSC (publication-cadence.json) sinon défaut 2
export N="$(node -e 'try{console.log(require(process.env.REPO+"/scripts/publication-cadence.json")["love-room"].villesParRun||2)}catch(e){console.log(2)}')"
echo "Villes ce run : $N" | tee -a "$RUN_LOG"

git pull --ff-only origin main >>"$RUN_LOG" 2>&1 || true

# Clés (Places obligatoire ; Resend pour l'email)
load_key() { local k="$1" f v; for f in "$HOME/projects/Neocamino/.env" "/Users/marc/Desktop/Neocamino/.env" "$REPO_ROOT/.env"; do
  if [[ -f "$f" ]] && grep -q "^$k=" "$f"; then v="$(grep "^$k=" "$f" | head -1 | cut -d= -f2-)"; v="${v//\"/}"; v="${v//\'/}"; printf '%s' "$v" | tr -d '[:space:]'; return; fi
done; }
export GOOGLE_PLACES_API_KEY="${GOOGLE_PLACES_API_KEY:-$(load_key GOOGLE_PLACES_API_KEY)}"
RESEND_API_KEY="$(load_key RESEND_API_KEY)"
[[ -z "${GOOGLE_PLACES_API_KEY:-}" ]] && { echo "ERREUR: clé Places absente" | tee -a "$RUN_LOG"; exit 1; }

# Choisir N villes "todo" (volume décroissant)
export SLUGS_CSV="$(node -e 'const c=require(process.env.REPO+"/scripts/loveroom-cities.json");console.log(c.filter(x=>x.status==="todo").sort((a,b)=>(b.searchVolume||0)-(a.searchVolume||0)).slice(0,+process.env.N).map(x=>x.slug).join(","))')"
[[ -z "$SLUGS_CSV" ]] && { echo "Plus aucune ville todo 🎉 — backlog vidé." | tee -a "$RUN_LOG"; exit 0; }
echo "Villes : $SLUGS_CSV" | tee -a "$RUN_LOG"

restore() { git checkout -- src/data/loveRoomListings.ts src/data/loveRoomCities.ts scripts/loveroom-cities.json 2>/dev/null || true; }

# --- Pipeline -----------------------------------------------------------------
node scripts/loveroom-source.mjs --only="$SLUGS_CSV"   >>"$RUN_LOG" 2>&1 || { echo "❌ source KO"   | tee -a "$RUN_LOG"; restore; exit 1; }
node scripts/loveroom-ai-pass.mjs --ville="$SLUGS_CSV" >>"$RUN_LOG" 2>&1 || { echo "🚫 ai-pass KO (auth claude/OAuth ?) → AUCUNE publication, villes restent todo (réessai au prochain run)" | tee -a "$RUN_LOG"; restore; exit 1; }
node scripts/loveroom-build-data.mjs                    >>"$RUN_LOG" 2>&1 || { echo "❌ build KO"    | tee -a "$RUN_LOG"; restore; exit 1; }
if ! node scripts/loveroom-validate.mjs >>"$RUN_LOG" 2>&1; then
  echo "🚫 VALIDATE KO → aucun commit (restore)" | tee -a "$RUN_LOG"; restore; exit 1
fi

# Marquer les villes "done"
node -e 'const fs=require("fs");const p=process.env.REPO+"/scripts/loveroom-cities.json";const l=JSON.parse(fs.readFileSync(p));const s=process.env.SLUGS_CSV.split(",");for(const e of l)if(s.includes(e.slug))e.status="done";fs.writeFileSync(p,JSON.stringify(l,null,2)+"\n")'

# Commit + push (retry pull --ff-only si push KO)
git add src/data/loveRoomListings.ts src/data/loveRoomCities.ts scripts/loveroom-cities.json
if git commit -m "feat(love-room): villes auto $SLUGS_CSV ($DATE_TAG)" >>"$RUN_LOG" 2>&1; then
  if ! git push origin main >>"$RUN_LOG" 2>&1; then
    git pull --ff-only origin main >>"$RUN_LOG" 2>&1 && git push origin main >>"$RUN_LOG" 2>&1 || echo "⚠️ push KO — commit local conservé" | tee -a "$RUN_LOG"
  fi
  echo "✅ commit/push OK" | tee -a "$RUN_LOG"
else
  echo "⚠️ rien à committer — restore" | tee -a "$RUN_LOG"; restore
fi

# Email récap (Resend)
if [[ -n "${RESEND_API_KEY:-}" ]]; then
  BODY="$(node -e 'const fs=require("fs");const s=fs.readFileSync(process.env.REPO+"/src/data/loveRoomListings.ts","utf8");const eq=s.indexOf("=",s.search(/export const/));const d=JSON.parse(s.slice(eq+1).trim().replace(/;\s*$/,""));const sl=process.env.SLUGS_CSV.split(",");const left=require(process.env.REPO+"/scripts/loveroom-cities.json").filter(x=>x.status==="todo").length;console.log(sl.map(x=>"• "+x+" : "+(d[x]||[]).length+" love rooms").join("<br>")+"<br><br>Reste "+left+" villes au backlog.")')"
  curl -s -X POST https://api.resend.com/emails \
    -H "Authorization: Bearer $RESEND_API_KEY" -H "Content-Type: application/json" \
    -d "{\"from\":\"Enomia <marc@enomia.app>\",\"to\":[\"marc@enomia.app\"],\"subject\":\"Love room publiées : $SLUGS_CSV\",\"html\":\"<b>Nouvelles villes love room ($DATE_TAG)</b><br>$BODY<br><br>Validateur OK ✅\"}" \
    >>"$RUN_LOG" 2>&1 || true
fi

echo "===== loveroom-production end $(date -Iseconds) =====" | tee -a "$RUN_LOG"
