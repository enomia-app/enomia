#!/usr/bin/env node
/**
 * Propose le top 6-8 de conciergeries finales par ville, en mixant :
 *   - Les conciergeries actuelles de cities.ts (avec leur data Places API depuis places-audit-output.json)
 *   - Les découvertes Places API (discovered-conciergeries.json)
 *
 * Règles :
 *   - Dedup par adresse normalisée (2 fiches même adresse = même boîte, on garde le meilleur score)
 *   - Score = rating × log(reviews + 1)
 *   - Les marques NATIONALES (Hostnfly, Welkeys, GuestReady, BnbLord, Cocoonr, etc.) ont un slot
 *     réservé même si leur score local est bas → important pour le lecteur (références connues)
 *   - Top 8 max par ville (descendant par score)
 *   - Si une ville a < 4 acteurs vraiment notés, on garde aussi les actuelles en n.c.
 *
 * Output : scripts/cities-proposed.json (à reviewer avant fetch sites + apply)
 *
 * Usage : node scripts/plan-conciergerie-replacement.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MAX_PER_CITY = 8;
const MIN_PER_CITY = 4;

// Marques nationales à toujours conserver (slot réservé)
const NATIONAL_BRANDS = [
  'hostnfly', 'hosting services', 'welkeys', 'guestready', 'bnblord',
  'cocoonr', 'yourhosthelper', 'nestify', 'check my guest', 'checkmyguest',
  'smartbnb', 'sejourneur', 'hoomy', 'guester',
];

const places = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/places-audit-output.json'), 'utf8'));
const discovered = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/discovered-conciergeries.json'), 'utf8'));

function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeAddress(addr) {
  if (!addr) return '';
  // Normalise pour comparer : "2 Pl. du Prado, 69007 Lyon, France" ≈ "2 place du prado 69007 lyon"
  return normalize(addr)
    .replace(/\bpl\b/g, 'place')
    .replace(/\bav\b/g, 'avenue')
    .replace(/\bbd\b/g, 'boulevard')
    .replace(/\brte\b/g, 'route')
    .replace(/\bcr\b/g, 'cours')
    .replace(/\bfrance$/, '')
    .trim();
}

function isNational(name) {
  const n = normalize(name);
  return NATIONAL_BRANDS.some((b) => n.includes(b));
}

function scoreOf(rating, reviews) {
  if (!rating || !reviews) return 0;
  return rating * Math.log(reviews + 1);
}

// Group by city
const byCity = {};

// 1. Add currents (with Places API data)
for (const entry of places) {
  if (!byCity[entry.slug]) byCity[entry.slug] = { ville: entry.ville, items: [] };
  byCity[entry.slug].items.push({
    source: 'current',
    name: entry.conciergerie,
    rating: entry.google?.rating ?? 0,
    reviews: entry.google?.userRatingCount ?? 0,
    address: entry.google?.address ?? '',
    website: entry.google?.website ?? entry.actuel?.url ?? '',
    place_id: entry.google?.place_id ?? null,
    matchQuality: entry.google?.matchQuality,
    biensGeres: entry.actuel?.biensGeres ?? 0,
  });
}

// 2. Add discoveries
for (const d of discovered) {
  if (!byCity[d.slug]) byCity[d.slug] = { ville: d.ville, items: [] };
  byCity[d.slug].items.push({
    source: 'discovered',
    name: d.name,
    rating: d.rating ?? 0,
    reviews: d.reviews ?? 0,
    address: d.address ?? '',
    website: d.website ?? '',
    place_id: d.place_id ?? null,
    phone: d.phone,
  });
}

// 3. Dedup + select top per city
const proposed = {};
const dedupReport = [];

for (const slug of Object.keys(byCity).sort()) {
  const { ville, items } = byCity[slug];

  // Dedup by address (or by place_id if available)
  const seen = new Map();
  for (const item of items) {
    const key = item.place_id || normalizeAddress(item.address) || normalize(item.name);
    if (!key) continue;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, item);
    } else {
      // Keep the one with the best score; preserve currents over discovered if tied
      const sExisting = scoreOf(existing.rating, existing.reviews);
      const sNew = scoreOf(item.rating, item.reviews);
      if (sNew > sExisting || (sNew === sExisting && existing.source === 'discovered' && item.source === 'current')) {
        dedupReport.push({ slug, kept: item.name, dropped: existing.name, reason: 'better_score_or_current' });
        seen.set(key, { ...item, biensGeres: existing.biensGeres ?? item.biensGeres });
      } else {
        dedupReport.push({ slug, kept: existing.name, dropped: item.name, reason: 'lower_score' });
      }
    }
  }

  let pool = [...seen.values()];

  // Nationals: reserve up to 3 slots for national brands
  const nationals = pool.filter((p) => isNational(p.name));
  const locals = pool.filter((p) => !isNational(p.name));

  // Sort each subset by score
  nationals.sort((a, b) => scoreOf(b.rating, b.reviews) - scoreOf(a.rating, a.reviews));
  locals.sort((a, b) => scoreOf(b.rating, b.reviews) - scoreOf(a.rating, a.reviews));

  // Compose : top 3 nationals (if any) + top locals up to MAX_PER_CITY
  const final = [];
  for (const n of nationals.slice(0, 3)) final.push(n);
  for (const l of locals) {
    if (final.length >= MAX_PER_CITY) break;
    final.push(l);
  }
  // If we don't have enough rated items, fill from currents in n.c. so the page isn't empty
  if (final.length < MIN_PER_CITY) {
    const nc = items.filter((it) => it.source === 'current' && !final.includes(it));
    for (const f of nc) {
      if (final.length >= MIN_PER_CITY) break;
      final.push(f);
    }
  }

  proposed[slug] = {
    ville,
    finalCount: final.length,
    items: final.map((it) => ({
      source: it.source,
      isNational: isNational(it.name),
      name: it.name,
      rating: it.rating,
      reviews: it.reviews,
      score: scoreOf(it.rating, it.reviews).toFixed(2),
      address: it.address,
      website: it.website,
      phone: it.phone,
      place_id: it.place_id,
      biensGeres: it.biensGeres ?? 0,
    })),
  };
}

fs.writeFileSync(path.join(ROOT, 'scripts/cities-proposed.json'), JSON.stringify(proposed, null, 2));
fs.writeFileSync(path.join(ROOT, 'scripts/dedup-report.json'), JSON.stringify(dedupReport, null, 2));

// Console summary
console.log('📊 Plan de remplacement\n');
const stats = { total: 0, nationals: 0, currents: 0, discovered: 0 };
for (const [slug, data] of Object.entries(proposed)) {
  stats.total += data.finalCount;
  for (const it of data.items) {
    if (it.isNational) stats.nationals++;
    else if (it.source === 'current') stats.currents++;
    else stats.discovered++;
  }
  console.log(`  ${slug.padEnd(22)} → ${data.finalCount} retenues`);
}
console.log(`\n  Total : ${stats.total} conciergeries (${stats.nationals} marques nationales + ${stats.currents} locales actuelles + ${stats.discovered} nouvelles)`);
console.log(`  Dédoublons détectés : ${dedupReport.length}`);
console.log(`\n💾 → scripts/cities-proposed.json`);
console.log(`💾 → scripts/dedup-report.json`);
