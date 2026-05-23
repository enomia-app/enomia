// scripts/backlinks-source-monthly/filters.mjs
// Filtres de qualification pour les candidats backlinks.

// Domaines à exclure : trop gros, concurrents directs, sociaux/marketplaces, plateformes
export const BLACKLIST_DOMAINS = [
  // Concurrents directs (outils Airbnb)
  'smoobu.com', 'hostnfly.com', 'guestready.com', 'lodgify.com',
  'hospitable.com', 'beyondpricing.com', 'pricelabs.co', 'wheelhouse.com',
  'tokeet.com', 'igms.com', 'hostfully.com', 'avantio.com',

  // Presse nationale + très gros (DR > 70 généralement)
  'lemonde.fr', 'lefigaro.fr', 'leparisien.fr', 'liberation.fr',
  'lexpress.fr', 'lobs.fr', 'lepoint.fr', 'marianne.net',
  'capital.fr', 'lesechos.fr', 'latribune.fr', 'bfmtv.com',
  'francetvinfo.fr', 'tf1info.fr', '20minutes.fr', 'rtl.fr',
  'europe1.fr', 'rmc.fr', 'sudouest.fr', 'ouest-france.fr',

  // Sociaux et marketplaces
  'linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com',
  'youtube.com', 'tiktok.com', 'pinterest.com', 'reddit.com',
  'leboncoin.fr', 'airbnb.fr', 'airbnb.com', 'booking.com',
  'abritel.fr', 'vrbo.com', 'gites-de-france.com',

  // Sites officiels (linkent rarement vers outils tiers)
  'service-public.fr', 'impots.gouv.fr', 'urssaf.fr',
  'legifrance.gouv.fr', 'economie.gouv.fr', 'data.gouv.fr',

  // Comparateurs/agrégateurs grand public
  'meilleurtaux.com', 'lelynx.fr', 'leprixdumetre.com',
  'seloger.com', 'logic-immo.com', 'pap.fr', 'bienici.com',
  'meilleursagents.com', 'efficity.com',

  // Wikis et encyclopédies
  'wikipedia.org', 'wiktionary.org',
];

// Patterns de domaines à blacklister (regex match)
export const BLACKLIST_PATTERNS = [
  /\.gouv\.fr$/i,           // tous sites gouvernementaux
  /\.[a-z]+\.gov$/i,         // gov étrangers
  /^docs?\./i,               // documentation officielle
  /^store\./i,               // boutiques en ligne
];

// Patterns pour détecter si la page cible a DÉJÀ un outil similaire à celui qu'on pitche
export const COMPETITOR_PATTERNS = {
  simulateur: [
    'simulateur de rentabilité', 'calculateur de rentabilité',
    'calculez votre rentabilité', 'simulez votre rentabilité',
    'simulation rentabilité', 'calculer la rentabilité',
    'outil de calcul', 'outil de simulation',
    'calculateur airbnb', 'simulateur airbnb',
    'calculer le rendement', 'simulez votre rendement',
    'estimez vos revenus', 'estimer votre rentabilité',
  ],
  contrat: [
    'modèle de contrat', 'téléchargez le contrat', 'télécharger le bail',
    'modèle de bail', 'générateur de contrat', 'générer un contrat',
    'contrat en pdf à télécharger', 'votre contrat de location',
    'modèle gratuit de contrat', 'modèle gratuit de bail',
    'créer un contrat', 'rédiger un contrat en ligne',
  ],
  facture: [
    'générateur de facture', 'créer une facture', 'générer une facture',
    'modèle de facture', 'téléchargez le modèle de facture',
    'facture en ligne', 'éditeur de facture', 'logiciel de facturation',
    'créez votre facture', 'générer un devis',
  ],
};

/**
 * Renvoie true si le domain est dans la blacklist (exact match ou pattern).
 */
export function isBlacklisted(domain) {
  if (!domain) return true;
  const d = domain.toLowerCase();
  if (BLACKLIST_DOMAINS.some(b => d === b || d.endsWith('.' + b))) return true;
  if (BLACKLIST_PATTERNS.some(p => p.test(d))) return true;
  return false;
}

/**
 * Extrait le domain d'une URL (sans www).
 */
export function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Détecte si la page contient déjà un outil similaire à celui qu'on veut pitcher.
 * Retourne true si concurrent détecté, false si OK pour pitcher, null si erreur fetch.
 */
export async function hasCompetingTool(url, outil_cible, fetchOptions = {}) {
  try {
    const r = await fetch(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      ...fetchOptions,
    });
    if (!r.ok) return null;
    const html = (await r.text()).toLowerCase();
    const patterns = COMPETITOR_PATTERNS[outil_cible] || [];
    return patterns.some(p => html.includes(p.toLowerCase()));
  } catch {
    return null;
  }
}

/**
 * Tente d'extraire un email visible sur la page (mailto: ou texte).
 */
export async function extractContact(url) {
  try {
    const r = await fetch(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36' },
    });
    if (!r.ok) return { email: null, url_formulaire: null };
    const html = await r.text();

    // mailto: links
    const mailtoMatch = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const email = mailtoMatch ? mailtoMatch[1] : null;

    // formulaire de contact (lien vers /contact, /a-propos, /equipe)
    const domain = extractDomain(url);
    const contactMatch = html.match(/href="(\/?contact[^"]*|\/?a-propos[^"]*|\/?equipe[^"]*|\/?about[^"]*)"/i);
    let url_formulaire = null;
    if (contactMatch && domain) {
      const path = contactMatch[1];
      url_formulaire = path.startsWith('http') ? path : `https://${domain}${path.startsWith('/') ? '' : '/'}${path}`;
    }

    return { email, url_formulaire };
  } catch {
    return { email: null, url_formulaire: null };
  }
}
