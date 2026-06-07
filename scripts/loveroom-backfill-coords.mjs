#!/usr/bin/env node
/**
 * Backfill ponctuel : ajoute lat/lng (centre-ville, via Places) aux villes de loveroom-cities.json
 * qui n'en ont pas encore — nécessaire au maillage interne par proximité géographique (nearbyFor).
 * Les NOUVELLES villes reçoivent leur lat/lng directement dans loveroom-source.mjs ; ce script
 * ne sert qu'à rattraper les villes publiées avant cet ajout. 1 appel Places par ville (coût négligeable).
 *
 * Usage : node scripts/loveroom-backfill-coords.mjs            # toutes les villes sans coords
 *         node scripts/loveroom-backfill-coords.mjs --all      # force le re-géocodage de tout
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = '/Users/marc/Desktop/Neocamino/.env';
let API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY && fs.existsSync(ENV_PATH)) API_KEY = fs.readFileSync(ENV_PATH, 'utf8').match(/^GOOGLE_PLACES_API_KEY=(.+)$/m)?.[1]?.trim();
if (!API_KEY) { console.error('❌ GOOGLE_PLACES_API_KEY introuvable'); process.exit(1); }

const FORCE = process.argv.includes('--all');
const P = path.join(ROOT, 'scripts/loveroom-cities.json');
const list = JSON.parse(fs.readFileSync(P, 'utf8'));

async function geocode(name) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': API_KEY, 'X-Goog-FieldMask': 'places.location' },
    body: JSON.stringify({ textQuery: `${name} France`, languageCode: 'fr', regionCode: 'FR', pageSize: 1 }),
  });
  if (!res.ok) { console.error(`⚠️ ${name}: ${res.status}`); return null; }
  const p = (await res.json()).places?.[0];
  return p?.location ? { lat: p.location.latitude, lng: p.location.longitude } : null;
}

// Villes déjà publiées (status done) sans coords ; les todo seront géocodées au sourcing du cron.
const todo = list.filter((c) => FORCE || (c.status === 'done' && typeof c.lat !== 'number'));
console.error(`📍 Backfill coords : ${todo.length} ville(s)…`);
let ok = 0;
for (const c of todo) {
  const g = await geocode(c.displayName);
  if (g) { c.lat = +g.lat.toFixed(5); c.lng = +g.lng.toFixed(5); ok++; console.log(`  ${c.slug.padEnd(22)} → ${c.lat}, ${c.lng}`); }
  else console.log(`  ${c.slug.padEnd(22)} → ÉCHEC`);
  await new Promise((r) => setTimeout(r, 80));
}
fs.writeFileSync(P, JSON.stringify(list, null, 2) + '\n');
console.error(`✅ ${ok}/${todo.length} villes géocodées → loveroom-cities.json`);
