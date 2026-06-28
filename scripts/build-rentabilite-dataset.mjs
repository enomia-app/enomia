#!/usr/bin/env node
// Construit le dataset Airbnb rentabilité par ville à partir de DONNÉES RÉELLES :
//   - AirROI /markets/summary : occupation, ADR, rev_par, revenu, nb annonces actives
//   - (DVF ajouté dans une étape suivante : prix m² appartements)
// Énumération via les 18 régions (seul vecteur fiable, recherche par nom).
// Reprenable : cache JSON, on ne re-fetch pas un marché déjà récupéré.
// AUCUNE donnée inventée : on n'écrit que ce que l'API renvoie.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const KEY = readFileSync('.env', 'utf8').split('\n').find((l) => l.startsWith('AIRROI_API_KEY=')).split('=')[1].trim();
const DIR = 'scripts/rentabilite-dataset';
if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
const IDX = `${DIR}/airroi-index.json`;
const OUT = `${DIR}/airroi-summary.json`;

const H = { 'x-api-key': KEY, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url) {
  const r = await fetch(url, { headers: H });
  if (!r.ok) throw new Error(`GET ${r.status}`);
  return r.json();
}
async function postJSON(url, body) {
  const r = await fetch(url, { method: 'POST', headers: H, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`POST ${r.status}`);
  return r.json();
}

// 1) Énumération régions -> marchés ville distincts
async function enumerate() {
  if (existsSync(IDX)) return JSON.parse(readFileSync(IDX, 'utf8'));
  const regions = (await getJSON('https://geo.api.gouv.fr/regions')).map((r) => r.nom);
  const markets = new Map();
  for (const rg of regions) {
    try {
      const d = await getJSON('https://api.airroi.com/markets/search?query=' + encodeURIComponent(rg));
      for (const e of d.entries || []) {
        if (e.country !== 'France' || e.district) continue;
        const k = `${e.region}|${e.locality}`;
        const prev = markets.get(k);
        if (!prev || (e.active_listings_count || 0) > prev.active_listings_count)
          markets.set(k, { country: e.country, region: e.region, locality: e.locality, full_name: e.full_name, active_listings_count: Math.round(e.active_listings_count || 0) });
      }
    } catch (e) { console.error('  enum err', rg, e.message); }
    await sleep(150);
  }
  const arr = [...markets.values()].sort((a, b) => b.active_listings_count - a.active_listings_count);
  writeFileSync(IDX, JSON.stringify(arr, null, 1));
  return arr;
}

// 2) Summary par marché (reprenable)
async function collect(markets) {
  const out = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
  let done = 0, fetched = 0;
  const todo = markets.filter((m) => !out[`${m.region}|${m.locality}`]);
  const CONC = 4;
  for (let i = 0; i < todo.length; i += CONC) {
    const batch = todo.slice(i, i + CONC);
    await Promise.all(batch.map(async (m) => {
      const body = { market: { country: m.country, region: m.region, locality: m.locality, district: '' }, num_months: 12, currency: 'native' };
      try {
        const s = await postJSON('https://api.airroi.com/markets/summary', body);
        out[`${m.region}|${m.locality}`] = {
          region: m.region, locality: m.locality,
          listings: Math.round(s.active_listings_count || m.active_listings_count || 0),
          occupancy: s.occupancy, adr: s.average_daily_rate, rev_par: s.rev_par, revenue: s.revenue,
        };
        fetched++;
      } catch (e) { console.error('  summary err', m.locality, e.message); }
    }));
    done += batch.length;
    if (done % 40 === 0) { writeFileSync(OUT, JSON.stringify(out, null, 1)); process.stdout.write(`\r  ${done}/${todo.length} (+${fetched} nouveaux)`); }
    await sleep(120);
  }
  writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(`\n  collecté: ${Object.keys(out).length} marchés (dont ${fetched} ce run)`);
  return out;
}

const markets = await enumerate();
console.log(`Énumération: ${markets.length} marchés-villes distincts`);
const data = await collect(markets);

// Aperçu : top 15 par annonces, occ/adr réels
const rows = Object.values(data).filter((d) => d.occupancy != null).sort((a, b) => b.listings - a.listings).slice(0, 15);
console.log('\nTop 15 par nb annonces (données AirROI réelles) :');
for (const r of rows)
  console.log(`  ${r.locality.padEnd(22)} ${String(r.listings).padStart(6)} ann | occ ${(r.occupancy * 100).toFixed(0)}% | ADR ${Math.round(r.adr)}€ | revPAR ${Math.round(r.rev_par)}€`);
