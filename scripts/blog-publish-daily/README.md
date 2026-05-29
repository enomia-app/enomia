# blog-publish-daily — Publication progressive du blog (launchd Mac mini)

Cron Mac mini qui publie **1 article blog tous les 2 jours** (jours impairs, 08h17),
commit + push sur `main`, et envoie un **email récap via Resend** à marc@enomia.app.

## Pourquoi Mac mini (et pas GitHub Actions)

- Réutilise l'infra **Resend existante** (`RESEND_API_KEY` dans `.env` local + `send-report.sh`)
  comme tous les autres agents (tech-watchdog, conciergeries, gsc). Aucun nouveau secret.
- Opération **git + node pure**, **PAS de `claude -p`** → aucun coût API.

## Fichiers

| Fichier | Rôle |
|---|---|
| `run.sh` | Wrapper : check jour impair → git pull → `publish-next-blog-article.mjs` → commit/push → email Resend |
| `plist.template` | Template launchd (08h17 quotidien, run.sh filtre les jours impairs) |
| `install.sh` | Installe le launchd (à lancer sur Mac mini) |
| `uninstall.sh` | Décharge le launchd (pause) |
| `send-report.sh` | Envoi email via Resend (copie du pattern partagé) |
| `logs/` | Logs par date |

## Dépendances (dans le repo, versionnées)

- `scripts/publish-next-blog-article.mjs` — logique de publication (1er brouillon de la queue → en-ligne)
- `scripts/blog-publish-queue.json` — ordre de priorité (piliers + volume)

## Installation (sur Mac mini uniquement)

```bash
# Sur le Mac mini, après git pull :
cd ~/projects/eunomia
bash scripts/blog-publish-daily/install.sh
```

## Cadence

- Lancé tous les jours 08h17, mais ne publie que les **jours impairs** → ~1 article / 2 jours
- S'arrête tout seul quand la queue n'a plus de brouillon
- Email récap envoyé uniquement quand un article est effectivement publié

## Modifier la file de publication

Éditer `scripts/blog-publish-queue.json` (ordre des slugs). Un slug déjà en-ligne est sauté.

## Pause / reprise

```bash
bash scripts/blog-publish-daily/uninstall.sh   # pause
bash scripts/blog-publish-daily/install.sh     # reprise
```

## Garde-fous

- **Working tree clean obligatoire** : si le repo Mac mini est sale, le cron n'opère pas et envoie une alerte Resend (évite de pousser sur un repo désynchronisé).
- `git pull --ff-only` avant publication (sync GitHub = vérité).
