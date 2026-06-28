// scripts/email-base-builder/merge-base.mjs
//
// Fusionne les CSV/JSON par segment (conciergeries, blog_lcd, blog_simulateur,
// loveroom, cabane) en une base unique base_complete.json + .csv.
// Lance ensuite to_xlsx.py pour le .xlsx formaté (si python dispo).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { extractDomain } from '../backlinks-source-monthly/filters.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const dir = path.join(ROOT, 'data', 'email-base');

const SEGMENT_FILES = ['blog_lcd.json', 'blog_simulateur.json', 'conciergeries.json', 'loveroom.json', 'cabane.json'];

let all = [];
for (const f of SEGMENT_FILES) {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) { console.log(`(absent, ignoré: ${f})`); continue; }
  all = all.concat(JSON.parse(fs.readFileSync(p, 'utf-8')));
}
all.forEach(r => { if (!('phone' in r)) r.phone = ''; if (!('page_en_ligne' in r)) r.page_en_ligne = ''; if (!('page_url' in r)) r.page_url = ''; });

// Enrichit le téléphone des conciergeries depuis la source Places (le fichier
// segment conciergeries.json peut être antérieur à l'ajout de la colonne tel).
try {
  const conc = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'discovered-conciergeries.json'), 'utf-8'));
  const phoneByDom = new Map();
  for (const c of conc) {
    if (!c.website || !c.phone) continue;
    const d = extractDomain(/^https?:/.test(c.website) ? c.website : 'https://' + c.website);
    if (d) phoneByDom.set(d, c.phone);
  }
  let n = 0;
  for (const r of all) {
    if (r.segment === 'conciergerie' && !r.phone && r.site) {
      const d = extractDomain(r.site);
      if (d && phoneByDom.has(d)) { r.phone = phoneByDom.get(d); n++; }
    }
  }
  if (n) console.log(`   (téléphone conciergerie rejoint : ${n})`);
} catch (e) { console.log('   (enrich tel conciergerie ignoré:', e.message, ')'); }

const rank = { verifie: 0, a_tester: 1, formulaire: 2, faux_email: 3, ecarte: 4, erreur: 5 };
all.sort((a, b) => (a.campagne - b.campagne) || ((rank[a.statut] ?? 9) - (rank[b.statut] ?? 9)));

fs.writeFileSync(path.join(dir, 'base_complete.json'), JSON.stringify(all, null, 2));

const COLS = ['segment', 'campagne', 'nom_boite', 'site', 'email', 'prenom', 'statut', 'phone', 'page_en_ligne', 'ville', 'rcpt_code', 'url_formulaire', 'page_url', 'note'];
const cell = v => { v = v == null ? '' : String(v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
fs.writeFileSync(path.join(dir, 'base_complete.csv'), '﻿' + COLS.join(';') + '\n' + all.map(r => COLS.map(c => cell(r[c])).join(';')).join('\n') + '\n');

// Récap
const seg = {}, by = {};
all.forEach(r => { seg[r.segment] = (seg[r.segment] || 0) + 1; by[r.statut] = (by[r.statut] || 0) + 1; });
const emails = all.filter(r => ['verifie', 'a_tester'].includes(r.statut)).length;
const withPhone = all.filter(r => r.phone).length;
console.log(`\n📦 base_complete : ${all.length} lignes`);
console.log('   par segment :', JSON.stringify(seg));
console.log('   par statut  :', JSON.stringify(by));
console.log(`   → ${emails} emails envoyables (verifie+a_tester) | ${all.filter(r => r.statut === 'formulaire').length} formulaire | ${withPhone} avec téléphone`);

// xlsx
try {
  execSync(`python3 "${path.join(__dirname, 'to_xlsx.py')}"`, { stdio: 'inherit', cwd: ROOT });
} catch (e) {
  console.log('⚠️ xlsx non généré (python/openpyxl absent) — le CSV reste dispo.', e.message);
}
