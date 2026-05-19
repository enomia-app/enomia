# Veille communautaire LCD — Scripts Facebook

## Architecture

```
Cron 6h (quotidien)
  fb-scan.mjs          → data/rs-lcd/fb-scan-candidates.json
  agent Claude         → draft réponses → email récap Marc

Marc répond par email
  OK: 1.1, 2.3 / SKIP: 1.2 / EDIT 3.1: [texte]

Cron check Gmail (toutes les heures)
  agent Claude         → parse réponse → data/rs-lcd/fb-validated.json
  fb-post.mjs          → poste les commentaires validés (pauses 60-180s)
  email confirmation   → liens des commentaires postés
```

---

## Session Facebook (à faire une seule fois)

Les scripts utilisent un profil Playwright persisté dans `~/.playwright-fb-scan/`.
**Pas besoin d'exporter des cookies** — tu te connectes une seule fois manuellement.

```bash
cd ~/projects/eunomia
node scripts/rs-lcd/fb-scan.mjs
```

Une fenêtre Chrome s'ouvre. Connecte-toi à Facebook (`marc@enomia.app`).
Une fois connecté, reviens dans le terminal et appuie sur **Entrée**.

Tous les runs suivants sont complètement automatiques.
La session dure ~90 jours. Si elle expire, le script affiche "Session expirée" et rouvre une fenêtre.

---

## Lancer le scan manuellement

```bash
cd ~/projects/eunomia
node scripts/rs-lcd/fb-scan.mjs
```

Résultat dans `data/rs-lcd/fb-scan-candidates.json`.

---

## Poster des commentaires validés

```bash
cd ~/projects/eunomia
node scripts/rs-lcd/fb-post.mjs data/rs-lcd/fb-validated.json
```

Format de `fb-validated.json` :

```json
[
  {
    "postId": "1.1",
    "url": "https://www.facebook.com/groups/.../posts/123456789/",
    "text": "Bonne question. Pour la résidence principale louée moins de 120 nuits/an..."
  }
]
```

---

## Si FB demande un CAPTCHA

Le script s'arrête. Dans ce cas :
1. Lance `node scripts/rs-lcd/fb-scan.mjs` (ouvre une fenêtre)
2. Résous le CAPTCHA manuellement dans cette fenêtre
3. Appuie sur Entrée dans le terminal pour continuer
