#!/usr/bin/env node
/**
 * Mesure le volume SEMrush pour les KW conciergerie des villes publiées en prod
 * mais absentes de scripts/city-backlog.json.
 *
 * Output : scripts/city-backlog-extra.json (à fusionner manuellement ou via le script de génération)
 * Usage : node scripts/semrush-conciergerie-missing.mjs
 * Coût : ~10 unités SEMrush (1 par ville manquante)
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
  process.exit(1);
}
const KEY = getApiKey();

async function fetchSitemap() {
  const res = await fetch('https://www.enomia.app/sitemap.xml');
  return res.text();
}

async function semrushPhrase(phrase) {
  const url = `https://api.semrush.com/?type=phrase_this&key=${KEY}&phrase=${encodeURIComponent(phrase)}&database=fr&export_columns=Ph,Nq,Kd,Cp`;
  const res = await fetch(url);
  const text = await res.text();
  if (text.includes('ERROR')) return { error: text.trim() };
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { vol: 0, kd: 0, cpc: 0 };
  const [_p, nq, kd, cp] = lines[1].split(';');
  return { vol: parseInt(nq, 10) || 0, kd: parseInt(kd, 10) || 0, cpc: parseFloat(cp) || 0 };
}

async function main() {
  console.log('🌐 Récupération sitemap prod...');
  const sitemap = await fetchSitemap();

  // Extract conciergerie URLs : /conciergerie-airbnb/[region]/[ville]
  const urlsInSitemap = [...sitemap.matchAll(/conciergerie-airbnb\/([a-z0-9-]+)\/([a-z0-9-]+)/g)]
    .map(m => ({ region: m[1], slug: m[2] }))
    .filter((v, i, arr) => arr.findIndex(x => x.slug === v.slug) === i);

  console.log(`📋 ${urlsInSitemap.length} villes conciergerie publiées dans le sitemap`);

  // Charger city-backlog.json
  const backlog = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/city-backlog.json'), 'utf8'));
  const backlogSlugs = new Set(backlog.map(c => c.citySlug));

  // Villes en prod manquantes du backlog
  const missing = urlsInSitemap.filter(v => !backlogSlugs.has(v.slug));
  console.log(`🔍 ${missing.length} villes en prod manquantes du backlog :\n`);
  missing.forEach(v => console.log(`   - ${v.slug} (${v.region})`));
  console.log('');

  if (missing.length === 0) {
    console.log('✅ Tout aligné, rien à mesurer.');
    return;
  }

  // Mesurer chaque KW "conciergerie [ville]"
  console.log('🌐 Requêtes SEMrush pour ces villes...');
  const results = [];
  let nextNum = Math.max(...backlog.map(c => c.num)) + 1;

  for (const v of missing) {
    const villeDisplay = v.slug.replace(/-/g, ' ');
    const kw = `conciergerie ${villeDisplay}`;
    const data = await semrushPhrase(kw);
    if (data.error) {
      console.log(`   ${v.slug.padEnd(20)} ❌ ${data.error}`);
      continue;
    }
    const regionDisplay = v.region.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    results.push({
      num: nextNum++,
      ville: villeDisplay.replace(/\b\w/g, l => l.toUpperCase()),
      region: regionDisplay,
      regionSlug: v.region,
      citySlug: v.slug,
      newUrl: `/conciergerie-airbnb/${v.region}/${v.slug}`,
      kw: kw,
      vol: data.vol,
      kd: data.kd,
      status: 'Publié',
      addedFrom: 'sitemap-extra',
    });
    console.log(`   ${v.slug.padEnd(20)} vol=${data.vol}, kd=${data.kd}`);
    await new Promise(r => setTimeout(r, 200));
  }

  const outPath = path.join(ROOT, 'scripts/city-backlog-extra.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Sauvegardé : ${path.relative(ROOT, outPath)}`);
  console.log(`   ${results.length} villes ajoutables au backlog (vol cumulé : ${results.reduce((a, c) => a + c.vol, 0)})`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
