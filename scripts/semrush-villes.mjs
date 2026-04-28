#!/usr/bin/env node
/**
 * Recherche SEMrush des keywords « [pattern] airbnb [ville] » pour le cluster LCD France.
 *
 * Patterns testés (cluster validé via fichiers broad-match SEMrush 27/04/26) :
 *   - rentabilité airbnb [ville]   ← KW principal des spokes (vol caché 1-30/ville)
 *   - tarif airbnb [ville]
 *   - tarif conciergerie airbnb [ville]   ← top vol identifiés (Paris 70, Marseille 20...)
 *   - combien rapporte airbnb [ville]
 *   - estimation airbnb [ville]    ← vol 0 confirmé partout, gardé pour validation
 *   - investir airbnb [ville]
 *   - airbnb [ville] rentable
 *
 * Usage :
 *   node scripts/semrush-villes.mjs                            # 30 villes BDD enomia
 *   node scripts/semrush-villes.mjs --villes=paris,lyon,nice   # custom list
 *   node scripts/semrush-villes.mjs --csv > out.csv            # export CSV
 *   node scripts/semrush-villes.mjs --auto                     # mode cron : output dans /tmp/
 *
 * Coût : 30 villes × 7 templates = 210 unités API. Marge énorme sur 2M units/mois.
 *
 * Clé API : depuis SEMRUSH_API_KEY (env var) ou /Users/marc/Desktop/Neocamino/.env
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

// ─── Get API key (env var first, fallback to Neocamino .env) ───────
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
const CSV = process.argv.includes('--csv');
const AUTO = process.argv.includes('--auto');
const customVilles = process.argv.find((a) => a.startsWith('--villes='));

// ─── Templates de KW à tester ──────────────────────────────────────
const TEMPLATES = [
  (v) => `rentabilité airbnb ${v}`,
  (v) => `tarif airbnb ${v}`,
  (v) => `tarif conciergerie airbnb ${v}`,
  (v) => `combien rapporte airbnb ${v}`,
  (v) => `estimation airbnb ${v}`,
  (v) => `investir airbnb ${v}`,
  (v) => `airbnb ${v} rentable`,
];

// ─── Liste des villes ──────────────────────────────────────────────
async function loadVilles() {
  if (customVilles) return customVilles.replace('--villes=', '').split(',').map((v) => v.trim());
  // Lit la BDD enomia si dispo
  const bddPath = '/Users/marc/Desktop/eunomia/src/data/cities-rentabilite.ts';
  if (existsSync(bddPath)) {
    const content = readFileSync(bddPath, 'utf-8');
    const slugs = [...content.matchAll(/slug: '([^']+)'/g)].map((m) => m[1]);
    if (slugs.length) {
      // Convertir slugs en KW (paris, saint-jean-de-luz → "saint jean de luz")
      return slugs.map((s) => s.replace(/-/g, ' '));
    }
  }
  // Fallback : top 30 villes hard-coded
  return [
    'paris', 'lyon', 'marseille', 'bordeaux', 'toulouse', 'nice', 'nantes', 'strasbourg', 'montpellier', 'lille',
    'rennes', 'cannes', 'annecy', 'biarritz', 'la rochelle', 'saint-malo', 'honfleur', 'aix-en-provence', 'avignon', 'carcassonne',
    'colmar', 'sarlat', 'chamonix', 'megeve', 'deauville', 'saint-tropez', 'antibes', 'bayonne', 'saint-jean-de-luz', 'ajaccio',
  ];
}

// ─── Fetch SEMrush ─────────────────────────────────────────────────
async function fetchKW(phrase) {
  const url = `https://api.semrush.com/?type=phrase_this&key=${KEY}&phrase=${encodeURIComponent(phrase)}&database=fr&export_columns=Ph,Nq,Kd,Cp`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    if (text.startsWith('ERROR')) {
      if (text.includes('NOTHING FOUND') || text.includes('50')) return { vol: 0, kd: 0, cpc: 0 };
      if (text.includes('UNITS BALANCE IS ZERO') || text.includes('132')) {
        console.error(`\n❌ ${text.trim()}\n→ Le pack 2M units API est épuisé. Reset le 2 du mois.\n`);
        process.exit(1);
      }
      return { vol: 0, kd: 0, cpc: 0, err: text.trim().slice(0, 50) };
    }
    const lines = text.trim().split('\n');
    if (lines.length < 2) return { vol: 0, kd: 0, cpc: 0 };
    const [, vol, kd, cpc] = lines[1].split(';');
    return { vol: parseInt(vol) || 0, kd: parseFloat(kd) || 0, cpc: parseFloat(cpc) || 0 };
  } catch (e) {
    return { vol: 0, kd: 0, cpc: 0, err: e.message.slice(0, 30) };
  }
}

// ─── Main ──────────────────────────────────────────────────────────
const VILLES = await loadVilles();

const queue = [];
for (const ville of VILLES) for (const tpl of TEMPLATES) queue.push({ ville, phrase: tpl(ville), template: tpl('').trim() });

if (!CSV && !AUTO) console.error(`🔍 Lancement de ${queue.length} requêtes SEMrush (${VILLES.length} villes × ${TEMPLATES.length} templates)…\n`);

const start = Date.now();
const results = [];
let done = 0;
const workers = Array.from({ length: 8 }, async () => {
  while (queue.length) {
    const item = queue.shift();
    const r = await fetchKW(item.phrase);
    results.push({ ...item, ...r });
    done++;
    if (!CSV && !AUTO && done % 25 === 0) {
      process.stderr.write(`\r  ${done}/${results.length + queue.length} (${Math.round((done / (results.length + queue.length)) * 100)}%)…`);
    }
  }
});
await Promise.all(workers);

if (!CSV && !AUTO) console.error(`\n✓ Terminé en ${Math.round((Date.now() - start) / 1000)}s\n`);

// ─── Filter + sort ─────────────────────────────────────────────────
const errors = results.filter((r) => r.err);
const withVol = results.filter((r) => r.vol > 0).sort((a, b) => b.vol - a.vol);
const detected = results.filter((r) => r.kd > 0); // KW existe dans SEMrush, même vol 0 (KW indexé)

// ─── Output ────────────────────────────────────────────────────────
function toCsv() {
  const rows = ['phrase;ville;template;volume;kd;cpc'];
  for (const r of results.sort((a, b) => b.vol - a.vol || b.kd - a.kd)) {
    rows.push(`${r.phrase};${r.ville};${r.template};${r.vol};${r.kd};${r.cpc}`);
  }
  return rows.join('\n');
}

if (AUTO) {
  // Mode cron : write CSV to /tmp/ + summary to stdout
  const csvPath = `/tmp/semrush-villes-${new Date().toISOString().slice(0, 10)}.csv`;
  writeFileSync(csvPath, toCsv());
  console.log(`📊 SEMrush analysis ${new Date().toISOString()}`);
  console.log(`   Villes: ${VILLES.length}, Templates: ${TEMPLATES.length}, Total queries: ${results.length}`);
  console.log(`   With volume detected: ${withVol.length} (cumulative ${withVol.reduce((s, r) => s + r.vol, 0)} vol/month)`);
  console.log(`   In SEMrush base (KW indexed): ${detected.length}`);
  console.log(`   CSV exported: ${csvPath}`);
  if (errors.length) console.log(`   ⚠️ Errors: ${errors.length}`);
  process.exit(0);
}

if (CSV) {
  console.log(toCsv());
  process.exit(0);
}

if (errors.length) {
  console.error(`⚠️  ${errors.length} erreur(s) :`);
  for (const e of errors.slice(0, 5)) console.error(`   ${e.phrase} : ${e.err}`);
}

console.log(`📊 ${withVol.length} keyword(s) avec volume détecté (sur ${results.length} testés)\n`);
console.log('Volume | KD   | CPC  | Keyword');
console.log('-------|------|------|' + '-'.repeat(50));
for (const r of withVol.slice(0, 80)) {
  console.log(`${String(r.vol).padStart(6)} | ${String(r.kd).padStart(4)} | ${String(r.cpc.toFixed(2)).padStart(4)} | ${r.phrase}`);
}
if (withVol.length > 80) console.log(`\n… ${withVol.length - 80} autres (relancer avec --csv > out.csv pour tout récupérer)`);

console.log(`\n📈 Volume cumulé par template :`);
const byTpl = {};
for (const r of withVol) byTpl[r.template] = (byTpl[r.template] || 0) + r.vol;
for (const [t, v] of Object.entries(byTpl).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(6)} ${t} [ville]`);
}

console.log(`\n🔎 KW indexés dans SEMrush (KD > 0, même si vol = 0) : ${detected.length}`);
console.log(`   Ces KW existent dans la base SEMrush = signal qu'il y a au moins quelques recherches/mois.`);
console.log(`   Sub-threshold cumulé estimé : ${Math.round((detected.length - withVol.length) * 3)} à ${(detected.length - withVol.length) * 7} vol/mois.`);
