// Ajoute les flags de catégorie aux villes de rentabilite-villes.json :
//   ski, littoral, village_caractere (booléens, sources officielles)
//   population (INSEE 2023 via geo.api), taille (metropole/moyenne/petite/rural), categorie (primaire)
// Pré-requis : scripts/rentabilite-dataset/{ski-stations,littoral-mer,village-caractere}.json
// (ski via build-ski-stations.mjs ; littoral + village via build-category-sources.py)
import fs from 'node:fs';

const DIR = 'scripts/rentabilite-dataset';
const DATA = 'src/data/rentabilite-villes.json';

const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const ski = new Set(JSON.parse(fs.readFileSync(`${DIR}/ski-stations.json`, 'utf8')).insee);
const littoral = new Set(JSON.parse(fs.readFileSync(`${DIR}/littoral-mer.json`, 'utf8')));
const village = new Set(JSON.parse(fs.readFileSync(`${DIR}/village-caractere.json`, 'utf8')));

// Population légale INSEE 2023 via geo.api (1 appel, cache local sur nos codes)
const popCache = `${DIR}/population.json`;
let pop;
if (fs.existsSync(popCache)) {
  pop = JSON.parse(fs.readFileSync(popCache, 'utf8'));
  console.log('population : cache', Object.keys(pop).length);
} else {
  console.log('population : fetch geo.api…');
  const res = await fetch('https://geo.api.gouv.fr/communes?fields=code,population&format=json');
  const arr = await res.json();
  const full = {};
  for (const c of arr) if (c.population != null) full[c.code] = c.population;
  pop = {};
  for (const v of data.villes) if (v.insee && full[v.insee] != null) pop[v.insee] = full[v.insee];
  fs.writeFileSync(popCache, JSON.stringify(pop));
  console.log('population : récupéré', Object.keys(pop).length, '/', data.villes.length, 'communes');
}

const taille = (p) => p == null ? null
  : p >= 100000 ? 'metropole'
  : p >= 20000 ? 'moyenne'
  : p >= 2000 ? 'petite'
  : 'rural';

const counts = { ski: 0, littoral: 0, village: 0, metropole: 0 };
const dist = {};
for (const v of data.villes) {
  v.ski = ski.has(v.insee);
  v.littoral = littoral.has(v.insee);
  v.village_caractere = village.has(v.insee);
  v.population = v.insee && pop[v.insee] != null ? pop[v.insee] : null;
  v.taille = taille(v.population);
  v.categorie = v.ski ? 'ski'
    : v.littoral ? 'littoral'
    : v.village_caractere ? 'village'
    : v.taille === 'metropole' ? 'metropole'
    : v.taille === 'moyenne' ? 'ville-moyenne'
    : v.taille === 'petite' ? 'petite-ville'
    : v.taille === 'rural' ? 'rural'
    : 'autre';
  if (v.classable) {
    if (v.ski) counts.ski++;
    if (v.littoral) counts.littoral++;
    if (v.village_caractere) counts.village++;
    if (v.taille === 'metropole') counts.metropole++;
    dist[v.categorie] = (dist[v.categorie] || 0) + 1;
  }
}

fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
const cl = data.villes.filter((v) => v.classable);
console.log('classables :', cl.length);
console.log('flags (classables) :', counts);
console.log('catégorie primaire (classables) :', dist);
console.log('sans population :', cl.filter((v) => v.population == null).length);
