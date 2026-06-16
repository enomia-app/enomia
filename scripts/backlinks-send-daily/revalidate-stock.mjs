#!/usr/bin/env node
// scripts/backlinks-send-daily/revalidate-stock.mjs
//
// Re-valide en UNE passe tous les emails du stock "pending" via verifyMailbox
// (probe SMTP RCPT TO), pour purger les boîtes mortes (550 5.1.1) du CRM.
//
// Contexte : le 2026-06-15, 2/10 envois ont bouncé (contact@gcb-immo.fr,
// contact@naps-immo.com) — boîtes inexistantes sur domaines vivants, que
// isPitchableEmail + hasValidMX ne pouvaient pas attraper. verifyMailbox ajoute
// le 3e niveau (la boîte existe-t-elle vraiment ?). Ce script l'applique au stock.
//
// Usage :
//   node revalidate-stock.mjs           → DRY (rapport seul, rien écrit)
//   node revalidate-stock.mjs --write   → applique (strip email + excluded_bad_email)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyMailbox } from '../backlinks-source-monthly/filters.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const WRITE = process.argv.includes('--write');
const MONTH = new Date().toISOString().slice(0, 7);
const CRM = path.join(ROOT, 'data', `backlinks-${MONTH}.json`);
const CONC = 5; // probes SMTP en parallèle (gentil : ~1 RCPT par MX distinct)

const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

const backlog = JSON.parse(fs.readFileSync(CRM, 'utf-8'));
const pool = backlog.candidates.filter(c => c.status === 'pending' && c.email && c.is_blog !== false);
log(`📋 ${pool.length} candidats pending avec email à re-valider — mode ${WRITE ? 'WRITE ✍️' : 'DRY 👀'}`);

let valid = 0, unknown = 0, invalid = 0, done = 0;
const invalides = [];

async function worker(items) {
  for (const c of items) {
    const v = await verifyMailbox(c.email);
    done++;
    if (v.status === 'valid') valid++;
    else if (v.status === 'unknown') unknown++;
    else {
      invalid++;
      invalides.push({ site: c.site, email: c.email, code: v.code });
      if (WRITE) {
        c.email_invalide = c.email;
        c.email = null;
        c.email_revalide_at = new Date().toISOString();
        if (!c.url_formulaire) c.status = 'excluded_bad_email';
      }
    }
    if (done % 25 === 0) log(`  … ${done}/${pool.length} (valid ${valid} / unknown ${unknown} / invalid ${invalid})`);
  }
}

// répartition round-robin sur CONC workers
const slices = Array.from({ length: CONC }, () => []);
pool.forEach((c, i) => slices[i % CONC].push(c));
await Promise.all(slices.map(worker));

log(`\n=== RÉSULTAT (${done} probes) ===`);
log(`  ✅ valid   : ${valid}`);
log(`  ❔ unknown : ${unknown}  (greylist/timeout/catch-all → envoyés quand même, Gmail relivre)`);
log(`  ✗  invalid : ${invalid}  (boîtes mortes)`);
if (invalides.length) {
  log(`\n  Boîtes mortes :`);
  for (const x of invalides) log(`    ✗ ${x.site} <${x.email}> — ${x.code}`);
}
if (WRITE && invalid > 0) {
  fs.writeFileSync(CRM, JSON.stringify(backlog, null, 2));
  log(`\n💾 CRM mis à jour : ${invalid} emails strippés. Stock sendable propre.`);
} else if (WRITE) {
  log(`\n💾 Rien à stripper (0 invalide).`);
} else {
  log(`\n👀 DRY — rien écrit. Relance avec --write pour appliquer.`);
}
process.exit(0);
