# Blog Tracking — Suivi Éditorial Enomia

> **Source unique de vérité** pour le suivi des articles blog (planifiés, brouillons, en ligne).
> **À mettre à jour** à chaque création / publication / archivage d'article + à chaque audit SEMrush.
>
> Origine : tableau Numbers `Enomia_Suivi_Blog.numbers` que Marc avait fait en avril 2026 (57 articles, 73 770 vol/mois cumulé). Extrait via `numbers-parser` Python + recopié en Markdown versionné Git le 2026-05-25 pour ne plus perdre cette mémoire entre sessions.

## ⚠️ CONVENTION KW SEMrush — Ne JAMAIS tronquer les petits mots

**Règle absolue** : conserver les KW exactement comme ils sont dans SEMrush, **avec tous les petits mots** (de, et, entre, au, pour, etc.).

**Pourquoi** : si on note `différence location saisonnière meublé tourisme` au lieu de `différence **entre** location saisonnière **et** meublé de tourisme`, on aboutit à 0 vol → on croit l'opportunité morte → on archive un KW qui valait 1000 vol/mois KD 15.

**Exemples de la session 2026-05-25** :
- `différence entre location saisonnière et meublé de tourisme` (1000 vol KD 15) ≠ `différence location saisonnière meublé tourisme` (0 vol)
- `comment faire remonter mon annonce sur airbnb` (90 vol KD 10) ≠ `remonter annonce airbnb` (0)
- `boite à clé connecté` (390 vol KD 15) ≠ `boite à clés airbnb` (40 vol)
- `combien prend airbnb au propriétaire` (260 vol) ≠ `airbnb propriétaire commission` (?)

**Process à respecter pour chaque nouvel article** :
1. Identifier le KW racine via `phrase_related` SEMrush
2. Tester le KW EXACT (avec petits mots, avec accents, avec apostrophes) via `phrase_this`
3. Noter le **KW exact tel qu'utilisé par SEMrush** dans le tracking
4. Pas de raccourci, pas de troncation

## Note sur les écarts de volume Marc (avril 2026) vs SEMrush actuel (mai 2026)

Recall SEMrush effectué le 2026-05-25 a montré des écarts (-9% à -86%) **même après correction des KW**. Hypothèses :
- **Saisonnalité LCD** (pic préparation saison au printemps)
- **Update mensuel SEMrush** (snapshot statistique différent)
- **Possible base SEMrush différente** consultée par Marc (annuel moyen vs mensuel ?)

**Règle pour piloter** : se fier au **vol SEMrush actuel** pour les décisions de priorisation, mais conserver le snapshot Marc en référence historique.

## Tableau de suivi complet (57 articles, 73 770 vol cumulé annoncé)

| # | Priorité | Cluster | Slug | KW EXACT (avec tous les petits mots) | Vol Marc (avril 2026) | Vol SEMrush (mai 2026) | KD | Statut |
|---|---|---|---|---|---|---|---|---|
| 2 | P1 — Pilier | 🔧 Channel Manager | /channel-manager-comparatif | channel manager | 2 500 | 1 900 | 28 | en-ligne |
| 3 | P1 — Pilier | 💰 Rentabilité | /louer-airbnb-rentable | louer en airbnb est-ce rentable | 1 000 | 390 | 16 | en-ligne |
| 4 | P1 — Pilier | 💸 Commissions | /commissions-airbnb | airbnb commission | 880 | 880 | 22 | en-ligne |
| 5 | P1 — Pilier | 📱 Pricing | /pricing-airbnb-tarif-dynamique | tarif conciergerie airbnb | 480 | 480 | 5 | en-ligne |
| 6 | P1 — Pilier | 💶 Fiscalité | /lmnp-airbnb | lmnp airbnb | 390 | 390 | 16 | en-ligne |
| 7 | P1 — Pilier | 📊 Taux Occupation | /taux-occupation-par-ville | taux occupation airbnb par ville | 320 | 70 | 16 | en-ligne |
| 8 | P1 — Pilier | ⚙️ Automatisation | /automatiser-airbnb | automatiser airbnb | 110 | 40 | 0 | en-ligne |
| 9 | P1 — Satellite | 🔑 Équipement | /serrure-connectee-airbnb | serrure connectée | 12 100 | 12 100 | 26 | en-ligne |
| 10 | P1 — Pilier | 🏡 LCD | /location-courte-duree | location courte durée | — | 2 900 | 26 | **brouillon** (créé 2026-05-25, ex `/location-meublee-vs-location-courte-duree` 0 vol refactoré) |
| 11 | P1 — Satellite | 💶 Fiscalité | /fiscalite-airbnb | fiscalité airbnb 2025 | 1 300 | 720 | 21-37 | en-ligne (KW exact à 720 ; "fiscalité airbnb" sans 2025 = 720 aussi) |
| 12 | P1 — Satellite | 🔧 Channel Manager | /channel-manager-gratuit | channel manager gratuit | 320 | 320 | 8-12 | brouillon backlog ⭐⭐ |
| 13 | P1 — Satellite | ⭐ Avis Outils | /superhote-avis | superhote avis | 260 | 320 | 13-19 | brouillon backlog |
| 14 | P1 — Satellite | 🔧 Channel Manager | /channel-manager-conciergerie | channel manager conciergerie | 170 | 210 | 6-10 | brouillon backlog ⭐⭐ |
| 15 | P1 — Nouveau | 🏛️ Réglementation | /loi-le-meur-airbnb | loi le meur | 6 450 | 4 400 | 26-34 | en-ligne (refresh 2026-05-25 : +KW loi airbnb 2025/2026) |
| 16 | P1 — Nouveau | 📊 Meublé de tourisme | /meuble-tourisme-classe | meublé de tourisme classé | 4 690 | 720 | 20-21 | à rédiger |
| 17 | P1 — Nouveau | 🔄 Arbitrage / Sous-location | /sous-location-airbnb | sous location airbnb | 3 830 | 320 (mais cluster `sous location` 4400) | 14 | à rédiger ⭐ |
| 18 | P1 — Nouveau | 🏢 Gestion | /tarif-gestion-locative-airbnb | tarif gestion locative | 1 540 | 480 | 26 | à rédiger |
| 19 | P1 — Nouveau | 💰 Estimation | /estimation-airbnb | estimation airbnb | 1 370 | 1 000 | 33-35 | **déjà couvert par page outil `/estimation-airbnb`** → ne pas créer d'article blog redondant |
| 20 | P1 — Nouveau | 🔗 Réservation directe | /reservation-directe-airbnb | comment passer en direct sur airbnb | 330 | 110 | 12 | à rédiger |
| 21 | P2 — Satellite | 💶 Fiscalité | /amortissement-lmnp | amortissement lmnp | 3 600 | 3 600 | 32-35 | **brouillon** (créé 2026-05-25) |
| 22 | P2 — Satellite | 💶 Fiscalité | /reforme-lmnp | lmnp 2026 | 2 900 | 2 900 | 21-22 | **brouillon** (créé 2026-05-25, ex `/lmnp-2026` renommé pour slug évergreen) |
| 23 | P2 — Satellite | 💰 Rentabilité | /investissement-locatif-saisonnier | investissement location saisonnière | 800 | 800 (cluster) | 23 | à rédiger (slug renommé depuis `/petites-villes-rentabilite-airbnb` qui ciblait 0 vol) |
| 24 | P2 — Satellite | ⭐ Avis Outils | /amenitiz-avis | amenitiz avis | 720 | 720 | 17-21 | brouillon backlog ⭐⭐ |
| 25 | P2 — Satellite | 💶 Fiscalité | /taxe-sejour-airbnb | taxe de séjour airbnb | 590 | — | 27 | **déjà couvert par outil `/calcul-taxe-de-sejour`** → archivé |
| 26 | P2 — Satellite | 💶 Fiscalité | /loi-airbnb-2025 | loi airbnb 2025 | 480 | 480 | 25-33 | **intégré dans refresh /loi-le-meur-airbnb** → archivé |
| 27 | P2 — Satellite | ⚖️ Juridique | /inventaire-location-meublee | inventaire location meublée | 390 | 40 | 0-10 | brouillon backlog (vol bas en mai 2026) |
| 28 | P2 — Satellite | 💸 Commissions | /commission-booking-proprietaire | commission booking | 390 | 390 | 22-28 | brouillon backlog |
| 29 | P2 — Satellite | ⭐ Avis Outils | /smoobu-avis | smoobu avis | 320 | 320 | 26 | brouillon backlog |
| 30 | P2 — Satellite | 🏠 Conciergerie | /formation-conciergerie-airbnb | formation conciergerie airbnb | 320 | 320 | 12 | brouillon backlog ⭐⭐ |
| 31 | P2 — Satellite | 🏡 Statuts | /superhost-airbnb | superhost airbnb | 320 | 320 | 28 | brouillon backlog |
| 32 | P2 — Satellite | ⭐ Avis Outils | /lodgify-avis | avis lodgify | 260 | 320 | 20-26 | brouillon backlog |
| 33 | P2 — Satellite | 🏠 Conciergerie | /conciergerie-digitale-lcd | conciergerie digitale | 260 | 260 | 11-17 | brouillon backlog |
| 34 | P2 — Satellite | 🔧 Channel Manager | /pms-location-saisonniere | pms location saisonnière | 170 | 0 | 9 | **archivé** (vol 0 mai 2026) |
| 35 | P2 — Satellite | ⭐ Avis Outils | /eviivo-avis | eviivo avis | 140 | 140 | 17-20 | brouillon backlog |
| 36 | P2 — Satellite | 💰 Rentabilité | /simulateur-rentabilite-airbnb | simulateur rentabilité airbnb | 140 | 140 | 21-25 | **doublon page outil `/estimation-airbnb`** → archivé |
| 37 | P2 — Satellite | 📱 Pricing | /booking-vs-airbnb | booking vs airbnb | 140 | 40 | 0-20 | brouillon backlog (vol bas) |
| 38 | P2 — Satellite | 🔧 Channel Manager | /smoobu-vs-lodgify-amenitiz | smoobu vs lodgify | 110 | 140 | 18-19 | brouillon backlog |
| 39 | P2 — Satellite | 🔧 Channel Manager | /google-hotel-ads-channel-manager | google hotel ads channel manager | 110 | 110 | 9 | brouillon backlog |
| 40 | P2 — Satellite | ⭐ Avis Outils | /pricelabs-vs-wheelhouse | pricelabs avis | 110 | 140 | 10-14 | brouillon backlog |
| 41 | P2 — Satellite | 🔧 Channel Manager | /site-reservation-location-saisonniere | créer un site internet pour location saisonnière | 70 | 0 | 17 | **archivé** (vol 0) |
| 42 | P2 — Satellite | ⚙️ Automatisation | /gestion-linge-airbnb | gestion linge airbnb | 50 | 40 | 0-12 | brouillon backlog (vol bas) |
| 43 | P2 — Nouveau | 🧹 Ménage | /frais-menage-airbnb | frais de ménage airbnb | 2 570 | 590 (cluster `frais airbnb` 1000 + `airbnb menage` 880) | 20-27 | à rédiger |
| 44 | P2 — Nouveau | 📖 Livret accueil | /livret-accueil-airbnb | livret d'accueil airbnb | 2 400 | 390 (cluster ~1500) | 16 | à rédiger |
| 45 | P2 — Nouveau | 📝 Fiscalité | /declarer-revenus-airbnb-case-impot | déclaration revenus airbnb | 1 310 | 390 | 31 | à rédiger |
| 46 | P2 — Nouveau | 🛡️ Assurance | /assurance-airbnb-proprietaire | airbnb assurance | 1 210 | 390 (ou `assurance airbnb` 720) | 32-35 | à rédiger |
| 47 | P1 — Nouveau | 🏛️ Bail / Meublé | /difference-location-saisonniere-meuble-tourisme | différence entre location saisonnière et meublé de tourisme | 1 100 | **1 000** | **15** | **en-ligne** ⭐⭐ — vrai vol confirmé, KW exact à respecter |
| 48 | P2 — Nouveau | 🏢 Copropriété | /airbnb-copropriete | airbnb copropriété | 940 | 210 | 17-22 | à rédiger |
| 49 | P2 — Nouveau | 🏛️ Réglementation | /numero-enregistrement-airbnb | numéro d'enregistrement airbnb | 900 | 390 | 20 | **en-ligne** |
| 50 | P2 — Nouveau | 🛡️ Caution | /caution-airbnb | airbnb caution | 830 | **720** | 22 | à rédiger ⭐ |
| 51 | P2 — Nouveau | 🔑 Équipement | /boite-a-cles-airbnb | boite à clé connecté | 750 | 390 | 15 | à rédiger ⭐ (le KW est "boite à clé connecté", pas "boîte à clés airbnb") |
| 52 | P2 — Nouveau | 📷 Marketing annonce | /photos-airbnb | photographe pour airbnb | 750 | 140 | 12-29 | à rédiger |
| 53 | P2 — Nouveau | 🏢 Devenir concierge | /devenir-concierge-airbnb | devenir concierge airbnb | 660 | **480** | 16 | à rédiger ⭐ |
| 54 | P2 — Nouveau | 💰 Revenus | /combien-prend-airbnb-proprietaire | combien prend airbnb au propriétaire | 630 | 260 | 23 | à rédiger |
| 55 | P2 — Nouveau | 🎨 Optimisation annonce | /remonter-annonce-airbnb-algorithme | comment faire remonter mon annonce sur airbnb | 630 | 90 | **10** | à rédiger (KD très bas) |
| 56 | P2 — Nouveau | 🔄 Calendrier/Sync | /synchroniser-airbnb-booking | synchroniser calendrier airbnb et booking | 490 | 110 | 21 | à rédiger |
| 57 | P3 — Satellite | 🎓 Formation | /formation-location-courte-duree | formation location courte durée | 70 | 70 | 2-16 | brouillon backlog (vol bas) |

### Total annoncé Marc avril 2026 : 73 770 vol/mois cumulé

### Articles ajoutés depuis le tracking original Marc (avril 2026)

| Slug | KW | Vol SEMrush | KD | Statut |
|---|---|---|---|---|
| /taxe-habitation-airbnb | taxe habitation airbnb | 90 | 19 | en-ligne |

### 🆕 Articles "X avis" identifiés au 2026-05-25 (audit "avis [outil]")

Manquants du tracking original Marc, ~640 vol/mois cumulés. Tous KD ≤ 21.

| Slug à créer | KW | Vol | KD | Catégorie | Priorité |
|---|---|---|---|---|---|
| `airdna-avis` | airdna avis | 110 | **7** ⭐⭐ | outils-automatisation | P2 (data intelligence LCD) |
| `pricelabs-avis` | pricelabs avis | 140 | 14 ⭐ | outils-automatisation | P2 (distinct du pricelabs-vs-wheelhouse) |
| `octorate-avis` | octorate avis | 110 | 14 ⭐ | outils-automatisation | P2 |
| `cloudbeds-avis` | cloudbeds avis | 90 | 15 | outils-automatisation | P2 |
| `hostaway-avis` | hostaway avis | 110 | 21 | outils-automatisation | P2 |
| `beds24-avis` | beds24 avis | 70 | 13 | outils-automatisation | P3 |

### ❌ Articles "X avis" à NE PAS créer (vol confirmé trop bas le 2026-05-25)

| KW testé | Vol | Verdict |
|---|---|---|
| `wheelhouse avis`, `avis wheelhouse` | 0 | KW inexistant — garder uniquement `pricelabs-vs-wheelhouse` |
| `hostfully avis` | 10 | trop bas |
| `hospitable avis` | 0 (NOTHING FOUND) | inexistant |
| `avantio avis` | 30 | trop bas |
| `mews avis` | 20 | trop bas |
| `guesty avis` | 40 | trop bas |
| `siteminder avis` | 20 | trop bas |
| `beyond pricing avis` | 20 | trop bas |

### ❌ Combinaisons "X vs Y" à NE PAS créer (audit 2026-05-25)

Le marché LCD FR ne génère pas de recherches comparatives binaires. **20 combinaisons testées**, seul `smoobu vs lodgify` (140 vol KD 19) ressort — déjà couvert par `smoobu-vs-lodgify-amenitiz` dans le backlog.

Autres "X vs Y" testés à 0 vol : smoobu vs beds24, smoobu vs amenitiz, smoobu vs superhote, lodgify vs beds24, lodgify vs amenitiz (20 vol marginal), lodgify vs superhote, amenitiz vs beds24, amenitiz vs superhote, superhote vs beds24, hostfully vs smoobu, hospitable vs smoobu, beds24 vs hostfully, avantio vs smoobu, octorate vs smoobu, etc.

**Stratégie corrigée** : concentrer sur les "X avis" individuels (où est le vol) + 1 article comparatif global (`channel-manager-comparatif` en ligne) + 1 article "X vs Y" populaire (`smoobu-vs-lodgify-amenitiz` à publier).

## Top ROI réel à attaquer (basé sur SEMrush mai 2026)

Score = Vol × (60 − KD) / 60. Top 10 :

| Rank | Slug | KW exact | Vol | KD | Score | Statut |
|---|---|---|---|---|---|---|
| 1 | difference-loc-sais-meublé-tourisme | différence entre location saisonnière et meublé de tourisme | 1 000 | 15 | **750** | en-ligne (mais KW pillarKeyword cible 0 vol — refresh à faire) |
| 2 | caution-airbnb | airbnb caution | 720 | 22 | 456 | à rédiger |
| 3 | amenitiz-avis | amenitiz avis | 720 | 17 | 516 | brouillon backlog |
| 4 | meuble-tourisme-classe | meublé de tourisme classé | 720 | 21 | 468 | à rédiger |
| 5 | devenir-concierge-airbnb | devenir concierge airbnb | 480 | 16 | 352 | à rédiger |
| 6 | boite-a-cles-airbnb | boite à clé connecté | 390 | 15 | 293 | à rédiger |
| 7 | livret-accueil-airbnb | livret d'accueil airbnb | 390 | 16 | 286 | à rédiger |
| 8 | commission-booking-proprietaire | commission booking | 390 | 22 | 247 | brouillon backlog |
| 9 | channel-manager-gratuit | channel manager gratuit | 320 | 12 | 256 | brouillon backlog |
| 10 | formation-conciergerie-airbnb | formation conciergerie airbnb | 320 | 12 | 256 | brouillon backlog |

## Articles archivés (vol = 0 ou redondants)

| Slug | Raison |
|---|---|
| `/pms-location-saisonniere` | KW à 0 vol SEMrush mai 2026 |
| `/site-reservation-location-saisonniere` | KW à 0 vol |
| `/simulateur-rentabilite-airbnb-guide` | Doublon de la page outil `/estimation-airbnb` |
| `/conciergerie-airbnb` (backlog) | KW déjà couvert par le hub `/conciergerie-airbnb` |
| `/taxe-sejour-airbnb` (backlog) | Déjà couvert par l'outil `/calcul-taxe-de-sejour` |
| `/loi-airbnb-2025` (backlog) | Intégré dans le refresh de `/loi-le-meur-airbnb` |
| `/location-meublee-vs-location-courte-duree` (backlog) | KW comparatif à 0 vol — refactoré en `/location-courte-duree` |
| `/lmnp-2026` (backlog) | Renommé en `/reforme-lmnp` (slug évergreen) |
| `/lmnp-amortissement` (backlog) | Renommé en `/amortissement-lmnp` (KW principal en premier) |
| `/channel-manager` (backlog) | Doublon strict de `/channel-manager-comparatif` (en-ligne) |
| `/serrure-connectee-airbnb` (backlog) | Doublon de l'article en ligne |

## 🔁 Audits récurrents planifiés

| Quand | Quoi | Skill / Procédure |
|---|---|---|
| **2026-06-25** (event Google Calendar) | Audit complet meta title + meta description de tous les articles blog en ligne | Comme fait le 2026-05-25 sur `/difference-location-saisonniere-meuble-tourisme` : recall SEMrush KW exact, vérifier metaTitle ≤ 60 chars contient KW principal, metaDescription 140-160 chars, H1 aligné, détection cannibalisations, update updatedAt |
| **2026-08-25** | Audit complet SEMrush sur tous les pillarKeyword (refresh volumes) | Refaire un recall phrase_this + phrase_related sur les 50+ KW du tableau. Mettre à jour la colonne "Vol SEMrush actuel". Détecter les KW qui ont basculé sous le seuil de rentabilité. |
| Tous les 3 mois | Vérification anti-cannibalisation interne | grep des pillarKeyword + scan des metaTitle pour s'assurer qu'aucun couple d'articles ne cible le même KW |
| Annuel (janvier) | Refresh "année courante" dans H1/meta de tous les articles temporels | Passer 2026 → 2027 dans les metaTitle / metaDescription / H1 de tous les articles. Slug évergreen reste stable (cf. convention slug). |

**Procédure d'audit meta title/description** :
1. Pour chaque article en ligne (src/content/blog/*.mdoc) : recall SEMrush sur le pillarKeyword exact (avec tous les petits mots intacts)
2. Vérifier que metaTitle ≤ 60 chars contient le KW principal
3. Vérifier que metaDescription 140-160 chars contient KW principal + KW secondaire
4. Vérifier que H1 contient le KW principal (proche du KW exact SEMrush)
5. Détecter cannibalisations (2 articles → même intent)
6. Update updatedAt pour signal fraîcheur GSC

## Méthodologie pour les futurs audits

1. **À chaque création/refresh d'article** : update les colonnes correspondantes
2. **Audit complet SEMrush** : à refaire tous les 3-6 mois (le marché LCD bouge vite)
3. **Pour chaque nouvel article** : `phrase_related` SEMrush sur le KW racine pour identifier le **vrai KW exact** + son cluster
4. **Source de vérité** : ce fichier (versionné Git) > Numbers (perdable entre sessions)

## Historique des changements

- **2026-05-25** : Création du fichier depuis le tableau Numbers Marc + recall SEMrush complet. Détection d'écarts massifs (-50% à -99%) entre avril et mai 2026 sur certains KW. Investigation montre 2 causes :
  - Variantes orthographiques erronées (KW noté sans les petits mots dans le tracking, alors que SEMrush retournait du volume avec les petits mots)
  - Possible saisonnalité LCD ou update SEMrush
- **Extraction Numbers en CSV** via `numbers-parser` Python — 57 articles trouvés (vs 47 via preview image) + 6 articles bonus identifiés.
- **Convention KW ajoutée** : ne JAMAIS tronquer les petits mots des KW SEMrush dans le tracking.
