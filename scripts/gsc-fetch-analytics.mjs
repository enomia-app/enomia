#!/usr/bin/env node
/**
 * Récupère les analytics GSC (impressions, clics, CTR, position) par URL sur 28 jours.
 * Utilise Application Default Credentials (gcloud auth application-default login).
 *
 * Output : .claude/gsc-tracking/analytics.json
 * Usage : node scripts/gsc-fetch-analytics.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITE_URL = 'sc-domain:enomia.app';

function dateAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log('🔐 Auth ADC...');
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const authClient = await auth.getClient();
  const sc = google.searchconsole({ version: 'v1', auth: authClient });

  const endDate = dateAgo(2);   // GSC data has ~2 days lag
  const startDate = dateAgo(30); // 28 days window
  console.log(`📅 Fenêtre : ${startDate} → ${endDate}`);
  console.log(`🌐 Site : ${SITE_URL}\n`);

  console.log('🌐 Requête Search Analytics (par page)...');
  const res = await sc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 5000,
    },
  });

  const rows = res.data.rows || [];
  console.log(`✅ ${rows.length} URLs avec impressions sur la période`);

  // Convertir en mapping URL → metrics
  const byUrl = {};
  for (const row of rows) {
    const url = row.keys[0];
    byUrl[url] = {
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr ? Math.round(row.ctr * 1000) / 10 : 0,  // % avec 1 décimale
      position: row.position ? Math.round(row.position * 10) / 10 : 0,
      topQueries: [],
    };
  }

  // Requête 2 : détail page × query (pour avoir top KW par URL)
  console.log('🌐 Requête Search Analytics (par page × query)...');
  const resPQ = await sc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['page', 'query'],
      rowLimit: 25000,
    },
  });
  const rowsPQ = resPQ.data.rows || [];
  console.log(`✅ ${rowsPQ.length} couples (page × query)`);

  for (const row of rowsPQ) {
    const [url, query] = row.keys;
    if (!byUrl[url]) continue;
    byUrl[url].topQueries.push({
      query,
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      position: row.position ? Math.round(row.position * 10) / 10 : 0,
    });
  }
  // Trier topQueries par impressions desc, garder top 5 par URL
  for (const url of Object.keys(byUrl)) {
    byUrl[url].topQueries.sort((a, b) => b.impressions - a.impressions);
    byUrl[url].topQueries = byUrl[url].topQueries.slice(0, 5);
  }

  const outDir = path.join(ROOT, '.claude/gsc-tracking');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'analytics.json');
  fs.writeFileSync(outPath, JSON.stringify({
    fetchedAt: new Date().toISOString(),
    period: { startDate, endDate },
    site: SITE_URL,
    byUrl,
  }, null, 2));

  console.log(`💾 Sauvegardé : ${path.relative(ROOT, outPath)}`);

  // Top 10 pages par impressions
  const top = Object.entries(byUrl).sort(([, a], [, b]) => b.impressions - a.impressions).slice(0, 10);
  console.log('\n🔝 Top 10 pages par impressions :');
  for (const [url, m] of top) {
    console.log(`  ${m.impressions.toString().padStart(6)} impr · ${m.clicks.toString().padStart(4)} clics · pos ${m.position.toString().padStart(5)} · ${url}`);
  }

  const totalImpr = rows.reduce((a, r) => a + (r.impressions || 0), 0);
  const totalClicks = rows.reduce((a, r) => a + (r.clicks || 0), 0);
  console.log(`\n📊 Total période : ${totalImpr} impressions · ${totalClicks} clics`);
}

main().catch(e => {
  console.error('❌', e.message);
  if (e.message.includes('insufficient')) {
    console.error('   → Vérifier accès GSC pour le compte authentifié');
  }
  process.exit(1);
});
