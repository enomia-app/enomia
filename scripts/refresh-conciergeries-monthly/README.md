# refresh-conciergeries-monthly

Agent launchd (Mac mini) qui **rafraîchit les notes Google des conciergeries**
et la **date « MAJ »** des pages `/conciergerie-airbnb/...`, **le 3 de chaque mois à 06:13**.

## Ce que fait le run (`run.sh`)

1. Vérifie qu'on est sur `main` et que le working tree est clean, puis `git pull --ff-only`.
2. `refresh-conciergeries-google.mjs --json` → snapshot Places API (`scripts/places-audit-output.json`).
3. `apply-places-corrections.mjs` → applique rating/reviews réels avec **garde-fous 4 couches**
   (counts villes/conciergeries, taille, rating∈[0,5], backup `.bak`). Dégrade en `n.c.` si < 5 avis.
4. `bump-updated-dates.mjs` → passe **tous** les `updatedAt` de `cities.ts` à la date du jour
   + met à jour le badge codé en dur de `index.astro` (« Mis à jour {mois} {année} »).
5. `validate-cities.mjs` (garde-fou édition) + `npm run audit:blog-links`.
6. Si changement : `commit` + `push origin main` (Vercel redéploie).
7. Email récap via Resend (`build-recap.mjs`).

Toute erreur → rollback du working tree (`git checkout -- .`) + email d'alerte + exit.

> **100 % déterministe : aucun `claude -p`.** Zéro coût API LLM (cf. incident spike mai 2026).
> Seul coût = Google Places API (~$10/run, couvert par le crédit gratuit $200/mois Maps Platform).

> Minute 06h**13** (pas 06h00) par hygiène anti-collision, même si ce job n'appelle
> pas l'API Anthropic (donc pas de risque de 529).

## Installation (⚠️ sur le Mac mini, une seule fois)

Prérequis sur le Mac mini :
- Repo sur `main` à jour (l'agent doit avoir été mergé dans `main`).
- `node`, `npm`, `git` dans le PATH.
- **Clé Google Places API** accessible : variable d'env `GOOGLE_PLACES_API_KEY`,
  ou ligne `GOOGLE_PLACES_API_KEY=...` dans `~/projects/Neocamino/.env`,
  `/Users/marc/Desktop/Neocamino/.env` ou `<repo>/.env`.
- `RESEND_API_KEY=...` dans `<repo>/.env` (pour l'email récap).

```bash
bash scripts/refresh-conciergeries-monthly/install.sh
```

## Commandes

```bash
# Test manuel (⚠️ vrai run : commit/push réels si changement) :
bash scripts/refresh-conciergeries-monthly/run.sh
# Dry-run du bump de dates seul :
node scripts/refresh-conciergeries-monthly/bump-updated-dates.mjs --dry-run
# Statut / logs / désinstall :
launchctl list | grep conciergerie-refresh
ls -la scripts/refresh-conciergeries-monthly/logs/
bash scripts/refresh-conciergeries-monthly/uninstall.sh
```

## Convention

Suit le pattern des agents launchd Enomia (`scripts/tech-watchdog/`) : `run.sh` +
`plist.template` + `install.sh`/`uninstall.sh`, créé sur le MBP & commité, installé sur le Mac mini.
