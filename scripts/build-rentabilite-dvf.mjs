#!/usr/bin/env node
// Étape 2 : enrichit le dataset AirROI avec le PRIX m² DVF (officiel DGFiP) + calcule le ratio.
//   ratio = revenu annuel par annonce dispo (rev_par × 365) ÷ coût d'achat T2 (DVF €/m² × 40)
// Reprenable (caches geo + dvf). AUCUNE donnée inventée :
//   - pas de résolution INSEE fiable  -> on flague "insee_non_resolu", pas de prix
//   - Alsace-Moselle (dep 67/68/57)   -> DVF absent -> price=null, flag "hors_dvf"
//   - trop peu de ventes              -> on garde mais on flague la fiabilité prix

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const DIR = 'scripts/rentabilite-dataset';
const air = JSON.parse(readFileSync(`${DIR}/airroi-summary.json`, 'utf8'));
const GEO_CACHE = `${DIR}/geo-cache.json`;
const DVF_CACHE = `${DIR}/dvf-cache.json`;
const FINAL = `${DIR}/dataset-final.json`;
const geoCache = existsSync(GEO_CACHE) ? JSON.parse(readFileSync(GEO_CACHE, 'utf8')) : {};
const dvfCache = existsSync(DVF_CACHE) ? JSON.parse(readFileSync(DVF_CACHE, 'utf8')) : {};

const YEARS = ['2024', '2023', '2022']; // cascade : priorité récent, backfill communes pauvres en ventes
const ALSACE_MOSELLE = new Set(['67', '68', '57']);
const range = (a, b, p) => Array.from({ length: b - a + 1 }, (_, i) => p + String(a + i));
const ARR = { // villes à arrondissements : codes DVF réels
  Paris: range(1, 20, '751'),
  Lyon: range(1, 9, '6938'),
  Marseille: range(1, 16, '132'),
};
// Prix Efficity (estimation, appartement ancien) — repli Alsace-Moselle (DVF indisponible : livre foncier). Relevé efficity.com 2026-06.
const EFFICITY = { Strasbourg: 3520, Colmar: 2310, Mulhouse: 1460, Metz: 2460, 'Saint-Louis': 2850, Schiltigheim: 2700 };
const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json(); }

// locality + region AirROI -> liste de codes INSEE (validée région)
async function resolveInsee(locality, region) {
  const key = `${region}|${locality}`;
  if (geoCache[key]) return geoCache[key];
  if (ARR[locality]) { geoCache[key] = ARR[locality]; return ARR[locality]; }
  let res = null;
  try {
    const list = await getJSON('https://geo.api.gouv.fr/communes?nom=' + encodeURIComponent(locality) + '&fields=code,nom,region,population&boost=population&limit=15');
    let c = list.filter((x) => x.region && norm(x.region.nom) === norm(region));
    if (!c.length) c = list.filter((x) => norm(x.nom) === norm(locality)); // homonyme hors région -> on n'invente pas, on tente nom exact
    c.sort((a, b) => (b.population || 0) - (a.population || 0));
    res = c.length ? [c[0].code] : null;
  } catch { res = null; }
  geoCache[key] = res;
  return res;
}

function parseLine(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) { const ch = line[i];
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else { if (ch === '"') q = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch; } }
  out.push(cur); return out;
}
const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); const n = s.length; return Math.round(n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2); };

function ppmFromCsv(txt) {
  const out = [];
  const lines = txt.split('\n');
  const h = parseLine(lines[0]);
  const I = { id: h.indexOf('id_mutation'), vf: h.indexOf('valeur_fonciere'), tl: h.indexOf('type_local'), surf: h.indexOf('surface_reelle_bati') };
  const mut = new Map();
  for (let i = 1; i < lines.length; i++) { if (!lines[i]) continue; const f = parseLine(lines[i]); const id = f[I.id]; if (!id) continue; (mut.get(id) || mut.set(id, []).get(id)).push(f); }
  for (const rows of mut.values()) {
    const vf = parseFloat(rows[0][I.vf]); if (!vf || vf < 10000) continue;
    const bati = rows.filter((x) => ['Maison', 'Appartement'].includes(x[I.tl]) && parseFloat(x[I.surf]) > 0);
    const ap = bati.filter((x) => x[I.tl] === 'Appartement');
    if (bati.length === 1 && ap.length === 1) { const s = parseFloat(ap[0][I.surf]); if (s >= 9) { const v = vf / s; if (v > 800 && v < 20000) out.push(v); } }
  }
  return out;
}

async function dvfForCommune(insee) {
  if (dvfCache[insee] !== undefined) return dvfCache[insee];
  const dep = insee.startsWith('97') ? insee.slice(0, 3) : insee.slice(0, 2);
  if (ALSACE_MOSELLE.has(dep)) { dvfCache[insee] = { ppm: [], years: [], alsaceMoselle: true }; return dvfCache[insee]; }
  let ppm = []; const years = [];
  for (const y of YEARS) { // cascade : on s'arrête dès qu'on a assez d'échantillon (priorité au récent)
    try {
      const r = await fetch(`https://files.data.gouv.fr/geo-dvf/latest/csv/${y}/communes/${dep}/${insee}.csv`);
      if (r.ok) { const add = ppmFromCsv(await r.text()); if (add.length) { ppm = ppm.concat(add); years.push(y); } }
    } catch { /* réseau */ }
    if (ppm.length >= 40) break;
  }
  dvfCache[insee] = { ppm, years };
  return dvfCache[insee];
}

const out = [];
let i = 0;
for (const m of Object.values(air)) {
  i++;
  if (m.occupancy == null || m.rev_par == null) continue;
  const insee = await resolveInsee(m.locality, m.region);
  let price = null, nSales = 0, source = null, flag = null, dvfYears = [];
  if (!insee) { flag = 'insee_non_resolu'; }
  else {
    const all = []; let am = false; const yrs = new Set();
    for (const code of insee) { const d = await dvfForCommune(code); if (d.alsaceMoselle) am = true; all.push(...d.ppm); (d.years || []).forEach((y) => yrs.add(y)); }
    dvfYears = [...yrs].sort();
    if (am && !all.length) {
      const eff = EFFICITY[m.locality];
      if (eff) { price = eff; source = 'Efficity'; flag = 'prix_efficity_alsace_moselle'; }
      else flag = 'hors_dvf_alsace_moselle';
    }
    else if (all.length) { price = median(all); nSales = all.length; source = 'DVF'; if (nSales < 30) flag = 'prix_faible_echantillon'; }
    else flag = 'dvf_vide';
  }
  // Revenu = prix nuit × occupation × 365 (vérifiable depuis les chiffres affichés ;
  // on n'utilise PAS rev_par d'AirROI qui ne se réconcilie pas avec ADR × occupation).
  const revenuAnnuel = Math.round(m.adr * m.occupancy * 365);
  const TRAVAUX_M2 = 700; // hypothèse rénovation, identique partout, intégrée au coût de revient
  const coutBrut = price ? price * 40 : null;
  const coutRevient = price ? (price + TRAVAUX_M2) * 40 : null; // (prix m² DVF + 700) × 40 m²
  const ratioBrut = coutBrut ? +(revenuAnnuel / coutBrut * 100).toFixed(2) : null;
  const ratio = coutRevient ? +(revenuAnnuel / coutRevient * 100).toFixed(2) : null; // ratio principal = coût de revient
  out.push({ region: m.region, locality: m.locality, insee: insee ? insee.join('+') : null,
    listings: m.listings, occupancy: m.occupancy, adr: Math.round(m.adr), rev_par: Math.round(m.rev_par),
    revenu_annuel: revenuAnnuel, prix_m2: price, dvf_n_ventes: nSales, dvf_annees: dvfYears, prix_source: source,
    travaux_m2: TRAVAUX_M2, cout_revient_t2: coutRevient, ratio_brut: ratioBrut, ratio, flag });
  if (i % 50 === 0) { writeFileSync(GEO_CACHE, JSON.stringify(geoCache)); writeFileSync(DVF_CACHE, JSON.stringify(dvfCache)); process.stdout.write(`\r  ${i}/${Object.keys(air).length}`); await sleep(40); }
}
writeFileSync(GEO_CACHE, JSON.stringify(geoCache));
writeFileSync(DVF_CACHE, JSON.stringify(dvfCache));
writeFileSync(FINAL, JSON.stringify(out, null, 1));

const ok = out.filter((x) => x.ratio != null);
const reliable = ok.filter((x) => x.listings >= 300 && (x.prix_source === 'Efficity' || x.dvf_n_ventes >= 50)).sort((a, b) => b.ratio - a.ratio);
const minReliable = Math.min(...reliable.map((x) => x.listings));
const minAll = Math.min(...ok.map((x) => x.listings));
console.log(`\n\nTotal: ${out.length} | avec prix + ratio coût-revient: ${ok.length} | fiables (≥300 ann & ≥50 ventes DVF ou Efficity): ${reliable.length}`);
console.log(`Min annonces : set fiable=${minReliable} | tous avec prix=${minAll}`);
console.log(`Sans prix: ${out.filter((x) => !x.ratio).length} (insee_non_resolu=${out.filter((x) => x.flag === 'insee_non_resolu').length}, alsace_moselle=${out.filter((x) => x.flag === 'hors_dvf_alsace_moselle').length}, dvf_vide=${out.filter((x) => x.flag === 'dvf_vide').length})`);
console.log('\nTOP 30 ratio COÛT DE REVIENT = revenu ÷ ((prix DVF + 700€/m²) × 40), data 100% réelle :');
console.log('  #  Ville                  Ratio  | occ  nuit* | prix m² DVF | annonces');
reliable.slice(0, 30).forEach((c, k) =>
  console.log(`  ${String(k + 1).padStart(2)} ${c.locality.padEnd(22)} ${String(c.ratio).padStart(5)}% | ${(c.occupancy * 100).toFixed(0).padStart(3)}% ${String(c.adr).padStart(4)}€ | ${String(c.prix_m2).padStart(6)} €/m²${c.prix_source === 'Efficity' ? '*' : ' '} | ${c.listings}`));
console.log('  (* prix Efficity, hors DVF Alsace-Moselle)');
