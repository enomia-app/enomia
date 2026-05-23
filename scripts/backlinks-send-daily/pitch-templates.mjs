// scripts/backlinks-send-daily/pitch-templates.mjs
// Templates des 3 pitches Enomia (simulateur, contrat, facture).

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
};

/**
 * Construit le pitch complet (subject + body) pour un prospect.
 */
export function buildPitch({ outil_cible, prenom, titre, observation }) {
  const tpl = TEMPLATES[outil_cible];
  if (!tpl) throw new Error(`Outil inconnu: ${outil_cible}`);
  const subject = tpl.subject_options[Math.floor(Math.random() * tpl.subject_options.length)];
  const body = tpl.body({ prenom, titre, observation });
  return { subject, body, outil_url: tpl.url };
}

/**
 * QA auto sur le pitch avant envoi.
 * Retourne { ok: bool, reasons: string[] }.
 */
export function qaPitch(pitch, prospect) {
  const reasons = [];
  const { subject, body, outil_url } = pitch;

  // 1. Longueur body
  const wc = body.split(/\s+/).length;
  if (wc < 80 || wc > 350) reasons.push(`longueur (${wc} mots, attendu 80-350)`);

  // 2. URL outil présente
  if (!body.includes(outil_url)) reasons.push('URL outil absente du body');

  // 3. Signature présente
  if (!body.includes('marc@enomia.app')) reasons.push('signature email absente');
  if (!body.includes('Marc Chenut')) reasons.push('signature nom absente');

  // 4. Pas de placeholder
  const placeholders = [
    '[titre]', '[Prénom]', '[prenom]', '[Nom]', '[observation]',
    '{', '}', 'undefined', '[object Object]',
  ];
  const lowerBody = body.toLowerCase();
  for (const p of placeholders) {
    if (lowerBody.includes(p.toLowerCase())) reasons.push(`placeholder "${p}" présent`);
  }

  // 5. Pas d'emoji
  if (/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/u.test(body)) reasons.push('emoji détecté');

  // 6. Pas de tirets cadratins / longs / flèches
  if (body.includes('—') || body.includes('–') || body.includes('→')) {
    reasons.push('tiret cadratin/long/flèche détecté');
  }

  // 7. Subject pas vide
  if (!subject || subject.length < 10) reasons.push('subject trop court');

  // 8. Observation présente (pas juste "")
  if (body.match(/J'ai lu votre article "[^"]+"\.\s*\.\s*\n/)) {
    reasons.push('observation manquante après le titre');
  }

  return { ok: reasons.length === 0, reasons };
}
