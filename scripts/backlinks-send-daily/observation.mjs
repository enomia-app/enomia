// scripts/backlinks-send-daily/observation.mjs
// Génération de l'observation personnalisée (compliment sincère et spécifique
// sur l'article cible), insérée dans le pitch juste après le titre.
//
// Partagé entre send-daily.mjs (envoi auto quotidien) et export-all-forms.mjs
// (utilitaire formulaires manuels) pour éviter deux versions divergentes.
//
// Utilise Opus 4.7 via Claude Max (OAuth, gratuit sous l'abonnement) — jamais
// l'API payante. Cf. memory/incident_api_spike_2026-05.

import { callClaudeMax } from '../lib/claude-cli.mjs';
import { OUTREACH_BRIEF, OUTIL_DETAILS } from './pitch-templates.mjs';

// Fallback positif et neutre si la génération échoue (jamais une critique).
export const OBSERVATION_FALLBACK = 'Votre manière d\'aborder le sujet est vraiment concrète pour vos lecteurs.';

// Détecte une formulation négative/critique qu'on ne veut jamais envoyer.
const NEGATIVE_RE = /\b(il manque|manque de|vous ne |n'abordez|n'évoquez|n'aborde|dommage|regrette|aurait pu|aurait été|cependant)\b/;

/**
 * Génère l'observation pour un article cible + un outil donné.
 * @param {{title: string, text: string, outil: string}} article
 * @param {(msg: string) => void} [log] logger optionnel (défaut console.error)
 * @returns {Promise<string>}
 */
export async function generateObservation({ title, text, outil }, log = console.error) {
  const outilDesc = OUTIL_DETAILS[outil] || 'un outil gratuit pour les loueurs en courte durée';

  const prompt = `${OUTREACH_BRIEF}

Ta tâche : écrire l'observation personnalisée qui sera insérée dans l'email, juste après la phrase "J'ai lu votre article «[titre]»." et juste avant la présentation de notre outil gratuit. C'est le moment où Marc montre qu'il a vraiment lu l'article.

Règles de ton (TRÈS IMPORTANT) :
- Compliment SINCÈRE et SPÉCIFIQUE : pointe une vraie qualité de l'article (un angle bien vu, un exemple concret, une explication claire, une donnée utile, une structure pédagogique). Quelque chose qu'on ne pourrait pas dire d'un autre article.
- JAMAIS de critique, jamais de manque. N'écris JAMAIS "vous ne parlez pas de", "il manque", "vous n'abordez pas", "mais", "cependant", "dommage que". On valorise leur travail, on ne pointe aucun défaut. C'est une règle absolue.
- Le ton est celui d'un confrère du métier qui a lu et apprécié, pas d'un commercial ni d'un élève qui récite.
- 1 à 2 phrases courtes, 12 à 30 mots au total.
- Français, vouvoiement.
- Pas de superlatif marketing creux ("article exceptionnel", "incroyable"). Un compliment précis vaut mieux qu'un éloge vague.
- Pas d'emoji, pas de tiret cadratin (—), pas de tiret long (–), pas de flèche (→).
- Ne mentionne PAS notre outil ni Enomia (la suite de l'email s'en charge). Ici, on parle UNIQUEMENT de leur article.

Pour ton information seulement (ne le cite pas), l'outil que Marc proposera ensuite : ${outilDesc}.

Titre de l'article : "${title}"

Contenu de l'article (extrait) :
${(text || '').slice(0, 2500)}

Réponds UNIQUEMENT par l'observation (1 à 2 phrases), sans guillemets, sans préfixe, sans commentaire.`;

  try {
    const out = await callClaudeMax(prompt, { model: 'claude-opus-4-7' });
    const cleaned = (out || '').trim().replace(/^["'«»]+|["'«»]+$/g, '').trim();
    const negative = NEGATIVE_RE.test(cleaned.toLowerCase());
    if (!cleaned || cleaned.length < 10 || negative) {
      if (negative) log(`  ⚠️ observation négative filtrée: "${cleaned.slice(0, 80)}" → fallback`);
      return OBSERVATION_FALLBACK;
    }
    return cleaned;
  } catch (e) {
    log(`  ⚠️ generateObservation fallback (${e.message?.slice(0, 80)})`);
    return OBSERVATION_FALLBACK;
  }
}
