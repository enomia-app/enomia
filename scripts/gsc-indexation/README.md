# GSC Indexation Quotidienne (Playwright + profil Chrome dédié)

Pipeline cron qui soumet 10 URLs/jour à l'URL Inspection Tool de Google Search Console, via Playwright + un profil Chromium persistant où Marc s'est logué une fois manuellement. Aucune dépendance à Claude Code, Chrome MCP, ou export de cookies.

## Architecture

```
launchd Mac mini 7h03
└── run.sh
    ├── jq anti-doublon (last_run == today → STOP)
    ├── node gsc-fetch-index-status.mjs    (si > 24h)
    ├── node compute-candidates.mjs        → candidates-today.json (top 10)
    ├── node submit-via-chrome.mjs         → Playwright profil dédié, update urls.json
    ├── git commit + push (urls.json)
    └── node build-email-report.mjs | send-report.sh   → email récap
```

## Setup initial (une fois par machine, **VNC obligatoire**)

Le mode `--setup` ouvre Chrome avec écran (`headless: false`), donc il faut accès au desktop du Mac mini. Via VNC :

1. Sur Mac mini, terminal :
   ```bash
   cd ~/projects/eunomia
   node scripts/gsc-indexation/submit-via-chrome.mjs --setup
   ```
2. Une fenêtre Chrome s'ouvre sur GSC. Logge-toi avec un compte **Owner** de la propriété enomia.app (`marchenut@gmail.com` ou `marc@enomia.app`).
3. Confirme que tu vois bien le dashboard GSC enomia.app.
4. **Ferme la fenêtre Chrome** (clic sur la croix rouge).
5. Le profil est sauvé dans `~/.playwright-gsc-indexation/`.

Les runs suivants sont 100% automatiques en headless, sans réauthentification.

## Pourquoi un profil Chrome dédié et pas un export de cookies ?

Tenté en PR #16 : export cookies via Cookie-Editor → JSON → `addCookies` Playwright. Marche pour le scan FB mais **pas pour GSC** : Google a invalidé la session SID/HSID/SSID au premier run cron, parce que le user-agent Playwright + IP différente du Chrome natif d'origine = fingerprint suspect.

Avec un profil dédié, le user-data-dir contient tous les states (cookies + localStorage + IndexedDB + device fingerprint) et Playwright le réutilise tel quel. Google n'a aucune raison de flag suspect. Pattern identique à `scripts/rs-lcd/fb-scan.mjs`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `run.sh` | Wrapper launchd. Orchestre compute → submit → commit → email. |
| `compute-candidates.mjs` | Calcule top N par volume SEMrush. Sortie : `candidates-today.json`. |
| `submit-via-chrome.mjs` | `--setup` (one-time) ou normal. Playwright + profil dédié. |
| `build-email-report.mjs` | Génère le récap email structuré (sans dump log brut). |
| `~/.playwright-gsc-indexation/` | **Hors repo.** Profil Chromium persistant. |
| `candidates-today.json` | **Gitignored, généré.** Top N du jour. |
| `logs/` | Logs journaliers (run-YYYY-MM-DD.log + YYYY-MM-DD.json + screenshots debug). |

## Exit codes

| Code | Sens | Action |
|---|---|---|
| 0 | OK | rien |
| 2 | candidates-today.json manquant | lancer compute-candidates avant |
| 3 | profil Chrome pas loggué | relancer en `--setup` via VNC |
| 4 | stoppé en cours (quota / CAPTCHA / auth perdue) | check log + email récap |
| autre | erreur fatale | check log complet |

## Maintenance

- **Session Google peut expirer** (typique : 1-6 mois sans activité). Si l'exit 3 apparaît → relancer en `--setup` une fois.
- **Quota Google** : ~10-12/jour par propriété. Si throttling fréquent → baisser `daily_quota` dans `.claude/gsc-tracking/urls.json`.
- **Logs** : `logs/` n'est pas auto-purgé. Cleanup manuel tous les 6 mois.
- **Screenshots de debug** : si bouton introuvable, un PNG est sauvé dans `logs/debug-YYYY-MM-DD-<urlencoded>.png`.

## Historique

- **Avant 2026-05-21** : appelait `gsc-indexing-submit.mjs` (Indexing API). Google ignorait silencieusement.
- **2026-05-21 (PR #14)** : tentative via `claude -p` + skill Chrome MCP. Échec : `claude -p` n'a pas le pairing extension.
- **2026-05-22 (PR #16)** : Playwright + cookies JSON exportés. Test manuel OK. Cron du 23 a échoué : session révoquée par Google (fingerprint suspect).
- **2026-05-23 (ce PR)** : profil Chrome dédié, identique au pattern fb-scan qui tourne stable depuis des mois. Email récap reformaté.
