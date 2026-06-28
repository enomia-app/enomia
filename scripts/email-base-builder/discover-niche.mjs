// scripts/email-base-builder/discover-niche.mjs
//
// Découverte d'établissements (proprios) par niche via Places Text Search,
// calqué sur discover-conciergeries.mjs (même endpoint, clé, fieldmask).
// On ne garde que ceux qui ONT un site web (= prospects emailables).
//
// Niches : loveroom, cabane, conciergerie.
//   - conciergerie : toutes les villes de city-backlog.json, taggées
//     `page_en_ligne` selon le sitemap live (la page ville existe ou non).
//
// Usage : node discover-niche.mjs <loveroom|cabane|conciergerie|all>
// Sortie : data/email-base/_discovered/<niche>.json

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractDomain } from '../backlinks-source-monthly/filters.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

let API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  try { API_KEY = fs.readFileSync('/Users/marc/Desktop/Neocamino/.env', 'utf8').match(/^GOOGLE_PLACES_API_KEY=(.+)$/m)?.[1]?.trim(); } catch { /* */ }
}
if (!API_KEY) { console.error('❌ GOOGLE_PLACES_API_KEY manquante'); process.exit(1); }

// ─── Filtres de pertinence ───────────────────────────────────────────────
const CONCIERGE_RE = /concierge|airbnb|location|gestion locative|courte dur|rental|short.?term|property\s*management|gîte|gite|holiday\s*let/i;
const CONCIERGE_BAD = /child_care|car_rental|car_repair|hair_care|spa|gym|restaurant|cafe|bar|hotel/i;
function isConciergerie(p) {
  const name = p.displayName?.text || '';
  const types = (p.types || []).join(' ');
  if (CONCIERGE_BAD.test(types)) return false;
  if (CONCIERGE_RE.test(name)) return true;
  if (/real_estate_agency|lodging|property_management/i.test(types)) return true;
  return false;
}
const NICHE_BAD = /child_care|car_rental|car_repair|hair_care|gym|restaurant|cafe|^bar$|night_club|supermarket|clothing_store|store|gas_station|bank|doctor|dentist/i;
const nicheRelevant = p => !NICHE_BAD.test((p.types || []).join(' '));

const NICHES = {
  loveroom: { src: 'scripts/loveroom-cities.json', label: c => c.displayName, slug: c => c.slug, q: c => `love room ${c.displayName}`, relevant: nicheRelevant, extra: () => ({}), out: 'loveroom.json' },
  cabane: { src: 'scripts/cabane-zones.json', label: c => c.displayName, slug: c => c.slug, q: c => `cabane insolite ${c.displayName}`, relevant: nicheRelevant, extra: () => ({}), out: 'cabane.json' },
  conciergerie: {
    src: 'scripts/city-backlog.json',
    cityFilter: c => c.status !== 'Hors scope',
    label: c => c.ville, slug: c => c.citySlug,
    q: c => `conciergerie airbnb ${c.ville}`,
    relevant: isConciergerie,
    extra: c => ({ citySlug: c.citySlug, page_url: c.newUrl ? 'https://www.enomia.app' + c.newUrl : '', city_status: c.status }),
    sitemap: true, out: 'conciergerie.json',
  },
};

async function placesSearch(query) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.googleMapsUri,places.types,places.nationalPhoneNumber',
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'fr', regionCode: 'FR', pageSize: 20 }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Places ${res.status}: ${(await res.text()).slice(0, 120)}`);
  return (await res.json()).places || [];
}

// Sitemap live → set des citySlugs dont la page conciergerie existe.
async function liveConciergerieSlugs() {
  try {
    const r = await fetch('https://www.enomia.app/sitemap.xml', { signal: AbortSignal.timeout(15000) });
    const xml = await r.text();
    const set = new Set();
    for (const m of xml.matchAll(/\/conciergerie-airbnb\/[^/]+\/([a-z0-9-]+)/g)) set.add(m[1]);
    return set;
  } catch (e) { console.log('⚠️ sitemap inaccessible:', e.message); return new Set(); }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run(key) {
  const n = NICHES[key];
  let cities = JSON.parse(fs.readFileSync(path.join(ROOT, n.src), 'utf8'));
  if (n.cityFilter) cities = cities.filter(n.cityFilter);
  const live = n.sitemap ? await liveConciergerieSlugs() : null;
  if (live) console.log(`  sitemap : ${live.size} pages conciergerie en ligne`);

  const out = [];
  const seenPid = new Set(), seenDom = new Set();
  let i = 0, calls = 0;
  for (const c of cities) {
    i++;
    let places = [];
    try { places = await placesSearch(n.q(c)); calls++; }
    catch (e) { process.stdout.write(`\n[${i}/${cities.length}] ${n.label(c)} ❌ ${e.message}\n`); await sleep(200); continue; }
    let kept = 0;
    for (const p of places) {
      const website = p.websiteUri;
      if (!website) continue;
      if (!n.relevant(p)) continue;
      if (p.id && seenPid.has(p.id)) continue;
      const dom = extractDomain(/^https?:/.test(website) ? website : 'https://' + website);
      if (dom && seenDom.has(dom)) continue;
      if (p.id) seenPid.add(p.id);
      if (dom) seenDom.add(dom);
      out.push({
        ville: n.label(c), slug: n.slug(c), name: p.displayName?.text,
        website, phone: p.nationalPhoneNumber, rating: p.rating, reviews: p.userRatingCount,
        address: p.formattedAddress, place_id: p.id, types: p.types,
        ...n.extra(c),
        ...(live ? { page_en_ligne: live.has(n.slug(c)) } : {}),
      });
      kept++;
    }
    process.stdout.write(`[${i}/${cities.length}] ${String(n.label(c) || '').slice(0, 18).padEnd(18)} +${kept} (tot ${out.length})\r`);
    await sleep(80);
  }

  const dir = path.join(ROOT, 'data', 'email-base', '_discovered');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, n.out), JSON.stringify(out, null, 2));
  const online = live ? out.filter(x => x.page_en_ligne).length : null;
  console.log(`\n✅ ${key} : ${out.length} établissements avec site (${calls} requêtes)` + (online !== null ? ` | ${online} en ville avec page EN LIGNE` : ''));
  return out.length;
}

const which = process.argv[2] || 'all';
const keys = which === 'all' ? Object.keys(NICHES) : [which];
for (const k of keys) {
  if (!NICHES[k]) { console.error(`niche inconnue: ${k}`); process.exit(1); }
  await run(k);
}
