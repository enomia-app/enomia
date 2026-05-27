// scripts/backlinks-source-monthly/filters.mjs
// Filtres + détection outils + détection conciergerie. Pipeline v2.1.

// ─── BLACKLIST ──────────────────────────────────────────────────────────
// Domaines à exclure : trop gros (DR>70 généralement), concurrents directs Enomia,
// sociaux/marketplaces, sites institutionnels (qui ne linkeront pas vers un outil tiers).
export const BLACKLIST_DOMAINS = [
  // Concurrents directs Enomia (outils de gestion Airbnb)
  'smoobu.com', 'hostnfly.com', 'guestready.com', 'lodgify.com',
  'hospitable.com', 'beyondpricing.com', 'pricelabs.co', 'wheelhouse.com',
  'tokeet.com', 'igms.com', 'hostfully.com', 'avantio.com',
  'bnbhost.fr', 'cocoonr.fr', 'we-host.fr', 'welkeys.com',

  // Presse nationale + très gros sites (DR > 70 généralement)
  'lemonde.fr', 'lefigaro.fr', 'leparisien.fr', 'liberation.fr',
  'lexpress.fr', 'lobs.fr', 'lepoint.fr', 'marianne.net',
  'capital.fr', 'lesechos.fr', 'latribune.fr', 'bfmtv.com',
  'francetvinfo.fr', 'tf1info.fr', '20minutes.fr', 'rtl.fr',
  'europe1.fr', 'rmc.fr', 'sudouest.fr', 'ouest-france.fr',
  'huffingtonpost.fr', 'cnews.fr', 'midilibre.fr', 'laprovence.com',
  'lavoixdunord.fr', 'leprogres.fr', 'ladepeche.fr',

  // Sociaux et marketplaces
  'linkedin.com', 'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
  'youtube.com', 'tiktok.com', 'pinterest.com', 'reddit.com',
  'leboncoin.fr', 'airbnb.fr', 'airbnb.com', 'booking.com',
  'abritel.fr', 'vrbo.com', 'gites-de-france.com',
  'expedia.fr', 'hotels.com', 'tripadvisor.fr', 'trivago.fr',

  // Sites officiels (linkent rarement vers outils tiers)
  'service-public.fr', 'impots.gouv.fr', 'urssaf.fr',
  'legifrance.gouv.fr', 'economie.gouv.fr', 'data.gouv.fr',
  'gouvernement.fr', 'cohesion-territoires.gouv.fr',

  // Comparateurs/agrégateurs grand public
  'meilleurtaux.com', 'lelynx.fr', 'leprixdumetre.com',
  'seloger.com', 'logic-immo.com', 'pap.fr', 'bienici.com',
  'meilleursagents.com', 'efficity.com', 'orpi.com',
  'fnaim.fr', 'century21.fr', 'laforet.com',

  // Gros groupes immo / promoteurs (filiales CAC 40, SBF 120, etc.)
  // Ne linkeront jamais vers un outil tiers, et adresses contact servent au support client
  'vinci-immobilier.com', 'bouygues-immobilier.com', 'nexity.fr',
  'kaufmanbroad.fr', 'icade.fr', 'altarea.com', 'eiffageimmobilier.fr',
  'gecina.fr', 'unibail-rodamco-westfield.com',

  // Wikis et encyclopédies
  'wikipedia.org', 'wiktionary.org',

  // CMS plateformes (le site visé est le sous-domaine, pas le CMS lui-même)
  'medium.com', 'substack.com', 'wordpress.com', 'blogger.com',
];

export const BLACKLIST_PATTERNS = [
  /\.gouv\.fr$/i,            // tous sites gouvernementaux français
  /\.[a-z]+\.gov$/i,         // gov étrangers
  /^docs?\./i,               // documentation officielle
  /^store\./i,               // boutiques en ligne
  /^shop\./i,
];

// ─── DETECTION OUTILS PRÉSENTS ──────────────────────────────────────────
// Patterns pour identifier QUELS outils Enomia sont déjà présents sur la page cible.
// Au moment du send, on choisit l'outil à pitcher selon ce qui MANQUE.
export const TOOL_DETECTION_PATTERNS = {
  simulateur: [
    'simulateur de rentabilité', 'calculateur de rentabilité',
    'calculez votre rentabilité', 'simulez votre rentabilité',
    'simulation rentabilité', 'calculer la rentabilité',
    'calculateur airbnb', 'simulateur airbnb',
    'calculer le rendement', 'simulez votre rendement',
    'estimez vos revenus', 'estimer votre rentabilité',
    'calculer mon airbnb', 'simulation cash flow',
    'outil de simulation', 'calculateur de rendement',
  ],
  contrat: [
    'modèle de contrat', 'téléchargez le contrat', 'télécharger le bail',
    'modèle de bail', 'générateur de contrat', 'générer un contrat',
    'contrat en pdf à télécharger', 'votre contrat de location',
    'modèle gratuit de contrat', 'modèle gratuit de bail',
    'créer un contrat', 'rédiger un contrat en ligne',
    'téléchargez le modèle de bail', 'modèle de convention de location',
    'créez votre bail', 'modèle de bail saisonnier',
  ],
  facture: [
    'générateur de facture', 'créer une facture', 'générer une facture',
    'modèle de facture', 'téléchargez le modèle de facture',
    'facture en ligne', 'éditeur de facture', 'logiciel de facturation',
    'créez votre facture', 'générer un devis', 'créer un devis',
    'modèle facture pdf', 'générateur facture airbnb',
  ],
  taxe_sejour: [
    'calcul taxe de séjour', 'calculateur taxe de séjour',
    'calculer la taxe de séjour', 'calculez la taxe de séjour',
    'simulateur taxe de séjour', 'tarif taxe de séjour',
    'estimer taxe de séjour', 'outil taxe de séjour',
  ],
};

// ─── DETECTION CONCIERGERIE ─────────────────────────────────────────────
// Conciergeries : skip sauf si on pitche le simulateur (conflit d'intérêt sinon).
// Marc va les contacter séparément pour leur vendre des clics sur ses pages conciergerie.
export const CONCIERGERIE_DOMAIN_PATTERNS = [
  /conciergerie/i, /\bhost(s|nfly)?\b/i, /^stay-/i, /-stay$/i,
  /\bkeynest\b/i, /\bwelkeys\b/i, /\bcocoonr\b/i, /\boasis\b/i,
  /\bgest-airbnb/i, /-airbnb-gest/i, /manage-airbnb/i, /airbnb-manage/i,
  /\bcasa-?gestion/i, /-rentals?$/i, /^rentals?-/i, /\blodging\b/i,
];

export const CONCIERGERIE_TEXT_PATTERNS = [
  'nous gérons votre bien',
  'déléguez la gestion',
  'service de conciergerie',
  'service conciergerie airbnb',
  'gestion airbnb',
  '100% de la gestion',
  '100 % de la gestion',
  'nous nous occupons de tout',
  'votre conciergerie',
  'nos services propriétaires',
  'nos prestations conciergerie',
  'conciergerie de location courte durée',
  'gestion locative courte durée',
  'agence de conciergerie',
  'conciergerie locative',
];

// ─── DETECTION BLOG vs SITE SERVICE ─────────────────────────────────────
// On veut cibler UNIQUEMENT les blogs (rédacteur édite son article) et pas
// les sites service (SaaS, agences immo, etc. → formulaire client, ne répondront pas).

export const BLOG_URL_PATH_PATTERNS = [
  /\/blog(\/|$)/i,
  /\/articles?(\/|$)/i,
  /\/journal(\/|$)/i,
  /\/news(\/|$)/i,
  /\/posts?(\/|$)/i,
  /\/ressources?(\/|$)/i,
  /\/dossiers?(\/|$)/i,
  /\/actualites?(\/|$)/i,
  /\/conseils?(\/|$)/i,
  /\/guides?(\/|$)/i,
  /\/magazine(\/|$)/i,
];

export const BLOG_URL_HOST_PATTERNS = [
  /^blog\./i,
  /^journal\./i,
  /^news\./i,
  /^le-blog\./i,
  /^magazine\./i,
];

// Signal de site SERVICE (à ne pas pitcher) : présence de CTA commercial dominant
export const SERVICE_TEXT_PATTERNS = [
  'demandez une démo',
  'réservez un appel',
  'essai gratuit 14 jours',
  'commencer mon essai',
  'inscrivez-vous gratuitement',
  'créer mon compte gratuit',
  'demande de devis',
  'estimation gratuite en ligne',
  'rejoignez nos propriétaires',
  'confiez-nous votre bien',
];

export function detectBlog(url, html) {
  // Signal 1 (HIGH CONFIDENCE) : URL pattern
  try {
    const u = new URL(url);
    if (BLOG_URL_HOST_PATTERNS.some(p => p.test(u.hostname))) return true;
    if (BLOG_URL_PATH_PATTERNS.some(p => p.test(u.pathname))) return true;
  } catch {}

  if (!html) return false;

  // Signal 2 : HTML markup d'article (structured data, balise <article>, meta)
  if (/<article\b/i.test(html)) return true;
  if (/article:published_time/i.test(html)) return true;
  if (/"@type"\s*:\s*"(blogposting|article|newsarticle)"/i.test(html)) return true;

  // Signal 3 : byline / date publication FR
  const lower = html.toLowerCase();
  if (/(?:publié|posté|paru|écrit)\s+(?:le\s+)?\d/i.test(lower)) return true;
  if (/<meta[^>]*name=["']author["']/i.test(html)) return true;
  if (/<time\b/i.test(html)) return true;

  // Si on a un signal SERVICE fort ET aucun signal blog → définitivement pas un blog
  if (SERVICE_TEXT_PATTERNS.some(p => lower.includes(p.toLowerCase()))) return false;

  return false; // par défaut : pas blog (conservateur)
}

// ─── QUALIFICATION EMAIL EXTRAIT ────────────────────────────────────────
// Évite de pitcher des adresses "fonction" (signalement, abuse, noreply…) qui
// rejettent systématiquement, ou des emails de staging/dev mal indexés.

// Local-parts (avant @) qui ne sont JAMAIS un contact pertinent
const BAD_EMAIL_LOCAL_PARTS = new Set([
  // anti-fraude / abus
  'signalement', 'signalements', 'abuse', 'abus', 'fraud', 'fraude',
  // auto-replies / pas de réponse
  'noreply', 'no-reply', 'donotreply', 'do-not-reply', 'donot-reply',
  'ne-pas-repondre', 'nepasrepondre', 'nepas-repondre', 'pasdereponse',
  'postmaster', 'mailer-daemon', 'mailerdaemon', 'daemon',
  // légal / RGPD / juridique
  'rgpd', 'gdpr', 'dpo', 'privacy', 'confidentialite', 'legal',
  // press / recrutement / fonctions internes
  'press', 'presse', 'media', 'medias', 'rp',
  'recrutement', 'recrutements', 'jobs', 'careers', 'hr', 'rh',
  'comptabilite', 'compta', 'finance', 'paie',
  // marketing automation / listes
  'newsletter', 'newsletters', 'notification', 'notifications',
  'alert', 'alerts', 'alerte', 'alertes', 'list', 'lists',
  'unsubscribe', 'desabonnement', 'opt-out', 'optout',
  'spam', 'junk',
]);

// Hostnames manifestement non-prod
const BAD_EMAIL_HOSTNAME_PATTERNS = [
  /^test\./i, /\.test\./i,
  /^staging\./i, /\.staging\./i,
  /^dev\./i, /\.dev\./i,
  /^localhost/i, /\.local$/i, /\.localhost$/i,
  /example\.(com|org|net|fr)$/i,
  /domain\.(com|tld)$/i,
  /\.invalid$/i,
];

/**
 * Vérifie qu'un email candidat est utilisable pour un pitch.
 * Retourne true si OK, false sinon (et un log de la raison).
 */
export function isPitchableEmail(email, siteDomain) {
  if (!email || typeof email !== 'string') return false;
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return false;

  const [localPart, hostname] = email.toLowerCase().split('@');
  if (!localPart || !hostname) return false;

  // 1. Local-part fonction → skip
  if (BAD_EMAIL_LOCAL_PARTS.has(localPart)) return false;
  // Variantes avec séparateurs (signalement-fraude@, abuse-report@…)
  const localRoot = localPart.split(/[-_.]/)[0];
  if (BAD_EMAIL_LOCAL_PARTS.has(localRoot)) return false;

  // 2. Hostname suspect (test., staging., dev., .local, etc.)
  if (BAD_EMAIL_HOSTNAME_PATTERNS.some(p => p.test(hostname))) return false;

  // 3. Sanity check : pas un placeholder évident ("votre-email", "your-name", etc.)
  // On garde admin@/root@ comme acceptables (sur petits blogs c'est parfois le fondateur).
  if (['user', 'username', 'name', 'votre', 'your', 'monemail', 'exemple', 'example'].includes(localPart)) return false;

  // 4. Si siteDomain fourni, l'email DOIT être sur ce domaine ou sous-domaine.
  // Évite d'extraire un email random d'un blog tiers cité dans la page.
  if (siteDomain) {
    const cleanSite = siteDomain.replace(/^www\./, '').toLowerCase();
    if (hostname !== cleanSite && !hostname.endsWith('.' + cleanSite)) return false;
  }

  return true;
}

// ─── HELPERS ────────────────────────────────────────────────────────────

export function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

export function isBlacklisted(domain) {
  if (!domain) return true;
  const d = domain.toLowerCase();
  if (BLACKLIST_DOMAINS.some(b => d === b || d.endsWith('.' + b))) return true;
  if (BLACKLIST_PATTERNS.some(p => p.test(d))) return true;
  return false;
}

/**
 * Fetch une page et renvoie son HTML (ou null si erreur).
 */
async function fetchHtml(url) {
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      // Note: fetch natif Node n'a pas de timeout option, on s'en remet à AbortController
    });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

/**
 * Détecte la liste des outils Enomia déjà présents sur la page cible.
 * Retourne un array de strings (ex: ['simulateur', 'contrat']), ou null si fetch fail.
 */
export async function detectPresentTools(url) {
  const html = await fetchHtml(url);
  if (!html) return null;
  const lower = html.toLowerCase();
  const found = [];
  for (const [tool, patterns] of Object.entries(TOOL_DETECTION_PATTERNS)) {
    if (patterns.some(p => lower.includes(p.toLowerCase()))) {
      found.push(tool);
    }
  }
  return found;
}

/**
 * Détecte si le site est une conciergerie via :
 *   1. Pattern dans le domaine (rapide)
 *   2. Mots-clés dans la home page (si non trouvé via domaine)
 */
export async function detectConciergerie(domain, homeUrl) {
  if (!domain) return false;
  // Signal 1 : domaine
  if (CONCIERGERIE_DOMAIN_PATTERNS.some(p => p.test(domain))) return true;

  // Signal 2 : scan home
  if (!homeUrl) return false;
  const html = await fetchHtml(homeUrl);
  if (!html) return false;
  const lower = html.toLowerCase();
  return CONCIERGERIE_TEXT_PATTERNS.some(p => lower.includes(p.toLowerCase()));
}

/**
 * Détecte présentTools + isConciergerie + isBlog en 1 seul fetch.
 * Retourne { tools, is_conciergerie, is_blog } ou null.
 */
export async function detectAll(pageUrl, domain) {
  const html = await fetchHtml(pageUrl);
  if (!html) return null;
  const lower = html.toLowerCase();

  const tools = [];
  for (const [tool, patterns] of Object.entries(TOOL_DETECTION_PATTERNS)) {
    if (patterns.some(p => lower.includes(p.toLowerCase()))) {
      tools.push(tool);
    }
  }

  let is_conciergerie = false;
  if (domain && CONCIERGERIE_DOMAIN_PATTERNS.some(p => p.test(domain))) {
    is_conciergerie = true;
  } else if (CONCIERGERIE_TEXT_PATTERNS.some(p => lower.includes(p.toLowerCase()))) {
    is_conciergerie = true;
  }

  const is_blog = detectBlog(pageUrl, html);

  return { tools, is_conciergerie, is_blog };
}

/**
 * Score une adresse email candidate : plus haut = meilleur contact.
 * Préfère contact@, redaction@, prénom@ ; pénalise admin@, info@ (catchall fréquent).
 */
function scoreEmail(email) {
  const local = email.toLowerCase().split('@')[0];
  // Meilleures adresses humaines
  if (['contact', 'bonjour', 'hello', 'hi', 'salut'].includes(local)) return 100;
  if (['redaction', 'rédaction', 'editorial', 'editor'].includes(local)) return 95;
  // Probable prénom (lettres uniquement, longueur raisonnable)
  if (/^[a-zà-ÿ]{3,15}$/i.test(local)) return 85;
  // prenom.nom@ ou prenom-nom@ → bon signal humain
  if (/^[a-zà-ÿ]{2,}[._-][a-zà-ÿ]{2,}$/i.test(local)) return 80;
  // info@, hello@ generic
  if (['info', 'infos', 'mail', 'email'].includes(local)) return 60;
  // admin@, support@, webmaster@ → souvent catchall mais peut marcher
  if (['admin', 'support', 'webmaster', 'sales', 'service'].includes(local)) return 40;
  // par défaut
  return 50;
}

/**
 * Tente d'extraire un email visible sur la page (mailto: ou texte brut).
 * Récupère TOUS les emails, filtre les "fonction"/staging via isPitchableEmail,
 * et garde le mieux scoré.
 */
export async function extractContact(url) {
  const html = await fetchHtml(url);
  if (!html) return { email: null, url_formulaire: null };

  const domain = extractDomain(url);

  // Collecte tous les emails (mailto: + texte brut)
  const found = new Set();
  const mailtoRe = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  let m;
  while ((m = mailtoRe.exec(html))) found.add(m[1].toLowerCase());

  // Texte brut : on cherche aussi (mais souvent obfusqué, donc bonus si mailto: existe)
  const textRe = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/gi;
  while ((m = textRe.exec(html))) found.add(m[1].toLowerCase());

  // Filtre + score
  const candidates = Array.from(found)
    .filter(e => isPitchableEmail(e, domain))
    .map(e => ({ email: e, score: scoreEmail(e) }))
    .sort((a, b) => b.score - a.score);

  const email = candidates.length > 0 ? candidates[0].email : null;

  // URL de formulaire (fallback si pas d'email)
  const contactMatch = html.match(/href="(\/?contact[^"]*|\/?a-propos[^"]*|\/?equipe[^"]*|\/?about[^"]*)"/i);
  let url_formulaire = null;
  if (contactMatch && domain) {
    const p = contactMatch[1];
    url_formulaire = p.startsWith('http') ? p : `https://${domain}${p.startsWith('/') ? '' : '/'}${p}`;
  }

  return { email, url_formulaire };
}
