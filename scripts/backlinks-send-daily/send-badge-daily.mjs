#!/usr/bin/env node
/**
 * Envoi quotidien — campagnes BADGE (conciergeries / love rooms / cabanes).
 * Camp 3/4/5 de la base email (data/email-base/base_complete.json).
 *
 * Différent de send-daily.mjs (qui pitche un OUTIL à des BLOGS en scannant
 * l'article cible). Ici on pitche un BADGE à des ENTREPRISES repérées via
 * Google Places parmi les mieux notées de leur ville :
 *   - observation = note/avis Google (LLM Sonnet, badge-observation.mjs), pas de scrape ;
 *   - lien = page ville/niche Enomia (page_url), seulement si page_en_ligne = oui ;
 *   - email HTML + opt-out + List-Unsubscribe (mailer.mjs), suppression honorée ;
 *   - state propre anti-doublon (data/email-base/send-badge-state.json) + dédup
 *     croisé avec la machine blog (send-daily) pour ne pas double-pitcher un domaine.
 *
 * Cap quotidien PARTAGÉ avec send-daily (15/j total) → régler via --max (défaut 8).
 *
 * Usage :
 *   node scripts/backlinks-send-daily/send-badge-daily.mjs --dry
 *   node scripts/backlinks-send-daily/send-badge-daily.mjs --max=8
 *   node scripts/backlinks-send-daily/send-badge-daily.mjs --segment=conciergerie
 *   node scripts/backlinks-send-daily/send-badge-daily.mjs --bcc   (BCC marc@ pour audit)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isPitchableEmail, hasValidMX, verifyMailbox, extractDomain } from '../backlinks-source-monthly/filters.mjs';
import { buildBadgePitch, qaBadgePitch, buildGreeting, BADGE_SEGMENTS, SEGMENT_LABEL } from './badge-templates.mjs';
import { generateBadgeObservation } from './badge-observation.mjs';
import { sendHtmlEmail, loadSuppression, isSuppressed } from './mailer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const BCC = args.includes('--bcc');
const MAX = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] || '8', 10);
const SEGMENT = args.find(a => a.startsWith('--segment='))?.split('=')[1] || null;

const TODAY = new Date().toISOString().slice(0, 10);
const MONTH = TODAY.slice(0, 7);
const PREV_MONTH = new Date(Date.now() - 31 * 86400000).toISOString().slice(0, 7);
const BASE_PATH = path.join(ROOT, 'data', 'email-base', 'base_complete.json');
const STATE_PATH = path.join(ROOT, 'data', 'email-base', 'send-badge-state.json');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

// Statuts de la base qu'on accepte d'envoyer (cf email-base-builder/README) :
//   verifie  = email + RCPT/MV ok                  → envoyable confirmé
//   a_tester = email ok mais RCPT incertain (MV)   → confirmé au 1er send (RCPT ici)
const SENDABLE = new Set(['verifie', 'a_tester']);

// Statuts du state badge = domaine déjà traité (ne plus re-pitcher).
const CONTACTED = new Set(['sent', 'relance_1', 'repondu_positif', 'repondu_negatif', 'repondu_neutre', 'repondu_spam', 'bounced', 'faux_email', 'opt_out']);

// Segments ÉCARTÉS de l'envoi badge. Conciergerie : écartée DÉFINITIVEMENT
// (décision Marc 2026-06-29 — pas d'annuaire conciergerie ; ce sont des clientes/
// partenaires SaaS, pas des entrées à lister). Traitée comme liste de prospection
// 2027, pas comme cible backlink. (cf. memory project_email_base_2026-06)
const PAUSED_SEGMENTS = new Set(['conciergerie']);

function dom(site) {
  if (!site) return '';
  try { return extractDomain(/^https?:/.test(site) ? site : 'https://' + site) || ''; } catch { return ''; }
}

// Détection "le prospect figure-t-il RÉELLEMENT sur sa page ?" → choisit la
// variante du pitch (retenu vs offre). On fetch la page une fois (cache par
// page_url) et on regarde si son domaine est lié. Fetch en échec → false (offre,
// le choix sûr : on ne revendique pas une sélection qu'on ne peut pas prouver).
const SOCIAL_RE = /(enomia\.app|google\.|gstatic|facebook\.|instagram\.|twitter\.|x\.com|linkedin\.|youtube\.|tiktok|pinterest)/;
const _listedCache = new Map();
async function listedDomainsFor(pageUrl) {
  if (_listedCache.has(pageUrl)) return _listedCache.get(pageUrl);
  const set = new Set();
  try {
    const r = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) });
    if (r.ok) {
      const html = await r.text();
      for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
        const d = dom(m[1]);
        if (d && !SOCIAL_RE.test(d)) set.add(d);
      }
    }
  } catch { /* offre par défaut */ }
  _listedCache.set(pageUrl, set);
  return set;
}
async function isListedOnPage(siteDomain, pageUrl) {
  if (!siteDomain || !pageUrl) return false;
  return (await listedDomainsFor(pageUrl)).has(siteDomain);
}

function loadBase() {
  if (!fs.existsSync(BASE_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(BASE_PATH, 'utf-8')); } catch { return []; }
}
function loadState() {
  if (!fs.existsSync(STATE_PATH)) return { first_send_date: null, sent: {} };
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8')); } catch { return { first_send_date: null, sent: {} }; }
}
function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

// Domaines déjà contactés par la machine BLOG (send-daily) → on évite de
// double-pitcher (une conciergerie peut être présente dans les deux pools).
// Best-effort : les fichiers backlinks-YYYY-MM.json existent sur le Mac mini.
function blogContactedDomains() {
  const set = new Set();
  const BLOG_CONTACTED = new Set(['sent', 'relance_1', 'relance_2', 'repondu_positif', 'repondu_negatif', 'repondu_neutre', 'repondu_spam', 'bounced', 'manual_sent', 'manual_form', 'manual_form_batched']);
  for (const m of [MONTH, PREV_MONTH]) {
    const p = path.join(ROOT, 'data', `backlinks-${m}.json`);
    if (!fs.existsSync(p)) continue;
    try {
      const d = JSON.parse(fs.readFileSync(p, 'utf-8'));
      for (const c of (d.candidates || [])) if (BLOG_CONTACTED.has(c.status)) { const x = dom(c.site); if (x) set.add(x); }
    } catch { /* ignore */ }
  }
  return set;
}

/**
 * Sélectionne les prospects badge à pitcher. Pur + exporté (testable).
 * Filtre : segment badge, statut envoyable, email + page_url présents,
 * page_en_ligne = oui, hors suppression, hors domaines déjà contactés.
 * Tri : verifie avant a_tester, puis nb d'avis décroissant (qualité).
 * Dédoublonné par domaine, tronqué à max.
 */
export function pickBadgeProspects(rows, { max, segment, suppression, excludeDomains } = {}) {
  const supp = suppression || { emails: new Set(), domains: new Set() };
  const excl = excludeDomains || new Set();
  const rank = { verifie: 0, a_tester: 1 };
  const filtered = rows.filter(r =>
    BADGE_SEGMENTS.includes(r.segment)
    && !PAUSED_SEGMENTS.has(r.segment)
    && (!segment || r.segment === segment)
    && SENDABLE.has(r.statut)
    && r.email
    && r.page_url
    && (r.page_en_ligne === 'oui' || r.page_en_ligne === true)
    && !isSuppressed(r.email, supp)
    && !excl.has(dom(r.site))
  );
  filtered.sort((a, b) => {
    const ra = rank[a.statut] ?? 9, rb = rank[b.statut] ?? 9;
    if (ra !== rb) return ra - rb;
    return (Number(b.reviews) || 0) - (Number(a.reviews) || 0);
  });
  const seen = new Set();
  const picked = [];
  for (const r of filtered) {
    const d = dom(r.site);
    if (d && seen.has(d)) continue;
    if (d) seen.add(d);
    picked.push(r);
    if (picked.length >= (max ?? 8)) break;
  }
  return picked;
}

async function getGmailClient() {
  const { google } = await import('googleapis');
  const TOKEN_PATH = path.join(process.env.HOME, '.config/gcloud/enomia-gsc-token.json');
  const t = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  const oauth2 = new google.auth.OAuth2(t.client_id, t.client_secret);
  oauth2.setCredentials({ refresh_token: t.refresh_token });
  return google.gmail({ version: 'v1', auth: oauth2 });
}

async function main() {
  log(`🏷️  Send badge daily ${TODAY} ${DRY ? '(DRY)' : ''}${SEGMENT ? ` [segment=${SEGMENT}]` : ''}`);

  if (SEGMENT && !BADGE_SEGMENTS.includes(SEGMENT)) {
    log(`❌ segment invalide: ${SEGMENT} (attendu: ${BADGE_SEGMENTS.join('|')})`); return;
  }

  const base = loadBase();
  if (!base.length) {
    log(`⚠️ Base vide ou absente (${BASE_PATH}). Régénère la base email d'abord.`);
    return;
  }

  const state = loadState();
  if (!state.first_send_date && !DRY) state.first_send_date = TODAY;
  const suppression = loadSuppression();

  const stateContacted = new Set(Object.entries(state.sent).filter(([, v]) => CONTACTED.has(v.status)).map(([d]) => d));
  const excludeDomains = new Set([...stateContacted, ...blogContactedDomains()]);

  const picked = pickBadgeProspects(base, { max: MAX * 4, segment: SEGMENT, suppression, excludeDomains });
  log(`📋 ${picked.length} pré-sélectionnés (cible envois = ${MAX})`);

  let gm = null;
  if (!DRY) gm = await getGmailClient();

  const sent = [], skipped = [];
  for (const r of picked) {
    if (sent.length >= MAX) { log(`\n✋ Cible ${MAX} atteinte.`); break; }
    const d = dom(r.site);
    log(`\n→ ${r.nom_boite} (${d}) [${r.segment}, ${r.ville}]`);

    // Garde-fou email pré-envoi (a_tester surtout : confirmé ici par RCPT SMTP).
    let emailOk = isPitchableEmail(r.email, d);
    if (emailOk) emailOk = await hasValidMX(r.email.split('@')[1]);
    if (emailOk) {
      const v = await verifyMailbox(r.email);
      if (v.status === 'invalid') {
        emailOk = false;
        state.sent[d] = { status: 'faux_email', date: TODAY, email: r.email, segment: r.segment, code: v.code };
        log(`  🚫 boîte inexistante (SMTP ${v.code}) → faux_email`);
      }
    }
    if (!emailOk) { skipped.push({ r, reason: 'email_invalide' }); log('  ⏭ email invalide'); continue; }

    // Variante : "retenu" si le prospect figure réellement sur sa page, sinon
    // "offre" (honnête : on propose de l'ajouter). Évite la promesse falsifiable.
    const listed = await isListedOnPage(dom(r.site), r.page_url);

    // Observation (LLM Sonnet/Claude Max), ancrée note/avis Google.
    const observation = await generateBadgeObservation(
      { segment: r.segment, nom_boite: r.nom_boite, ville: r.ville, rating: r.rating, reviews: r.reviews }, log,
    );
    const greeting = buildGreeting({ prenom: r.prenom, nom_gerant: r.nom_gerant });
    const pitch = buildBadgePitch({ segment: r.segment, listed, greeting, observation, ville: r.ville, page_url: r.page_url });
    log(`  ${listed ? '✓ listé → mail "retenu"' : '○ non listé → mail "offre"'}`);

    const qa = qaBadgePitch({ ...pitch }, { page_url: r.page_url });
    if (!qa.ok) { skipped.push({ r, reason: 'qa_fail: ' + qa.reasons.join(', ') }); log(`  ⏭ qa_fail: ${qa.reasons.join(', ')}`); continue; }

    if (DRY) {
      log(`  [DRY] → ${r.email} | ${pitch.subject}`);
      log(`  obs: ${observation}`);
      sent.push({ r, pitch, observation });
      continue;
    }
    try {
      const res = await sendHtmlEmail(gm, { to: r.email, bcc: BCC ? 'marc@enomia.app' : null, subject: pitch.subject, text: pitch.text });
      state.sent[d] = {
        status: 'sent', date: TODAY, email: r.email, segment: r.segment, ville: r.ville,
        page_url: r.page_url, gmail_id: res.id, gmail_thread_id: res.threadId,
        subject: pitch.subject, variant: pitch.variant, rating: r.rating ?? '', reviews: r.reviews ?? '',
      };
      sent.push({ r, pitch, observation });
      log(`  ✅ sent (gmail ${res.id}, thread ${res.threadId})`);
      await sleep(10000); // anti-spam
    } catch (e) {
      skipped.push({ r, reason: 'send_fail: ' + e.message });
      log(`  ❌ send_fail: ${e.message}`);
    }
  }

  if (!DRY) { saveState(state); await sendRecap(gm, { sent, skipped }); }
  log(`\n✅ Done. ${sent.length} envoyés, ${skipped.length} skippés.`);
}

async function sendRecap(gm, { sent, skipped }) {
  const subject = `[badge] ${TODAY} — ${sent.length} envoyés`;
  const body = `Salut Marc,

Récap badge du jour (conciergeries / love rooms / cabanes).

📤 Envoyés (${sent.length})
${sent.length === 0 ? '  (aucun)' : sent.map(({ r, pitch, observation }) =>
    `  • ${r.nom_boite} [${SEGMENT_LABEL[r.segment]}, ${r.ville}] → ${r.email}\n    Note ${r.rating ?? '?'} (${r.reviews ?? '?'} avis) | Subject: "${pitch.subject}"\n    Obs: ${observation}\n    Page: ${r.page_url}`).join('\n')}

⏭ Skippés (${skipped.length})
${skipped.length === 0 ? '  (aucun)' : skipped.map(({ r, reason }) => `  • ${r.nom_boite} (${dom(r.site)}) : ${reason}`).join('\n')}

Cap badge du jour = ${MAX} (à coordonner avec send-daily pour rester à 15/j au total).
Rappel : un mail-tester ponctuel de temps en temps (délivrabilité).
`;
  const subjectEncoded = '=?UTF-8?B?' + Buffer.from(subject, 'utf8').toString('base64') + '?=';
  const raw = [
    'From: Marc Chenut <marc@enomia.app>', 'To: marc@enomia.app', 'Subject: ' + subjectEncoded,
    'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit', '', body,
  ].join('\r\n');
  const encoded = Buffer.from(raw, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const res = await gm.users.messages.send({ userId: 'me', requestBody: { raw: encoded } });
  log(`📧 Récap envoyé (gmail ${res.data.id})`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });
