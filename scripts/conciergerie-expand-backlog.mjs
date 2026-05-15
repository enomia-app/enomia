#!/usr/bin/env node
/**
 * Étend city-backlog.json avec de nouvelles villes éligibles via SEMrush.
 *
 * Pour chaque ville candidate (FR / BE / CH / DOM-TOM), interroge SEMrush
 * sur plusieurs KW LCD (conciergerie, gestion locative courte durée, gestion airbnb)
 * et garde celles avec vol >= 50 sur AU MOINS un KW.
 *
 * Parallélisé : 5 requêtes simultanées pour vitesse.
 *
 * Output : `scripts/conciergerie-backlog-candidates.json`
 * Pas de merge automatique — Marc valide d'abord.
 *
 * Usage :
 *   node scripts/conciergerie-expand-backlog.mjs
 *   node scripts/conciergerie-expand-backlog.mjs --threshold=30
 *   node scripts/conciergerie-expand-backlog.mjs --country=fr,be,ch,domtom
 *   node scripts/conciergerie-expand-backlog.mjs --concurrency=10
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
try { process.loadEnvFile(path.join(ROOT, '.env')); } catch {}

// ─── Args ───────────────────────────────────────────────
const args = process.argv.slice(2);
const THRESHOLD = parseInt(args.find(a => a.startsWith('--threshold='))?.replace('--threshold=', '') || '50', 10);
const COUNTRIES = (args.find(a => a.startsWith('--country='))?.replace('--country=', '') || 'fr,be,ch,domtom').split(',');
const CONCURRENCY = parseInt(args.find(a => a.startsWith('--concurrency='))?.replace('--concurrency=', '') || '5', 10);

// ─── SEMrush API key ────────────────────────────────────
function getApiKey() {
  if (process.env.SEMRUSH_API_KEY) return process.env.SEMRUSH_API_KEY.trim();
  const fallback = '/Users/marc/Desktop/Neocamino/.env';
  if (existsSync(fallback)) {
    const env = readFileSync(fallback, 'utf8');
    const m = env.match(/SEMRUSH_API_KEY=(.+)/);
    if (m) return m[1].trim();
  }
  throw new Error('SEMRUSH_API_KEY introuvable (.env ou env var)');
}
const SEMRUSH_KEY = getApiKey();

// ─── Listes BE / CH / DOM-TOM ───────────────────────────
const BE_CITIES = [
  'Bruxelles', 'Liège', 'Charleroi', 'Namur', 'Mons', 'Tournai', 'Wavre', 'Verviers',
  'La Louvière', 'Mouscron', 'Arlon', 'Spa', 'Durbuy', 'Bouillon', 'Bastogne',
  'Dinant', 'Marche-en-Famenne', 'Andenne', 'Nivelles', 'Ottignies', 'Louvain-la-Neuve',
  'Huy', 'Seraing', 'Eupen', 'Malmedy', 'Stavelot', 'Houffalize', 'Rochefort',
  'Hotton', 'Rixensart', 'Braine-l\'Alleud', 'Genval', 'Waterloo'
];

const CH_CITIES = [
  'Genève', 'Lausanne', 'Montreux', 'Vevey', 'Neuchâtel', 'Fribourg', 'Sion',
  'Yverdon-les-Bains', 'Bulle', 'Martigny', 'Morges', 'Nyon', 'Renens', 'Pully',
  'Verbier', 'Crans-Montana', 'Zermatt', 'Gstaad', 'Saas-Fee', 'Les Diablerets',
  'Champéry', 'Villars-sur-Ollon', 'Leysin', 'Château-d\'Œx', 'La Chaux-de-Fonds',
  'Aigle', 'Monthey', 'Rolle', 'Coppet'
];

const DOM_TOM_CITIES = [
  // La Réunion
  'Saint-Denis Réunion', 'Saint-Pierre Réunion', 'Saint-Paul Réunion', 'Le Tampon',
  'Saint-Louis Réunion', 'Saint-André Réunion', 'Saint-Benoît Réunion', 'Saint-Joseph Réunion',
  'Sainte-Marie Réunion', 'Saint-Gilles-les-Bains', 'L\'Étang-Salé',
  'Cilaos', 'Salazie', 'Hell-Bourg',
  // Polynésie française
  'Papeete', 'Faa\'a', 'Punaauia', 'Pirae', 'Mahina', 'Arue', 'Paea', 'Papara',
  'Moorea', 'Bora Bora', 'Huahine', 'Raiatea',
  // Guadeloupe
  'Pointe-à-Pitre', 'Le Gosier', 'Saint-François Guadeloupe', 'Sainte-Anne Guadeloupe',
  'Basse-Terre', 'Saint-Claude Guadeloupe', 'Deshaies', 'Bouillante',
  // Martinique
  'Fort-de-France', 'Les Trois-Îlets', 'Sainte-Anne Martinique', 'Sainte-Luce',
  'Le Marin', 'Le Diamant', 'Le François Martinique', 'Le Vauclin',
  // Guyane
  'Cayenne', 'Kourou', 'Saint-Laurent-du-Maroni',
  // Mayotte
  'Mamoudzou', 'Dzaoudzi',
  // Nouvelle-Calédonie
  'Nouméa', 'Dumbéa', 'Le Mont-Dore'
];

// KW à tester par ville (pour BE/CH où "conciergerie" est moins répandu)
const LCD_KW_PATTERNS_RICH = [
  'conciergerie {ville}',
  'gestion locative courte durée {ville}',
  'gestion airbnb {ville}',
];
const LCD_KW_PATTERNS_BASIC = [
  'conciergerie {ville}',
];

// ─── Charger villes FR via INSEE > 5k habitants ─────────
async function loadFrenchCities() {
  console.log('🔗 Fetch INSEE communes > 5k habitants...');
  const res = await fetch('https://geo.api.gouv.fr/communes?fields=nom,population&pop=5000:');
  const data = await res.json();
  console.log(`  → ${data.length} communes récupérées`);
  return data.map(c => c.nom).filter(Boolean);
}

// ─── Charger backlog existant pour dédoublonner ────────
function loadExistingBacklog() {
  const p = path.join(ROOT, 'scripts/city-backlog.json');
  if (!existsSync(p)) return new Set();
  const data = JSON.parse(readFileSync(p, 'utf8'));
  return new Set(data.map(e => normalize(e.ville)));
}

function loadCitiesTs() {
  const p = path.join(ROOT, 'src/data/cities.ts');
  if (!existsSync(p)) return new Set();
  const content = readFileSync(p, 'utf8');
  const set = new Set();
  for (const m of content.matchAll(/slug: '([^']+)'/g)) set.add(m[1]);
  return set;
}

function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z]+/g, '-');
}

// ─── SEMrush phrase_this ────────────────────────────────
async function semrushVol(phrase, db = 'fr') {
  const url = `https://api.semrush.com/?type=phrase_this&key=${SEMRUSH_KEY}&phrase=${encodeURIComponent(phrase)}&database=${db}&export_columns=Ph,Nq,Kd,Cp`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    if (text.includes('NOTHING FOUND')) return { vol: 0, kd: null };
    if (text.includes('ERROR')) return { vol: null, kd: null, err: text.trim() };
    const lines = text.trim().split('\n');
    if (lines.length < 2) return { vol: 0, kd: null };
    const cols = lines[1].split(';');
    return { vol: parseInt(cols[1], 10) || 0, kd: parseFloat(cols[2]) || null };
  } catch (e) {
    return { vol: null, kd: null, err: e.message };
  }
}

// ─── Concurrent map (parallélisation contrôlée) ─────────
async function pMap(items, fn, concurrency) {
  const results = [];
  const queue = items.slice();
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      const result = await fn(item);
      if (result != null) results.push(result);  // exclut null ET undefined
    }
  });
  await Promise.all(workers);
  return results;
}

// ─── Tester une ville avec plusieurs KW ─────────────────
async function probeVille(ville, db, patterns, country, region) {
  const results = [];
  for (const pattern of patterns) {
    const kw = pattern.replace('{ville}', ville);
    const { vol, kd } = await semrushVol(kw, db);
    if (vol >= THRESHOLD) {
      results.push({ ville, country, region, kw, vol, kd });
    }
  }
  // Garde le meilleur KW (vol max)
  if (results.length === 0) return null;
  return results.sort((a, b) => b.vol - a.vol)[0];
}

// ─── Main ───────────────────────────────────────────────
async function main() {
  console.log(`🔍 Expansion conciergerie backlog (threshold ${THRESHOLD}, concurrency ${CONCURRENCY}, countries: ${COUNTRIES.join(',')})\n`);

  const inBacklog = loadExistingBacklog();
  const inCities = loadCitiesTs();
  console.log(`Déjà connues : ${inBacklog.size} backlog + ${inCities.size} cities.ts\n`);

  const candidates = [];
  let totalQueries = 0;
  const startTime = Date.now();

  // Helper pour batch un pays
  async function probeCountry(name, cities, db, patterns, country, region) {
    console.log(`\n${name} : ${cities.length} villes`);
    const toProbe = cities.filter(v => !inBacklog.has(normalize(v)) && !inCities.has(normalize(v)));
    console.log(`  → ${toProbe.length} à tester (après dedup)`);
    const found = await pMap(toProbe, async (ville) => {
      const result = await probeVille(ville, db, patterns, country, region);
      totalQueries += patterns.length;
      if (result) {
        console.log(`  ✅ ${result.ville.padEnd(30)} vol=${result.vol} kd=${result.kd ?? '?'} kw="${result.kw}"`);
      }
      return result;
    }, CONCURRENCY);
    candidates.push(...found);
  }

  if (COUNTRIES.includes('fr')) {
    const frVilles = await loadFrenchCities();
    await probeCountry('🇫🇷 France', frVilles, 'fr', LCD_KW_PATTERNS_BASIC, 'FR', '?');
  }
  if (COUNTRIES.includes('domtom')) {
    await probeCountry('🏝️ DOM-TOM', DOM_TOM_CITIES.map(v => v.replace(/ (Réunion|Guadeloupe|Martinique)$/i, '')), 'fr', LCD_KW_PATTERNS_BASIC, 'FR-DOMTOM', 'DOM-TOM');
  }
  if (COUNTRIES.includes('be')) {
    await probeCountry('🇧🇪 Belgique francophone', BE_CITIES, 'be', LCD_KW_PATTERNS_RICH, 'BE', 'Wallonie/Bruxelles');
  }
  if (COUNTRIES.includes('ch')) {
    await probeCountry('🇨🇭 Suisse romande', CH_CITIES, 'ch', LCD_KW_PATTERNS_RICH, 'CH', 'Romandie');
  }

  candidates.sort((a, b) => b.vol - a.vol);

  const outPath = path.join(ROOT, 'scripts/conciergerie-backlog-candidates.json');
  writeFileSync(outPath, JSON.stringify(candidates, null, 2));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n📊 Bilan : ${candidates.length} villes candidates (>= vol ${THRESHOLD})`);
  console.log(`  • Requêtes SEMrush : ${totalQueries}`);
  console.log(`  • Durée : ${elapsed}s`);
  console.log(`  • Output : ${outPath}`);
  console.log(`\nTop 15 :`);
  for (const c of candidates.slice(0, 15)) {
    console.log(`  ${c.country.padEnd(10)} ${c.ville.padEnd(25)} vol=${c.vol.toString().padEnd(5)} kw="${c.kw}"`);
  }
}

main().catch(e => {
  console.error('❌', e.message);
  process.exit(1);
});
