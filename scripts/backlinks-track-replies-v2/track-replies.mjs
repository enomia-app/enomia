#!/usr/bin/env node
/**
 * Track replies + relances auto — pipeline backlinks v2.
 *
 * Workflow (1×/jour ouvré à 9h13) :
 *   1. Charge backlog mois courant + précédent
 *   2. Pour chaque prospect en status sent / relance_1 / relance_2 :
 *      a. Query Gmail pour réponses du prospect depuis date_envoi (ou date_relance)
 *      b. Si réponse → classifier via Haiku (positive/negative/neutre/spam) → update status
 *   3. Pour les non-répondus :
 *      a. J+5 → status relance_1 + envoi relance T2 auto
 *      b. J+10 → status relance_2 + envoi relance T3 auto
 *      c. J+15 → status pas_de_reponse (pas d'envoi)
 *   4. Si réponses positives → envoie 1 mail dédié à Marc avec liens Gmail
 *
 * Usage :
 *   node scripts/backlinks-track-replies-v2/track-replies.mjs
 *   node scripts/backlinks-track-replies-v2/track-replies.mjs --dry
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const DRY = process.argv.includes('--dry');

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

const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const daysBetween = (iso) => Math.floor((new Date(TODAY) - new Date(iso.slice(0, 10))) / 86400000);

// ─── Backlog I/O ────────────────────────────────────────────────────────
function loadBacklog() {
  const merged = { candidates: [] };
  for (const m of [PREV_MONTH, MONTH]) {
    const p = path.join(ROOT, 'data', `backlinks-${m}.json`);
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

// ─── Gmail ──────────────────────────────────────────────────────────────
async function getGmailClient() {
  const TOKEN_PATH = path.join(process.env.HOME, '.config/gcloud/enomia-gsc-token.json');
  const t = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  const oauth2 = new google.auth.OAuth2(t.client_id, t.client_secret);
  oauth2.setCredentials({ refresh_token: t.refresh_token });
  return google.gmail({ version: 'v1', auth: oauth2 });
}

async function searchReplies(gm, fromEmail, afterDate) {
  // Gmail format date : YYYY/MM/DD
  const after = afterDate.replace(/-/g, '/');
  const q = `from:${fromEmail} after:${after}`;
  const res = await gm.users.messages.list({ userId: 'me', q, maxResults: 5 });
  const msgs = res.data.messages || [];
  const full = [];
  for (const m of msgs) {
    const detail = await gm.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
    full.push(detail.data);
  }
  return full;
}

function extractBody(msg) {
  function walk(payload) {
    if (payload.body?.data) return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    if (payload.parts) {
      for (const p of payload.parts) {
        if (p.mimeType === 'text/plain') {
          if (p.body?.data) return Buffer.from(p.body.data, 'base64').toString('utf-8');
        }
        const sub = walk(p);
        if (sub) return sub;
      }
    }
    return null;
  }
  return walk(msg.payload) || '';
}

async function sendMail(gm, { to, subject, body, inReplyTo }) {
  const subjectEncoded = '=?UTF-8?B?' + Buffer.from(subject, 'utf8').toString('base64') + '?=';
  const headers = [
    'From: Marc Chenut <marc@enomia.app>',
    `To: ${to}`,
    'Subject: ' + subjectEncoded,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
  ];
  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`);
    headers.push(`References: ${inReplyTo}`);
  }
  const raw = headers.join('\r\n') + '\r\n\r\n' + body;
  const encoded = Buffer.from(raw, 'utf8')
    .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const res = await gm.users.messages.send({ userId: 'me', requestBody: { raw: encoded } });
  return res.data.id;
}

// ─── Anthropic Haiku ────────────────────────────────────────────────────
async function classifyReply(text) {
  if (!ANTHROPIC_KEY) return 'unknown';
  const prompt = `Classifie cette réponse à un email de prospection backlink (outil gratuit proposé).

Réponse :
"""
${text.slice(0, 1500)}
"""

Réponds par UN seul mot parmi : positive (intéressé, demande plus d'info, ok pour ajouter le lien) | negative (refus poli ou non) | spam (auto-reply, hors sujet, robot) | neutre (question, demande de précision sans engagement clair).`;

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
        max_tokens: 20,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!r.ok) return 'unknown';
    const data = await r.json();
    const w = data.content?.[0]?.text?.trim().toLowerCase().match(/(positive|negative|spam|neutre)/);
    return w?.[1] || 'unknown';
  } catch {
    return 'unknown';
  }
}

// ─── Templates relance ──────────────────────────────────────────────────
const RELANCE_T2 = ({ prenom, outil_label }) => `Bonjour ${prenom || ''},

Je relance suite à mon mail il y a quelques jours sur ${outil_label} pour vos lecteurs.

Si vous n'avez pas eu le temps de le regarder, ou si vous voulez plus d'éléments avant de décider (captures d'écran, démo, autre), je suis là.

Marc Chenut
marc@enomia.app
`.replace('Bonjour ,', 'Bonjour,');

const RELANCE_T3 = ({ prenom, outil_label }) => `Bonjour ${prenom || ''},

Je rebondis une dernière fois sur ma proposition d'ajouter ${outil_label} à votre article.

Si l'idée vous parle, je peux vous proposer un créneau visio rapide pour en discuter. Sinon, dites-le et je ne vous embête plus.

Marc Chenut
marc@enomia.app
`.replace('Bonjour ,', 'Bonjour,');

const OUTIL_LABELS = {
  simulateur: 'notre simulateur de rentabilité gratuit',
  contrat: 'notre modèle de contrat de location saisonnière gratuit',
  facture: 'notre générateur de factures gratuit',
};

// ─── Main ───────────────────────────────────────────────────────────────
async function main() {
  log(`🚀 Track replies ${TODAY} ${DRY ? '(DRY)' : ''}`);
  const backlog = loadBacklog();
  const tracked = backlog.candidates.filter(c => ['sent', 'relance_1', 'relance_2'].includes(c.status) && c.email);
  log(`📋 ${tracked.length} prospects à tracker (sent/relance_1/relance_2 avec email)`);

  if (!tracked.length) {
    log('rien à faire.');
    return;
  }

  const gm = DRY ? null : await getGmailClient();
  const positives = [];
  const negatives = [];
  const relancesEnvoyees = [];
  const pasDeReponse = [];

  for (const c of tracked) {
    const refDate = c.date_relance_2 || c.date_relance_1 || c.date_envoi;
    log(`\n→ ${c.site} (status=${c.status}, dernier envoi=${refDate})`);

    // 1. Check replies
    if (!DRY) {
      const replies = await searchReplies(gm, c.email, refDate);
      if (replies.length) {
        const body = extractBody(replies[0]);
        const verdict = await classifyReply(body);
        log(`  📬 réponse trouvée → ${verdict}`);
        c.reponse_recue = verdict;
        c.date_reponse = TODAY;
        c.gmail_reply_id = replies[0].id;
        if (verdict === 'positive') {
          c.status = 'repondu_positif';
          positives.push(c);
        } else if (verdict === 'negative') {
          c.status = 'repondu_negatif';
          negatives.push(c);
        } else if (verdict === 'spam') {
          c.status = 'repondu_spam';
        } else {
          c.status = 'repondu_neutre';
        }
        continue;
      }
    }

    // 2. Relances
    const daysSince = daysBetween(refDate);
    if (c.status === 'sent' && daysSince >= 5) {
      // Relance 1
      if (!DRY) {
        const body = RELANCE_T2({ prenom: c.prenom, outil_label: OUTIL_LABELS[c.outil_cible] });
        const subject = 'Re: ' + (c.pitch_subject || 'notre échange');
        const msgId = await sendMail(gm, { to: c.email, subject, body });
        c.status = 'relance_1';
        c.date_relance_1 = TODAY;
        c.gmail_relance_1_id = msgId;
        relancesEnvoyees.push({ ...c, type: 'relance_1' });
        log(`  📤 relance_1 envoyée (gmail ${msgId})`);
        await sleep(10000);
      } else {
        log(`  [DRY] would send relance_1`);
      }
    } else if (c.status === 'relance_1' && daysBetween(c.date_relance_1) >= 5) {
      // Relance 2 (donc J+10 du send initial)
      if (!DRY) {
        const body = RELANCE_T3({ prenom: c.prenom, outil_label: OUTIL_LABELS[c.outil_cible] });
        const subject = 'Re: ' + (c.pitch_subject || 'notre échange');
        const msgId = await sendMail(gm, { to: c.email, subject, body });
        c.status = 'relance_2';
        c.date_relance_2 = TODAY;
        c.gmail_relance_2_id = msgId;
        relancesEnvoyees.push({ ...c, type: 'relance_2' });
        log(`  📤 relance_2 envoyée (gmail ${msgId})`);
        await sleep(10000);
      } else {
        log(`  [DRY] would send relance_2`);
      }
    } else if (c.status === 'relance_2' && daysBetween(c.date_relance_2) >= 5) {
      // J+15 sans réponse
      c.status = 'pas_de_reponse';
      pasDeReponse.push(c);
      log(`  ⏹ pas_de_reponse (J+15)`);
    }
  }

  if (!DRY) saveBacklog(backlog);

  // Mail récap (uniquement si action)
  const hasAction = positives.length + negatives.length + relancesEnvoyees.length + pasDeReponse.length;
  if (hasAction && !DRY) {
    await sendTrackRecap(gm, { positives, negatives, relancesEnvoyees, pasDeReponse });
  }

  log(`\n✅ Done. ${positives.length} positives, ${negatives.length} negatives, ${relancesEnvoyees.length} relances, ${pasDeReponse.length} closed.`);
}

async function sendTrackRecap(gm, { positives, negatives, relancesEnvoyees, pasDeReponse }) {
  const subject = `[backlinks] ${TODAY} — Tracking : ${positives.length} positive, ${relancesEnvoyees.length} relances`;
  const body = `Salut Marc,

Tracking du jour.

🟢 Réponses positives (${positives.length}) — À TRAITER PAR TOI
${positives.length === 0 ? '  (aucune)' : positives.map(c => `  • ${c.site}\n    Email     : ${c.email}\n    Gmail msg : https://mail.google.com/mail/u/0/#inbox/${c.gmail_reply_id}\n    Outil pitché : ${c.outil_cible}`).join('\n\n')}

🔴 Réponses négatives (${negatives.length}) — INFO
${negatives.length === 0 ? '  (aucune)' : negatives.map(c => `  • ${c.site} (${c.email})`).join('\n')}

📤 Relances envoyées (${relancesEnvoyees.length})
${relancesEnvoyees.length === 0 ? '  (aucune)' : relancesEnvoyees.map(c => `  • ${c.site} (${c.type}) → ${c.email}`).join('\n')}

⏹ Closed sans réponse (${pasDeReponse.length})
${pasDeReponse.length === 0 ? '  (aucune)' : pasDeReponse.map(c => `  • ${c.site}`).join('\n')}

Prochain tracking demain 9h13 (jour ouvré).
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
