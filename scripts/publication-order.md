# Ordre de publication du blog Enomia

> Dernière mise à jour : 2026-04-21
> Principe : **publier les piliers avant les satellites** pour que le maillage interne fonctionne dès la première publication (évite d'avoir à repasser dessus).

---

## Organisation actuelle

- **`src/content/blog/`** → articles visibles dans Keystatic + publiés si `status: en-ligne`
- **`src/content/blog-backlog/`** → brouillons sortis de Keystatic. À remettre dans `src/content/blog/` un par un au moment de la publication.

**Statut au 21/04/2026** :
- **4 articles en ligne** (piliers de base + pilier rentabilité)
- **43 articles dans blog-backlog/** en attente de publication

---

## ✅ Piliers déjà en ligne (fondations du maillage)

Ces 4 articles sont déjà publiés. Ils servent de cibles de liens internes pour tous les satellites.

| # | Article | Rôle |
|---|---|---|
| — | `channel-manager-comparatif` | Pilier OUTILS |
| — | `lmnp-airbnb` | Pilier FISCALITÉ |
| — | `fiscalite-airbnb` | Pilier FISCALITÉ (complément) |
| — | `louer-airbnb-rentable` | ⭐ Pilier RENTABILITÉ (publié 21/04/2026 avec chiffres Marc) |

---

## 🏛️ Phase 1 — Publier les 7 piliers stratégiques (ordre strict)

Ces 7 articles doivent être publiés **dans cet ordre précis**, car chaque pilier sert de cible de liens pour les suivants. Publier un satellite avant son pilier = lien cassé ou à repasser plus tard.

| # | Pilier | Cluster | Justification |
|---|---|---|---|
| 1 | **`commissions-airbnb`** | Rentabilité | Référencé par 15+ articles. Pilier "charges". |
| 2 | **`taux-occupation-airbnb-methode`** | Rentabilité | Pilier méthode 97%. Base pour tous les articles pricing/automatisation. |
| 3 | **`pricing-airbnb-tarif-dynamique`** | Outils | Pilier pricing. Référencé par 20+ satellites. |
| 4 | **`automatiser-location-saisonniere`** | Outils | Pilier process/automatisation. Pivot pour tous les outils. |
| 5 | **`contrat-location-saisonniere`** | Juridique | Pilier juridique. Base pour factures, DPE, inventaire. |
| 6 | **`conciergerie-airbnb`** | Conciergerie | Pilier conciergerie. Nécessaire avant formation/gestion linge/channel-manager-conciergerie. |
| 7 | **`investissement-lmnp`** | Fiscalité | Pilier fiscal. Base pour tous les articles LMNP avancés. |

**Après la Phase 1, le maillage fondamental est en place.** Les 35 satellites restants peuvent alors être publiés sans risque de lien cassé.

---

## 🛰️ Phase 2 — Satellites par cluster (ordre libre à l'intérieur de chaque cluster)

### Cluster RENTABILITÉ / CHIFFRES (6 satellites)

| # | Article | Dépend de |
|---|---|---|
| 9 | `rentabilite-locative-calcul` | louer-airbnb-rentable, commissions-airbnb, taux-occupation-airbnb-methode |
| 10 | `simulateur-rentabilite-airbnb-guide` | louer-airbnb-rentable, commissions-airbnb, taux-occupation-airbnb-methode |
| 11 | `investissement-locatif-saisonnier` | louer-airbnb-rentable, pricing-airbnb-tarif-dynamique |
| 12 | `petites-villes-rentabilite-airbnb` | louer-airbnb-rentable, taux-occupation-airbnb-methode |
| 13 | `superhost-airbnb` | louer-airbnb-rentable, pricing-airbnb-tarif-dynamique, taux-occupation-airbnb-methode |
| 14 | `booking-vs-airbnb` | commissions-airbnb, pricing-airbnb-tarif-dynamique, taux-occupation-airbnb-methode |
| 15 | `commission-booking-proprietaire` | commissions-airbnb, pricing-airbnb-tarif-dynamique |

### Cluster FISCALITÉ / LMNP (8 satellites)

| # | Article | Dépend de |
|---|---|---|
| 16 | `lmnp-amortissement` | investissement-lmnp, lmnp-airbnb, rentabilite-locative-calcul |
| 17 | `lmnp-2026` | investissement-lmnp, lmnp-amortissement |
| 18 | `lmnp-cfe` | investissement-lmnp, lmnp-2026, lmnp-amortissement |
| 19 | `comptable-lmnp` | investissement-lmnp, lmnp-amortissement |
| 20 | `location-meublee-vs-location-courte-duree` | contrat-location-saisonniere, investissement-lmnp, loi-airbnb-2025 |
| 21 | `loi-airbnb-2025` | dpe-obligatoire-location, lmnp-2026, lmnp-amortissement |
| 22 | `taxe-sejour-airbnb` | commissions-airbnb, contrat-location-saisonniere, facture-booking-proprietaire |
| 23 | `dpe-obligatoire-location` | contrat-location-saisonniere, investissement-locatif-saisonnier |

> ⚠️ **Lien cassé à corriger** : 8 articles référencent `/fiscalite-airbnb-2025` (inexistant) au lieu de `/fiscalite-airbnb`. À fixer avant publication.

### Cluster OUTILS / LOGICIELS (13 satellites)

**Sous-cluster : Channel managers**
| # | Article | Dépend de |
|---|---|---|
| 24 | `channel-manager` | channel-manager-comparatif |
| 25 | `channel-manager-gratuit` | channel-manager-comparatif, automatiser-location-saisonniere |
| 26 | `channel-manager-conciergerie` | channel-manager-comparatif, conciergerie-airbnb |
| 27 | `pms-location-saisonniere` | channel-manager-comparatif, automatiser-location-saisonniere |
| 28 | `google-hotel-ads-channel-manager` | channel-manager-comparatif, commissions-airbnb |

**Sous-cluster : Avis outils**
| # | Article | Dépend de |
|---|---|---|
| 29 | `smoobu-vs-lodgify-amenitiz` | channel-manager-comparatif, pms-location-saisonniere |
| 30 | `amenitiz-avis` | channel-manager-comparatif, pms-location-saisonniere, smoobu-vs-lodgify-amenitiz |
| 31 | `smoobu-avis` | channel-manager-comparatif, pms-location-saisonniere, smoobu-vs-lodgify-amenitiz |
| 32 | `lodgify-avis` | channel-manager-comparatif, pms-location-saisonniere, smoobu-vs-lodgify-amenitiz |
| 33 | `eviivo-avis` | channel-manager-comparatif, pms-location-saisonniere, smoobu-vs-lodgify-amenitiz |
| 34 | `superhote-avis` | channel-manager-comparatif, smoobu-vs-lodgify-amenitiz |
| 35 | `pricelabs-vs-wheelhouse` | channel-manager-comparatif, pricing-airbnb-tarif-dynamique, taux-occupation-airbnb-methode |
| 36 | `site-reservation-location-saisonniere` | channel-manager-comparatif, contrat-location-saisonniere |

### Cluster GESTION / CONCIERGERIE (4 satellites)

| # | Article | Dépend de |
|---|---|---|
| 37 | `conciergerie-digitale-lcd` | conciergerie-airbnb, automatiser-location-saisonniere |
| 38 | `gestion-linge-airbnb` | conciergerie-airbnb, automatiser-location-saisonniere |
| 39 | `serrure-connectee-airbnb` | conciergerie-airbnb, automatiser-location-saisonniere |
| 40 | `inventaire-location-meublee` | contrat-location-saisonniere, automatiser-location-saisonniere |

### Cluster FACTURES (2 satellites)

| # | Article | Dépend de |
|---|---|---|
| 41 | `facture-booking-proprietaire` | commissions-airbnb, contrat-location-saisonniere |
| 42 | `facture-location-saisonniere-guide` | commissions-airbnb, contrat-location-saisonniere |

### Cluster FORMATIONS (2 satellites)

| # | Article | Dépend de |
|---|---|---|
| 43 | `formation-conciergerie-airbnb` | conciergerie-airbnb, automatiser-location-saisonniere |
| 44 | `formation-location-courte-duree` | conciergerie-airbnb, formation-conciergerie-airbnb, louer-airbnb-rentable |

---

## 📋 Workflow de publication

Pour chaque article à publier :

1. **Déplacer** le fichier de `src/content/blog-backlog/` vers `src/content/blog/`
   ```bash
   git mv src/content/blog-backlog/NOM.mdoc src/content/blog/NOM.mdoc
   ```
2. **Relire et ajuster** le contenu (injecter chiffres Marc, ton Enomia, CTA simulateur)
3. **Passer le statut** à `en-ligne` dans le frontmatter
4. **Commit + push** → article visible sur enomia.app

---

## 🎯 Checklist avant chaque publication

- [ ] Tous les liens internes pointent vers des articles déjà en ligne (pas de 404)
- [ ] Chiffres cohérents avec la méthode 97% de Marc
- [ ] Au moins 1 CTA vers `/simulateur-rentabilite-airbnb`
- [ ] Excerpt < 160 caractères
- [ ] metaTitle < 60 caractères
- [ ] metaDescription entre 140-160 caractères
- [ ] featuredImage renseignée
- [ ] Pas de "pillarKeyword" vide

---

## Statistiques

- **Total articles** : 46 (3 en ligne + 43 dans backlog)
- **Piliers identifiés** : 11 (3 en ligne + 8 à publier en priorité)
- **Satellites** : 35 (répartis en 6 clusters)
- **Lien cassé à corriger** : `/fiscalite-airbnb-2025` → `/fiscalite-airbnb` (dans 8 articles)
