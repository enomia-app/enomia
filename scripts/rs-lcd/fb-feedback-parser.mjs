/**
 * fb-feedback-parser.mjs — Module partagé : applique les retours de Marc aux drafts
 *
 * Remplace l'ancien parseValidationViaClaude (Haiku + format OK/SKIP/EDIT trop rigide) +
 * fb-build-validated.mjs (regex sur texte intermédiaire, brittle).
 *
 * Approche : Sonnet lit le mail de Marc en langage naturel + les drafts originaux,
 * et produit directement les drafts finaux prêts à poster (texte modifié intégrant
 * les ajouts/corrections/nuances de Marc, ou inchangé s'il a juste validé).
 *
 * Capture aussi `marcFeedback` (résumé 1 phrase de ce qu'il a demandé) pour
 * alimenter à terme une mémoire d'apprentissage (`feedback_drafts_marc.md`).
 */

import Anthropic from '@anthropic-ai/sdk';

export async function applyMarcFeedback(replyText, drafts) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const postIds = Object.keys(drafts);

  const prompt = `Tu analyses une réponse email de Marc Chenut à un récap de propositions de commentaires Facebook que l'agent veut poster pour lui. Marc valide ou modifie chaque draft.

# CONTEXTE
Marc Chenut, expert location courte durée français, méthode 97%. Il commente des posts de propriétaires sur Facebook. L'agent lui a proposé ${postIds.length} drafts ce matin, et Marc a répondu par email avec des retours qualitatifs : validations simples, ajouts d'informations, corrections d'erreurs factuelles, nuances de ton, ou demandes de skip.

# DRAFTS ORIGINAUX (avant retours Marc)
${JSON.stringify(drafts, null, 2)}

# RÉPONSE DE MARC
"""
${replyText}
"""

# TÂCHE
Pour CHAQUE postId présent dans les drafts originaux (${postIds.join(', ')}), analyse ce que Marc a dit (ou n'a pas dit) à propos de ce draft précis, et produis le TEXTE FINAL prêt à poster.

Types de retours possibles à traiter :
- **Pas de mention / "ok" implicite** → garde le draft original TEL QUEL (text inchangé, edited=false)
- **AJOUT** (ex: "On peut mettre l'outil de contrat ici", "Ajouter : mon anecdote Urssaf 45 000€") → INTÈGRE l'ajout naturellement dans le draft existant, sans casser la fluidité, dans le ton Marc, en placement logique
- **CORRECTION FACTUELLE** (ex: "C'est 90 jours max, pas 120") → corrige le chiffre/fait dans la version originale
- **NUANCE / MODIFICATION** (ex: "Pas vrai pour les T2, oui pour les T5") → reformule pour intégrer la nuance proprement
- **RÉÉCRITURE COMPLÈTE** (Marc fournit une nouvelle version) → utilise la version Marc telle quelle
- **SKIP / refus** (ex: "vire celui-là", "skip g1.4") → action="skip"

# RÈGLES DE STYLE (à TOUJOURS respecter dans le texte final)
- Tutoiement
- Direct, pair-à-pair, phrases courtes
- ZÉRO emoji, ZÉRO tiret long (—), ZÉRO signature
- 3-6 phrases généralement (peut être plus long si Marc ajoute du contenu)
- Pas d'auto-promo aveugle, max 1 lien Enomia par commentaire
- Si Marc demande d'ajouter un lien Enomia (ex: "On peut mettre l'outil de contrat ici") : insère le lien en intégrant le contexte ("tu peux utiliser X qui fait Y, c'est ici : URL"), max 1 par draft

# FORMAT DE SORTIE — JSON STRICT, RIEN D'AUTRE (pas de markdown, pas de \`\`\`)

{
  "drafts": [
    {
      "postId": "g1.1",
      "url": "<url originale>",
      "text": "<draft final à poster>",
      "action": "post",
      "edited": true,
      "marcFeedback": "<résumé 1 phrase de ce que Marc a demandé, vide si rien>"
    }
  ],
  "ambiguous": false,
  "reason": ""
}

Règles de sortie :
- Inclus TOUS les postIds des drafts originaux (${postIds.length} entrées)
- action="post" par défaut, "skip" UNIQUEMENT si Marc demande explicitement de virer
- edited=true si le texte diffère du draft original (même léger), false si strictement identique
- marcFeedback = résumé court utile pour mémoire d'apprentissage (ex: "Préfère T2 avec checkout 11h, 6h uniquement pour grands biens 200m2"). Vide si Marc n'a rien dit pour ce draft.
- Si la réponse de Marc est totalement vide ou hors-sujet : ambiguous=true + reason explicative`;

  console.log(`Appel Sonnet (${postIds.length} drafts à traiter)...`);
  const resp = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = resp.content[0].text.trim();
  const cleaned = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned);
}

/**
 * Transforme le résultat de applyMarcFeedback en array prêt pour fb-post.mjs
 * Format : [{postId, url, text}, ...]
 */
export function toValidatedArray(parsed) {
  return (parsed.drafts || [])
    .filter(d => d.action === 'post')
    .map(d => ({ postId: d.postId, url: d.url, text: d.text, edited: d.edited }));
}
