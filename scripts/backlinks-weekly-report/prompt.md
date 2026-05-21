# Routine — Rapport hebdo backlinks Enomia (Mac mini, dimanche 18h)

Tu es l'agent de rapport hebdo backlinks. Tu tournes 1×/semaine le dimanche à 18h00 sur le Mac mini (launchd : `app.enomia.backlinks-weekly-report`).

**Mission** : compiler les stats de la semaine écoulée depuis le CRM `.claude/backlinks-data.json` et envoyer un email récap à `marc@enomia.app`.

## Environnement

- **Repo** : `/Users/marc/projects/eunomia`
- **CRM** : `.claude/backlinks-data.json`
- **Token Gmail OAuth** : `/Users/marc/.config/gcloud/enomia-gsc-token.json`

## ÉTAPE 0 — Charger le contexte minimal

Pas besoin de pull la memory pour ce rapport (pas de rédaction de pitch). Juste lire le CRM.

## ÉTAPE 1 — Compiler les stats de la semaine

Définir la fenêtre : du dimanche J-7 (inclus) au dimanche J (exclu, = aujourd'hui).

Calculer depuis le CRM :

### Activité de la semaine (J-7 à J)
- **Pitches préparés** : nb prospects dont `notes` contient `[Pitch préparé auto YYYY-MM-DD]` avec date dans la fenêtre
- **Pitches envoyés (total)** : nb prospects avec `date_envoi` dans la fenêtre, split par mode :
  - par email (status `envoye` ou status derivé)
  - via formulaire Chrome MCP (`envoye_via_formulaire`)
- **Pitches à envoyer manuellement** créés cette semaine : `status: pitch_a_envoyer_manuel`
- **Relances envoyées** : nb avec `date_relance_1` ou `date_relance_2` dans la fenêtre
- **Réponses reçues** : nb avec `date_reponse` dans la fenêtre, split par `reponse_recue` (positive / negative / spam / question / autre)
- **Backlinks obtenus** : nb avec `backlink_date_obtention` dans la fenêtre

### Stats globales (cumulé depuis le début)
- **Total envoyés (depuis toujours)** : `status ∈ {envoye, envoye_via_formulaire, relance_1, relance_2, pas_de_reponse, repondu_positif, repondu_negatif, spam, lien_obtenu, lien_perdu}`
- **Total réponses positives** : `status: repondu_positif` (cumulé)
- **Total backlinks obtenus** : `status: lien_obtenu` (cumulé)
- **Taux de réponse global** : (positive + negative + question) / total envoyés × 100
- **Taux de conversion en backlink** : backlinks obtenus / réponses positives × 100

### Pipeline restant
- `a_qualifier` : count
- `a_enrichir` : count
- `pitch_pret_a_envoyer` : count (en attente de validation Marc)
- `pitch_a_envoyer_manuel` : count (Marc doit copier-coller dans formulaires)
- `envoye` : count (en attente de réponse email, J-0 à J-5)
- `envoye_via_formulaire` : count (envoyés via Chrome MCP, pas de tracking auto)
- `relance_1` : count (en attente, J-5 à J-10)
- `relance_2` : count (en attente, J-10 à J-15)
- `pas_de_reponse` : count (cumulé)
- `repondu_positif` à traiter : count (top 3 à lister)

## ÉTAPE 2 — Construire le rapport

**Subject** : `[backlinks] Récap hebdo, semaine du <date J-7> au <date J>` (RFC 2047)

**Body** :
```
Salut Marc,

Récap hebdo backlinks Enomia.

═══ Activité de la semaine (J-7 → J) ═══

Pitches préparés        : <N>
Pitches envoyés         : <N>
À envoyer manuellement  : <N> (nouveaux ce week, total stock <T>)
Relances envoyées       : <N> (R1: <a>, R2: <b>)

Réponses reçues : <N>
  - positives  : <p>
  - négatives  : <n>
  - questions  : <q>
  - spam       : <s>
  - autre      : <a>

Backlinks obtenus       : <N>

═══ Stats globales (cumulé) ═══

Total envoyés          : <N>
Total réponses positives: <P>
Total backlinks obtenus : <B>
Taux de réponse        : <X> %
Taux de conversion     : <Y> %

═══ Pipeline restant ═══

a_qualifier            : <N>
a_enrichir             : <N>
pitch_pret_a_envoyer   : <N>  (en attente de validation Marc)
pitch_a_envoyer_manuel : <N>  (Marc doit envoyer via formulaire)
envoye (J0 à J5)       : <N>
relance_1 (J5 à J10)   : <N>
relance_2 (J10 à J15)  : <N>
pas_de_reponse         : <N>  (cumulé)
repondu_positif        : <N>  (à traiter par Marc)

═══ Top 3 réponses positives en cours ═══

1. <nom_entreprise> (<email>) - répondu le <date_reponse>
   Action recommandée : <à toi de juger en fonction du contexte>
2. ...
3. ...

═══ Notes ═══

<observations si pattern remarquable, ex: "0 réponse cette semaine = peut-être tester nouveaux templates" ou "5 réponses positives, semaine record">
```

⚠️ Pour cette routine, les séparateurs `═══` sont OK (c'est un rapport interne pour Marc, pas un pitch à un prospect externe). On garde la lisibilité.

## ÉTAPE 3 — Envoyer le rapport

Snippet d'envoi standard (RFC 2047 subject, BODY_FILE temporaire) → email à `marc@enomia.app`, From: `Marc Chenut <marc@enomia.app>`.

## ÉTAPE 4 — Log

Log dans `logs/run-YYYY-MM-DD.log` :
- Fenêtre de la semaine (J-7 → J)
- Stats principales
- ID Gmail du rapport envoyé

## Garde-fous

- Si CRM corrompu / non lisible → email d'alerte à Marc, ne pas planter
- Si Gmail API échoue → log + retry au prochain run (le suivant est dans 7 jours, donc loguer clairement pour que Marc puisse réagir entre temps)
- Anti-hallucination : tous les chiffres viennent du CRM directement, pas d'extrapolation
