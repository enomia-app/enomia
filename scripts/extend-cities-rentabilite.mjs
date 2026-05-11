#!/usr/bin/env node
/**
 * Étend la BDD villes rentabilité au-delà des 30 actuelles.
 *
 * 1. Récupère ~1900 communes France > 5000 habitants via API geo.api.gouv.fr
 * 2. Teste chaque commune × 7 templates SEMrush
 * 3. Si SEMrush retourne au moins 1 résultat (vol >= 0) → ville incluse
 * 4. Si NOTHING FOUND partout (erreur 50) → ville exclue
 * 5. Vol estimé à 10/mois si tous les templates renvoient 0
 *
 * Output : scripts/cities-rentabilite-full.json
 * Usage : node scripts/extend-cities-rentabilite.mjs [--limit=N] [--start=N]
 *
 * Coût : ~13 300 unités (1900 villes × 7 templates) — 0.5% du quota mensuel
 * Durée estimée : ~30 min (avec 200ms throttle entre requêtes)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function getApiKey() {
  if (process.env.SEMRUSH_API_KEY) return process.env.SEMRUSH_API_KEY.trim();
  const envPath = '/Users/marc/Desktop/Neocamino/.env';
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf-8');
    const m = env.match(/SEMRUSH_API_KEY=(.+)/);
    if (m) return m[1].trim();
  }
  console.error('❌ SEMRUSH_API_KEY introuvable');
  process.exit(1);
}

const KEY = getApiKey();
const LIMIT_ARG = process.argv.find(a => a.startsWith('--limit='));
const START_ARG = process.argv.find(a => a.startsWith('--start='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.replace('--limit=', ''), 10) : Infinity;
const START = START_ARG ? parseInt(START_ARG.replace('--start=', ''), 10) : 0;

const TEMPLATES = [
  v => `rentabilité airbnb ${v}`,
  v => `tarif airbnb ${v}`,
  v => `tarif conciergerie airbnb ${v}`,
  v => `combien rapporte airbnb ${v}`,
  v => `estimation airbnb ${v}`,
  v => `investir airbnb ${v}`,
  v => `airbnb ${v} rentable`,
];

const VOL_ESTIMATE_IF_ZERO = 10; // décision 2026-05-11

async function fetchCommunes() {
  console.log('🌐 Récupération communes France > 5000 hab via geo.api.gouv.fr...');
  const res = await fetch('https://geo.api.gouv.fr/communes?fields=nom,population,code,codeRegion&format=json&geometry=centre');
  const data = await res.json();
  return data
    .filter(c => c.population && c.population > 5000)
    .sort((a, b) => b.population - a.population)
    .map(c => ({ nom: c.nom, slug: slugify(c.nom), population: c.population, code: c.code }));
}

function slugify(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function semrushPhrase(phrase) {
  const url = `https://api.semrush.com/?type=phrase_this&key=${KEY}&phrase=${encodeURIComponent(phrase)}&database=fr&export_columns=Ph,Nq,Kd`;
  const res = await fetch(url);
  const text = await res.text();
  if (text.includes('ERROR 132')) throw new Error('API units balance is zero');
  if (text.includes('ERROR 50')) return { notFound: true };
  if (text.includes('ERROR')) return { error: text.trim() };
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { vol: 0, kd: 0 };
  const [_p, nq, kd] = lines[1].split(';');
  return { vol: parseInt(nq, 10) || 0, kd: parseInt(kd, 10) || 0 };
}

async function testVille(ville) {
  const lower = ville.nom.toLowerCase();
  const results = [];
  let anyFound = false;

  for (let i = 0; i < TEMPLATES.length; i++) {
    const phrase = TEMPLATES[i](lower);
    const r = await semrushPhrase(phrase);
    if (!r.notFound && !r.error) {
      results.push({ template: i, phrase, vol: r.vol, kd: r.kd });
      anyFound = true;
    }
    await new Promise(r => setTimeout(r, 150));
  }

  if (!anyFound) return null;

  const volTotal = results.reduce((a, r) => a + r.vol, 0);
  return {
    ...ville,
    templates: results,
    volTotal,
    volEstimated: volTotal === 0 ? VOL_ESTIMATE_IF_ZERO : volTotal,
    isEstimated: volTotal === 0,
  };
}

async function main() {
  const outPath = path.join(ROOT, 'scripts/cities-rentabilite-full.json');
  let existing = {};
  if (fs.existsSync(outPath)) {
    existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    console.log(`📂 Chargement état existant : ${Object.keys(existing).length} villes déjà testées`);
  }

  const communes = await fetchCommunes();
  console.log(`📋 ${communes.length} communes France > 5k hab récupérées`);

  const toTest = communes.slice(START, START + LIMIT).filter(c => !existing[c.slug]);
  console.log(`🔍 ${toTest.length} villes à tester (${START}+${LIMIT}, skip already done)\n`);

  let saved = 0;
  for (let i = 0; i < toTest.length; i++) {
    const ville = toTest[i];
    const tag = `[${i + 1}/${toTest.length}]`;
    try {
      const result = await testVille(ville);
      if (result) {
        existing[ville.slug] = result;
        const tag2 = result.isEstimated ? '🟡' : '🟢';
        console.log(`${tag} ${tag2} ${ville.nom.padEnd(30)} pop=${ville.population} vol=${result.volTotal}${result.isEstimated ? ' (estimé 10)' : ''}`);
      } else {
        existing[ville.slug] = { ...ville, excluded: true };
        console.log(`${tag} ⚫ ${ville.nom.padEnd(30)} pop=${ville.population} EXCLUE (nothing found)`);
      }
      saved++;
      // Save every 20 villes
      if (saved % 20 === 0) {
        fs.writeFileSync(outPath, JSON.stringify(existing, null, 2));
        console.log(`   💾 Sauvegarde intermédiaire (${Object.keys(existing).length} villes)`);
      }
    } catch (e) {
      if (e.message.includes('units balance')) {
        console.error(`❌ Quota SEMrush épuisé après ${saved} villes. Reprendre le 2 du mois prochain.`);
        break;
      }
      console.error(`${tag} ❌ ${ville.nom} → ${e.message}`);
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(existing, null, 2));
  const included = Object.values(existing).filter(v => !v.excluded);
  const excluded = Object.values(existing).filter(v => v.excluded);
  console.log(`\n✅ Sauvegardé : ${path.relative(ROOT, outPath)}`);
  console.log(`   ${included.length} villes incluses · ${excluded.length} exclues`);
  console.log(`   Vol cumulé estimé : ${included.reduce((a, v) => a + (v.volEstimated || 0), 0)}/mois`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
