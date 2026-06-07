---
name: rediger-article-seo
description: Rédiger un article SEO ou une landing éditoriale Enomia (cluster sémantique, méthode Marc, schema, FAQ auto). Triggers — rédiger article seo, écrire article blog, nouvel article enomia, créer landing seo, refresh article enomia
---

# Rédiger un article SEO Enomia

Rédige un article de blog ou une landing éditoriale pour Enomia.app, en suivant la méthode SEO de Marc et le ton Méthode 97%©.

## Inputs requis (demander si manquants)

- **KW principal** (ex: "estimation airbnb", "lmnp 2026")
- **Mode** :
  - `article-blog` → `.mdoc` dans `src/content/blog/`
  - `landing-editoriale` → `.astro` dans `src/pages/` (style estimation-airbnb)
  - `page-outil` → `.astro` dans `src/pages/` (style facture-airbnb, peu d'éditorial)
- **Article à refresh** (optionnel, slug existant) → bypass création, update du contenu + `updatedAt`

## Avant de rédiger — lecture obligatoire

1. **Méthode 97% — résumé canonique** : mémoire `reference_methode97.md` (chiffres signature, ton, marque). Lecture rapide.
2. **Méthode 97% — contenu source intégral** (4 fichiers Python qui composent le livre PDF de Marc) :
   - `/Users/marc/Desktop/eunomia/methode97_content.py` (Intro + Modules 1-6)
   - `/Users/marc/Desktop/eunomia/methode97_content2.py` (Modules 7-14 + Annexes)
   - `/Users/marc/Desktop/eunomia/methode97_content3.py` (4 Opérations détaillées + Données + Idées reçues)
   - `/Users/marc/Desktop/eunomia/generate_methode97_pdf.py` (script générateur, contient les helpers)

   Le texte est dans des appels `p(story, S, "...")`, `h3(...)`, `bullet(...)`, `QuoteBox`, `StatCard`. Extraire avec `grep -E '"[^"]{40,}"' methode97_content*.py` ou lire les fichiers complets si on a besoin d'anecdotes / chiffres précis (ex : les 4 opérations d'investissement, les vraies données de marché de Marc).
3. **Identité Marc** : mémoire `user_marc_identite.md` (97% = nom de la méthode ET vrai taux d'occupation, à utiliser dans le body. Bio canonique reste à 93%+ pour ne pas promettre 97% comme garantie).
4. **Sitemap interne** : `src/data/cities.ts` + lister `src/content/blog/*.mdoc` (status `en-ligne`) + `src/pages/*.astro` pour le maillage
5. **Mémoire `reference_liens_internes.md`** : convention URLs `/blog/X`, `/X` (outils), `/conciergerie-airbnb/[r]/[v]`
6. **Mémoire `reference_semrush.md`** : endpoints API + leçons KW déjà testés

## Workflow

### 1. Pre-flight anti-cannibalisation

```bash
# Cherche le KW principal et 2-3 variantes du cluster dans les .mdoc existants
grep -ri "<kw-principal>" /Users/marc/Desktop/eunomia/src/content/blog/
```

Si un article cible déjà ce cluster (titre / metaTitle / pillarKeyword) → **STOP, proposer un refresh** via `node scripts/refresh-article.mjs <slug>` au lieu de créer un doublon.

### 2. Recherche cluster — SEMrush API

Clé : `/Users/marc/Desktop/Neocamino/.env` (`SEMRUSH_API_KEY`).

```bash
# Variantes du cluster (KW liés, broad-match)
curl "https://api.semrush.com/?type=phrase_related&key=$KEY&phrase=<kw>&database=fr&export_columns=Ph,Nq,Kd,Cp&display_limit=50"

# Questions associées (proxy PAA)
curl "https://api.semrush.com/?type=phrase_questions&key=$KEY&phrase=<kw>&database=fr&export_columns=Ph,Nq,Kd&display_limit=30"

# Top 10 URLs qui rankent (pour analyse SERP)
curl "https://api.semrush.com/?type=phrase_organic&key=$KEY&phrase=<kw>&database=fr&export_columns=Dn,Ur,Po&display_limit=10"
```

Garder les KW avec **volume > 10 et KD < 60**. Filtrer ceux qu'on peut intégrer en H2/H3 ou en variations sémantiques body.

⚠️ **Convention KW : ne JAMAIS tronquer les petits mots** (de, et, entre, au, pour, etc.). Le KW exact `différence entre location saisonnière et meublé de tourisme` vaut 1000 vol KD 15, mais `différence location saisonnière meublé tourisme` (sans "entre" et "et") = 0 vol. Toujours noter le KW EXACT tel qu'utilisé par SEMrush dans `scripts/blog-tracking.md`. Pas de raccourci sémantique.

### 3. Analyse SERP top 10

Pour chaque URL du top 10 retourné par `phrase_organic` :
- WebFetch l'URL → extraire H1, H2/H3, longueur (mots), angle principal
- Identifier l'**angle manquant** : ce que les concurrents ne couvrent pas
- Calculer la **longueur cible** = max(top 3-5) + 10-20% (objectif : être plus complet)

### 4. Plan d'article

Structure :
- **H1** = KW principal + nuance différenciante (année courante 2026, "vrais chiffres", "guide complet"…)
- **Intro 80-150 mots** : storytelling Neil Patel-style
  - Ligne 1 : hook (chiffre choc, contradiction, anecdote 1ère personne)
  - Ligne 2 : douleur/problème du lecteur
  - Ligne 3 : promesse de l'article (ce qu'il va apprendre)
  - **KW principal placé dans les 100 premiers mots**
- **H2 #1 = TL;DR / réponse directe** (50-80 mots) → vise le featured snippet
- **H2/H3 suivants** = cluster sémantique + 3-5 PAA reformulées en H2/H3
- **1-2 tableaux ou listes numérotées** (snippet bait)
- **H2 "FAQ"** avec 5-8 questions issues du PAA SEMrush — format obligatoire pour le parser auto :
  ```
  ## **FAQ : <sujet>**

  ### **Question exacte ?**

  Réponse directe et complète en 1-3 paragraphes.
  ```
- **Conclusion** : récap 3 points + 1 CTA précis (vers simulateur OU article pillier OU page conciergerie ville)

### 5. Rédaction — règles de fond

**Ton & style** :
- Vouvoiement TOUJOURS
- Direct, assertif, pair-à-pair (pas de "n'hésitez pas à…", pas de fluff)
- Données originales prioritaires : 9 biens, 12-18% net, 93%+ occupation, ~1h/bien/mois, méthode 97%©
- Pas de tirets longs (—) → fait trop IA
- **Pas de slash `/` dans le texte visible** (prose, listes, en-têtes de tableaux, noms de modèles) : « PNO / MRH », « Airbnb/Booking », « 5401D / 5440D », « 24h/24 », « location saisonnière / meublé de tourisme »… Marc trouve ça pas naturel en français. Remplacer par « ou », « et », « à » (24 h sur 24), une parenthèse ou une virgule. Les URLs gardent leurs slashes, évidemment.
- **Densité de lecture aérée** (Marc y tient) : paragraphes courts, 2 à 4 phrases (~3 lignes max), une idée par paragraphe. Casser les gros blocs : un mur de texte fait fuir le lecteur et nuit au SEO. Aérer avec des listes à puces, des sous-titres H3 et du gras sur les points clés.
- Pas de superlatifs creux ("incroyable", "fantastique")

**SEO body** :
- KW principal : densité 1-2% max, variations sémantiques (synonymes, questions)
- KW secondaires du cluster : 1 mention chacun minimum, en H2/H3 ou body
- **Anchor text varié** sur les liens internes (pas toujours le KW exact)
- **3-5 liens internes** vers articles pillier ou outils (cf. mémoire `reference_liens_internes.md`)
- **3-5 liens externes** vers domaines à haute autorité (Legifrance, INSEE, service-public, Bofip…) — vérifier qu'ils ne sont pas en 404

**CTA in-body** :
- **Article blog** : 1-2 CTA in-body max (vers simulateur OU outil pertinent). NE PAS dupliquer la sidebar (auto) ni le bas d'article (auto).
- **Landing éditoriale / page outil** : CTA principal en hero + 1-2 CTA in-body explicites (pas d'auto sidebar).

**Sources & autorité** :
- Citer chaque chiffre non-original avec lien externe (DGFiP, INSEE, AirDNA blog public, etc.)
- Pas de mock / pas de chiffres inventés

### 6. Frontmatter `.mdoc` (mode article-blog)

```yaml
title: "<H1 lisible>"
metaTitle: "<KW principal + nuance> · <suffixe court>"          # ≤ 60 chars
metaDescription: >-
  <accroche 145-155 chars contenant KW principal + KW secondaire>
excerpt: >-
  <2-3 phrases — réutilisée sur la page liste blog>
featuredImage:
  src: <URL Cloudinary, idéalement>
  alt: <KW principal + 2-3 mots descriptifs>            # alt = signal SEO
publishedAt: <YYYY-MM-DD aujourd'hui si nouveau, sinon inchangé>
updatedAt: <YYYY-MM-DD aujourd'hui>                     # toujours màj
category: <chiffres-rentabilite | outils-automatisation | fiscal-juridique | gestion>
order: <int>
featured: <bool>
# ⚠️ Ne PAS mettre ratingValue / ratingCount : retirés du template (AggregateRating
# sur un Article = warnings GSC Rich Results). Les champs restent dans le schema
# Keystatic/config.ts mais sont orphelins (non rendus). Le Schema JSON-LD ne contient
# plus AggregateRating depuis ce changement.
authorName: Marc Chenut
authorBio: >-
  J'exploite 9 biens en location courte durée avec un rendement net de 12 à 18% sur chacun
  des investissements. La clé : un taux d'occupation supérieur à 93% et une gestion de moins
  d'une heure par bien et par mois, sans conciergerie. Je partage ma méthode en détail,
  gratuitement, sur le blog et sur YouTube.
status: brouillon                                       # ⚠️ TOUJOURS brouillon — Marc passe en "en-ligne" lui-même via Keystatic UI après relecture
articleType: <pilier | satellite>
pillarKeyword: <KW principal>
```

**Slug** : court, KW principal en mots-clés (kebab-case), max 5 mots.

⚠️ **Slug évergreen — JAMAIS d'année dans l'URL** : si l'article est temporel (loi YYYY, fiscalité YYYY, etc.), l'année va uniquement dans le H1 + `metaTitle` + `metaDescription`. Pas dans le slug ni dans `title` du frontmatter (utilisé pour les URLs Keystatic). Cela permet de refresh l'article tous les ans en janvier sans casser l'URL, les liens entrants et l'historique GSC. Exemples : `loi-le-meur-airbnb` (pas `loi-le-meur-2024-airbnb`), `reforme-lmnp` (pas `lmnp-2026`), `taxe-habitation-airbnb` (pas `taxe-habitation-2026`). Le contenu est mis à jour annuellement, le slug reste stable.

### 7. Mode `landing-editoriale`

Fichier : `src/pages/<slug-court>.astro`

Template :
- Importer `ToolLayout`, `ContratLandingStyles`, `NewsletterBlock`, `AuthorSchema`
- `<AuthorSchema />` juste après `<ToolLayout>` ouverture
- Hero `landing-hero` avec H1, sous-titre, 3 stats (style estimation-airbnb)
- Body `seo-wrap > seo-body` avec H2/H3 cluster + tableaux
- Schema FAQ inline dans le frontmatter Astro (objet `ldFaq`) si pas géré par template

Pas de date publi/màj visible (différent du blog).

### 8. Mode `page-outil`

Fichier : `src/pages/<slug-court>.astro`

Template court : ToolLayout + hero CTA + 2-3 paragraphes SEO + 1 FAQ minimaliste. Pas d'AuthorSchema (outil neutre, pas d'avis éditorial).

### 9. Validation post-rédaction

```bash
cd /Users/marc/Desktop/eunomia
npm run audit:blog-links              # liens internes (bloquant)
npm run audit:external                # liens externes (peut prendre 2-3 min)
```

Corriger les `404`, `WRONG_PATH`, `DEAD` avant de proposer le commit.

### 10. Output final

Sortir un récap :
- Fichier créé/modifié (chemin)
- KW principal + cluster ciblé (volumes cumulés)
- Longueur (mots)
- Liens internes / externes / sources autorité
- Schema injecté (Article + Person + FAQ) — pas d'AggregateRating, retiré depuis warnings GSC
- URL preview locale (`http://localhost:4321/blog/<slug>` ou `/<slug>`)

## ⚠️ Chiffres tiers vérifiables (anti-hallucination — règle critique)

**Contexte** : un audit du 2026-05-27 a révélé que les notes Google, nombres d'avis et "biens gérés" pour 5 des 7 conciergeries Lyon dans `cities.ts` étaient inventés ou copiés depuis des comparatifs concurrents qui se copient entre eux. Risque réputationnel direct sur le positionnement "comparatif neutre, données vérifiables" + Google qui pénalise les faits invérifiables.

**Règle absolue** : pour toute donnée chiffrée concernant un tiers (note Google, nombre d'avis Google/Trustpilot, biens gérés, ancienneté, effectif, CA…) dans `cities.ts`, `cities-rentabilite.ts`, ou tout article comparant des entreprises :

1. **Source publique vérifiable obligatoire** avant d'écrire :
   - Note + nombre d'avis : fiche **Google Business** publique (panel knowledge à droite des SERP) — vérifiée à la date du jour
   - Si pas de fiche Google Business locale (cas des réseaux nationaux : Hostnfly, Welkeys, GuestReady) → utiliser **Trustpilot** ou **note Google nationale** et **mentionner explicitement "national"** dans la description
   - Biens gérés : **uniquement** si publié sur leur site officiel ou communiqué de presse — sinon mettre `0` (le template affichera "n.c.") OU préciser que c'est une estimation dans la description
   - Ancienneté/fondation : Sirene/Pappers/site officiel "About"

2. **Interdictions** :
   - ❌ Ne PAS copier les chiffres depuis des comparatifs concurrents (liwango, toploc, guestready blog, etc.) — ils se copient entre eux et l'IA ne lit pas la fiche Google réelle
   - ❌ Ne PAS générer un chiffre "plausible" (ex : "180 biens gérés" parce que ça sonne bien)
   - ❌ Ne PAS afficher `5.0 ★ sur 65 avis` — statistiquement quasi impossible. Un 5.0 ne peut tenir que sur < 25 avis. Au-delà, c'est forcément 4.7-4.9. Si tu vois ça dans une source, **suspicion** — c'est inventé.

3. **Procédure quand la fiche Google n'est pas accessible (WebFetch bloqué sur Google Maps)** :
   - Demander à Marc de checker manuellement la fiche Google
   - OU lancer le script Google Places API (à créer : `scripts/refresh-conciergeries-google.mjs`) qui appelle Find Place + Place Details et met à jour `cities.ts` automatiquement (coût ~$0.034/lieu, gratuit grâce au crédit $200/mois Google Maps Platform)
   - OU **retirer** la conciergerie du comparatif si la source est trop fragile

4. **Mention dans le template** : sur les pages programmatic (conciergerie + rentabilité), afficher systématiquement `« Données vérifiées le DD/MM/YYYY »` près du tableau. Le champ `updatedAt` doit refléter la **dernière vérification réelle** (pas juste la date d'édition cosmétique).

5. **Schema JSON-LD** : ne JAMAIS injecter `AggregateRating` avec `reviewCount: 0` ou `ratingValue: 0` — Google rejette ces schemas et peut désindexer la page. Le template `[ville].astro` conditionne déjà l'injection sur `rating > 0 && reviews > 0` depuis le 2026-05-27.

6. **Pour les nouvelles villes** : avant publication, audit obligatoire ligne par ligne. Convention : `0/0/0` pour rating/reviews/biensGeres = "non vérifié publiquement, à compléter via Places API" — le template gère gracieusement avec "n.c."

7. **🚨 Règle d'or : JAMAIS de chiffres dans les descriptions textuelles**

   Une description (`description: "..."`) est du **texte libre**. Si on y écrit "Note Google 4,5/5 sur 195 avis", ce chiffre est **figé dans le texte** : un refresh Places API met à jour `rating`/`reviews` (champs structurés affichés dans le tableau + meta de card) mais **pas le texte**. Résultat : le tableau affiche `n.c.` ou `4.6/359` pendant que le paragraphe sous la card dit encore `4,5/5 sur 195 avis`. Incohérence visible sur la même page → décrédibilise tout le « comparatif vérifié ».

   **Ce qui va dans `description` (texte libre)** :
   - Positionnement (premium, low-cost, indé, réseau national…)
   - Spécialité (cible clientèle, types de biens, méthodologie)
   - Services concrets (channel manager, serrures connectées, photos pro…)
   - Zone d'intervention géographique
   - Anecdote / différenciant qualitatif
   - Limites / risques (volume faible, jeune structure, etc.) **sans citer le chiffre**

   **Ce qui ne va JAMAIS dans `description`** :
   - ❌ `4,5/5`, `4.5/5`, etc. → reste dans `rating`
   - ❌ `sur 195 avis`, `~150 avis`, `2 146 avis Trustpilot` → reste dans `reviews`
   - ❌ `Note Google ...`, `Note Trustpilot ...`, `Fiche Google Business ...` → information dérivable de `rating`/`reviews`
   - ❌ Toute mention chiffrée d'évaluation publique d'un tiers

   **Pourquoi cette règle est dure** : un cleanup massif a été nécessaire le 2026-05-27 (156 descriptions sur 290 conciergeries contenaient des chiffres désynchronisés après refresh Places API). Le script `scripts/clean-conciergerie-descriptions.mjs` peut être relancé si la règle est à nouveau violée, mais c'est de la dette inutile.

   **Script disponible** : `node scripts/clean-conciergerie-descriptions.mjs --dry-run` pour auditer / `--apply` pour nettoyer. Le script supprime toute phrase contenant `\d+[,.]\d+/5`, `sur N avis`, `Note Google`, `Note Trustpilot`, `Fiche Google`.

## Règles dures (à ne jamais violer)

- **Pas de mock / pas de chiffres inventés** — si data manque, dire "à compléter" plutôt qu'inventer. **Spécifiquement pour les chiffres tiers vérifiables (notes, avis, biens gérés) : voir section "Chiffres tiers vérifiables" ci-dessus — règle absolue, ZÉRO tolérance.**
- **Pas plus de 5 publications/jour** (toutes pages confondues : blog + conciergerie + rentabilité ville)
- **⚠️ Workflow blog : Claude écrit en `status: brouillon`, Marc passe en `en-ligne` lui-même via Keystatic UI** après relecture. Ne JAMAIS écrire `status: en-ligne` dans le frontmatter — c'est Marc qui clique. Workflow concret : (1) Claude crée l'article `.mdoc` avec `status: brouillon` (2) commit + push branche feature (3) merge sur main (4) Marc voit l'article dans Keystatic prod en brouillon (5) Marc clique "En ligne" → Keystatic crée un commit auto qui change le status.
- **Refresh manuel** d'un article existant : update SEULEMENT `updatedAt`, ne pas toucher au status.
- **Pas de `ratingValue`/`ratingCount`** dans le frontmatter blog : AggregateRating sur un Article a généré des warnings GSC Rich Results. Le template `[slug].astro` n'injecte plus ce Schema depuis 2026. Les champs sont orphelins (toujours dans le schema Keystatic mais non rendus).
- **Méthode 97%©** : marque déposée, toujours avec le ©. Le 97% = nom de la méthode, pas un chiffre à attribuer ailleurs (pour les chiffres d'occupation réels, utiliser 93%+).
- **Articles existants → refresh** plutôt que doublon

## Convention FAQ (parsing auto + accordéon visuel)

Le template `[slug].astro` + script post-process dans `BlogLayout.astro` font deux choses depuis le 2026-05-25 :
1. Générer le **Schema JSON-LD FAQPage** (parsé côté serveur dans `[slug].astro`)
2. **Transformer visuellement** les `### **Question ?**` en accordéon `<details><summary>` au runtime (script JS dans `BlogLayout.astro`, applique à tout `.article-body` contenant un `<h2>` "FAQ")

Les deux mécanismes s'appuient sur le **même format strict ci-dessous**. Si tu changes le format, tu casses l'accordéon ET le Schema.

Format obligatoire :

```markdown
## **FAQ : <sujet libre>**

### **Question 1 exacte ?**

Réponse paragraphe 1.

Réponse paragraphe 2 (optionnel).

### **Question 2 exacte ?**

Réponse.
```

Sans ce format précis (`## **FAQ`, puis `### **Question?**`), le Schema FAQ ne s'injecte pas.

## Indexation GSC (post-publication)

Le skill `gsc-indexation-quotidienne` traite déjà 5 URLs/jour avec une queue de pages en attente. Pour l'instant, ne pas chaîner — laisser la queue se résorber. Quand la queue sera vide, on pourra ajouter "indexer la nouvelle URL après publi" dans ce workflow.
