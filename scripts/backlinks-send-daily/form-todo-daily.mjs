#!/usr/bin/env node
/**
 * To-do formulaires quotidien — prospects badge "formulaire-seul" (pas d'email).
 *
 * Plutôt que d'auto-soumettre les formulaires (Chrome MCP = flaky : captcha,
 * détection, hang — cf. incident GSC), on envoie à Marc un mail copy-paste :
 * pour chaque prospect, l'URL du formulaire + l'objet + le message prêt à coller.
 * Marc clique, colle, gère le captcha, soumet. ~10/jour.
 *
 * Les soumissions de formulaires NE comptent PAS dans le budget 15 emails/j
 * (elles partent du site du prospect, pas de marc@enomia.app) → indépendant.
 *
 * Pitch = badge "offre" (j'aimerais y ajouter la vôtre), observation note/avis
 * DÉTERMINISTE (pas de LLM → robuste, tourne n'importe où). Conciergerie en pause.
 *
 * Usage :
 *   node scripts/backlinks-send-daily/form-todo-daily.mjs --dry
 *   node scripts/backlinks-send-daily/form-todo-daily.mjs --max=10
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { extractDomain } from '../backlinks-source-monthly/filters.mjs';
import { buildBadgePitch, buildGreeting } from './badge-templates.mjs';
import { fallbackObservation } from './badge-observation.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const MAX = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] || '10', 10);

const TODAY = new Date().toISOString().slice(0, 10);
const BASE_PATH = path.join(ROOT, 'data', 'email-base', 'base_complete.json');
const STATE_PATH = path.join(ROOT, 'data', 'email-base', 'form-todo-state.json');

// Niches actives pour les formulaires (conciergerie en pause ; blogs gérés par
// le récap de send-daily). On ne propose que les pages live (le pitch a un lien).
const ACTIVE_SEGMENTS = new Set(['loveroom', 'cabane']);

const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const dom = site => { try { return extractDomain(/^https?:/.test(site) ? site : 'https://' + site) || ''; } catch { return ''; } };

function loadBase() {
  if (!fs.existsSync(BASE_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(BASE_PATH, 'utf-8')); } catch { return []; }
}
function loadState() {
  if (!fs.existsSync(STATE_PATH)) return { sent: {} };
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8')); } catch { return { sent: {} }; }
}
function saveState(s) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2));
}

/** Sélectionne les prospects formulaire-seul à proposer. Pur + exporté (testable). */
export function pickFormProspects(rows, { max = 10, doneDomains = new Set() } = {}) {
  const filtered = rows.filter(r =>
    ACTIVE_SEGMENTS.has(r.segment)
    && r.statut === 'formulaire'
    && r.url_formulaire
    && r.page_url
    && (r.page_en_ligne === 'oui' || r.page_en_ligne === true)
    && !doneDomains.has(dom(r.site))
  );
  // Tri qualité : plus d'avis d'abord.
  filtered.sort((a, b) => (Number(b.reviews) || 0) - (Number(a.reviews) || 0));
  const seen = new Set();
  const picked = [];
  for (const r of filtered) {
    const d = dom(r.site);
    if (d && seen.has(d)) continue;
    if (d) seen.add(d);
    picked.push(r);
    if (picked.length >= max) break;
  }
  return picked;
}

/** Construit le pitch (objet + message) d'un prospect formulaire. */
export function buildFormPitch(r) {
  const greeting = buildGreeting({ prenom: r.prenom, nom_gerant: r.nom_gerant });
  const observation = fallbackObservation({ rating: r.rating, reviews: r.reviews, ville: r.ville });
  // listed=false → variante "offre" (on propose de l'ajouter) : honnête pour des
  // prospects formulaire-seul (quasi jamais déjà listés).
  return buildBadgePitch({ segment: r.segment, listed: false, greeting, observation, ville: r.ville, page_url: r.page_url });
}

function buildEmailBody(items) {
  const blocks = items.map((it, i) => {
    const { r, pitch } = it;
    return `${i + 1}. ${r.nom_boite}  [${r.segment} · ${r.ville}]
   Formulaire : ${r.url_formulaire}
   Objet      : ${pitch.subject}
   Message    :
${pitch.text.split('\n').map(l => '   | ' + l).join('\n')}
${r.phone ? `   (tél si besoin : ${r.phone})\n` : ''}`;
  }).join('\n──────────\n\n');

  return `Salut Marc,

${items.length} formulaire(s) à remplir aujourd'hui (love room / cabane, page live).
Pour chacun : ouvre l'URL, colle l'objet (si champ objet) + le message, gère le captcha, soumets. Nom = Marc Chenut, email = marc@enomia.app.

──────────

${blocks}
──────────

Rappel : les réponses arrivent dans marc@enomia.app (pas de tracking auto pour les forms). Conciergerie en pause ; les formulaires blog restent dans le récap send-daily.
`;
}

async function getGmailClient() {
  const { google } = await import('googleapis');
  const TOKEN_PATH = path.join(process.env.HOME, '.config/gcloud/enomia-gsc-token.json');
  const t = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  const oauth2 = new google.auth.OAuth2(t.client_id, t.client_secret);
  oauth2.setCredentials({ refresh_token: t.refresh_token });
  return google.gmail({ version: 'v1', auth: oauth2 });
}

async function sendToMarc(gm, subject, body) {
  const subjectEncoded = '=?UTF-8?B?' + Buffer.from(subject, 'utf8').toString('base64') + '?=';
  const raw = [
    'From: Marc Chenut <marc@enomia.app>', 'To: marc@enomia.app', 'Subject: ' + subjectEncoded,
    'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit', '', body,
  ].join('\r\n');
  const encoded = Buffer.from(raw, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const res = await gm.users.messages.send({ userId: 'me', requestBody: { raw: encoded } });
  return res.data.id;
}

async function main() {
  log(`📋 Form to-do ${TODAY} ${DRY ? '(DRY)' : ''}`);
  const base = loadBase();
  if (!base.length) { log(`⚠️ Base absente (${BASE_PATH}).`); return; }

  const state = loadState();
  const doneDomains = new Set(Object.keys(state.sent));
  const picked = pickFormProspects(base, { max: MAX, doneDomains });
  if (!picked.length) { log('✅ Aucun formulaire en attente (pool épuisé ou tout déjà proposé).'); return; }

  const items = picked.map(r => ({ r, pitch: buildFormPitch(r) }));
  const subject = `[forms] ${items.length} formulaires à remplir — ${TODAY}`;
  const body = buildEmailBody(items);

  if (DRY) {
    log(`[DRY] ${items.length} prospects — aperçu du mail :\n`);
    console.log('Objet :', subject);
    console.log(body);
    return;
  }

  const gm = await getGmailClient();
  const id = await sendToMarc(gm, subject, body);
  for (const { r } of items) {
    state.sent[dom(r.site)] = { date: TODAY, url: r.url_formulaire, segment: r.segment, ville: r.ville };
  }
  saveState(state);
  log(`📧 Mail to-do envoyé (gmail ${id}) — ${items.length} formulaires, state mis à jour.`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });
