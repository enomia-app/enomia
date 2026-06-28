// scripts/backlinks-send-daily/badge-templates.mjs
// Templates "badge" camp 3/4/5 (conciergerie, love room, cabane) — wording VALIDÉ
// le 27/06. On contacte des ENTREPRISES repérées via Google Places parmi les
// mieux notées de leur ville, pour les faire figurer dans la sélection Enomia
// (page ville/niche) en échange d'un lien/badge (backlink).
//
// Règles (conventions Enomia) : vouvoiement, chiffres en chiffres, zéro tiret
// cadratin/long/flèche, pas d'emoji, 1 lien max.
//   - L'observation (1re phrase) est générée par LLM (Sonnet/Claude Max) dans
//     badge-observation.mjs, jamais ici.
//   - L'opt-out + le header List-Unsubscribe sont ajoutés par mailer.mjs.
//   - N'envoyer que si page_en_ligne = oui (filtré par le sender).

export const BADGE_SEGMENTS = ['conciergerie', 'loveroom', 'cabane'];
export const SEGMENT_LABEL = { conciergerie: 'conciergerie', loveroom: 'love room', cabane: 'cabane' };

// Article par zone cabane (la / le / les / l') pour écrire "pour la Bretagne",
// "pour le Jura", "pour les Vosges", "pour l'Auvergne". Couvre les 45 zones de
// cabane-zones.json. Fallback (slug inconnu) : pas d'article (mieux qu'un faux).
const ZONE_ARTICLE = {
  bretagne: 'la', normandie: 'la', auvergne: "l'", vosges: 'les', dordogne: 'la',
  occitanie: "l'", jura: 'le', ardeche: "l'", provence: 'la', alsace: "l'",
  landes: 'les', 'ile-de-france': "l'", 'pays-basque': 'le', morbihan: 'le',
  vendee: 'la', 'rhone-alpes': 'la', 'pays-de-la-loire': 'les', gironde: 'la',
  'haute-savoie': 'la', oise: "l'", var: 'le', gers: 'le', pyrenees: 'les',
  chartreuse: 'la', 'franche-comte': 'la', lot: 'le', correze: 'la',
  'charente-maritime': 'la', savoie: 'la', finistere: 'le', drome: 'la',
  isere: "l'", gard: 'le', 'puy-de-dome': 'le', aveyron: "l'", aude: "l'",
  cantal: 'le', herault: "l'", ain: "l'", tarn: 'le', vaucluse: 'le',
  doubs: 'le', calvados: 'le', sologne: 'la',
};

/** "pour la Bretagne" / "pour le Jura" / "pour les Vosges" / "pour l'Auvergne". */
export function zonePour(slug, name) {
  const art = ZONE_ARTICLE[slug];
  if (!art) return `pour ${name}`;
  return art === "l'" ? `pour l'${name}` : `pour ${art} ${name}`;
}

/**
 * Ligne d'accroche selon la confiance sur l'identité (haute confiance only :
 * un nom faux est pire que pas de nom).
 *   - prénom connu (a-propos ou local-part prenom.nom@) → "Bonjour Prénom,"
 *   - sinon nom du gérant (mentions-légales)            → "Bonjour M. Nom,"
 *   - sinon                                             → "Bonjour,"
 */
export function buildGreeting({ prenom, nom_gerant } = {}) {
  if (prenom && String(prenom).trim()) return `Bonjour ${String(prenom).trim()},`;
  if (nom_gerant && String(nom_gerant).trim()) return `Bonjour M. ${String(nom_gerant).trim()},`;
  return 'Bonjour,';
}

// Sujets — NON fournis dans la spec du 27/06, proposés ici (à valider par Marc).
const SUBJECTS = {
  conciergerie: ({ ville }) => [
    `Votre conciergerie dans la sélection de ${ville}`,
    `Les meilleures conciergeries de ${ville}`,
    `${ville} : votre conciergerie mise en avant`,
  ],
  loveroom: ({ ville }) => [
    `Votre love room dans la sélection de ${ville}`,
    `Les plus belles love rooms de ${ville}`,
  ],
  cabane: () => [
    'Votre cabane dans notre sélection insolite',
    'Les plus belles cabanes insolites',
  ],
};

// Texte qui suit immédiatement l'observation (sert aussi à détecter en QA une
// observation manquante : si le 2e paragraphe démarre par ce lead-in, l'obs est vide).
const LEADIN = {
  conciergerie: 'Chez Enomia, nous avons comparé',
  loveroom: 'Nous référençons les plus belles love rooms',
  cabane: 'Nous référençons les meilleures cabanes',
};

const BODIES = {
  conciergerie: ({ greeting, observation, ville, page_url }) => `${greeting}

${observation} ${LEADIN.conciergerie} les conciergeries de ${ville} sur quatre critères (avis clients, transparence des prix, étendue des services, nombre de biens gérés), et la vôtre figure dans notre sélection des meilleures de la ville :

${page_url}

Beaucoup de propriétaires consultent ce type de comparatif avant de déléguer leur bien, donc cette sélection peut vous servir d'argument de crédibilité. Si vous souhaitez l'afficher sur votre site (nous pouvons fournir un visuel), un lien vers la page permet à vos visiteurs de vérifier la sélection.

Qu'en pensez-vous ?

Marc Chenut
marc@enomia.app`,

  loveroom: ({ greeting, observation, ville, page_url }) => `${greeting}

${observation} ${LEADIN.loveroom} par ville sur Enomia, pour aider les voyageurs à trouver une adresse de qualité. Nous avons retenu la vôtre dans notre sélection pour ${ville} :

${page_url}

Y figurer vous donne de la visibilité auprès des voyageurs, qui comparent toujours plusieurs adresses avant de réserver. Si la fiche vous convient, n'hésitez pas à la relayer depuis votre site, ça renforce votre présence en ligne et nous aide à faire connaître la sélection.

Qu'en pensez-vous ?

Marc Chenut
marc@enomia.app`,

  cabane: ({ greeting, observation, villePhrase, page_url }) => `${greeting}

${observation} ${LEADIN.cabane} et hébergements insolites par région sur Enomia. Nous avons retenu la vôtre dans notre sélection ${villePhrase} :

${page_url}

Les voyageurs en quête d'insolite comparent plusieurs adresses avant de réserver, donc y figurer vous apporte de la visibilité. Si la fiche vous convient, un lien ou une mention depuis votre site renforce votre présence et nous aide à faire connaître la sélection.

Qu'en pensez-vous ?

Marc Chenut
marc@enomia.app`,
};

/**
 * Assemble le pitch badge (subject + texte brut). L'observation est passée en
 * paramètre (déjà générée par badge-observation.mjs). Le HTML + opt-out sont
 * ajoutés ensuite par mailer.sendHtmlEmail.
 * @returns {{subject: string, text: string, segment: string}}
 */
export function buildBadgePitch({ segment, greeting, observation, ville, page_url, subjectIndex }) {
  const body = BODIES[segment];
  if (!body) throw new Error(`Segment badge inconnu: ${segment}`);
  const subjects = SUBJECTS[segment]({ ville });
  const idx = Number.isInteger(subjectIndex)
    ? ((subjectIndex % subjects.length) + subjects.length) % subjects.length
    : Math.floor(Math.random() * subjects.length);
  // cabane : zone avec article ("pour la Bretagne"). Slug dérivé du page_url.
  const slug = segment === 'cabane' ? String(page_url || '').replace(/\/+$/, '').split('/').pop() : '';
  const villePhrase = segment === 'cabane' ? zonePour(slug, ville) : `pour ${ville}`;
  return {
    subject: subjects[idx],
    text: body({ greeting: greeting || 'Bonjour,', observation: String(observation || '').trim(), ville, villePhrase, page_url }),
    segment,
  };
}

/** QA auto avant envoi. { ok, reasons }. */
export function qaBadgePitch({ subject, text, segment }, { page_url } = {}) {
  const reasons = [];
  const wc = text.split(/\s+/).length;
  if (wc < 70 || wc > 320) reasons.push(`longueur (${wc} mots)`);
  if (page_url && !text.includes(page_url)) reasons.push('page_url absente');
  if (!text.includes('marc@enomia.app')) reasons.push('signature email absente');
  if (!text.includes('Marc Chenut')) reasons.push('signature nom absente');

  const placeholders = ['[ville]', '[prénom]', '[prenom]', '[nom]', '[zone]', '[observation]', '[url', '{', '}', 'undefined', '[object object]'];
  const lower = text.toLowerCase();
  for (const p of placeholders) if (lower.includes(p)) reasons.push(`placeholder "${p}"`);

  if (/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/u.test(text)) reasons.push('emoji');
  if (text.includes('—') || text.includes('–') || text.includes('→')) reasons.push('tiret/flèche');
  if (!subject || subject.length < 10) reasons.push('subject court');

  // Observation manquante : le 2e paragraphe démarre directement par le lead-in.
  const paras = text.split(/\n\s*\n/);
  const lead = segment && LEADIN[segment];
  if (lead && paras[1] && paras[1].trimStart().startsWith(lead)) reasons.push('observation vide');

  return { ok: reasons.length === 0, reasons };
}
