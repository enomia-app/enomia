// scripts/backlinks-source-monthly/filters.mjs
// Filtres + détection outils + détection conciergerie. Pipeline v2.1.

import { resolveMx } from 'node:dns/promises';
import net from 'node:net';

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

// ─── DNS MX LOOKUP (vérif domaine email avant pitch) ────────────────────
// Vérifie qu'un domaine a au moins 1 enregistrement MX (= peut recevoir des mails).
// Gratuit, ~50-300ms par domaine (timeout 5s). Cache mémoire intra-run.
// Capture les sous-domaines orphelins (test.*, dev.*) qui n'ont pas de MX.

const mxCache = new Map();

export async function hasValidMX(domain) {
  if (!domain) return false;
  const clean = domain.toLowerCase().replace(/^www\./, '');
  if (mxCache.has(clean)) return mxCache.get(clean);

  try {
    const records = await Promise.race([
      resolveMx(clean),
      new Promise((_, rej) => setTimeout(() => rej(new Error('mx timeout')), 5000)),
    ]);
    const ok = Array.isArray(records) && records.length > 0;
    mxCache.set(clean, ok);
    return ok;
  } catch (e) {
    // ENODATA, ENOTFOUND, ESERVFAIL, timeout → considéré comme sans MX
    mxCache.set(clean, false);
    return false;
  }
}

// ─── VÉRIFICATION SMTP (RCPT TO) ────────────────────────────────────────
// hasValidMX dit "le domaine a un serveur mail". verifyMailbox va plus loin :
// se connecte au MX et demande "acceptes-tu CETTE boîte ?" (RCPT TO).
// Attrape les 550 5.1.1 (boîte inexistante) que le seul check MX laisse passer
// (cas réel : contact@gcb-immo.fr, contact@naps-immo.com — bouncés le 2026-06-15).
//   status 'valid'   : RCPT accepté (250/251)                  → envoyer
//   status 'invalid' : rejet dur "no such user" (550/551/553   → NE PAS envoyer
//                      avec enh 5.1.x, jamais 5.7.x = policy)
//   status 'unknown' : greylist/timeout/catch-all/policy/conn  → envoyer quand même
//                      (on ne sacrifie pas un prospect sur un doute ; Gmail relivre)
const rcptCache = new Map();

export async function verifyMailbox(email, opts = {}) {
  const timeout = opts.timeout ?? 8000;
  const from = opts.from ?? 'marc@enomia.app';
  const helo = opts.helo ?? 'enomia.app';
  const key = (email || '').toLowerCase();
  if (!key || !key.includes('@')) return { status: 'invalid', code: 'NO_AT', reason: 'pas une adresse' };
  if (rcptCache.has(key)) return rcptCache.get(key);

  const domain = key.split('@')[1];
  let mx;
  try {
    mx = await Promise.race([
      resolveMx(domain),
      new Promise((_, rej) => setTimeout(() => rej(new Error('mx timeout')), 5000)),
    ]);
  } catch {
    mx = [];
  }
  if (!Array.isArray(mx) || mx.length === 0) {
    const r = { status: 'invalid', code: 'NO_MX', reason: 'aucun MX' };
    rcptCache.set(key, r);
    return r;
  }
  mx.sort((a, b) => a.priority - b.priority);
  const host = mx[0].exchange;

  const result = await new Promise((resolve) => {
    const socket = net.connect({ host, port: 25 });
    socket.setTimeout(timeout);
    let buf = '';
    let step = 'greet';
    let settled = false;

    const finish = (r) => {
      if (settled) return;
      settled = true;
      try { socket.write('QUIT\r\n'); } catch { /* socket déjà fermé */ }
      socket.destroy();
      resolve(r);
    };
    const unknown = (code, reason) => finish({ status: 'unknown', code, reason });
    const send = (cmd) => { try { socket.write(cmd + '\r\n'); } catch { /* idem */ } };

    socket.on('timeout', () => unknown('TIMEOUT', 'probe timeout'));
    socket.on('error', (e) => unknown('CONN_ERR', e.code || e.message));
    socket.on('close', () => { if (!settled) unknown('CLOSED', 'connexion fermée'); });

    socket.on('data', (data) => {
      buf += data.toString('utf8');
      let nl;
      while ((nl = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, nl).replace(/\r$/, '');
        buf = buf.slice(nl + 1);
        const code = parseInt(line.slice(0, 3), 10);
        const isFinal = line[3] === ' ' || line.length <= 3; // "250-" = suite, "250 " = fin de réponse
        if (!isFinal) continue;
        handle(code, line);
        if (settled) return;
      }
    });

    function handle(code, line) {
      if (step === 'greet') {
        if (code !== 220) return unknown('NO_220', line.slice(0, 50));
        step = 'ehlo'; send('EHLO ' + helo);
      } else if (step === 'ehlo') {
        if (code !== 250) { step = 'helo'; send('HELO ' + helo); return; } // fallback HELO
        step = 'mail'; send('MAIL FROM:<' + from + '>');
      } else if (step === 'helo') {
        if (code !== 250) return unknown('EHLO_FAIL', line.slice(0, 50));
        step = 'mail'; send('MAIL FROM:<' + from + '>');
      } else if (step === 'mail') {
        if (code !== 250) return unknown('MAIL_FAIL', line.slice(0, 50));
        step = 'rcpt'; send('RCPT TO:<' + key + '>');
      } else if (step === 'rcpt') {
        if (code === 250 || code === 251) return finish({ status: 'valid', code: String(code), reason: 'RCPT accepté' });
        const enh = (line.match(/\b5\.\d\.\d+\b/) || [])[0] || '';
        const hardInvalid = [550, 551, 553].includes(code);
        const policyish = enh.startsWith('5.7'); // access denied / anti-spam → pas un verdict sur la boîte
        if (hardInvalid && !policyish) return finish({ status: 'invalid', code: String(code) + (enh ? ' ' + enh : ''), reason: line.slice(0, 90) });
        return unknown(String(code) + (enh ? ' ' + enh : ''), line.slice(0, 90)); // 450/451/452 greylist, 552, 5.7.x, etc.
      }
    }
  });

  rcptCache.set(key, result);
  return result;
}

// ─── DECODE ENTITÉS HTML ────────────────────────────────────────────────
// Décode les entités HTML d'un texte extrait (titre d'article, etc.) avant
// de l'insérer dans un pitch. Gère :
//   - numériques décimales (&#233;) et hexadécimales (&#xE9;)
//   - entités nommées courantes (accents français + ponctuation)
// Le décodage partiel précédent ne gérait que ' & " nbsp, d'où les
// "&egrave;" / "&agrave;" / "&eacute;" bruts dans les titres français.

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  nbsp: ' ', laquo: '«', raquo: '»', hellip: '…',
  // minuscules accentuées
  eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë',
  agrave: 'à', acirc: 'â', auml: 'ä', aacute: 'á', atilde: 'ã', aring: 'å',
  ugrave: 'ù', uacute: 'ú', ucirc: 'û', uuml: 'ü',
  igrave: 'ì', iacute: 'í', icirc: 'î', iuml: 'ï',
  ograve: 'ò', oacute: 'ó', ocirc: 'ô', ouml: 'ö', otilde: 'õ', oslash: 'ø',
  ccedil: 'ç', ntilde: 'ñ', yacute: 'ý', yuml: 'ÿ',
  // majuscules accentuées
  Eacute: 'É', Egrave: 'È', Ecirc: 'Ê', Euml: 'Ë',
  Agrave: 'À', Aacute: 'Á', Acirc: 'Â', Auml: 'Ä',
  Ugrave: 'Ù', Uacute: 'Ú', Ucirc: 'Û', Uuml: 'Ü',
  Igrave: 'Ì', Iacute: 'Í', Icirc: 'Î', Iuml: 'Ï',
  Ograve: 'Ò', Oacute: 'Ó', Ocirc: 'Ô', Ouml: 'Ö',
  Ccedil: 'Ç', Ntilde: 'Ñ',
  // ponctuation / symboles
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', sbquo: '‚', bdquo: '„',
  mdash: '—', ndash: '–', deg: '°', euro: '€', pound: '£', cent: '¢',
  times: '×', divide: '÷', middot: '·', bull: '•',
};

export function decodeEntities(str) {
  if (!str) return str;
  return str
    // numériques décimales : &#233;
    .replace(/&#(\d+);/g, (_, n) => {
      try { return String.fromCodePoint(parseInt(n, 10)); } catch { return _; }
    })
    // numériques hexadécimales : &#xE9;
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => {
      try { return String.fromCodePoint(parseInt(n, 16)); } catch { return _; }
    })
    // nommées
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, name) =>
      Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, name) ? NAMED_ENTITIES[name] : m);
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
      signal: AbortSignal.timeout(12000), // 12s : un serveur lent/mort ne doit JAMAIS bloquer tout le sourcing
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

  // URL de formulaire (fallback si pas d'email)
  const contactMatch = html.match(/href="(\/?contact[^"]*|\/?a-propos[^"]*|\/?equipe[^"]*|\/?about[^"]*)"/i);
  let url_formulaire = null;
  if (contactMatch && domain) {
    const p = contactMatch[1];
    url_formulaire = p.startsWith('http') ? p : `https://${domain}${p.startsWith('/') ? '' : '/'}${p}`;
  }

  // Vérif MX : on parcourt les candidats par score décroissant, on garde
  // le premier dont le domaine email a un serveur MX. Élimine les sous-domaines
  // orphelins (test.*, dev.*) et les domaines morts.
  for (const cand of candidates) {
    const emailDomain = cand.email.split('@')[1];
    if (await hasValidMX(emailDomain)) {
      return { email: cand.email, url_formulaire };
    }
  }

  return { email: null, url_formulaire };
}
