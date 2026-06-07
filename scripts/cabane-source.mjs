#!/usr/bin/env node
/**
 * Sourcing cabanes insolites par ZONE (Places API) — liste centralisée dans scripts/cabane-zones.json.
 * Cabane = niche RÉGION/ZONE-led (≠ love room ville-led) : on indexe par région, département, massif.
 *
 *   Géocodage  : centre de la zone résolu via Places (geocodeQuery override pour les ambigus)
 *   Découverte : "cabane dans les arbres [zone]" + "cabane insolite [zone]" + "cabane jacuzzi [zone]" + …
 *   Enrichis.  : note Google, nb avis, géoloc, websiteUri (lien direct), jusqu'à 5 avis, résumé éditorial
 *   Distance   : haversine au centre → collecte large (≤150km), le build choisit le rayon adaptatif
 *
 * Usage :
 *   node scripts/cabane-source.mjs --only=bretagne,vosges
 *   node scripts/cabane-source.mjs --todo=4
 * Auth : GOOGLE_PLACES_API_KEY dans /Users/marc/Desktop/Neocamino/.env
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, '.cabane-cache');
fs.mkdirSync(CACHE, { recursive: true });
const ENV_PATH = '/Users/marc/Desktop/Neocamino/.env';
let API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY && fs.existsSync(ENV_PATH)) API_KEY = fs.readFileSync(ENV_PATH, 'utf8').match(/^GOOGLE_PLACES_API_KEY=(.+)$/m)?.[1]?.trim();
if (!API_KEY) { console.error('❌ GOOGLE_PLACES_API_KEY introuvable (Neocamino/.env)'); process.exit(1); }

const only = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',').map((s) => s.trim());
const ZONES = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/cabane-zones.json'), 'utf8'));
const todoN = process.argv.find((a) => a.startsWith('--todo='))?.split('=')[1];
const targets = todoN
  ? ZONES.filter((c) => c.status === 'todo').sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0)).slice(0, parseInt(todoN))
  : only
    ? ZONES.filter((c) => only.includes(c.slug))
    : ZONES;

const DISCOVERY = (z) => [`cabane dans les arbres ${z}`, `cabane insolite ${z}`, `cabane jacuzzi ${z}`, `cabane dans les bois ${z}`, `cabane spa ${z}`, `nuit insolite cabane ${z}`];
const CABANE_TERMS = /caban|perch[ée]|dans les arbres|insolite|nature|écolodge|ecolodge|lodge|nid|tiny\s?house|hutte|bois/i;
const LODGING = /lodging|bed_and_breakfast|hotel|guest_house|resort_hotel|cottage|inn|campground|rv_park/i;

function haversineKm(a, b) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}

async function geocode(query) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': API_KEY, 'X-Goog-FieldMask': 'places.location,places.displayName' },
    body: JSON.stringify({ textQuery: query, languageCode: 'fr', regionCode: 'FR', pageSize: 1 }),
  });
  if (!res.ok) { console.error(`⚠️ geocode ${query}: ${res.status}`); return null; }
  const p = (await res.json()).places?.[0];
  return p?.location ? { lat: p.location.latitude, lng: p.location.longitude } : null;
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
const deptFromAddress = (a = '') => a.match(/(\d{2})\d{3}\s/)?.[1] || '';
function confidence(p) {
  const t = `${p.displayName?.text || ''} ${p.editorialSummary?.text || ''}`;
  const nameHit = CABANE_TERMS.test(t), lodging = LODGING.test((p.types || []).join(' '));
  if (nameHit && lodging) return 'high';
  if (nameHit || lodging) return 'medium';
  return 'low';
}

function persistZone(slug, fields) {
  const p = path.join(ROOT, 'scripts/cabane-zones.json');
  const list = JSON.parse(fs.readFileSync(p, 'utf8'));
  const e = list.find((c) => c.slug === slug);
  if (e) { Object.assign(e, fields); fs.writeFileSync(p, JSON.stringify(list, null, 2) + '\n'); }
}

async function sourceZone(cfg) {
  const center = await geocode(cfg.geocodeQuery || `${cfg.displayName} France`);
  if (!center) { console.error(`❌ ${cfg.displayName}: géocodage échoué, skip`); return; }
  persistZone(cfg.slug, { lat: +center.lat.toFixed(5), lng: +center.lng.toFixed(5) });
  const seen = new Map();
  for (const q of DISCOVERY(cfg.displayName)) {
    for (const p of await placesSearch(q, center)) {
      if (!p.id || seen.has(p.id) || !p.location) continue;
      const loc = { lat: p.location.latitude, lng: p.location.longitude };
      const distanceKm = haversineKm(center, loc);
      if (distanceKm > 150) continue; // collecte large ; rayon adaptatif côté build
      seen.set(p.id, {
        place_id: p.id, name: p.displayName?.text || '', area: localityFromAddress(p.formattedAddress), dept: deptFromAddress(p.formattedAddress), address: p.formattedAddress,
        distanceKm, lat: loc.lat, lng: loc.lng, rating: p.rating ?? null, reviews: p.userRatingCount ?? null,
        url: p.websiteUri || null, mapsUri: p.googleMapsUri || null, summary: p.editorialSummary?.text || null,
        priceLevel: p.priceLevel || null, types: p.types || [], confidence: confidence(p),
        recentReviews: (p.reviews || []).slice(0, 5).map((r) => ({ author: r.authorAttribution?.displayName || null, rating: r.rating ?? null, when: r.relativePublishTimeDescription || null, text: (r.text?.text || '').slice(0, 400) })),
      });
    }
    await new Promise((r) => setTimeout(r, 60));
  }
  const candidates = [...seen.values()].sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.confidence] - { high: 0, medium: 1, low: 2 }[b.confidence]) || a.distanceKm - b.distanceKm);
  fs.writeFileSync(path.join(CACHE, `cabane-source-${cfg.slug}.json`), JSON.stringify(candidates, null, 2));
  persistZone(cfg.slug, { found: candidates.filter((c) => c.confidence !== 'low').length });
  const byConf = (c) => candidates.filter((x) => x.confidence === c).length;
  console.log(`${cfg.slug.padEnd(18)} : ${candidates.length} candidats (high ${byConf('high')} · med ${byConf('medium')} · low ${byConf('low')})`);
}

console.error(`🌲 Sourcing cabane sur ${targets.length} zone(s)…`);
for (const cfg of targets) await sourceZone(cfg);
console.log('✅ sourcing terminé');
