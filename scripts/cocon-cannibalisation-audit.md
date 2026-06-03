# Audit cannibalisation cocon blog — Arbitrage des 18 articles "à rédiger"

> Produit le **2026-06-03** (batch nuit). Objectif : avant d'écrire les 18 articles "à rédiger" du tracking, vérifier qu'aucun ne cannibalise un article existant (pilier/satellite en-ligne ou brouillon), avec **volumes SEMrush rafraîchis juin 2026** + reco keep/merge/skip pour que Marc tranche.
>
> Source : `scripts/blog-tracking.md` (vérité éditoriale) + recall SEMrush `phrase_these` (database fr, 2026-06-03) sur 16 KW contestés.

## TL;DR — Décision sur les 18

**13 à écrire** (intention propre, cannibalisation nulle ou résolue par séparation d'angle).
**5 à fusionner / refondre / re-KW** (vol trop bas ou doublon d'intention) — **à trancher par Marc**.

| # | Slug | KW exact | Vol juin 26 | KD | Verdict | Raison 1 ligne |
|---|---|---|---|---|---|---|
| 11 | caution-airbnb | airbnb caution | **720** | 22 | ✅ ÉCRIRE | Top ROI cocon, intention propre |
| 6 | frais-menage-airbnb | frais de ménage airbnb | **590** | 27 | ✅ ÉCRIRE | Absorbe `gestion-linge-airbnb` en H2 |
| 1 | tarif-gestion-locative-airbnb | tarif gestion locative | **480** | 26 | ✅ ÉCRIRE | Récupère aussi "tarif conciergerie airbnb" (cf. mismatch pilier ci-dessous) |
| 14 | devenir-concierge-airbnb | devenir concierge airbnb | **480** | 16 | ✅ ÉCRIRE | Angle "se lancer" ≠ formation-conciergerie |
| 12 | boite-a-cles-airbnb | boite à clé connecté | **390** | 13 | ✅ ÉCRIRE | Boîte à clés ≠ serrure connectée (angle distinct) |
| 7 | livret-accueil-airbnb | livret d'accueil airbnb | **390** | 16 | ✅ ÉCRIRE | Intention propre |
| 9 | assurance-airbnb-proprietaire | airbnb assurance / assurance airbnb | **390 / 720** | 32 | ✅ ÉCRIRE | Intention propre |
| 8 | declarer-revenus-airbnb-case-impot | déclaration airbnb impot | **210 / ~1100 cumulé** | 29 | ✅ ÉCRIRE | Consolide cluster déclaration + allège section pilier |
| 10 | airbnb-copropriete | airbnb copropriété | **210** | 17 | ✅ ÉCRIRE | Intention propre (juridique) |
| 13 | photos-airbnb | photographe pour airbnb | **140** | 12 | ✅ ÉCRIRE | Intention propre (marketing annonce) |
| 2 | reservation-directe-airbnb | comment passer en direct sur airbnb | **110** | 12 | ✅ ÉCRIRE | Intention propre (direct booking) |
| 17 | synchroniser-airbnb-booking | synchroniser calendrier airbnb et booking | **110** | 21 | ✅ ÉCRIRE | How-to sync ≠ automatiser-airbnb |
| 16 | remonter-annonce-airbnb-algorithme | comment faire remonter mon annonce sur airbnb | **90** | 10 | ✅ ÉCRIRE | KD très bas, intention propre |
| 15 | combien-prend-airbnb-proprietaire | combien prend airbnb au propriétaire | **260** | 24 | ⚠️ FUSIONNER | Reformulation de `commissions-airbnb` (pilier 880) — voir Cluster A |
| 18 | formation-location-courte-duree | formation location courte durée | **70** | 15 | ⚠️ FONDRE | Chevauche devenir-concierge (480) + formation-conciergerie (320) |
| 5 | gestion-linge-airbnb | gestion linge airbnb | **50** | 0 | ⚠️ FONDRE | Sous-ensemble de frais-menage-airbnb (H2) |
| 4 | booking-vs-airbnb | booking vs airbnb | **40** | 0 | ⚠️ FONDRE | "X vs Y" sans volume FR (cf. audit 25/05) |
| 3 | investissement-locatif-saisonnier | investissement location saisonnière | **30 (exact!)** | 0 | 🔴 RE-KW | Le "800" du tracking était un cluster agrégé, le KW exact est mort |

**Net cocon** : 13 nouveaux articles au lieu de 18. Cocon vivant ≈ **55-57** articles maintenu (les 5 retirés sont absorbés en sections/H2 d'articles existants, donc le volume sémantique reste capté sans page mince).

---

## Clusters de cannibalisation détaillés

### Cluster A — Commissions plateformes (ce que la plateforme prélève)

| Article | KW | Vol | KD | Statut |
|---|---|---|---|---|
| `commissions-airbnb` (PILIER) | airbnb commission | 880 | 22 | en-ligne |
| `commission-booking-proprietaire` | commission booking | 390 | 22 | brouillon backlog |
| `combien-prend-airbnb-proprietaire` | combien prend airbnb au propriétaire | 260 | 24 | à rédiger |

**Problème** : "combien prend airbnb au propriétaire" est une **reformulation longue-traîne** de l'intention du pilier `commissions-airbnb` (= combien Airbnb prélève). Page séparée = doublon d'intention.

**Reco** : **FUSIONNER** dans `commissions-airbnb` — ajouter un H2 + une entrée FAQ ciblant exactement "Combien prend Airbnb au propriétaire ?" (snippet bait), plutôt qu'une page mince concurrente.

**Alternative si Marc veut capter les 260 vol en page dédiée** : spoke ultra-court (réponse directe à LA question, format snippet) qui pointe vers le pilier (hub→spoke). Acceptable SEO si l'angle reste serré, mais touche le territoire du pilier → **ton arbitrage**. `commission-booking-proprietaire` (plateforme Booking, distincte) reste un satellite légitime, aucun conflit.

### Cluster B — Frais de gestion / conciergerie (ce qu'un PRESTATAIRE prélève)

| Article | KW (tracking) | Vol | KD | Statut |
|---|---|---|---|---|
| `pricing-airbnb-tarif-dynamique` (PILIER) | tarif conciergerie airbnb | 480 | 23 | en-ligne |
| `tarif-gestion-locative-airbnb` | tarif gestion locative | 480 | 26 | à rédiger |

**⚠️ Mismatch détecté** : le pilier `pricing-airbnb-tarif-dynamique` traite de **tarification dynamique** (PriceLabs, ajustement des prix nuitée) mais son `pillarKeyword` au tracking est "tarif conciergerie airbnb" (= ce qu'une conciergerie facture, 20-25%). Ce sont deux intentions différentes. Si `tarif-gestion-locative-airbnb` cible aussi "tarif conciergerie airbnb", les deux se marchent dessus.

**Reco** :
1. **ÉCRIRE** `tarif-gestion-locative-airbnb` et lui faire **porter** "tarif gestion locative" (480) **+ "tarif conciergerie airbnb"** (480) — c'est sa vraie maison sémantique (frais de gestion/forfait conciergerie).
2. **Re-pointer** le `pillarKeyword` du pilier pricing vers un KW de tarification dynamique réel ("tarif dynamique airbnb", "prix nuitée airbnb"…) pour lever le mismatch. → **à valider Marc** (modif d'un pilier en-ligne, je ne le touche pas sans ton feu vert).

### Cluster C — Fiscalité / déclaration

| Article | KW | Vol | KD | Statut |
|---|---|---|---|---|
| `fiscalite-airbnb` (PILIER) | fiscalité airbnb | 720 | 34 | en-ligne (a une section "Déclaration pas à pas") |
| `declarer-revenus-airbnb-case-impot` | déclaration airbnb impot | 210 / ~1100 cumulé | 29 | à rédiger |
| *(futur outil)* `/calcul-impot-airbnb` | calcul impôt airbnb | 390 | 26 | réservé Q1 2027 (intention calcul/simulateur) |

**Reco** (déjà semi-actée 02/06) : **ÉCRIRE** `declarer-revenus-airbnb-case-impot` comme satellite how-to profond (cases 2042-C-PRO, micro-BIC vs réel, dates, abattements), **alléger** la section "Déclaration pas à pas" du pilier en résumé + lien (hub→détail). **Ne PAS** cibler "calcul impôt airbnb" (390) dans l'article : réservé au futur outil. **1 seule page** déclaration (pas 2) pour ne pas auto-cannibaliser "déclaration revenus" vs "déclaration impôt".

### Cluster D — Équipement accès

| Article | KW | Vol | KD | Statut |
|---|---|---|---|---|
| `serrure-connectee-airbnb` | serrure connectée | 12 100 | 24 | en-ligne |
| `boite-a-cles-airbnb` | boite à clé connecté | 390 | 13 | à rédiger |

**Reco** : **ÉCRIRE** — angle distinct net. Serrure connectée = serrure motorisée (ouverture à distance / code). Boîte à clés = boîtier à code qui contient la clé physique (alternative budget, sans électronique sur la porte). Produits et intentions différents. `boite-a-cles-airbnb` pointe vers `serrure-connectee-airbnb` comme montée en gamme. Clean.

### Cluster E — Conciergerie / formation / se lancer

| Article | KW | Vol | KD | Statut |
|---|---|---|---|---|
| `devenir-concierge-airbnb` | devenir concierge airbnb | 480 | 16 | à rédiger |
| `formation-conciergerie-airbnb` | formation conciergerie airbnb | 320 | 14 | brouillon backlog |
| `conciergerie-digitale-lcd` | conciergerie digitale | 260 | — | brouillon backlog |
| `formation-location-courte-duree` | formation location courte durée | 70 | 15 | à rédiger |

**Reco** :
- **ÉCRIRE** `devenir-concierge-airbnb` (480) — angle "créer son activité de conciergerie" (statut, business model, premiers clients). ≠ `formation-conciergerie-airbnb` qui est l'angle "quelle formation / se former". Séparation d'angle serrée → OK.
- **FONDRE** `formation-location-courte-duree` (70, KD15) : chevauche trop devenir-concierge + formation-conciergerie. Le transformer en H2 "Faut-il une formation pour se lancer ?" dans `devenir-concierge-airbnb`. **Skip** en standalone (70 vol ne justifie pas une page + risque doublon).

### Cluster F — Sync calendriers / comparaison plateformes

| Article | KW | Vol | KD | Statut |
|---|---|---|---|---|
| `automatiser-airbnb` (PILIER) | automatiser airbnb | 40 | 0 | en-ligne |
| `synchroniser-airbnb-booking` | synchroniser calendrier airbnb et booking | 110 | 21 | à rédiger |
| `booking-vs-airbnb` | booking vs airbnb | 40 | 0 | à rédiger |

**Reco** :
- **ÉCRIRE** `synchroniser-airbnb-booking` (110) — how-to sync iCal / channel manager, intention propre (≠ automatiser, qui est messages/check-in).
- **FONDRE** `booking-vs-airbnb` (40, KD0) : l'audit du 25/05 a déjà acté que les "X vs Y" ne génèrent pas de volume FR. Le traiter en H2 "Airbnb ou Booking : lequel choisir ?" dans `commissions-airbnb` ou `synchroniser-airbnb-booking`. **Skip** standalone.

### Cluster G — Ménage / linge

| Article | KW | Vol | KD | Statut |
|---|---|---|---|---|
| `frais-menage-airbnb` | frais de ménage airbnb | 590 | 27 | à rédiger |
| `gestion-linge-airbnb` | gestion linge airbnb | 50 | 0 | à rédiger |

**Reco** : **ÉCRIRE** `frais-menage-airbnb` (590) et y inclure un H2 "Gestion du linge et blanchisserie" qui absorbe `gestion-linge-airbnb` (50, KD0). Le linge fait partie du turnover ménage → pas de page séparée. **Skip** `gestion-linge-airbnb` standalone.

### Cluster H — Rentabilité / investissement

| Article | KW | Vol | KD | Statut |
|---|---|---|---|---|
| `louer-airbnb-rentable` (PILIER) | louer en airbnb est-ce rentable | 390 | 22 | en-ligne |
| `investissement-locatif-saisonnier` | investissement location saisonnière | **30 (exact)** | 0 | à rédiger |

**🔴 Finding majeur** : le tracking annonçait "800 vol (cluster)" pour `investissement-locatif-saisonnier`. Le recall juin 2026 sur le **KW exact** "investissement location saisonnière" = **30 vol seulement, KD0**. Le 800 était un agrégat de cluster, pas le KW tête. À 30 vol, une page standalone ne se justifie pas.

**Reco** : **RE-KW ou FONDRE**. Deux options pour Marc :
- (a) **Re-KW** : trouver une vraie tête de cluster dans l'angle investissement LCD (ex tester "investir dans la location saisonnière", "rentabilité investissement locatif courte durée"…) avant d'écrire.
- (b) **Fondre** dans `louer-airbnb-rentable` (pilier) comme section "Investir en location saisonnière : par où commencer".
- Je **n'écris pas** cet article cette nuit (30 vol = pas d'intérêt sans re-scoping). À trancher.

---

## Décisions déjà arbitrées (rappel, pour vue d'ensemble)

Ces cannibalisations ont déjà été tranchées dans le tracking — listées ici pour que la carte soit complète :

| Slug | Décision actée | Raison |
|---|---|---|
| `estimation-airbnb` (article blog) | ❌ ne pas créer | Déjà couvert par la **page outil** `/estimation-airbnb` |
| `taxe-sejour-airbnb` | ❌ archivé | Déjà couvert par l'outil `/calcul-taxe-de-sejour` |
| `simulateur-rentabilite-airbnb` | ❌ archivé | Doublon page outil `/estimation-airbnb` |
| `loi-airbnb-2025` | ❌ archivé | Intégré au refresh `/loi-le-meur-airbnb` |
| `pms-location-saisonniere`, `site-reservation-location-saisonniere` | ❌ archivés | 0 vol SEMrush |
| `calcul impôt airbnb` (390) | 🔒 réservé | Futur outil `/calcul-impot-airbnb` (Q1 2027), pas un article |

---

## Plan d'exécution batch nuit (2026-06-03)

1. **ÉCRIRE les 13 "keep"** en `status: brouillon` (méthode `rediger-article-seo`), par ROI décroissant :
   caution-airbnb → devenir-concierge-airbnb → boite-a-cles-airbnb → frais-menage-airbnb (+ H2 linge) → livret-accueil-airbnb → tarif-gestion-locative-airbnb (+ tarif conciergerie) → assurance-airbnb-proprietaire → declarer-revenus-airbnb-case-impot → airbnb-copropriete → photos-airbnb → reservation-directe-airbnb → synchroniser-airbnb-booking → remonter-annonce-airbnb-algorithme.
2. **NE PAS écrire** les 5 fusion/fold/re-KW → laissés à l'arbitrage Marc (3 d'entre eux touchent des piliers en-ligne : commissions, pricing, louer-rentable → je ne modifie pas un pilier public sans ton feu vert).
3. **Mettre à jour** `scripts/blog-tracking.md` (statut des 13 → brouillon, des 5 → décision en attente).

**À trancher par Marc au réveil** :
- [ ] Cluster A : `combien-prend-airbnb-proprietaire` → fusion dans pilier commissions, ou spoke court dédié (260 vol) ?
- [ ] Cluster B : re-pointer le `pillarKeyword` du pilier pricing (mismatch "tarif conciergerie airbnb") ?
- [ ] Cluster H : `investissement-locatif-saisonnier` → re-KW (lequel ?) ou fondre dans louer-rentable ?
- [ ] Confirmer skip standalone de `gestion-linge-airbnb` (50), `booking-vs-airbnb` (40), `formation-location-courte-duree` (70) — absorbés en H2.
