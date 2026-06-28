#!/usr/bin/env node
// Filtre les marchés guestfavorites aux VRAIES communes (geo.api.gouv.fr) + assigne région + INSEE.
// Jette départements / métropoles / diocèses (pas de commune au nom exact). Gratuit.
import { readFileSync, writeFileSync } from 'node:fs';

const DIR = 'scripts/rentabilite-dataset';
const raw = Object.values(JSON.parse(readFileSync(`${DIR}/guestfavorites-raw.json`, 'utf8'))).filter(Boolean);
const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

async function geo(name) {
  const u = 'https://geo.api.gouv.fr/communes?nom=' + encodeURIComponent(name) + '&fields=code,nom,region,population&boost=population&limit=8';
  try {
    const r = await fetch(u); if (!r.ok) return null;
    const list = await r.json();
    const n = norm(name);
    const exact = list.filter((c) => norm(c.nom) === n).sort((a, b) => (b.population || 0) - (a.population || 0));
    return exact[0] || null;
  } catch { return null; }
}

const communes = [];
let i = 0, kept = 0;
async function worker(q) {
  while (q.length) {
    const m = q.pop();
    const g = await geo(m.name);
    if (g) { communes.push({ ville: g.nom, insee: g.code, region: g.region?.nom || '?', population: g.population || 0, occupation: m.occupancy, prix_nuit: m.adr, revenu_annuel: m.revenue, annonces: m.listings }); kept++; }
    if (++i % 100 === 0) process.stdout.write(`\r  ${i}/${raw.length} (${kept} communes)`);
  }
}
const q = raw.slice();
await Promise.all(Array.from({ length: 10 }, () => worker(q)));

// dédup par INSEE (garde le plus d'annonces)
const byInsee = {};
for (const c of communes) { if (!byInsee[c.insee] || c.annonces > byInsee[c.insee].annonces) byInsee[c.insee] = c; }
const final = Object.values(byInsee).sort((a, b) => b.annonces - a.annonces);
writeFileSync(`${DIR}/gf-communes.json`, JSON.stringify(final, null, 1));

const byReg = {};
final.forEach((c) => (byReg[c.region] = (byReg[c.region] || 0) + 1));
console.log(`\n\n${final.length} communes valides (sur ${raw.length} marchés parsés)`);
console.log('\nCouverture par région :');
Object.entries(byReg).sort((a, b) => b[1] - a[1]).forEach(([r, n]) => console.log('  ' + r.padEnd(28) + n));
console.log('\nSeuils annonces : ' + [5, 30, 50, 100].map((t) => `≥${t}=${final.filter((c) => c.annonces >= t).length}`).join(' | '));
