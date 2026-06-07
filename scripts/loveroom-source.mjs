#!/usr/bin/env node
/**
 * Sourcing love rooms par ville (Places API) — liste centralisée dans scripts/loveroom-cities.json.
 *
 *   Géocodage  : centre-ville résolu via Places (plus de coords en dur → ajouter une ville = 1 ligne JSON)
 *   Découverte : "love room [ville]" + "chambre jacuzzi privatif [ville]" + "suite romantique spa [ville]" (biais rayon)
 *   Enrichis.  : note Google, nb avis, géoloc, websiteUri (lien direct), jusqu'à 5 avis, résumé éditorial
 *   Distance   : haversine au centre → filtre rayon ; score de confiance high/medium/low (curate côté build)
 *
 * Usage :
 *   node scripts/loveroom-source.mjs                          # toutes les villes du JSON
 *   node scripts/loveroom-source.mjs --only=toulouse,nantes   # sous-ensemble (maîtrise coût API)
 *
 * Sortie : /tmp/loveroom-source-{slug}.json
 * Auth   : GOOGLE_PLACES_API_KEY dans /Users/marc/Desktop/Neocamino/.env
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, '.loveroom-cache'); // persistant (≠ /tmp purgé par macOS)
fs.mkdirSync(CACHE, { recursive: true });
const ENV_PATH = '/Users/marc/Desktop/Neocamino/.env';
let API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY && fs.existsSync(ENV_PATH)) API_KEY = fs.readFileSync(ENV_PATH, 'utf8').match(/^GOOGLE_PLACES_API_KEY=(.+)$/m)?.[1]?.trim();
if (!API_KEY) { console.error('❌ GOOGLE_PLACES_API_KEY introuvable (Neocamino/.env)'); process.exit(1); }

const only = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',').map((s) => s.trim());
const CITIES = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/loveroom-cities.json'), 'utf8'));
const todoN = process.argv.find((a) => a.startsWith('--todo='))?.split('=')[1];
const targets = todoN
  ? CITIES.filter((c) => c.status === 'todo').sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0)).slice(0, parseInt(todoN))
  : only
    ? CITIES.filter((c) => only.includes(c.slug))
    : CITIES;

const DISCOVERY = (v) => [`love room ${v}`, `chambre avec jacuzzi privatif ${v}`, `suite romantique spa privatif ${v}`, `love room jacuzzi ${v}`];
const LOVE_TERMS = /love\s?room|jacuzzi|spa privatif|spa priv|romantique|insolite|baln[ée]o|boudoir|nid|cocon|suite/i;
const LODGING = /lodging|bed_and_breakfast|hotel|guest_house|resort_hotel|cottage|inn|motel|spa/i;

function haversineKm(a, b) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}

// Région Places (administrative_area_level_1) → slug du site
const slugify = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const REGION_SLUG = {
  'ile-de-france': 'ile-de-france', 'auvergne-rhone-alpes': 'auvergne-rhone-alpes',
  'provence-alpes-cote-d-azur': 'provence-alpes-cote-dazur', 'occitanie': 'occitanie',
  'nouvelle-aquitaine': 'nouvelle-aquitaine', 'pays-de-la-loire': 'pays-de-la-loire',
  'hauts-de-france': 'hauts-de-france', 'grand-est': 'alsace', 'centre-val-de-loire': 'centre-val-de-loire',
  'bretagne': 'bretagne', 'normandie': 'normandie', 'bourgogne-franche-comte': 'bourgogne-franche-comte', 'corse': 'corse',
};

async function geocode(name) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': API_KEY, 'X-Goog-FieldMask': 'places.location,places.displayName,places.addressComponents' },
    body: JSON.stringify({ textQuery: `${name} France`, languageCode: 'fr', regionCode: 'FR', pageSize: 1 }),
  });
  if (!res.ok) { console.error(`⚠️ geocode ${name}: ${res.status}`); return null; }
  const p = (await res.json()).places?.[0];
  if (!p?.location) return null;
  const reg = (p.addressComponents || []).find((c) => (c.types || []).includes('administrative_area_level_1'));
  const regionName = reg?.longText || reg?.shortText || '';
  return { lat: p.location.latitude, lng: p.location.longitude, regionName, regionSlug: REGION_SLUG[slugify(regionName)] || slugify(regionName), officialName: p.displayName?.text || name };
}

async function placesSearch(query, center) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', 'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.websiteUri,places.googleMapsUri,places.types,places.editorialSummary,places.reviews,places.priceLevel',
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'fr', regionCode: 'FR', pageSize: 20, locationBias: { circle: { center: { latitude: center.lat, longitude: center.lng }, radius: 50000 } } }),
  });
  if (!res.ok) { console.error(`⚠️ Places ${res.status} "${query}": ${(await res.text()).slice(0, 120)}`); return []; }
  return (await res.json()).places || [];
}

const localityFromAddress = (a = '') => a.match(/\d{5}\s+([^,]+)/)?.[1]?.trim() || a.split(',').slice(-2, -1)[0]?.trim() || '';
function confidence(p, fromLove) {
  const t = `${p.displayName?.text || ''} ${p.editorialSummary?.text || ''}`;
  const nameHit = LOVE_TERMS.test(t), lodging = LODGING.test((p.types || []).join(' '));
  if (nameHit && (lodging || fromLove)) return 'high';
  if (nameHit || (fromLove && lodging)) return 'medium';
  return 'low';
}

function persistCity(slug, fields) {
  const p = path.join(ROOT, 'scripts/loveroom-cities.json');
  const list = JSON.parse(fs.readFileSync(p, 'utf8'));
  const e = list.find((c) => c.slug === slug);
  if (e) { Object.assign(e, fields); fs.writeFileSync(p, JSON.stringify(list, null, 2) + '\n'); }
}

async function sourceCity(cfg) {
  const center = await geocode(cfg.displayName);
  if (!center) { console.error(`❌ ${cfg.displayName}: géocodage échoué, skip`); return; }
  // Coordonnées du centre-ville → maillage interne par proximité géographique réelle (cross-région)
  persistCity(cfg.slug, { lat: +center.lat.toFixed(5), lng: +center.lng.toFixed(5) });
  const R = cfg.radiusKm || 50;
  // Région auto pour les villes du backlog (todo sans région) → persistée dans cities.json
  if (!cfg.regionSlug && center.regionSlug) {
    persistCity(cfg.slug, { region: center.regionName, regionSlug: center.regionSlug, radiusKm: R, displayName: center.officialName });
    cfg.displayName = center.officialName;
  }
  // requêtes ville + requêtes RÉGION (pour trouver des love rooms plus loin → remplir les petites villes au rayon élargi)
  const queries = [...DISCOVERY(cfg.displayName)];
  if (center.regionName) queries.push(`love room ${center.regionName}`, `chambre avec jacuzzi privatif ${center.regionName}`);
  const seen = new Map();
  for (const q of queries) {
    for (const p of await placesSearch(q, center)) {
      if (!p.id || seen.has(p.id) || !p.location) continue;
      const loc = { lat: p.location.latitude, lng: p.location.longitude };
      const distanceKm = haversineKm(center, loc);
      if (distanceKm > 150) continue; // on collecte large ; le build choisit le rayon adaptatif (base→100→150)
      seen.set(p.id, {
        place_id: p.id, name: p.displayName?.text || '', area: localityFromAddress(p.formattedAddress), address: p.formattedAddress,
        distanceKm, lat: loc.lat, lng: loc.lng, rating: p.rating ?? null, reviews: p.userRatingCount ?? null,
        url: p.websiteUri || null, mapsUri: p.googleMapsUri || null, summary: p.editorialSummary?.text || null,
        priceLevel: p.priceLevel || null, types: p.types || [], confidence: confidence(p, true),
        recentReviews: (p.reviews || []).slice(0, 5).map((r) => ({ author: r.authorAttribution?.displayName || null, rating: r.rating ?? null, when: r.relativePublishTimeDescription || null, text: (r.text?.text || '').slice(0, 400) })),
      });
    }
    await new Promise((r) => setTimeout(r, 60));
  }
  const candidates = [...seen.values()].sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.confidence] - { high: 0, medium: 1, low: 2 }[b.confidence]) || a.distanceKm - b.distanceKm);
  fs.writeFileSync(path.join(CACHE, `loveroom-source-${cfg.slug}.json`), JSON.stringify(candidates, null, 2));
  persistCity(cfg.slug, { found: candidates.filter((c) => c.confidence !== 'low').length }); // nb recensé durable
  const byConf = (c) => candidates.filter((x) => x.confidence === c).length;
  console.log(`${cfg.displayName.padEnd(13)} (r${R}) : ${String(candidates.length).padStart(3)} cand. (high ${byConf('high')}) · note ${candidates.filter((c) => c.rating).length} · site ${candidates.filter((c) => c.url).length} · avis ${candidates.filter((c) => c.recentReviews.length).length}`);
}

console.error(`🔍 Sourcing ${targets.length} ville(s)…`);
for (const cfg of targets) await sourceCity(cfg);
console.log('✅ terminé');
