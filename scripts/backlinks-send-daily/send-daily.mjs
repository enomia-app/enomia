#!/usr/bin/env node
/**
 * Envoi quotidien automatique des pitches backlinks — pipeline v2.
 *
 * Workflow :
 *   1. Charge le backlog (data/backlinks-YYYY-MM.json + mois précédent fallback)
 *   2. Pick 15 prospects en status `pending` (priorité = trafic SERP desc, rank asc)
 *   3. Pour chaque : retry extract contact si manquant, scan page, génère 1 phrase perso via Haiku
 *   4. Construit le pitch via template (3 templates par outil)
 *   5. QA auto (placeholder, longueur, URL outil présente, etc.)
 *   6. Si email → envoie via Gmail API (BCC Marc selon état BCC)
 *   7. Si formulaire only → ajoute à la liste manuelle du mail récap
 *   8. Update backlog status + envoie mail récap quotidien
 *
 * Usage :
 *   node scripts/backlinks-send-daily/send-daily.mjs           (run réel)
 *   node scripts/backlinks-send-daily/send-daily.mjs --dry     (génère pitches en local, n'envoie rien)
 *   node scripts/backlinks-send-daily/send-daily.mjs --max=3   (limite à 3 prospects)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';
import { extractContact } from '../backlinks-source-monthly/filters.mjs';
import { buildPitch, qaPitch } from './pitch-templates.mjs';
import { shouldBccToday } from './bcc-state.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const MAX = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] || '15', 10);

// ─── Env ────────────────────────────────────────────────────────────────
function readEnvKey(key) {
  if (process.env[key]) return process.env[key].trim();
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf-8');
    const m = env.match(new RegExp(`^${key}=(.+)$`, 'm'));
    if (m) return m[1].trim();
  }
  return null;
}
const ANTHROPIC_KEY = readEnvKey('ANTHROPIC_API_KEY');

// ─── Helpers ────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0, 10);
const MONTH = TODAY.slice(0, 7);
const PREV_MONTH = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);
const BACKLOG_PATH = path.join(ROOT, 'data', `backlinks-${MONTH}.json`);
const PREV_BACKLOG_PATH = path.join(ROOT, 'data', `backlinks-${PREV_MONTH}.json`);
const BCC_STATE_PATH = path.join(ROOT, 'data', 'backlinks-send-state.json');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

/**
 * Lit + fusionne le backlog du mois courant et précédent.
 */
function loadBacklog() {
  const merged = { candidates: [] };
  for (const p of [PREV_BACKLOG_PATH, BACKLOG_PATH]) {
    if (fs.existsSync(p)) {
      const d = JSON.parse(fs.readFileSync(p, 'utf-8'));
      // Track origine pour réécrire
      d.candidates.forEach(c => { c._origin = p; });
      merged.candidates.push(...d.candidates);
    }
  }
  return merged;
}

/**
 * Réécrit le backlog en regroupant par origine.
 */
function saveBacklog(merged) {
  const byOrigin = {};
  for (const c of merged.candidates) {
    const origin = c._origin || BACKLOG_PATH;
    (byOrigin[origin] = byOrigin[origin] || []).push(c);
  }
  for (const [p, list] of Object.entries(byOrigin)) {
    if (!fs.existsSync(p)) continue;
    const existing = JSON.parse(fs.readFileSync(p, 'utf-8'));
    // Strip _origin pour ne pas polluer le JSON
    existing.candidates = list.map(({ _origin, ...rest }) => rest);
    fs.writeFileSync(p, JSON.stringify(existing, null, 2));
  }
}

/**
 * Sélectionne les 15 meilleurs prospects à envoyer aujourd'hui.
 */
function pickProspects(candidates, max) {
  return candidates
    .filter(c => ['pending', 'pending_fetch'].includes(c.status))
    .sort((a, b) => {
      // Priorité : trafic SERP desc, puis rank desc
      const ta = a.serp_traffic || 0;
      const tb = b.serp_traffic || 0;
      if (ta !== tb) return tb - ta;
      return (a.rank_serp || 99) - (b.rank_serp || 99);
    })
    .slice(0, max);
}

/**
 * Scan la page cible pour extraire titre + corps + prénom auteur si trouvé.
 */
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

    // Titre : <h1>, og:title, <title>
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
    const og = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    const rawTitle = (h1 || og || title || '').replace(/<[^>]+>/g, '').trim();

    // Texte principal : enlève script, style, balises
    const textOnly = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000); // garde 3000 premiers chars

    // Prénom auteur : motifs simples
    const authorMatch = html.match(/(?:by|par|author|écrit\s+par)\s*[:\s]*<[^>]*>\s*([A-ZÀ-Ý][a-zà-ÿ]+)(?:\s+[A-ZÀ-Ý][a-zà-ÿ]+)?\s*</i)
      || html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"' ]+)/i);
    const prenom = authorMatch?.[1] || null;

    return { title: rawTitle, text: textOnly, prenom };
  } catch (e) {
    return null;
  }
}

/**
 * Appelle Claude Haiku pour générer 1 phrase d'observation personnalisée.
 */
async function generateObservation({ title, text, outil_cible }) {
  if (!ANTHROPIC_KEY) {
    return 'L\'angle abordé est intéressant.'; // fallback safe
  }
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

L'outil que je veux pitcher : ${outil_cible}.

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
    if (!r.ok) {
      const t = await r.text();
      log(`  ⚠️ Anthropic HTTP ${r.status}: ${t.slice(0, 200)}`);
      return 'L\'angle abordé est intéressant.';
    }
    const data = await r.json();
    const phrase = data.content?.[0]?.text?.trim().replace(/^["']|["']$/g, '') || 'L\'angle abordé est intéressant.';
    return phrase;
  } catch (e) {
    log(`  ⚠️ Erreur Anthropic: ${e.message}`);
    return 'L\'angle abordé est intéressant.';
  }
}

/**
 * Envoie un mail via Gmail API.
 */
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
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const res = await gm.users.messages.send({ userId: 'me', requestBody: { raw: encoded } });
  return res.data.id;
}

async function getGmailClient() {
  const HOME = process.env.HOME;
  const TOKEN_PATH = path.join(HOME, '.config/gcloud/enomia-gsc-token.json');
  const t = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  const oauth2 = new google.auth.OAuth2(t.client_id, t.client_secret);
  oauth2.setCredentials({ refresh_token: t.refresh_token });
  return google.gmail({ version: 'v1', auth: oauth2 });
}

// ─── Main ───────────────────────────────────────────────────────────────
async function main() {
  log(`🚀 Send daily backlinks ${TODAY} ${DRY ? '(DRY)' : ''}`);

  const backlog = loadBacklog();
  if (!backlog.candidates.length) {
    log('⚠️ Backlog vide (aucun fichier data/backlinks-*.json trouvé). Run sourcing d\'abord.');
    return;
  }

  // BCC state
  const bccState = DRY ? { bcc: false, reason: 'dry' } : shouldBccToday(BCC_STATE_PATH);
  log(`📨 BCC Marc aujourd'hui : ${bccState.bcc} (${bccState.reason})`);

  const picked = pickProspects(backlog.candidates, MAX);
  log(`📋 ${picked.length} prospects sélectionnés (sur ${backlog.candidates.filter(c => ['pending', 'pending_fetch'].includes(c.status)).length} pending)`);

  const sentEmail = [];
  const sentManual = [];
  const skipped = [];

  let gm = null;
  if (!DRY) gm = await getGmailClient();

  for (const c of picked) {
    log(`\n→ ${c.site} (${c.outil_cible})`);

    // 1. Retry extract contact si manquant
    if (!c.email && !c.url_formulaire) {
      const contact = await extractContact(c.page_cible);
      c.email = contact.email;
      c.url_formulaire = contact.url_formulaire;
    }
    if (!c.email && !c.url_formulaire) {
      c.status = 'no_contact';
      c.notes = (c.notes || '') + `[no_contact ${TODAY}]`;
      skipped.push({ ...c, reason: 'no_contact' });
      log(`  ⏭ no_contact`);
      continue;
    }

    // 2. Scan page
    const page = await scanPage(c.page_cible);
    if (!page || !page.title) {
      c.status = 'page_unreadable';
      c.notes = (c.notes || '') + `[page_unreadable ${TODAY}]`;
      skipped.push({ ...c, reason: 'page_unreadable' });
      log(`  ⏭ page_unreadable`);
      continue;
    }
    log(`  📄 titre: "${page.title.slice(0, 60)}..."`);

    // 3. Generate observation
    const observation = await generateObservation({
      title: page.title,
      text: page.text,
      outil_cible: c.outil_cible,
    });
    log(`  💬 obs: "${observation}"`);

    // 4. Build pitch
    const pitch = buildPitch({
      outil_cible: c.outil_cible,
      prenom: c.prenom || page.prenom,
      titre: page.title,
      observation,
    });

    // 5. QA
    const qa = qaPitch(pitch, c);
    if (!qa.ok) {
      c.status = 'qa_fail';
      c.notes = (c.notes || '') + `[qa_fail ${TODAY}: ${qa.reasons.join(', ')}]`;
      skipped.push({ ...c, reason: 'qa_fail', qa_reasons: qa.reasons });
      log(`  ⏭ qa_fail: ${qa.reasons.join(', ')}`);
      continue;
    }

    // 6. Envoi
    if (c.email) {
      if (DRY) {
        log(`  [DRY] would email ${c.email}`);
        log(`  Subject: ${pitch.subject}`);
        log(`  Body preview:\n${pitch.body.slice(0, 200)}...`);
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
          c.pitch_subject = pitch.subject;
          sentEmail.push({ ...c });
          log(`  ✅ sent (gmail ${msgId})`);
          await sleep(10000); // 10s entre envois (anti-spam)
        } catch (e) {
          c.status = 'send_fail';
          c.notes = (c.notes || '') + `[send_fail ${TODAY}: ${e.message}]`;
          skipped.push({ ...c, reason: 'send_fail', error: e.message });
          log(`  ❌ send_fail: ${e.message}`);
        }
      }
    } else {
      // Formulaire only — ajoute à la liste manuelle
      c.status = 'manual_form';
      c.dernier_contact = new Date().toISOString();
      c.pitch_subject = pitch.subject;
      c.pitch_body = pitch.body;
      sentManual.push({ ...c });
      log(`  📋 manual_form: ${c.url_formulaire}`);
    }
  }

  // Save backlog
  if (!DRY) saveBacklog(backlog);

  // Mail récap
  if (!DRY) {
    await sendRecapMail(gm, { sentEmail, sentManual, skipped, bcc: bccState.bcc });
  } else {
    log(`\n📊 DRY summary: ${sentEmail.length} email, ${sentManual.length} manual, ${skipped.length} skipped`);
  }

  log(`\n✅ Done. ${sentEmail.length} envoyés, ${sentManual.length} formulaires manuels, ${skipped.length} skippés.`);
}

async function sendRecapMail(gm, { sentEmail, sentManual, skipped, bcc }) {
  const subject = `[backlinks] ${TODAY} — ${sentEmail.length} envoyés, ${sentManual.length} formulaires à faire`;
  const body = `Salut Marc,

Récap du jour.

📤 Envoyés par email (${sentEmail.length})
${sentEmail.length === 0 ? '  (aucun)' : sentEmail.map(c => `  • ${c.site} → ${c.email}\n    Outil : ${c.outil_cible} | Subject: "${c.pitch_subject}"\n    Article : ${c.page_cible}`).join('\n')}

📋 Formulaires à remplir à la main (${sentManual.length})
${sentManual.length === 0 ? '  (aucun)' : sentManual.map(c => `
  → ${c.site}  [${c.outil_cible}]
    Formulaire : ${c.url_formulaire}
    Article    : ${c.page_cible}
    Subject    : ${c.pitch_subject}
    Pitch :
${c.pitch_body.split('\n').map(l => '      ' + l).join('\n')}
`).join('\n')}

⏭ Skippés (${skipped.length})
${skipped.length === 0 ? '  (aucun)' : skipped.map(c => `  • ${c.site} : ${c.reason}${c.qa_reasons ? ' (' + c.qa_reasons.join(', ') + ')' : ''}`).join('\n')}

${bcc ? '🔍 Tu reçois en BCC les copies des emails envoyés aujourd\'hui (jour audit).' : ''}

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
