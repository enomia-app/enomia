#!/usr/bin/env node
/**
 * Découverte SEMrush du cluster « love room » en France via phrase_fullsearch (broad match).
 *
 * Une requête fullsearch ramène TOUS les KW contenant la phrase seed → toutes les
 * villes + variantes apparaissent naturellement (pas besoin de deviner la liste de villes).
 *
 * Seeds testés (broad match, database fr) :
 *   - love room
 *   - loveroom          (graphie collée fréquente)
 *   - chambre jacuzzi    (cluster adjacent — la love room EST souvent une "chambre avec jacuzzi privatif")
 *
 * Usage :
 *   node scripts/semrush-loveroom.mjs                 # scan + analyse villes
 *   node scripts/semrush-loveroom.mjs --raw           # dump CSV brut de tous les KW
 *
 * Sorties :
 *   /tmp/loveroom-keywords.json   (tous les KW dédupliqués : phrase, vol, kd, cpc, seed)
 *   /tmp/loveroom-keywords.csv    (idem en CSV)
 *   /tmp/loveroom-cities.json     (agrégation par ville candidate)
 *
 * Coût : fullsearch = 20 unités/ligne. 3 seeds × 1000 lignes max = 60k unités ≈ $3. OK sur 2M/mois.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

function getApiKey() {
  if (process.env.SEMRUSH_API_KEY) return process.env.SEMRUSH_API_KEY.trim();
  const envPath = '/Users/marc/Desktop/Neocamino/.env';
  if (existsSync(envPath)) {
    const env = readFileSync(envPath, 'utf-8');
    const match = env.match(/SEMRUSH_API_KEY=(.+)/);
    if (match) return match[1].trim();
  }
  console.error('❌ SEMRUSH_API_KEY introuvable (env var ou /Users/marc/Desktop/Neocamino/.env)');
  process.exit(1);
}

const KEY = getApiKey();
const RAW = process.argv.includes('--raw');
const LIMIT = 1000;

const SEEDS = ['love room', 'loveroom', 'chambre jacuzzi'];

// ─── Fetch broad-match keywords for one seed ───────────────────────
async function fullsearch(seed) {
  const url =
    `https://api.semrush.com/?type=phrase_fullsearch&key=${KEY}` +
    `&phrase=${encodeURIComponent(seed)}&database=fr` +
    `&export_columns=Ph,Nq,Kd,Cp,Co,Nr&display_limit=${LIMIT}&display_sort=nq_desc`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const text = await res.text();
  if (text.startsWith('ERROR')) {
    if (text.includes('NOTHING FOUND') || text.includes('::50')) return [];
    if (text.includes('UNITS BALANCE IS ZERO') || text.includes('::132')) {
      console.error(`\n❌ ${text.trim()}\n→ Pack 2M units épuisé. Reset le 2 du mois.\n`);
      process.exit(1);
    }
    console.error(`⚠️ ${seed}: ${text.trim().slice(0, 80)}`);
    return [];
  }
  const lines = text.trim().split('\n');
  lines.shift(); // header
  return lines.map((l) => {
    const [ph, nq, kd, cp, co, nr] = l.split(';');
    return {
      phrase: ph,
      vol: parseInt(nq) || 0,
      kd: parseFloat(kd) || 0,
      cpc: parseFloat(cp) || 0,
      comp: parseFloat(co) || 0,
      results: parseInt(nr) || 0,
      seed,
    };
  });
}

// ─── City extraction heuristic ─────────────────────────────────────
// On retire les tokens "modificateurs" du KW ; le reste = localisation candidate.
const STOP = new Set([
  'love', 'room', 'loveroom', 'rooms', 'chambre', 'chambres',
  'avec', 'sans', 'et', 'ou', 'de', 'du', 'des', 'le', 'la', 'les', 'l', 'd',
  'a', 'à', 'au', 'aux', 'en', 'pour', 'un', 'une', 'dans', 'sur', 'près', 'pres', 'proche', 'autour',
  'jacuzzi', 'jacuzzis', 'spa', 'privatif', 'privative', 'privatifs', 'prive', 'privé', 'privée', 'privées',
  'baignoire', 'balneo', 'balnéo', 'balneotherapie', 'piscine', 'sauna', 'hammam', 'bain',
  'nuit', 'nuits', 'romantique', 'romantiques', 'insolite', 'insolites', 'sejour', 'séjour', 'week', 'end', 'weekend',
  'hotel', 'hôtel', 'hotels', 'motel', 'suite', 'suites', 'gite', 'gîte', 'appartement', 'studio', 'loft',
  'prix', 'pas', 'cher', 'chere', 'chère', 'tarif', 'reservation', 'réservation', 'booking', 'airbnb',
  'couple', 'amoureux', 'amoureux', 'duo', 'deux', 'coquin', 'coquine', 'sexy', 'glamour', 'luxe', 'luxueuse',
  'centre', 'ville', 'sud', 'nord', 'est', 'ouest', 'region', 'région',
]);

function normalize(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCity(phrase) {
  const norm = normalize(phrase);
  const tokens = norm.split(' ').filter(Boolean);
  const kept = tokens.filter((t) => !STOP.has(t) && t.length > 1 && !/^\d+$/.test(t));
  if (!kept.length) return null; // KW générique national (pas de ville)
  return kept.join(' ');
}

// ─── Main ──────────────────────────────────────────────────────────
console.error(`🔍 SEMrush fullsearch sur ${SEEDS.length} seeds (limit ${LIMIT}/seed)…`);

const all = [];
for (const seed of SEEDS) {
  const rows = await fullsearch(seed);
  console.error(`   ${seed}: ${rows.length} KW`);
  all.push(...rows);
}

// Dedupe par phrase (garder le vol max si doublon entre seeds)
const byPhrase = new Map();
for (const r of all) {
  const prev = byPhrase.get(r.phrase);
  if (!prev || r.vol > prev.vol) byPhrase.set(r.phrase, r);
}
const keywords = [...byPhrase.values()].sort((a, b) => b.vol - a.vol);

writeFileSync('/tmp/loveroom-keywords.json', JSON.stringify(keywords, null, 2));
writeFileSync(
  '/tmp/loveroom-keywords.csv',
  ['phrase;volume;kd;cpc;comp;seed', ...keywords.map((k) => `${k.phrase};${k.vol};${k.kd};${k.cpc};${k.comp};${k.seed}`)].join('\n')
);

console.error(`\n✓ ${keywords.length} KW uniques. Volume cumulé total : ${keywords.reduce((s, k) => s + k.vol, 0)}/mois`);

if (RAW) {
  console.log('volume | kd  | cpc  | phrase');
  console.log('-------|-----|------|' + '-'.repeat(45));
  for (const k of keywords.slice(0, 120)) {
    console.log(`${String(k.vol).padStart(6)} | ${String(k.kd).padStart(3)} | ${String(k.cpc.toFixed(2)).padStart(4)} | ${k.phrase}`);
  }
  process.exit(0);
}

// ─── Agrégation par ville candidate ────────────────────────────────
const cities = new Map();
let nationalVol = 0;
for (const k of keywords) {
  const city = extractCity(k.phrase);
  if (!city) {
    nationalVol += k.vol;
    continue;
  }
  if (!cities.has(city)) cities.set(city, { city, vol: 0, kwCount: 0, kds: [], topKw: [] });
  const c = cities.get(city);
  c.vol += k.vol;
  c.kwCount++;
  if (k.kd > 0) c.kds.push(k.kd);
  c.topKw.push({ phrase: k.phrase, vol: k.vol, kd: k.kd });
}

const cityList = [...cities.values()]
  .map((c) => ({
    city: c.city,
    vol: c.vol,
    kwCount: c.kwCount,
    avgKd: c.kds.length ? Math.round((c.kds.reduce((s, d) => s + d, 0) / c.kds.length) * 10) / 10 : null,
    minKd: c.kds.length ? Math.min(...c.kds) : null,
    topKw: c.topKw.sort((a, b) => b.vol - a.vol).slice(0, 4),
  }))
  .sort((a, b) => b.vol - a.vol);

writeFileSync('/tmp/loveroom-cities.json', JSON.stringify(cityList, null, 2));

const over100 = cityList.filter((c) => c.vol >= 100);
console.log(`\n📊 Volume "national" (KW sans ville) : ${nationalVol}/mois`);
console.log(`📍 ${cityList.length} localisations candidates détectées, dont ${over100.length} ≥ 100/mois\n`);
console.log('vol/mois | KD moy | KD min | #KW | localisation (candidate)');
console.log('---------|--------|--------|-----|' + '-'.repeat(30));
for (const c of cityList.filter((c) => c.vol >= 50)) {
  console.log(
    `${String(c.vol).padStart(8)} | ${String(c.avgKd ?? '-').padStart(6)} | ${String(c.minKd ?? '-').padStart(6)} | ${String(c.kwCount).padStart(3)} | ${c.city}`
  );
}
console.log(`\n→ JSON détaillé : /tmp/loveroom-cities.json  |  KW bruts : /tmp/loveroom-keywords.csv`);
