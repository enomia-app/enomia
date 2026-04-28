#!/usr/bin/env node
/**
 * Publication progressive des pages /rentabilite-airbnb/[ville].
 *
 * Logique :
 *   - Lit src/data/cities-rentabilite.ts
 *   - Trouve toutes les villes avec status: 'brouillon' ET publishAt <= today
 *   - Les passe en status: 'en-ligne' dans le fichier
 *   - Output : liste des villes publiées
 *
 * Lancement automatique via GitHub Actions (cron 1 fois/2 jours).
 * Le commit + push est fait par l'Action elle-même après ce script.
 *
 * Usage :
 *   node scripts/publish-next-rentabilite-city.mjs            # publie ce qui est dû
 *   node scripts/publish-next-rentabilite-city.mjs --dry-run  # affiche sans modifier
 */

import { readFileSync, writeFileSync } from 'fs';

const FILE_PATH = 'src/data/cities-rentabilite.ts';
const DRY_RUN = process.argv.includes('--dry-run');

const today = new Date().toISOString().slice(0, 10);
const content = readFileSync(FILE_PATH, 'utf-8');

// Parse villes : on regex chaque bloc de ville pour extraire slug, publishAt, status
// (l'ordre dans le fichier est : slug, ..., publishAt, status, ...)
const cityRegex = /\{\s*slug: '([^']+)',[\s\S]*?publishAt: '([^']+)',\s*status: '(brouillon|en-ligne)'/g;
const cities = [];
let m;
while ((m = cityRegex.exec(content)) !== null) {
  cities.push({ slug: m[1], publishAt: m[2], status: m[3], rawMatch: m[0] });
}

if (cities.length === 0) {
  console.error('❌ Aucune ville trouvée dans', FILE_PATH);
  process.exit(1);
}

// Filtrer celles à publier
const toPublish = cities.filter((c) => c.status === 'brouillon' && c.publishAt <= today);

console.log(`📅 ${today}`);
console.log(`   Villes total : ${cities.length}`);
console.log(`   En-ligne actuellement : ${cities.filter((c) => c.status === 'en-ligne').length}`);
console.log(`   À publier maintenant : ${toPublish.length}`);

if (toPublish.length === 0) {
  console.log(`✓ Rien à publier aujourd'hui. Prochaine date : ${cities.filter((c) => c.status === 'brouillon').sort((a, b) => a.publishAt.localeCompare(b.publishAt))[0]?.publishAt || '—'}`);
  process.exit(0);
}

// Modifier le fichier : pour chaque ville à publier, remplacer son bloc avec status: 'brouillon' par status: 'en-ligne'
let newContent = content;
const published = [];

for (const c of toPublish) {
  const newBlock = c.rawMatch.replace(/status: 'brouillon'/, "status: 'en-ligne'");
  if (newBlock === c.rawMatch) {
    console.warn(`⚠️ Pas de changement pour ${c.slug} (déjà à jour ?)`);
    continue;
  }
  newContent = newContent.replace(c.rawMatch, newBlock);
  published.push(c.slug);
}

if (DRY_RUN) {
  console.log(`\n🔍 DRY RUN — aurait publié :`);
  for (const slug of published) console.log(`   - ${slug}`);
  process.exit(0);
}

if (published.length === 0) {
  console.log(`✓ Rien à publier (aucun changement effectif).`);
  process.exit(0);
}

writeFileSync(FILE_PATH, newContent);

console.log(`\n✅ ${published.length} ville(s) publiée(s) :`);
for (const slug of published) console.log(`   - /rentabilite-airbnb/${slug}`);
console.log(`\nFichier modifié : ${FILE_PATH}`);
console.log(`→ git commit + push à exécuter (par l'Action GitHub ou manuellement)`);
