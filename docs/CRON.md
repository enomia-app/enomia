# Cron Enomia — source unique de vérité

Inventaire **complet** de toutes les automatisations Enomia, sur les 4 environnements :
- 🖥️ **launchd Mac mini** (always-on, fait le gros du travail)
- 🖥️ **launchd MBP** (uniquement `git-pull` pour rester sync)
- ⚙️ **GitHub Actions** (workflows cloud GitHub)
- ☁️ **Cloud routines Anthropic** (`/schedule`)

Les plists launchd sources sont versionnés dans `scripts/`, les copies actives sont dans `~/Library/LaunchAgents/` de chaque machine.

**Convention** : à chaque création / modification / suppression d'une automatisation, **mettre à jour ce fichier** (commit + push). C'est la source unique de vérité.

## Vue d'ensemble

| Agent | Fréquence | Rôle | Statut |
|-------|-----------|------|--------|
| `app.enomia.git-pull` | toutes les 5 min | Garde le repo Mac mini à jour avec GitHub | actif |
| `com.enomia.fb-daily-scan` | 7h17 quotidien | Scan FB matinal + drafte commentaires + email | actif |
| `app.enomia.gsc-indexation` | 9h18 quotidien | Wrapper `claude -p` qui lance la skill `gsc-indexation-quotidienne` (refresh GSC API + soumissions Chrome MCP top 10 URLs prioritaires par volume SEMrush) | actif |
| `app.enomia.tech-watchdog` | 8h11 quotidien | Watchdog santé technique du site | actif |
| `app.enomia.conciergerie-production` | Lun/Mer/Ven 8h37 | Cycle de production landing conciergerie | actif |
| `app.enomia.backlinks-track-replies-v2` | Lun-Ven 10h31 | Pipeline v2 : tracking réponses + bounces + relances auto J+5/J+10/J+15 (10h31 = 14 min après send-daily 10h17 → chope les hard bounces immédiats du jour) | actif |
| `com.enomia.fb-check-replies` | 9h23 quotidien | Check réponses sous commentaires FB Marc | actif |
| `com.enomia.fb-weekly-recap` | Ven 17h00 | Récap hebdo volume + liens Enomia partagés + (phase 2 : GA4 perfs par utm_content) | actif |
| `com.enomia.fb-monthly-insights` | 1er du mois 9h31 | Rapport mensuel opportunités SEO + features | actif |
| `app.enomia.backlinks-source-monthly` | 1er du mois 9h47 | Pipeline v2 : sourcing SEMrush 75 KW, filtres, check outil concurrent, output `data/backlinks-YYYY-MM.json` | actif |
| `app.enomia.backlinks-send-daily` | Lun-Ven 10h17 | Pipeline v2 : envoi auto via Gmail API, ramp-up 5→30/j sur 8 sem (BCC Marc J1-5 puis 1/5 jours aléatoire) | actif |
| `app.enomia.backlinks-report-monthly` | 1er du mois 10h53 | Pipeline v2 : récap mensuel envois/réponses/backlinks par outil | actif |
| `app.enomia.backlinks-report-quarterly` | 1er jan/avr/juil/oct 11h17 | Pipeline v2 : récap trimestriel | actif |
| `app.enomia.backlinks-report-yearly` | 1er janvier 11h43 | Pipeline v2 : récap annuel | actif |
| `app.enomia.backlinks-report-weekly` | Dim 18h43 | Pipeline v2 : récap hebdo envois/réponses/backlinks/pipeline | actif |
| `com.enomia.fb-watch` | xh07, xh22, xh37, xh52 (4×/h) | Détecte réponses email Marc et poste sur FB | actif |
| `app.enomia.conciergerie-refresh` | 3 du mois 6h13 | Refresh mensuel notes Google conciergeries + bump date « MAJ » des pages, commit/push main (déterministe, **pas de `claude -p`** → 0 coût LLM) | **à installer** (après merge sur main) |

**Note horaires** : tous les jobs qui appellent l'API Anthropic sont volontairement décalés sur des minutes "improbables" (pas :00 :15 :30 :45) pour éviter les pics d'overload (HTTP 529) sur les heures rondes — où plein d'autres cron tapent l'API simultanément. Chaque job a une minute distincte des autres dans la même heure.

---

## Pipeline FB scan / posting

4 agents qui forment une chaîne complète d'engagement communautaire.

### `com.enomia.fb-daily-scan` — 7h17
**Script** : `scripts/rs-lcd/fb-daily-scan.mjs`
**Fait** :
1. Lance `fb-scan.mjs` qui scrape les 8 groupes Facebook LCD via Playwright headless
2. Récupère ~25-30 posts captés
3. Appelle l'API Claude (sonnet) pour filtrer les pertinents et drafter une réponse Marc pour chacun
4. Décide quels drafts incluent un lien Enomia (~1 lien sur 6-10)
5. Envoie l'email **"[FB scan] N propositions à valider"** à `marc@enomia.app`

**Logs** : `data/rs-lcd/fb-daily-scan.stdout.log`
**Coût Claude API** : ~5c par run

### `com.enomia.fb-watch` — xh07, xh22, xh37, xh52 (4×/h)
**Script** : `scripts/rs-lcd/fb-watch.mjs`
**Fait** :
1. Cherche dans Gmail les threads "[FB scan]" ou "[FB replies]" avec réponse Marc, non labelisés `fb-scan-traité`
2. Parse la réponse Marc en langage naturel via API Claude (haiku) → format strict OK/SKIP/EDIT
3. Pipe vers `fb-build-validated.mjs` puis `fb-post.mjs` (ou `fb-reply.mjs`)
4. Labélise le thread Gmail comme traité
5. Envoie email confirmation **"[FB scan] Postés"** avec liens FB des commentaires

**Anti-race** : lock file `/tmp/fb-post-running.lock` (60 min max).
**Logs** : `data/rs-lcd/fb-watch.log` + `.stdout.log` + `.stderr.log`
**Coût** : ~1c par parse

### `com.enomia.fb-check-replies` — 9h23
**Script** : `scripts/rs-lcd/fb-check-replies.mjs`
**Fait** :
1. Lit `data/rs-lcd/fb-history.json` (commentaires Marc des 30 derniers jours)
2. Pour chaque entrée : Playwright navigue, trouve le commentaire Marc dans la page, lit les sous-réponses
3. Détecte les NOUVELLES réponses (compare avec état précédent stocké)
4. Drafte des répliques Marc via API Claude
5. Envoie email **"[FB replies] N propositions"**

**Logs** : `data/rs-lcd/fb-check-replies.stdout.log`

### `com.enomia.fb-monthly-insights` — 1er du mois 9h31
**Script** : `scripts/rs-lcd/fb-monthly-insights.mjs`
**Fait** : analyse mensuelle de `fb-archive.json` (questions captées) cross-référencée avec articles + outils existants → rapport email avec 3 sections (articles à créer, features à imaginer, outils gratuits lead gen).

---

## Autres agents Enomia

### `app.enomia.git-pull` — toutes les 5 min
**Script** : `scripts/git-pull-eunomia.sh`
Garde la copie locale du repo synchronisée avec GitHub. Évite que le Mac mini parte en désync.

### `app.enomia.gsc-indexation` — 9h18 quotidien (réactivé 2026-05-24)
**Script** : `scripts/gsc-indexation-claude/run.sh`
**Fait** : Wrapper bash qui lance `claude -p` avec la skill `gsc-indexation-quotidienne`. La skill : refresh `index-status.json` via URL Inspection API si > 24h, compute top 10 candidates par volume SEMrush (avec anti-doublon 14j via `urls.json`), soumissions via Chrome MCP. Envoie un email récap à `marc@enomia.app` via Resend (`scripts/tech-watchdog/send-report.sh`).
**Historique** :
- 2026-05-21 → 2026-05-23 : version Playwright autonome (cron 7h03). Abandonnée — soumissions instables (CAPTCHA, détection automation, bouton introuvable).
- 2026-05-23 : `launchctl unload` manuel, délégué à la cloud routine Anthropic `gsc-indexation-quotidienne` (À distance, 9h18). `be22df9` documentait ce switch dans CRON.md (le `unload` lui-même était hors commit).
- 2026-05-24 matin : cloud routine `trig_018a5hNKznSvgCQLo4zVFFpU` auto-désactivée (`auto_disabled_env_not_found` — env bridge périmé après reboot session `--remote-control`).
- 2026-05-24 après-midi : launchd rechargé avec un nouveau wrapper `gsc-indexation-claude/run.sh` qui appelle la skill via `claude -p` (au lieu du pipeline Playwright). État stable. Cloud routine reste désactivée (non supprimable via API, à supprimer manuellement sur https://claude.ai/code/routines).
**Logs** : `scripts/gsc-indexation-claude/logs/run-YYYY-MM-DD.log` + email Resend journalier.
**Quota** : 10 URLs/jour configuré dans `.claude/gsc-tracking/urls.json` (`daily_quota`). Chrome doit être ouvert avec l'extension Claude in Chrome active à 9h18.

### `app.enomia.tech-watchdog` — 8h11 quotidien
**Script** : `scripts/tech-watchdog/run.sh`
Surveillance technique du site (probable : check 200/500 sur URLs critiques, certif SSL, etc.). Envoie un email si problème via Resend.

## Pipeline backlinks v2 (2026-05-23)

Pipeline refactoré : envoi auto sans validation Marc, 3 outils prioritaires (simulateur, contrat, facture), data dans `data/backlinks-YYYY-MM.json` (gitignored). Templates dans la memory `domains/prospection-backlinks/reference_pitches_templates.md`.

### `app.enomia.backlinks-source-monthly` — 1er du mois 9h47
**Script** : `scripts/backlinks-source-monthly/run.sh`
**Code** : `source-monthly.mjs` + `filters.mjs` + `send-recap-mail.mjs`
**KW list** : `scripts/backlinks-source-monthly/kw-list.json` (25 KW × 3 outils = 75 KW)
**Fait** :
1. Pour chaque outil (simulateur/contrat/facture), query SEMrush `phrase_organic` sur 25 KW, top 30 SERP par KW
2. Dedup par domaine, filter blacklist (~60 domaines : concurrents, presse nationale, sociaux, sites gouv, comparateurs grand public)
3. Pour chaque candidat survivant, visit la page cible et check si outil concurrent présent (regex sur HTML : "simulateur de rentabilité", "modèle de contrat", "générateur de facture", etc.)
4. Si pas de concurrent : tente d'extraire email (`mailto:`) ou url_formulaire (`/contact`)
5. Output `data/backlinks-YYYY-MM.json` (append si déjà existant)
6. Envoie mail récap à Marc avec bilan : domaines uniques, qualifiés, top 10 par trafic

**Logs** : `scripts/backlinks-source-monthly/logs/run-YYYY-MM-DD.log`
**Coût SEMrush** : ~750 units / run mensuel (négligeable sur quota Neocamino)

### `app.enomia.backlinks-send-daily` — Lun-Ven 10h17
**Script** : `scripts/backlinks-send-daily/run.sh`
**Code** : `send-daily.mjs` + `pitch-templates.mjs` + `bcc-state.mjs`
**Fait** :
1. Charge backlog mois courant + précédent (`data/backlinks-*.json`)
2. Calcule le `dailyMax` via ramp-up basé sur `first_send_date` : sem 0 = **5/j**, sem 1 = 8, sem 2 = 12, sem 3 = 15, sem 4-5 = 20, sem 6-7 = 25, sem 8+ = 30. Override possible via `--max=N`.
3. Pick `dailyMax` prospects en `status: pending` (priorité = trafic SERP desc, rank asc)
4. Pour chaque : retry extract contact si manquant, scan page cible, call Claude Haiku pour générer 1 phrase d'observation contextuelle
5. Construit le pitch via template (1 des 3, selon `outil_cible`), QA auto (longueur 80-350 mots, URL outil présente, pas de placeholder/emoji/tiret cadratin/flèche)
6. Si email → envoi auto via Gmail API (BCC marc@enomia.app J1-J5 + 1 jour aléatoire tous les 5 jours après — état dans `data/backlinks-send-state.json`)
7. Si formulaire only → ajoute à la liste manuelle du mail récap
8. Update backlog statuses (`sent`, `manual_form`, `no_contact`, `qa_fail`, `send_fail`)
9. Envoie mail récap quotidien à Marc avec : envoyés par email, formulaires à faire manuellement (avec lien + pitch intégral), skippés

**État local** : `data/backlinks-send-state.json` (audit BCC)
**Logs** : `scripts/backlinks-send-daily/logs/run-YYYY-MM-DD.log`
**Coût Claude Haiku** : ~$0.10/mois en plateau (15-30 prospects × 22 jours × ~$0.0003/call) via `fetch` direct (pas `claude -p`, donc pas d'OAuth Max).
**Throttle** : 10s entre 2 envois Gmail (anti-spam)

### `app.enomia.backlinks-track-replies-v2` — Lun-Ven 10h31
**Script** : `scripts/backlinks-track-replies-v2/run.sh`
**Code** : `track-replies.mjs`
**Fait** :
1. Charge backlog, filter prospects avec `status ∈ {sent, relance_1, relance_2}` + email
2. Pour chaque : query Gmail pour réponses depuis `date_envoi` ou `date_relance_X`
3. Si réponse : classifie via Haiku (positive / negative / neutre / spam), update status + `date_reponse` + `gmail_reply_id`
4. Si pas de réponse :
   - J+5 → envoi relance T2 (court, neutre), `status=relance_1`
   - J+10 → envoi relance T3 (proposition visio), `status=relance_2`
   - J+15 → `status=pas_de_reponse` (silencieux)
5. Si actions : envoie mail récap à Marc avec lien direct vers thread Gmail pour les positives

**Logs** : `scripts/backlinks-track-replies-v2/logs/run-YYYY-MM-DD.log`
**Coût Claude Haiku** : faible (~5c/run quand replies à classifier)

### Rapports — script unique `scripts/backlinks-reports/reports.mjs`

Le script accepte `--period={week|month|quarter|year}` et envoie un mail récap à Marc avec : envois (par outil), relances, réponses (positive/negative/neutre/spam), backlinks obtenus, taux de conv, pipeline restant, formulaires à faire.

| Plist | Cron | Période |
|---|---|---|
| `app.enomia.backlinks-report-weekly` | Dim 18h43 | week (7 derniers jours) |
| `app.enomia.backlinks-report-monthly` | 1er du mois 10h53 | month (mois en cours) |
| `app.enomia.backlinks-report-quarterly` | 1er jan/avr/juil/oct 11h17 | quarter |
| `app.enomia.backlinks-report-yearly` | 1er janvier 11h43 | year |

**Logs** : `scripts/backlinks-reports/logs/run-{period}-YYYY-MM-DD.log`

### Notes pipeline v2

- **Pas de CRM intermédiaire** : tout vit dans `data/backlinks-YYYY-MM.json` (gitignored). Un fichier par mois, recyclage automatique du reliquat non-contacté.
- **Pas de validation Marc** par défaut : envoi auto. Sauf BCC les 5 premiers jours + 1 jour aléatoire tous les 5 jours pour spot-check.
- **Volume cible** : 15/jour ouvré × 22 jours = 330 envois/mois. À 3% conv réaliste = ~10 backlinks/mois. Phase 2 (mois 3+) : scale à 30/jour si délivrabilité OK.
- **Monitoring spam** : Google Postmaster Tools (à activer sur enomia.app) + watch bounces dans track-replies.
- **DMARC** : actuellement `p=none`. Roadmap upgrade dans memory `domains/prospection-backlinks/reference_dmarc_upgrade.md`.

### `app.enomia.conciergerie-production` — Lun/Mer/Ven 8h37
**Script** : `scripts/conciergerie-production/run.sh`
Cycle de production des landings/articles de conciergerie (3 fois par semaine).

---

## 🖥️ launchd MBP

### `app.enomia.git-pull` (MBP)
- **Plist** : `~/Library/LaunchAgents/app.enomia.git-pull.plist`
- **Script** : `~/Desktop/eunomia/scripts/git-pull-eunomia.sh`
- **Cron** : toutes les heures + `RunAtLoad true` (donc fire au login/wake)
- **Fait** : `git pull origin main` sur `~/Desktop/eunomia` pour rester sync avec Mac mini/GitHub
- **Note** : sur MBP fermé, le launchd se met en pause → redémarre à l'ouverture
- **Log** : `~/Desktop/eunomia/.git/last-pull.log`

C'est le **seul** launchd actif sur MBP. Tout le reste tourne sur le Mac mini. Le MBP est le bureau de dev (toi + Claude Code), pas un robot d'exécution.

---

## ⚙️ GitHub Actions

Cron cloud côté GitHub. Workflows dans `.github/workflows/`.

| Workflow | Cron | Rôle | Statut |
|---|---|---|---|
| `ci-build.yml` | sur PR/push main | Build CI Astro (`npm ci` + `npm run build`) | actif |
| `weekly-test-outils-enomia.yml` | lundi 07:23 UTC (09:23 Paris) | Tests Playwright E2E sur prod : simulateur, contrat, facture | actif |
| `refresh-taxe-sejour.yml` | 1er nov 06:00 UTC (annuel) | Import fichier DELTA DGFiP → Supabase (tarifs N+1) | actif |
| `publish-rentabilite-city.yml` | (cron commenté) | Flip `brouillon`→`en-ligne` dans `cities-rentabilite.ts` | ⏸️ **EN PAUSE** (contenu pas quali, à reviewer) |

`workflow_dispatch` reste actif sur tous (manual trigger via UI GitHub).

**Supprimés 2026-05-21** :
- 🗑️ `daily-freshness.yml` — technique "freshness fake" sur articles blog, borderline spam SEO
- 🗑️ `semrush-villes-cron.yml` — audit batch SEMrush mensuel, remplacé par audits ponctuels

---

## ☁️ Cloud routines Anthropic (`/schedule`)

Routines qui tournent sur infrastructure Anthropic (cloud sandbox), pas sur les machines de Marc. Gérées via `claude.ai/code/routines` ou MCP `scheduled-tasks`.

| Task | Cron | Rôle | Statut |
|---|---|---|---|
| `jova-batch-audit-notes` | Manual only | Batch SEO audit notes pour contacts Jova CRM | actif (on-demand, Local) |
| `monthly-qa-tools-enomia` | 1er du mois 09:27 | Check qualitatif des 3 outils enomia.app + BDD + Brevo | actif (Local, next 2026-06-01) |
| ~~`gsc-indexation-quotidienne`~~ | ~~Chaque jour 9:18~~ | **Désactivée 2026-05-24** (`auto_disabled_env_not_found`, env bridge périmé) — remplacée par le launchd `app.enomia.gsc-indexation` rechargé avec wrapper `claude -p`. À supprimer manuellement sur https://claude.ai/code/routines (trigger_id `trig_018a5hNKznSvgCQLo4zVFFpU`) | ⏹️ disabled |
| `fb-scan-watch-replies` | Horaire (toutes les heures) | À vérifier — peut-être doublon avec launchd `com.enomia.fb-watch` | actif (À distance) |

**Supprimées 2026-05-21** (migrées vers Mac mini launchd) :
- 🗑️ `enrich-city-data` → remplacé par `app.enomia.conciergerie-production`
- 🗑️ `veille-communautaire-lcd` → remplacé par 4 launchd `com.enomia.fb-*`
- 🗑️ `gsc-indexation-enomia` → remplacé par `app.enomia.gsc-indexation`
- 🗑️ `prospection-backlinks-hebdo` → plus utilisé
- 🗑️ `prospection-backlinks-enrich-5h` → remplacé par pipeline v2 (`backlinks-source-monthly` + `send-daily` + `track-replies-v2` + `reports`)

**Refonte 2026-05-23 — pipeline backlinks v2** :
- 🗑️ `backlinks-pitches-daily` (validation Marc requise) → remplacé par `backlinks-send-daily` (envoi auto)
- 🗑️ `backlinks-validate-send` (parsait les replies Marc) → plus nécessaire (envoi direct)
- 🗑️ `backlinks-track-replies` (sur CRM `.claude/backlinks-data.json`) → remplacé par `backlinks-track-replies-v2` (sur `data/backlinks-*.json`)
- 🗑️ `backlinks-weekly-report` → remplacé par script générique `backlinks-reports.mjs --period={week|month|quarter|year}` (4 plists distincts)
- Note OAuth Max (`unset ANTHROPIC_API_KEY` pour retomber sur le token Max du keychain login) : technique applicable aux jobs `claude -p`. Le pipeline v2 utilise `fetch` direct vers Anthropic API (Haiku ~$0.10/mois), donc OAuth Max ne s'applique pas ici.

---

## Commandes utiles

### Lister les agents actifs
```bash
launchctl list | grep enomia
```

### Forcer un run maintenant (pour tester)
```bash
launchctl kickstart -k gui/$(id -u)/com.enomia.fb-daily-scan
```

### Désactiver temporairement un agent
```bash
launchctl unload ~/Library/LaunchAgents/com.enomia.fb-watch.plist
```

### Réactiver
```bash
launchctl load ~/Library/LaunchAgents/com.enomia.fb-watch.plist
```

### Voir les logs en direct
```bash
tail -f ~/projects/eunomia/data/rs-lcd/fb-watch.log
```

### Désactiver complètement le pipeline FB (vacances, etc.)
```bash
for a in fb-daily-scan fb-watch fb-check-replies fb-monthly-insights; do
  launchctl unload ~/Library/LaunchAgents/com.enomia.$a.plist
done
```

---

## Refresh conciergeries mensuel

### `app.enomia.conciergerie-refresh` — 3 du mois 6h13
**Dossier** : `scripts/refresh-conciergeries-monthly/` (`run.sh` + `plist.template` + `install.sh`)
**Fait** (100 % déterministe, **aucun `claude -p`**) :
1. Vérifie `main` + working tree clean, `git pull --ff-only`.
2. `refresh-conciergeries-google.mjs --json` → snapshot Places API.
3. `apply-places-corrections.mjs` → applique rating/reviews réels (garde-fous 4 couches, `n.c.` si <5 avis).
4. `bump-updated-dates.mjs` → tous les `updatedAt` de `cities.ts` à la date du jour + badge `index.astro`.
5. `validate-cities.mjs` + `npm run audit:blog-links`.
6. Si changement : commit + push `main` (Vercel redéploie).
7. Email récap Resend (`build-recap.mjs`). Toute erreur → rollback `git checkout -- .` + email d'alerte.

**Logs** : `scripts/refresh-conciergeries-monthly/logs/`
**Coût** : Google Places ~$10/run (crédit gratuit $200/mois Maps Platform). **0€ LLM.**
**Dépendances Mac mini** : `GOOGLE_PLACES_API_KEY` accessible (env ou `Neocamino/.env` ou `repo/.env`) + `RESEND_API_KEY` dans `repo/.env`.
**Installation** : `bash scripts/refresh-conciergeries-monthly/install.sh` (sur Mac mini, après merge sur `main`).

---

## Coûts API estimés (mensuel)

| Service | Estimation | Note |
|---------|------------|------|
| Anthropic API (fb-* + tech-watchdog + autres) | **~3-4€/mois** | Depuis switch backlinks vers Max le 2026-05-23. Avant : ~13€/mois constatés. |
| Claude Max (subscription) | déjà payé | Désormais utilisé par `backlinks-pitches-daily` + `backlinks-validate-send` via OAuth. Attention aux limites hebdo si usage interactif intensif. |
| Resend (envoi emails) | gratuit (volume faible) | |
| Google API (Gmail + GSC) | gratuit (quotas) | |
| Google Places API (conciergerie-refresh) | gratuit (crédit $200/mois) | ~$10/run mensuel, largement couvert |
| SEMrush | déjà payé (Neocamino) | |

### Historique des switches Max vs API

- **2026-05-23** — Switch `backlinks-pitches-daily` + `backlinks-validate-send` vers OAuth Max (unset `ANTHROPIC_API_KEY` dans wrappers). Économie estimée ~10-15€/mois. Les fb-*.mjs restent en API (utilisent le SDK Anthropic directement, refacto vers `claude -p` jugée non rentable pour ~3-4€/mois).

---

## Quand quelque chose plante

1. **Vérifier `launchctl list`** : statut `-` = pas en cours (normal entre runs), nombre ≠ 0 = exit code d'erreur.
2. **Logs stderr** dans `data/rs-lcd/*.stderr.log` ou `~/Library/Logs/` pour les anciens agents.
3. **Cookies FB expirés** (~90j) : refaire l'export Cookie-Editor dans Chrome → `scripts/rs-lcd/fb-cookies.json`.
4. **OAuth Gmail expiré** : relancer `node scripts/gsc-oauth-bootstrap.mjs`.
5. **Lock fb-post bloqué** : `rm /tmp/fb-post-running.lock`.

---

## ⚠️ Issues connues / Incidents résolus

### Coupure de courant → Mac mini bloqué FileVault (RÉSOLU 2026-05-21)

- **Symptôme** : Mac mini reboot après coupure mais bloqué sur écran FileVault (demande mdp pour déchiffrer disque). Tous les services (Tailscale, SSH, launchd) down jusqu'à intervention physique.
- **Fix appliqué** :
  1. `sudo fdesetup disable` — FileVault off (disque non chiffré, risque vol physique accepté pour home server)
  2. Auto-login user `marc` via System Settings > Users & Groups
  3. `sudo pmset -a autorestart 1` — reboot auto après coupure
  4. (déjà actif) `pmset sleep=0`, `disksleep=0`, `womp=1`
- **Trade-off** : qui vole le Mac mini physiquement lit tokens API (Anthropic, SEMrush, Gmail OAuth, Supabase, Vercel, RESEND). Acceptable car home server.

### Rattrapage manuel d'un job launchd : utiliser `launchctl kickstart`, PAS `nohup ssh`

- **Symptôme** : lancer `ssh macmini 'nohup bash run.sh &'` → claude voit "Not logged in" après ~6s.
- **Cause** : SSH user session ≠ session GUI. Le token OAuth Claude est dans le **keychain `login`**, accessible uniquement depuis la session GUI auto-loggée. SSH a son propre contexte sans keychain.
- **Solution** : déclencher dans le bon contexte launchd :
  ```bash
  ssh macmini 'launchctl kickstart -k "gui/501/<job-label>"'
  ```
- **Note** : les launchd scheduled (firent à leur cron) tournent déjà dans `gui/UID/` → marchent normalement. Le bug n'apparaît QUE pour les rattrapages manuels en SSH.

### Keychain login pas accessible depuis SSH (informatif)

- `security show-keychain-info ~/Library/Keychains/login.keychain-db` retourne `User interaction is not allowed` en SSH. C'est NORMAL — le keychain est attaché à la session GUI user, pas SSH.
- N'affecte pas les launchd scheduled. Affecte uniquement les commandes manuelles SSH qui ont besoin du keychain.
- Solution si vraiment besoin depuis SSH : `sudo launchctl asuser 501 <command>` (nécessite sudo TTY).

### Sessions Claude actives sur Mac mini = source de divergence Git (RÉSOLU 2026-05-21)

- **Symptôme** : modifs faites en session Claude Code sur le Mac mini → invisibles depuis MBP, perdues si pas commit/push.
- **Cause** : 2 clones Git distincts (MBP `~/Desktop/eunomia/` + Mac mini `~/projects/eunomia/`). Sync uniquement via GitHub.
- **Règle adoptée 2026-05-21** :
  - **Mac mini = robot d'exécution uniquement** (launchd jobs qui commit+push leurs résultats)
  - **MBP = bureau de dev** (toi + Claude Code, modifs versionnées via PR/commit)
  - Plus de sessions Claude Code humaines directement sur Mac mini.

---

## Évolutions à venir

Cf. `~/.claude/projects/-Users-marc-projects-eunomia/memory/domains/rs-lcd/project_fb_scan_roadmap.md` pour les chantiers identifiés.
