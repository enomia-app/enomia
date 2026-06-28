// Corrige les homonymes mal résolus : la commune retenue n'était pas celle du marché AirDNA.
// Méthode de détection (cf. session 2026-06-28) : croisement nom→communes (geo.api) puis
// sélection de la commune TOURISTIQUE (présente dans nos listes ski/littoral/village).
// Re-fetch DVF + recalcul région/catégorie/ratio pour la bonne commune. Les données AirDNA
// (occupation, prix/nuit, annonces, revenu) restent : elles décrivent bien le marché touristique.
import { readFileSync, writeFileSync } from 'node:fs';

const DIR = 'scripts/rentabilite-dataset';
const DATA = 'src/data/rentabilite-villes.json';

const FIX = [
  { slug: 'roussillon', insee: '84102', region: 'Provence-Alpes-Côte d’Azur' }, // Vaucluse (Plus Beaux Village), pas Isère 38344
  { slug: 'les-angles', insee: '66004', region: 'Occitanie' },                        // Pyrénées-Orientales (station ski), pas Gard 30011
];

const RENO = 700;
const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const tierFn = (ann, ventes) => { const v = ventes || 0; if (ann >= 50 && v >= 50) return 'forte'; if (ann >= 30 && v >= 30) return 'bonne'; if (ann > 5 && v > 10) return 'faible'; return null; };
function parseLine(line) { const o = []; let c = '', q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (q) { if (ch === '"') { if (line[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else { if (ch === '"') q = true; else if (ch === ',') { o.push(c); c = ''; } else c += ch; } } o.push(c); return o; }
function salesFromCsv(txt) { const out = []; const L = txt.split('\n'); const h = parseLine(L[0]); const I = { id: h.indexOf('id_mutation'), vf: h.indexOf('valeur_fonciere'), tl: h.indexOf('type_local'), su: h.indexOf('surface_reelle_bati') }; const mut = new Map(); for (let i = 1; i < L.length; i++) { if (!L[i]) continue; const f = parseLine(L[i]); const id = f[I.id]; if (!id) continue; (mut.get(id) || mut.set(id, []).get(id)).push(f); } for (const rows of mut.values()) { const vf = parseFloat(rows[0][I.vf]); if (!vf || vf < 20000) continue; const bati = rows.filter((x) => ['Maison', 'Appartement'].includes(x[I.tl]) && parseFloat(x[I.su]) > 0); if (bati.length !== 1) continue; const surf = parseFloat(bati[0][I.su]); if (surf < 9 || surf > 400) continue; const ppm = vf / surf; if (ppm < 800 || ppm > 25000) continue; out.push({ vf, surf, ppm: bati[0][I.tl] === 'Appartement' ? ppm : null }); } return out; }
async function dvf(insee) { const dep = insee.startsWith('97') ? insee.slice(0, 3) : insee.slice(0, 2); let sales = []; for (const y of ['2024', '2023', '2022']) { try { const r = await fetch(`https://files.data.gouv.fr/geo-dvf/latest/csv/${y}/communes/${dep}/${insee}.csv`); if (r.ok) sales = sales.concat(salesFromCsv(await r.text())); } catch {} if (sales.length >= 40) break; } return sales; }

const data = JSON.parse(readFileSync(DATA, 'utf8'));
const ski = new Set(JSON.parse(readFileSync(`${DIR}/ski-stations.json`, 'utf8')).insee);
const litt = new Set(JSON.parse(readFileSync(`${DIR}/littoral-mer.json`, 'utf8')));
const vill = new Set(JSON.parse(readFileSync(`${DIR}/village-caractere.json`, 'utf8')));
const taille = (p) => p == null ? null : p >= 100000 ? 'metropole' : p >= 20000 ? 'moyenne' : p >= 2000 ? 'petite' : 'rural';

for (const fix of FIX) {
  const v = data.villes.find((x) => x.slug === fix.slug);
  if (!v) { console.log('introuvable:', fix.slug); continue; }
  const sales = await dvf(fix.insee);
  if (!sales.length) { console.log(`⚠️ ${v.ville}: aucune vente DVF pour ${fix.insee} — à traiter à la main`); continue; }
  const cost = Math.round(median(sales.map((s) => s.vf + RENO * s.surf)));
  const old = v.insee;
  v.insee = fix.insee;
  v.region = fix.region;
  v.region_slug = slugify(fix.region);
  v.prix_bien = Math.round(median(sales.map((s) => s.vf)));
  v.surf_med = Math.round(median(sales.map((s) => s.surf)));
  const ppms = sales.filter((s) => s.ppm).map((s) => s.ppm);
  v.prix_m2 = ppms.length ? Math.round(median(ppms)) : null;
  v.cout_total = cost;
  v.prix_source = 'DVF';
  v.dvf_n_ventes = sales.length;
  v.ratio = +(v.revenu_annuel / cost * 100).toFixed(2);
  v.tier = tierFn(v.annonces, sales.length);
  v.classable = v.ratio != null && v.tier != null;
  const pj = await (await fetch(`https://geo.api.gouv.fr/communes/${fix.insee}?fields=population`)).json();
  v.population = pj.population ?? null;
  v.taille = taille(v.population);
  v.ski = ski.has(fix.insee);
  v.littoral = litt.has(fix.insee);
  v.village_caractere = vill.has(fix.insee);
  v.categorie = v.ski ? 'ski' : v.littoral ? 'littoral' : v.village_caractere ? 'village' : v.taille === 'metropole' ? 'metropole' : v.taille === 'moyenne' ? 'ville-moyenne' : v.taille === 'petite' ? 'petite-ville' : v.taille === 'rural' ? 'rural' : 'autre';
  console.log(`${v.ville}: ${old} -> ${fix.insee} | ${v.region} | ratio ${v.ratio}% | bien ${v.prix_bien?.toLocaleString('fr-FR')}€ | ${v.dvf_n_ventes} ventes | cat=${v.categorie} pop=${v.population}`);
}

// Recalcule l'agrégat régions (Roussillon a changé de région).
const rmap = {};
for (const v of data.villes) { (rmap[v.region_slug] ||= { region: v.region, slug: v.region_slug, villes: 0, classables: 0 }); rmap[v.region_slug].villes++; if (v.classable) rmap[v.region_slug].classables++; }
data.regions = Object.values(rmap).sort((a, b) => b.classables - a.classables);

writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
console.log('\nrégions:', data.regions.length, '| classables:', data.villes.filter((v) => v.classable).length);
