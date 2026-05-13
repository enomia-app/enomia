# Enomia — pour Claude

## Dev

- `npm run dev` → Astro dev server, http://localhost:4321
- `npm run build` → build de prod (lance `fix-keystatic` puis `astro build`)
- `npm run preview` → preview du build

## Audits & maintenance

- `npm run audit:blog-links` — liens internes (lancé en pre-commit auto, blocant)
- `npm run audit:blog-links:fix` — corrige automatiquement les WRONG_PATH
- `npm run audit:external` — vérifie aussi les liens externes (lent, manuel)
- `npm run snapshot` — régénère `.claude/acquisition.html` et l'ouvre
- `npm run snapshot:gen` — régénère sans ouvrir
- `npm run gsc:refresh` — refresh data GSC (index status + analytics + snapshot)
- `npm run test:e2e` — Playwright

## Memory

Le contexte projet (identité Marc, projets, conventions, méthode) vit dans
`~/.claude/projects/-Users-marc-Desktop-eunomia/memory/`.

Index principal : `MEMORY.md`. À consulter selon le domaine de travail
(branches `acquisition/*`, `management/*`, `rs/*`, `prospection/backlinks*`, etc.).

## Scheduled tasks / cloud routines — ⚠️ TOUJOURS depuis Mac mini

Les routines `/schedule` (cloud) **doivent être créées depuis la session Claude
Code du Mac mini**, JAMAIS depuis le MBP.

**Pourquoi** : le MBP est souvent fermé. Les routines créées depuis MBP routent
leurs approvals (permission prompts, input requests) vers la session MBP qui
ne répond pas → routine bloquée pendant des heures, marquée "ignorée".

Le Mac mini est always-on avec `remoteControlAtStartup: true` + push notifs sur
le téléphone de Marc — les routines créées là-bas fonctionnent.

**Procédure** :
1. Ouvrir la remote control web sur le tel ou le MBP :
   `https://claude.ai/code/session_01FEQBNiQxG9F2cNAhEien8g`
2. Dans le chat, utiliser la skill `/schedule` pour créer la routine
3. `/schedule` ne marche **pas** via `claude -p` non-interactif — toujours
   passer par une session interactive (web remote control ou SSH+claude TTY)

**Pour les prompts longs** : préparer le contenu dans un fichier sur le Mac mini
(via SSH/SCP depuis MBP), puis demander à Claude Code Mac mini de lire ce
fichier et de créer la routine avec son contenu.
