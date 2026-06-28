// scripts/email-base-builder/reverify.mjs
//
// Post-traitement de base_complete :
//   1. Re-probe les a_tester avec un timeout long (20s) → convertit les
//      "slow MX timeout" en verifie/faux_email. (Le greylisting vrai 4xx
//      nécessite un retry différé : relancer ce script ~10 min plus tard.)
//   2. Joint le téléphone (data Places) sur les conciergeries → canal de
//      secours quand pas d'email (form/tel/Google Business).
// Réécrit base_complete.json + .csv (avec colonne phone).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyMailbox, extractDomain } from '../backlinks-source-monthly/filters.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const dir = path.join(ROOT, 'data', 'email-base');

const all = JSON.parse(fs.readFileSync(path.join(dir, 'base_complete.json'), 'utf-8'));

// ─── 1. Join téléphone (conciergeries) ───────────────────────────────────
const conc = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'discovered-conciergeries.json'), 'utf-8'));
const phoneByDom = new Map();
for (const c of conc) {
  const w = c.website;
  if (!w || !c.phone) continue;
  const d = extractDomain(/^https?:/.test(w) ? w : 'https://' + w);
  if (d) phoneByDom.set(d, c.phone);
}
for (const r of all) {
  if (!('phone' in r)) r.phone = '';
  if (!r.phone && r.segment === 'conciergerie' && r.site) {
    const d = extractDomain(r.site);
    if (d && phoneByDom.has(d)) r.phone = phoneByDom.get(d);
  }
}

// ─── 2. Re-probe a_tester (timeout long) ─────────────────────────────────
const targets = all.filter(r => r.statut === 'a_tester' && r.email);
console.log(`🔁 Re-probe ${targets.length} a_tester (timeout 20s, concurrence 5)…`);
let done = 0, conv = 0, bad = 0, next = 0;
async function worker() {
  while (next < targets.length) {
    const r = targets[next++];
    try {
      const v = await verifyMailbox(r.email, { timeout: 20000 });
      if (v.status === 'valid') {
        r.statut = 'verifie'; r.rcpt_code = v.code; r.note = (r.note || '').replace(/probe timeout|RCPT incertain/g, '').trim(); conv++;
      } else if (v.status === 'invalid') {
        r.statut = 'faux_email'; r.rcpt_code = v.code; r.note = v.reason || r.note; bad++;
      }
    } catch { /* reste a_tester */ }
    if (++done % 20 === 0) console.log(`  … ${done}/${targets.length}`);
  }
}
await Promise.all(Array.from({ length: 5 }, worker));

// ─── 3. Réécrit json + csv ───────────────────────────────────────────────
const rank = { verifie: 0, a_tester: 1, formulaire: 2, faux_email: 3, ecarte: 4, erreur: 5 };
all.sort((a, b) => (a.campagne - b.campagne) || ((rank[a.statut] ?? 9) - (rank[b.statut] ?? 9)));
fs.writeFileSync(path.join(dir, 'base_complete.json'), JSON.stringify(all, null, 2));

const COLS = ['segment', 'campagne', 'nom_boite', 'site', 'email', 'prenom', 'statut', 'phone', 'ville', 'rcpt_code', 'url_formulaire', 'note'];
const cell = v => { v = v == null ? '' : String(v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
fs.writeFileSync(path.join(dir, 'base_complete.csv'), '﻿' + COLS.join(';') + '\n' + all.map(r => COLS.map(c => cell(r[c])).join(';')).join('\n') + '\n');

const by = {}; all.forEach(r => by[r.statut] = (by[r.statut] || 0) + 1);
console.log(`\n✅ ${conv} → vérifiés, ${bad} → faux_email, ${targets.length - conv - bad} restent a_tester`);
console.log('statuts:', JSON.stringify(by));
console.log('conciergeries avec téléphone:', all.filter(r => r.segment === 'conciergerie' && r.phone).length);
