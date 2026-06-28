#!/usr/bin/env node
// Transforme dataset-final.json -> src/data/rentabilite-villes.json (module consommé par les pages).
// Ajoute : slug ville, slug région, tier de fiabilité, flag "classable" (éligible au classement).
// Inclut les 871 villes (celles sans prix gardent ratio=null -> searchbox affiche ce qu'on a).

import { readFileSync, writeFileSync } from 'node:fs';

const IN = 'scripts/rentabilite-dataset/dataset-final.json';
const OUT = 'src/data/rentabilite-villes.json';

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/['’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// AirROI renvoie certaines régions en anglais -> on normalise en français (et on fusionne les doublons).
const REGION_FR = { Brittany: 'Bretagne', Normandy: 'Normandie', Occitania: 'Occitanie', 'Ile-de-France': 'Île-de-France' };
const frRegion = (r) => REGION_FR[r] || r;

// Fiabilité croisée annonces Airbnb × ventes DVF (Efficity = pas de ventes -> sur annonces seules).
//   forte  : ≥50 annonces & ≥50 ventes
//   bonne  : ≥30 annonces & ≥30 ventes
//   faible : >5 annonces & >10 ventes (seuil d'inclusion au classement)
//   null   : non classable (reste dans la searchbox, hors classement)
const tierFn = (ann, ventes, isEfficity) => {
  const v = isEfficity ? Infinity : (ventes || 0);
  if (ann >= 50 && v >= 50) return 'forte';
  if (ann >= 30 && v >= 30) return 'bonne';
  if (ann > 5 && v > 10) return 'faible';
  return null;
};

const raw = JSON.parse(readFileSync(IN, 'utf8'));
const villes = raw.map((c) => ({
  slug: slug(c.locality),
  ville: c.locality,
  region: frRegion(c.region),
  region_slug: slug(frRegion(c.region)),
  annonces: c.listings,
  occupation: c.occupancy != null ? +(c.occupancy * 100).toFixed(0) : null,
  prix_nuit: c.adr,            // ADR -> "prix moyen par nuit*"
  rev_par: c.rev_par,
  revenu_annuel: c.revenu_annuel,
  prix_m2: c.prix_m2,
  prix_source: c.prix_source,  // 'DVF' | 'Efficity' | null
  dvf_n_ventes: c.dvf_n_ventes,
  dvf_annees: c.dvf_annees,
  ratio: c.ratio,              // coût de revient (prix + 700€/m²)
  ratio_brut: c.ratio_brut,
  tier: tierFn(c.listings, c.dvf_n_ventes, c.prix_source === 'Efficity'),
  classable: c.ratio != null && tierFn(c.listings, c.dvf_n_ventes, c.prix_source === 'Efficity') != null,
}));

// dédup slug (ex. homonymes) : suffixe région si collision
const bySlug = {};
for (const v of villes) {
  if (bySlug[v.slug]) v.slug = `${v.slug}-${v.region_slug.split('-')[0]}`;
  bySlug[v.slug] = true;
}

// index régions
const regionsMap = {};
for (const v of villes) {
  (regionsMap[v.region_slug] ||= { region: v.region, slug: v.region_slug, villes: 0, classables: 0 });
  regionsMap[v.region_slug].villes++;
  if (v.classable) regionsMap[v.region_slug].classables++;
}
const regions = Object.values(regionsMap).sort((a, b) => b.classables - a.classables);

writeFileSync(OUT, JSON.stringify({ villes, regions, generatedFrom: 'DVF (DGFiP) + AirROI', count: villes.length }, null, 1));

const classables = villes.filter((v) => v.classable);
console.log(`Écrit ${OUT}`);
console.log(`  ${villes.length} villes au total | ${classables.length} classables | ${regions.length} régions`);
console.log(`  Top 5 régions par villes classables : ` + regions.slice(0, 5).map((r) => `${r.region}(${r.classables})`).join(', '));
console.log(`  Exemple slugs : ${classables.slice(0, 3).map((v) => '/rentabilite-airbnb/' + v.slug).join(', ')}`);
