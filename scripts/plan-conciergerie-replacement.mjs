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

// Mapping département (2 premiers chiffres CP) → région française.
// Utilisé pour exclure les conciergeries d'une autre région (pollution géo Places API).
const DEPT_TO_REGION = {
  '01': 'ara', '03': 'ara', '07': 'ara', '15': 'ara', '26': 'ara', '38': 'ara', '42': 'ara', '43': 'ara', '63': 'ara', '69': 'ara', '73': 'ara', '74': 'ara',
  '02': 'hdf', '59': 'hdf', '60': 'hdf', '62': 'hdf', '80': 'hdf',
  '04': 'paca', '05': 'paca', '06': 'paca', '13': 'paca', '83': 'paca', '84': 'paca',
  '08': 'ge', '10': 'ge', '51': 'ge', '52': 'ge', '54': 'ge', '55': 'ge', '57': 'ge', '67': 'ge', '68': 'ge', '88': 'ge',
  '09': 'occ', '11': 'occ', '12': 'occ', '30': 'occ', '31': 'occ', '32': 'occ', '34': 'occ', '46': 'occ', '48': 'occ', '65': 'occ', '66': 'occ', '81': 'occ', '82': 'occ',
  '14': 'norm', '27': 'norm', '50': 'norm', '61': 'norm', '76': 'norm',
  '16': 'na', '17': 'na', '19': 'na', '23': 'na', '24': 'na', '33': 'na', '40': 'na', '47': 'na', '64': 'na', '79': 'na', '86': 'na', '87': 'na',
  '18': 'cvl', '28': 'cvl', '36': 'cvl', '37': 'cvl', '41': 'cvl', '45': 'cvl',
  '21': 'bfc', '25': 'bfc', '39': 'bfc', '58': 'bfc', '70': 'bfc', '71': 'bfc', '89': 'bfc', '90': 'bfc',
  '22': 'bzh', '29': 'bzh', '35': 'bzh', '56': 'bzh',
  '44': 'pdl', '49': 'pdl', '53': 'pdl', '72': 'pdl', '85': 'pdl',
  '75': 'idf', '77': 'idf', '78': 'idf', '91': 'idf', '92': 'idf', '93': 'idf', '94': 'idf', '95': 'idf',
};

function regionOfCP(cp) {
  if (!cp) return null;
  return DEPT_TO_REGION[cp.slice(0, 2)] || null;
}

function cpOf(addr) {
  const m = (addr || '').match(/\b(\d{5})\b/);
  return m ? m[1] : null;
}

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

const geoExcluded = [];

// Liste des noms de villes connues (pour détecter "Marque - ville X" pointant vers une autre ville)
const KNOWN_CITY_NAMES = Object.values(byCity).map((c) => normalize(c.ville)).filter((n) => n.length >= 4);

// Détecte si un nom de fiche contient un nom de ville DIFFÉRENT de la ville cible
function nameMentionsOtherCity(name, targetVille) {
  const n = normalize(name);
  const target = normalize(targetVille);
  for (const city of KNOWN_CITY_NAMES) {
    if (city === target) continue;
    // mot entier pour éviter les faux positifs ("agde" dans "cap d agde")
    const re = new RegExp(`\\b${city}\\b`);
    if (re.test(n) && !n.includes(target)) return city;
  }
  return null;
}

for (const slug of Object.keys(byCity).sort()) {
  const { ville, items } = byCity[slug];

  // Détermine la région attendue de la ville = région du département majoritaire des items
  const regionVotes = {};
  for (const it of items) {
    const r = regionOfCP(cpOf(it.address));
    if (r) regionVotes[r] = (regionVotes[r] || 0) + 1;
  }
  const expectedRegion = Object.entries(regionVotes).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Filtre géographique : exclut les conciergeries LOCALES d'une autre région.
  // Les marques nationales (HQ Paris etc.) sont exemptées — leur fiche peut être ailleurs.
  const geoFiltered = items.filter((it) => {
    const ficheRegion = regionOfCP(cpOf(it.address));
    const otherCity = nameMentionsOtherCity(it.name, ville);

    // 1. Fiche dans la région attendue → on garde (signal le plus fiable, gère Cap d'Agde≈Agde)
    if (ficheRegion && expectedRegion && ficheRegion === expectedRegion) return true;
    // 2. Marque nationale au nom générique (pas d'autre ville mentionnée) → HQ assumé, on garde
    if (isNational(it.name) && !otherCity) return true;
    // 3. Fiche dans une AUTRE région que la cible → pollution géo, on exclut
    if (ficheRegion && expectedRegion && ficheRegion !== expectedRegion) {
      geoExcluded.push({ slug, name: it.name, cp: cpOf(it.address), region: ficheRegion, expected: expectedRegion });
      return false;
    }
    // 4. Le nom pointe vers une autre ville sans qu'on ait pu confirmer la région → on exclut
    if (otherCity) {
      geoExcluded.push({ slug, name: it.name, reason: `mentionne ${otherCity}`, cp: cpOf(it.address) });
      return false;
    }
    // 5. Bénéfice du doute (pas de CP, pas d'autre ville mentionnée)
    return true;
  });

  // Dedup by address (or by place_id if available) — sur les items géo-filtrés
  const seen = new Map();
  for (const item of geoFiltered) {
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
  // If we don't have enough rated items, fill from geo-filtered currents in n.c. so the page isn't empty
  if (final.length < MIN_PER_CITY) {
    const nc = geoFiltered.filter((it) => it.source === 'current' && !final.includes(it));
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
console.log(`  Exclusions géo (autre région) : ${geoExcluded.length}`);
if (geoExcluded.length > 0) {
  console.log('\n  Conciergeries exclues (pollution géo) :');
  for (const g of geoExcluded) console.log(`    ✗ ${g.slug.padEnd(20)} ${g.name.slice(0, 40)} (CP ${g.cp}, région ${g.region} ≠ ${g.expected})`);
}
fs.writeFileSync(path.join(ROOT, 'scripts/geo-excluded.json'), JSON.stringify(geoExcluded, null, 2));
console.log(`\n💾 → scripts/cities-proposed.json`);
console.log(`💾 → scripts/dedup-report.json`);
console.log(`💾 → scripts/geo-excluded.json`);
