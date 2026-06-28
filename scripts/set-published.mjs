// Marque les villes publiées (génération de page + lien cliquable dans les classements).
// Seed = les villes qui avaient déjà une page flat en ligne (continuité + 301), pour ne rien casser.
// Le cron passera ensuite d'autres villes à published=true, par région, 3 à la fois.
import { readFileSync, writeFileSync } from 'node:fs';

const DATA = 'src/data/rentabilite-villes.json';
const SEED = new Set([
  'paris', 'lyon', 'marseille', 'bordeaux', 'toulouse', 'nice', 'nantes', 'strasbourg',
  'montpellier', 'lille', 'cannes', 'biarritz', 'la-rochelle', 'saint-malo', 'honfleur',
  'deauville', 'saint-tropez', 'antibes', 'bayonne', 'saint-jean-de-luz', 'annecy', 'megeve',
  'aix-en-provence', 'avignon', 'carcassonne', 'colmar', 'rennes', 'ajaccio', 'sarlat-la-caneda',
]);

const data = JSON.parse(readFileSync(DATA, 'utf8'));
let pub = 0, missing = [];
const present = new Set(data.villes.map((v) => v.slug));
for (const s of SEED) if (!present.has(s)) missing.push(s);
for (const v of data.villes) {
  v.published = SEED.has(v.slug) && v.classable;
  if (v.published) pub++;
}
writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
console.log('publiées (seed):', pub, '/', SEED.size, 'attendues');
if (missing.length) console.log('⚠️ seed introuvable dans la base:', missing.join(', '));
console.log('villes publiées:', data.villes.filter((v) => v.published).map((v) => v.slug).sort().join(', '));
