#!/usr/bin/env node
/**
 * fb-reparse-thread.mjs — Rattrapage : re-parse un thread Gmail FB scan déjà labélisé
 *
 * Utile quand :
 *   - Le pipeline normal (fb-watch) a échoué (bug, OAuth, etc.) → thread déjà marqué "fb-scan-traité"
 *   - On veut re-tenter avec la nouvelle logique (Sonnet + applyMarcFeedback)
 *
 * Usage :
 *   node scripts/rs-lcd/fb-reparse-thread.mjs --thread=19e53485928326b1
 *   node scripts/rs-lcd/fb-reparse-thread.mjs --thread=XXX --execute    # lance fb-post à la fin
 *
 * Sans --execute, le script :
 *   1. Récupère le thread Gmail
 *   2. Charge fb-drafts.json
 *   3. Applique les retours Marc via Sonnet
 *   4. Écrit fb-validated.json
 *   5. Affiche les drafts finaux en console (pour validation manuelle avant posting)
 *
 * Avec --execute : enchaîne sur fb-post.mjs après l'étape 5.
 */

import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync } from 'fs';
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

const args = Object.fromEntries(process.argv.slice(2)
  .filter(a => a.startsWith('--'))
  .map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? true : v];
  }));

if (!args.thread) {
  console.error('Usage : node scripts/rs-lcd/fb-reparse-thread.mjs --thread=<gmailThreadId> [--execute]');
  process.exit(1);
}

const THREAD_ID = args.thread;
const EXECUTE_POST = !!args.execute;

const DRAFTS_FILE = join(ROOT, 'data/rs-lcd/fb-drafts.json');
const OUTPUT_FILE = join(ROOT, 'data/rs-lcd/fb-validated.json');

const GMAIL_TOKEN = process.env.GSC_OAUTH_TOKEN || path.join(process.env.HOME, '.config/gcloud/enomia-gsc-token.json');
const GMAIL_CLIENT = process.env.GSC_OAUTH_CLIENT || path.join(process.env.HOME, '.config/gcloud/enomia-oauth-client.json');

async function getGmailClient() {
  const client = JSON.parse(readFileSync(GMAIL_CLIENT, 'utf8'));
  const token = JSON.parse(readFileSync(GMAIL_TOKEN, 'utf8'));
  const { client_id, client_secret } = client.installed || client.web;
  const oauth2 = new google.auth.OAuth2(client_id, client_secret);
  oauth2.setCredentials(token);
  return google.gmail({ version: 'v1', auth: oauth2 });
}

function decodeBody(part) {
  if (!part) return '';
  if (part.body && part.body.data) return Buffer.from(part.body.data, 'base64').toString('utf8');
  if (part.parts) {
    for (const p of part.parts) if (p.mimeType === 'text/plain') return decodeBody(p);
    for (const p of part.parts) { const t = decodeBody(p); if (t) return t; }
  }
  return '';
}

function getHeader(message, name) {
  const h = message.payload.headers.find(x => x.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : '';
}

function findMarcReply(thread) {
  if (!thread.messages || !thread.messages.length) return null;
  for (let i = thread.messages.length - 1; i >= 0; i--) {
    const m = thread.messages[i];
    const subject = getHeader(m, 'Subject');
    const from = getHeader(m, 'From');
    if (subject.startsWith('Re:') && from.includes('marc@enomia.app')) {
      const body = decodeBody(m.payload);
      return body.split(/Le\s.*?a\s+écrit\s*:/)[0].trim();
    }
  }
  return null;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY absent dans .env');
    process.exit(1);
  }

  console.log(`Récupération thread ${THREAD_ID}...`);
  const gmail = await getGmailClient();
  const res = await gmail.users.threads.get({ userId: 'me', id: THREAD_ID, format: 'full' });
  const reply = findMarcReply(res.data);
  if (!reply) {
    console.error(`Pas de réponse Marc trouvée dans le thread ${THREAD_ID}`);
    process.exit(1);
  }
  console.log(`Réponse Marc : ${reply.length} chars`);

  if (!existsSync(DRAFTS_FILE)) {
    console.error(`fb-drafts.json introuvable : ${DRAFTS_FILE}`);
    process.exit(1);
  }
  const drafts = JSON.parse(readFileSync(DRAFTS_FILE, 'utf8'));
  console.log(`${Object.keys(drafts).length} drafts chargés`);

  console.log('\nAppel Sonnet pour appliquer les retours...');
  const parsed = await applyMarcFeedback(reply, drafts);

  if (parsed.ambiguous) {
    console.error(`\nRéponse ambiguë : ${parsed.reason}`);
    process.exit(1);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('DRAFTS FINAUX (après retours Marc)');
  console.log('═══════════════════════════════════════\n');

  for (const d of parsed.drafts) {
    const action = d.action === 'skip' ? '⏭ SKIP' : (d.edited ? '✎ EDIT' : '✓ OK');
    console.log(`────── ${action} ${d.postId} ──────`);
    console.log(`URL  : ${d.url}`);
    if (d.marcFeedback) console.log(`Marc : ${d.marcFeedback}`);
    if (d.action !== 'skip') {
      console.log(`Texte:\n${d.text}`);
    }
    console.log('');
  }

  const validated = toValidatedArray(parsed);
  writeFileSync(OUTPUT_FILE, JSON.stringify(validated, null, 2));
  console.log(`\n✓ ${validated.length} drafts → ${OUTPUT_FILE}`);

  if (EXECUTE_POST) {
    console.log(`\nLancement fb-post.mjs...`);
    execSync(`node scripts/rs-lcd/fb-post.mjs ${OUTPUT_FILE}`, { cwd: ROOT, stdio: 'inherit' });
  } else {
    console.log(`\nPour poster : node scripts/rs-lcd/fb-post.mjs ${OUTPUT_FILE}`);
    console.log(`Ou relance avec --execute pour enchaîner.`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
