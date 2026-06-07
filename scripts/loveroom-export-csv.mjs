#!/usr/bin/env node
/**
 * Nettoyage final + export CSV décisionnel du potentiel love room par ville.
 * Lit /tmp/loveroom-villes-final.json, fusionne les variantes/typos, retire le bruit,
 * écrit docs/research/loveroom-villes.csv (triable dans Excel/Numbers).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const cities = JSON.parse(readFileSync('/tmp/loveroom-villes-final.json', 'utf-8'));

// Fusion de variantes (article manquant, typo, abréviation) → nom canonique
const ALIAS = {
  'havre': 'le havre', 'mans': 'le mans', 'rochelle': 'la rochelle',
  'roche yon': 'la roche-sur-yon', 'roche-sur-yon': 'la roche-sur-yon',
  'aix provence': 'aix-en-provence', 'aix-en-provence': 'aix-en-provence',
  'aix bains': 'aix-les-bains', 'st malo': 'saint-malo', 'saint malo': 'saint-malo',
  'st etienne': 'saint-etienne', 'saint etienne': 'saint-etienne', 'saint-etienne': 'saint-etienne',
  'anger': 'angers', 'poitier': 'poitiers', 'bezier': 'beziers', 'bezier': 'beziers',
  'sable olonne': 'sables-d-olonne', 'sables olonne': 'sables-d-olonne',
  'cap agde': 'cap-d-agde', 'grau roi': 'le grau-du-roi', 'baule': 'la baule',
  'mont marsan': 'mont-de-marsan', 'puy velay': 'le puy-en-velay', 'clermont': 'clermont-ferrand',
  'clermont ferrand': 'clermont-ferrand', 'isle sorgue': "l'isle-sur-la-sorgue",
  'nord calais': 'nord-pas-de-calais (rég.)',
};

// Bruit à exclure (fragments de requête, marques, adulte, génériques)
const NOISE = new Set([
  'est quoi', 'qu est ce qu', 'france', 'sud', 'nord', 'sud france', 'sud ouest', 'passage',
  'strasbourg yellow', 'private places orleans', 'mb etoiles var', 'indiscrete tours', 'bliss langres',
  'apogee', 'espace evasions', 'cocon enchanteur experience enchanteresse bretagne', 'maucomble',
  'boudoir cormelles caen normandie', 'bouddha bleu hebergements morbihan', 'bayeuzen normandie calvados',
  'croix saint andre utilisation', 'studios longeville saint avold', 'bdsm paris', 'bdsm lyon',
  'bdsm desirs grassoise', 'bdsm desirs nice', 'bdsm luxe desirs nice', 'bdsm bretagne',
  'croix saint andre', 'lyon journee', 'marseille journee', 'crémieu',
]);

const merged = new Map();
for (const c of cities) {
  if (NOISE.has(c.loc)) continue;
  const name = ALIAS[c.loc] || c.loc;
  if (!merged.has(name)) merged.set(name, { name, loveVol: 0, jacVol: 0, kds: [], loveKw: 0 });
  const m = merged.get(name);
  m.loveVol += c.loveVol;
  m.jacVol += c.jacVol;
  m.loveKw += c.loveKw;
  if (c.avgKd != null) m.kds.push(c.avgKd);
}

const out = [...merged.values()]
  .map((m) => ({
    name: m.name,
    loveVol: m.loveVol,
    jacVol: m.jacVol,
    total: m.loveVol + m.jacVol,
    kd: m.kds.length ? Math.round((m.kds.reduce((s, d) => s + d, 0) / m.kds.length)) : '',
    loveKw: m.loveKw,
  }))
  .filter((m) => m.loveVol >= 50)
  .sort((a, b) => b.loveVol - a.loveVol);

mkdirSync('docs/research', { recursive: true });
const rows = ['rang;ville;vol_love_room;vol_chambre_jacuzzi;vol_total;kd_moyen;nb_kw_love'];
out.forEach((m, i) => rows.push(`${i + 1};${m.name};${m.loveVol};${m.jacVol};${m.total};${m.kd};${m.loveKw}`));
writeFileSync('docs/research/loveroom-villes.csv', rows.join('\n'));

const sum = (f) => out.reduce((s, m) => s + f(m), 0);
console.log(`✅ docs/research/loveroom-villes.csv — ${out.length} villes (vol love room ≥ 50/mois)`);
console.log(`   ≥ 100/mois : ${out.filter((m) => m.loveVol >= 100).length} villes`);
console.log(`   ≥ 300/mois : ${out.filter((m) => m.loveVol >= 300).length} villes`);
console.log(`   ≥ 1000/mois: ${out.filter((m) => m.loveVol >= 1000).length} villes`);
console.log(`   Volume love room cumulé (villes nettoyées) : ${sum((m) => m.loveVol)}/mois`);
console.log(`   Volume jacuzzi cumulé                      : ${sum((m) => m.jacVol)}/mois`);
console.log(`\nTop 40 :`);
console.log('rang | love | jacz | KD | ville');
out.slice(0, 40).forEach((m, i) =>
  console.log(`${String(i + 1).padStart(4)} | ${String(m.loveVol).padStart(4)} | ${String(m.jacVol).padStart(4)} | ${String(m.kd).padStart(2)} | ${m.name}`)
);
