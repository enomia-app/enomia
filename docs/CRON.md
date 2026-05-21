# Cron Enomia — vue d'ensemble

Tous les jobs tournent en **launchd** sur le Mac mini (`marcs-mac-mini-1.home`).
Les plists sources sont versionnés dans le repo, les copies actives sont dans `~/Library/LaunchAgents/`.

## Vue d'ensemble

| Agent | Fréquence | Rôle | Statut |
|-------|-----------|------|--------|
| `app.enomia.git-pull` | toutes les heures | Garde le repo Mac mini à jour avec GitHub | actif |
| `com.enomia.fb-daily-scan` | 7h00 quotidien | Scan FB matinal + drafte commentaires + email | actif |
| `app.enomia.gsc-indexation` | 7h03 quotidien | Demande indexation Google des top URLs prioritaires | actif |
| `app.enomia.tech-watchdog` | 8h00 quotidien | Watchdog santé technique du site | actif |
| `app.enomia.conciergerie-production` | Lun/Mer/Ven 8h30 | Cycle de production landing conciergerie | actif |
| `app.enomia.backlinks-track-replies` | 9h00 quotidien | Tracking réponses prospects backlinks + relances J+5/J+10 | actif |
| `com.enomia.fb-check-replies` | 9h00 quotidien | Check réponses sous commentaires FB Marc | actif |
| `com.enomia.fb-monthly-insights` | 1er du mois 9h00 | Rapport mensuel opportunités SEO + features | actif |
| `app.enomia.backlinks-pitches-daily` | 10h00 quotidien | Prépare ≤10 pitches backlinks + envoie email récap à valider | actif |
| `app.enomia.backlinks-validate-send` | 10h30, 14h, 17h, 20h | Parse replies Marc + envoie pitches validés aux destinataires | actif |
| `app.enomia.backlinks-weekly-report` | Dim 18h00 | Récap hebdo backlinks (envoyés, réponses, taux, pipeline) | actif |
| `com.enomia.fb-watch` | toutes les 15 min | Détecte réponses email Marc et poste sur FB | actif |

---

## Pipeline FB scan / posting

4 agents qui forment une chaîne complète d'engagement communautaire.

### `com.enomia.fb-daily-scan` — 7h00
**Script** : `scripts/rs-lcd/fb-daily-scan.mjs`
**Fait** :
1. Lance `fb-scan.mjs` qui scrape les 8 groupes Facebook LCD via Playwright headless
2. Récupère ~25-30 posts captés
3. Appelle l'API Claude (sonnet) pour filtrer les pertinents et drafter une réponse Marc pour chacun
4. Décide quels drafts incluent un lien Enomia (~1 lien sur 6-10)
5. Envoie l'email **"[FB scan] N propositions à valider"** à `marc@enomia.app`

**Logs** : `data/rs-lcd/fb-daily-scan.stdout.log`
**Coût Claude API** : ~5c par run

### `com.enomia.fb-watch` — toutes les 15 min
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

### `com.enomia.fb-check-replies` — 9h00
**Script** : `scripts/rs-lcd/fb-check-replies.mjs`
**Fait** :
1. Lit `data/rs-lcd/fb-history.json` (commentaires Marc des 30 derniers jours)
2. Pour chaque entrée : Playwright navigue, trouve le commentaire Marc dans la page, lit les sous-réponses
3. Détecte les NOUVELLES réponses (compare avec état précédent stocké)
4. Drafte des répliques Marc via API Claude
5. Envoie email **"[FB replies] N propositions"**

**Logs** : `data/rs-lcd/fb-check-replies.stdout.log`

### `com.enomia.fb-monthly-insights` — 1er du mois 9h00
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

### `app.enomia.tech-watchdog` — 8h00 quotidien
**Script** : `scripts/tech-watchdog/run.sh`
Surveillance technique du site (probable : check 200/500 sur URLs critiques, certif SSL, etc.). Envoie un email si problème via Resend.

### `app.enomia.backlinks-pitches-daily` — 10h00 quotidien
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

### `app.enomia.backlinks-validate-send` — 10h30, 14h, 17h, 20h
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

### `app.enomia.backlinks-track-replies` — 9h00 quotidien
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

### `app.enomia.backlinks-weekly-report` — Dim 18h00
**Script** : `scripts/backlinks-weekly-report/run.sh`
**Prompt** : `scripts/backlinks-weekly-report/prompt.md`
**Fait** :
1. Lit le CRM, calcule stats de la semaine écoulée (J-7 → J) + stats cumulées
2. Compile : pitches préparés/envoyés, relances envoyées, réponses (par classe), backlinks obtenus, taux de réponse, taux de conversion, pipeline restant par status, top 3 réponses positives à traiter
3. Envoie 1 mail récap à `marc@enomia.app`

**Logs** : `scripts/backlinks-weekly-report/logs/run-YYYY-MM-DD.log`
**Coût Claude API** : très faible (~2c/run)
**Pipeline** : Phase 3.4 du plan D backlinks.

### `app.enomia.conciergerie-production` — Lun/Mer/Ven 8h30
**Script** : `scripts/conciergerie-production/run.sh`
Cycle de production des landings/articles de conciergerie (3 fois par semaine).

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

## Évolutions à venir

Cf. `~/.claude/projects/-Users-marc-projects-eunomia/memory/domains/rs-lcd/project_fb_scan_roadmap.md` pour les chantiers identifiés.
