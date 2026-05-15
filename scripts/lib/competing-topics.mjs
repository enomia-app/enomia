// Détecte les topics que le prospect couvre déjà via URL externe.
// Distingue "a l'OUTIL/page dédiée" (narrow) vs "mentionne le sujet" (broad).
// Pour le filtre par angle, on veut "a l'outil" (sinon on exclut tous les articles éditoriaux).

export function detectCompetingTopics({ url = '', kw = '', kws_match = [] } = {}) {
  const urlFromMatch = kws_match?.[0]?.url || url;
  const urlPath = (urlFromMatch || '').toLowerCase();
  const topics = new Set();

  // SIMULATEUR — URL pointe vers un calculateur/simulateur explicite
  if (/(simulateur|calculateur|estimateur|calcul)[-_/](de[-_])?rentab/.test(urlPath) ||
      /\/(simulateur|calculateur)[-_/]/.test(urlPath) ||
      /rentabilite[-_]airbnb[-_/]?$/.test(urlPath) ||
      /estimer[-_]airbnb/.test(urlPath)) {
    topics.add('simulateur');
  }

  // FACTURE — URL pointe vers un générateur/modèle de facture, pas juste un article
  if (/\/facture[-_]?(airbnb|booking|location|generateur|modele|template)/.test(urlPath) ||
      /(generateur|modele|template|generer|outil)[-_].{0,20}facture/.test(urlPath) ||
      /telecharger.{0,15}facture/.test(urlPath)) {
    topics.add('facture');
  }

  // CONTRAT — pareil, page dédiée modèle/générateur
  if (/\/contrat[-_]?(airbnb|location|generateur|modele|template|saisonniere|courte)/.test(urlPath) ||
      /(generateur|modele|template|generer|outil)[-_].{0,20}contrat/.test(urlPath) ||
      /telecharger.{0,15}contrat/.test(urlPath)) {
    topics.add('contrat');
  }

  // LOI LE MEUR — page dédiée à la loi
  if (/(loi[-_])?le[-_]meur|reforme[-_]meubles|loi[-_]airbnb[-_]?2025|reglement.{0,10}lcd/.test(urlPath)) {
    topics.add('loi');
  }

  // TAUX OCCUPATION — page dédiée data occupation
  if (/taux[-_]occupation|occupation[-_]airbnb|occupation[-_]par[-_]ville|stats?[-_]airbnb/.test(urlPath)) {
    topics.add('occupation');
  }

  // FISCALITÉ — guide fiscalité dédié
  if (/\/(fiscalite|lmnp|amortissement|impot)[-_]airbnb|guide[-_]fiscal|\/fiscalite[-_/]/.test(urlPath)) {
    topics.add('fiscalite');
  }

  // PRICING — outil pricing dynamique
  if (/\/(pricing|tarif[-_]dynamique|smartpric|smart[-_]pric|yield)/.test(urlPath)) {
    topics.add('pricing');
  }

  // CHANNEL MANAGER — page channel manager
  if (/\/(channel[-_]manager|pms[-_]locat)/.test(urlPath)) {
    topics.add('channel_manager');
  }

  // COMMISSION — page commission/frais
  if (/\/(commission|frais)[-_]airbnb|commission[-_](booking|airbnb)/.test(urlPath)) {
    topics.add('commission');
  }

  return topics;
}

export const ENOMIA_RESOURCES = {
  simulateur: 'https://www.enomia.app/simulateur-rentabilite-airbnb',
  loi: 'https://www.enomia.app/blog/loi-le-meur-airbnb',
  fiscalite: 'https://www.enomia.app/blog/fiscalite-airbnb',
  occupation: 'https://www.enomia.app/blog/taux-occupation-par-ville',
  pricing: 'https://www.enomia.app/blog/pricing-airbnb-tarif-dynamique',
  facture: 'https://www.enomia.app/facture-airbnb',
  contrat: 'https://www.enomia.app/contrat-airbnb',
  tarif_conciergerie: 'https://www.enomia.app/tarif-conciergerie-airbnb',
  louer_rentable: 'https://www.enomia.app/blog/louer-airbnb-rentable',
};
