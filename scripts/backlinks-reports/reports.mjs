#!/usr/bin/env node
/**
 * Rapports backlinks — pipeline v2.
 *
 * Usage :
 *   node scripts/backlinks-reports/reports.mjs --period=week
 *   node scripts/backlinks-reports/reports.mjs --period=month
 *   node scripts/backlinks-reports/reports.mjs --period=quarter
 *   node scripts/backlinks-reports/reports.mjs --period=year
 *
 * Agrège les fichiers data/backlinks-*.json sur la période et envoie un mail récap.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const period = process.argv.find(a => a.startsWith('--period='))?.split('=')[1] || 'week';
if (!['week', 'month', 'quarter', 'year'].includes(period)) {
  console.error('❌ --period must be week|month|quarter|year');
  process.exit(1);
}

const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

// ─── Date helpers ───────────────────────────────────────────────────────
const TODAY = new Date();

function getPeriodStart(p) {
  const d = new Date(TODAY);
  if (p === 'week') d.setDate(d.getDate() - 7);
  else if (p === 'month') d.setDate(1);
  else if (p === 'quarter') {
    const q = Math.floor(d.getMonth() / 3);
    d.setMonth(q * 3, 1);
  } else if (p === 'year') {
    d.setMonth(0, 1);
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

function getPeriodLabel(p) {
  const start = getPeriodStart(p);
  if (p === 'week') return `semaine du ${start.toISOString().slice(0, 10)} au ${TODAY.toISOString().slice(0, 10)}`;
  if (p === 'month') return `${start.toISOString().slice(0, 7)}`;
  if (p === 'quarter') return `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`;
  if (p === 'year') return `${start.getFullYear()}`;
}

const PERIOD_START = getPeriodStart(period);
const PERIOD_LABEL = getPeriodLabel(period);

// ─── Backlog ────────────────────────────────────────────────────────────
function loadAllBacklogs() {
  const dir = path.join(ROOT, 'data');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.match(/^backlinks-\d{4}-\d{2}\.json$/));
  const all = [];
  for (const f of files) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
    all.push(...d.candidates);
  }
  return all;
}

function inPeriod(dateIso) {
  if (!dateIso) return false;
  return new Date(dateIso.slice(0, 10)) >= PERIOD_START;
}

// ─── Stats ──────────────────────────────────────────────────────────────
function computeStats(candidates) {
  const stats = {
    period_label: PERIOD_LABEL,
    period_start: PERIOD_START.toISOString().slice(0, 10),
    period_end: TODAY.toISOString().slice(0, 10),
    envois: { total: 0, simulateur: 0, contrat: 0, facture: 0 },
    relances: { total: 0, r1: 0, r2: 0 },
    reponses: { positive: 0, negative: 0, neutre: 0, spam: 0 },
    backlinks_obtenus: 0, // status = repondu_positif (placeholder, real backlink confirmé manuel pour l'instant)
    pipeline: { total_candidates: candidates.length, pending: 0, sent: 0, en_relance: 0, repondu: 0, no_reply: 0, no_contact: 0, manual_form: 0 },
    formulaires_a_traiter: [],
    par_outil_envois: { simulateur: 0, contrat: 0, facture: 0 },
    par_outil_positive: { simulateur: 0, contrat: 0, facture: 0 },
  };

  for (const c of candidates) {
    // Envois période
    if (inPeriod(c.date_envoi)) {
      stats.envois.total++;
      stats.envois[c.outil_cible] = (stats.envois[c.outil_cible] || 0) + 1;
      stats.par_outil_envois[c.outil_cible] = (stats.par_outil_envois[c.outil_cible] || 0) + 1;
    }
    // Relances période
    if (inPeriod(c.date_relance_1)) { stats.relances.total++; stats.relances.r1++; }
    if (inPeriod(c.date_relance_2)) { stats.relances.total++; stats.relances.r2++; }
    // Réponses période
    if (inPeriod(c.date_reponse) && c.reponse_recue) {
      stats.reponses[c.reponse_recue] = (stats.reponses[c.reponse_recue] || 0) + 1;
      if (c.reponse_recue === 'positive') {
        stats.par_outil_positive[c.outil_cible] = (stats.par_outil_positive[c.outil_cible] || 0) + 1;
        stats.backlinks_obtenus++;
      }
    }

    // Pipeline (état actuel)
    if (c.status === 'pending' || c.status === 'pending_fetch') stats.pipeline.pending++;
    else if (c.status === 'sent') stats.pipeline.sent++;
    else if (c.status === 'relance_1' || c.status === 'relance_2') stats.pipeline.en_relance++;
    else if (c.status?.startsWith('repondu_')) stats.pipeline.repondu++;
    else if (c.status === 'pas_de_reponse') stats.pipeline.no_reply++;
    else if (c.status === 'no_contact') stats.pipeline.no_contact++;
    else if (c.status === 'manual_form') {
      stats.pipeline.manual_form++;
      stats.formulaires_a_traiter.push(c);
    }
  }

  // Taux conv
  stats.taux_reponse_positive = stats.envois.total
    ? ((stats.reponses.positive / stats.envois.total) * 100).toFixed(1) + '%'
    : 'n/a';
  stats.taux_reponse_total = stats.envois.total
    ? (((stats.reponses.positive + stats.reponses.negative + stats.reponses.neutre) / stats.envois.total) * 100).toFixed(1) + '%'
    : 'n/a';

  return stats;
}

// ─── Mail ───────────────────────────────────────────────────────────────
async function getGmailClient() {
  const TOKEN_PATH = path.join(process.env.HOME, '.config/gcloud/enomia-gsc-token.json');
  const t = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  const oauth2 = new google.auth.OAuth2(t.client_id, t.client_secret);
  oauth2.setCredentials({ refresh_token: t.refresh_token });
  return google.gmail({ version: 'v1', auth: oauth2 });
}

function buildBody(stats) {
  return `Salut Marc,

Rapport ${period} backlinks — ${stats.period_label}.

📤 Envois sur la période
  Total           : ${stats.envois.total}
  - simulateur    : ${stats.envois.simulateur}
  - contrat       : ${stats.envois.contrat}
  - facture       : ${stats.envois.facture}
  Relances        : ${stats.relances.total} (R1: ${stats.relances.r1}, R2: ${stats.relances.r2})

📬 Réponses sur la période
  Positives       : ${stats.reponses.positive}
  Négatives       : ${stats.reponses.negative}
  Neutres         : ${stats.reponses.neutre}
  Spam/auto       : ${stats.reponses.spam}
  Taux conv positive : ${stats.taux_reponse_positive}
  Taux réponse global: ${stats.taux_reponse_total}

🔗 Backlinks obtenus (= réponses positives) : ${stats.backlinks_obtenus}
  - simulateur    : ${stats.par_outil_positive.simulateur}
  - contrat       : ${stats.par_outil_positive.contrat}
  - facture       : ${stats.par_outil_positive.facture}

📊 Pipeline actuel (tous mois confondus)
  Total candidats   : ${stats.pipeline.total_candidates}
  À envoyer         : ${stats.pipeline.pending}
  Envoyés en attente: ${stats.pipeline.sent}
  En relance        : ${stats.pipeline.en_relance}
  Répondu           : ${stats.pipeline.repondu}
  Sans réponse      : ${stats.pipeline.no_reply}
  Sans contact      : ${stats.pipeline.no_contact}
  Formulaires à faire : ${stats.pipeline.manual_form}

${stats.formulaires_a_traiter.length ? `📋 Formulaires à remplir à la main (${stats.formulaires_a_traiter.length})
${stats.formulaires_a_traiter.slice(0, 10).map(c => `  • ${c.site} → ${c.url_formulaire} [${c.outil_cible}]`).join('\n')}${stats.formulaires_a_traiter.length > 10 ? `\n  (...${stats.formulaires_a_traiter.length - 10} autres)` : ''}` : ''}
`;
}

async function sendReport(stats) {
  const gm = await getGmailClient();
  const subject = `[backlinks] Rapport ${period} ${stats.period_label} — ${stats.envois.total} envois, ${stats.backlinks_obtenus} backlinks`;
  const subjectEncoded = '=?UTF-8?B?' + Buffer.from(subject, 'utf8').toString('base64') + '?=';
  const body = buildBody(stats);
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
  log(`📧 Rapport ${period} envoyé (gmail ${res.data.id})`);
}

// ─── Main ───────────────────────────────────────────────────────────────
async function main() {
  log(`📊 Rapport ${period} — ${PERIOD_LABEL}`);
  const candidates = loadAllBacklogs();
  log(`  ${candidates.length} candidats chargés (tous mois)`);
  const stats = computeStats(candidates);
  log(`  Envois sur période: ${stats.envois.total}`);
  log(`  Réponses positives: ${stats.reponses.positive}`);
  await sendReport(stats);
}

main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });
