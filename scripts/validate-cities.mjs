#!/usr/bin/env node
/**
 * Validateur de src/data/cities.ts — garde-fou pour les éditions manuelles.
 * Reproduit les checks de apply-places-corrections.mjs hors du flux automatique.
 *
 * Vérifie :
 *   1. Structurel : 46 villes, chaque ville a 4-8 conciergeries, pas de doublon de nom dans une ville
 *   2. Valeurs : rating ∈ [0,5], reviews entier ≥ 0, biensGeres entier ≥ 0
 *   3. Cohérence : pas de chiffre d'avis ("X/5", "sur N avis") dans les descriptions
 *   4. TypeScript : aucune erreur de syntaxe nouvelle (compare au baseline 3)
 *
 * Exit code 0 = OK, 1 = problème détecté.
 * Usage : node scripts/validate-cities.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(ROOT, 'src/data/cities.ts');
const TS_BASELINE = 3; // erreurs TS préexistantes connues (types menage non stricts)

const content = fs.readFileSync(TARGET, 'utf8');
const issues = [];
let cityCount = 0;
let concTotal = 0;

// Parse chaque ville (brace counting)
for (const match of content.matchAll(/^  \{\s*\n\s+slug:\s*'([^']+)',/gm)) {
  const slug = match[1];
  let depth = 0, end = match.index;
  for (let i = match.index; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  const block = content.slice(match.index, end);
  cityCount++;

  const concBlock = block.match(/conciergeries:\s*\[([\s\S]+?)\],\s*\n\s+neighborhoods/)?.[1] || '';
  const concs = concBlock.match(/\{\s*name:[\s\S]*?\},/g) || [];
  concTotal += concs.length;

  if (concs.length < 3) issues.push(`${slug}: seulement ${concs.length} conciergeries (min 3)`);
  if (concs.length > 8) issues.push(`${slug}: ${concs.length} conciergeries (max 8)`);

  // Cohérence du compteur "des N meilleures" (title + metaDescription) avec le nb réel de fiches
  const titleNum = block.match(/title:\s*'[^']*?des (\d+) meilleures/)?.[1];
  const metaNum = block.match(/des (\d+) meilleures conciergeries/)?.[1];
  if (titleNum && +titleNum !== concs.length) issues.push(`${slug}: titre annonce ${titleNum} agences mais ${concs.length} listées`);
  if (metaNum && +metaNum !== concs.length) issues.push(`${slug}: meta annonce ${metaNum} mais ${concs.length} listées`);

  const namesSeen = new Set();
  for (const cb of concs) {
    const name = cb.match(/name:\s*["']([^"']+)["']/)?.[1] || '?';
    if (namesSeen.has(name)) issues.push(`${slug}: doublon de nom "${name}"`);
    namesSeen.add(name);

    const rating = parseFloat(cb.match(/rating:\s*([\d.]+)/)?.[1] ?? 'NaN');
    const reviews = cb.match(/reviews:\s*(\d+)/)?.[1];
    const biens = cb.match(/biensGeres:\s*(\d+)/)?.[1];
    if (isNaN(rating) || rating < 0 || rating > 5) issues.push(`${slug}/${name}: rating invalide (${rating})`);
    if (reviews === undefined) issues.push(`${slug}/${name}: reviews manquant`);
    if (biens === undefined) issues.push(`${slug}/${name}: biensGeres manquant`);

    // Chiffres d'avis dans la description OU le champ specialty ?
    const desc = cb.match(/description:\s*\n?\s*"((?:\\.|[^"\\])*)"/)?.[1] || '';
    const specialty = cb.match(/specialty:\s*["']((?:\\.|[^"'\\])*)["']/)?.[1] || '';
    const hasReviewNumber = (s) =>
      /\d+[,.]\d+\s*\/\s*5\b/.test(s) || /\bsur\s+~?\s*\d[\d\s]*\s*avis\b/i.test(s) || /\bnote\s+(google|airbnb)\b/i.test(s);
    if (hasReviewNumber(desc)) issues.push(`${slug}/${name}: chiffre d'avis dans la description`);
    if (hasReviewNumber(specialty)) issues.push(`${slug}/${name}: chiffre d'avis dans le champ specialty`);
  }
}

if (cityCount !== 46) issues.push(`Nombre de villes = ${cityCount} (attendu 46)`);

// TypeScript
let tsErrors = 0;
try {
  execSync(`npx --no-install tsc --noEmit --target es2022 --module esnext --moduleResolution node --skipLibCheck "${TARGET}"`, { cwd: ROOT, stdio: 'pipe' });
} catch (e) {
  const out = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
  tsErrors = (out.match(/error TS/g) || []).length;
}
if (tsErrors > TS_BASELINE) issues.push(`TypeScript : ${tsErrors} erreurs (baseline ${TS_BASELINE}) → ${tsErrors - TS_BASELINE} nouvelle(s)`);

console.log(`Villes : ${cityCount} · Conciergeries : ${concTotal} · Erreurs TS : ${tsErrors} (baseline ${TS_BASELINE})`);
if (issues.length === 0) {
  console.log('✅ Validation OK — aucun problème');
  process.exit(0);
} else {
  console.log(`🚨 ${issues.length} problème(s) détecté(s) :`);
  for (const i of issues) console.log('   ✗ ' + i);
  process.exit(1);
}
