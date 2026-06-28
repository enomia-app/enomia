// scripts/backlinks-send-daily/badge-observation.mjs
// Observation personnalisée pour les emails BADGE (camp 3/4/5), générée par
// Sonnet via Claude Max (OAuth, gratuit sous l'abonnement — jamais l'API payante,
// cf. memory/incident_api_spike_2026-05).
//
// Différent de observation.mjs (blogs) : ici PAS de scrape d'article (ce sont
// des entreprises). L'observation est ancrée UNIQUEMENT sur les données Google
// Places déjà en base : nom de l'établissement, note, nombre d'avis.
// Interdiction d'inventer une caractéristique non présente dans ces données.

import { callClaudeMax } from '../lib/claude-cli.mjs';

const MODEL = 'claude-sonnet-4-6';

const SEG = {
  conciergerie: {
    noun: 'conciergerie',
    example: 'Vos 140 avis à 4,8/5 vous placent clairement dans le haut du panier des conciergeries de la ville.',
  },
  loveroom: {
    noun: 'love room',
    example: "Votre suite avec spa privatif a un cachet rare, et vos avis le confirment.",
  },
  cabane: {
    noun: 'cabane insolite',
    example: "Votre cabane sort vraiment de l'ordinaire au vu de vos retours clients.",
  },
};

// Détecte une formulation négative/critique qu'on ne veut jamais envoyer.
const NEGATIVE_RE = /\b(il manque|manque de|vous ne |n'abordez|dommage|regrette|cependant|toutefois|mais)\b/i;

/** Fallback déterministe (toujours valorisant, jamais une critique). */
export function fallbackObservation({ rating, reviews, ville }) {
  const v = ville || 'votre ville';
  const r = rating != null && rating !== '' ? String(rating).replace('.', ',') : null;
  const n = reviews != null && reviews !== '' ? Number(reviews) : null;
  if (r && n) return `Vos ${n} avis à ${r}/5 sur Google vous placent parmi les mieux notées de ${v}.`;
  if (n) return `Vos ${n} avis sur Google montrent un vrai sérieux à ${v}.`;
  return `Votre réputation à ${v} ressort très bien sur Google.`;
}

/**
 * Génère l'observation (1re phrase de l'email) pour un prospect badge.
 * @param {{segment, nom_boite, ville, rating, reviews}} p
 * @param {(msg:string)=>void} [log]
 * @returns {Promise<string>}
 */
export async function generateBadgeObservation({ segment, nom_boite, ville, rating, reviews }, log = console.error) {
  const seg = SEG[segment];
  if (!seg) return fallbackObservation({ rating, reviews, ville });

  const r = rating != null && rating !== '' ? String(rating).replace('.', ',') : 'non renseignée';
  const n = reviews != null && reviews !== '' ? Number(reviews) : 'non renseigné';

  const prompt = `Tu écris pour Enomia (outils et annuaires pour la location courte durée). Marc contacte une ${seg.noun} repérée parmi les mieux notées de sa ville sur Google, pour la faire figurer dans une sélection. Écris l'OBSERVATION : la 1re phrase de l'email, juste après "Bonjour [Prénom],", qui montre qu'on a remarqué cet établissement.

Données disponibles (les SEULES que tu as le droit d'utiliser, n'invente RIEN d'autre) :
- Nom de l'établissement : "${nom_boite}"
- Ville : ${ville}
- Note Google : ${r}
- Nombre d'avis Google : ${n}

Règles STRICTES :
- 1 phrase, 12 à 28 mots, vouvoiement, français.
- Factuel et valorisant. Appuie-toi sur la note et le nombre d'avis. Tu peux mentionner une caractéristique SEULEMENT si elle est explicite dans le NOM de l'établissement (ex. "spa privatif", "cabane perchée"). Sinon n'invente aucune caractéristique (pas de spa, jacuzzi, vue, piscine si ce n'est pas dans le nom).
- Jamais de critique, jamais de "mais", "cependant", "il manque".
- Chiffres en chiffres. La note s'écrit avec une virgule (ex. 4,8/5).
- Pas d'emoji, pas de tiret cadratin (—), pas de tiret long (–), pas de flèche (→).
- Ne mentionne pas Enomia ni la sélection (la suite de l'email s'en charge).

Exemple de ton (ne le recopie pas tel quel, adapte aux données ci-dessus) : "${seg.example}"

Réponds UNIQUEMENT par la phrase, sans guillemets ni préfixe.`;

  try {
    const out = await callClaudeMax(prompt, { model: MODEL });
    let cleaned = String(out || '').trim().replace(/^["'«»]+|["'«»]+$/g, '').trim();
    cleaned = cleaned.split('\n')[0].trim(); // garde la 1re ligne uniquement
    const bad = !cleaned
      || cleaned.length < 12
      || NEGATIVE_RE.test(cleaned)
      || /[—–→]/.test(cleaned)
      || /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(cleaned);
    if (bad) {
      log(`  ⚠️ obs badge rejetée ("${cleaned.slice(0, 60)}") → fallback`);
      return fallbackObservation({ rating, reviews, ville });
    }
    return cleaned;
  } catch (e) {
    log(`  ⚠️ obs badge fallback (${e.message?.slice(0, 80)})`);
    return fallbackObservation({ rating, reviews, ville });
  }
}
