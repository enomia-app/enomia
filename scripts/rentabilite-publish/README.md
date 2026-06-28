# rentabilite-publish — publication progressive des villes rentabilité

Agent launchd (Mac mini) qui publie **3 villes** du classement rentabilité Airbnb
**les mardi et samedi** (2 fois/semaine), commit + push sur `main` (→ rebuild Vercel),
et envoie un **email récap** via Resend à chaque publication.

## Pourquoi progressif

Publier 898 pages d'un coup = signal spam pour Google. On lâche 3 villes 2×/semaine,
**par région** (régions à fort volume d'abord, meilleur rendement en tête), pour une
montée en charge naturelle. Les villes non publiées s'affichent dans le classement
mais **sans lien** (zéro 404) — le lien apparaît quand la ville est publiée.

## Pièces

- `../publish-next-rentabilite-villes.mjs` — choisit + passe `published: true` les 3 prochaines villes, écrit le récap.
- `run.sh` — wrapper : filtre mardi/samedi, pull, publie, commit/push, email. Pas de `claude -p` (zéro coût API).
- `plist.template` / `install.sh` / `uninstall.sh` — agent launchd (lancé tous les jours 09h23, run.sh filtre les jours).
- `send-report.sh` — email Resend vers marc@enomia.app.

## Installer (sur le Mac mini)

```bash
cd ~/projects/eunomia && git pull
bash scripts/rentabilite-publish/install.sh
```

## Régler le rythme

- **Jours** : éditer `run.sh` (`DOW` = 2 mardi, 4 jeudi, 6 samedi). Ex. mar/jeu/sam = `"2" "4" "6"`.
- **Nombre de villes/run** : `N` dans `publish-next-rentabilite-villes.mjs`.
- Après modif : re-lancer `install.sh` sur le Mac mini.

## Vérifier / piloter

```bash
node scripts/publish-next-rentabilite-villes.mjs --dry-run   # voir les 3 prochaines sans rien changer
bash scripts/rentabilite-publish/run.sh                       # forcer (ne publie que mardi/samedi)
launchctl list | grep rentabilite-publish                     # statut
```
