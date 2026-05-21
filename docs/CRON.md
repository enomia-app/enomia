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
| `app.enomia.git-pull` | toutes les heures | Garde le repo Mac mini à jour avec GitHub | actif |
| `com.enomia.fb-daily-scan` | 7h17 quotidien | Scan FB matinal + drafte commentaires + email | actif |
| `app.enomia.gsc-indexation` | 7h03 quotidien | Demande indexation Google des top URLs prioritaires | actif |
| `app.enomia.tech-watchdog` | 8h11 quotidien | Watchdog santé technique du site | actif |
| `app.enomia.conciergerie-production` | Lun/Mer/Ven 8h37 | Cycle de production landing conciergerie | actif |
| `app.enomia.backlinks-track-replies` | 9h13 quotidien | Tracking réponses prospects backlinks + relances J+5/J+10 | actif |
| `com.enomia.fb-check-replies` | 9h23 quotidien | Check réponses sous commentaires FB Marc | actif |
| `com.enomia.fb-monthly-insights` | 1er du mois 9h31 | Rapport mensuel opportunités SEO + features | actif |
| `app.enomia.backlinks-pitches-daily` | 10h17 quotidien | Prépare ≤10 pitches backlinks + envoie email récap à valider | actif |
| `app.enomia.backlinks-validate-send` | 10h37, 14h23, 17h19, 20h41 | Parse replies Marc + envoie pitches validés aux destinataires | actif |
| `app.enomia.backlinks-weekly-report` | Dim 18h43 | Récap hebdo backlinks (envoyés, réponses, taux, pipeline) | actif |
| `com.enomia.fb-watch` | xh07, xh22, xh37, xh52 (4×/h) | Détecte réponses email Marc et poste sur FB | actif |

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

### `app.enomia.git-pull` — toutes les heures
**Script** : `scripts/git-pull-eunomia.sh`
Garde la copie locale du repo synchronisée avec GitHub. Évite que le Mac mini parte en désync.

### `app.enomia.gsc-indexation` — 7h03 quotidien
**Script** : `scripts/gsc-indexation/run.sh`
Vérifie les URLs prioritaires (par volume SEMrush) non-indexées et envoie une demande d'indexation à Google Search Console. Limite 5/jour (quota GSC).

### `app.enomia.tech-watchdog` — 8h11 quotidien
**Script** : `scripts/tech-watchdog/run.sh`
Surveillance technique du site (probable : check 200/500 sur URLs critiques, certif SSL, etc.). Envoie un email si problème via Resend.

### `app.enomia.backlinks-pitches-daily` — 10h17 quotidien
**Script** : `scripts/backlinks-pitches-daily/run.sh`
**Prompt** : `scripts/backlinks-pitches-daily/prompt.md`
**Fait** :
1. Pull `enomia-memory` dans `/tmp/enomia-memory` puis charge les 9 fichiers contexte voix Marc (identité, méthode 97, livre, anti-hallucination, backlinks reference)
2. Sélectionne ≤10 prospects du CRM `.claude/backlinks-data.json` (priorité 1 = `a_enrichir` top traffic, priorité 2 = `a_qualifier` traffic 100-5000 tag blog/conciergerie)
3. Pour chaque : scan site via WebFetch, identifie email/formulaire de contact, détecte compétition (simulateur/fiscalité/loi/etc déjà présents), mappe ressource Enomia COMPLÉMENTAIRE, rédige `pitch_pret` en voix Marc avec soft opt-out
4. Update CRM : `status: pitch_pret_a_envoyer` + champs (email, article_cible, ressource_enomia_proposee, pitch_pret, dernier_contact, etc.). Les prospects sans contact détecté → `rejete_pas_de_contact`
5. Envoie 1 email récap à `marc@enomia.app` avec les N pitches numérotés + instructions de validation (`OK 1, 3 / MODIF 2: ... / SKIP 4`). Phase 3.2 (à venir) parsera cette réponse pour envoyer aux destinataires.

**Logs** : `scripts/backlinks-pitches-daily/logs/run-YYYY-MM-DD.log` + `launchd-{stdout,stderr}.log`
**Coût Claude API** : à calibrer après quelques runs (estimation : 10-20c/run avec WebFetch + drafting 10 pitches sonnet/opus)
**Pipeline** : Phase 3.1 du plan D backlinks. Remplace l'ancienne routine cloud `prospection-backlinks-enrich-5h` (désactivée 2026-05-21).

### `app.enomia.backlinks-validate-send` — 10h37, 14h23, 17h19, 20h41
**Script** : `scripts/backlinks-validate-send/run.sh`
**Prompt** : `scripts/backlinks-validate-send/prompt.md`
**Fait** :
1. Scan Gmail les threads `from:marc@enomia.app subject:"[backlinks]"` des 14 derniers jours
2. Filtre via `.claude/backlinks-validation-state.json` (anti-doublon par threadId)
3. Pour chaque thread avec réponse Marc : parse le format `OK 1, 3 / MODIF 2: <pitch> / SKIP 4` + extrait l'ordre des prospects du récap initial
4. **Parsing en langage naturel** : Marc répond en français libre ("ok pour 1, 3 / change le 2 par : ... / skip 4 5"), l'agent Claude interprète sans format strict
5. Pour les OK/MODIF avec `email` : envoie le pitch au destinataire via Gmail API, update CRM (`status=envoye`, `date_envoi`, `dernier_contact`)
6. Pour les OK/MODIF avec seulement `url_formulaire` : **tente l'envoi via Chrome MCP** (navigate + form_input). Si succès → `status=envoye_via_formulaire`. Si captcha détecté ou fail → fallback `pitch_a_envoyer_manuel`, ajout à la liste manuelle du mail de confirmation
7. Pour les SKIP : status → `rejete_non_pertinent`
8. Envoie 1 mail confirmation à `marc@enomia.app` avec le bilan (envoyés par email / envoyés via formulaire / à envoyer manuellement / skippés / ambigus)
9. Marque le threadId dans le state local

**État local** : `.claude/backlinks-validation-state.json` (gitignored)
**Logs** : `scripts/backlinks-validate-send/logs/run-YYYY-MM-DD.log`
**Coût Claude API** : modéré (~5-10c/run quand il y a des threads à traiter)
**Pipeline** : Phase 3.2 du plan D backlinks.

### `app.enomia.backlinks-track-replies` — 9h13 quotidien
**Script** : `scripts/backlinks-track-replies/run.sh`
**Prompt** : `scripts/backlinks-track-replies/prompt.md`
**Fait** :
1. Lit le CRM, filtre les prospects avec `status ∈ {envoye, relance_1, relance_2}` + `email`
2. Pour chaque : query Gmail pour réponses du prospect depuis `date_envoi`/`date_relance_X`
3. Classifie chaque réponse (l'agent Claude lui-même) en `positive | negative | spam | question | autre`
4. Update CRM : `reponse_recue`, `date_reponse`, `status` → `repondu_positif | repondu_negatif | spam | (inchangé si autre)`
5. Envoie les relances dues :
   - J+5 sans réponse : Template T2 (relance neutre), `status=relance_1`
   - J+10 sans réponse : Template T3 (relance soft opt-out + propose appel), `status=relance_2`
   - J+15 sans réponse : `status=pas_de_reponse` (pas d'envoi)
6. Si réponses ou relances : envoie 1 mail à Marc avec récap (positives à traiter, négatives, relances envoyées)

**Logs** : `scripts/backlinks-track-replies/logs/run-YYYY-MM-DD.log`
**Coût Claude API** : faible (~5c/run, dépend du nb de réponses à classifier)
**Pipeline** : Phase 3.3 du plan D backlinks.

### `app.enomia.backlinks-weekly-report` — Dim 18h43
**Script** : `scripts/backlinks-weekly-report/run.sh`
**Prompt** : `scripts/backlinks-weekly-report/prompt.md`
**Fait** :
1. Lit le CRM, calcule stats de la semaine écoulée (J-7 → J) + stats cumulées
2. Compile : pitches préparés/envoyés, relances envoyées, réponses (par classe), backlinks obtenus, taux de réponse, taux de conversion, pipeline restant par status, top 3 réponses positives à traiter
3. Envoie 1 mail récap à `marc@enomia.app`

**Logs** : `scripts/backlinks-weekly-report/logs/run-YYYY-MM-DD.log`
**Coût Claude API** : très faible (~2c/run)
**Pipeline** : Phase 3.4 du plan D backlinks.

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
| `jova-batch-audit-notes` | Manual only | Batch SEO audit notes pour contacts Jova CRM | actif (on-demand) |
| `monthly-qa-tools-enomia` | 1er du mois 09:27 | Check qualitatif des 3 outils enomia.app + BDD + Brevo | actif (next 2026-06-01) |

**Supprimées 2026-05-21** (migrées vers Mac mini launchd) :
- 🗑️ `enrich-city-data` → remplacé par `app.enomia.conciergerie-production`
- 🗑️ `veille-communautaire-lcd` → remplacé par 4 launchd `com.enomia.fb-*`
- 🗑️ `gsc-indexation-enomia` → remplacé par `app.enomia.gsc-indexation`
- 🗑️ `prospection-backlinks-hebdo` → plus utilisé
- 🗑️ `prospection-backlinks-enrich-5h` → remplacé par `app.enomia.backlinks-pitches-daily` + `validate-send` + `track-replies`

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

## Coûts API estimés (mensuel)

| Service | Estimation |
|---------|------------|
| Anthropic API (parsing réponses + drafting + insights) | ~5-10€ |
| Resend (envoi emails) | gratuit (volume faible) |
| Google API (Gmail + GSC) | gratuit (quotas) |
| SEMrush | déjà payé (Neocamino) |

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
