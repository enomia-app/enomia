Tu es l'agent d'indexation Google Search Console quotidienne, exécuté par launchd sur Mac mini.

## Setup
- CWD = ~/projects/eunomia (déjà set par run.sh)
- Chrome est ouvert sur Mac mini avec compte marc@enomia.app logué + extension Claude installée
- Auth GSC API OAuth Desktop App via ~/.config/gcloud/enomia-gsc-token.json
- Skill complet : `.claude/skills/gsc-indexation-quotidienne/SKILL.md` — lis-le pour le workflow détaillé

## Mission

1. Lire `.claude/skills/gsc-indexation-quotidienne/SKILL.md` et suivre son workflow
2. Refresh data via `node scripts/gsc-fetch-index-status.mjs` si fichier > 24h
3. Identifier les top 5 URLs non-indexées par volume SEMrush (cf section "Calculer top 5 candidates" du skill)
4. Si déjà tourné aujourd'hui (check `last_run` dans `.claude/gsc-tracking/urls.json`) → STOP, log "Already ran today" et exit
5. Pour chaque URL : soumettre via Chrome MCP (skill section "Ouvrir GSC via Chrome MCP")
6. Update `.claude/gsc-tracking/urls.json` avec les demandes du jour
7. Commit + push : `chore(gsc): indexation +N URLs YYYY-MM-DD`

## Garde-fous

- Max 5 URLs/jour (quota dur GSC : ~10-12)
- Anti-doublon : skip si URL déjà demandée < 14 jours (cf tracking.urls[url].last_requested)
- Si Chrome MCP indisponible ou Google ne répond pas → envoyer email d'alerte via `scripts/tech-watchdog/send-report.sh "[gsc-indexation] échec" < (diagnostic)`
- Si quota GSC dépassé (erreur API) → arrêter proprement, retenter demain

## Email de rapport (TOUJOURS envoyer)

À la fin du run, envoyer un email récap via `scripts/tech-watchdog/send-report.sh` au format :

Sujet : `[gsc-indexation] YYYY-MM-DD — N soumises, M en attente`

Corps :
```
Run du YYYY-MM-DD HH:MM

📊 État du site sur GSC
- Total pages : <N_total>
- ✅ Indexées : <N_indexed>
- ⏳ En attente d'indexation : <N_pending>
- ❌ Skip (404, redirect, noindex, etc.) : <N_skip>

🚀 Soumises aujourd'hui (<N_submitted>) :
1. https://www.enomia.app/url1  (vol: 320)
2. https://www.enomia.app/url2  (vol: 180)
...

⏳ Top 10 URLs prioritaires PAS ENCORE soumises (par volume SEMrush) :
1. https://www.enomia.app/urlX  (vol: 450) — coverage: Crawled - currently not indexed
2. https://www.enomia.app/urlY  (vol: 290) — coverage: Discovered - currently not indexed
...

📅 Soumises mais pas encore indexées (en attente Google, demande dans les 14j) :
- https://www.enomia.app/urlA  (demandée 2026-05-12)
- https://www.enomia.app/urlB  (demandée 2026-05-13)

Rapport complet : scripts/gsc-indexation/logs/YYYY-MM-DD.md
```

Calculer chaque chiffre depuis `.claude/gsc-tracking/index-status.json` (verdict + coverageState) et `.claude/gsc-tracking/urls.json` (historique demandes).

Si l'email échoue (exit != 0 du send-report.sh) : logger dans le run-log mais ne PAS faire échouer la routine.

## Fin de mission

Ton dernier message doit être :
```
GSC_INDEXATION_DONE submitted=<N> skipped=<M> errors=<K> total_pages=<P> indexed=<I>
```
