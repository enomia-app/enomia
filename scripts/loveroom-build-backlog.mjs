#!/usr/bin/env node
/**
 * Construit le backlog des villes love room dans scripts/loveroom-cities.json depuis docs/research/loveroom-villes.csv.
 * - Les 15 villes déjà en data → status:"done" (région conservée).
 * - Les autres villes ≥ 100/mo (love room pur), hors régions/départements/bruit → status:"todo" (région auto-dérivée au sourcing).
 * Le cron prendra les "todo" par volume décroissant.
 *
 * Usage : node scripts/loveroom-build-backlog.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIN_VOL = 100;

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
function slugify(s) {
  return norm(s).replace(/'/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
const SMALL = new Set(['le', 'la', 'les', 'de', 'du', 'des', 'sur', 'sous', 'en', 'aux', 'au', 'et', 'lès', 'les', "d'", 'la']);
function titleCase(s) {
  return s.split(/([\s-])/).map((w, i) => {
    const lw = w.toLowerCase();
    if (/[\s-]/.test(w)) return w;
    if (i > 0 && SMALL.has(lw)) return lw;
    return lw.charAt(0).toUpperCase() + lw.slice(1);
  }).join('');
}

// Régions + départements + bruit à exclure (ce ne sont pas des villes)
const NOT_CITY = new Set([
  'normandie', 'bretagne', 'alsace', 'paca', 'occitanie', 'aquitaine', 'nouvelle aquitaine', 'ile france', 'ile de france', 'idf',
  'pays loire', 'pays de la loire', 'haut france', 'hauts france', 'grand est', 'bourgogne', 'franche comte', 'bourgogne franche comte',
  'centre val loire', 'auvergne', 'rhone alpes', 'auvergne rhone alpes', 'corse', 'lorraine', 'picardie', 'champagne', 'languedoc roussillon',
  'limousin', 'poitou charente', 'midi pyrenees', 'nord pas de calais', 'nord pas calais', 'nord-pas-de-calais (reg.)', 'provence', 'cote azur',
  'cote d azur', 'camargue', 'luberon', 'beaujolais', 'pays basque', 'artois', 'val loire', 'bord mer', 'baie somme', 'mont blanc', 'montagne',
  'sud', 'nord', 'est', 'ouest', 'sud france', 'sud ouest', 'sud est', 'nord calais', 'france', 'cote opale', 'haut de-france', 'ile-de-france',
  'var', 'vendee', 'vosges', 'herault', 'gard', 'morbihan', 'finistere', 'dordogne', 'calvados', 'savoie', 'haute savoie', 'moselle',
  'ille vilaine', 'gironde', 'oise', 'vaucluse', 'cotes armor', 'drome', 'sarthe', 'alpes maritimes', 'essonne', 'ardeche', 'manche', 'jura',
  'ardennes', 'haut rhin', 'bas rhin', 'loiret', 'landes', 'maine loire', 'seine marne', 'seine maritime', 'bouches rhone', 'bouche rhone',
  'loire atlantique', 'charente maritime', 'charente', 'tarn', 'puy dome', 'ain', 'lot garonne', 'meurthe moselle', 'aude', 'yvelines', 'aisne',
  'aveyron', 'cote or', 'haute garonne', 'eure', 'mayenne', 'orne', 'yonne', 'somme', 'ariege', 'allier', 'lot', 'doubs', 'cantal', 'gers',
  'eure loir', 'tarn garonne', 'vienne', 'indre loire', 'indre', 'haute vienne', 'hautes alpes', 'deux sevres', 'haute marne', 'rhone', 'isere',
  'marne', 'aube', 'haute loire', 'haute saone', 'correze', 'meuse', 'creuse', 'hautes pyrenees', 'pyrenees orientales', 'alpes haute provence',
  'loire', 'val oise', 'sevres', 'saone loire', 'haute', 'loir', 'maine', 'tarn et garonne', 'puy de dome',
]);
const NOISE = /^(est quoi|qu est|qu ce|bdsm|porn|porno|sexe|sex|the|and|my|moi|quoi|location|louer|photos?|experience|grand|nuances|cupidon|piece secrete|nuance grey|loveroom|loverooms?|roomer|mb etoiles|strasbourg yellow|private places|indiscrete|bliss|apogee|espace evasions|cocon enchanteur|boudoir cormelles|bouddha bleu|bayeuzen|croix saint andre|studios longeville|maison defendue|tantra|bdsm.*|.*\bsexe?\b.*)/;

const csv = fs.readFileSync(path.join(ROOT, 'docs/research/loveroom-villes.csv'), 'utf8').trim().split('\n').slice(1);
const citiesPath = path.join(ROOT, 'scripts/loveroom-cities.json');
const existing = JSON.parse(fs.readFileSync(citiesPath, 'utf8'));
const existingSlugs = new Set(existing.map((c) => c.slug));

// 15 actuelles → status done
const done = existing.map((c) => ({ ...c, status: 'done' }));

// Backlog depuis CSV
const seen = new Set(existingSlugs);
const todo = [];
for (const line of csv) {
  const [, ville, volLove] = line.split(';');
  const vol = parseInt(volLove) || 0;
  if (vol < MIN_VOL) continue;
  const n = norm(ville);
  if (NOT_CITY.has(n) || NOISE.test(n) || n.includes('(reg') || n.length < 3) continue;
  if (/\d/.test(n) && !/saint|sables/.test(n)) continue; // fragments numériques
  const slug = slugify(ville);
  if (!slug || seen.has(slug)) continue;
  seen.add(slug);
  todo.push({ slug, displayName: titleCase(ville), searchVolume: vol, status: 'todo' });
}
todo.sort((a, b) => b.searchVolume - a.searchVolume);

const all = [...done, ...todo];
fs.writeFileSync(citiesPath, JSON.stringify(all, null, 2) + '\n');
console.log(`✅ loveroom-cities.json : ${done.length} done + ${todo.length} todo = ${all.length} villes`);
console.log(`Top 15 todo :`);
todo.slice(0, 15).forEach((c) => console.log(`  ${String(c.searchVolume).padStart(5)} · ${c.slug}`));
console.log(`… queue : ${todo.slice(-6).map((c) => c.slug).join(', ')}`);
