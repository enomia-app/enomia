# tech-watchdog

Agent autonome de surveillance technique d'Enomia. Tourne chaque matin 8h sur le Mac mini via `launchd`, scanne les alertes services entrantes (V1: GSC), diagnostique, fixe, push, valide la correction, et notifie.

## Architecture

| Fichier              | Rôle |
|----------------------|------|
| `watchdog-prompt.md` | Le prompt principal exécuté par Claude (logique métier) |
| `run.sh`             | Wrapper bash lancé par launchd → invoque `claude -p` avec le prompt |
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

## Roadmap V2

- Sources additionnelles : Vercel (`notifications@vercel.com`), Supabase, GitHub
- Slack / Telegram en plus de la notif macOS
- Rapport hebdo agrégé (envoyé par mail le lundi)
- Métriques : MTTR, fix success rate

## Dépendances

- macOS (launchd)
- Claude Code CLI (`claude` binary)
- MCPs configurés sur Mac mini : Gmail, GitHub, Claude-in-Chrome, Vercel
- Repo Enomia cloné et à jour sur Mac mini
