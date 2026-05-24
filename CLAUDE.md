# Enomia — pour Claude

## Dev

- `npm run dev` → Astro dev server, http://localhost:4321
- `npm run build` → build de prod (lance `fix-keystatic` puis `astro build`)
- `npm run preview` → preview du build

## Audits & maintenance

- `npm run audit:blog-links` — liens internes (lancé en pre-commit auto, blocant)
- `npm run audit:blog-links:fix` — corrige automatiquement les WRONG_PATH
- `npm run audit:external` — vérifie aussi les liens externes (lent, manuel)
- `npm run snapshot` — régénère `.claude/acquisition.html` et l'ouvre
- `npm run snapshot:gen` — régénère sans ouvrir
- `npm run gsc:refresh` — refresh data GSC (index status + analytics + snapshot)
- `npm run test:e2e` — Playwright

## Memory

Le contexte projet (identité Marc, projets, conventions, méthode) vit dans
`~/.claude/projects/-Users-marc-Desktop-eunomia/memory/`.

Index principal : `MEMORY.md`. À consulter selon le domaine de travail
(branches `acquisition/*`, `management/*`, `rs/*`, `prospection/backlinks*`, etc.).

## Scheduled tasks — 2 voies possibles

Toutes les tâches planifiées **s'exécutent sur le Mac mini** (always-on,
console marc connectée, Chrome + extensions actives). Deux voies au choix
selon le besoin :

### Voie A — launchd local (préférée par défaut)

Plist macOS native dans `~/Library/LaunchAgents/app.enomia.<name>.plist`
appelant un wrapper `scripts/<name>/run.sh`. Le wrapper invoque
`claude -p` avec la skill et `--dangerously-skip-permissions` (non-interactif).

**Quand l'utiliser** : 99% des cas. Robuste, pas de dépendance à un bridge cloud,
survit aux reboots, surveillance via email Resend (cf. ci-dessous).

**Exemple actif** : `app.enomia.gsc-indexation` → `scripts/gsc-indexation-claude/run.sh`
(quotidien 9h18, lance la skill `gsc-indexation-quotidienne`, envoie un email
récap via `scripts/tech-watchdog/send-report.sh`).

**Convention pour ajouter une nouvelle tâche** :
1. Créer `scripts/<name>/run.sh` (wrapper bash qui lance `claude -p` + log + email)
2. Créer `~/Library/LaunchAgents/app.enomia.<name>.plist` (StartCalendarInterval)
3. Charger : `launchctl bootstrap gui/$UID ~/Library/LaunchAgents/app.enomia.<name>.plist`
4. Tester : `launchctl kickstart -k gui/$UID/app.enomia.<name>`
5. Logs : `scripts/<name>/logs/run-YYYY-MM-DD.log`

### Voie B — cloud routine (claude.ai/code/routines)

Utile **seulement si** tu veux la visibilité dans l'UI claude.ai, les push
notifs téléphone, ou la capacité d'approuver des prompts depuis le tel
(typiquement pour des skills qui peuvent tomber sur un CAPTCHA / auth perdue
et nécessiter une intervention humaine).

**Setup** : créer la routine via `/schedule` depuis une session Claude Code
**interactive** sur le Mac mini (jamais depuis MBP), avec l'`env_id` du bridge
actuel du Mac mini comme `environment_id`. ⚠️ Le `env_id` du bridge change à
chaque redémarrage de la session `--remote-control`, donc une routine cloud
peut s'auto-désactiver (`auto_disabled_env_not_found`) si la session bridge
casse. Moins robuste que launchd dans le temps.

`/schedule` ne marche **pas** via `claude -p` non-interactif — toujours
passer par une session interactive.

### Email reporting commun

Script générique `scripts/tech-watchdog/send-report.sh` envoie un email
via Resend API (clé `RESEND_API_KEY` dans `.env`) :
```bash
echo "body" | ./scripts/tech-watchdog/send-report.sh "Subject"
```
Recommandé dans tous les `run.sh` launchd, même en cas de succès (1 mail/jour
= signal de vie, l'absence de mail = alerte silencieuse à ne pas rater).
