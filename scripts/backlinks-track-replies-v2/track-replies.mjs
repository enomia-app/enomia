#!/usr/bin/env node
/**
 * Track replies + relances auto — pipeline backlinks v2.
 *
 * Workflow (1×/jour ouvré à 9h13) :
 *   1. Charge backlog mois courant + précédent
 *   2. Pour chaque prospect en status sent / relance_1 / relance_2 :
 *      a. Récupère le THREAD Gmail (via gmail_thread_id, ou résolu depuis
 *         gmail_id) et y cherche une réponse, quel que soit l'expéditeur.
 *      b. Si réponse → classifier via Sonnet (positive/negative/neutre/spam) → update status
 *   3. Pour les non-répondus :
 *      a. J+5 → status relance_1 + envoi relance T2 auto
 *      b. J+10 → status relance_2 + envoi relance T3 auto
 *      c. J+15 → status pas_de_reponse (pas d'envoi)
 *   4. Si réponses positives → envoie 1 mail dédié à Marc avec liens Gmail
 *
 * Détection par thread : capte les réponses venant d'une AUTRE adresse que
 * celle pitchée (ex : on pitche contact@, la resp. marketing répond depuis
 * son adresse perso). L'ancien filtre from:<adresse pitchée> les ratait, et
 * laissait le prospect en `sent` → relance auto à tort.
 *
 * Usage :
 *   node scripts/backlinks-track-replies-v2/track-replies.mjs
 *   node scripts/backlinks-track-replies-v2/track-replies.mjs --dry
 *     --dry : lit Gmail (détection réelle) mais n'envoie rien et ne sauvegarde rien.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { google } from 'googleapis';
import { callClaudeMax } from '../lib/claude-cli.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const DRY = process.argv.includes('--dry');

// Note : la classification des réponses passe par Claude Max (OAuth) dans
// classifyReply, plus aucune clé API Anthropic n'est lue ici.

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

const OUR_ADDRESS = 'marc@enomia.app';

export function getHeader(msg, name) {
  const h = (msg.payload?.headers || []).find(x => x.name?.toLowerCase() === name.toLowerCase());
  return h?.value || '';
}

// Pur (testable sans Gmail) : parmi les messages d'un thread, renvoie le
// dernier message ENTRANT (expéditeur != nous) daté au plus tôt à afterMs.
export function pickLatestInbound(messages, ourAddress, afterMs = 0) {
  const inbound = (messages || []).filter(m => {
    const from = getHeader(m, 'From').toLowerCase();
    if (!from || from.includes(ourAddress.toLowerCase())) return false; // nos propres messages
    if (/mailer-daemon|postmaster/i.test(from)) return false;           // bounce/NDR, pas une réponse (géré par detectBounces)
    return Number(m.internalDate || 0) >= afterMs;
  });
  if (!inbound.length) return null;
  inbound.sort((a, b) => Number(b.internalDate || 0) - Number(a.internalDate || 0));
  return inbound[0];
}

// Résout le threadId d'un candidat. Auto-répare depuis gmail_id si absent
// (couvre les prospects envoyés avant l'ajout de gmail_thread_id → permet
// l'audit rétroactif des réponses ratées).
async function resolveThreadId(gm, c) {
  if (c.gmail_thread_id) return c.gmail_thread_id;
  const sendId = c.gmail_id || c.gmail_relance_2_id || c.gmail_relance_1_id;
  if (!sendId) return null;
  try {
    const m = await gm.users.messages.get({ userId: 'me', id: sendId, format: 'minimal' });
    if (m.data?.threadId) { c.gmail_thread_id = m.data.threadId; return m.data.threadId; }
  } catch { /* message introuvable (supprimé / purgé) */ }
  return null;
}

// Cherche une réponse dans le thread Gmail, quel que soit l'expéditeur.
async function findThreadReply(gm, threadId, afterIso) {
  const t = await gm.users.threads.get({ userId: 'me', id: threadId, format: 'full' });
  const afterMs = afterIso ? Date.parse(afterIso.slice(0, 10)) : 0;
  return pickLatestInbound(t.data?.messages || [], OUR_ADDRESS, afterMs);
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

// ─── Classification réponse (Sonnet via Claude Max, OAuth) ──────────────
async function classifyReply(text) {
  const prompt = `Classifie cette réponse à un email de prospection backlink (outil gratuit proposé à un blog pour qu'il l'ajoute en ressource dans un article).

Réponse reçue :
"""
${text.slice(0, 1500)}
"""

Réponds par UN seul mot parmi :
- positive : intéressé, demande plus d'info, ok pour ajouter le lien, veut en discuter
- negative : refus (poli ou non), pas intéressé, demande de ne plus être contacté
- spam : auto-reply (absence, accusé de réception), hors sujet, robot, signature seule
- neutre : question ou demande de précision sans engagement clair dans un sens ou l'autre

Réponds UNIQUEMENT par le mot, rien d'autre.`;

  try {
    const out = await callClaudeMax(prompt, { model: 'claude-sonnet-4-6' });
    const w = (out || '').trim().toLowerCase().match(/(positive|negative|spam|neutre)/);
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

// ─── Détection bounces (NDR Gmail) ──────────────────────────────────────

/**
 * Cherche les notifications NDR (Non-Delivery Report) dans Gmail des 14 derniers jours
 * et identifie quels prospects ont bouncé.
 *
 * Sources NDR : mailer-daemon@*, postmaster@*, autres serveurs MTA
 * Le body du NDR contient l'adresse qui a échoué + code SMTP (550, 5.1.1, etc.)
 */
async function detectBounces(gm, sentList) {
  if (sentList.length === 0) return [];

  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10).replace(/-/g, '/');
  const q = `(from:mailer-daemon OR from:postmaster OR subject:"Delivery Status Notification" OR subject:"Mail Delivery" OR subject:"Undeliverable" OR subject:"Returned to sender") after:${fourteenDaysAgo}`;

  let res;
  try {
    res = await gm.users.messages.list({ userId: 'me', q, maxResults: 50 });
  } catch (e) {
    log(`  ⚠️ erreur query bounces: ${e.message}`);
    return [];
  }

  const ndrMessages = res.data.messages || [];
  if (ndrMessages.length === 0) return [];

  log(`  🔍 ${ndrMessages.length} NDR détectés dans Gmail (14 derniers jours)`);

  const sentEmailSet = new Set(sentList.map(c => c.email).filter(Boolean));
  const bouncedMap = new Map(); // email → { reason, ndr_id }

  for (const m of ndrMessages) {
    const full = await gm.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
    const body = extractBody(full.data);
    // Trouver les emails dans le body
    const emails = body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    for (const email of emails) {
      if (sentEmailSet.has(email) && !bouncedMap.has(email)) {
        // Extraire la raison SMTP si présente (code 5xx, message)
        const reasonMatch = body.match(new RegExp(`${email.replace(/[.+]/g, '\\$&')}[\\s\\S]{0,500}?(5\\d{2}[\\s-][\\d.]+\\s+[^\\n]+)`));
        bouncedMap.set(email, {
          reason: reasonMatch?.[1]?.slice(0, 200) || 'bounce détecté (raison non parsée)',
          ndr_id: m.id,
        });
      }
    }
  }

  return Array.from(bouncedMap.entries()).map(([email, info]) => ({ email, ...info }));
}

// ─── Main ───────────────────────────────────────────────────────────────
async function main() {
  log(`🚀 Track replies ${TODAY} ${DRY ? '(DRY)' : ''}`);
  const backlog = loadBacklog();
  const tracked = backlog.candidates.filter(c => ['sent', 'relance_1', 'relance_2'].includes(c.status) && c.email);
  log(`📋 ${tracked.length} prospects à tracker (sent/relance_1/relance_2 avec email)`);

  // Périmètre détection bounces : tous les envois des 14 derniers jours avec email,
  // indépendamment du status (couvre pas_de_reponse, repondu_spam, etc.).
  // Un NDR peut arriver en retard ou après que le status ait changé.
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const bounceScope = backlog.candidates.filter(c =>
    c.email
    && c.status !== 'bounced'
    && c.date_envoi
    && c.date_envoi.slice(0, 10) >= fourteenDaysAgo
  );
  log(`🔭 ${bounceScope.length} prospects dans le scope bounces (envois ≤ 14j, tous statuts)`);

  const gm = await getGmailClient(); // connecté même en --dry (lectures seules)
  const positives = [];
  const negatives = [];
  const relancesEnvoyees = [];
  const pasDeReponse = [];
  const bouncedCandidates = [];

  // ─── Détection bounces (sur scope élargi : tous envois récents) ─────────
  if (!DRY && bounceScope.length > 0) {
    log(`\n🔎 Détection des bounces...`);
    const bounces = await detectBounces(gm, bounceScope);
    for (const b of bounces) {
      const c = bounceScope.find(c => c.email === b.email);
      if (!c) continue;
      c.status = 'bounced';
      c.bounce_detected_at = new Date().toISOString();
      c.bounce_reason = b.reason;
      c.bounce_ndr_id = b.ndr_id;
      bouncedCandidates.push(c);
      log(`  🚨 BOUNCE: ${c.site} (${c.email}) — ${b.reason.slice(0, 80)}`);
    }
    if (bounces.length === 0) log(`  ✓ aucun bounce détecté`);
  }

  if (!tracked.length) {
    log('rien à tracker (replies/relances).');
    if (!DRY) saveBacklog(backlog);
    if (bouncedCandidates.length && !DRY) {
      await sendTrackRecap(gm, { positives, negatives, relancesEnvoyees, pasDeReponse, bouncedCandidates, bounceAlert: `⚠ ${bouncedCandidates.length} bounce(s) détecté(s).`, bounceRate7d: 0, sentLast7Count: 0 });
    }
    return;
  }

  for (const c of tracked) {
    // Skip les prospects déjà marqués bouncés ci-dessus
    if (c.status === 'bounced') continue;
    const refDate = c.date_relance_2 || c.date_relance_1 || c.date_envoi;
    log(`\n→ ${c.site} (status=${c.status}, dernier envoi=${refDate})`);

    // 1. Check replies — via le thread Gmail (capte une réponse depuis
    //    N'IMPORTE QUELLE adresse, pas seulement celle qu'on a pitchée).
    let reply = null;
    try {
      const threadId = await resolveThreadId(gm, c);
      if (threadId) {
        reply = await findThreadReply(gm, threadId, c.date_envoi);
      } else {
        // Fallback legacy : threadId non résolvable → ancienne recherche from:
        const replies = await searchReplies(gm, c.email, refDate);
        reply = replies[0] || null;
      }
    } catch (e) {
      log(`  ⚠️ erreur détection réponse: ${e.message}`);
    }
    if (reply) {
      const body = extractBody(reply);
      const verdict = await classifyReply(body);
      const from = getHeader(reply, 'From');
      log(`  📬 réponse trouvée (de ${from || '?'}) → ${verdict}`);
      c.reponse_recue = verdict;
      c.date_reponse = TODAY;
      c.gmail_reply_id = reply.id;
      c.reply_from = from;
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

  // ─── Calcul bounce rate sur 7 jours glissants ─────────────────────────
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const sentLast7 = backlog.candidates.filter(c => c.date_envoi && c.date_envoi >= sevenDaysAgo);
  const bouncedLast7 = backlog.candidates.filter(c =>
    c.status === 'bounced'
    && c.bounce_detected_at
    && c.bounce_detected_at.slice(0, 10) >= sevenDaysAgo
  );
  const bounceRate7d = sentLast7.length > 0 ? (bouncedLast7.length / sentLast7.length) * 100 : 0;

  let bounceAlert = '';
  const SMALL_SAMPLE = sentLast7.length < 20;
  if (bounceRate7d > 5 && !SMALL_SAMPLE) {
    bounceAlert = `🚨🚨 ALERTE ROUGE — bounce rate 7j = ${bounceRate7d.toFixed(1)}% (${bouncedLast7.length}/${sentLast7.length}). Suggestion : pause le pipeline backlinks-send-daily le temps d'auditer la qualité des emails extraits.`;
  } else if (bounceRate7d > 3 && !SMALL_SAMPLE) {
    bounceAlert = `🚨 ALERTE — bounce rate 7j = ${bounceRate7d.toFixed(1)}% (${bouncedLast7.length}/${sentLast7.length}). Seuil critique = 5%. Surveille de près.`;
  } else if (bouncedCandidates.length > 0) {
    const sampleNote = SMALL_SAMPLE ? ` Échantillon petit (${sentLast7.length} envois sur 7j) — taux pas encore représentatif, attends 20+ envois pour interpréter.` : '';
    bounceAlert = `⚠ ${bouncedCandidates.length} bounce(s) détecté(s). Bounce rate 7j = ${bounceRate7d.toFixed(1)}%.${sampleNote}`;
  }

  // Mail récap (si action OU bounces)
  const hasAction = positives.length + negatives.length + relancesEnvoyees.length + pasDeReponse.length + bouncedCandidates.length;
  if (hasAction && !DRY) {
    await sendTrackRecap(gm, { positives, negatives, relancesEnvoyees, pasDeReponse, bouncedCandidates, bounceAlert, bounceRate7d, sentLast7Count: sentLast7.length });
  }

  log(`\n✅ Done. ${positives.length} positives, ${negatives.length} negatives, ${relancesEnvoyees.length} relances, ${pasDeReponse.length} closed, ${bouncedCandidates.length} bounces.`);
  if (bounceAlert) log(bounceAlert);
}

async function sendTrackRecap(gm, { positives, negatives, relancesEnvoyees, pasDeReponse, bouncedCandidates = [], bounceAlert = '', bounceRate7d = 0, sentLast7Count = 0 }) {
  const subject = `[backlinks] ${TODAY} — Tracking : ${positives.length} positive, ${bouncedCandidates.length} bounce, ${relancesEnvoyees.length} relances`;
  const body = `Salut Marc,

Tracking du jour.

${bounceAlert ? bounceAlert + '\n\n' : ''}🟢 Réponses positives (${positives.length}) — À TRAITER PAR TOI
${positives.length === 0 ? '  (aucune)' : positives.map(c => `  • ${c.site}\n    Email     : ${c.email}\n    Gmail msg : https://mail.google.com/mail/u/0/#inbox/${c.gmail_reply_id}\n    Outil pitché : ${c.outil_pitche || c.outil_cible}`).join('\n\n')}

🚨 Bounces détectés (${bouncedCandidates.length})
${bouncedCandidates.length === 0 ? '  (aucun)' : bouncedCandidates.map(c => `  • ${c.site} → ${c.email}\n    Raison : ${(c.bounce_reason || '').slice(0, 150)}`).join('\n\n')}

🔴 Réponses négatives (${negatives.length}) — INFO
${negatives.length === 0 ? '  (aucune)' : negatives.map(c => `  • ${c.site} (${c.email})`).join('\n')}

📤 Relances envoyées (${relancesEnvoyees.length})
${relancesEnvoyees.length === 0 ? '  (aucune)' : relancesEnvoyees.map(c => `  • ${c.site} (${c.type}) → ${c.email}`).join('\n')}

⏹ Closed sans réponse (${pasDeReponse.length})
${pasDeReponse.length === 0 ? '  (aucune)' : pasDeReponse.map(c => `  • ${c.site}`).join('\n')}

📊 Bounce rate 7 jours : ${bounceRate7d.toFixed(1)}% (${bouncedCandidates.length + (sentLast7Count - bouncedCandidates.length > 0 ? 0 : 0)}/${sentLast7Count} envoyés sur 7j)
   Seuils Google : <0.3% idéal, 3-5% = warning, >5% = arrêt urgent

🔍 Check Postmaster Tools (1x/semaine au moins, dimanche dans le rapport hebdo) :
   https://postmaster.google.com/managedomains?cd=enomia.app

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

// Ne lance main() que si exécuté directement (pas à l'import depuis les tests).
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });
