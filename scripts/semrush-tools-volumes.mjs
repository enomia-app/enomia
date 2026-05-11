#!/usr/bin/env node
/**
 * Mesure le volume SEMrush des pages outils, hubs et régions (sitemap).
 * KW déduit du slug de l'URL.
 *
 * Output : scripts/tools-volumes.json
 * Usage : node scripts/semrush-tools-volumes.mjs
 * Coût : ~25 unités SEMrush
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

// Convertit un path en KW (heuristique)
function pathToKw(p) {
  // Homepage = brand
  if (p === '' || p === '/') return 'enomia';
  // Slug simple → remplace tirets par espaces
  let slug = p.replace(/^\//, '').replace(/\/$/, '');
  // Pour pages région conciergerie : /conciergerie-airbnb/[r] → "conciergerie airbnb [r]"
  slug = slug.replace(/\//g, ' ');
  return slug.replace(/-/g, ' ');
}

async function semrushPhrase(phrase) {
  const url = `https://api.semrush.com/?type=phrase_this&key=${KEY}&phrase=${encodeURIComponent(phrase)}&database=fr&export_columns=Ph,Nq,Kd,Cp`;
  const res = await fetch(url);
  const text = await res.text();
  if (text.includes('ERROR 50')) return { vol: 0, kd: 0, cpc: 0, notFound: true };
  if (text.includes('ERROR')) return { error: text.trim() };
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { vol: 0, kd: 0, cpc: 0 };
  const [_p, nq, kd, cp] = lines[1].split(';');
  return { vol: parseInt(nq, 10) || 0, kd: parseInt(kd, 10) || 0, cpc: parseFloat(cp) || 0 };
}

function categorize(url) {
  const p = url.replace('https://www.enomia.app', '');
  if (p === '' || p === '/') return 'home';
  if (p === '/blog') return 'hub';
  if (p.startsWith('/blog/')) return 'blog';
  if (p === '/conciergerie-airbnb' || p === '/rentabilite-airbnb') return 'hub';
  if (p.startsWith('/rentabilite-airbnb/')) return 'rent';
  if (/^\/conciergerie-airbnb\/[^/]+\/[^/]+$/.test(p)) return 'conc';
  if (/^\/conciergerie-airbnb\/[^/]+$/.test(p)) return 'conc-region';
  return 'tool';
}

async function main() {
  console.log('🌐 Récupération sitemap...');
  const xml = await (await fetch('https://www.enomia.app/sitemap.xml')).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

  // Filtrer : que les pages outils/hubs/home/region (hors blog/rent/conc ville)
  const toolPages = urls.filter(u => {
    const cat = categorize(u);
    return ['home', 'hub', 'tool', 'conc-region'].includes(cat);
  });

  console.log(`📋 ${toolPages.length} pages outils/hubs/region à mesurer`);

  const results = {};
  for (let i = 0; i < toolPages.length; i++) {
    const url = toolPages[i];
    const p = url.replace('https://www.enomia.app', '');
    const kw = pathToKw(p);
    const r = await semrushPhrase(kw);
    results[url] = { kw, ...r };
    const tag = `[${i + 1}/${toolPages.length}]`;
    if (r.error) console.log(`${tag} ❌ ${kw} → ${r.error}`);
    else if (r.notFound) console.log(`${tag} 🟡 ${kw.padEnd(45)} NOT FOUND`);
    else console.log(`${tag} ✅ ${kw.padEnd(45)} vol=${r.vol}, kd=${r.kd}`);
    await new Promise(r => setTimeout(r, 200));
  }

  const outPath = path.join(ROOT, 'scripts/tools-volumes.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Sauvegardé : ${path.relative(ROOT, outPath)}`);
  const totalVol = Object.values(results).reduce((a, r) => a + (r.vol || 0), 0);
  console.log(`📊 Vol cumulé : ${totalVol}/mois`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
