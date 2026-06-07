#!/usr/bin/env node
/**
 * Analyse le dump SEMrush /tmp/loveroom-keywords.json :
 *  - sépare le cluster LOVE ROOM (pur) du cluster CHAMBRE JACUZZI (adjacent)
 *  - classe chaque localisation : VILLE / RÉGION / DÉPARTEMENT / ÉTRANGER / BRUIT
 *  - agrège le volume + KD par localisation, par cluster
 *
 * Sorties :
 *  /tmp/loveroom-villes-final.json  (villes FR, vol love room + vol jacuzzi + KD)
 *  /tmp/loveroom-regions-final.json (régions + départements)
 */

import { readFileSync, writeFileSync } from 'fs';

const KW = JSON.parse(readFileSync('/tmp/loveroom-keywords.json', 'utf-8'));

function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ').replace(/[-\s]+/g, ' ').trim();
}

// ─── Régions (actuelles + anciennes + zones géo courantes) ─────────
const REGIONS = new Set([
  'normandie', 'basse normandie', 'haute normandie', 'bretagne', 'alsace', 'paca',
  'provence alpes cote dazur', 'provence alpes cote d azur', 'occitanie', 'aquitaine',
  'nouvelle aquitaine', 'ile france', 'ile de france', 'idf', 'pays loire', 'pays de la loire',
  'haut france', 'hauts france', 'haut de france', 'hauts de france', 'grand est', 'bourgogne',
  'franche comte', 'bourgogne franche comte', 'centre val loire', 'centre val de loire', 'auvergne',
  'rhone alpes', 'auvergne rhone alpes', 'corse', 'lorraine', 'picardie', 'champagne',
  'champagne ardennes', 'champagne ardenne', 'languedoc roussillon', 'limousin', 'poitou charente',
  'poitou charentes', 'midi pyrenees', 'nord pas de calais', 'nord pas calais', 'provence',
  'cote azur', 'cote d azur', 'camargue', 'luberon', 'beaujolais', 'pays basque', 'artois',
  'val loire', 'bord mer', 'bord de mer', 'cote opale', 'baie somme', 'mont blanc', 'montagne',
  'bassin arcachon', 'drome ardeche', 'gard herault', 'poitou', 'languedoc',
]);

// ─── Départements (101, normalisés, avec variantes sans "et"/"de") ──
const DEPTS = new Set([
  'var', 'vendee', 'vosges', 'herault', 'gard', 'morbihan', 'finistere', 'dordogne', 'calvados',
  'savoie', 'haute savoie', 'moselle', 'ille vilaine', 'ille et vilaine', 'gironde', 'oise', 'vaucluse',
  'cotes armor', 'cotes d armor', 'drome', 'sarthe', 'alpes maritimes', 'essonne', 'ardeche', 'manche',
  'jura', 'ardennes', 'haut rhin', 'bas rhin', 'loiret', 'landes', 'maine loire', 'maine et loire',
  'seine marne', 'seine et marne', 'seine maritime', 'bouche rhone', 'bouches rhone', 'bouches du rhone',
  'loire atlantique', 'charente maritime', 'charente', 'tarn', 'puy dome', 'puy de dome', 'ain',
  'lot garonne', 'lot et garonne', 'meurthe moselle', 'aude', 'yvelines', 'aisne', 'aveyron', 'cote or',
  'cote d or', 'haute garonne', 'eure', 'mayenne', 'orne', 'yonne', 'somme', 'ariege', 'allier', 'lot',
  'doubs', 'cantal', 'gers', 'eure loir', 'eure et loir', 'tarn garonne', 'tarn et garonne', 'vienne',
  'indre loire', 'indre et loire', 'indre', 'haute vienne', 'hautes alpes', 'deux sevres', 'haute marne',
  'rhone', 'isere', 'marne', 'aube', 'haute loire', 'haute saone', 'correze', 'meuse', 'creuse',
  'hautes pyrenees', 'pyrenees orientales', 'pyrenees atlantiques', 'alpes haute provence', 'loire',
  'nievre', 'val oise', 'val d oise', 'territoire belfort', 'loir', 'sevres', 'saone loire', 'haute',
]);

// ─── Étranger ───────────────────────────────────────────────────────
const FOREIGN = new Set([
  'belgique', 'espagne', 'barcelone', 'amsterdam', 'geneve', 'luxembourg', 'andorre', 'andorre vieille',
  'andorre la vieille', 'bruxelles', 'suisse', 'allemagne', 'italie', 'londres', 'london', 'madrid',
  'milan', 'lisbonne', 'rome', 'san sebastian', 'portugal', 'japon', 'manchester', 'monaco', 'lausanne',
  'liege', 'tournai', 'mons', 'ostende', 'bruges', 'costa brava', 'espagne costa brava', 'borabora',
  'tijugo', 'limousin',
]);

// ─── Bruit (fragments de modificateurs, adulte, marques, génériques) ─
const NOISE = new Set([
  'moi', 'quoi', 'toi', 'my', 'the', 'and', 'for', 'in paris', 'chez moi', 'journee moi', 'hote moi',
  'location moi', 'piece secrete moi', 'mieux notes', 'moi mieux notes', 'journee', 'heure', 'apres midi',
  'week end', 'weekend', 'derniere minute', 'location', 'louer', 'site', 'photo', 'photos', 'box', 'deco',
  'decoration', 'definition', 'def', 'experience', 'idee', 'creer', 'faire chez soi', 'mobilier', 'lit',
  'fauteuil', 'fauteuil tantra', 'balancoire', 'miroir plafond', 'cheminee', 'accessoire', 'accessoires',
  'amenagement', 'interieure', 'charme', 'chic', 'luxury', 'luxe', 'glamour', 'cocon', 'parenthese',
  'evasion', 'escapade', 'petite escapade', 'parisienne', 'parisien', 'grand', 'grand rex', 'grand motte',
  'grande motte', 'tour', 'cheque vacances', 'massage', 'tantra', 'fauteuil', 'oz', 'jungle', 'rouge',
  'croix', 'fleche', 'jo', 'rove', 'mure', 'etrat', 'oz', 'personnes', 'duo',
  // adulte / explicite
  'bdsm', 'porn', 'porno', 'sexe', 'sex', 'sexuel', 'and sex', 'erotique', 'erotika', 'sm', 'hard',
  'baise', 'dark', 'hot', 'cupidon', 'piece secrete', 'nuances', 'nuances grey', 'nuance grey',
  'nuances grey lyon', 'nuances grey paca', 'fifty', 'and', 'matic', 'love o matic', 'lover', 'loves',
  'loveroomer', 'loveroomers', 'roomer', 'roomers', 'loverooms', 'cesarine', 'chaines passions',
  'quart heure americain', '7eme ciel', 'amour amour', 'cupidon vesoul', 'jeux', 'paris jeux sexe',
  'nuances plaisir', 'chuttt', 'elixir', 'delices', 'anastasia', 'apparenthese', 'impertinente',
  'home paradise', 'villa cocoon', 'secrets eden ose', 'intime sens loveshop sexe shop', 'loveshop',
  'pigalle', 'chatelet', 'grand', 'qu ce qu', 'dhote', 'dhotel', 'dhotes', 'hote', 'hotes', 'hote charme',
  'piece secrete bretagne', 'piece secrete normandie', 'piece secrete occitanie', 'very good trip',
  'rbnb', 'roomer', 'apparenthese poitiers', 'lovt', 'lovt nantes', 'ignite', 'ignite nantes',
  'everbliss', 'everbliss lille', 'private places', 'jol', 'jol troyes themes', 'sensual', 'sensual nancy',
  'attitude', 'attitude grenoble', 'garconn', 'garconn hyeres', 'secret nantes', 'secrets narbonne',
  'secrets perpignan', 'secrets castel epfig alsace', 'cote secret', 'maison defendue instant suspendu',
  'bayeuzen', 'tantra miramas', 'by pimente ton', 'metz atelier reves', 'clos lys hotes', 'absolu vendee',
  'intimiste vendee', 'etoilee vendee', 'rouge var', 'hote var', 'hote herault', 'hote normandie',
  'hote touquet', 'hotes paca', 'hote moi', 'troglodyte', 'piece', 'secret', 'secrets', 'private',
  'romantik', 'spa privatif', 'jacuzzi privatif', 'avec jacuzzi', 'romantique', 'incontournable',
  'aventure', 'createur aventure', 'var createur aventure', 'narbonnaise', 'cadurcienne', 'appartose',
  'roomers', 'loveroom limoges', 'love o matic',
]);

// strip ces tokens du KW pour isoler la localisation
const STRIP = new Set([
  'love', 'room', 'loveroom', 'rooms', 'chambre', 'chambres', 'avec', 'sans', 'et', 'ou', 'de', 'du',
  'des', 'le', 'la', 'les', 'l', 'd', 'a', 'au', 'aux', 'en', 'pour', 'un', 'une', 'dans', 'sur', 'pres',
  'proche', 'autour', 'alentour', 'alentours', 'jacuzzi', 'jacuzzis', 'spa', 'privatif', 'privative',
  'privatifs', 'prive', 'privee', 'privees', 'baignoire', 'balneo', 'piscine', 'sauna', 'hammam', 'bain',
  'nuit', 'nuits', 'insolite', 'insolites', 'sejour', 'week', 'end', 'weekend', 'hotel', 'hotels', 'motel',
  'suite', 'suites', 'gite', 'gites', 'appartement', 'studio', 'loft', 'prix', 'pas', 'cher', 'chere',
  'tarif', 'reservation', 'booking', 'airbnb', 'couple', 'amoureux', 'coquin', 'coquine', 'sexy',
  'centre', 'ville', 'proximite', 'region', 'photos', 'photo', '2h', 'pour 2', 'romantique', 'romantiques',
]);

function extractLoc(phrase) {
  const tokens = norm(phrase).split(' ').filter(Boolean);
  const kept = tokens.filter((t) => !STRIP.has(t) && t.length > 1 && !/^\d+$/.test(t));
  return kept.join(' ').trim();
}

function classify(loc) {
  if (!loc) return 'NATIONAL';
  if (REGIONS.has(loc)) return 'REGION';
  if (DEPTS.has(loc)) return 'DEPT';
  if (FOREIGN.has(loc)) return 'FOREIGN';
  if (NOISE.has(loc)) return 'NOISE';
  return 'CITY';
}

const isLove = (p) => /love\s*room|loveroom/i.test(p);
const isJacuzzi = (p) => /jacuzzi/i.test(p);

// ─── Agrégation ─────────────────────────────────────────────────────
const buckets = {}; // key=class, val=Map(loc -> data)
for (const k of ['CITY', 'REGION', 'DEPT', 'FOREIGN']) buckets[k] = new Map();
let nationalLove = 0, nationalJac = 0;

for (const k of KW) {
  const loc = extractLoc(k.phrase);
  const cls = classify(loc);
  const love = isLove(k.phrase);
  const jac = isJacuzzi(k.phrase) && !love; // pur jacuzzi (pas déjà compté love)
  if (cls === 'NATIONAL') { if (love) nationalLove += k.vol; else if (jac) nationalJac += k.vol; continue; }
  if (cls === 'NOISE') continue;
  const m = buckets[cls];
  if (!m.has(loc)) m.set(loc, { loc, loveVol: 0, jacVol: 0, loveKw: 0, jacKw: 0, kds: [], topLove: [], topJac: [] });
  const e = m.get(loc);
  if (love) { e.loveVol += k.vol; e.loveKw++; e.topLove.push({ p: k.phrase, v: k.vol, kd: k.kd }); if (k.kd > 0) e.kds.push(k.kd); }
  else if (jac) { e.jacVol += k.vol; e.jacKw++; e.topJac.push({ p: k.phrase, v: k.vol, kd: k.kd }); }
}

function finalize(m) {
  return [...m.values()].map((e) => ({
    loc: e.loc,
    loveVol: e.loveVol,
    jacVol: e.jacVol,
    total: e.loveVol + e.jacVol,
    loveKw: e.loveKw,
    avgKd: e.kds.length ? Math.round((e.kds.reduce((s, d) => s + d, 0) / e.kds.length) * 10) / 10 : null,
    minKd: e.kds.length ? Math.min(...e.kds) : null,
    topLove: e.topLove.sort((a, b) => b.v - a.v).slice(0, 3),
  }));
}

const cities = finalize(buckets.CITY).sort((a, b) => b.loveVol - a.loveVol || b.total - a.total);
const regions = finalize(buckets.REGION).sort((a, b) => b.loveVol - a.loveVol);
const depts = finalize(buckets.DEPT).sort((a, b) => b.loveVol - a.loveVol);

writeFileSync('/tmp/loveroom-villes-final.json', JSON.stringify(cities, null, 2));
writeFileSync('/tmp/loveroom-regions-final.json', JSON.stringify({ regions, depts }, null, 2));

// ─── Affichage ──────────────────────────────────────────────────────
const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
const citiesLove100 = cities.filter((c) => c.loveVol >= 100);
const citiesLove50 = cities.filter((c) => c.loveVol >= 50);

console.log('═══════════════════════════════════════════════════════════════');
console.log(' CLUSTER LOVE ROOM — POTENTIEL FRANCE');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`\n📊 Volume "love room" national (sans ville) : ${nationalLove}/mois`);
console.log(`📊 Volume "chambre jacuzzi" national        : ${nationalJac}/mois`);
console.log(`\n🏙️  VILLES :`);
console.log(`   • ${cities.length} villes avec du volume love room ou jacuzzi`);
console.log(`   • ${citiesLove100.length} villes ≥ 100/mois sur LOVE ROOM pur`);
console.log(`   • ${citiesLove50.length} villes ≥ 50/mois sur LOVE ROOM pur`);
console.log(`   • Volume love room cumulé (villes)    : ${sum(cities, (c) => c.loveVol)}/mois`);
console.log(`   • Volume jacuzzi cumulé (villes)       : ${sum(cities, (c) => c.jacVol)}/mois`);

console.log(`\n━━━ TOP VILLES par volume LOVE ROOM pur (≥ 50/mois) ━━━`);
console.log('loveRoom | jacuzzi |  total | KDmoy | KDmin | ville');
console.log('---------|---------|--------|-------|-------|' + '-'.repeat(22));
for (const c of citiesLove50) {
  console.log(
    `${String(c.loveVol).padStart(8)} | ${String(c.jacVol).padStart(7)} | ${String(c.total).padStart(6)} | ` +
    `${String(c.avgKd ?? '-').padStart(5)} | ${String(c.minKd ?? '-').padStart(5)} | ${c.loc}`
  );
}

console.log(`\n━━━ RÉGIONS (hub pages potentielles) ━━━`);
console.log('loveRoom | jacuzzi | région');
console.log('---------|---------|' + '-'.repeat(25));
for (const r of regions.filter((r) => r.total >= 100)) {
  console.log(`${String(r.loveVol).padStart(8)} | ${String(r.jacVol).padStart(7)} | ${r.loc}`);
}

console.log(`\n━━━ DÉPARTEMENTS (top 15) ━━━`);
console.log('loveRoom | jacuzzi | département');
console.log('---------|---------|' + '-'.repeat(25));
for (const d of depts.filter((d) => d.total >= 100).slice(0, 15)) {
  console.log(`${String(d.loveVol).padStart(8)} | ${String(d.jacVol).padStart(7)} | ${d.loc}`);
}

console.log(`\n→ /tmp/loveroom-villes-final.json  +  /tmp/loveroom-regions-final.json`);
