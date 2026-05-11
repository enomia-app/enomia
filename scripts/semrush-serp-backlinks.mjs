#!/usr/bin/env node
/**
 * Analyse SERP top 3 + backlinks pour chaque KW prioritaire.
 * Pour chaque KW : phrase_this (KD + vol) + phrase_organic (top 10) + backlinks_overview (top 3).
 *
 * Sources de KW :
 *   - blog : src/content/blog/*.mdoc + blog-backlog/*.mdoc (pillarKeyword)
 *   - villes rentabilité : 7 templates × villes status=en-ligne uniquement
 *   - villes conciergeries : scripts/city-backlog.json (status=Publié uniquement)
 *
 * Output : scripts/semrush-serp-analysis.json
 * Usage : node scripts/semrush-serp-backlinks.mjs
 *         node scripts/semrush-serp-backlinks.mjs --only=blog|rent|conc
 * Coût : ~5 unités par KW × ~50 KW prioritaires (en ligne) = ~250 unités
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
const ONLY = process.argv.find(a => a.startsWith('--only='))?.replace('--only=', '');

async function semrushApi(type, params) {
  const qs = Object.entries({ type, key: KEY, ...params })
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const url = `https://api.semrush.com/?${qs}`;
  const res = await fetch(url);
  return res.text();
}

async function getKwData(phrase) {
  const t = await semrushApi('phrase_this', { phrase, database: 'fr', export_columns: 'Ph,Nq,Kd,Cp' });
  if (t.includes('ERROR')) return { error: t.trim() };
  const lines = t.trim().split('\n');
  if (lines.length < 2) return { vol: 0, kd: 0, cpc: 0 };
  const [_p, nq, kd, cp] = lines[1].split(';');
  return { vol: parseInt(nq, 10) || 0, kd: parseInt(kd, 10) || 0, cpc: parseFloat(cp) || 0 };
}

async function getSerp(phrase) {
  const t = await semrushApi('phrase_organic', { phrase, database: 'fr', export_columns: 'Dn,Ur,Po', display_limit: 10 });
  if (t.includes('ERROR')) return [];
  const lines = t.trim().split('\n').slice(1);
  return lines.map(l => {
    const [dn, ur, po] = l.split(';');
    return { domain: dn, url: ur, position: parseInt(po, 10) };
  }).filter(r => r.url);
}

async function getBacklinksCount(url) {
  // Tente backlinks_overview ; si pas d'accès au pack Backlinks, fallback graceful
  const t = await semrushApi('backlinks_overview', { target: url, target_type: 'url', export_columns: 'total' });
  if (t.includes('ERROR')) return null;
  const lines = t.trim().split('\n');
  if (lines.length < 2) return null;
  return parseInt(lines[1], 10) || 0;
}

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
  return { status: get('status'), pillarKeyword: get('pillarKeyword') };
}

// ─── Build list of priority KW ───────────────────────────────────────
function buildPriorityKws() {
  const kws = [];

  // Blog : tous les articles en-ligne et brouillon (pas backlog pour MVP)
  if (!ONLY || ONLY === 'blog') {
    const blogDir = path.join(ROOT, 'src/content/blog');
    for (const f of fs.readdirSync(blogDir).filter(f => f.endsWith('.mdoc'))) {
      const slug = path.basename(f, '.mdoc');
      const fm = readFrontmatter(path.join(blogDir, f));
      if (fm.pillarKeyword) {
        kws.push({ source: 'blog', slug, phrase: fm.pillarKeyword });
      }
    }
  }

  // Rentabilité villes : 7 templates × villes en ligne uniquement
  if (!ONLY || ONLY === 'rent') {
    const rentContent = fs.readFileSync(path.join(ROOT, 'src/data/cities-rentabilite.ts'), 'utf8');
    const templates = [
      v => `rentabilité airbnb ${v}`,
      v => `tarif airbnb ${v}`,
      v => `tarif conciergerie airbnb ${v}`,
      v => `combien rapporte airbnb ${v}`,
      v => `estimation airbnb ${v}`,
      v => `investir airbnb ${v}`,
      v => `airbnb ${v} rentable`,
    ];
    const cityRegex = /\{\s*slug:\s*'([^']+)',[\s\S]*?(?=^\s{2}\},)/gm;
    for (const block of rentContent.matchAll(cityRegex)) {
      const text = block[0];
      const statusMatch = text.match(/^\s+status:\s*'([^']+)'/m);
      const nameMatch = text.match(/^\s+name:\s*'([^']+)'/m);
      if (statusMatch && statusMatch[1] === 'en-ligne' && nameMatch) {
        const name = nameMatch[1].toLowerCase();
        templates.forEach((t, i) => {
          kws.push({ source: 'rent', slug: block[1], template: i, phrase: t(name) });
        });
      }
    }
  }

  // Conciergeries : villes publiées uniquement
  if (!ONLY || ONLY === 'conc') {
    const concData = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/city-backlog.json'), 'utf8'));
    for (const c of concData.filter(c => c.status === 'Publié')) {
      kws.push({ source: 'conc', slug: c.citySlug, phrase: c.kw });
    }
  }

  return kws;
}

async function main() {
  const kws = buildPriorityKws();
  console.log(`📋 ${kws.length} KW à analyser`);
  console.log(`💰 Coût estimé : ${kws.length * 5} unités SEMrush\n`);

  const results = [];
  let backlinksOk = true;
  let i = 0;

  for (const k of kws) {
    i++;
    const tag = `[${i}/${kws.length}]`;
    const kwData = await getKwData(k.phrase);
    if (kwData.error) {
      console.log(`${tag} ❌ ${k.phrase} → ${kwData.error}`);
      results.push({ ...k, ...kwData });
      continue;
    }

    const serp = await getSerp(k.phrase);
    const top3 = serp.slice(0, 3);

    let backlinksTop3 = [];
    if (backlinksOk) {
      for (const url of top3.map(s => s.url)) {
        const bl = await getBacklinksCount(url);
        if (bl === null) { backlinksOk = false; break; }
        backlinksTop3.push(bl);
      }
    }

    const backlinksNeeded = backlinksTop3.length
      ? Math.round(backlinksTop3.reduce((a, b) => a + b, 0) / backlinksTop3.length)
      : null;

    console.log(`${tag} ${k.phrase.padEnd(50)} vol=${kwData.vol} kd=${kwData.kd}${backlinksNeeded !== null ? ` bl_needed=${backlinksNeeded}` : ''}`);

    results.push({
      ...k,
      vol: kwData.vol,
      kd: kwData.kd,
      cpc: kwData.cpc,
      top3: top3.map((s, idx) => ({ ...s, backlinks: backlinksTop3[idx] || null })),
      backlinksNeeded,
    });

    await new Promise(r => setTimeout(r, 200));
  }

  if (!backlinksOk) {
    console.log('\n⚠️  Backlinks API indisponible. Heuristique KD-based comme fallback dans l\'artefact.');
  }

  const outPath = path.join(ROOT, 'scripts/semrush-serp-analysis.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Sauvegardé : ${path.relative(ROOT, outPath)}`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
