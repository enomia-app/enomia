// scripts/backlinks-send-daily/badge-templates.mjs
// Templates "badge" camp 3/4/5 (conciergerie, love room, cabane).
//
// On contacte des ENTREPRISES repérées via Google Places parmi les mieux notées
// de leur ville, pour les faire figurer dans la sélection Enomia (page ville/niche)
// en échange d'un lien/badge (backlink).
//
// DEUX variantes par prospect (décidé avec Marc) :
//   - "retenu" (wording validé 27/06) → SI le prospect figure RÉELLEMENT sur la
//     page (détecté par domaine dans le sender). Promesse vraie.
//   - "offre" → s'il n'y figure pas encore : on propose de l'ajouter (honnête,
//     on l'ajoute s'il dit oui). Évite une promesse falsifiable au clic.
//
// Règles (conventions Enomia) : vouvoiement, chiffres en chiffres, zéro tiret
// cadratin/long/flèche, pas d'emoji, 1 lien max. Observation (1re phrase) = LLM
// Sonnet (badge-observation.mjs). Opt-out + List-Unsubscribe = mailer.mjs.

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
 *   - prénom connu → "Bonjour Prénom,"  ·  sinon nom gérant → "Bonjour M. Nom,"  ·  sinon "Bonjour,"
 */
export function buildGreeting({ prenom, nom_gerant } = {}) {
  if (prenom && String(prenom).trim()) return `Bonjour ${String(prenom).trim()},`;
  if (nom_gerant && String(nom_gerant).trim()) return `Bonjour M. ${String(nom_gerant).trim()},`;
  return 'Bonjour,';
}

// ─── Sujets ───────────────────────────────────────────────────────────────
// Sujets NON fournis dans la spec, proposés (validés par Marc).
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
const OFFER_SUBJECTS = {
  loveroom: ({ ville }) => [
    `Votre love room dans l'annuaire de ${ville} ?`,
    `Ajouter votre love room à la sélection de ${ville}`,
  ],
  cabane: () => [
    'Votre cabane dans notre annuaire insolite ?',
    'Ajouter votre cabane à la sélection',
  ],
};

// Lead-in = texte juste après l'observation (sert aussi à détecter en QA une
// observation manquante : si le 2e paragraphe démarre par là, l'obs est vide).
const LEADIN = {
  conciergerie: 'Chez Enomia, nous avons comparé',
  loveroom: 'Nous référençons les plus belles love rooms',
  cabane: 'Nous référençons les meilleures cabanes',
};
const OFFER_LEADIN = {
  loveroom: 'Je tiens sur Enomia un annuaire des plus belles love rooms',
  cabane: 'Je tiens sur Enomia un annuaire des plus belles cabanes',
};

// ─── Corps "retenu" (validé) — prospect réellement listé sur la page ────────
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

// ─── Corps "offre" — prospect PAS encore listé : on propose de l'ajouter ────
const OFFER_BODIES = {
  loveroom: ({ greeting, observation, ville, page_url }) => `${greeting}

${observation} ${OFFER_LEADIN.loveroom} par ville, pour aider les voyageurs à trouver une adresse de qualité. J'aimerais y ajouter la vôtre dans la sélection de ${ville} :

${page_url}

Y figurer vous donne de la visibilité auprès des voyageurs, qui comparent toujours plusieurs adresses avant de réserver. Si ça vous intéresse, dites-le moi et je l'ajoute ; un lien depuis votre site renforce votre présence et nous aide à faire connaître la sélection.

Qu'en pensez-vous ?

Marc Chenut
marc@enomia.app`,

  cabane: ({ greeting, observation, villePhrase, page_url }) => `${greeting}

${observation} ${OFFER_LEADIN.cabane} et hébergements insolites par région. J'aimerais y ajouter la vôtre dans la sélection ${villePhrase} :

${page_url}

Les voyageurs en quête d'insolite comparent plusieurs adresses avant de réserver, donc y figurer vous apporte de la visibilité. Si ça vous intéresse, dites-le moi et je l'ajoute ; un lien ou une mention depuis votre site renforce votre présence et nous aide à faire connaître la sélection.

Qu'en pensez-vous ?

Marc Chenut
marc@enomia.app`,
};

/**
 * Assemble le pitch badge (subject + texte brut).
 * @param {{segment, listed, greeting, observation, ville, page_url, subjectIndex}} p
 *   listed=true  → variante "retenu" (le prospect figure sur la page).
 *   listed=false → variante "offre" pour les niches (conciergerie retombe sur "retenu", segment en pause).
 * @returns {{subject, text, segment, variant}}
 */
export function buildBadgePitch({ segment, listed = false, greeting, observation, ville, page_url, subjectIndex }) {
  const useOffer = !listed && !!OFFER_BODIES[segment];
  const body = useOffer ? OFFER_BODIES[segment] : BODIES[segment];
  if (!body) throw new Error(`Segment badge inconnu: ${segment}`);
  const subjFn = useOffer ? OFFER_SUBJECTS[segment] : SUBJECTS[segment];
  const subjects = subjFn({ ville });
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
    variant: useOffer ? 'offre' : 'retenu',
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

  // Observation manquante : le 2e paragraphe démarre directement par un lead-in.
  const paras = text.split(/\n\s*\n/);
  const leads = [LEADIN[segment], OFFER_LEADIN[segment]].filter(Boolean);
  if (paras[1] && leads.some(l => paras[1].trimStart().startsWith(l))) reasons.push('observation vide');

  return { ok: reasons.length === 0, reasons };
}
