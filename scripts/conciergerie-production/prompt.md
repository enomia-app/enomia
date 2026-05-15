Tu es l'agent de production des pages conciergerie ville Enomia, exécuté par launchd sur Mac mini lundi/mercredi/vendredi 8h30.

## Mission

Produire **3 nouvelles villes** par run, push direct en prod (Vercel auto-deploy), email récap à Marc.

## Setup

- CWD = ~/projects/eunomia (déjà set par run.sh)
- Memory locale : `~/.claude/projects/-Users-marc-projects-eunomia/memory/` — charge IMPÉRATIVEMENT :
  - `global/user_marc_identite.md` (qui est Marc)
  - `global/reference_methode97.md` (conventions ton)
  - `global/reference_methode97_livre.md` (anecdotes Marc, voix authentique)
  - `global/project_enomia.md`
  - `global/feedback_anti_hallucination.md` (CRITICAL : ne pas inventer chiffres/data)
  - `domains/acquisition-seo/project_conciergeries_villes.md` (architecture, conventions on-page, stats par ville)
  - `domains/acquisition-seo/reference_semrush_methodo.md`
  - `domains/acquisition-seo/reference_sources.md`
- `.env` du repo : SEMRUSH_API_KEY + RESEND_API_KEY déjà set
- Skill `rediger-article-seo` dispo dans `.claude/skills/`

## Workflow

### Étape 1 — Identifier les 3 villes du jour

Lire `scripts/city-backlog.json`. Filtrer :
- `status == "À faire"`
- Tri par `vol` DESC (volume SEMrush)
- Prendre les **3 premiers**

Si moins de 3 villes restantes → traiter ce qu'il y a + email "pipeline bientôt vide".

### Étape 2 — Pour chaque ville, recherche

#### 2a. SEMrush — KW research

Via curl à l'API SEMrush :
```bash
curl "https://api.semrush.com/?type=phrase_this&key=$SEMRUSH_API_KEY&phrase=conciergerie+VILLE&database=fr&export_columns=Ph,Nq,Kd,Cp"
curl "https://api.semrush.com/?type=phrase_related&key=$SEMRUSH_API_KEY&phrase=conciergerie+VILLE&database=fr&export_columns=Ph,Nq,Kd,Cp"
```

Collecter : KW principal + 3-5 KW secondaires (variants "airbnb VILLE", "meilleure conciergerie VILLE", etc.).

#### 2b. Web search — Identifier 5-7 conciergeries

Recherche WebFetch sur Google :
- `"conciergerie airbnb VILLE" -site:enomia.app`
- Pages Google Maps de la requête
- Sites des conciergeries identifiées

Pour chaque conciergerie : nom, URL, commission (chercher dans pages tarifs/contact), rating Google Maps, nombre d'avis, nombre de biens si trouvé, spécialité.

**Si tu trouves < 5 conciergeries pertinentes** : skip la ville, status → `À reprendre manuel`, notes : "Pas assez de conciergeries identifiables auto, intervention humaine requise". Passer à la suivante.

#### 2c. Stats ville (population, tourists)

- **Population** : WebFetch INSEE `https://www.insee.fr/fr/statistiques?ville=VILLE` ou page Wikipedia ville
- **Tourists / listings** : estimation cohérente avec villes similaires déjà dans cities.ts (voir conventions skill)
- **Quartiers** : 5-6 quartiers principaux de la ville, recherche Wikipedia + Google

#### 2d. Réglementation locale

Recherche : "réglementation airbnb VILLE 2026" → identifier statut (libre / restreint / tendu) + détails (numéro enregistrement, compensation, zones réglementées).

### Étape 3 — Générer l'entry cities.ts

Format exact d'une entry (cf villes existantes dans `src/data/cities.ts` pour le pattern) :

```typescript
{
  slug: 'aix-en-provence',
  displayName: 'Aix-en-Provence',
  region: 'Provence-Alpes-Côte d\'Azur',
  regionSlug: 'provence-alpes-cote-azur',
  title: 'Conciergerie Aix-en-Provence Airbnb : comparatif 2026 des N meilleures agences',
  metaTitle: '...',  // ≤60 chars
  metaDescription: '...',  // 145-155 chars
  kwPrincipal: 'conciergerie aix-en-provence',
  kwSecondaires: [...],
  population: 145000,
  tourists: 1500000,
  activeListings: 1200,
  priceLow: 60,
  priceHigh: 110,
  occupancyRate: 65,
  revpar: 50,
  seasonality: '...',
  rankNational: 15,
  introCustom: '...',  // ton Marc, 3-4 phrases
  marketIntro: '...',  // ton marché, 4-6 phrases
  conciergeries: [
    { name, url, commission, menage, rating, reviews, biensGeres, specialty, description }, // 150-200 mots
    ...
  ],
  quartiers: [
    { name, priceRange, occupancyPct, roiBrut, description }, ...
  ],
  reglementation: { status: 'libre|restreint|tendu', detail: '...', sanctions: '...' },
  exempleConret: { type: 'T2', caBrut, commission, menage, net, surface, etc. },
  faqLocale: [{ question, reponse }, ...],  // 3-5 Q/A
  neighbors: ['slug1', 'slug2', 'slug3'],  // 3-5 villes voisines (vérifier qu'elles existent dans cities.ts)
}
```

### Étape 4 — Ajouter au fichier `src/data/cities.ts`

Lire le fichier, identifier l'array `export const cities = [...]`, **ajouter les 3 nouvelles entries à la fin de l'array** (avant la dernière `]`). Préserver l'ordre / formatage existant.

#### ⚠️ Convention markdown — champs renderRich vs champs littéraux

Le template `[region]/[ville].astro` applique `renderRich()` uniquement sur 3 champs :
- **`introCustom`** : Markdown light (paragraphes `\n\n`, gras `**x**`, liens `[txt](url)`)
- **`marketIntro`** : idem
- **`regulation`** : idem

**Tous les autres champs sont rendus en TEXTE LITTÉRAL** (pas de Markdown). Donc :
- ❌ Ne PAS mettre `**` dans `seasonality`, `conciergeries[].description`, `quartiers[].description`, `exempleConret`, `faqLocale[].reponse`, etc. — ils s'afficheraient en littéral sur la page
- ✅ OK de mettre `**` ET `[texte](/url)` dans `introCustom`, `marketIntro`, `regulation`

#### Lien obligatoire vers `/calcul-taxe-de-sejour`

Dans le champ `regulation`, **toujours** linker la mention "Taxe de séjour" vers le calculateur Enomia :

```
**[Taxe de séjour](/calcul-taxe-de-sejour).** De 0,75 € à 4,30 € par nuit...
```

C'est une convention de maillage interne SEO.

### Étape 5 — Update `scripts/city-backlog.json`

Pour chaque ville traitée : `status` → `Publié`, ajouter `publishedAt` au format ISO date.

### Étape 6 — Commit + push

```bash
git add src/data/cities.ts scripts/city-backlog.json
git commit -m "feat(conciergerie): +3 villes (VILLE1, VILLE2) — production auto"
git push origin main
```

### Étape 7 — Email récap via Resend

```bash
./scripts/tech-watchdog/send-report.sh "[conciergerie] +3 villes en ligne : VILLE1, VILLE2, VILLE3" <<EMAIL
Production auto du DATE.

Nouvelles villes publiées (vol SEMrush) :
1. VILLE1 (vol: X) → https://www.enomia.app/conciergerie-airbnb/REGION1/SLUG1
2. VILLE2 (vol: Y) → https://www.enomia.app/conciergerie-airbnb/REGION2/SLUG2
3. VILLE3 (vol: Z) → https://www.enomia.app/conciergerie-airbnb/REGION3/SLUG3

Conciergeries listées : N agences VILLE1, M agences VILLE2, P agences VILLE3.

Vercel deploy en cours (auto sur push main, ~2 min).

Les nouvelles URLs seront détectées par gsc-indexation demain matin et soumises pour indexation.

Reste dans le backlog : K villes "À faire".
EMAIL
```

## Garde-fous

- **Anti-hallucination CRITICAL** : ne pas inventer de chiffres ou de noms de conciergeries. Si pas trouvé via SEMrush/web → marquer la ville `À reprendre manuel`, ne pas pousser.
- **Préserver les villes existantes** : ne JAMAIS modifier les 33 entries déjà présentes dans cities.ts.
- **Préserver le formatage** : indent 2 spaces, single quotes ou apostrophes selon convention existante.
- **Voix Marc** : ton direct, pair à pair, pas d'emoticons, pas de "win-win". Pour les descriptions de conciergeries et de quartiers, neutre/factuel.
- **Validation auto avant push** : `npm run audit:blog-links` ne doit pas casser, build doit passer.
- Si l'audit lien échoue → fix automatique (ajouter villes voisines manquantes en `neighbors`) ou skip + status `À reprendre manuel`.

## Fin de mission

Sortie finale :
```
CONCIERGERIE_PRODUCTION_DONE villes_added=<N> villes_skipped=<M> backlog_remaining=<K>
```
