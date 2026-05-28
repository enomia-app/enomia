// scripts/backlinks-send-daily/pitch-templates.mjs
// 4 templates pitch Enomia (simulateur, contrat, facture, taxe_sejour).
// Pipeline v2.1 — l'outil à pitcher est choisi dynamiquement par send-daily.

// ─── CONTEXTE pour la génération d'observation (chargé dans le prompt Opus) ──
// Donne au modèle qui on est, qui on contacte, qui sont leurs lecteurs, et
// pourquoi. Permet une observation fine et juste plutôt que générique.
export const OUTREACH_BRIEF = `Contexte de la mission :

Tu écris pour Enomia, un éditeur français d'outils gratuits en ligne dédiés à la location courte durée (Airbnb, Booking, locations saisonnières). Marc Chenut, le fondateur, contacte par email des blogs et médias spécialisés pour leur proposer d'ajouter l'un de nos outils gratuits en complément de leurs articles, comme ressource utile à leurs lecteurs. L'objectif est qu'ils citent l'outil avec un lien (backlink), donc le message doit être sincère, utile et donnant-donnant, jamais quémandeur.

La cible qu'on contacte : des blogueurs, rédacteurs et médias de niche sur la location courte durée, l'investissement locatif Airbnb, la fiscalité LMNP, la gestion locative, les conciergeries. Ce sont des gens qui connaissent leur sujet et publient du contenu de fond. On s'adresse à un confrère qui maîtrise le domaine, pas à un débutant.

Leurs lecteurs : des propriétaires et investisseurs en courte durée, des hôtes Airbnb, des personnes qui veulent se lancer ou optimiser leur location saisonnière. Ils cherchent du concret : combien ça rapporte, comment être en règle, quels documents utiliser, combien de taxe collecter.

Nos outils sont gratuits, sans inscription, et pensés spécifiquement pour la courte durée, là où les outils génériques (modèles de bail classiques, calculs de rentabilité immobilière standard) ne couvrent pas les spécificités du métier.`;

// Description riche de chaque outil (pour informer le modèle, pas pour citation directe).
export const OUTIL_DETAILS = {
  simulateur: "un simulateur de rentabilité gratuit spécifique à la courte durée, qui intègre toutes les charges souvent oubliées par les investisseurs (ménage, conciergerie, blanchisserie, taxe de séjour, maintenance, logiciel, comptable) pour chiffrer concrètement un projet de location Airbnb",
  contrat: "un modèle de contrat de location saisonnière gratuit, à jour de la loi Le Meur, avec les clauses spécifiques à la courte durée que les modèles génériques oublient (caution, ménage, départ anticipé, état des lieux)",
  facture: "un générateur de factures gratuit pour la courte durée, qui pré-remplit les mentions obligatoires (TVA, numérotation), gère les commissions Airbnb et Booking en déduction et sauvegarde l'historique pour la compta",
  taxe_sejour: "un calculateur de taxe de séjour gratuit couvrant toutes les communes françaises avec leurs tarifs à jour, qui sort le montant exact à collecter selon la commune, le type de logement et le nombre de nuitées",
};

const TEMPLATES = {
  simulateur: {
    url: 'https://www.enomia.app/simulateur-rentabilite-airbnb',
    subject_options: [
      'Compléter votre article avec un simulateur de rentabilité ?',
      'Un simulateur pour les lecteurs de votre article',
      'Outil de rentabilité Airbnb pour vos lecteurs',
    ],
    body: ({ prenom, titre, observation }) => `Bonjour ${prenom || ''},

J'ai lu votre article "${titre}". ${observation}

Nous avons développé chez Enomia un simulateur de rentabilité gratuit spécifique à la courte durée, qui intègre l'ensemble des charges souvent oubliées par les investisseurs (eau, élec, logiciel, consommable, maintenance, ménages, comptable, conciergerie, blanchisserie, taxe de séjour) avec sauvegarde possible des projets.

Je vous propose de l'ajouter en complément à votre article, pour permettre à vos lecteurs de chiffrer concrètement leur projet :
https://www.enomia.app/simulateur-rentabilite-airbnb

Qu'en pensez-vous ?

Marc Chenut
marc@enomia.app
`.replace('Bonjour ,', 'Bonjour,'),
  },

  contrat: {
    url: 'https://www.enomia.app/contrat-location-saisonniere',
    subject_options: [
      'Un modèle de contrat pour les lecteurs de votre article',
      'Contrat de location saisonnière, en complément de votre article',
      'Compléter votre article avec un modèle de contrat ?',
    ],
    body: ({ prenom, titre, observation }) => `Bonjour ${prenom || ''},

Je suis tombé sur votre article "${titre}". ${observation}

Nous mettons à disposition chez Enomia un modèle de contrat de location saisonnière gratuit, à jour de la loi Le Meur 2024, avec les clauses spécifiques courte durée que les modèles génériques oublient (caution, ménage, départ anticipé, conditions d'annulation, état des lieux entrée/sortie, règlement intérieur). Téléchargeable directement en PDF, sans inscription.

Je vous propose de l'ajouter en ressource à la fin de votre article, ça donne à vos lecteurs un document directement utilisable pour leur prochaine location :
https://www.enomia.app/contrat-location-saisonniere

Qu'en pensez-vous ?

Marc Chenut
marc@enomia.app
`.replace('Bonjour ,', 'Bonjour,'),
  },

  facture: {
    url: 'https://www.enomia.app/facture-airbnb',
    subject_options: [
      'Un générateur de factures pour les lecteurs de votre article',
      'Compléter votre article avec un outil de facturation ?',
      'Génération de factures conformes en courte durée',
    ],
    body: ({ prenom, titre, observation }) => `Bonjour ${prenom || ''},

J'ai lu votre article "${titre}". ${observation}

Nous avons développé chez Enomia un générateur de factures gratuit pour la courte durée, qui pré-remplit automatiquement les mentions obligatoires (TVA non applicable art. 293 B du CGI, numérotation séquentielle, infos hôte et voyageur), gère les commissions Airbnb et Booking en déduction, et sauvegarde l'historique pour la compta annuelle. Pas d'inscription, export PDF direct.

Je vous propose de l'ajouter en ressource dans votre article, ça permet à vos lecteurs de générer une facture conforme en deux minutes :
https://www.enomia.app/facture-airbnb

Qu'en pensez-vous ?

Marc Chenut
marc@enomia.app
`.replace('Bonjour ,', 'Bonjour,'),
  },

  taxe_sejour: {
    url: 'https://www.enomia.app/calcul-taxe-de-sejour',
    subject_options: [
      'Calculateur de taxe de séjour pour vos lecteurs',
      'Outil de calcul taxe de séjour, en complément de votre article',
      'Compléter votre article avec un calculateur taxe de séjour ?',
    ],
    body: ({ prenom, titre, observation }) => `Bonjour ${prenom || ''},

J'ai lu votre article "${titre}". ${observation}

Nous avons développé chez Enomia un calculateur de taxe de séjour gratuit, qui couvre toutes les communes françaises avec leurs tarifs à jour (mise à jour automatique chaque année via le fichier officiel DGFiP). Il sort le montant exact à collecter selon la commune, le type de logement et le nombre de nuitées. Vos lecteurs qui prennent des réservations en direct, hors plateforme, n'ont jamais à se demander combien collecter.

Je vous propose de l'ajouter en ressource dans votre article, ça donne à vos lecteurs un outil concret qu'ils peuvent utiliser à chaque réservation :
https://www.enomia.app/calcul-taxe-de-sejour

Qu'en pensez-vous ?

Marc Chenut
marc@enomia.app
`.replace('Bonjour ,', 'Bonjour,'),
  },
};

/**
 * Construit le pitch complet (subject + body) pour un prospect + un outil.
 */
export function buildPitch({ outil, prenom, titre, observation }) {
  const tpl = TEMPLATES[outil];
  if (!tpl) throw new Error(`Outil inconnu: ${outil}`);
  const subject = tpl.subject_options[Math.floor(Math.random() * tpl.subject_options.length)];
  const body = tpl.body({ prenom, titre, observation });
  return { subject, body, outil_url: tpl.url };
}

/**
 * QA auto sur le pitch avant envoi.
 * Retourne { ok: bool, reasons: string[] }.
 */
export function qaPitch(pitch) {
  const reasons = [];
  const { subject, body, outil_url } = pitch;

  const wc = body.split(/\s+/).length;
  if (wc < 80 || wc > 400) reasons.push(`longueur (${wc} mots, attendu 80-400)`);

  if (!body.includes(outil_url)) reasons.push('URL outil absente du body');
  if (!body.includes('marc@enomia.app')) reasons.push('signature email absente');
  if (!body.includes('Marc Chenut')) reasons.push('signature nom absente');

  const placeholders = [
    '[titre]', '[Prénom]', '[prenom]', '[Nom]', '[observation]',
    '{', '}', 'undefined', '[object Object]',
  ];
  const lowerBody = body.toLowerCase();
  for (const p of placeholders) {
    if (lowerBody.includes(p.toLowerCase())) reasons.push(`placeholder "${p}"`);
  }

  if (/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/u.test(body)) reasons.push('emoji détecté');
  if (body.includes('—') || body.includes('–') || body.includes('→')) {
    reasons.push('tiret cadratin/long/flèche');
  }

  if (!subject || subject.length < 10) reasons.push('subject trop court');
  if (body.match(/J'ai lu votre article "[^"]+"\.\s*\.\s*\n/)) {
    reasons.push('observation manquante après titre');
  }

  return { ok: reasons.length === 0, reasons };
}

/**
 * Choisit dynamiquement quel outil pitcher pour un candidat donné.
 *
 * Règles :
 *   - Si is_conciergerie ET simulateur pas présent → simulateur (seul outil non-conflictuel)
 *   - Si is_conciergerie ET simulateur déjà présent → null (skip, conflit d'intérêt sur autres outils)
 *   - Sinon : priorité simulateur > facture > contrat > taxe_sejour, on prend le premier MANQUANT
 *   - Si tous présents → null (skip)
 *
 * Bias selon kw_origin_bucket : si le KW source est dans le bucket "contrat" et qu'on a
 * le choix entre 2 outils manquants → on privilégie celui aligné avec le KW source.
 *
 * @returns string | null
 */
export function chooseOutilToPitch({ outils_presents = [], is_conciergerie = false, kw_origin_bucket = 'generic_lcd' }) {
  const present = new Set(outils_presents);

  if (is_conciergerie) {
    return present.has('simulateur') ? null : 'simulateur';
  }

  // Tous présents → skip
  if (present.has('simulateur') && present.has('facture') && present.has('contrat') && present.has('taxe_sejour')) {
    return null;
  }

  // Ordre de priorité par défaut
  const defaultOrder = ['simulateur', 'facture', 'contrat', 'taxe_sejour'];

  // Bias selon bucket KW : on remonte l'outil aligné en première position
  const bucketAlign = { simulateur: 'simulateur', contrat: 'contrat', facture: 'facture' };
  const aligned = bucketAlign[kw_origin_bucket];
  const order = aligned && !present.has(aligned)
    ? [aligned, ...defaultOrder.filter(o => o !== aligned)]
    : defaultOrder;

  for (const o of order) {
    if (!present.has(o)) return o;
  }
  return null;
}
