#!/usr/bin/env node
/**
 * Envoie un mail récap après le sourcing mensuel.
 * Lit data/backlinks-YYYY-MM.json et envoie le bilan à marc@enomia.app via Gmail API.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const MONTH = new Date().toISOString().slice(0, 7);
const DATA_PATH = path.join(ROOT, 'data', `backlinks-${MONTH}.json`);

if (!fs.existsSync(DATA_PATH)) {
  console.error(`❌ Fichier ${DATA_PATH} introuvable`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const { total_serps_scanned, total_domains_after_dedup, total_candidates_qualified, by_outil, candidates } = data;

// Avec email vs avec formulaire vs sans contact
const withEmail = candidates.filter(c => c.email).length;
const withForm = candidates.filter(c => !c.email && c.url_formulaire).length;
const noContact = candidates.filter(c => !c.email && !c.url_formulaire).length;

// Top 10 par traffic SERP
const top10 = [...candidates]
  .sort((a, b) => (b.serp_traffic || 0) - (a.serp_traffic || 0))
  .slice(0, 10);

const body = `Salut Marc,

Sourcing backlinks ${MONTH} terminé.

📊 Bilan
  SERP scannées            : ${total_serps_scanned}
  Domaines uniques          : ${total_domains_after_dedup}
  Candidats qualifiés       : ${total_candidates_qualified}
    - simulateur            : ${by_outil.simulateur}
    - contrat               : ${by_outil.contrat}
    - facture               : ${by_outil.facture}

📬 Moyens de contact détectés
  Avec email                : ${withEmail}
  Avec formulaire (no email): ${withForm}
  Sans contact détecté      : ${noContact}

🏆 Top 10 par trafic SERP
${top10.map((c, i) => `  ${i + 1}. ${c.site} (${c.outil_cible}, trafic ${c.serp_traffic || 0}, rank ${c.rank_serp})\n     KW: "${c.kw_origin}"\n     ${c.email ? 'email: ' + c.email : c.url_formulaire ? 'formulaire: ' + c.url_formulaire : '(pas de contact)'}\n     ${c.page_cible}`).join('\n\n')}

Le pipeline d'envoi quotidien (backlinks-send-daily) va commencer à piocher dedans à partir de demain 10h17, à raison de 15/jour ouvré.

À dans un mois pour le sourcing suivant.
`;

async function send() {
  const HOME = process.env.HOME;
  const TOKEN_PATH = path.join(HOME, '.config/gcloud/enomia-gsc-token.json');
  const t = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  const oauth2 = new google.auth.OAuth2(t.client_id, t.client_secret);
  oauth2.setCredentials({ refresh_token: t.refresh_token });
  const gm = google.gmail({ version: 'v1', auth: oauth2 });

  const subject = `[backlinks] Sourcing ${MONTH} — ${total_candidates_qualified} candidats qualifiés`;
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
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const res = await gm.users.messages.send({
    userId: 'me',
    requestBody: { raw: encoded },
  });
  console.log(`✓ Mail envoyé. Gmail id: ${res.data.id}`);
}

send().catch(e => {
  console.error('❌ send fail:', e.message);
  process.exit(1);
});
