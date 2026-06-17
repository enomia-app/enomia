# tech-watchdog

Agent autonome de surveillance technique d'Enomia. Tourne chaque matin 8h sur le Mac mini via `launchd`, scanne les alertes services entrantes (V1: GSC), diagnostique, fixe, push, valide la correction, et notifie.

## Architecture

| Fichier              | Rôle |
|----------------------|------|
| `watchdog-prompt.md` | Le prompt principal exécuté par Claude (logique métier) |
| `run.sh`             | Wrapper bash lancé par launchd → `claude -p` + tests hebdo le lundi |
| `run-weekly-tests.sh`| Tests du site (lundi) : smoke « toutes les pages » + `tools.spec.ts`, contre la prod |
| `plist.template`     | Template launchd (placeholders remplis par `install.sh`) |
| `install.sh`         | Installeur Mac mini (génère le plist, le charge) |
| `uninstall.sh`       | Désinstalleur (décharge + supprime le plist) |
| `logs/`              | Rapports quotidiens + logs run (gitignored) |

## Setup Mac mini (1 fois)

```bash
cd ~/Desktop/eunomia          # ou le path local du clone
git pull
bash scripts/tech-watchdog/install.sh
```

L'installeur :
1. Vérifie macOS + binaire `claude` disponible
2. Remplit le plist depuis le template (placeholders : run.sh path, logs dir, $HOME, repo path)
3. Place le plist dans `~/Library/LaunchAgents/app.enomia.tech-watchdog.plist`
4. `launchctl load`
5. Affiche les commandes de gestion

## Tester manuellement

Avant de laisser tourner en auto, lance une exécution une fois pour valider :

```bash
bash scripts/tech-watchdog/run.sh
```

Vérifie ensuite :
- `scripts/tech-watchdog/logs/run-YYYY-MM-DD.log` — trace d'exécution
- `scripts/tech-watchdog/logs/YYYY-MM-DD.md` — rapport généré par l'agent (si emails à traiter)
- Notification macOS reçue

## Périmètre V1

**Source** : Google Search Console uniquement
**Boîte** : `marc@enomia.app`
**Sender** : `sc-noreply@google.com`
**Fenêtre** : 48h glissantes

**Auto-fixable** : données structurées invalides, page non indexée (bugs), mobile usability, Core Web Vitals (basiques)
**Non auto** : manual action, security, tout fix éditorial (blog/villes/conciergerie)

## Garde-fous

- Push direct sur `main` autorisé pour le tech (permission Marc)
- 🛑 JAMAIS sur contenu éditorial (`src/content/blog/*.mdoc`, etc.) — preview link obligatoire
- 🛑 STOP si fix > 50 lignes ou touche auth/paiement/RLS → notif Marc
- Vérif Vercel build après push, revert si rouge

## Commandes utiles

```bash
# Forcer un run maintenant (sans attendre 8h)
launchctl start app.enomia.tech-watchdog

# Voir si chargé
launchctl list | grep tech-watchdog

# Logs launchd bruts
tail -f scripts/tech-watchdog/logs/launchd-stdout.log
tail -f scripts/tech-watchdog/logs/launchd-stderr.log

# Désinstaller
bash scripts/tech-watchdog/uninstall.sh
```

## Tests hebdo du site (lundi)

Le lundi, `run.sh` appelle `run-weekly-tests.sh` (gate `date +%u == 1`). Lance,
contre la prod (`https://www.enomia.app`) :

1. **Smoke « toutes les pages »** (`tests/e2e/smoke-all-pages.spec.ts`) — lit le
   sitemap (suit donc toutes les pages, même les futures). Échoue si statut ≥ 400,
   crash JS, ou asset same-origin 404. Lecture seule.
2. **Tests ciblés** (`tests/e2e/tools.spec.ts`) — simulateur/contrat/facture/
   isolation. Écrivent dans la base Supabase de prod puis nettoient (comptes e2e).
   Nécessitent `SUPABASE_SERVICE_ROLE_KEY` dans `.env` (sinon : smoke seul).

Email Resend **chaque lundi** (vert ✅ si tout OK, rouge 🔴 si échec) + notif
macOS. **Sort toujours en 0** → ne bloque jamais le watchdog quotidien. Modif de `run.sh` seul (pas du plist) → **live au prochain
`git pull` Mac mini, sans `launchctl reload`**.

```bash
# Navigateur Playwright : déjà présent sur le Mac mini (chromium-1217, vérifié
# 2026-06-17). Si un jour absent : npx playwright install chromium

# Lancer à la main (ex. avant un déploiement)
bash scripts/tech-watchdog/run-weekly-tests.sh
# Cibler le local au lieu de la prod
E2E_BASE_URL=http://localhost:4321 bash scripts/tech-watchdog/run-weekly-tests.sh
```

## Roadmap V2

- Sources additionnelles : Vercel (`notifications@vercel.com`), Supabase, GitHub
- Slack / Telegram en plus de la notif macOS
- ~~Rapport hebdo agrégé (envoyé par mail le lundi)~~ → tests hebdo faits (2026-06-17)
- Métriques : MTTR, fix success rate

## Dépendances

- macOS (launchd)
- Claude Code CLI (`claude` binary)
- MCPs configurés sur Mac mini : Gmail, GitHub, Claude-in-Chrome, Vercel
- Repo Enomia cloné et à jour sur Mac mini
