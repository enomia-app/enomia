---
name: gsc-indexation-quotidienne
description: "Demander l'indexation Google des top 10 URLs prioritaires (par volume SEMrush) qui sont non-indexées. Lit l'API GSC (index-status.json) + volumes SEMrush, demande indexation via Chrome MCP. Max 10/jour. Triggers — indexation gsc, demander indexation, gsc quotidien"
---

# GSC Indexation Quotidienne — enomia.app

Identifie les top 10 URLs non-indexées **avec le plus gros volume SEMrush**, et demande l'indexation manuelle via Google Search Console (Chrome MCP).

## Fichiers utilisés

| Fichier | Rôle |
|---|---|
| `.claude/gsc-tracking/index-status.json` | Snapshot statut indexation (API GSC) — généré par `node scripts/gsc-fetch-index-status.mjs`. Local, pas dans Git. |
| `.claude/gsc-tracking/urls.json` | **Config** (property, daily_quota, notes). Tracé Git (override gitignore). Lecture seule pour la skill. |
| `.claude/gsc-tracking/state.json` | **État runtime** des demandes (last_run, URLs soumises, anti-doublons 14j). PAS dans Git, écrit par la skill. Créé au 1er run si absent. |
| `scripts/city-backlog.json` + `scripts/city-backlog-extra.json` | Volumes SEMrush conciergerie |
| `scripts/blog-volumes-en-ligne.json` + parser `scripts/publication-order.md` | Volumes blog |
| `scripts/tools-volumes.json` | Volumes pages outils |

**Propriété GSC** : `sc-domain:enomia.app`

## Quota

Config dans `urls.json` → `daily_quota` (actuellement 10). Quota GSC dur : ~10-12/jour par propriété.

## Filtrage par coverage state

L'URL Inspection API retourne un `verdict` + `coverageState`. Filtrer :

| Coverage state | Action |
|---|---|
| `Submitted and indexed` (verdict PASS) | ✅ Déjà indexée — skip |
| `URL is unknown to Google` | ✅ **Demander indexation** (priorité) |
| `Discovered - currently not indexed` | ✅ **Demander indexation** |
| `Crawled - currently not indexed` | ✅ **Demander indexation** |
| `Page with redirect` | ❌ Skip (URL source d'une redirection — normal) |
| `Excluded by 'noindex' tag` | ❌ Skip (intentionnel) |
| `Soft 404` | 🔧 Bug technique à corriger dans le code |
| `Not found (404)` | ❌ Skip (URL cassée) |
| `Duplicate without user-selected canonical` | 🔧 Canonical à ajouter dans le code |

## Process

### 1. Refresh des data si nécessaire

```bash
# Si index-status.json > 24h ou manquant :
node scripts/gsc-fetch-index-status.mjs
```

Sortie : `.claude/gsc-tracking/index-status.json` avec tous les coverage states.

### 2. Calculer top 10 candidates par volume

Pseudo-code :
```js
// Charger toutes les sources
const indexStatus = JSON.parse(fs.readFileSync('.claude/gsc-tracking/index-status.json'));
const concBacklog = [...require('scripts/city-backlog.json'), ...require('scripts/city-backlog-extra.json')];
const blogVols = require('scripts/blog-volumes-en-ligne.json');
const toolsVols = require('scripts/tools-volumes.json');
const config = JSON.parse(fs.readFileSync('.claude/gsc-tracking/urls.json'));
// state.json peut ne pas exister au 1er run — fallback structure vide
const statePath = '.claude/gsc-tracking/state.json';
const state = fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath))
  : { last_run: null, urls: {} };

// Jointure URL → volume
function getVol(url) {
  // conciergerie
  const conc = concBacklog.find(c => `https://www.enomia.app${c.newUrl}` === url);
  if (conc) return conc.vol;
  // blog
  const slugBlog = url.match(/\/blog\/([^/]+)/)?.[1];
  if (slugBlog && blogVols[slugBlog]) return blogVols[slugBlog].vol;
  // tools
  if (toolsVols[url]) return toolsVols[url].vol;
  return 0;
}

// Filtrer + trier
const SKIP_STATES = ['Page with redirect', "Excluded by 'noindex' tag", 'Soft 404', 'Not found (404)', 'Duplicate without user-selected canonical'];
const candidates = Object.entries(indexStatus.byUrl)
  .filter(([url, d]) => d.verdict !== 'PASS')
  .filter(([url, d]) => !SKIP_STATES.includes(d.coverageState))
  .filter(([url]) => {
    const t = state.urls[url];
    if (!t) return true;
    if (t.status === 'indexed') return false;
    if (t.status === 'failed') return false;
    // Skip si demandé < 14 jours
    const days = (Date.now() - new Date(t.last_requested).getTime()) / 86400000;
    return days >= 14;
  })
  .map(([url, d]) => ({ url, coverageState: d.coverageState, vol: getVol(url) }))
  .sort((a, b) => b.vol - a.vol)
  .slice(0, config.daily_quota || 10);
```

### 3. Si `state.last_run` = aujourd'hui → stop

Le job a déjà tourné aujourd'hui. Afficher le résumé du dernier run et sortir.

### 4. Ouvrir GSC via Chrome MCP

1. `mcp__Claude_in_Chrome__tabs_context_mcp` avec `createIfEmpty: true`
2. Naviguer vers : `https://search.google.com/search-console/index?resource_id=sc-domain%3Aenomia.app`
3. Si pas connecté → demander à Marc de se connecter (ne PAS saisir de credentials)

### 5. Demander l'indexation des top 10

Pour chaque URL des candidates :

1. Cliquer dans la barre **"Inspecter n'importe quelle URL"** en haut de GSC
2. Saisir l'URL complète et appuyer sur Entrée
3. Attendre 8-10s que GSC charge l'inspection
4. Si "URL disponible pour Google" → marquer `indexed` dans state.json
5. Sinon, cliquer sur **"DEMANDER UNE INDEXATION"**
6. Attendre ~30s (Google teste l'URL live)
7. Confirmation : message vert "Indexation demandée"
8. Si succès → status `requested`, `last_requested` = aujourd'hui, `request_count++`
9. Si erreur :
   - Quota dépassé → arrêter immédiatement
   - Autre → status `failed`
10. **Fermer le modal** (Escape ou bouton "Masquer") avant la suivante
11. Vérifier que l'URL affichée en haut est bien la nouvelle (pas celle d'avant)

### 6. Mettre à jour le tracking

- `state.last_run` = date du jour (YYYY-MM-DD)
- Sauvegarder `state.json` (PAS `urls.json` — urls.json est config-only, ne jamais l'écrire depuis la skill)

### 7. Rapport final

Output console :
- URLs demandées aujourd'hui (avec volume)
- URLs restantes prioritaires (top 10 suivantes pour info)
- URLs déjà indexées (info)
- Éventuelles erreurs

## Structure des fichiers

### `urls.json` (config, tracé Git)

```json
{
  "property": "sc-domain:enomia.app",
  "property_url": "https://search.google.com/search-console?resource_id=sc-domain%3Aenomia.app",
  "daily_quota": 10,
  "notes": "..."
}
```

### `state.json` (état runtime, PAS dans Git)

```json
{
  "last_run": "2026-05-26",
  "urls": {
    "https://www.enomia.app/conciergerie-airbnb/auvergne-rhone-alpes/lyon": {
      "status": "requested",
      "last_requested": "2026-05-11",
      "request_count": 1,
      "vol_at_request": 880
    }
  }
}
```

**Status possibles** :
- `requested` : indexation demandée, en attente confirmation Google
- `indexed` : confirmée indexée (vérifiée à la prochaine inspection)
- `failed` : autre motif (redirection, noindex, etc.)

## Règles importantes

- **NE PAS** saisir de credentials Google. Si pas connecté, demander à Marc.
- **NE PAS** dépasser `daily_quota` (quota GSC dur : ~10-12/jour).
- **NE PAS** redemander une URL `requested` dans les 14 derniers jours.
- **NE PAS** traiter si `state.last_run` = aujourd'hui.
- **NE PAS** écrire dans `urls.json` (config-only). Toujours écrire dans `state.json`.
- **NE PAS** demander d'indexation pour les coverage states bloquants (voir tableau).
- Si CAPTCHA ou vérification humaine → arrêter et demander à Marc.
- **TOUJOURS fermer le modal** entre deux demandes.

## Workflow recommandé

**Une commande pour tout préparer** :
```bash
npm run gsc:refresh
```
→ fetch index-status + analytics + régénère artefact `.claude/acquisition.html` (visuel pour vérifier les priorités).

**Puis lancer le skill** dans Claude Code :
> "lance gsc-indexation-quotidienne"
