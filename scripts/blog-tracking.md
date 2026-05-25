# Blog Tracking — Suivi Éditorial Enomia

> **Source unique de vérité** pour le suivi des articles blog (planifiés, brouillons, en ligne).
> **À mettre à jour** à chaque création / publication / archivage d'article + à chaque audit SEMrush.
>
> Origine : tableau Numbers `Enomia_Suivi_Blog.numbers` que Marc avait fait en avril 2026 (57 articles, 79 170 vol/mois cumulé annoncé). Recopiation en Markdown versionné Git le 2026-05-25 pour ne plus perdre cette mémoire entre sessions.

## ⚠️ Note importante sur les écarts de volume Marc vs SEMrush actuel

Recall SEMrush effectué le **2026-05-25** + investigation phrase_related : la cause des écarts massifs (-50% à -99%) sur certains KW est désormais identifiée.

**Cause confirmée par Marc** : lors du search manuel d'avril 2026, certaines variantes orthographiques erronées ont été saisies, ou des KW associés différents ont été cumulés. Les vrais KW à fort volume sont des variantes proches mais distinctes.

**Exemples corrigés** :
| KW noté avril 2026 | Vrai KW SEMrush | Vrai vol |
|---|---|---|
| `différence location saisonnière et meublé de tourisme` (1100) | `différence **entre** location saisonnière **et** meublé de tourisme` | 1 000 KD 15 ⭐ |
| `frais ménage airbnb` (2570) | cluster cumulé : `frais airbnb` (1000) + `airbnb menage` (880) + `frais de ménage airbnb` (590) | ~3000 cumulé |
| `sous location airbnb` (3830) | `sous location` (4400, sans airbnb) | 4 400 ⭐ |
| `meublé tourisme classé` (4400) | `meublé de tourisme` (2900) + `classement meublé de tourisme` (720) | ~3600 cumulé |
| `livret d'accueil airbnb` (2400) | cluster ~1500 cumulé (KW principal `livret d'accueil airbnb` 390) | ~1500 cumulé |
| `assurance airbnb propriétaire` (870) | `assurance airbnb` (720) ou `assurance location saisonnière` (720) | 720 |
| `boîte à clés airbnb` (1130) | aucune variante > 90 vol — KW niche réel | ~90 max |

**Règle pour piloter** : se fier aux **vrais KW SEMrush actuels** (colonne "Vol SEMrush corrigé"). Pour chaque article, identifier le **KW racine du cluster** via `phrase_related` avant rédaction.

## Tableau de suivi (57 articles)

| # | Priorité | Cluster | Slug | KW principal | Vol Marc (avril 2026) | Vol SEMrush (mai 2026) | KD actuel | Statut |
|---|---|---|---|---|---|---|---|---|
| 1 | P1 — Pilier | Channel Manager | channel-manager-comparatif | channel manager | 2500 | **1900** | 28 | en-ligne |
| 2 | P1 — Pilier | Rentabilité | louer-airbnb-rentable | louer en airbnb est-ce rentable | 1000 | **390** | 16 | en-ligne |
| 3 | P1 — Pilier | Commissions | commissions-airbnb | airbnb commission | 880 | 880 | 22 | en-ligne |
| 4 | P1 — Pilier | Pricing | pricing-airbnb-tarif-dynamique | tarif conciergerie airbnb | 480 | 480 | 5 | en-ligne |
| 5 | P1 — Pilier | Fiscalité | lmnp-airbnb | lmnp airbnb | 390 | 390 | 16 | en-ligne |
| 6 | P1 — Pilier | Taux Occupation | taux-occupation-par-ville | taux occupation airbnb par ville | 320 | **70** | 16 | en-ligne |
| 7 | P1 — Pilier | Automatisation | automatiser-airbnb | automatiser airbnb | 110 | **40** | 0 | en-ligne |
| 8 | P1 — Satellite | Outils | serrure-connectee-airbnb | serrure connectée | 12100 | 12100 | 26 | en-ligne |
| 9 | P1 — Pilier | LCD | location-courte-duree | location courte durée | — | **2900** | 26 | **brouillon** (créé 2026-05-25) |
| 10 | P1 — Pilier | Fiscalité | fiscalite-airbnb | fiscalité airbnb | 1300 | **720** | 37 | en-ligne |
| 11 | P1 — Satellite | Channel Manager | channel-manager-gratuit | channel manager gratuit | 320 | 320 | 12 | brouillon backlog |
| 12 | P1 — Satellite | Outils | channel-manager-conciergerie | channel manager conciergerie | 170 | 210 | 10 | brouillon backlog |
| 13 | P1 — Pilier | Loi | loi-le-meur-airbnb | loi le meur | 6450 | **4400** | 34 | en-ligne (refresh 2026-05-25 : +KW loi airbnb 2025) |
| 14 | P2 — Nouveau | Meublé de Tourisme | meuble-tourisme-classe | meublé de tourisme classé | 4400 | **720** | 21 | à rédiger |
| 15 | P2 — Nouveau | Fiscalité | sous-location-airbnb | sous location airbnb | 3830 | **320** | 14 | à rédiger |
| 16 | P1 — Nouveau | Pricing | tarif-gestion-locative-airbnb | tarif gestion locative | 1540 | **480** | 26 | à rédiger |
| 17 | P2 — Nouveau | Outils | estimation-airbnb | estimation airbnb | 1370 | 1000 | 33 | déjà couvert par page outil `/estimation-airbnb` |
| 18 | P2 — Nouveau | Réservation directe | reservation-airbnb | comment passer en direct sur airbnb | 330 | **110** | 12 | à rédiger |
| 19 | P2 — Satellite | Fiscalité | amortissement-lmnp | amortissement lmnp | 3600 | 3600 | 35 | **brouillon** (créé 2026-05-25) |
| 20 | P2 — Satellite | Fiscalité | reforme-lmnp | lmnp 2026 | 2900 | 2900 | 22 | **brouillon** (créé 2026-05-25, ex `lmnp-2026.mdoc` renommé pour slug évergreen) |
| 21 | P2 — Satellite | Rentabilité | investissement-locatif-saisonnier | investissement location saisonnière | 800 | 800 (combiné) | 23 | à rédiger (slug renommé depuis `petites-villes-rentabilite-airbnb` qui avait 0 vol) |
| 22 | P2 — Satellite | Fiscalité | taxe-sejour-airbnb | taxe de séjour airbnb | 590 | — | 27 | **déjà couvert par outil `/calcul-taxe-de-sejour`** → archiver backlog |
| 23 | P2 — Satellite | Outils | amenitiz-avis | amenitiz avis | 720 | 720 | 17 | brouillon backlog ⭐⭐ |
| 24 | P2 — Satellite | Juridique | loi-airbnb-2025 | loi airbnb 2025 | 480 | 480 | 25 | **intégré dans refresh loi-le-meur-airbnb** → archivé |
| 25 | P2 — Satellite | Outils | inventaire-location-meublee | inventaire location meublée | 390 | 40 | 0 | brouillon backlog (vol bas) |
| 26 | P2 — Satellite | Commissions | commission-booking-proprietaire | commission booking | 390 | 390 | 22 | brouillon backlog |
| 27 | P2 — Satellite | Avis Outils | smoobu-avis | smoobu avis | 320 | 320 | 26 | brouillon backlog |
| 28 | P2 — Satellite | Conciergerie | formation-conciergerie-airbnb | formation conciergerie airbnb | 320 | 320 | 12 | brouillon backlog ⭐⭐ |
| 29 | P2 — Satellite | Avis Outils | superhost-airbnb | superhost airbnb | 320 | 320 | 28 | brouillon backlog |
| 30 | P2 — Satellite | Avis Outils | lodgify-avis | avis lodgify | 260 | 320 | 20 | brouillon backlog |
| 31 | P2 — Satellite | Conciergerie | conciergerie-digitale-lcd | conciergerie digitale | 260 | 260 | 17 | brouillon backlog |
| 32 | P2 — Satellite | Channel Manager | pms-location-saisonniere | pms location saisonnière | 170 | **0** | 9 | brouillon backlog → archiver |
| 33 | P2 — Satellite | Avis Outils | eviivo-avis | eviivo avis | 140 | 140 | 17 | brouillon backlog |
| 34 | P2 — Satellite | Rentabilité | simulateur-rentabilite-airbnb-guide | simulateur rentabilité airbnb | 140 | 140 | 25 | conflit avec page outil → archiver |
| 35 | P2 — Satellite | Outils | booking-vs-airbnb | booking vs airbnb | 140 | 40 | 0 | brouillon backlog (vol bas) |
| 36 | P2 — Satellite | Outils | smoobu-vs-lodgify-amenitiz | smoobu vs lodgify | 110 | 140 | 19 | brouillon backlog |
| 37 | P2 — Satellite | Channel Manager | google-hotel-ads-channel-manager | google hotel ads channel manager | 110 | 110 | 9 | brouillon backlog |
| 38 | P2 — Satellite | Avis Outils | pricelabs-vs-wheelhouse | pricelabs avis | 110 | 140 | 14 | brouillon backlog |
| 39 | P2 — Satellite | Outils | site-reservation-location-saisonniere | créer un site internet pour location saisonnière | 70 | **0** | 17 | brouillon backlog → archiver |
| 40 | P2 — Nouveau | Automatisation | gestion-linge-airbnb | gestion linge airbnb | 50 | 40 | 0 | brouillon backlog (vol bas) |
| 41 | P2 — Nouveau | Ménage | frais-menage-airbnb | frais ménage airbnb | 2570 | **110** | 27 | à rédiger (vol bcp plus bas qu'annoncé) |
| 42 | P2 — Nouveau | Livret accueil | livret-accueil-airbnb | livret d'accueil airbnb | 2400 | **390** | 16 | à rédiger |
| 43 | P2 — Nouveau | Fiscalité | declarer-revenus-airbnb-case-impot | déclaration revenus airbnb | 1310 | **390** | 31 | à rédiger |
| 44 | P2 — Nouveau | Assurance | assurance-airbnb-proprietaire | assurance airbnb propriétaire | 870 | **50** | 26 | à rédiger (vol bcp plus bas qu'annoncé) |
| 45 | P1 — Nouveau | Bail / Meublé | difference-location-saisonniere-meuble-tourisme | différence location saisonnière et meublé de tourisme | 1100 | **10** | 0 | en-ligne (vol bcp plus bas qu'annoncé) |
| 46 | P2 — Nouveau | Copropriété | airbnb-copropriete | airbnb copropriété | 940 | 210 | 22 | à rédiger |
| 47 | P2 — Nouveau | Fiscalité | numero-enregistrement-airbnb | numéro d'enregistrement airbnb | 480 | 390 | 20 | en-ligne |
| 48 | P2 — Nouveau | Caution | caution-airbnb | airbnb caution | 830 | 720 | 22 | à rédiger ⭐ |
| 49 | P2 — Nouveau | Équipement | boite-a-cles-airbnb | boîte à clés airbnb | 1130 | **40** | 0 | à rédiger (vol bcp plus bas qu'annoncé) |
| 50 | P2 — Nouveau | Marketing annonce | photos-airbnb | photographe pour airbnb | 750 | 140 | 29 | à rédiger |
| 51 | P2 — Nouveau | Fiscalité | taxe-habitation-airbnb | taxe habitation airbnb | — | 90 | 19 | en-ligne |

> **Articles manquants dans le tableau ci-dessus** : 6 articles du tableau Marc original n'ont pas été récupérés via la preview image (lignes 53-57 tronquées). À recompléter quand on aura accès au CSV brut.

## Top ROI actuel à attaquer (basé sur SEMrush mai 2026)

Ordre recommandé par ROI = Vol × (60 − KD) / 60 :

| Rank | Article | KW | Vol | KD | Score | Statut |
|---|---|---|---|---|---|---|
| 1 | amenitiz-avis | amenitiz avis | 720 | 17 | **516** | brouillon backlog |
| 2 | caution-airbnb | airbnb caution | 720 | 22 | 456 | à rédiger |
| 3 | channel-manager-gratuit | channel manager gratuit | 320 | 12 | 256 | brouillon backlog |
| 4 | formation-conciergerie-airbnb | formation conciergerie airbnb | 320 | 12 | 256 | brouillon backlog |
| 5 | meuble-tourisme-classe | meublé de tourisme classé | 720 | 21 | 468 | à rédiger |
| 6 | lodgify-avis | avis lodgify | 320 | 20 | 213 | brouillon backlog |
| 7 | superhote-avis | superhote avis | 320 | 19 | 219 | brouillon backlog |
| 8 | conciergerie-digitale-lcd | conciergerie digitale | 260 | 17 | 186 | brouillon backlog |
| 9 | commission-booking-proprietaire | commission booking | 390 | 22 | 247 | brouillon backlog |
| 10 | channel-manager-conciergerie | channel manager conciergerie | 210 | 10 | 175 | brouillon backlog |

## Articles à archiver (vol = 0 ou redondants)

| Slug | Raison |
|---|---|
| `formation-location-courte-duree` | KW à 0 vol SEMrush |
| `petites-villes-rentabilite-airbnb` | KW à 0 vol — slug à renommer en `investissement-locatif-saisonnier` si on l'attaque |
| `pms-location-saisonniere` | KW à 0 vol |
| `site-reservation-location-saisonniere` | KW à 0 vol |
| `simulateur-rentabilite-airbnb-guide` | Doublon de la page outil `/estimation-airbnb` |
| `conciergerie-airbnb` (backlog) | KW déjà couvert par le hub `/conciergerie-airbnb` |
| `taxe-sejour-airbnb` (backlog) | Déjà couvert par l'outil `/calcul-taxe-de-sejour` |

## Méthodologie pour les futurs audits

1. **À chaque création/refresh d'article** : update les colonnes correspondantes
2. **Audit complet SEMrush** : à refaire tous les 3-6 mois (le marché LCD bouge vite)
3. **Garder snapshot Marc** colonne 1 + SEMrush actuel colonne 2 + dates pour comparaison
4. **Source de vérité** : ce fichier (versionné Git) > Numbers (perdable entre sessions)

## Historique des changements

- **2026-05-25** : Création du fichier depuis le tableau Numbers Marc + recall SEMrush complet. Détection d'écarts massifs (-50% à -99% sur certains KW entre avril et mai 2026). Possible saisonnalité LCD ou update SEMrush.
