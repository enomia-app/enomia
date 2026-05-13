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
