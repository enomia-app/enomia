# Email base builder

Construit une base prospects (nom, site, email, prénom, **téléphone**, statut)
pour les campagnes backlinks, en réutilisant les garde-fous de la machine
backlinks (`../backlinks-source-monthly/filters.mjs` : `extractContact`,
`isPitchableEmail`, `hasValidMX`, `verifyMailbox` SMTP RCPT).

## Segments

| Campagne | Segment | Source | Email |
|---|---|---|---|
| 1 | `blog_lcd` | pool live Mac mini (`_src/backlinks-2026-*.json`) | déjà extrait → revalidé |
| 2 | `blog_simulateur` | idem, filtre `outils_presents ⊇ simulateur` | déjà extrait → revalidé |
| 3 | `conciergeries` | Places, **toutes villes** (`_discovered/conciergerie.json`) + tag `page_en_ligne` (sitemap live) | scrapé |
| 4 | `loveroom` | Places (`_discovered/loveroom.json`) | scrapé |
| 5 | `cabane` | Places (`_discovered/cabane.json`) | scrapé |

`page_en_ligne` (3 niches) = la page de destination existe dans le sitemap live
(`/conciergerie-airbnb/[region]/[ville]`, `/love-room/[region]/[ville]`,
`/cabane/[zone]`). `discover-niche` tague `page_en_ligne` + remplit `page_url`
(+ `rating`/`reviews` Google). Le sender badge n'envoie QUE si `page_en_ligne = oui`.

## Statuts

- `verifie` — email + RCPT SMTP accepté (envoyable confirmé)
- `a_tester` — email OK mais RCPT timeout/greylist/anti-harvesting (envoyable, non confirmé → confirmé au 1er send)
- `faux_email` — RCPT rejeté (ne pas envoyer)
- `formulaire` — pas d'email mais formulaire de contact
- `ecarte` — aucun contact (pour conciergeries/niches : voir colonne `phone`)

## Re-run complet

```bash
# 0. (blogs) rapatrier le pool live du Mac mini si besoin
scp marc@100.81.185.92:'~/projects/eunomia/data/backlinks-2026-*.json' data/email-base/_src/

# 1. découverte Places (loveroom + cabane + conciergerie toutes villes) — gratuit sous quota
node scripts/email-base-builder/discover-niche.mjs all

# 2. extraction email par segment (conciergerie sans probe SMTP : MV vérifiera)
node scripts/email-base-builder/build-base.mjs --segment=blog_lcd --concurrency=8
node scripts/email-base-builder/build-base.mjs --segment=blog_simulateur --concurrency=8
node scripts/email-base-builder/build-base.mjs --segment=conciergeries --concurrency=10 --no-rcpt
node scripts/email-base-builder/build-base.mjs --segment=loveroom --concurrency=8
node scripts/email-base-builder/build-base.mjs --segment=cabane --concurrency=8

# 3. fusion → base_complete.csv/.json/.xlsx
node scripts/email-base-builder/merge-base.mjs

# 4. vérification finale (MillionVerifier, clé MILLIONVERIFIER_API_KEY dans .env)
#    --priority = blogs + conciergeries page en ligne (pour un budget crédits limité)
node scripts/email-base-builder/verify-millionverifier.mjs [--priority]

# 5. (optionnel) enrichir prénom / nom du gérant depuis les mentions-légales
#    (Haiku/Claude Max) → accroche "Bonjour Prénom," / "Bonjour M. Nom," des emails badge
node scripts/email-base-builder/enrich-names.mjs [--segment=conciergerie] [--limit=N]
```

Après MV : statut `verifie` = `ok` MillionVerifier = **envoyable sans bounce**. `catch_all`/`incertain`/`faux_email` = on n'envoie pas.

## Sortie

`data/email-base/base_complete.{csv,json,xlsx}` (gitignored — données prospects).
Le `.xlsx` est filtrable (header figé, autofilter, couleur par statut).

## Notes

- `extractContact` ne scanne pas que la home : le pipe tente aussi
  `/mentions-legales`, `/contact`, `/a-propos` (recall email FR).
- Le probe SMTP peut être throttlé depuis une IP résidentielle (beaucoup de
  `a_tester`) → c'est attendu, le 1er envoi tranche.
- Niches/conciergeries : le **téléphone** (data Places) est souvent le meilleur
  canal quand pas d'email (form JS, contact via Google Business).
