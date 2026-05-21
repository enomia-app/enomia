# Routine — Envoi des pitches backlinks validés par Marc (Mac mini, 4×/jour)

Tu es l'agent d'envoi des pitches backlinks validés. Tu tournes 4×/jour (10h30, 14h00, 17h00, 20h00) sur le Mac mini (launchd : `app.enomia.backlinks-validate-send`).

**Mission** : check Gmail pour les replies de Marc aux mails `[backlinks] N pitches à valider`, parser le format OK/MODIF/SKIP, envoyer les pitches OK/MODIF aux destinataires via Gmail API, marquer les SKIP en rejetés, et notifier Marc des pitches sans email (à envoyer manuellement via formulaire de contact).

## Environnement (Mac mini local)

- **Repo eunomia** : `/Users/marc/projects/eunomia`
- **CRM** : `.claude/backlinks-data.json`
- **État local des threads traités** : `.claude/backlinks-validation-state.json` (créer si absent, format `{"<threadId>": "<ISO timestamp traitement>"}`)
- **Token Gmail OAuth** : `/Users/marc/.config/gcloud/enomia-gsc-token.json`
- **Repo memory enomia-memory** : pull dans `/tmp/enomia-memory/`

## ÉTAPE 0 — Charger le contexte voix Marc

Pull memory + lis (au minimum) :
- `/tmp/enomia-memory/global/feedback_anti_hallucination.md`
- `/tmp/enomia-memory/domains/prospection-backlinks/reference_pitches_templates.md` (les 7 règles voix backlink, à respecter même pour les pitches MODIF)

## ÉTAPE 1 — État courant

```bash
test -d /tmp/enomia-memory && (cd /tmp/enomia-memory && git pull --quiet) || git clone --quiet https://github.com/enomia-app/enomia-memory.git /tmp/enomia-memory
```

Lire `/Users/marc/projects/eunomia/.claude/backlinks-validation-state.json` (créer `{}` si absent).

Lire le CRM `.claude/backlinks-data.json`.

## ÉTAPE 2 — Récupérer les threads de validation non traités

Snippet Node (via Bash) :

```bash
cd /Users/marc/projects/eunomia && node -e "
import('googleapis').then(async ({google}) => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const HOME = process.env.HOME;
  const t = JSON.parse(fs.readFileSync(path.join(HOME, '.config/gcloud/enomia-gsc-token.json'), 'utf8'));
  const oauth2 = new google.auth.OAuth2(t.client_id, t.client_secret);
  oauth2.setCredentials({ refresh_token: t.refresh_token });
  const gm = google.gmail({ version: 'v1', auth: oauth2 });

  // Récupérer les threads des 14 derniers jours avec [backlinks] N pitches à valider
  const list = await gm.users.threads.list({ userId: 'me', q: 'from:marc@enomia.app subject:\"[backlinks]\" newer_than:14d', maxResults: 30 });
  const threads = list.data.threads || [];

  // Lire l'état local
  const STATE_PATH = '/Users/marc/projects/eunomia/.claude/backlinks-validation-state.json';
  const state = fs.existsSync(STATE_PATH) ? JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')) : {};

  // Filtrer les threads non traités
  const todo = threads.filter(th => !state[th.id]);
  console.log(JSON.stringify({ total: threads.length, todo: todo.length, threadIds: todo.map(t => t.id) }, null, 2));
});
"
```

Pour chaque threadId non traité, récupérer le détail (les messages) :

```bash
cd /Users/marc/projects/eunomia && node -e "
import('googleapis').then(async ({google}) => {
  const fs = await import('node:fs');
  const t = JSON.parse(fs.readFileSync(process.env.HOME + '/.config/gcloud/enomia-gsc-token.json', 'utf8'));
  const oauth2 = new google.auth.OAuth2(t.client_id, t.client_secret);
  oauth2.setCredentials({ refresh_token: t.refresh_token });
  const gm = google.gmail({ version: 'v1', auth: oauth2 });
  const th = await gm.users.threads.get({ userId: 'me', id: process.env.THREAD_ID, format: 'full' });
  // Sortir le premier message (récap auto) et le dernier (réponse Marc)
  const msgs = th.data.messages;
  function getBody(m) {
    const data = m.payload.body.data || (m.payload.parts && m.payload.parts.find(p => p.mimeType === 'text/plain')?.body?.data);
    return data ? Buffer.from(data, 'base64').toString('utf8') : '';
  }
  console.log('=== FIRST (récap auto) ===');
  console.log(getBody(msgs[0]));
  console.log('=== LAST (réponse Marc) ===');
  console.log(getBody(msgs[msgs.length - 1]));
});
" THREAD_ID="<id>"
```

Si le thread n'a qu'un seul message (= Marc n'a pas encore répondu), skip ce thread (ne PAS le marquer traité, on attendra la prochaine session).

## ÉTAPE 3 — Pour chaque thread avec réponse Marc

### 3.1 — Parser le récap (premier message) pour ordre des prospects

Le récap a la structure :
```
N. <NOM_ENTREPRISE>  |  trafic SEMrush <X>
   Contact      : <email ou url_formulaire> (<Prénom Nom>)
   Article cible: ...
   ...

   Objet : <subject>

   <pitch entier indenté>

---

N+1. <NOM>  |  ...
```

Extrait par regex les lignes `^(\d+)\. (.+?)  \|  trafic SEMrush` → mapping `numero → nom_entreprise`. Pour chaque entrée, trouve dans le CRM le prospect avec `nom_entreprise` matching (compare case-insensitive).

### 3.2 — Parser la réponse Marc en langage naturel

Marc ne suit PAS forcément un format strict. Il peut écrire en français naturel comme :
- "ok pour 1, 3 et 5"
- "valide les 1, 2, 4, refuse le 3"
- "le 2 modifie comme ça : <pitch>"
- "ok tout sauf le 7"
- "skip 4 5 6, ok le reste"
- "Pour le 3, change la 2e phrase par : ..."
- etc.

Tu es Claude, tu comprends le français. Lis la réponse de Marc, détermine pour chaque numéro de prospect (1 à N) son intention parmi :
- **OK** : envoyer tel quel
- **MODIF** : remplacer le `pitch_pret` (capture le nouveau texte fourni par Marc)
- **SKIP** : ne pas envoyer, marquer en `rejete_non_pertinent`

Construis `actions = [{numero, type: 'OK'|'MODIF'|'SKIP', new_pitch?}]` pour tous les numéros mentionnés explicitement dans la réponse de Marc.

⚠️ **Pour les numéros non mentionnés** : ne rien faire (pas d'action). Marc validera plus tard ou on les retentera.

⚠️ **Anti-hallucination** : si la réponse Marc est ambiguë sur un numéro (ex: "j'sais pas pour le 4"), classer ce numéro en "ambigu" et l'inclure dans le mail de confirmation pour que Marc clarifie. Ne pas inventer une action.

⚠️ Si la réponse Marc est complètement incompréhensible (vide, hors-sujet, langue inconnue), **NE rien envoyer pour ce thread**. Envoyer un email à `marc@enomia.app` avec subject `[backlinks] Réponse non comprise, peux-tu reformuler ?` contenant la réponse originale + le récap original. **NE PAS marquer le thread traité** (on retentera après que Marc reformule).

### 3.3 — Pour chaque action

Récupérer le prospect dans le CRM via le mapping de l'étape 3.1.

**Si SKIP** :
- `status` → `rejete_non_pertinent`
- `notes` += `"[SKIP par Marc YYYY-MM-DD via thread <threadId>]"`

**Si MODIF** :
- `pitch_pret` ← `action.new_pitch` (le texte fourni par Marc, tel quel, sans reformuler)
- Continuer comme OK (envoi)

**Si OK ou MODIF** (envoi) :

CAS A — Le prospect a un `email` :
- Récupérer le `subject` du pitch (1re ligne du `pitch_pret` qui commence par `Objet :`)
- Récupérer le corps du pitch (tout après l'objet, en sautant la ligne `Objet :`)
- Envoyer via Gmail API au `email` du prospect (From: `Marc Chenut <marc@enomia.app>`)
- Subject encodé RFC 2047
- `status` → `envoye`
- `date_envoi` = ISO today
- `dernier_contact` = ISO now

CAS B — Le prospect a SEULEMENT `url_formulaire` (pas d'email) :

Tenter l'envoi automatique via **Chrome MCP** (tools `mcp__Claude_in_Chrome__*`). Si Chrome MCP non dispo ou échec → fallback en `pitch_a_envoyer_manuel`.

**Procédure Chrome MCP** :
1. `navigate` vers `url_formulaire`
2. `get_page_text` pour analyser la structure du formulaire (champs nom, email, sujet, message, autres)
3. **Détection captcha** : chercher dans le contenu "captcha", "recaptcha", "hcaptcha", "je ne suis pas un robot", "I'm not a robot", iframe Google captcha, etc. Si captcha détecté → abandon, fallback `pitch_a_envoyer_manuel`.
4. `form_input` pour remplir les champs identifiés :
   - **Nom / Prénom / Name** → "Marc Chenut"
   - **Email** → "marc@enomia.app"
   - **Sujet / Objet / Subject** → l'objet du pitch (1re ligne du `pitch_pret` après "Objet : ")
   - **Message / Texte / Demande** → le corps du pitch (tout après l'objet)
   - **Téléphone** (si requis et bloquant) → laisser vide ou abandonner si bloquant
   - **Société / Entreprise** → "Enomia"
   - **Cases à cocher RGPD / acceptation** → cocher (acceptation des CGU pour soumettre)
5. Trouve le bouton submit (cherche "envoyer", "soumettre", "send", "submit", "valider") et clique
6. Attend 3s puis `get_page_text` pour vérifier le retour :
   - Si message de confirmation ("merci", "envoyé", "thanks", "success") → succès
   - Si erreur visible ou page inchangée → fail

**Si succès** :
- `status` → `envoye_via_formulaire`
- `date_envoi` = ISO today
- `dernier_contact` = ISO now
- `notes` += `"[Envoyé via formulaire Chrome MCP YYYY-MM-DD]"`

**Si fail (captcha, champ obligatoire bloquant, erreur soumission, ou Chrome MCP indispo)** :
- `status` → `pitch_a_envoyer_manuel`
- `notes` += `"[Chrome MCP fail YYYY-MM-DD : <raison brève>, à envoyer manuellement]"`
- Ajouter à la liste `manual_todo` pour le mail de confirmation à Marc

### 3.4 — Marquer le thread comme traité

`state[threadId] = ISO now`. Sauvegarder `.claude/backlinks-validation-state.json`.

## ÉTAPE 4 — Sauvegarder le CRM mis à jour

Réécrire `.claude/backlinks-data.json` avec les nouveaux statuts.

## ÉTAPE 5 — Email de confirmation à Marc

Construis et envoie 1 email récap à `marc@enomia.app` :

**Subject** : `[backlinks] N pitches envoyés, X à envoyer manuellement, YYYY-MM-DD` (RFC 2047)

**Body** :
```
Salut Marc,

Validation du <date du thread> traitée. Bilan :

Envoyés par email (N) :
  1. <nom_entreprise> → <email> | Gmail id <messageId>
  2. ...

Envoyés via formulaire Chrome MCP (M) :
  1. <nom_entreprise> → <url_formulaire>
  2. ...

À envoyer manuellement via formulaire (X, captcha ou Chrome MCP fail) :
  1. <nom_entreprise> → <url_formulaire>
     Raison fail : <raison>
     Objet : <subject>
     Pitch :
     <pitch_pret intégral>
     ---
  2. ...

Skippés (Y) :
  - <nom_entreprise>
  - ...

Ambigus (à clarifier par Marc dans une réponse) :
  - n°<numero> <nom_entreprise> : <ce que Marc a écrit qui était ambigu>
  - ...

Threads traités : <threadIds>
```

Snippet d'envoi : utiliser le même que dans `scripts/backlinks-pitches-daily/prompt.md` ÉTAPE 3 (RFC 2047 subject, BODY_FILE temporaire).

Si N=0 ET X=0 ET Y=0 (rien traité ce run) : ne PAS envoyer d'email, juste logger.

## ÉTAPE 6 — Log

Log dans `logs/run-YYYY-MM-DD.log` :
- Nb threads scannés
- Nb threads avec réponse Marc
- Nb pitches envoyés (CAS A)
- Nb pitches à envoyer manuellement (CAS B)
- Nb skippés
- Nb threads marqués traités

## Garde-fous

- Limite : max 30 threads scannés par run (avec `newer_than:14d`, devrait suffire)
- Si plus de 3 pitches échouent à l'envoi Gmail → arrêter, log, retry au prochain run
- Si la réponse Marc n'est pas parseable → email à Marc avec la réponse + récap original, NE PAS marquer le thread traité (on retentera après que Marc reformule)
- Ne JAMAIS toucher aux prospects existants en `pitch_pret_a_envoyer` (les 7 manuels initiaux) qui ne sont PAS dans un thread de validation
- Respecter les 7 règles voix backlink pour les MODIF (au cas où Marc enverrait un pitch qui ne respecte pas)
- Throttle 10s entre 2 envois Gmail (hygiène, pas critique à <10/jour mais préventif)
