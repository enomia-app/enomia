#!/usr/bin/env node
/**
 * fb-watch.mjs — Cron local Mac mini (toutes les 15 min via launchd)
 *
 * Détecte les réponses Marc aux emails "[FB scan]" et lance le posting auto.
 *
 * Pipeline :
 *   1. Lock /tmp/fb-post-running.lock (anti-race)
 *   2. Gmail OAuth → cherche threads "FB scan" non labelisés "fb-scan-posted" avec réponse Marc
 *   3. Pour chaque thread : parse la réponse via Claude API → format strict
 *   4. Pipe vers fb-build-validated.mjs
 *   5. Lance fb-post.mjs (Playwright local)
 *   6. Label thread Gmail "fb-scan-posted"
 *   7. Email confirmation
 *
 * Usage : node scripts/rs-lcd/fb-watch.mjs
 * Log :   ~/projects/eunomia/data/rs-lcd/fb-watch.log
 */

import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync, statSync, unlinkSync, appendFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';
import { applyMarcFeedback, toValidatedArray } from './fb-feedback-parser.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv(path.join(ROOT, '.env'));

const LOCK = '/tmp/fb-post-running.lock';
const LOG = join(ROOT, 'data/rs-lcd/fb-watch.log');

// Deux modes :
// - scan : email "[FB scan]" → drafts fb-drafts.json → post via fb-post.mjs
// - replies : email "[FB replies]" → drafts fb-reply-drafts.json → post via fb-reply.mjs
const MODES = {
  scan: {
    subjectMatch: 'FB scan',
    draftsFile: 'data/rs-lcd/fb-drafts.json',
    outputFile: 'data/rs-lcd/fb-validated.json',
    postScript: 'scripts/rs-lcd/fb-post.mjs',
    subjectPrefix: '[FB scan] Postés',
  },
  replies: {
    subjectMatch: 'FB replies',
    draftsFile: 'data/rs-lcd/fb-reply-drafts.json',
    outputFile: 'data/rs-lcd/fb-reply-validated.json',
    postScript: 'scripts/rs-lcd/fb-reply.mjs',
    subjectPrefix: '[FB replies] Postées',
  },
};

const GMAIL_TOKEN = process.env.GSC_OAUTH_TOKEN || path.join(process.env.HOME, '.config/gcloud/enomia-gsc-token.json');
const GMAIL_CLIENT = process.env.GSC_OAUTH_CLIENT || path.join(process.env.HOME, '.config/gcloud/enomia-oauth-client.json');
const LABEL_TRAITE = 'fb-scan-posted';

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stdout.write(line);
  try { appendFileSync(LOG, line); } catch {}
}

function fail(msg) { log(`ERREUR: ${msg}`); cleanup(); process.exit(1); }
function cleanup() { try { unlinkSync(LOCK); } catch {} }

// Lock anti-race : si run précédent < 60 min, on saute ce tour
function acquireLock() {
  if (existsSync(LOCK)) {
    const age = Date.now() - statSync(LOCK).mtimeMs;
    if (age < 60 * 60 * 1000) {
      log(`Lock présent (${Math.round(age/60000)} min), skip ce tour`);
      process.exit(0);
    }
    log('Lock stale (>60 min), récupération');
  }
  writeFileSync(LOCK, String(process.pid));
}

async function getGmailClient() {
  const client = JSON.parse(readFileSync(GMAIL_CLIENT, 'utf8'));
  const token = JSON.parse(readFileSync(GMAIL_TOKEN, 'utf8'));
  const { client_id, client_secret } = client.installed || client.web;
  const oauth2 = new google.auth.OAuth2(client_id, client_secret);
  oauth2.setCredentials(token);
  return google.gmail({ version: 'v1', auth: oauth2 });
}

async function findOrCreateLabel(gmail, name) {
  const labels = await gmail.users.labels.list({ userId: 'me' });
  const existing = labels.data.labels.find(l => l.name === name);
  if (existing) return existing.id;
  const created = await gmail.users.labels.create({
    userId: 'me',
    requestBody: { name, labelListVisibility: 'labelShow', messageListVisibility: 'show' },
  });
  return created.data.id;
}

async function listCandidateThreads(gmail) {
  // newer_than:3d pour avoir une marge si on tombe en panne quelques jours
  // Exclure les subjects qui sont des notifications (Postés, Clarification, Erreur)
  // pour ne traiter QUE les threads de validation initiaux.
  const res = await gmail.users.threads.list({
    userId: 'me',
    q: `(subject:"FB scan" OR subject:"FB replies") -subject:"Postés" -subject:"Postées" -subject:"Clarification" -subject:"Erreur" newer_than:3d -label:${LABEL_TRAITE}`,
    maxResults: 20,
  });
  return res.data.threads || [];
}

// Détecte le mode (scan ou replies) depuis le subject du premier message
function detectMode(thread) {
  if (!thread.messages || thread.messages.length === 0) return null;
  const subject = getMessageHeader(thread.messages[0], 'Subject');
  if (subject.includes(MODES.replies.subjectMatch)) return 'replies';
  if (subject.includes(MODES.scan.subjectMatch)) return 'scan';
  return null;
}

async function getThreadDetails(gmail, threadId) {
  const res = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
    format: 'full',
  });
  return res.data;
}

function decodeBody(part) {
  if (!part) return '';
  if (part.body && part.body.data) {
    return Buffer.from(part.body.data, 'base64').toString('utf8');
  }
  if (part.parts) {
    for (const p of part.parts) {
      if (p.mimeType === 'text/plain') return decodeBody(p);
    }
    for (const p of part.parts) {
      const t = decodeBody(p);
      if (t) return t;
    }
  }
  return '';
}

function getMessageHeader(message, name) {
  const h = message.payload.headers.find(x => x.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : '';
}

// Trouve le dernier message du thread où Marc répond (subject "Re:")
function findMarcReply(thread) {
  if (!thread.messages || thread.messages.length === 0) return null;
  for (let i = thread.messages.length - 1; i >= 0; i--) {
    const m = thread.messages[i];
    const subject = getMessageHeader(m, 'Subject');
    const from = getMessageHeader(m, 'From');
    if (subject.startsWith('Re:') && from.includes('marc@enomia.app')) {
      const body = decodeBody(m.payload);
      // Retire le quote de l'email original (tout après "Le ... a écrit :")
      const cleaned = body.split(/Le\s.*?a\s+écrit\s*:/)[0].trim();
      return cleaned;
    }
  }
  return null;
}

async function labelThread(gmail, threadId, labelId) {
  await gmail.users.threads.modify({
    userId: 'me',
    id: threadId,
    requestBody: { addLabelIds: [labelId] },
  });
}

function sendConfirmation(subject, body) {
  execSync(
    `./scripts/tech-watchdog/send-report.sh "${subject.replace(/"/g, '\\"')}"`,
    { cwd: ROOT, input: body, encoding: 'utf8', stdio: ['pipe', 'inherit', 'inherit'] }
  );
}

async function processThread(gmail, threadId, labelId) {
  log(`Thread ${threadId} : récupération`);
  const thread = await getThreadDetails(gmail, threadId);

  const mode = detectMode(thread);
  if (!mode) {
    log(`Thread ${threadId} : mode non détecté, skip`);
    return { skipped: true };
  }
  const cfg = MODES[mode];
  log(`Thread ${threadId} : mode=${mode}`);

  const reply = findMarcReply(thread);
  if (!reply) {
    log(`Thread ${threadId} : pas de réponse Marc — skip (pas de label)`);
    return { skipped: true };
  }
  log(`Thread ${threadId} : réponse Marc trouvée (${reply.length} chars)`);

  const draftsPath = join(ROOT, cfg.draftsFile);
  if (!existsSync(draftsPath)) {
    log(`Thread ${threadId} : ${cfg.draftsFile} absent — impossible de traiter`);
    return { error: 'no drafts' };
  }
  const drafts = JSON.parse(readFileSync(draftsPath, 'utf8'));

  log(`Thread ${threadId} : application des retours Marc via Sonnet`);
  const parsed = await applyMarcFeedback(reply, drafts);

  if (parsed.ambiguous) {
    log(`Thread ${threadId} : réponse ambiguë — ${parsed.reason}`);
    sendConfirmation(
      `[${mode === 'scan' ? 'FB scan' : 'FB replies'}] Clarification demandée`,
      `Ta réponse n'a pas pu être interprétée automatiquement.\n\nRaison : ${parsed.reason}\n\nTa réponse :\n${reply}\n\nIntervention manuelle requise (le thread est labelisé fb-scan-posted pour éviter le spam de clarifications).`
    );
    // Labelliser pour éviter le retry en boucle (spam toutes les 15 min)
    try {
      await labelThread(gmail, threadId, labelId);
      log(`Thread ${threadId} : labelisé fb-scan-posted (ambigu, pas de retry)`);
    } catch (e) {
      log(`Thread ${threadId} : ERREUR labélisation (${e.message}) — risque de retry`);
    }
    return { ambiguous: true };
  }

  // Écrit directement validated.json depuis le résultat Sonnet (plus de regex intermédiaire)
  const validated = toValidatedArray(parsed);
  writeFileSync(join(ROOT, cfg.outputFile), JSON.stringify(validated, null, 2));

  // Log compact des actions
  const summary = parsed.drafts.map(d => {
    const fb = d.marcFeedback ? ` — ${d.marcFeedback}` : '';
    const flag = d.action === 'skip' ? 'SKIP' : (d.edited ? 'EDIT' : 'OK');
    return `  ${d.postId} ${flag}${fb}`;
  }).join('\n');
  log(`Drafts traités (${validated.length} à poster) :\n${summary}`);

  log(`Lancement ${cfg.postScript} (peut prendre 15-25 min)`);
  let postResult = { ok: true };
  try {
    execSync(`node ${cfg.postScript} ${cfg.outputFile}`, {
      cwd: ROOT,
      stdio: 'inherit',
      timeout: 35 * 60 * 1000,
    });
  } catch (e) {
    postResult = { ok: false, error: e.message };
    log(`${cfg.postScript} erreur : ${e.message}`);
  }

  log(`Labélisation thread ${threadId}`);
  let labelOk = true;
  try {
    await labelThread(gmail, threadId, labelId);
  } catch (e) {
    labelOk = false;
    log(`Thread ${threadId} : ERREUR labélisation (${e.message}) — mail "Postés" envoyé quand même, risque de retry au prochain tick`);
  }

  // Lecture des résultats réels écrits par fb-post (un par draft, status posted/failed/skipped-dedupe).
  // Le fichier peut être absent / vide si fb-post crashe avant le 1er pushResult.
  const resultsPath = join(ROOT, 'data/rs-lcd/fb-post-results.json');
  let postResults = [];
  try {
    postResults = JSON.parse(readFileSync(resultsPath, 'utf8'));
  } catch (e) {
    log(`fb-post-results.json illisible (${e.message}) — mail sans statut détaillé`);
  }
  const resultByPostId = new Map(postResults.map(r => [r.postId, r]));

  const STATUS_LABEL = {
    'posted': '✓ POSTÉ ',
    'failed': '✗ ÉCHEC ',
    'skipped-dedupe': '⏭ DEDUPE',
  };

  const skipMarc = parsed.drafts.filter(d => d.action === 'skip').length;
  const counts = { posted: 0, failed: 0, 'skipped-dedupe': 0, unknown: 0 };

  const detailLines = parsed.drafts.map(d => {
    let statusLabel, errorMsg;
    if (d.action === 'skip') {
      statusLabel = '⏭ SKIP  ';
    } else {
      const r = resultByPostId.get(d.postId);
      if (!r) {
        statusLabel = '? INCONNU';
        counts.unknown++;
      } else {
        statusLabel = STATUS_LABEL[r.status] || `? ${r.status}`;
        errorMsg = r.error;
        counts[r.status] = (counts[r.status] || 0) + 1;
      }
    }
    const editMark = d.edited ? ' ✎' : '';
    const lines = [`  ${statusLabel} ${d.postId}${editMark} — ${d.url}`];
    if (errorMsg) lines.push(`      ↳ erreur : ${errorMsg}`);
    if (d.marcFeedback) lines.push(`      ↳ retour Marc : ${d.marcFeedback}`);
    return lines.join('\n');
  }).join('\n');

  const totalToPost = counts.posted + counts.failed + counts.unknown;
  const summaryLine = `${counts.posted} posté(s), ${counts.failed} échec(s), ${skipMarc} skip Marc, ${counts['skipped-dedupe']} dedupe${counts.unknown ? `, ${counts.unknown} non-traité(s)` : ''}.`;

  const subject = postResult.ok
    ? `${cfg.subjectPrefix} — ${counts.posted}`
    : `${cfg.subjectPrefix.replace('Postés','Erreur').replace('Postées','Erreur')} — ${counts.failed}/${totalToPost} échec${counts.failed > 1 ? 's' : ''}`;

  const labelWarning = labelOk
    ? ''
    : `\n⚠️ Labélisation Gmail "fb-scan-posted" ÉCHOUÉE — le thread sera retraité au prochain tick fb-watch (skip fb-post via dedupe URL < 24h, mais coût Sonnet). Labélise manuellement ce thread pour stopper la boucle.\n`;

  const errorBanner = postResult.ok
    ? ''
    : `⚠️ fb-post.mjs s'est terminé avec une erreur (${postResult.error}). Détails par draft ci-dessous.\n\n`;

  const body = `${errorBanner}Résultat : ${summaryLine}
${labelWarning}
Détail par draft :
${detailLines}
${postResult.ok ? '' : "\nThread Gmail labélisé \"fb-scan-posted\" malgré l'erreur (pour éviter retry en boucle)."}`;

  sendConfirmation(subject, body);
  log(`Thread ${threadId} : terminé (${postResult.ok ? 'OK' : 'erreur'})`);
  return postResult;
}

async function main() {
  acquireLock();
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(130); });
  process.on('SIGTERM', () => { cleanup(); process.exit(143); });

  if (!process.env.ANTHROPIC_API_KEY) {
    fail('ANTHROPIC_API_KEY absent dans .env');
  }

  log('fb-watch démarré');
  const gmail = await getGmailClient();
  const labelId = await findOrCreateLabel(gmail, LABEL_TRAITE);
  log(`Label "${LABEL_TRAITE}" id=${labelId}`);

  const threads = await listCandidateThreads(gmail);
  log(`${threads.length} threads candidats`);

  if (threads.length === 0) {
    log('Rien à traiter');
    cleanup();
    return;
  }

  for (const t of threads) {
    try {
      await processThread(gmail, t.id, labelId);
    } catch (e) {
      log(`Thread ${t.id} : EXCEPTION ${e.message}`);
    }
  }

  log('fb-watch terminé');
  cleanup();
}

main().catch(e => fail(e.message));
