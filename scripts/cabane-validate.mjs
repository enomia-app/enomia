#!/usr/bin/env node
/**
 * Garde-fou qualité des pages cabane générées (après cabane-build-data, et dans le cron AVANT commit).
 * Vérifie : assez de cabanes/zone, note ≥ 4, avis ≥ 10, avis affichés, lien direct, pas de hôtel/magasin, méta cohérente.
 * Sort en code 1 si une règle DURE est violée (bloque le commit du cron).
 *
 * Usage : node scripts/cabane-validate.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIN = 3;
const NAME_BAD = /h[ôo]tel\b|hostellerie|restaurant|brasserie|magasin|constructeur|fabricant|\bvente\b|menuiserie/i;

function loadConst(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const idx = src.search(/export const \w+[^=]*=/);
  const eq = src.indexOf('=', idx);
  return JSON.parse(src.slice(eq + 1).trim().replace(/;\s*$/, ''));
}

const listings = loadConst('src/data/cabaneListings.ts');
const meta = loadConst('src/data/cabaneZones.ts');
let errors = 0, warns = 0;
const err = (m) => { console.error('❌ ' + m); errors++; };
const warn = (m) => { console.warn('⚠️  ' + m); warns++; };

for (const [slug, cabanes] of Object.entries(listings)) {
  if (cabanes.length < MIN) warn(`${slug} : ${cabanes.length} cabanes (< ${MIN}) → ÉLARGIR le rayon (100 puis 150 km) au sourcing`);
  let noUrl = 0, noRev = 0, noDesc = 0;
  const names = new Set();
  for (const c of cabanes) {
    if (!c.name) err(`${slug} : cabane sans nom`);
    if (NAME_BAD.test(c.name || '')) err(`${slug} : nom hôtel/magasin interdit → "${c.name}"`);
    if (names.has(c.name)) err(`${slug} : doublon "${c.name}"`);
    names.add(c.name);
    if (!(c.rating >= 4)) err(`${slug} : "${c.name}" note ${c.rating} < 4`);
    if (!(c.reviews >= 10)) err(`${slug} : "${c.name}" ${c.reviews} avis < 10`);
    if (!c.recentReviews || !c.recentReviews.length) noRev++;
    if (!c.url) noUrl++;
    if (!c.description || c.description === c.vibe) noDesc++;
  }
  if (noRev) warn(`${slug} : ${noRev}/${cabanes.length} fiche(s) sans avis affichés`);
  if (noUrl === cabanes.length) err(`${slug} : AUCUN lien direct (page sans valeur résa directe)`);
  else if (noUrl > cabanes.length / 2) warn(`${slug} : ${noUrl}/${cabanes.length} sans lien direct`);
  if (noDesc) warn(`${slug} : ${noDesc}/${cabanes.length} desc non rédigées (→ passe IA)`);
}

for (const m of meta) {
  if (!listings[m.slug]?.length) err(`méta "${m.slug}" sans listings`);
  if (typeof m.found !== 'number' || m.found < listings[m.slug]?.length) err(`${m.slug} : found incohérent (${m.found})`);
}

const total = Object.values(listings).reduce((s, l) => s + l.length, 0);
console.log(`\n${errors} erreur(s) · ${warns} avertissement(s) · ${Object.keys(listings).length} zones · ${total} cabanes`);
if (errors) { console.error('\n🚫 Validation ÉCHOUÉE — ne pas committer en l\'état.'); process.exit(1); }
console.log('✅ Validation OK.');
