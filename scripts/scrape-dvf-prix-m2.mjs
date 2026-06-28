#!/usr/bin/env node
// Scrape geo-DVF (données ouvertes DGFiP, issues des actes de vente publiés)
// -> médiane €/m² appartements par commune.
// Source : https://files.data.gouv.fr/geo-dvf/latest/csv/{year}/communes/{dep}/{insee}.csv
//
// Dédup au niveau MUTATION : on ne garde que les ventes "mono-lot appartement"
// (1 seul lot bâti = 1 appartement). Évite l'inflation des ventes groupées
// (appart + parking + cave, où valeur_fonciere couvre l'ensemble).
//
// Alsace-Moselle (67, 68, 57) : non couverte par DVF -> fichier absent -> à flaguer.

const YEAR = '2024';

// Batch de VALIDATION (edge cases), pas encore les 95 :
const CITIES = [
  { name: 'Bordeaux', insee: ['33063'] },                                          // baseline
  { name: 'Saint-Quentin', insee: ['02691'] },                                     // ville pas chère (gros ratio)
  { name: 'Paris', insee: Array.from({ length: 20 }, (_, i) => '751' + String(i + 1).padStart(2, '0')) }, // arrondissements
  { name: 'Strasbourg', insee: ['67482'] },                                        // Alsace -> attendu : absent
  { name: 'Mulhouse', insee: ['68224'] },                                          // Alsace -> attendu : absent
];

function dep(insee) {
  if (insee.startsWith('97') || insee.startsWith('98')) return insee.slice(0, 3);
  return insee.slice(0, 2);
}

async function fetchCsv(insee) {
  const url = `https://files.data.gouv.fr/geo-dvf/latest/csv/${YEAR}/communes/${dep(insee)}/${insee}.csv`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.text();
}

function parseLine(line) {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else { if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; }
  }
  out.push(cur); return out;
}

const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); const n = s.length; return Math.round(n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2); };
const pct = (a, p) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.floor(s.length * p))]); };

async function cityMedian(city) {
  const ppm = [];
  let hadFile = false;
  for (const insee of city.insee) {
    const txt = await fetchCsv(insee);
    if (txt == null) continue;
    hadFile = true;
    const lines = txt.split('\n');
    const h = parseLine(lines[0]);
    const I = { id: h.indexOf('id_mutation'), vf: h.indexOf('valeur_fonciere'), tl: h.indexOf('type_local'), surf: h.indexOf('surface_reelle_bati') };
    const mut = new Map();
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue;
      const f = parseLine(lines[i]);
      const id = f[I.id]; if (!id) continue;
      if (!mut.has(id)) mut.set(id, []);
      mut.get(id).push(f);
    }
    for (const rows of mut.values()) {
      const vf = parseFloat(rows[0][I.vf]);
      if (!vf || vf < 10000) continue;
      const bati = rows.filter((r) => ['Maison', 'Appartement'].includes(r[I.tl]) && parseFloat(r[I.surf]) > 0);
      const apparts = bati.filter((r) => r[I.tl] === 'Appartement');
      if (bati.length === 1 && apparts.length === 1) {
        const s = parseFloat(apparts[0][I.surf]);
        if (s >= 9) { const v = vf / s; if (v > 800 && v < 20000) ppm.push(v); }
      }
    }
  }
  return { hadFile, n: ppm.length, median: median(ppm), p25: pct(ppm, 0.25), p75: pct(ppm, 0.75) };
}

(async () => {
  console.log(`geo-DVF ${YEAR} — médiane €/m² appartements (dédup mono-lot)\n`);
  for (const city of CITIES) {
    try {
      const r = await cityMedian(city);
      if (!r.hadFile) { console.log(`${city.name.padEnd(16)} : AUCUN fichier DVF (Alsace-Moselle ? -> fallback requis)`); continue; }
      if (!r.n) { console.log(`${city.name.padEnd(16)} : fichier present mais 0 vente exploitable`); continue; }
      console.log(`${city.name.padEnd(16)} : ${r.median} EUR/m2  (n=${r.n}, p25=${r.p25}, p75=${r.p75})`);
    } catch (e) { console.log(`${city.name.padEnd(16)} : ERREUR ${e.message}`); }
  }
})();
