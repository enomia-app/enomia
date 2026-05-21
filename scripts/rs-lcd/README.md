# Veille communautaire LCD — Facebook automation

Pipeline complet de veille + posting + suivi des conversations sur 8 groupes Facebook LCD, tournant en cron local sur le Mac mini.

## Architecture

```
Cron Mac mini (launchd)
├── com.enomia.fb-daily-scan.plist → quotidien 7h
│     fb-daily-scan.mjs           → lance fb-scan + drafte tout via Claude API
│                                 → écrit fb-drafts.json + envoie email "[FB scan]"
│
├── com.enomia.fb-watch.plist    → toutes les 15 min
│     fb-watch.mjs               → Gmail → parse Marc → posting auto
│       sub-modes :
│       - "FB scan"    → fb-build-validated → fb-post.mjs    (commentaires sur posts)
│       - "FB replies" → fb-build-validated → fb-reply.mjs   (réponses sous commentaires Marc)
│
├── com.enomia.fb-check-replies.plist  → quotidien 9h
│     fb-check-replies.mjs       → check nouvelles réponses aux commentaires Marc
│                                → drafte répliques via Claude
│                                → email "[FB replies] ..."
│
└── com.enomia.fb-monthly-insights.plist → 1er du mois 9h
      fb-monthly-insights.mjs    → analyse questions captées (30j)
                                 → email rapport SEO + features + outils gratuits
```

## Fichiers data

- `data/rs-lcd/fb-scan-candidates.json` — posts captés au dernier scan
- `data/rs-lcd/fb-drafts.json` — mapping postId → {url, text} des propositions du jour
- `data/rs-lcd/fb-validated.json` — sortie de fb-build-validated (commentaires à poster)
- `data/rs-lcd/fb-history.json` — commentaires Marc des 30 derniers jours (purge auto)
- `data/rs-lcd/fb-archive.json` — append-only, toutes les questions + commentaires (long terme)
- `data/rs-lcd/fb-reply-drafts.json` — propositions de réponses aux commentaires Marc
- `data/rs-lcd/fb-reply-validated.json` — réponses validées prêtes à poster

## Prérequis

### 1. Cookies Facebook

Voir section dédiée plus bas. Renouveler ~tous les 90j.

### 2. OAuth Google (Gmail API)

Déjà configuré pour GSC — réutilisé tel quel (scopes `gmail.readonly` + `gmail.send` inclus).

Token : `~/.config/gcloud/enomia-gsc-token.json`

### 3. Clé API Anthropic

À ajouter dans `~/projects/eunomia/.env` :
```
ANTHROPIC_API_KEY=sk-ant-...
```

Coût estimé : ~30 centimes/mois (parse des réponses email Marc + drafts des répliques).

### 4. Activer les cron launchd

```bash
launchctl load ~/Library/LaunchAgents/com.enomia.fb-daily-scan.plist
launchctl load ~/Library/LaunchAgents/com.enomia.fb-watch.plist
launchctl load ~/Library/LaunchAgents/com.enomia.fb-check-replies.plist
launchctl load ~/Library/LaunchAgents/com.enomia.fb-monthly-insights.plist

# Vérifier qu'ils sont chargés
launchctl list | grep enomia
```

Pour désactiver :
```bash
launchctl unload ~/Library/LaunchAgents/com.enomia.fb-watch.plist
```

## Flow utilisateur quotidien (depuis le tel)

1. Tu reçois un email matin "[FB scan] N propositions à valider"
2. Tu réponds à l'email en langage naturel ("ok pour tout sauf 4.1") ou format strict
3. Dans les 15 min, `fb-watch` détecte ta réponse, parse via Claude API, lance le posting
4. Tu reçois un email "[FB scan] Postés — N commentaires" avec les liens FB

Et le jour d'après :
5. À 9h, `fb-check-replies` scanne si quelqu'un t'a répondu sur un commentaire récent
6. Si oui, email "[FB replies] N propositions" avec les répliques draftées
7. Tu valides depuis ton tel → ça poste les répliques

Et chaque 1er du mois :
8. Rapport "[FB insights] YYYY-MM" avec opportunités SEO + features + outils gratuits

## Setup cookies Facebook (une fois)

1. Sur le Mac mini, ouvre Chrome normal, va sur facebook.com, connecte-toi (passe la 2FA)
2. Installe l'extension **Cookie-Editor** : https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm
3. Sur facebook.com, clique l'icône → Export JSON → copie le JSON
4. Sur le Mac mini :
   ```bash
   nano ~/projects/eunomia/scripts/rs-lcd/fb-cookies.json
   ```
   Colle le JSON. Ctrl+O, Ctrl+X.
   ```bash
   chmod 600 ~/projects/eunomia/scripts/rs-lcd/fb-cookies.json
   ```

## Tests manuels

```bash
# Scan FB (depuis cookies)
node scripts/rs-lcd/fb-scan.mjs

# Tester le parser de validation
echo "OK: 1.1, 1.3 / SKIP: 4.2" | node scripts/rs-lcd/fb-build-validated.mjs

# Poster un set validé
node scripts/rs-lcd/fb-post.mjs data/rs-lcd/fb-validated.json

# Test fb-watch (utile pour debug)
node scripts/rs-lcd/fb-watch.mjs

# Test check-replies
node scripts/rs-lcd/fb-check-replies.mjs

# Test analyse mensuelle
node scripts/rs-lcd/fb-monthly-insights.mjs
```

## Logs

- `data/rs-lcd/fb-watch.log` — historique fb-watch
- `data/rs-lcd/fb-watch.stdout.log` + `.stderr.log` — stdout/err launchd
- Idem pour `fb-check-replies` et `fb-monthly-insights`

## Pièges techniques

Voir memory `domains/rs-lcd/project_fb_scan_playwright.md` pour le détail.

Résumé :
- `headless: true` obligatoire (les overlays FB interceptent en non-headless)
- `page.mouse.click()` (events trusted via CDP) au lieu de `.click()` Playwright
- `document.execCommand('insertText')` pour Lexical au lieu de `keyboard.type()`
- Filtrage `offsetParent !== null` pour éviter les composers cachés
- Sélecteurs FR : "Laissez un commentaire" / "Publier le commentaire" / "Répondre"
