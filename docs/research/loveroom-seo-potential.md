# Potentiel SEO programmatique « love room + ville » — analyse

> Recherche menée le 2026-06-06. Source demande : SEMrush (base `fr`, `phrase_fullsearch`).
> Scripts : `scripts/semrush-loveroom.mjs` (scan) + `scripts/loveroom-analyze.mjs` (classement) + `scripts/loveroom-export-csv.mjs` (export).
> Données brutes : `/tmp/loveroom-keywords.csv` (2588 KW), `/tmp/loveroom-villes-final.json`. Export propre : `docs/research/loveroom-villes.csv`.

## 1. La demande (SEMrush)

Scan broad-match sur 3 seeds (`love room`, `loveroom`, `chambre jacuzzi`) → **2588 mots-clés uniques, 441 460 recherches/mois cumulées** sur le cluster.

En isolant l'intention **love room pure** (KW contenant « love room » / « loveroom ») :

| Périmètre | Volume/mois | KD |
|---|---|---|
| « love room » national (sans ville) | 77 100 | bas |
| Villes (cumulé, 355 villes ≥ 50) | 161 370 | 5–28 |
| Régions (normandie 5140, bretagne 4530, IdF 2850, alsace 2540…) | ~25 000 | bas |
| Départements (vendée 3130, var 2700, charente-mar. 1230…) | ~20 000 | bas |
| **Total intention love room** | **~285 000** | **très bas** |
| Cluster adjacent « chambre jacuzzi » (capturable par les mêmes pages) | ~70 000 | bas |

**Villes ≥ 100/mois sur love room pur : 241.** ≥ 300 : 99 villes. ≥ 1000 : 36 villes.

KD confirmé **très facile** : Paris 20, la plupart des villes 10–22, plusieurs sous 10 (narbonne 5, aix-en-provence 7, le mans 9). Aucun acteur ne verrouille la SERP par l'autorité.

### Top 25 villes (vol love room pur)

| # | Ville | Love room | + Jacuzzi | KD |
|---|---|---|---|---|
| 1 | Paris | 13 470 | 12 860 | 20 |
| 2 | Lyon | 8 530 | 2 460 | 19 |
| 3 | Toulouse | 5 800 | 280 | 12 |
| 4 | Marseille | 5 670 | 520 | 13 |
| 5 | Bordeaux | 5 230 | 640 | 18 |
| 6 | Angers | 3 570 | 150 | 15 |
| 7 | Nantes | 3 300 | 100 | 23 |
| 8 | Lille | 2 900 | 430 | 18 |
| 9 | Montpellier | 2 830 | 1 040 | 21 |
| 10 | Metz | 2 480 | 70 | 23 |
| 11 | Strasbourg | 2 400 | 370 | 21 |
| 12 | Tours | 2 320 | 90 | 16 |
| 13 | Rennes | 2 220 | 50 | 21 |
| 14 | Annecy | 2 130 | 530 | 17 |
| 15 | Rouen | 2 130 | 160 | 22 |
| 16 | Dijon | 2 000 | 70 | 22 |
| 17 | Nancy | 1 990 | 50 | 12 |
| 18 | Nice | 1 970 | 180 | 15 |
| 19 | Reims | 1 970 | 120 | 17 |
| 20 | Clermont-Ferrand | 1 960 | 120 | 15 |
| 21 | Caen | 1 710 | 100 | 21 |
| 22 | La Rochelle | 1 690 | 90 | 15 |
| 23 | Perpignan | 1 670 | 60 | 21 |
| 24 | Grenoble | 1 460 | 50 | 28 |
| 25 | Saint-Étienne | 1 400 | 70 | 15 |

Liste complète (355 villes) : `docs/research/loveroom-villes.csv`.

## 2. L'offre (supply)

~**2 000–3 000 love rooms** en France (WeekendLove annonce 1673, Love'nSpa 1000+, Sunday.love « plusieurs milliers »). Concentrées sur grandes villes + zones touristiques. Lyon ≈ 13–40. Les ~40–60 premières villes ont sans difficulté ≥ 3 propriétaires.

Les KW « de marque » dans la data le confirment (chaque ville a des établissements identifiables) : strasbourg yellow, private places orléans, indiscrète tours, bliss langres, metz atelier rêves, everbliss lille, lovt nantes, sensual nancy, secrets perpignan, apparenthèse poitiers, cupidon vesoul…

## 3. La concurrence — ⚠️ marché DÉJÀ encombré

Le créneau « annuaire love room » n'est PAS vierge. Acteurs établis, plusieurs avec SEO programmatique ville/région :

- **Love'nSpa** (lovenspa.fr) — « n°1 », 1000+, collections par ville
- **Luvia** (luvia-app.fr) — résa instantanée, « devenir hôte »
- **WeekendLove** (weekendlove.fr) — 1673 love rooms
- **Sunday.love** — « plusieurs milliers d'annonces »
- **LoveRoomers** (loveroomers.fr) — `/loveroom/[région]/[ville]/` (structure identique à celle visée)
- **Nuit & Spa** (nuitetspa.com) — `/spa-[ville]/`
- **Privy.spa**, **Les-love-room.com**, **L'expérience Love Room**, **SuiteCosy**, **Private-Room.fr** (sous-domaines par département), **Lovenroom.fr**, **Kinkyee.fr** (niche BDSM)

**Réconciliation KD bas + 10 concurrents** : ce sont tous des petits sites à faible autorité. Donc *rankable* avec un meilleur contenu/structure (force d'Enomia), MAIS on entre en **concurrent tardif**, pas en créateur de catégorie.

### Modèle économique des concurrents (côté hôte)

| Plateforme | Modèle | Prix hôte | Commission | Trafic / supply |
|---|---|---|---|---|
| **Love'nSpa** | Abonnement annuel fixe | **119€/an** (~10€/mo) | **0%** | 220k visiteurs/mois, ~800 rooms |
| **Love&Room** | Gratuit à vie | **0€** | 0% | 2000+ rooms |
| **1001Gites** | Gratuit | 0€ | 0% | n.c. |
| **Love'nRoom** | Abonnement (Standard/Premium), inscriptions fermées | n.c. (non public) | 0% | n.c. |
| **Luvia** | Résa instantanée (encaisse la résa) | n.c. | commission probable (à confirmer) | n.c. |
| **Sunday.love** | Sélection éditoriale | n.c. | affiliation/commission probable | « plusieurs milliers » |
| **Booking.com** | OTA généraliste | 0€ | 15–30% | massif |

**Constat clé** : le modèle DOMINANT du créneau niche est **l'abonnement annuel fixe bas (~119€/an) ou le gratuit, zéro commission**. La commission élevée, c'est Booking et les plateformes qui encaissent la résa.

⚠️ **Correction de l'hypothèse « les autres sont plus chers »** : FAUX sur le créneau niche. Love'nSpa = 119€/an AVEC déjà 220k visiteurs/mois. Une offre à 30€/mo (360€/an) en partant de 0 trafic serait **3x plus chère que le leader établi**. À iso-proposition (simple listing), invendable. Le premium ne se justifie QUE par un différenciateur réel : rareté (3 slots exclusifs/ville) + **résa directe via les rails Enomia** (booking engine, pas un simple lien) → là le 30€/mo tient ET nourrit le SaaS.

### Unlock « les clients font 200–500 km »

Le love room est un achat d'occasion/destination, pas de proximité (retours terrain Marc : clients qui font 400–500 km). Conséquences :
1. **La contrainte supply locale disparaît** : une page « love room [ville] » liste les meilleures rooms dans un rayon (1–2h), triées par distance (« à 1h10 de Lyon »). Les 240 villes deviennent toutes monétisables.
2. **Multiplie les slots vendables/proprio** : une room près de Lyon peut acheter Lyon + Saint-Étienne + Bourg-en-Bresse + Vienne + Villefranche → modèle « pack rayon » au lieu de « 3 slots/ville ». Revenu/proprio bien supérieur.
3. Caveat UX/SEO : afficher la distance, trier par proximité (sinon nuit à conversion + ranking local).

## 4. Le business model proposé (30€/mois × 3 proprio) — points durs

L'idée « vendre 3 emplacements à 30€/mois (remboursé dès 1 résa) » = **90€/ville/mois** → théorique 240 villes × 90 = ~21 600€/mois. Mais :

1. **Ce n'est pas le SaaS Enomia** — c'est un business d'annuaire/marketplace. Client différent (micro-hôte love room 1–3 chambres), modèle différent, registre de marque différent (le cluster a une longue traîne adulte : bdsm/sexe/coquin).
2. **Œuf et poule** : un annuaire sans trafic ne peut pas facturer 30€/mois. Il faut d'abord ranker + prouver des résas. 3–6 mois minimum.
3. **Attribution** : « remboursé dès 1 résa » n'est vérifiable que si la résa passe par les rails Enomia (résa directe). Un simple lien/numéro = attribution impossible → promesse intenable.
4. **Effort commercial** : 3 slots × 240 villes = ~720 ventes à des micro-entreprises price-sensibles, déjà listées sur 3–5 annuaires. Churn élevé.
5. **Concurrence frontale** : Love'nSpa, Luvia, WeekendLove vendent déjà de la visibilité aux mêmes proprios.

## 5. Recommandation

**Construire l'actif SEO : OUI.** Volume énorme, KD ridicule, machinerie programmatique conciergerie réutilisable (coût marginal quasi nul). Meilleur profil de volume que les conciergeries (love room Lyon 8530 vs conciergerie Lyon ~800).

**Monétiser via un annuaire à 30€/mois : NON (en l'état).** Reframer :

- **Version alignée stratégie** : le hub capte la demande locale haute intention (« love room lyon ») et la **route en résa directe via les rails Enomia** (0% commission pour l'hôte vs 15% OTA = le moat « recycler la demande en direct »). Le love room owner devient client du **produit** (booking engine + page directe), pas d'un annuaire. « 30€/mois remboursé dès 1 résa » fonctionne alors car la résa est traçable.
- **Court terme low-cost** : lancer le hub SEO comme actif trafic + capture email + lead-gen (proprios = futurs clients Enomia). Valider supply + willingness-to-pay sur le **top 10 villes** AVANT de scaler à 240.
- **Ligne éditoriale** : positionner « romantique / weekend en amoureux / jacuzzi privatif », EXCLURE la traîne explicite (protège la marque premium).

## 6. Prochaines étapes possibles

1. Compter précisément la supply top 20 villes (Google Places + scrape annuaires) → confirmer ≥ 3 proprios/ville.
2. Décider : actif SEO pur (lead-gen produit) vs annuaire payant vs hybride résa directe.
3. Si go : template `/love-room/[region]/[ville]` calqué sur conciergerie, démarrer top 10 villes.
4. Tester 5 appels proprios (top 2 villes) pour valider willingness-to-pay réelle avant d'industrialiser.

## 7. Supply mesurée (Love'nSpa, 1 seule plateforme)

| Zone | Rooms (Love'nSpa) | Prix/nuit |
|---|---|---|
| Paris / IdF | 65 | 80–645€ (cœur 120–450) |
| Lyon (+ Mâcon, St-Étienne, Belleville…) | 47 | 80–480€ (cœur 120–300) |
| Lille / Nord (+ Roubaix, Tourcoing) | 43 | 120–420€ |
| Marseille / PACA | 35 | 127–300€ |

Union des 10+ plateformes ≈ 1,5–2,5x ces chiffres. **La supply n'est pas la contrainte dans le top ~40.** Remplir 8 slots y est trivial. Confirmation du point « rayon » : la page « Lyon » de Love'nSpa inclut déjà des communes à 45–70 km.

## 8. Modèle de revenu (script `scripts/loveroom-revenue-model.mjs`)

Tiers villes : A (≥1000/mo) ~35 · B (300–999) ~65 · C (100–299) ~160.
Pricing dégressif par position (idée Marc) — A : 100/70/55/45/38/30/25/20 (383€/ville plein) · B : 45→20 (187€) · C : 25/20/18 (63€).

| Scénario | Hypothèses | MRR | ARR |
|---|---|---|---|
| Pessimiste | 40% villes A, 50% fill, rien d'autre | 3 780€ | **45 k€** |
| Réaliste | 80% A @60% + 50% B @40% | 11 446€ | **137 k€** |
| Optimiste | 100% A @80% + 80% B @60% + 50% C @35% | 21 609€ | **259 k€** |
| Plafond théorique | 100% villes, 100% slots | 36 201€ | 434 k€ |

Effort (réaliste) : ~208 slots vendus, ARPU 55€/slot, ~69 proprios uniques (pack rayon), CAC commission 30€/deal = ~6 240€ one-shot, **payback 1 mois**.

Valeur livrée au proprio (page rankée #1, CTR 30%, 60% clics aux slots) : Paris ~303 clics/mo/slot (**0,10€/clic** à 30€), Lyon ~192 (0,16€), Bordeaux ~118 (0,25€). **5 à 15x moins cher que Google Ads** → justifie le prix + le pitch FOMO.

⚠️ **2 caveats honnêtes sur le modèle** :
1. **Premium prix vs marché** : ARPU 55€/mo = ~660€/an, soit **5x Love'nSpa (119€/an)**. Tenable UNIQUEMENT si tu rankes au-dessus d'eux et/ou bundles la résa directe/CM. Sinon descendre à 15–20€/mo → réaliste ÷ ~2 (~70 k€/an).
2. Le **100€ slot #1** ne tient que sur les vraies mega-villes (top ~10), pas sur tout le tier A. Le réaliste est donc une borne haute du tier A.

**Le vrai prix n'est pas le cash** : 70 à 200 proprios payants = autant de **leads chauds pour Enomia CM** + un actif SEO/brand. C'est ça le ROI principal.

## 9. Niche #2 : cabane (script `semrush-niche-discover.mjs`)

Scan fullsearch (cabane dans les arbres / insolite / jacuzzi / dans les bois / spa) : **4775 KW, 276 000/mois cumulé, 83 700 national**. KD 18–35 (un peu plus haut que love room, reste accessible).

⚠️ **Structure différente de love room** : cabane est **région/département-led, pas ville-led** (les cabanes sont rurales, on cherche « cabane dans les arbres dordogne/bretagne/vosges », pas « cabane paris »). Et le keyword space est **plus bruité** (cabane playmobil/lego/minecraft/enfant/jardin/dessin = noise à filtrer).

- **Régions (propre)** : Bretagne 7020, Normandie 4920, Auvergne 4070, Vosges 3960, Occitanie 2480, Jura 1950, PACA 1840, Alsace 1530 → ~40k cumulé.
- **Départements** : Dordogne 3860, Ardèche 1850, Landes 1470, Morbihan 1470, Vendée 1450, Gironde 1400 → ~25k.
- **Vraies villes** (hors noise) : Paris 2780, Toulouse 1340, Carcassonne 1230, Bordeaux 1030, Lille 810 → ~15-25k.
- **Marques/domaines réels** détectés (= supply existe) : Pella Roca, Domaine du Mâle, Cabanes des Grands Lacs, Dihan Évasion, Cabanes Nids dans les Vosges, Entre Terre & Ciel.

**Verdict** : niche #2 valide, ~plus petite et plus bruitée, à structurer **région/département d'abord**. Profil propriétaire (hôtes insolites indépendants, nuitée chère, achat destination) = fit parfait Enomia.

## 10. Le vrai jeu : portfolio « hébergement insolite » + moteur générique

Love room et cabane partagent la **même psychologie d'achat** (occasion, on roule pour, nuitée 150-400€, proprios indépendants allergiques aux commissions OTA) → même playbook. La famille complète : love room, cabane (arbres/insolite), **bulle/dôme, yourte, roulotte, tiny house, cabane flottante**, sous l'ombrelle **« hébergement insolite [ville/région] »**.

Le moteur est désormais générique : `semrush-niche-discover.mjs` (sizing d'une niche en 1 commande) + le template `/love-room/*` (réplicable). Ajouter une niche = data + seeds.

⚠️ **Ne pas s'éparpiller** : prouver love room de bout en bout (rank + 1ers payants + rétention) AVANT de répliquer. Sinon = 5 annuaires à moitié faits qui rankent pour rien.

## 11. Architecture cible (BDD) — à BÂTIR plus tard, pas maintenant

Besoin Marc : tout piloter par BDD (abonnement payé = en ligne ; impayé = message + retrait ; commercial signe → client s'inscrit via formulaire, donne sa page, paie → ajout auto + passe IA de formatage).

**Stack** (réutilise l'existant : Astro static + Supabase `pesoidoedtjpihjvrnnc` + Stripe + Claude + Vercel) :
- **Supabase** : table `listings` (niche, nom, area, **lat/lng**, price_from, features, url_direct, owner_email, status [pending|active|past_due|removed], stripe_sub_id, salesperson_id). ⚠️ GRANTs explicites obligatoires (cf. CLAUDE.md, MIGRATION_TEMPLATE.sql).
- **Pack rayon AUTOMATIQUE** : avec lat/lng en base, une annonce apparaît sur toutes les pages ville dans son rayon, calculé à la volée. Le BDD *débloque* le pack rayon proprement (pas juste de l'ops).
- **Cycle de vie Stripe** : abonnement/listing. Webhook → status (`invoice.paid`→active, `payment_failed`→past_due + dunning auto Stripe, `subscription.deleted`→removed). « Impayé → message + retrait » = relances Stripe natives + webhook + rebuild.
- **Static + fraîcheur** : pages `prerender` lisent `listings where active` au build. Rebuild nightly (cron, muscle conciergerie déjà là) + deploy-hook Vercel sur webhook Stripe → l'impayé disparaît en heures.
- **Onboarding self-serve + IA** : formulaire (URL annonce + champs) → edge function fetch URL → Claude formate au schéma `listings` → géocode (clé Maps existante) → `pending` → paiement Checkout → `active` au rebuild. C'est le wedge « auto-bootstrap config ».
- **Commercial/commission** : lien référral `?ref=code` → attribution `salesperson_id` → table commissions + report payout (Stripe Connect = overkill au début).

**Séquencement (challenge timing)** : la BDD est un build de plusieurs semaines, INUTILE pour valider la willingness-to-pay. Ordre :
1. Prototype (✅ fait, noindex).
2. **Ranker** top 10-15 villes (3-6 mois, le long pôle).
3. **1ers ~15 deals EN MANUEL** : Stripe Payment Link + ajout main à la data. Coût dev ~0. Valide close rate + rétention.
4. **PUIS bâtir la BDD/automation** (une fois rank + payants + rétention prouvés).
5. **ENSUITE seulement** la machine commerciale (l'auto, c'est ce qui la rend scalable — d'où le « avant la machine commerciale » de Marc, juste).
