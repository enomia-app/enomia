# Ordre de publication du blog Enomia

> Dernière mise à jour : 2026-04-21 (post-audit keywords)
> Principe : **publier les piliers avant les satellites** pour que le maillage interne fonctionne dès la première publication (évite d'avoir à repasser dessus).

---

## Organisation actuelle

- **`src/content/blog/`** → articles visibles dans Keystatic + publiés si `status: en-ligne`
- **`src/content/blog-backlog/`** → brouillons sortis de Keystatic. À remettre dans `src/content/blog/` un par un au moment de la publication.

**Statut au 21/04/2026 (post-clean keywords)** :
- **4 articles en ligne** (piliers de base + pilier rentabilité)
- **34 articles dans blog-backlog/** en attente (9 supprimés car hors intention LCD + 1 fusionné)

---

## ✅ Piliers déjà en ligne (fondations du maillage)

| # | Article | Rôle |
|---|---|---|
| — | `channel-manager-comparatif` | Pilier OUTILS |
| — | `lmnp-airbnb` | Pilier FISCALITÉ |
| — | `fiscalite-airbnb` | Pilier FISCALITÉ (complément) |
| — | `louer-airbnb-rentable` | ⭐ Pilier RENTABILITÉ (publié 21/04/2026 avec chiffres Marc) |

---

## 🏛️ Phase 1 — Publier les 7 piliers stratégiques (ordre strict)

| # | Pilier | Cluster | Mot-clé | Vol/mois | KD |
|---|---|---|---|---|---|
| 1 | **`commissions-airbnb`** | Rentabilité | airbnb commission | 880 | 21 |
| 2 | **`taux-occupation-airbnb-methode`** | Rentabilité | taux occupation airbnb par ville | 320 | 19 |
| 3 | **`pricing-airbnb-tarif-dynamique`** | Outils | tarif conciergerie airbnb | 480 | 20 |
| 4 | **`automatiser-location-saisonniere`** | Outils | automatiser airbnb | 110 | 15 |
| 5 | **`conciergerie-airbnb`** | Conciergerie | conciergerie airbnb | 5400 | 35 |

> Les piliers `contrat-location-saisonniere` et `investissement-lmnp` ont été **supprimés** (déjà page outil / hors intention LCD). Résultat : 5 piliers au lieu de 7.

---

## 🛰️ Phase 2 — Satellites par cluster

### Cluster RENTABILITÉ / CHIFFRES (5 satellites, après clean)

| # | Article | Mot-clé | Vol | KD | Dépend de |
|---|---|---|---|---|---|
| 6 | `simulateur-rentabilite-airbnb-guide` | simulateur rentabilité airbnb | 140 | 21 | louer-airbnb-rentable, commissions-airbnb, taux-occupation-airbnb-methode |
| 7 | `petites-villes-rentabilite-airbnb` ⭐ | investissement location saisonniere | 320+480 | 23 | louer-airbnb-rentable, taux-occupation-airbnb-methode |
| 8 | `superhost-airbnb` | superhost airbnb | 320 | 28 | louer-airbnb-rentable, pricing-airbnb-tarif-dynamique |
| 9 | `booking-vs-airbnb` | booking vs airbnb | 140 | 20 | commissions-airbnb, pricing-airbnb-tarif-dynamique |
| 10 | `commission-booking-proprietaire` | commission booking | 390 | 28 | commissions-airbnb |

> ⭐ `petites-villes-rentabilite-airbnb` fusionne l'intention de l'ancien `investissement-locatif-saisonnier`. Vol combiné 800/mois.

### Cluster FISCALITÉ / LMNP (4 satellites, après clean)

| # | Article | Mot-clé | Vol | KD | Dépend de |
|---|---|---|---|---|---|
| 11 | `lmnp-amortissement` ⚠️ | amortissement lmnp | 3600 | 32 | lmnp-airbnb — à repositionner angle LCD spécifique |
| 12 | `lmnp-2026` ⚠️ | lmnp 2026 | 2900 | 21 | lmnp-airbnb, lmnp-amortissement — à repositionner angle LCD |
| 13 | `location-meublee-vs-location-courte-duree` | location meublée | 8100 | 35 | lmnp-airbnb, loi-airbnb-2025 |
| 14 | `loi-airbnb-2025` | loi airbnb 2025 | 480 | 33 | lmnp-airbnb, lmnp-2026 |
| 15 | `taxe-sejour-airbnb` | taxe de séjour airbnb | 590 | 27 | commissions-airbnb |

> ⚠️ **Supprimés** : `investissement-lmnp`, `comptable-lmnp`, `lmnp-cfe`, `dpe-obligatoire-location` (hors intention LCD).
> ⚠️ Les 2 articles LMNP conservés doivent être **repositionnés** avec angle LCD dans le titre et le contenu (ex: "amortissement LMNP en Airbnb", "LMNP 2026 pour LCD").

### Cluster OUTILS / LOGICIELS (13 satellites)

**Sous-cluster : Channel managers**
| # | Article | Mot-clé | Vol | KD |
|---|---|---|---|---|
| 16 | `channel-manager` | channel manager | 2500 | 20 |
| 17 | `channel-manager-gratuit` | channel manager gratuit | 320 | 8 |
| 18 | `channel-manager-conciergerie` | channel manager conciergerie | 170 | 6 |
| 19 | `pms-location-saisonniere` | pms location saisonnière | 170 | 9 |
| 20 | `google-hotel-ads-channel-manager` | google hotel ads channel manager | 110 | 9 |

**Sous-cluster : Avis outils**
| # | Article | Mot-clé | Vol | KD |
|---|---|---|---|---|
| 21 | `smoobu-vs-lodgify-amenitiz` | smoobu vs lodgify | 110 | 18 |
| 22 | `amenitiz-avis` | amenitiz avis | 720 | 21 |
| 23 | `smoobu-avis` | smoobu avis | 320 | 26 |
| 24 | `lodgify-avis` | avis lodgify | 260 | 26 |
| 25 | `eviivo-avis` | eviivo avis | 140 | 20 |
| 26 | `superhote-avis` | superhote avis | 260 | 13 |
| 27 | `pricelabs-vs-wheelhouse` | pricelabs avis | 110 | 10 |
| 28 | `site-reservation-location-saisonniere` | créer un site internet pour location saisonnière | 70 | 17 |

### Cluster GESTION / CONCIERGERIE (4 satellites)

| # | Article | Mot-clé | Vol | KD |
|---|---|---|---|---|
| 29 | `conciergerie-digitale-lcd` ⭐ | conciergerie digitale | 260 | 11 |
| 30 | `gestion-linge-airbnb` | gestion linge airbnb | 50 | 12 |
| 31 | `serrure-connectee-airbnb` | serrure connectée | 12100 | 26 |
| 32 | `inventaire-location-meublee` | inventaire location meublée | 390 | 10 |

> ⭐ `conciergerie-digitale-lcd` : à repositionner **100% angle Enomia** (alternative à la conciergerie classique = automatiser sans prestataire).

### Cluster FORMATIONS (2 satellites)

| # | Article | Mot-clé | Vol | KD |
|---|---|---|---|---|
| 33 | `formation-conciergerie-airbnb` | formation conciergerie airbnb | 320 | 12 |
| 34 | `formation-location-courte-duree` | formation location courte durée | 70 | 16 |

---

## 🗑️ Articles supprimés (2026-04-21)

Supprimés du backlog car hors intention LCD stricte ou doublons avec pages outils.

| Article | Mot-clé | Vol | Raison |
|---|---|---|---|
| `rentabilite-locative-calcul` | rentabilité locative calcul | 1900 | Immobilier classique, pas LCD |
| `investissement-lmnp` | investissement lmnp | 1900 | LMNP générique, pas LCD-spécifique |
| `dpe-obligatoire-location` | dpe obligatoire location | 2400 | Toutes locations, pas LCD |
| `comptable-lmnp` | comptable lmnp | 1600 | LMNP générique |
| `lmnp-cfe` | cfe lmnp | 1300 | LMNP générique |
| `contrat-location-saisonniere` | contrat de location saisonnière | 1300 | Déjà page outil `/contrat-location-saisonniere` |
| `facture-location-saisonniere-guide` | facture location saisonnière | 260 | Déjà page outil `/facture-location-saisonniere` |
| `facture-booking-proprietaire` | facture booking | 1900 | Déjà page outil `/facture-booking` |
| `investissement-locatif-saisonnier` | investissement locatif saisonnier | 480 | Fusionné dans `petites-villes-rentabilite-airbnb` |

**Volume perdu** : ~13 060 vol/mois — mais trafic qui convertissait mal (intent hors audience Enomia).

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

## 📈 Prochaine étape : opportunités SEMrush

Une fois le plan clean stabilisé, compléter avec :
- Analyse SEMrush des keywords réellement utilisés par les prospects LCD
- Opportunités à faible KD / fort volume
- Trous dans le maillage actuel

---

## Statistiques finales

- **Total articles** : 38 (4 en ligne + 34 dans backlog)
- **Piliers** : 9 (4 en ligne + 5 à publier)
- **Satellites** : 29
- **Supprimés (audit 21/04)** : 9 articles hors LCD
- **Volume cumulé cluster LCD** : ~40 000 vol/mois (vs 53 000 avant clean, mais intent beaucoup mieux aligné)
