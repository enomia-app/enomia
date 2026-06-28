#!/usr/bin/env node
/**
 * Courbe d'impressions/clics GSC dans le temps (tendance), agrégée par semaine.
 * Auth : OAuth refresh_token via scripts/lib/gsc-auth.mjs.
 * Usage : node scripts/gsc-trend.mjs [nbJours]   (défaut 90)
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';
import { getGscAuthClient } from './lib/gsc-auth.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try { process.loadEnvFile(path.join(ROOT, '.env')); } catch {}
const SITE_URL = 'sc-domain:enomia.app';
const DAYS = parseInt(process.argv[2] || '90', 10);

const iso = (d) => d.toISOString().slice(0, 10);
function isoWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = (d.getUTCDay() + 6) % 7;            // lundi=0
  d.setUTCDate(d.getUTCDate() - day);             // lundi de la semaine
  return iso(d);
}

const start = new Date(); start.setDate(start.getDate() - DAYS);
const end = new Date(); end.setDate(end.getDate() - 1);

const sc = google.searchconsole({ version: 'v1', auth: getGscAuthClient() });
const res = await sc.searchanalytics.query({
  siteUrl: SITE_URL,
  requestBody: { startDate: iso(start), endDate: iso(end), dimensions: ['date'], rowLimit: 1000 },
});
const rows = res.data.rows || [];
if (!rows.length) { console.log('Aucune donnée.'); process.exit(0); }

const wk = {};
for (const r of rows) {
  const w = isoWeek(r.keys[0]);
  wk[w] ||= { clicks: 0, impr: 0, days: 0 };
  wk[w].clicks += r.clicks; wk[w].impr += r.impressions; wk[w].days++;
}
const weeks = Object.keys(wk).sort();
const maxImpr = Math.max(...weeks.map((w) => wk[w].impr));

console.log(`Tendance GSC ${iso(start)} → ${iso(end)} (par semaine, lundi)\n`);
console.log('semaine      impr   clics   ' );
for (const w of weeks) {
  const { impr, clicks } = wk[w];
  const bar = '█'.repeat(Math.round((impr / maxImpr) * 30));
  console.log(`${w}  ${String(impr).padStart(5)}  ${String(clicks).padStart(5)}   ${bar}`);
}
const tot = weeks.reduce((a, w) => ({ impr: a.impr + wk[w].impr, clicks: a.clicks + wk[w].clicks }), { impr: 0, clicks: 0 });
console.log(`\nTotal ${DAYS}j : ${tot.impr} impressions, ${tot.clicks} clics, CTR ${(tot.clicks / tot.impr * 100).toFixed(2)}%`);
