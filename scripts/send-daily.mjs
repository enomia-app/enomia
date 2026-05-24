#!/usr/bin/env node
/**
 * Envoi quotidien automatique — pipeline backlinks v2.1.
 *
 * Workflow :
 *   1. Charge backlog mois courant + précédent
 *   2. Pick 15 prospects `pending` (priorité = serp_traffic desc, rank_serp asc)
 *   3. Pour chaque :
 *      - Si fetch_status != 'ok' (sourcing sans fetch ou fetch fail), retry fetch + détection
 *      - Choisit dynamiquement l'outil à pitcher via chooseOutilToPitch()
 *        - is_conciergerie + simulateur pas présent → simulateur
 *        - is_conciergerie + simulateur déjà présent → SKIP (conflit)
 *        - Tous outils présents → SKIP
 *        - Sinon : 1er manquant dans priorité simulateur > facture > contrat > taxe_sejour
 *      - Scan la page cible (titre + texte)
 *      - Génère 1 phrase d'observation via Claude Haiku
 *      - Construit le pitch via template (subject + body)
 *      - QA auto
 *      - Si email → envoi Gmail API (BCC Marc si jour audit)
 *      - Si formulaire only → ajoute à liste manuelle
 *   4. Update backlog statuses, envoie mail récap à Marc
 *
 * Usage :
 *   node scripts/backlinks-send-daily/send-daily.mjs
 *   node scripts/backlinks-send-daily/send-daily.mjs --dry
 *   node scripts/backlinks-send-daily/send-daily.mjs --max=3
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';
import { extractContact, detectAll } from '../backlinks-source-monthly/filters.mjs';
import { buildPitch, qaPitch, chooseOutilToPitch } from './pitch-templates.mjs';
import { shouldBccToday } from './bcc-state.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const MAX_OVERRIDE = args.find(a => a.startsWith('--max='))?.split('=')[1];

/**
 * Ramp-up automatique du volume quotidien (domaine jeune, < 12 sem d'historique).
 * Lit first_send_date depuis bcc-state.json (ou aujourd'hui si pas encore initialisé).
 * Retourne le max quotidien selon le nombre de semaines écoulées depuis le démarrage.
 */
function computeDailyMax() {
  if (MAX_OVERRIDE) return parseInt(MAX_OVERRIDE, 10);
  const statePath = path.join(ROOT, 'data', 'backlinks-send-state.json');
  let firstSendDate = null;
  if (fs.existsSync(statePath)) {
    try {
      const s = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      firstSendDate = s.first_send_date;
    } catch {}
  }
  if (!firstSendDate) return 5;
  const weeksSince = Math.floor((Date.now() - new Date(firstSendDate).getTime()) / (7 * 86400000));
  if (weeksSince < 1) return 5;
  if (weeksSince < 2) return 8;
  if (weeksSince < 3) return 12;
  if (weeksSince < 4) return 15;
  if (weeksSince < 6) return 20;
  if (weeksSince < 8) return 25;
  return 30;
}

function readEnvKey(key) {
  if (process.env[key]) return process.env[key].trim();
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const m = fs.readFileSync(envPath, 'utf-8').match(new RegExp(`^${key}=(.+)$`, 'm'));
    if (m) return m[1].trim();
  }
  return null;
}
const ANTHROPIC_KEY = readEnvKey('ANTHROPIC_API_KEY');

const TODAY = new Date().toISOString().slice(0, 10);
const MONTH = TODAY.slice(0, 7);
const PREV_MONTH = new Date(Date.now() - 31 * 86400000).toISOString().slice(0, 7);
const BACKLOG_PATH = path.join(ROOT, 'data', `backlinks-${MONTH}.json`);
const PREV_BACKLOG_PATH = path.join(ROOT, 'data', `backlinks-${PREV_MONTH}.json`);
const BCC_STATE_PATH = path.join(ROOT, 'data', 'backlinks-send-state.json');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

function loadBacklog() {
  const merged = { candidates: [] };
  for (const p of [PREV_BACKLOG_PATH, BACKLOG_PATH]) {
    if (fs.existsSync(p)) {
      const d = JSON.parse(fs.readFileSync(p, 'utf-8'));
      d.candidates.forEach(c => { c._origin = p; });
      merged.candidates.push(...d.candidates);
    }
  }
  return merged;
}

function saveBacklog(merged) {
  const byOrigin = {};
  for (const c of merged.candidates) {
    const origin = c._origin;
    if (!origin) continue;
    (byOrigin[origin] = byOrigin[origin] || []).push(c);
  }
  for (const [p, list] of Object.entries(byOrigin)) {
    if (!fs.existsSync(p)) continue;
    const existing = JSON.parse(fs.readFileSync(p, 'utf-8'));
    existing.candidates = list.map(({ _origin, ...rest }) => rest);
    fs.writeFileSync(p, JSON.stringify(existing, null, 2));
  }
}

function pickProspects(candidates, max) {
  // Priorité de pick :
  //   1. is_blog + email connu (envoi auto le plus rentable)
  //   2. is_blog + form connu (Marc remplit à la main, rentable)
  //   3. is_blog encore inconnu (pending_fetch — fetch + détection au send)
  //   4. is_blog === false → on skip explicitement (cibles non rentables)
  function bucket(c) {
    // Skip explicite si is_blog a été détecté ET vaut false (site service)
    if (c.is_blog === false) return 99; // hors pool
    // Sinon : blog confirmé OU non encore détecté (pending_fetch)
    if (c.email) return 0;
    if (c.url_formulaire) return 1;
    return 2; // pending fetch (mining)
  }
  return candidates
    .filter(c => c.status === 'pending')
    .map(c => ({ c, b: bucket(c) }))
    .filter(({ b }) => b < 99)
    .sort((a, b) => {
      if (a.b !== b.b) return a.b - b.b;
      const ta = a.c.serp_traffic || 0;
      const tb = b.c.serp_traffic || 0;
      if (ta !== tb) return tb - ta;
      return (a.c.rank_serp || 99) - (b.c.rank_serp || 99);
    })
    .slice(0, max)
    .map(({ c }) => c);
}

async function scanPage(url) {
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    });
    if (!r.ok) return null;
    const html = await r.text();

    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
    const og = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    const rawTitle = (h1 || og || title || '').replace(/<[^>]+>/g, '').trim();

    const textOnly = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);

    const authorMatch = html.match(/(?:by|par|author|écrit\s+par)\s*[:\s]*<[^>]*>\s*([A-ZÀ-Ý][a-zà-ÿ]+)(?:\s+[A-ZÀ-Ý][a-zà-ÿ]+)?\s*</i)
      || html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"' ]+)/i);
    const prenom = authorMatch?.[1] || null;

    return { title: rawTitle, text: textOnly, prenom };
  } catch {
    return null;
  }
}

async function generateObservation({ title, text, outil }) {
  if (!ANTHROPIC_KEY) return 'L\'angle abordé est intéressant.';

  const outilContext = {
    simulateur: 'simulateur de rentabilité gratuit',
    contrat: 'modèle de contrat de location saisonnière gratuit',
    facture: 'générateur de factures gratuit',
    taxe_sejour: 'calculateur de taxe de séjour gratuit',
  }[outil] || 'outil';

  const prompt = `Tu lis un article de blog sur la location courte durée / Airbnb. Tu dois écrire UNE SEULE phrase d'observation courte (8-15 mots) sur le contenu, qui sera utilisée dans un email de prospection.

Règles STRICTES :
- 1 seule phrase, 8-15 mots
- En français, vouvoiement implicite
- Observation honnête sur 1 point précis (méthodologie, angle, clarté, exemple, etc.)
- PAS de superlatif ("excellent", "génial", "passionnant")
- PAS de tirets cadratins (—), pas de flèches (→), pas d'emoji
- Ton humain, comme un confrère qui commente
- Doit pouvoir s'enchaîner après : J'ai lu votre article "[titre]". ${'<TA_PHRASE>'} Nous avons développé...

Titre de l'article : "${title}"

Contenu (extrait) :
${text.slice(0, 2000)}

L'outil que je veux pitcher : ${outilContext}.

Réponds UNIQUEMENT par la phrase, sans guillemets, sans intro.`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 80,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!r.ok) return 'L\'angle abordé est intéressant.';
    const data = await r.json();
    return data.content?.[0]?.text?.trim().replace(/^["']|["']$/g, '') || 'L\'angle abordé est intéressant.';
  } catch {
    return 'L\'angle abordé est intéressant.';
  }
}

async function sendEmail(gm, { to, bcc, subject, body }) {
  const subjectEncoded = '=?UTF-8?B?' + Buffer.from(subject, 'utf8').toString('base64') + '?=';
  const headers = [
    'From: Marc Chenut <marc@enomia.app>',
    `To: ${to}`,
  ];
  if (bcc) headers.push(`Bcc: ${bcc}`);
  headers.push('Subject: ' + subjectEncoded);
  headers.push('MIME-Version: 1.0');
  headers.push('Content-Type: text/plain; charset=UTF-8');
  headers.push('Content-Transfer-Encoding: 8bit');
  const raw = headers.join('\r\n') + '\r\n\r\n' + body;
  const encoded = Buffer.from(raw, 'utf8')
    .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const res = await gm.users.messages.send({ userId: 'me', requestBody: { raw: encoded } });
  return res.data.id;
}

async function getGmailClient() {
  const TOKEN_PATH = path.join(process.env.HOME, '.config/gcloud/enomia-gsc-token.json');
  const t = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  const oauth2 = new google.auth.OAuth2(t.client_id, t.client_secret);
  oauth2.setCredentials({ refresh_token: t.refresh_token });
  return google.gmail({ version: 'v1', auth: oauth2 });
}

async function main() {
  log(`🚀 Send daily backlinks ${TODAY} ${DRY ? '(DRY)' : ''}`);

  const backlog = loadBacklog();
  if (!backlog.candidates.length) {
    log('⚠️ Backlog vide. Run sourcing d\'abord.');
    return;
  }

  const bccState = DRY ? { bcc: false, reason: 'dry' } : shouldBccToday(BCC_STATE_PATH);
  log(`📨 BCC Marc : ${bccState.bcc} (${bccState.reason})`);

  const MAX = computeDailyMax();
  // Pré-pick MAX × 5 pour avoir une marge si beaucoup de candidats sont skippés
  // (not_blog, qa_fail, page_unreadable, etc.)
  const picked = pickProspects(backlog.candidates, MAX * 5);
  const pendingCount = backlog.candidates.filter(c => c.status === 'pending').length;
  log(`📋 ${picked.length} prospects pré-sélectionnés sur ${pendingCount} pending (cible envois auto = ${MAX})`);

  const sentEmail = [];
  const sentManual = [];
  const skipped = [];

  let gm = null;
  if (!DRY) gm = await getGmailClient();

  for (const c of picked) {
    // Stop dès qu'on atteint la cible d'envois auto (compte email + manual)
    if (sentEmail.length + sentManual.length >= MAX) {
      log(`\n✋ Cible atteinte (${MAX} envois traités), stop.`);
      break;
    }
    log(`\n→ ${c.site}`);

    // 1. Re-fetch + détection si fetch_status pas OK
    if (c.fetch_status !== 'ok' || c.outils_presents === undefined || c.is_blog === undefined) {
      log(`  🔍 Re-fetch (status précédent: ${c.fetch_status})`);
      const det = await detectAll(c.page_cible, c.site);
      if (det) {
        c.outils_presents = det.tools;
        c.is_conciergerie = det.is_conciergerie;
        c.is_blog = det.is_blog;
        c.fetch_status = 'ok';
        if (!c.email && !c.url_formulaire) {
          const contact = await extractContact(c.page_cible);
          c.email = contact.email;
          c.url_formulaire = contact.url_formulaire;
        }
      } else {
        c.fetch_status = 'fail';
        c.status = 'fetch_fail';
        skipped.push({ ...c, reason: 'fetch_fail' });
        log(`  ⏭ fetch_fail`);
        continue;
      }
    }

    // 2. Skip si ce n'est pas un blog (= site service, ne répondra pas)
    if (c.is_blog === false) {
      c.status = 'skip_not_blog';
      skipped.push({ ...c, reason: 'not_blog' });
      log(`  ⏭ not_blog (site service)`);
      continue;
    }

    // 3. Pas de contact → skip
    if (!c.email && !c.url_formulaire) {
      c.status = 'no_contact';
      skipped.push({ ...c, reason: 'no_contact' });
      log(`  ⏭ no_contact`);
      continue;
    }

    // 3. Choisit dynamiquement l'outil à pitcher
    const outil = chooseOutilToPitch({
      outils_presents: c.outils_presents || [],
      is_conciergerie: c.is_conciergerie || false,
      kw_origin_bucket: c.kw_origin_bucket,
    });
    if (!outil) {
      if (c.is_conciergerie) {
        c.status = 'skip_conciergerie';
        skipped.push({ ...c, reason: 'conciergerie_avec_simulateur' });
        log(`  ⏭ conciergerie + simulateur déjà présent`);
      } else {
        c.status = 'skip_tous_outils_presents';
        skipped.push({ ...c, reason: 'tous_outils_presents' });
        log(`  ⏭ tous outils présents`);
      }
      continue;
    }
    log(`  🎯 outil choisi: ${outil} (présents: ${(c.outils_presents || []).join(',') || 'aucun'}${c.is_conciergerie ? ', conciergerie' : ''})`);

    // 4. Scan page pour titre + texte + prenom auteur
    const page = await scanPage(c.page_cible);
    if (!page || !page.title) {
      c.status = 'page_unreadable';
      skipped.push({ ...c, reason: 'page_unreadable' });
      log(`  ⏭ page_unreadable`);
      continue;
    }
    log(`  📄 titre: "${page.title.slice(0, 60)}..."`);

    // 5. Génère 1 phrase d'observation Haiku
    const observation = await generateObservation({ title: page.title, text: page.text, outil });
    log(`  💬 obs: "${observation}"`);

    // 6. Build pitch
    const pitch = buildPitch({
      outil,
      prenom: c.prenom || page.prenom,
      titre: page.title,
      observation,
    });

    // 7. QA
    const qa = qaPitch(pitch);
    if (!qa.ok) {
      c.status = 'qa_fail';
      skipped.push({ ...c, reason: 'qa_fail', qa_reasons: qa.reasons });
      log(`  ⏭ qa_fail: ${qa.reasons.join(', ')}`);
      continue;
    }

    c.outil_pitche = outil;
    c.pitch_subject = pitch.subject;

    // 8. Envoi
    if (c.email) {
      if (DRY) {
        log(`  [DRY] would email ${c.email} (outil=${outil})`);
        log(`  ✉ Subject: ${pitch.subject}`);
        log(`  ✉ Body preview:\n${pitch.body.split('\n').slice(0, 6).join('\n')}\n  ...`);
      } else {
        try {
          const msgId = await sendEmail(gm, {
            to: c.email,
            bcc: bccState.bcc ? 'marc@enomia.app' : null,
            subject: pitch.subject,
            body: pitch.body,
          });
          c.status = 'sent';
          c.date_envoi = TODAY;
          c.gmail_id = msgId;
          c.dernier_contact = new Date().toISOString();
          sentEmail.push({ ...c });
          log(`  ✅ sent (gmail ${msgId})`);
          await sleep(10000); // anti-spam
        } catch (e) {
          c.status = 'send_fail';
          skipped.push({ ...c, reason: 'send_fail', error: e.message });
          log(`  ❌ send_fail: ${e.message}`);
        }
      }
    } else {
      c.status = 'manual_form';
      c.dernier_contact = new Date().toISOString();
      c.pitch_body = pitch.body;
      sentManual.push({ ...c });
      log(`  📋 manual_form: ${c.url_formulaire}`);
    }
  }

  if (!DRY) saveBacklog(backlog);

  if (!DRY) {
    await sendRecapMail(gm, { sentEmail, sentManual, skipped, bcc: bccState.bcc });
  } else {
    log(`\n📊 DRY summary: ${sentEmail.length} email, ${sentManual.length} manual, ${skipped.length} skipped`);
  }

  log(`\n✅ Done. ${sentEmail.length} envoyés, ${sentManual.length} formulaires, ${skipped.length} skippés.`);
}

async function sendRecapMail(gm, { sentEmail, sentManual, skipped, bcc }) {
  const subject = `[backlinks] ${TODAY} — ${sentEmail.length} envoyés, ${sentManual.length} formulaires à faire`;
  const body = `Salut Marc,

Récap du jour.

📤 Envoyés par email (${sentEmail.length})
${sentEmail.length === 0 ? '  (aucun)' : sentEmail.map(c => `  • ${c.site} → ${c.email}\n    Outil pitché : ${c.outil_pitche} | Subject: "${c.pitch_subject}"\n    Article : ${c.page_cible}`).join('\n')}

📋 Formulaires à remplir à la main (${sentManual.length})
${sentManual.length === 0 ? '  (aucun)' : sentManual.map(c => `
  → ${c.site}  [${c.outil_pitche}]
    Formulaire : ${c.url_formulaire}
    Article    : ${c.page_cible}
    Subject    : ${c.pitch_subject}
    Pitch :
${c.pitch_body.split('\n').map(l => '      ' + l).join('\n')}
`).join('\n')}

⏭ Skippés (${skipped.length})
${skipped.length === 0 ? '  (aucun)' : skipped.map(c => `  • ${c.site} : ${c.reason}${c.qa_reasons ? ' (' + c.qa_reasons.join(', ') + ')' : ''}`).join('\n')}

${bcc ? '🔍 Tu reçois en BCC les copies des emails envoyés aujourd\'hui (jour audit).\n' : ''}
🔍 Postmaster Tools (check 1x par jour, 10s) :
   https://postmaster.google.com/managedomains?cd=enomia.app
   Spam Rate doit rester < 0.3%. Domain Reputation = High ou Medium.

📈 Ramp-up volume (domaine jeune, 40 jours d'historique au démarrage) :
   Sem 1=5/j, Sem 2=8, Sem 3=12, Sem 4=15, Sem 5-6=20, Sem 7-8=25, Sem 9+=30
   Auto-géré : passe au pallier suivant chaque semaine si bounce rate < 3% et reputation High/Medium.

Prochain run demain 10h17 (jour ouvré).
`;

  const subjectEncoded = '=?UTF-8?B?' + Buffer.from(subject, 'utf8').toString('base64') + '?=';
  const raw = [
    'From: Marc Chenut <marc@enomia.app>',
    'To: marc@enomia.app',
    'Subject: ' + subjectEncoded,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    body,
  ].join('\r\n');
  const encoded = Buffer.from(raw, 'utf8')
    .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const res = await gm.users.messages.send({ userId: 'me', requestBody: { raw: encoded } });
  log(`📧 Récap envoyé (gmail ${res.data.id})`);
}

main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });
