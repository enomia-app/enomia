#!/usr/bin/env node
/**
 * Bump de la date « MAJ » des pages conciergeries.
 *
 * - src/data/cities.ts : passe TOUS les `updatedAt: 'YYYY-MM-DD'` à la date du jour
 *   (chaque ville est re-vérifiée contre Google au refresh mensuel, donc la date de
 *   vérification est légitime même si les notes n'ont pas bougé).
 * - src/pages/conciergerie-airbnb/index.astro : met à jour le badge codé en dur
 *   `<span class="seo-badge">Mis à jour {mois} {année}</span>`.
 *
 * Le badge des pages ville est dynamique (`city.updatedAt`) → couvert par cities.ts.
 *
 * Usage :
 *   node scripts/refresh-conciergeries-monthly/bump-updated-dates.mjs            # applique
 *   node scripts/refresh-conciergeries-monthly/bump-updated-dates.mjs --dry-run  # affiche sans écrire
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const dryRun = process.argv.includes('--dry-run');

const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const moisFr = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }); // "juin 2026"

let touched = 0;

// 1. cities.ts — tous les updatedAt
const citiesPath = path.join(ROOT, 'src/data/cities.ts');
const citiesSrc = fs.readFileSync(citiesPath, 'utf8');
let nCities = 0;
const citiesOut = citiesSrc.replace(/updatedAt:\s*'\d{4}-\d{2}-\d{2}'/g, () => {
  nCities++;
  return `updatedAt: '${TODAY}'`;
});

// 2. index.astro — badge codé en dur
const indexPath = path.join(ROOT, 'src/pages/conciergerie-airbnb/index.astro');
const indexSrc = fs.readFileSync(indexPath, 'utf8');
let nBadge = 0;
const indexOut = indexSrc.replace(
  /(<span class="seo-badge">Mis à jour )[^<]+(<\/span>)/g,
  (_m, a, b) => {
    nBadge++;
    return `${a}${moisFr}${b}`;
  }
);

console.log(`Date cible : ${TODAY} (badge : « Mis à jour ${moisFr} »)`);
console.log(`cities.ts : ${nCities} champs updatedAt`);
console.log(`index.astro : ${nBadge} badge(s)`);

if (nCities === 0) {
  console.error('🚨 Aucun updatedAt trouvé dans cities.ts — abort (format changé ?)');
  process.exit(1);
}
if (nBadge === 0) {
  console.error('⚠️  Badge index.astro non trouvé (format changé ?) — on continue mais à vérifier.');
}

if (dryRun) {
  console.log('--dry-run : aucune écriture.');
  process.exit(0);
}

fs.writeFileSync(citiesPath, citiesOut);
fs.writeFileSync(indexPath, indexOut);
console.log('✅ Dates « MAJ » bumpées.');
