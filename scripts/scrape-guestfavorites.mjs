#!/usr/bin/env node
// Scrape guestfavorites.com (données AirDNA, gratuit) : occupation + ADR + revenu + annonces par marché France.
// Source citée = AirDNA. robots.txt autorise (Allow: /). Reprenable (cache JSON), concurrence polie.
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const DIR = 'scripts/rentabilite-dataset';
if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
const OUT = `${DIR}/guestfavorites-raw.json`;
const UA = { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' };

// 1. Sitemap France -> URLs uniques
const gz = await (await fetch('https://cdn.guestfavorites.com/sitemaps/sitemap_occupancy_rates_france.xml.gz', { headers: UA })).arrayBuffer();
const xml = gunzipSync(Buffer.from(gz)).toString('utf8');
const urls = [...new Set(xml.match(/https:\/\/www\.guestfavorites\.com\/airbnb-occupancy-rates-in-[a-z0-9-]+-france/g) || [])];
console.log(`URLs France distinctes : ${urls.length}`);

// 2. Parse (meta description = source la plus propre)
function parse(html) {
  const m = html.match(/Airbnb in (.+?), France: ([\d.]+)% occupancy, €([\d,]+) avg annual revenue, €([\d,.]+) ADR\.\s*([\d,]+) active listings/);
  if (!m) return null;
  const num = (s) => parseFloat(s.replace(/,/g, ''));
  return { name: m[1].trim(), occupancy: num(m[2]), revenue: Math.round(num(m[3])), adr: Math.round(num(m[4])), listings: Math.round(num(m[5])) };
}

// 3. Fetch concurrent, reprenable
const out = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const todo = urls.filter((u) => out[u] === undefined);
let done = 0, ok = 0, blocked = 0;
async function worker(queue) {
  while (queue.length) {
    const u = queue.pop();
    try {
      const r = await fetch(u, { headers: UA });
      if (r.status === 429 || r.status === 403) { blocked++; queue.unshift(u); await new Promise((s) => setTimeout(s, 1500)); continue; }
      if (!r.ok) { out[u] = null; }
      else { const p = parse(await r.text()); out[u] = p ? { ...p, url: u } : null; if (p) ok++; }
    } catch { out[u] = null; }
    if (++done % 100 === 0) { writeFileSync(OUT, JSON.stringify(out)); process.stdout.write(`\r  ${done}/${todo.length} (+${ok} ok, ${blocked} blocked)`); }
    await new Promise((s) => setTimeout(s, 40));
  }
}
const queue = todo.slice();
await Promise.all(Array.from({ length: 10 }, () => worker(queue)));
writeFileSync(OUT, JSON.stringify(out));

const parsed = Object.values(out).filter(Boolean);
console.log(`\nFini : ${parsed.length} marchés parsés / ${urls.length} URL (${blocked} blocages rencontrés).`);
console.log('Exemples : ' + parsed.slice(0, 6).map((p) => `${p.name} ${p.occupancy}% €${p.adr} ${p.listings}ann`).join(' | '));
