#!/usr/bin/env node
/**
 * Étend city-backlog.json avec de nouvelles villes éligibles via SEMrush.
 *
 * Pour chaque ville candidate (FR / BE / CH), interroge SEMrush sur
 * "conciergerie [ville]" et garde celles avec vol >= 50.
 *
 * Coût : ~150-200 unités SEMrush (1 par ville). Négligeable.
 *
 * Output : `scripts/conciergerie-backlog-candidates.json`
 * Pas de merge automatique — Marc valide d'abord.
 *
 * Usage :
 *   node scripts/conciergerie-expand-backlog.mjs
 *   node scripts/conciergerie-expand-backlog.mjs --threshold=30  # vol minimum
 *   node scripts/conciergerie-expand-backlog.mjs --country=fr,be,ch
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
const COUNTRIES = (args.find(a => a.startsWith('--country='))?.replace('--country=', '') || 'fr,be,ch').split(',');

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

// ─── Villes BE & CH (manuelle) ──────────────────────────
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
  'Aigle', 'Monthey', 'Rolle', 'Coppet', 'Évian-les-Bains' // Évian géographiquement FR mais visé par CH
];

// ─── Charger villes FR ──────────────────────────────────
function loadFrenchCities() {
  const fullPath = path.join(ROOT, 'scripts/cities-rentabilite-full.json');
  if (!existsSync(fullPath)) {
    console.warn(`⚠️  ${fullPath} introuvable`);
    return [];
  }
  const data = JSON.parse(readFileSync(fullPath, 'utf8'));
  return Object.values(data).map(c => c.nom || c.slug).filter(Boolean);
}

// ─── Charger backlog existant pour dédoublonner ────────
function loadExistingBacklog() {
  const p = path.join(ROOT, 'scripts/city-backlog.json');
  if (!existsSync(p)) return new Set();
  const data = JSON.parse(readFileSync(p, 'utf8'));
  return new Set(data.map(e => normalize(e.ville)));
}

function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z]+/g, '-');
}

// ─── SEMrush phrase_this ────────────────────────────────
async function semrushVol(phrase, db = 'fr') {
  const url = `https://api.semrush.com/?type=phrase_this&key=${SEMRUSH_KEY}&phrase=${encodeURIComponent(phrase)}&database=${db}&export_columns=Ph,Nq,Kd,Cp`;
  const res = await fetch(url);
  const text = await res.text();
  if (text.includes('NOTHING FOUND')) return { vol: 0, kd: null };
  if (text.includes('ERROR')) {
    console.error(`  ⚠️  SEMrush error pour "${phrase}" : ${text.trim()}`);
    return { vol: null, kd: null };
  }
  // Réponse format : "Ph;Nq;Kd;Cp\nconciergerie paris;500;25;0.5"
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { vol: 0, kd: null };
  const cols = lines[1].split(';');
  return { vol: parseInt(cols[1], 10) || 0, kd: parseFloat(cols[2]) || null };
}

// ─── Main ───────────────────────────────────────────────
async function main() {
  console.log(`🔍 Expansion conciergerie backlog (threshold ${THRESHOLD}, countries: ${COUNTRIES.join(',')})\n`);

  const existing = loadExistingBacklog();
  console.log(`Villes déjà dans backlog : ${existing.size}\n`);

  const candidates = [];
  let count = 0;
  let totalQueries = 0;

  // FR
  if (COUNTRIES.includes('fr')) {
    console.log('🇫🇷 France :');
    const frVilles = loadFrenchCities();
    console.log(`  ${frVilles.length} villes à tester`);
    for (const ville of frVilles) {
      if (existing.has(normalize(ville))) {
        continue; // skip déjà présent
      }
      const { vol, kd } = await semrushVol(`conciergerie ${ville}`, 'fr');
      totalQueries++;
      if (vol >= THRESHOLD) {
        candidates.push({ ville, country: 'FR', region: '?', vol, kd, kw: `conciergerie ${ville}` });
        console.log(`  ✅ ${ville.padEnd(30)} vol=${vol} kd=${kd}`);
      }
      // Petit délai pour éviter rate limit
      await new Promise(r => setTimeout(r, 50));
    }
  }

  // BE
  if (COUNTRIES.includes('be')) {
    console.log('\n🇧🇪 Belgique francophone :');
    for (const ville of BE_CITIES) {
      if (existing.has(normalize(ville))) continue;
      const { vol, kd } = await semrushVol(`conciergerie ${ville}`, 'be');
      totalQueries++;
      if (vol >= THRESHOLD) {
        candidates.push({ ville, country: 'BE', region: 'Wallonie/Bruxelles', vol, kd, kw: `conciergerie ${ville}` });
        console.log(`  ✅ ${ville.padEnd(30)} vol=${vol} kd=${kd}`);
      }
      await new Promise(r => setTimeout(r, 50));
    }
  }

  // CH
  if (COUNTRIES.includes('ch')) {
    console.log('\n🇨🇭 Suisse romande :');
    for (const ville of CH_CITIES) {
      if (existing.has(normalize(ville))) continue;
      const { vol, kd } = await semrushVol(`conciergerie ${ville}`, 'ch');
      totalQueries++;
      if (vol >= THRESHOLD) {
        candidates.push({ ville, country: 'CH', region: 'Romandie', vol, kd, kw: `conciergerie ${ville}` });
        console.log(`  ✅ ${ville.padEnd(30)} vol=${vol} kd=${kd}`);
      }
      await new Promise(r => setTimeout(r, 50));
    }
  }

  // Tri par volume desc
  candidates.sort((a, b) => b.vol - a.vol);

  // Output
  const outPath = path.join(ROOT, 'scripts/conciergerie-backlog-candidates.json');
  writeFileSync(outPath, JSON.stringify(candidates, null, 2));
  console.log(`\n📊 Bilan : ${candidates.length} nouvelles villes candidates (>= vol ${THRESHOLD})`);
  console.log(`  • SEMrush queries : ${totalQueries}`);
  console.log(`  • Output : ${outPath}`);
  console.log(`\nTop 10 :`);
  for (const c of candidates.slice(0, 10)) {
    console.log(`  ${c.country}  ${c.ville.padEnd(25)} vol=${c.vol}`);
  }
  console.log(`\nÀ examiner et merger dans city-backlog.json manuellement (ou via script de merge).`);
}

main().catch(e => {
  console.error('❌', e.message);
  process.exit(1);
});
