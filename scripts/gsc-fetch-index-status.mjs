#!/usr/bin/env node
/**
 * Vérifie le statut d'indexation Google pour chaque URL (article blog, page ville).
 * Utilise GSC URL Inspection API.
 *
 * Quota : 2000 inspections/jour, ~2s par requête.
 * Output : .claude/gsc-tracking/index-status.json
 * Usage : node scripts/gsc-fetch-index-status.mjs [--limit=N] [--only=blog|conc|rent]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITE_URL = 'sc-domain:enomia.app';
const BASE_URL = 'https://www.enomia.app';

const LIMIT = parseInt(process.argv.find(a => a.startsWith('--limit='))?.replace('--limit=', '') || '999', 10);
const ONLY = process.argv.find(a => a.startsWith('--only='))?.replace('--only=', '');

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
  return { status: get('status') };
}

async function buildUrlList() {
  // Lire le sitemap prod (source de vérité des URLs publiées)
  console.log('🌐 Récupération sitemap prod...');
  const res = await fetch('https://www.enomia.app/sitemap.xml');
  const xml = await res.text();
  const allUrls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  console.log(`📋 ${allUrls.length} URLs dans le sitemap`);

  // Catégoriser chaque URL
  function categorize(url) {
    const p = url.replace('https://www.enomia.app', '');
    if (p === '' || p === '/') return { source: 'home', slug: 'homepage' };
    if (p === '/blog') return { source: 'hub', slug: 'blog-hub' };
    if (p.startsWith('/blog/')) return { source: 'blog', slug: p.replace('/blog/', '') };
    if (p === '/conciergerie-airbnb') return { source: 'hub', slug: 'conciergerie-hub' };
    if (p === '/rentabilite-airbnb') return { source: 'hub', slug: 'rentabilite-hub' };
    if (p.startsWith('/rentabilite-airbnb/')) return { source: 'rent', slug: p.replace('/rentabilite-airbnb/', '') };
    const concVilleMatch = p.match(/^\/conciergerie-airbnb\/([^/]+)\/([^/]+)$/);
    if (concVilleMatch) return { source: 'conc', slug: concVilleMatch[2], region: concVilleMatch[1] };
    const concRegionMatch = p.match(/^\/conciergerie-airbnb\/([^/]+)$/);
    if (concRegionMatch) return { source: 'conc-region', slug: concRegionMatch[1] };
    return { source: 'tool', slug: p.replace(/^\//, '') };
  }

  const urls = allUrls.map(url => ({ url, ...categorize(url) }));

  if (ONLY) {
    return urls.filter(u => u.source === ONLY).slice(0, LIMIT);
  }
  return urls.slice(0, LIMIT);
}

async function inspectUrl(sc, url) {
  try {
    const res = await sc.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: url,
        siteUrl: SITE_URL,
      },
    });
    const r = res.data.inspectionResult?.indexStatusResult;
    return {
      verdict: r?.verdict || 'UNKNOWN',
      coverageState: r?.coverageState || null,
      indexingState: r?.indexingState || null,
      lastCrawlTime: r?.lastCrawlTime || null,
      pageFetchState: r?.pageFetchState || null,
      googleCanonical: r?.googleCanonical || null,
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function main() {
  console.log('🔐 Auth ADC...');
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const authClient = await auth.getClient();
  const sc = google.searchconsole({ version: 'v1', auth: authClient });

  const urls = await buildUrlList();
  console.log(`📋 ${urls.length} URLs à inspecter`);
  console.log(`💰 Quota : 2000/jour · estimation : ~${urls.length * 2}s\n`);

  // Charger état existant
  const outDir = path.join(ROOT, '.claude/gsc-tracking');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'index-status.json');
  let existing = { fetchedAt: null, byUrl: {} };
  if (fs.existsSync(outPath)) {
    existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  }

  let i = 0;
  for (const item of urls) {
    const { source, slug, url } = item;
    i++;
    const result = await inspectUrl(sc, url);
    existing.byUrl[url] = { source, slug, region: item.region, ...result, checkedAt: new Date().toISOString() };

    const indicator = result.verdict === 'PASS' ? '✅' : result.verdict === 'FAIL' ? '❌' : result.error ? '⚠️' : '🟡';
    const detail = result.error || `${result.verdict} · ${result.coverageState || '?'}`;
    console.log(`[${i}/${urls.length}] ${indicator} ${url.padEnd(70)} ${detail}`);

    // Save every 10
    if (i % 10 === 0) {
      existing.fetchedAt = new Date().toISOString();
      fs.writeFileSync(outPath, JSON.stringify(existing, null, 2));
    }

    await new Promise(r => setTimeout(r, 500)); // throttle 500ms (quota safe)
  }

  existing.fetchedAt = new Date().toISOString();
  fs.writeFileSync(outPath, JSON.stringify(existing, null, 2));
  console.log(`\n💾 Sauvegardé : ${path.relative(ROOT, outPath)}`);

  // Stats
  const all = Object.values(existing.byUrl);
  const pass = all.filter(r => r.verdict === 'PASS').length;
  const fail = all.filter(r => r.verdict === 'FAIL').length;
  console.log(`📊 ${pass} indexées · ${fail} non-indexées · ${all.length - pass - fail} autre/inconnu`);
}

main().catch(e => {
  console.error('❌', e.message);
  process.exit(1);
});
