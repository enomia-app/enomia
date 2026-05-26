---
name: scan-facebook-lcd
description: Scanner les groupes Facebook LCD pour trouver les posts récents pertinents. Triggers — scan facebook lcd, scanner groupes facebook, veille facebook lcd
---

# Scan Facebook LCD

Scanne les groupes Facebook de la communauté location courte durée pour extraire les posts récents pertinents.

## Groupes à scanner

Ouvre chaque groupe via Chrome (MCP Claude in Chrome), trie par "Nouvelles publications" :

1. https://www.facebook.com/groups/478050167400075/ (Aides et conseils entre Conciergeries Airbnb)
2. https://www.facebook.com/groups/locationdirect/ (Entraide & conseils entre hôtes - Location saisonnière en direct)
3. https://www.facebook.com/groups/1731441584115261/ (Airbnb Booking France Entraide & Fiscalité)
4. https://www.facebook.com/groups/940614047868754/ (Entraide Airbnb & Booking - particuliers et conciergeries)
5. https://www.facebook.com/groups/359389397873531/ (Le Cercle de la Location Courte Durée)
6. https://www.facebook.com/groups/airbnbentraidepourhote/ (Airbnb Entraide pour Hôte)
7. https://www.facebook.com/groups/1820983154865197/ (Airbnb Propriétaires France)

## Méthode

Pour chaque groupe :
1. Naviguer vers l'URL avec `?sorting_setting=CHRONOLOGICAL`
2. Attendre le chargement (3-4 secondes)
3. Scroller pour charger les posts (Facebook lazy-load)
4. Extraire via JavaScript le contenu du feed : `document.querySelector('[role="feed"]').innerText`
5. Récupérer pour chaque post visible : auteur, contenu, nombre de réactions/réponses, ancienneté

## Filtrage

Ne garder que les posts qui parlent de :
- Rentabilité, commissions, fiscalité LMNP
- Channel manager, PMS, outils de gestion
- Conciergerie, automatisation, check-in
- Contrat, facture, taxe de séjour, DPE
- Pricing dynamique, taux d'occupation
- Questions de débutants sur lancer en LCD

Exclure : promotions d'annonces, recherche de photographe, offres d'emploi, pub pour services de ménage.

## Output

Pour chaque post retenu, retourne :
- **Source** : Facebook
- **Groupe** : Nom du groupe
- **Auteur** : Nom de l'auteur du post
- **Contenu** : Texte complet du post
- **URL** : URL du groupe (Facebook ne permet pas facilement d'extraire l'URL individuelle du post)
- **Engagement** : Nombre de réponses/réactions
- **Priorité suggérée** : Haute (>10 réponses + thématique forte) / Moyenne (3-10 réponses) / Basse (<3 réponses)
