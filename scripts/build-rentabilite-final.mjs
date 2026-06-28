#!/usr/bin/env node
// Pipeline final (gratuit) : communes guestfavorites/AirDNA (occupation/ADR/revenu/annonces)
//   + DVF (prix RÉEL du bien médian + surface, multi-années, repli Efficity Alsace-Moselle)
//   -> ratio = revenu annuel ÷ (prix médian du bien + 700 €/m² × surface médiane)
//   (on n'assume PLUS un T2 de 40 m² : ça gonflait les marchés de villas type Ramatuelle).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const DIR = 'scripts/rentabilite-dataset';
const communes = JSON.parse(readFileSync(`${DIR}/gf-communes.json`, 'utf8'));
const DVF_CACHE = `${DIR}/dvf-cache2.json`; // nouvelle structure (sales)
const dvfCache = existsSync(DVF_CACHE) ? JSON.parse(readFileSync(DVF_CACHE, 'utf8')) : {};

const YEARS = ['2024', '2023', '2022'];
const RENO = 700; // €/m² travaux
const EFF_SURF = 55; // surface de référence pour les communes Efficity (marchés appartement Alsace-Moselle)
const ALSACE_MOSELLE = new Set(['67', '68', '57']);
const range = (a, b, p) => Array.from({ length: b - a + 1 }, (_, i) => p + String(a + i));
const ARR = { '75056': range(1, 20, '751'), '69123': range(1, 9, '6938'), '13055': range(1, 16, '132') };
const EFFICITY = { Strasbourg: 3520, Colmar: 2310, Mulhouse: 1460, Metz: 2460, 'Saint-Louis': 2850, Schiltigheim: 2700 };
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const REGION_FR = { Brittany: 'Bretagne', Normandy: 'Normandie', Occitania: 'Occitanie', 'Ile-de-France': 'Île-de-France' };
const frRegion = (r) => REGION_FR[r] || r;
const tierFn = (ann, ventes, isEff) => { const v = isEff ? Infinity : (ventes || 0); if (ann >= 50 && v >= 50) return 'forte'; if (ann >= 30 && v >= 30) return 'bonne'; if (ann > 5 && v > 10) return 'faible'; return null; };
const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

function parseLine(line) { const o = []; let c = '', q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (q) { if (ch === '"') { if (line[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else { if (ch === '"') q = true; else if (ch === ',') { o.push(c); c = ''; } else c += ch; } } o.push(c); return o; }
// Ventes mono-lot résidentiel (1 seul bâti, appartement ou maison) -> {vf, surf, ppm(appart only)}
function salesFromCsv(txt) {
  const out = []; const L = txt.split('\n'); const h = parseLine(L[0]);
  const I = { id: h.indexOf('id_mutation'), vf: h.indexOf('valeur_fonciere'), tl: h.indexOf('type_local'), su: h.indexOf('surface_reelle_bati') };
  const mut = new Map();
  for (let i = 1; i < L.length; i++) { if (!L[i]) continue; const f = parseLine(L[i]); const id = f[I.id]; if (!id) continue; (mut.get(id) || mut.set(id, []).get(id)).push(f); }
  for (const rows of mut.values()) {
    const vf = parseFloat(rows[0][I.vf]); if (!vf || vf < 20000) continue;
    const bati = rows.filter((x) => ['Maison', 'Appartement'].includes(x[I.tl]) && parseFloat(x[I.su]) > 0);
    if (bati.length !== 1) continue;
    const surf = parseFloat(bati[0][I.su]); if (surf < 9 || surf > 400) continue;
    const ppm = vf / surf; if (ppm < 800 || ppm > 25000) continue;
    out.push({ vf, surf, ppm: bati[0][I.tl] === 'Appartement' ? ppm : null });
  }
  return out;
}

async function dvf(insee) {
  if (dvfCache[insee] !== undefined) return dvfCache[insee];
  const dep = insee.startsWith('97') ? insee.slice(0, 3) : insee.slice(0, 2);
  if (ALSACE_MOSELLE.has(dep)) { dvfCache[insee] = { sales: [], am: true }; return dvfCache[insee]; }
  let sales = [];
  for (const y of YEARS) { try { const r = await fetch(`https://files.data.gouv.fr/geo-dvf/latest/csv/${y}/communes/${dep}/${insee}.csv`); if (r.ok) sales = sales.concat(salesFromCsv(await r.text())); } catch {} if (sales.length >= 40) break; }
  dvfCache[insee] = { sales };
  return dvfCache[insee];
}

const out = [];
let i = 0;
for (const c of communes) {
  const codes = ARR[c.insee] || [c.insee];
  let am = false; let sales = [];
  for (const code of codes) { const d = await dvf(code); if (d.am) am = true; sales = sales.concat(d.sales); }
  let cost = null, prixBien = null, prixM2 = null, surf = null, nSales = 0, source = null;
  if (sales.length) {
    nSales = sales.length;
    cost = Math.round(median(sales.map((s) => s.vf + RENO * s.surf)));
    prixBien = Math.round(median(sales.map((s) => s.vf)));
    surf = Math.round(median(sales.map((s) => s.surf)));
    const ppms = sales.filter((s) => s.ppm).map((s) => s.ppm);
    prixM2 = ppms.length ? Math.round(median(ppms)) : null;
    source = 'DVF';
  } else if (am && EFFICITY[c.ville]) {
    prixM2 = EFFICITY[c.ville]; surf = EFF_SURF; prixBien = Math.round(prixM2 * EFF_SURF); cost = Math.round((prixM2 + RENO) * EFF_SURF); source = 'Efficity';
  }
  const revenu = Math.round(c.prix_nuit * c.occupation / 100 * 365);
  const ratio = cost ? +(revenu / cost * 100).toFixed(2) : null;
  const region = frRegion(c.region);
  const tier = tierFn(c.annonces, nSales, source === 'Efficity');
  out.push({ slug: slug(c.ville), ville: c.ville, region, region_slug: slug(region), annonces: c.annonces, occupation: c.occupation, prix_nuit: c.prix_nuit, revenu_annuel: revenu, prix_bien: prixBien, surf_med: surf, prix_m2: prixM2, cout_total: cost, prix_source: source, dvf_n_ventes: nSales, ratio, tier, classable: ratio != null && tier != null });
  if (++i % 50 === 0) { writeFileSync(DVF_CACHE, JSON.stringify(dvfCache)); process.stdout.write(`\r  ${i}/${communes.length}`); }
}
writeFileSync(DVF_CACHE, JSON.stringify(dvfCache));

const seen = {}; for (const v of out) { if (seen[v.slug]) v.slug = `${v.slug}-${v.region_slug.split('-')[0]}`; seen[v.slug] = true; }
const rmap = {}; for (const v of out) { (rmap[v.region_slug] ||= { region: v.region, slug: v.region_slug, villes: 0, classables: 0 }); rmap[v.region_slug].villes++; if (v.classable) rmap[v.region_slug].classables++; }
const regions = Object.values(rmap).sort((a, b) => b.classables - a.classables);
writeFileSync('src/data/rentabilite-villes.json', JSON.stringify({ villes: out, regions, generatedFrom: 'AirDNA (via guestfavorites) + DVF (DGFiP)', count: out.length }, null, 1));

const cl = out.filter((v) => v.classable);
console.log(`\n\n${out.length} communes | ${cl.length} classables | ${regions.length} régions`);
console.log('\nTop 12 ratio (÷ prix réel du bien) :');
cl.sort((a, b) => b.ratio - a.ratio).slice(0, 12).forEach((v, k) => console.log(`  ${k + 1} ${v.ville.padEnd(20)} ${v.ratio}% | occ ${v.occupation}% nuit ${v.prix_nuit}€ | bien ${v.prix_bien?.toLocaleString('fr-FR')}€ (${v.surf_med}m²)${v.prix_source === 'Efficity' ? '*' : ''} | ${v.annonces}ann ${v.dvf_n_ventes}v`));
