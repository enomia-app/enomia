# Ordre de publication du blog Enomia

> Dernière mise à jour : 2026-05-25 (post-audit statuts réels + scoring ROI)
> Principe : **publier les piliers avant les satellites** pour que le maillage interne fonctionne dès la première publication.
> Scoring : **ROI = volume / KD** — favorise les KW gros volume ET accessibles.

---

## Organisation actuelle

- **`src/content/blog/`** → articles visibles dans Keystatic + publiés si `status: en-ligne`
- **`src/content/blog-backlog/`** → brouillons sortis de Keystatic. À remettre dans `src/content/blog/` un par un au moment de la publication.

**Statut au 25/05/2026** :
- **13 articles en ligne** (`src/content/blog/*.mdoc` avec `status: en-ligne`)
- **30 articles dans `blog-backlog/`** en attente
- **2 KW retirés du backlog** car déjà couverts par pages outils (voir section dédiée plus bas)

---

## ✅ Articles déjà en ligne (au 25/05/2026)

Source de vérité : `grep "^status: en-ligne" src/content/blog/*.mdoc`.

**Piliers en ligne** :
- `louer-airbnb-rentable` — pilier RENTABILITÉ
- `taux-occupation-par-ville` — pilier RENTABILITÉ
- `pricing-airbnb-tarif-dynamique` — pilier OUTILS (croisé)
- `automatiser-airbnb` — pilier OUTILS
- `channel-manager-comparatif` — pilier OUTILS
- `lmnp-airbnb` — pilier FISCALITÉ
- `fiscalite-airbnb` — pilier FISCALITÉ

**Satellites en ligne** :
- `commissions-airbnb`
- `numero-enregistrement-airbnb`
- `loi-le-meur-airbnb`
- `taxe-habitation-airbnb`
- `difference-location-saisonniere-meuble-tourisme`
- `serrure-connectee-airbnb` ⚠️ doublon : version brouillon obsolète encore présente dans `blog-backlog/` → à supprimer

---

## 🚫 KW retirés du backlog (déjà couverts par pages outils)

Ne pas publier ces articles — le KW est déjà ciblé par une page outil dédiée, l'article ferait doublon.

| Article backlog | KW | Vol | Page Enomia qui couvre |
|---|---|---|---|
| `conciergerie-airbnb.mdoc` | conciergerie airbnb | 5 400 | Hub `/conciergerie-airbnb/` (programmatic 91 villes) |
| `taxe-sejour-airbnb.mdoc` | taxe de séjour airbnb | 590 | Outil `/calcul-taxe-de-sejour/` |

→ **À archiver** (déplacer hors de `blog-backlog/` ou supprimer).

---

## 🎯 Top 10 priorités de publication — scoring ROI (vol / KD)

Articles du backlog uniquement, hors KW couverts par pages outils, hors doublons.

| Rang | Article | Vol | KD | **ROI** | Cluster | Notes |
|---|---|---|---|---|---|---|
| 1 | `location-meublee-vs-location-courte-duree` | 8 100 | 35 | **231** | Fiscalité | Plus gros volume du backlog |
| 2 | `lmnp-2026` | 2 900 | 21 | **138** | Fiscalité | ⚠️ repositionner angle LCD |
| 3 | `channel-manager` | 2 500 | 20 | **125** | Outils | Pilier sous-cluster |
| 4 | `lmnp-amortissement` | 3 600 | 32 | **112** | Fiscalité | ⚠️ repositionner angle LCD |
| 5 | `channel-manager-gratuit` | 320 | 8 | **40** | Outils | KD très bas → quick win |
| 6 | `inventaire-location-meublee` | 390 | 10 | **39** | Conciergerie | KD bas |
| 7 | `petites-villes-rentabilite-airbnb` | 800 | 23 | **35** | Rentabilité | Vol combiné (fusion ancien `investissement-locatif-saisonnier`) |
| 8 | `amenitiz-avis` | 720 | 21 | **34** | Outils/avis | Dépend de `channel-manager` (#3) |
| 9 | `channel-manager-conciergerie` | 170 | 6 | **28** | Outils | KD très bas |
| 10 | `formation-conciergerie-airbnb` | 320 | 12 | **27** | Formations | |

**Volume cumulé top 10 : ~19 850/mois.**

---

## 🛰️ Reste du backlog (rangs 11+)

| Article | Vol | KD | ROI |
|---|---|---|---|
| `conciergerie-digitale-lcd` ⭐ | 260 | 11 | 24 |
| `superhote-avis` | 260 | 13 | 20 |
| `pms-location-saisonniere` | 170 | 9 | 19 |
| `loi-airbnb-2025` | 480 | 33 | 15 |
| `commission-booking-proprietaire` | 390 | 28 | 14 |
| `smoobu-avis` | 320 | 26 | 12 |
| `google-hotel-ads-channel-manager` | 110 | 9 | 12 |
| `superhost-airbnb` | 320 | 28 | 11 |
| `pricelabs-vs-wheelhouse` | 110 | 10 | 11 |
| `lodgify-avis` | 260 | 26 | 10 |
| `eviivo-avis` | 140 | 20 | 7 |
| `booking-vs-airbnb` | 140 | 20 | 7 |
| `simulateur-rentabilite-airbnb-guide` | 140 | 21 | 7 |
| `smoobu-vs-lodgify-amenitiz` | 110 | 18 | 6 |
| `site-reservation-location-saisonniere` | 70 | 17 | 4 |
| `formation-location-courte-duree` | 70 | 16 | 4 |
| `gestion-linge-airbnb` | 50 | 12 | 4 |

> ⭐ `conciergerie-digitale-lcd` : à repositionner **100% angle Enomia** (alternative à la conciergerie classique = automatiser sans prestataire).

---

## ⚠️ Articles à repositionner avant publication

- **`lmnp-amortissement`** (3 600 vol) et **`lmnp-2026`** (2 900 vol) : repositionner avec angle LCD dans le titre et le contenu (ex: "amortissement LMNP en Airbnb", "LMNP 2026 pour LCD"). Sans ça, ils visent du LMNP générique = hors intention Enomia.
- **`conciergerie-digitale-lcd`** : repositionner 100% angle Enomia (alternative à conciergerie classique).

---

## 🗑️ Articles supprimés (2026-04-21)

Hors intention LCD stricte ou doublons avec pages outils.

| Article | KW | Vol | Raison |
|---|---|---|---|
| `rentabilite-locative-calcul` | rentabilité locative calcul | 1 900 | Immobilier classique, pas LCD |
| `investissement-lmnp` | investissement lmnp | 1 900 | LMNP générique, pas LCD-spécifique |
| `dpe-obligatoire-location` | dpe obligatoire location | 2 400 | Toutes locations, pas LCD |
| `comptable-lmnp` | comptable lmnp | 1 600 | LMNP générique |
| `lmnp-cfe` | cfe lmnp | 1 300 | LMNP générique |
| `contrat-location-saisonniere` | contrat de location saisonnière | 1 300 | Déjà page outil `/contrat-location-saisonniere` |
| `facture-location-saisonniere-guide` | facture location saisonnière | 260 | Déjà page outil `/facture-location-saisonniere` |
| `facture-booking-proprietaire` | facture booking | 1 900 | Déjà page outil `/facture-booking` |
| `investissement-locatif-saisonnier` | investissement locatif saisonnier | 480 | Fusionné dans `petites-villes-rentabilite-airbnb` |

---

## 📋 Workflow de publication

1. **Déplacer** : `git mv src/content/blog-backlog/NOM.mdoc src/content/blog/NOM.mdoc`
2. **Éditer dans Keystatic** : passer `status` à `en-ligne`, ajuster chiffres Marc, ajouter CTA simulateur
3. **Commit + push** → article visible sur enomia.app

---

## 🎯 Checklist par article avant publication

- [ ] Tous les liens internes pointent vers des articles déjà en ligne (pas de 404)
- [ ] Chiffres cohérents avec la méthode 97% de Marc (Irigny, Montagny, Pierre-Bénite)
- [ ] Au moins 1 CTA vers `/simulateur-rentabilite-airbnb`
- [ ] Excerpt < 160 caractères
- [ ] metaTitle < 60 caractères
- [ ] metaDescription entre 140-160 caractères
- [ ] featuredImage renseignée
- [ ] `pillarKeyword` rempli (pas vide)

---

## Statistiques (au 25/05/2026)

- **Total articles** : 43 (13 en ligne + 30 dans backlog)
- **Top 10 backlog** (ROI) : ~19 850 vol/mois
- **Backlog complet** (28 articles publiables) : ~23 580 vol/mois
- **KW retirés vers pages outils** : 2 (conciergerie 5 400 + taxe séjour 590)
