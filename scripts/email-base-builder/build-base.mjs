// scripts/email-base-builder/build-base.mjs
//
// Pipe email-finding + validation → base prospect (CSV + JSON).
//
// Réutilise les garde-fous de la machine backlinks (filters.mjs) :
//   1. extractContact(site) : scrape la page, récupère TOUS les emails,
//      filtre via isPitchableEmail (local-part / hostname / cross-domain),
//      garde le mieux scoré ayant un MX valide. Renvoie { email, url_formulaire }.
//   2. verifyMailbox(email) : probe SMTP RCPT réel → valid / invalid / unknown.
//
// Sortie : une ligne par boîte avec
//   nom_boite ; site ; email ; prenom ; statut ; ville ; rcpt_code ; url_formulaire ; note
//
// Statuts :
//   verifie     email trouvé + RCPT valid               → envoyable, confirmé
//   a_tester    email trouvé + RCPT unknown (greylist…)  → envoyable, non confirmé
//   faux_email  email trouvé + RCPT invalid              → ne pas envoyer
//   formulaire  pas d'email mais formulaire de contact   → contact via form
//   ecarte      aucun contact trouvé                     → skip
//
// Usage :
//   node build-base.mjs --segment=conciergeries [--limit=N] [--concurrency=6]
//   node build-base.mjs --in=path.json --name-field=name --site-field=website --ville-field=ville --out=base.csv

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractContact, verifyMailbox, extractDomain } from '../backlinks-source-monthly/filters.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

// ─── Args ───────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const m = a.match(/^--([^=]+)=?(.*)$/);
    return m ? [m[1], m[2] === '' ? true : m[2]] : [a, true];
  })
);
const CONCURRENCY = parseInt(args.concurrency || '6', 10);
const LIMIT = args.limit ? parseInt(args.limit, 10) : Infinity;

// ─── Sources par segment ────────────────────────────────────────────────
// Chaque source renvoie une liste { name, site, ville }.
// Pool blog live (rapatrié du Mac mini) : emails DÉJÀ extraits par la machine.
const BLOG_SRC = ['backlinks-2026-05.json', 'backlinks-2026-06.json']
  .map(f => path.join(ROOT, 'data', 'email-base', '_src', f));
const CONTACTED = new Set(['sent', 'relance_1', 'relance_2', 'repondu_positif', 'repondu_negatif',
  'repondu_neutre', 'repondu_spam', 'bounced', 'manual_sent', 'manual_form', 'manual_form_batched', 'pas_de_reponse']);

function loadBlogPool() {
  const seen = new Set();
  const out = [];
  for (const p of BLOG_SRC) {
    if (!fs.existsSync(p)) continue;
    const d = JSON.parse(fs.readFileSync(p, 'utf-8'));
    const arr = d.candidates || d.prospects || (Array.isArray(d) ? d : Object.values(d).find(Array.isArray)) || [];
    for (const x of arr) {
      const dom = (x.site || x.domain || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*/, '').replace(/^www\./, '');
      if (!dom || seen.has(dom)) continue;
      seen.add(dom);
      out.push(x);
    }
  }
  return out;
}
const hasSim = x => Array.isArray(x.outils_presents) && x.outils_presents.includes('simulateur');
function mapBlog(x, segment, campagne) {
  const raw = (x.site || '').replace(/^https?:\/\//, '');
  const dom = raw.replace(/\/.*/, '');
  return {
    name: dom, site: x.site && /^https?:/.test(x.site) ? x.site : 'https://' + raw,
    ville: '', email: x.email || '', url_formulaire: x.url_formulaire || '',
    segment, campagne, note: CONTACTED.has(x.status) ? 'ex-' + x.status : '',
  };
}

function loadDiscovered(file) {
  const p = path.join(ROOT, 'data', 'email-base', '_discovered', file);
  if (!fs.existsSync(p)) throw new Error(`Découverte manquante: ${p} — lance d'abord discover-niche.mjs`);
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

const SEGMENTS = {
  conciergeries: () => {
    // Source : la découverte étendue (toutes villes, tag page_en_ligne) si dispo,
    // sinon l'ancienne discovered-conciergeries.json (46 villes).
    const newP = path.join(ROOT, 'data', 'email-base', '_discovered', 'conciergerie.json');
    const oldP = path.join(ROOT, 'scripts', 'discovered-conciergeries.json');
    const p = fs.existsSync(newP) ? newP : oldP;
    const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
    const arr = Array.isArray(raw) ? raw : (Object.values(raw).find(Array.isArray) || []);
    return arr.map(x => ({ name: x.name, site: x.website || x.site || x.url, ville: x.ville || x.city, phone: x.phone || '', page_en_ligne: x.page_en_ligne, page_url: x.page_url || '', rating: x.rating, reviews: x.reviews, segment: 'conciergerie', campagne: 3 }));
  },
  // Camp 1 : blogs LCD où on pitche un outil (non-conciergerie, sans simulateur perso).
  blog_lcd: () => loadBlogPool()
    .filter(x => x.is_blog && !x.is_conciergerie && !hasSim(x) && (x.email || x.url_formulaire))
    .map(x => mapBlog(x, 'blog_lcd', 1)),
  // Camp 2 : sites qui ONT déjà leur simulateur → on pitchera la page hub.
  blog_simulateur: () => loadBlogPool()
    .filter(x => !x.is_conciergerie && hasSim(x) && (x.email || x.url_formulaire))
    .map(x => mapBlog(x, 'blog_simulateur', 2)),
  // Niches annuaire (proprios découverts via Places) : on scrape l'email comme les conciergeries.
  loveroom: () => loadDiscovered('loveroom.json').map(x => ({ name: x.name, site: x.website, ville: x.ville, phone: x.phone || '', page_en_ligne: x.page_en_ligne, page_url: x.page_url || '', rating: x.rating, reviews: x.reviews, segment: 'loveroom', campagne: 4 })),
  cabane: () => loadDiscovered('cabane.json').map(x => ({ name: x.name, site: x.website, ville: x.ville, phone: x.phone || '', page_en_ligne: x.page_en_ligne, page_url: x.page_url || '', rating: x.rating, reviews: x.reviews, segment: 'cabane', campagne: 5 })),
};

function loadCandidates() {
  if (args.segment) {
    const fn = SEGMENTS[args.segment];
    if (!fn) throw new Error(`Segment inconnu: ${args.segment}. Dispo: ${Object.keys(SEGMENTS).join(', ')}`);
    return { label: args.segment, items: fn() };
  }
  if (args.in) {
    const raw = JSON.parse(fs.readFileSync(path.resolve(args.in), 'utf-8'));
    const arr = Array.isArray(raw) ? raw : (Object.values(raw).find(Array.isArray) || []);
    const nf = args['name-field'] || 'name';
    const sf = args['site-field'] || 'website';
    const vf = args['ville-field'] || 'ville';
    return { label: path.basename(args.in, '.json'), items: arr.map(x => ({ name: x[nf], site: x[sf], ville: x[vf] })) };
  }
  throw new Error('Préciser --segment=<nom> ou --in=<fichier.json>');
}

// ─── Helpers ────────────────────────────────────────────────────────────
const ROLE_LOCALS = new Set([
  'contact', 'info', 'infos', 'bonjour', 'hello', 'hi', 'admin', 'support',
  'sales', 'service', 'commercial', 'reservation', 'reservations', 'booking',
  'accueil', 'gestion', 'agence', 'direction', 'webmaster', 'team', 'equipe',
  'no-reply', 'noreply', 'newsletter', 'rgpd', 'dpo',
]);

// Prénom : extrait seulement si le local-part est `prenom.nom` ou un prénom
// isolé plausible (pas un mot de fonction). Conservateur : mieux vaut vide
// qu'un faux prénom.
function guessPrenom(email) {
  if (!email) return '';
  const local = email.split('@')[0].toLowerCase();
  if (ROLE_LOCALS.has(local)) return '';
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : '';
  const dot = local.match(/^([a-zà-ÿ]{2,})\.[a-zà-ÿ]{2,}$/);
  if (dot) return cap(dot[1]);
  if (/^[a-zà-ÿ]{3,12}$/.test(local) && !ROLE_LOCALS.has(local)) return cap(local); // prénom isolé probable
  return '';
}

function normSite(site) {
  if (!site) return null;
  let s = String(site).trim();
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  return s;
}

// Nettoie le nom (Google Places colle emoji + liste de villes desservies).
function cleanName(n) {
  if (!n) return '';
  return String(n)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}️]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);
}

// Recall : l'email FR est souvent sur /mentions-legales (obligation légale) ou
// /contact, pas la home. On essaie ces pages dans l'ordre, arrêt au 1er email.
// Réutilise extractContact (scrape + isPitchable + score + MX) page par page.
const CONTACT_PATHS = ['', 'mentions-legales', 'contact', 'a-propos'];
async function findContact(site) {
  const domain = extractDomain(site);
  let url_formulaire = null;
  for (const p of CONTACT_PATHS) {
    const u = p === '' ? site : `https://${domain}/${p}`;
    const r = await extractContact(u);
    if (r.email) return { email: r.email, url_formulaire: r.url_formulaire || url_formulaire };
    if (!url_formulaire && r.url_formulaire) url_formulaire = r.url_formulaire;
  }
  return { email: null, url_formulaire };
}

// Pool de concurrence simple, sans dépendance.
async function pool(items, fn, concurrency) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try { out[i] = await fn(items[i], i); }
      catch (e) { out[i] = { ...items[i], statut: 'erreur', note: e.message }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return out;
}

// ─── Traitement d'un candidat ───────────────────────────────────────────
let done = 0;
async function processCandidate(c, total) {
  const site = normSite(c.site);
  const base = { segment: c.segment || args.segment || '', campagne: c.campagne ?? '', nom_boite: cleanName(c.name), site: site || '', email: '', prenom: '', nom_gerant: '', statut: '', phone: c.phone || '', page_en_ligne: c.page_en_ligne === true ? 'oui' : c.page_en_ligne === false ? 'non' : '', ville: c.ville || '', rcpt_code: '', url_formulaire: c.url_formulaire || '', page_url: c.page_url || '', rating: c.rating ?? '', reviews: c.reviews ?? '', note: c.note || '' };

  if (!site) { base.statut = 'ecarte'; base.note = base.note || 'pas de site'; tick(total); return base; }

  // Email déjà connu (segments blog : extrait par la machine) → on saute le
  // scrape, on revalide juste la boîte (RCPT frais).
  let email, url_formulaire;
  if (c.email) {
    email = c.email; url_formulaire = c.url_formulaire || null;
  } else {
    ({ email, url_formulaire } = await findContact(site));
  }
  base.url_formulaire = url_formulaire || base.url_formulaire || '';

  if (!email) {
    base.statut = base.url_formulaire ? 'formulaire' : 'ecarte';
    base.note = base.note || (base.url_formulaire ? 'pas d email, formulaire dispo' : 'aucun contact');
    tick(total);
    return base;
  }

  base.email = email;
  base.prenom = guessPrenom(email);

  // --no-rcpt : on saute le probe SMTP (throttlé depuis IP résidentielle, et
  // MillionVerifier sera la vérification de référence). Email trouvé → a_tester.
  if (args['no-rcpt']) {
    base.statut = 'a_tester'; base.rcpt_code = 'skip'; base.note = base.note || 'à vérifier (MillionVerifier)';
    tick(total); return base;
  }

  const v = await verifyMailbox(email);
  base.rcpt_code = v.code || '';
  if (v.status === 'valid') { base.statut = 'verifie'; }
  else if (v.status === 'invalid') { base.statut = 'faux_email'; base.note = v.reason || ''; }
  else { base.statut = 'a_tester'; base.note = v.reason || 'RCPT incertain'; }

  tick(total);
  return base;
}

function tick(total) {
  done++;
  if (done % 10 === 0 || done === total) console.log(`  … ${done}/${total}`);
}

// ─── CSV (séparateur ; + BOM pour Excel FR) ─────────────────────────────
const COLS = ['segment', 'campagne', 'nom_boite', 'site', 'email', 'prenom', 'nom_gerant', 'statut', 'phone', 'page_en_ligne', 'ville', 'rcpt_code', 'url_formulaire', 'page_url', 'rating', 'reviews', 'note'];
function csvCell(v) {
  v = v == null ? '' : String(v);
  return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}
function toCsv(rows) {
  const head = COLS.join(';');
  const body = rows.map(r => COLS.map(c => csvCell(r[c])).join(';')).join('\n');
  return '﻿' + head + '\n' + body + '\n';
}

// ─── Main ───────────────────────────────────────────────────────────────
async function main() {
  const { label, items: all } = loadCandidates();

  // Dédoublonnage par domaine du site
  const seen = new Set();
  const items = [];
  for (const c of all) {
    const dom = c.site ? extractDomain(normSite(c.site)) : null;
    const key = dom || (c.name || '').toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(c);
  }
  const slice = items.slice(0, LIMIT);

  console.log(`🧱 Base "${label}" : ${all.length} brut → ${items.length} uniques → ${slice.length} traités (concurrence ${CONCURRENCY})`);
  const t0 = Date.now();
  const rows = await pool(slice, (c) => processCandidate(c, slice.length), CONCURRENCY);

  // Tri : verifie > a_tester > formulaire > faux_email > ecarte
  const rank = { verifie: 0, a_tester: 1, formulaire: 2, faux_email: 3, ecarte: 4, erreur: 5 };
  rows.sort((a, b) => (rank[a.statut] ?? 9) - (rank[b.statut] ?? 9));

  const outDir = path.join(ROOT, 'data', 'email-base');
  fs.mkdirSync(outDir, { recursive: true });
  const csvPath = path.join(outDir, `${label}.csv`);
  const jsonPath = path.join(outDir, `${label}.json`);
  fs.writeFileSync(csvPath, toCsv(rows));
  fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2));

  // Récap
  const by = {};
  rows.forEach(r => { by[r.statut] = (by[r.statut] || 0) + 1; });
  const dt = Math.round((Date.now() - t0) / 1000);
  console.log(`\n✅ ${rows.length} lignes en ${dt}s`);
  console.log('   ' + Object.entries(by).map(([k, v]) => `${k}=${v}`).join('  '));
  const contactables = (by.verifie || 0) + (by.a_tester || 0) + (by.formulaire || 0);
  console.log(`   → ${contactables} contactables (${by.verifie || 0} vérifiés email + ${by.a_tester || 0} à tester + ${by.formulaire || 0} formulaire)`);
  console.log(`\n📄 ${csvPath}`);
  console.log(`📄 ${jsonPath}`);
}

main().catch(e => { console.error('💥', e); process.exit(1); });
