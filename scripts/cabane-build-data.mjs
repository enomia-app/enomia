#!/usr/bin/env node
/**
 * Curate les candidats Places (.cabane-cache/cabane-source-*.json) → génère src/data/cabaneListings.ts.
 *
 * - Curation : confiance high + note ≥ 4 + ≥ 10 avis + isCabane (règle dure) + gate IA (cabane !== false), dédup.
 * - Tri : par score (note × log avis) — on garde les 8 meilleures cabanes par zone.
 * - Rayon ADAPTATIF : base → 100 → 150 km jusqu'à 8 (les zones sont larges, mais on garantit le remplissage).
 * - Description : rédigée par l'IA depuis les vrais avis ; URL = site direct du proprio (pas d'annuaire/OTA).
 *
 * Usage : node scripts/cabane-build-data.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, '.cabane-cache');
const ZONES_PATH = path.join(ROOT, 'scripts/cabane-zones.json');
const SLUGS = JSON.parse(fs.readFileSync(ZONES_PATH, 'utf8'))
  .map((c) => c.slug)
  .filter((slug) => fs.existsSync(path.join(CACHE, `cabane-source-${slug}.json`)));
const ZONE_RADIUS = Object.fromEntries(JSON.parse(fs.readFileSync(ZONES_PATH, 'utf8')).map((c) => [c.slug, c.radiusKm || 70]));
function persistRadius(slug, r) {
  const l = JSON.parse(fs.readFileSync(ZONES_PATH, 'utf8'));
  const e = l.find((c) => c.slug === slug);
  if (e && e.radiusKm !== r) { e.radiusKm = r; fs.writeFileSync(ZONES_PATH, JSON.stringify(l, null, 2) + '\n'); }
}
const TARGET = 8;
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const score = (c) => (c.rating || 0) * Math.log10((c.reviews || 0) + 1);

const DIRECTORY_HOSTS = /booking\.|airbnb\.|abritel|tripadvisor|expedia|hotels\.com|lastminute|gites-de-france|nuitetspa|weekendesk|chambres?-?hotes/i;

// Règle dure : ne garder que des hébergements cabane. Le GROS du tri fin = la passe IA (cabane true/false).
const NAME_BAD = /h[ôo]tel\b|hostellerie|restaurant|brasserie|magasin|constructeur|fabricant|\bvente\b|immobili|menuiserie/i;
const SHOP_TYPES = /store|shopping|real_estate|contractor|home_goods|furniture/i;
const COMPLEX_TYPES = /night_club|\bbar\b|casino/i;
function isCabane(c) {
  if (NAME_BAD.test(c.name)) return false;
  const types = (c.types || []).join(' ');
  if (SHOP_TYPES.test(types) || COMPLEX_TYPES.test(types)) return false;
  return true;
}

const FOUND = {};

function cleanName(n) {
  let s = n.replace(/\s*[-|/–]\s*(by\s+nuit.*|booking.*|airbnb.*|abritel.*|r[ée]serv\w*.*|site officiel.*)$/i, '').trim();
  s = s.split(/\s*[:|]\s*|\s[-–]\s|\s\/\s/)[0].trim();
  if (s.length > 52) s = s.slice(0, 52).replace(/\s+\S*$/, '').trim() + '…';
  if (s.length < 3) s = n.split(/[,:|]/)[0].trim().slice(0, 52);
  return s;
}

function featuresOf(text) {
  const f = [];
  if (/perch|dans les arbres|arbre/i.test(text)) f.push('Cabane perchée');
  if (/jacuzzi|spa|baln[ée]o|bain nordique|bain à remous|bain norv/i.test(text)) f.push('Spa ou bain nordique');
  if (/sauna/i.test(text)) f.push('Sauna');
  if (/terrasse/i.test(text)) f.push('Terrasse privative');
  if (/vue|panoram|surplomb/i.test(text)) f.push('Vue dégagée');
  if (/chemin[ée]e|po[êe]le/i.test(text)) f.push('Cheminée ou poêle');
  if (/[ée]tang|lac|plan d.?eau|rivi[èe]re/i.test(text)) f.push("Au bord de l'eau");
  if (!f.length) f.push('Hébergement insolite en pleine nature');
  return [...new Set(f)].slice(0, 5);
}

function curate(slug) {
  const file = path.join(CACHE, `cabane-source-${slug}.json`);
  if (!fs.existsSync(file)) { console.warn(`⚠️ ${slug}: pas de source — skip`); return []; }
  const cands = JSON.parse(fs.readFileSync(file, 'utf8'));
  FOUND[slug] = cands.filter((c) => c.confidence !== 'low').length;
  const aiFile = path.join(CACHE, `ai-${slug}.json`);
  const ai = fs.existsSync(aiFile) ? JSON.parse(fs.readFileSync(aiFile, 'utf8')) : {};
  const kept = cands.filter(
    (c) => c.confidence === 'high' && c.rating != null && c.rating >= 4.0 && (c.reviews || 0) >= 10 &&
      isCabane(c) && ai[c.name]?.cabane !== false
  );
  const seen = new Set(), seenUrl = new Set(), dedup = [];
  for (const c of kept.sort((a, b) => score(b) - score(a))) {
    const key = norm(c.name).replace(/cabane|cabanes|insolite|nature|spa|perchee|perche|les |la |le |des |du /g, '').replace(/[^a-z0-9]/g, '').slice(0, 12);
    const host = c.url ? (c.url.match(/\/\/([^/]+)/)?.[1] || '').replace(/^www\./, '') : '';
    if ((key && seen.has(key)) || (host && seenUrl.has(host))) continue;
    if (key) seen.add(key);
    if (host) seenUrl.add(host);
    dedup.push(c);
  }
  const baseR = ZONE_RADIUS[slug] || 70;
  let effR = baseR;
  for (const r of [baseR, 100, 150]) { effR = r; if (dedup.filter((c) => c.distanceKm <= r).length >= TARGET) break; }
  persistRadius(slug, effR);
  return dedup.filter((c) => c.distanceKm <= effR).slice(0, TARGET).map((c) => {
    const allText = `${c.name} ${c.summary || ''} ${(c.recentReviews || []).map((r) => r.text).join(' ')}`;
    const cab = {
      name: cleanName(c.name),
      area: c.area || '',
      dept: c.dept || '',
      distanceKm: c.distanceKm,
      features: featuresOf(allText),
      vibe: `Cabane insolite${c.area ? ' à ' + c.area : ''}`,
      rating: c.rating,
      reviews: c.reviews,
      source: 'Google Places',
    };
    cab.description = ai[c.name]?.description || c.summary || cab.vibe;
    if (c.url && !DIRECTORY_HOSTS.test(c.url)) cab.url = c.url;
    const revs = (c.recentReviews || []).filter((r) => r.text && r.text.length > 40 && (r.rating ?? 5) >= 4).slice(0, 5)
      .map((r) => ({ author: r.author || null, rating: r.rating ?? null, when: r.when || null, text: r.text.replace(/\s+/g, ' ').trim().slice(0, 320) }));
    if (revs.length) cab.recentReviews = revs;
    return cab;
  });
}

// Merge incrémental (préserve les zones non re-sourcées — ex. cron qui n'a en cache que ses zones du run).
let listings = {};
try {
  const prev = fs.readFileSync(path.join(ROOT, 'src/data/cabaneListings.ts'), 'utf8');
  const eq = prev.indexOf('=', prev.search(/export const/));
  listings = JSON.parse(prev.slice(eq + 1).trim().replace(/;\s*$/, ''));
} catch { listings = {}; }
for (const slug of SLUGS) {
  listings[slug] = curate(slug);
  const l = listings[slug];
  console.log(`${slug.padEnd(18)} : ${l.length} cabanes · ${l.filter((r) => r.url).length} lien direct · ${l.filter((r) => r.recentReviews).length} avis · ${l.filter((r) => r.description !== r.vibe).length} desc rédigée`);
}
const header = `import type { Cabane } from './cabanes';
// ⚙️ AUTO-GÉNÉRÉ par scripts/cabane-build-data.mjs — ne pas éditer à la main.
// Note/avis/lien direct = Google Places (attribution). Descriptions = rédigées depuis les avis.
export const cabaneListings: Record<string, Cabane[]> = `;
fs.writeFileSync(path.join(ROOT, 'src/data/cabaneListings.ts'), header + JSON.stringify(listings, null, 2) + ';\n');
console.log(`\n✅ src/data/cabaneListings.ts régénéré (${Object.values(listings).reduce((s, l) => s + l.length, 0)} cabanes).`);

const zonesMeta = JSON.parse(fs.readFileSync(ZONES_PATH, 'utf8'))
  .filter((c) => (listings[c.slug] || []).length > 0)
  .map((c) => ({ ...c, found: FOUND[c.slug] || c.found || (listings[c.slug] || []).length }));
fs.writeFileSync(
  path.join(ROOT, 'src/data/cabaneZones.ts'),
  `// ⚙️ AUTO-GÉNÉRÉ par scripts/cabane-build-data.mjs — source: scripts/cabane-zones.json\nexport const cabaneZonesMeta = ${JSON.stringify(zonesMeta, null, 2)};\n`
);
console.log(`✅ src/data/cabaneZones.ts (${zonesMeta.length} zones avec cabanes).`);
