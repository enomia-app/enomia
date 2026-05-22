# GSC Indexation Quotidienne (Playwright autonome)

Pipeline cron qui soumet 10 URLs/jour à l'URL Inspection Tool de Google Search Console, via Playwright + Chrome headless + cookies persistés. Aucune dépendance à Claude Code ou Chrome MCP.

## Architecture

```
launchd Mac mini 7h03
└── run.sh
    ├── jq anti-doublon (last_run == today → STOP)
    ├── node gsc-fetch-index-status.mjs  (si > 24h)
    ├── node compute-candidates.mjs       → candidates-today.json (top 10)
    ├── node submit-via-chrome.mjs        → Playwright + update urls.json
    ├── git commit + push (urls.json)
    └── send-report.sh                    → email récap
```

## Setup initial (une fois par machine)

### 1. Installer Playwright (déjà installé via `@playwright/test`)
```bash
npx playwright install chromium
```

### 2. Exporter les cookies GSC

Sur le Mac mini, dans Chrome :

1. Installer l'extension [Cookie-Editor](https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm)
2. Aller sur https://search.google.com/search-console (loggué avec marc@enomia.app)
3. Cliquer l'icône Cookie-Editor → Export → Export as JSON
4. Coller le contenu dans :
   ```
   scripts/gsc-indexation/gsc-cookies.json
   ```
5. Refaire l'opération sur le domaine `google.com` (toujours via Cookie-Editor) si la première extraction ne contient pas les cookies SID/HSID/SSID. Ajouter les nouveaux à la liste JSON existante.

Le fichier est `.gitignored` — il ne sera jamais committé.

### 3. Test manuel

```bash
node scripts/gsc-indexation/compute-candidates.mjs
node scripts/gsc-indexation/submit-via-chrome.mjs
```

Si tout marche, le cron de demain matin (7h03) prendra le relais.

## Fichiers

| Fichier | Rôle |
|---|---|
| `run.sh` | Wrapper launchd. Orchestre compute → submit → commit → email. |
| `compute-candidates.mjs` | Lit index-status + volumes SEMrush. Écrit `candidates-today.json`. |
| `submit-via-chrome.mjs` | Lit candidates. Soumet via Playwright. Update `urls.json`. |
| `gsc-cookies.json` | **Privé, gitignored.** Cookies GSC exportés via Cookie-Editor. |
| `candidates-today.json` | **Généré, gitignored.** Top 10 du jour calculé. |
| `logs/` | Logs journaliers (run-YYYY-MM-DD.log + YYYY-MM-DD.json). |

## Exit codes

| Code | Sens | Action |
|---|---|---|
| 0 | OK, toutes soumissions passées | rien |
| 2 | fichiers manquants (cookies/candidates) | faire le setup |
| 3 | cookies expirés (pas loggué à GSC) | refaire l'export Cookie-Editor |
| 4 | stoppé en cours (quota Google ou CAPTCHA) | attendre demain |
| autre | erreur fatale | check log |

## Maintenance

- **Cookies expirent** (typique : 30j à 2 ans selon les cookies). Quand exit 3 → refaire l'export.
- **Quota Google** : ~10-12/jour par propriété. Si throttling fréquent → baisser `daily_quota` dans `.claude/gsc-tracking/urls.json`.
- **Logs** : `logs/` n'est pas auto-purgé. Faire un cleanup manuel tous les 6 mois.

## Historique

- **Avant 2026-05-21** : appelait `gsc-indexing-submit.mjs` (Indexing API). Google ignorait silencieusement.
- **2026-05-21 (PR #14)** : tentative via `claude -p` + skill Chrome MCP. Échec : `claude -p` n'a pas le pairing Chrome MCP.
- **2026-05-22 (ce PR)** : Playwright autonome. Pas de Claude, pas d'extension. Robuste.
