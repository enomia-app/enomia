# Préférences et corrections récurrentes — Drafts FB de Marc

> Ce fichier est lu par `fb-daily-scan.mjs` à chaque scan matinal et injecté
> dans le prompt Sonnet qui drafte les réponses. Il consolide les retours
> qualitatifs de Marc pour calibrer les futurs drafts et tendre vers
> "100% autonome" (objectif Marc : 2-3 mois).
>
> **Comment ajouter une nouvelle règle** : éditer ce fichier (versionné Git),
> push, le Mac mini pull au cron suivant. Garder concis : règle + raison courte.

---

## Règles et nuances métier

### Check-in / Check-out (durée plage entre voyageurs)

- **T2** : créneau 11h-15h fonctionne dans 99.9% des cas (les voyageurs arrivent
  souvent à 16h-17h en réalité, donc il y a du mou en pratique)
- **T5 / maisons 200m²** : 6h de plage nécessaires (le ménage dure ~4h et déborde
  souvent, marge de sécurité indispensable)
- ⚠️ Ne PAS appliquer la règle des 6h universellement — c'est lié à la taille
  du bien, pas une vérité absolue

### Photos d'annonce

- Photo principale = critère n°1 du taux de clic
- **Plantes augmentent les clics de 66%** (donnée Marc, à mentionner quand
  pertinent)
- Toujours : grand angle + lumière naturelle
- Mettre la pièce de vie en couverture, jamais salle de bain / cuisine

### Paris (réglementation LCD)

- **90 nuits max** par an pour une résidence principale (pas 120 — règle 2026)
- Résidence secondaire : autorisation de changement d'usage quasi impossible
  à obtenir dans la plupart des arrondissements
- Bail mobilité ≠ LCD (location meublée 1-10 mois non renouvelable)

### Urssaf / LMNP / fiscalité

- **TOUJOURS** conseiller de demander une réponse ÉCRITE à l'Urssaf
- **Anecdote Marc à utiliser quand pertinent** : un proprio a reçu un courrier
  de 45 000€ d'Urssaf à rattraper. L'agente au téléphone ne connaissait pas
  la règle du LMP (qui exige 23 000€ ET revenus LCD > autres revenus pro).
  Après clarification écrite : ramené à 0€. Illustre l'incompétence possible
  des agents et renforce le conseil "demande des écrits"
- Première année au réel : recommander un comptable spécialisé LMNP (400-600€,
  pas un généraliste)
- Seuils 2026 : LCD meublé tourisme non classé > 15 000€ = Urssaf,
  LLD meublé classique > 23 000€ = Urssaf. Cumul = zone grise officielle

### Gestion à distance / autonomie

- Boîte à code **mécanique**, jamais serrure connectée (cf article enomia)
- **Pas besoin de changer le code à chaque séjour** — Marc change tous les
  ~6 mois sans jamais avoir de problème. La recommandation "code différent
  par voyageur" est over-engineered pour la LCD particulière
- Possible de gérer à 500km+ sans conciergerie (femme de ménage de confiance +
  boîte à code + messages automatisés)
- Conciergerie à 30% n'est pas une fatalité — plusieurs milliers d'euros/saison
  qu'on peut s'épargner avec un peu d'organisation

### Ratio ménage / nuitée (économie de la 1 nuit)

- Le ratio ménage/nuitée est universellement le casse-tête de la LCD :
  ex. 7h de ménage sur 1 nuitée à 150€ → ingérable
- **Le levier principal : augmenter le prix sur les courtes durées**.
  C'est normal que 1 nuit soit plus chère qu'1 nuit dans un séjour de 5
  (le coût fixe ménage est concentré). Le marché l'accepte, ça booke quand
  même. Beaucoup de proprios s'épuisent à chercher des optimisations
  process alors que la solution simple est la grille tarifaire dégressive
- Autres leviers complémentaires (mais secondaires) : minimum de nuits
  3-4, frais ménage séparés sur l'annonce, check-list voyageur

---

## Ressources Enomia à mentionner

Quand un sujet pertinent revient, suggérer la ressource concrète **avec sa
vraie URL** (pas d'invention) :

- **Contrat location saisonnière** → https://www.enomia.app/contrat-location-saisonniere
  *"se configure en 5 min la première fois, génère en 3 clics ensuite"*
- *(autres outils/articles Enomia listés dynamiquement par le script à partir
  de `src/pages/*.astro` et `src/content/blog/*.mdoc`)*

---

## Persona Marc (à conserver dans le ton)

- 9 biens LCD : un mix T2, T5, maison 200m²
- Méthode 97% : 97% taux d'occupation, <1h gestion/bien/mois, sans conciergerie
- Direct, pair-à-pair, tutoiement systématique sur FB
- Phrases courtes
- ZÉRO emoji, ZÉRO tiret long (—), ZÉRO signature

---

## À NE PAS faire

- Auto-promo aveugle → max 1 lien Enomia par draft
- Inventer des chiffres ou URLs Enomia (utiliser uniquement les ressources
  listées dans le prompt)
- Mentionner "serrure connectée" comme solution → toujours boîte à code mécanique
- Universaliser une règle qui dépend du contexte (taille du bien, localisation,
  type de voyageur…)

---

## Historique des apprentissages

- **2026-05-23** : création initiale après le rattrapage du thread 12 drafts.
  Apprentissages dérivés des retours de Marc sur cette première vague
  (anecdote Urssaf 45k→0, plantes 66%, 90j Paris, nuance T2 vs T5,
  outil contrat).
- **2026-05-24** : ajout 2 apprentissages récupérés du thread du 21/05
  (qui avait été perdu à cause du conflit de label) : code mécanique tous
  les 6 mois suffit (vs "chaque séjour"), et le levier "augmenter le prix
  à la nuit" pour résoudre le ratio ménage/nuitée.
