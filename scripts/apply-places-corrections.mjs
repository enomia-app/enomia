#!/usr/bin/env node
/**
 * Applique les corrections issues de `places-audit-output.json` à `src/data/cities.ts`.
 *
 * Règles :
 *   - strong match + reviews ≥ 5 → on prend rating + reviews Google
 *   - strong match + reviews < 5 → n.c. (rating=0, reviews=0) (non significatif statistiquement)
 *   - weak match (résultat hors-métier) → n.c.
 *   - pas de match → n.c.
 *
 * Le champ `biensGeres` n'est PAS touché (Places API ne fournit pas cette info).
 * Le `updatedAt` de chaque ville touchée est bumpé à la date du jour.
 *
 * Usage :
 *   node scripts/apply-places-corrections.mjs --dry-run    # voir ce qui changerait
 *   node scripts/apply-places-corrections.mjs              # appliquer (modifie cities.ts)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');

const TODAY = new Date().toISOString().slice(0, 10);
const REVIEW_THRESHOLD = 5;

const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/places-audit-output.json'), 'utf8'));
let content = fs.readFileSync(path.join(ROOT, 'src/data/cities.ts'), 'utf8');

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Generic words to ignore when computing name overlap (too common to be meaningful)
const STOP_WORDS = new Set([
  'lyon', 'paris', 'nice', 'lille', 'rennes', 'rouen', 'caen', 'metz', 'tours', 'dijon',
  'service', 'services', 'gestion', 'agence', 'conciergerie', 'concierge', 'airbnb',
  'location', 'locations', 'courte', 'durée', 'duree', 'rental', 'rentals', 'property',
  'management', 'maison', 'maisons', 'home', 'homes', 'lyonnaise', 'lyonnais',
]);

function wordSet(s) {
  return new Set(
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w))
  );
}

// Returns true if the Google result name shares at least one distinctive word with the original conciergerie name
function isNameMatch(originalName, googleName) {
  const orig = wordSet(originalName);
  const goog = wordSet(googleName);
  if (orig.size === 0) return true; // pas assez de signal, on accepte
  for (const w of orig) if (goog.has(w)) return true;
  return false;
}

// Compute target values from a report entry
function targetValues(entry) {
  const g = entry.google;
  if (!g) return { rating: 0, reviews: 0, reason: 'no_match' };
  if (g.matchQuality === 'weak') return { rating: 0, reviews: 0, reason: 'weak_match' };
  // Additional safety: result name must overlap with original name on at least one distinctive word
  if (!isNameMatch(entry.conciergerie, g.displayName)) {
    return { rating: 0, reviews: 0, reason: 'name_mismatch' };
  }
  const reviews = g.userRatingCount ?? 0;
  if (reviews < REVIEW_THRESHOLD) return { rating: 0, reviews: 0, reason: 'low_volume' };
  return { rating: g.rating ?? 0, reviews, reason: 'strong' };
}

// Find city block boundaries in content (brace counting)
function findCityBlock(slug) {
  const re = new RegExp(`^  \\{\\s*\\n\\s+slug:\\s*'${escapeRegex(slug)}',`, 'm');
  const m = content.match(re);
  if (!m) return null;
  const start = m.index;
  let depth = 0;
  for (let i = start; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) return { start, end: i + 1 };
    }
  }
  return null;
}

const changes = [];
const slugList = [...new Set(report.map((e) => e.slug))];

for (const slug of slugList) {
  const range = findCityBlock(slug);
  if (!range) {
    changes.push({ slug, type: 'city_not_found' });
    continue;
  }
  let block = content.slice(range.start, range.end);
  const entries = report.filter((e) => e.slug === slug);
  let cityTouched = false;

  for (const entry of entries) {
    const target = targetValues(entry);
    // Match the whole conciergerie object starting with `name: '<name>'` or `name: "<name>"`
    // Name can contain apostrophes — we allow both quote styles by replacing ' with [\'"]
    const namePart = entry.conciergerie.replace(/['"]/g, "['\"]"); // tolerant quote
    const escName = namePart.replace(/[.*+?^${}()|[\]\\]/g, (c) =>
      c === '[' || c === ']' || c === '\\' || c === '*' || c === '+' || c === '?' || c === '$' || c === '^' || c === '{' || c === '}' || c === '(' || c === ')' || c === '|' || c === '.' ? '\\' + c : c,
    );
    const concRe = new RegExp(`(\\{\\s*name:\\s*["']${escName}["'][\\s\\S]*?)(rating:\\s*[\\d.]+,)([\\s\\S]*?)(reviews:\\s*\\d+,)([\\s\\S]*?\\},)`);
    const concMatch = block.match(concRe);
    if (!concMatch) {
      changes.push({ slug, conciergerie: entry.conciergerie, type: 'block_not_found' });
      continue;
    }

    const oldRating = parseFloat(concMatch[2].match(/[\d.]+/)[0]);
    const oldReviews = parseInt(concMatch[4].match(/\d+/)[0], 10);
    if (oldRating === target.rating && oldReviews === target.reviews) {
      changes.push({ slug, conciergerie: entry.conciergerie, type: 'no_change', target });
      continue;
    }

    block = block.replace(concRe, (_, p1, _r, p3, _v, p5) => {
      return `${p1}rating: ${target.rating},${p3}reviews: ${target.reviews},${p5}`;
    });

    cityTouched = true;
    changes.push({
      slug,
      conciergerie: entry.conciergerie,
      type: 'updated',
      from: { rating: oldRating, reviews: oldReviews },
      to: { rating: target.rating, reviews: target.reviews },
      reason: target.reason,
    });
  }

  // Bump updatedAt for the city if anything changed
  if (cityTouched) {
    block = block.replace(/updatedAt:\s*'[^']+'/, `updatedAt: '${TODAY}'`);
  }

  // Splice back
  content = content.slice(0, range.start) + block + content.slice(range.end);
}

if (dryRun) {
  // Summary
  const updated = changes.filter((c) => c.type === 'updated').length;
  const noChange = changes.filter((c) => c.type === 'no_change').length;
  const missing = changes.filter((c) => c.type === 'block_not_found' || c.type === 'city_not_found').length;

  console.log(`\n📝 Mode --dry-run : aucune modification écrite\n`);
  console.log(`   Updated     : ${updated}`);
  console.log(`   Unchanged   : ${noChange}`);
  console.log(`   Missing     : ${missing}`);
  console.log('\nExemples de changements (10 premiers updates) :\n');
  for (const c of changes.filter((c) => c.type === 'updated').slice(0, 10)) {
    console.log(`  ${c.slug} / ${c.conciergerie}`);
    console.log(`    ${c.from.rating}★/${c.from.reviews} → ${c.to.rating}★/${c.to.reviews} (${c.reason})`);
  }
  if (missing > 0) {
    console.log('\n⚠️ Blocs non trouvés (à investiguer) :');
    for (const c of changes.filter((c) => c.type === 'block_not_found').slice(0, 20)) {
      console.log(`  ${c.slug} / ${c.conciergerie}`);
    }
  }
} else {
  fs.writeFileSync(path.join(ROOT, 'src/data/cities.ts'), content);
  const updated = changes.filter((c) => c.type === 'updated').length;
  console.log(`✅ ${updated} conciergeries mises à jour dans src/data/cities.ts`);
  console.log(`📅 updatedAt des villes touchées bumpé à ${TODAY}`);
  const missing = changes.filter((c) => c.type === 'block_not_found' || c.type === 'city_not_found').length;
  if (missing > 0) console.log(`⚠️ ${missing} blocs non trouvés (voir détails avec --dry-run)`);
}

// Save full changelog
fs.writeFileSync(path.join(ROOT, 'scripts/places-corrections-changelog.json'), JSON.stringify(changes, null, 2));
console.log(`💾 Changelog complet → scripts/places-corrections-changelog.json`);
