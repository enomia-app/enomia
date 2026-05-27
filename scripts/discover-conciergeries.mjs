#!/usr/bin/env node
/**
 * Découverte de nouvelles conciergeries via Places API pour les 46 villes publiées.
 *
 * Pour chaque ville :
 *   1. Query Places API "conciergerie airbnb [ville]" avec pageSize=20
 *   2. Filtre celles déjà connues (par place_id si dispo, sinon par nom fuzzy)
 *   3. Applique les filtres qualité (≥5 avis, name match, types valides, non-doublon)
 *   4. Garde les top 8 nouvelles par score = rating × log(reviews+1)
 *
 * Output :
 *   - scripts/discovered-conciergeries.json : ALL discoveries (pour prospection)
 *   - scripts/discovered-top-by-city.json   : top 8 par ville (pour intégration cities.ts)
 *
 * Usage : node scripts/discover-conciergeries.mjs
 *
 * Coût : 46 villes × 1 query × $0.034 ≈ $1.5 (Maps Platform). Plus le crédit gratuit.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const ENV_PATH = '/Users/marc/Desktop/Neocamino/.env';
let API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  const envContent = fs.readFileSync(ENV_PATH, 'utf8');
  API_KEY = envContent.match(/^GOOGLE_PLACES_API_KEY=(.+)$/m)?.[1]?.trim();
}
if (!API_KEY) {
  console.error('❌ GOOGLE_PLACES_API_KEY manquante');
  process.exit(1);
}

const TOP_PER_CITY = 8;
const MIN_REVIEWS = 5;

// Parse cities.ts (same logic as refresh script — robust)
function parseCities() {
  const content = fs.readFileSync(path.join(ROOT, 'src/data/cities.ts'), 'utf8');
  const cities = [];
  for (const match of content.matchAll(/^  \{\s*\n\s+slug:\s*'([^']+)',/gm)) {
    const slug = match[1];
    const startIdx = match.index;
    let depth = 0;
    let endIdx = startIdx;
    for (let i = startIdx; i < content.length; i++) {
      if (content[i] === '{') depth++;
      else if (content[i] === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }
    const block = content.slice(startIdx, endIdx);
    const displayName = block.match(/displayName:\s*["']([^"']+)["']/)?.[1];
    if (!displayName) continue;

    const conciergeriesBlock = block.match(/conciergeries:\s*\[([\s\S]+?)\],\s*\n\s+neighborhoods/)?.[1] || '';
    const knownNames = [];
    for (const c of conciergeriesBlock.match(/name:\s*["']([^"']+)["']/g) || []) {
      const n = c.match(/["']([^"']+)["']/)?.[1];
      if (n) knownNames.push(n);
    }
    cities.push({ slug, displayName, knownNames });
  }
  return cities;
}

// Normalize a name for fuzzy matching: lowercase, strip accents, remove generic words
function normalizeName(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isAlreadyKnown(googleName, knownNames) {
  const gNorm = normalizeName(googleName);
  for (const k of knownNames) {
    const kNorm = normalizeName(k);
    // Match if one name contains the other (ignoring city suffix)
    if (gNorm.includes(kNorm) || kNorm.includes(gNorm)) return true;
    // Check first significant word overlap
    const gWords = gNorm.split(' ').filter((w) => w.length >= 4);
    const kWords = kNorm.split(' ').filter((w) => w.length >= 4);
    if (gWords.length && kWords.length && gWords[0] === kWords[0]) return true;
  }
  return false;
}

// Places API Text Search
async function placesSearch(query) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.googleMapsUri,places.types,places.nationalPhoneNumber',
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'fr', regionCode: 'FR', pageSize: 20 }),
  });
  if (!res.ok) throw new Error(`Places API ${res.status}: ${(await res.text()).slice(0, 150)}`);
  return (await res.json()).places || [];
}

// Filter for conciergerie-related places
const CONCIERGE_RE = /concierge|airbnb|location|gestion locative|courte dur|rental|short.?term|property\s*management|gîte|gite|holiday\s*let/i;
const BAD_TYPES_RE = /child_care|car_rental|car_repair|hair_care|spa|gym|restaurant|cafe|bar|hotel/i;

function isConciergerie(place) {
  const name = place.displayName?.text || '';
  const types = (place.types || []).join(' ');
  if (BAD_TYPES_RE.test(types)) return false;
  if (CONCIERGE_RE.test(name)) return true;
  if (/real_estate_agency|lodging|property_management/i.test(types)) return true;
  return false;
}

async function discover() {
  const cities = parseCities();
  const allDiscoveries = [];
  const topByCity = {};

  let i = 0;
  for (const city of cities) {
    i++;
    process.stdout.write(`[${i}/${cities.length}] ${city.displayName.padEnd(25)} `);

    const query = `conciergerie airbnb ${city.displayName}`;
    let places;
    try {
      places = await placesSearch(query);
    } catch (e) {
      console.log('❌', e.message);
      continue;
    }

    const newOnes = [];
    for (const p of places) {
      if (!isConciergerie(p)) continue;
      if ((p.userRatingCount ?? 0) < MIN_REVIEWS) continue;
      if (isAlreadyKnown(p.displayName?.text, city.knownNames)) continue;

      newOnes.push({
        name: p.displayName?.text,
        rating: p.rating,
        reviews: p.userRatingCount,
        address: p.formattedAddress,
        website: p.websiteUri,
        phone: p.nationalPhoneNumber,
        place_id: p.id,
        maps_url: p.googleMapsUri,
        types: p.types,
        score: p.rating * Math.log((p.userRatingCount ?? 0) + 1),
      });
    }

    newOnes.sort((a, b) => b.score - a.score);
    const top = newOnes.slice(0, TOP_PER_CITY);
    topByCity[city.slug] = top.map((c) => ({
      name: c.name,
      rating: c.rating,
      reviews: c.reviews,
      address: c.address,
      website: c.website,
      phone: c.phone,
      place_id: c.place_id,
    }));

    for (const c of newOnes) {
      allDiscoveries.push({ ville: city.displayName, slug: city.slug, ...c });
    }

    console.log(`→ ${newOnes.length} nouvelles (top ${top.length} pour intégration, ${newOnes.length - top.length} pour prospection)`);

    await new Promise((r) => setTimeout(r, 80));
  }

  fs.writeFileSync(path.join(ROOT, 'scripts/discovered-conciergeries.json'), JSON.stringify(allDiscoveries, null, 2));
  fs.writeFileSync(path.join(ROOT, 'scripts/discovered-top-by-city.json'), JSON.stringify(topByCity, null, 2));

  console.log('\n📊 Total :');
  console.log(`   ${allDiscoveries.length} nouvelles conciergeries trouvées (toutes villes)`);
  console.log(`   ${Object.values(topByCity).flat().length} top à intégrer (max ${TOP_PER_CITY}/ville)`);
  console.log(`   ${allDiscoveries.length - Object.values(topByCity).flat().length} restantes = leads prospection`);
  console.log('💾 → scripts/discovered-conciergeries.json (full)');
  console.log('💾 → scripts/discovered-top-by-city.json (top par ville)');
}

discover().catch((e) => {
  console.error('❌ Crash:', e);
  process.exit(1);
});
