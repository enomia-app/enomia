# Enomia

Plateforme d'outils pour la location courte duree (LCD) : simulateur de rentabilite, generateur de contrats, facturation, et blog SEO.

**Site :** https://www.enomia.app

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Framework | Astro 5 (SSR) + React 19 |
| Hebergement | Vercel (serverless functions) |
| Base de donnees | Supabase (PostgreSQL + Auth + Storage) |
| CMS | Keystatic (stockage GitHub) |
| Email | Resend |
| Newsletter | Beehiiv |

## Installation

```bash
# 1. Cloner le repo
git clone https://github.com/enomia-app/enomia.git
cd enomia

# 2. Installer les dependances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Remplir les valeurs dans .env (voir le dashboard Supabase, Resend, Beehiiv)

# 4. Lancer en local
npm run dev
# Le site est accessible sur http://localhost:4321
```

## Structure du projet

```
api/                  # Endpoints serverless Vercel (auth, contrats, factures, etc.)
  _lib/auth.js        # Verification JWT Supabase
src/
  components/         # Composants Astro (Header, outils, newsletter)
  content/blog/       # Articles de blog (format Markdoc, geres par Keystatic)
  pages/              # Pages du site (blog, contrats, factures, simulateur)
  data/               # Donnees statiques (villes)
public/
  contrat-tool.js     # Outil contrat (vanilla JS, cote client)
  simulateur-rentabilite-airbnb/  # Simulateur standalone
scripts/
  daily-freshness.mjs # Script CI : mise a jour quotidienne des articles
  fix-keystatic.mjs   # Patch Keystatic (corrige des bugs OAuth)
```

## Fonctionnalites

- **Blog SEO** : 46+ articles sur la location courte duree (Keystatic + Markdoc)
- **Simulateur de rentabilite** : calcul ROI pour investissement Airbnb
- **Generateur de contrats** : contrats de location personnalises (export PDF)
- **Facturation LCD** : generation de factures avec numerotation automatique
- **Authentification** : magic link via Supabase Auth + Resend

## Deploiement

Le deploiement est automatique via Vercel :
- Chaque push sur `main` declenche un deploy en production
- Un GitHub Action quotidien met a jour la fraicheur des articles

## Variables d'environnement

Voir `.env.example` pour la liste complete des variables necessaires.
