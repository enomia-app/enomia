#!/usr/bin/env node
/**
 * Récupère les volumes SEMrush pour les piliers blog déjà en ligne.
 * Lit le pillarKeyword du frontmatter de chaque .mdoc avec status: en-ligne,
 * puis interroge SEMrush phrase_this pour obtenir vol + KD + CPC.
 *
 * Output : scripts/blog-volumes-en-ligne.json
 * Usage : node scripts/semrush-blog-piliers.mjs
 * Coût : ~7 unités (1 par pilier en ligne)
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

function readFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = m[1];
  const get = (key) => {
    const r = new RegExp(`^${key}:\\s*['"]?(.+?)['"]?\\s*$`, 'm');
    const mm = fm.match(r);
    return mm ? mm[1].trim().replace(/^['"]|['"]$/g, '') : null;
  };
  return {
    title: get('title'),
    status: get('status'),
    pillarKeyword: get('pillarKeyword'),
    articleType: get('articleType'),
  };
}

async function semrushPhraseThis(phrase) {
  const url = `https://api.semrush.com/?type=phrase_this&key=${KEY}&phrase=${encodeURIComponent(phrase)}&database=fr&export_columns=Ph,Nq,Kd,Cp`;
  const res = await fetch(url);
  const text = await res.text();
  if (text.includes('ERROR')) {
    return { phrase, error: text.trim() };
  }
  // Format CSV : "Ph;Nq;Kd;Cp\nvaleur;valeur;valeur;valeur"
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { phrase, vol: 0, kd: 0, cpc: 0 };
  const [_ph, nq, kd, cp] = lines[1].split(';');
  return { phrase, vol: parseInt(nq, 10) || 0, kd: parseInt(kd, 10) || 0, cpc: parseFloat(cp) || 0 };
}

async function main() {
  console.log('🔍 Recherche piliers blog en ligne...');
  const blogDir = path.join(ROOT, 'src/content/blog');
  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdoc'));

  const piliers = [];
  for (const f of files) {
    const slug = path.basename(f, '.mdoc');
    const fm = readFrontmatter(path.join(blogDir, f));
    if (fm.status === 'en-ligne' && fm.pillarKeyword) {
      piliers.push({ slug, pillarKeyword: fm.pillarKeyword, title: fm.title });
    } else if (fm.status === 'en-ligne') {
      // Fallback : utilise slug comme KW si pas de pillarKeyword
      const fallbackKw = slug.replace(/-/g, ' ');
      piliers.push({ slug, pillarKeyword: fallbackKw, title: fm.title, fallback: true });
    }
  }

  console.log(`📋 ${piliers.length} piliers en ligne à analyser`);
  piliers.forEach(p => console.log(`   - ${p.slug} → "${p.pillarKeyword}"${p.fallback ? ' (fallback slug)' : ''}`));
  console.log('');

  console.log('🌐 Requêtes SEMrush phrase_this...');
  const results = {};
  for (const p of piliers) {
    const r = await semrushPhraseThis(p.pillarKeyword);
    results[p.slug] = { ...r, title: p.title, pillarKeyword: p.pillarKeyword, fallback: p.fallback || false };
    const log = r.error ? `❌ ${r.error}` : `vol=${r.vol}, kd=${r.kd}, cpc=${r.cpc}€`;
    console.log(`   ${p.slug.padEnd(45)} ${log}`);
    await new Promise(r => setTimeout(r, 200)); // 200ms throttle
  }

  const outPath = path.join(ROOT, 'scripts/blog-volumes-en-ligne.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Sauvegardé : ${path.relative(ROOT, outPath)}`);
  console.log(`   ${piliers.length} unités SEMrush consommées`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
