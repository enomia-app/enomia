---
name: generer-rapport-veille
description: Compiler des posts LCD et leurs réponses en document Word et l'envoyer par email. Triggers — rapport veille lcd, générer doc veille, compiler veille, envoyer rapport veille
---

# Générer rapport de veille LCD

Compile une liste de posts communautaires LCD avec leurs réponses proposées en un document Word, puis l'envoie par email.

## Input attendu

Une liste de posts, chacun avec :
- Source (Facebook, Reddit, Airbnb Community, YouTube)
- Nom du groupe/forum
- Auteur du post
- Contenu complet du post
- URL du post ou du groupe
- Nombre de réponses/engagement
- Priorité (Haute / Moyenne / Basse)
- Réponse proposée (rédigée via le skill `rediger-commentaire-lcd`)
- Lien Enomia utilisé dans la réponse (si applicable)

## Structure du document Word

### En-tête
- Titre : "Veille LCD — [DATE]"
- Résumé dans un encadré gris clair : nombre de posts trouvés par source, nombre retenus

### Corps — classé par priorité (Haute d'abord)

Pour chaque post retenu :

---
**[emoji priorité] [PRIORITÉ] — [Nom du groupe]**

**Post :** [Titre ou résumé]
**Lien :** [URL cliquable]

**Contenu du post :**
_[Texte intégral du post en italique gris]_

**Réponse proposée :**
[Texte de la réponse + lien Enomia cliquable si pertinent]

---

### Pied de page
- Liste des posts non retenus (1 ligne chacun avec raison)

## Style du document

- Police Arial 11pt
- Priorité Haute : emoji 🔴, couleur #C0392B
- Priorité Moyenne : emoji 🟡, couleur #D35400
- Priorité Basse : emoji 🟢, couleur #27AE60
- Contenu des posts en italique gris (#555555)
- Liens cliquables (vrais hyperliens, pas juste du texte bleu)
- Séparateur horizontal entre chaque post

## Génération

Utiliser le skill `anthropic-skills:docx` (docx-js via Node.js) pour créer le fichier .docx.
Sauvegarder temporairement : `/tmp/Veille_LCD_[DATE].docx`

## Envoi par email

Envoyer le document par email via Gmail MCP :
- **Destinataire :** marc@enomia.app
- **Objet :** Rapport — Veille communautaire [DATE]
- **Corps :** Résumé court (nombre de posts, top 3 prioritaires)
- **Pièce jointe :** Le fichier .docx généré

## Output

Confirmer l'envoi de l'email avec le nombre de posts inclus.
