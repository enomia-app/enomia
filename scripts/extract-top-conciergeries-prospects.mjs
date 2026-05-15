#!/usr/bin/env node
/**
 * Extrait les conciergeries de cities.ts, calcule un score de notoriété (rating × log(reviews)),
 * et sort le top N pour les utiliser comme prospects backlinks.
 *
 * Output : scripts/conciergerie-prospects-top.json
 * Usage : node scripts/extract-top-conciergeries-prospects.mjs [--top=N]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const TOP_N = parseInt(process.argv.find(a => a.startsWith('--top='))?.replace('--top=', '') || '10', 10);

const citiesContent = fs.readFileSync(path.join(ROOT, 'src/data/cities.ts'), 'utf8');

// Parse chaque bloc conciergerie : { name: ..., url: ..., commission: ..., rating: X, reviews: Y, ... }
// On extrait name, url, rating, reviews + city dont elle vient
const concierges = [];
const cityBlocks = citiesContent.match(/\{\s*slug:\s*'[^']+',[\s\S]*?(?=^\s{2}\},$)/gm) || [];

for (const block of cityBlocks) {
  const cityName = block.match(/displayName:\s*'([^']+)'/)?.[1];
  const conciergeriesMatch = block.match(/conciergeries:\s*\[([\s\S]+?)\],\s*\n\s+neighborhoods/);
  if (!conciergeriesMatch) continue;
  const concList = conciergeriesMatch[1];
  const items = concList.matchAll(/\{([^}]+)\}/g);
  for (const item of items) {
    const text = item[1];
    const name = text.match(/name:\s*["']([^"']+)["']/)?.[1];
    const url = text.match(/url:\s*['"]([^'"]+)['"]/)?.[1];
    const rating = parseFloat(text.match(/rating:\s*([\d.]+)/)?.[1] || '0');
    const reviews = parseInt(text.match(/reviews:\s*(\d+)/)?.[1] || '0', 10);
    const commission = text.match(/commission:\s*['"]([^'"]+)['"]/)?.[1];
    const specialty = text.match(/specialty:\s*['"]([^'"]+)['"]/)?.[1];
    if (!name) continue;
    const score = rating * Math.log(reviews + 1);
    concierges.push({ name, url, rating, reviews, commission, specialty, city: cityName, score });
  }
}

// Dédoublonner par URL (si même conciergerie listée sur plusieurs villes, garder la 1ère)
const seen = new Set();
const unique = concierges.filter(c => {
  if (!c.url || seen.has(c.url)) return false;
  seen.add(c.url);
  return true;
});

console.log(`📋 ${concierges.length} conciergeries trouvées (${unique.length} uniques par URL)`);

// Trier par score desc
unique.sort((a, b) => b.score - a.score);

// Top N
const top = unique.slice(0, TOP_N);

console.log(`\n🏆 Top ${TOP_N} prospects backlinks (par notoriété rating × log(reviews)) :\n`);
console.log('Score | Name | URL | Rating | Reviews | Specialty | City');
console.log('─'.repeat(120));
top.forEach((c, i) => {
  console.log(`${(i + 1).toString().padStart(2)}. ${c.score.toFixed(2).padStart(5)} | ${c.name.padEnd(35)} | ${c.url.padEnd(50)} | ${c.rating} | ${c.reviews.toString().padStart(4)} | ${(c.specialty || '').slice(0, 30).padEnd(30)} | ${c.city}`);
});

const outPath = path.join(ROOT, 'scripts/conciergerie-prospects-top.json');
fs.writeFileSync(outPath, JSON.stringify(top, null, 2));
console.log(`\n💾 Sauvegardé : ${path.relative(ROOT, outPath)}`);
