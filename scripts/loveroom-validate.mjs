#!/usr/bin/env node
/**
 * Garde-fou qualité des pages love room générées (à lancer après loveroom-build-data, et dans le cron AVANT commit).
 * Vérifie : assez de rooms/ville, note ≥ 4, avis ≥ 10, avis affichés, lien direct, pas de hôtel/resto, méta cohérente.
 * Sort en code 1 si une règle DURE est violée (bloque le commit du cron).
 *
 * Usage : node scripts/loveroom-validate.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIN_ROOMS = 3; // en dessous, la page est trop maigre → on ne la publie pas
const NAME_BAD = /h[ôo]tel|hostellerie|restaurant|brasserie|camping|r[ée]sidence/i;

function loadConst(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const idx = src.search(/export const \w+[^=]*=/); // évite les « = » dans les commentaires d'en-tête
  const eq = src.indexOf('=', idx);
  const body = src.slice(eq + 1).trim().replace(/;\s*$/, '');
  return JSON.parse(body);
}

const listings = loadConst('src/data/loveRoomListings.ts');
const meta = loadConst('src/data/loveRoomCities.ts');
let errors = 0;
let warns = 0;
const err = (m) => { console.error('❌ ' + m); errors++; };
const warn = (m) => { console.warn('⚠️  ' + m); warns++; };

for (const [slug, rooms] of Object.entries(listings)) {
  if (rooms.length < MIN_ROOMS) warn(`${slug} : ${rooms.length} rooms (< ${MIN_ROOMS}) → ÉLARGIR le rayon (100 puis 150 km) au sourcing, ne pas dropper`);
  let noUrl = 0, noRev = 0, noDesc = 0;
  const names = new Set();
  for (const r of rooms) {
    if (!r.name) err(`${slug} : room sans nom`);
    if (NAME_BAD.test(r.name || '')) err(`${slug} : nom hôtel/resto interdit → "${r.name}"`);
    if (names.has(r.name)) err(`${slug} : doublon "${r.name}"`);
    names.add(r.name);
    if (!(r.rating >= 4)) err(`${slug} : "${r.name}" note ${r.rating} < 4`);
    if (!(r.reviews >= 10)) err(`${slug} : "${r.name}" ${r.reviews} avis < 10`);
    if (r.priceFrom != null && (r.priceFrom < 40 || r.priceFrom > 900)) warn(`${slug} : "${r.name}" prix ${r.priceFrom}€ suspect`);
    if (!r.recentReviews || !r.recentReviews.length) noRev++;
    if (!r.url) noUrl++;
    if (!r.description || r.description === r.vibe) noDesc++;
  }
  if (noRev) warn(`${slug} : ${noRev}/${rooms.length} fiche(s) sans avis affichés`);
  if (noUrl === rooms.length) err(`${slug} : AUCUN lien direct (page sans valeur résa directe)`);
  else if (noUrl > rooms.length / 2) warn(`${slug} : ${noUrl}/${rooms.length} sans lien direct`);
  if (noDesc) warn(`${slug} : ${noDesc}/${rooms.length} desc non rédigées (→ passe IA)`);
}

for (const m of meta) {
  if (!listings[m.slug]?.length) err(`méta "${m.slug}" sans listings`);
  if (typeof m.found !== 'number' || m.found < listings[m.slug]?.length) err(`${m.slug} : found incohérent (${m.found})`);
}

const totalRooms = Object.values(listings).reduce((s, r) => s + r.length, 0);
console.log(`\n${errors} erreur(s) · ${warns} avertissement(s) · ${Object.keys(listings).length} villes · ${totalRooms} rooms`);
if (errors) { console.error('\n🚫 Validation ÉCHOUÉE — ne pas committer en l\'état.'); process.exit(1); }
console.log('✅ Validation OK.');
