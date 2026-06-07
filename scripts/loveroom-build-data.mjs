#!/usr/bin/env node
/**
 * Curate les candidats Places (/tmp/loveroom-source-*.json) → génère src/data/loveRoomListings.ts.
 *
 * - Curation : confiance high + type hébergement (ou nom) + note ≥ 4 + ≥ 10 avis + non-générique, dédup, top 8/ville.
 * - Nom + description : map curée par ville (la "passe IA" — descriptions factuelles rédigées depuis les vrais avis).
 * - Prix : grille annuaire (matching flou).
 * - URL : on garde le site DIRECT du proprio ; on retire les liens d'annuaire/OTA (nuitetspa, booking, airbnb…).
 * - Avis : Google Places (max 5 via l'API), filtrés ≥ 4★, affichés avec attribution.
 *
 * Usage : node scripts/loveroom-build-data.mjs
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, '.loveroom-cache');
const SLUGS = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/loveroom-cities.json'), 'utf8'))
  .map((c) => c.slug)
  .filter((slug) => fs.existsSync(path.join(CACHE, `loveroom-source-${slug}.json`))); // ne builder que les villes sourcées
const CITY_RADIUS = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/loveroom-cities.json'), 'utf8')).map((c) => [c.slug, c.radiusKm || 50]));
function persistRadius(slug, r) {
  const p = path.join(ROOT, 'scripts/loveroom-cities.json');
  const l = JSON.parse(fs.readFileSync(p, 'utf8'));
  const e = l.find((c) => c.slug === slug);
  if (e && e.radiusKm !== r) { e.radiusKm = r; fs.writeFileSync(p, JSON.stringify(l, null, 2) + '\n'); }
}
const TARGET_ROOMS = 8;
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const score = (c) => (c.rating || 0) * Math.log10((c.reviews || 0) + 1);

// Liens à NE PAS utiliser comme "résa directe" (annuaires / OTA / agrégateurs)
const DIRECTORY_HOSTS = /nuitetspa|lovenspa|loveroomers|weekendlove|sunday\.love|booking\.|airbnb\.|abritel|tripadvisor|expedia|hotels\.com|lastminute/i;

const DIR_PRICES = {
  lyon: [[/perceval/, 250], [/cabaret/, 200], [/cocon|hygge/, 190], [/boudoir/, 180], [/boat/, 170], [/sweet\s*dream/, 150], [/mojo/, 320], [/red room/, 280]],
  paris: [[/lodge|jungle/, 199], [/spa.?tio/, 195], [/bali/, 169], [/secret de paris|moulin rouge/, 198], [/new york|cinema|cinéma/, 120], [/sansonnet/, 220], [/majorelle|riad/, 260], [/love capsule/, 180]],
  lille: [[/glamour|avec toi/, 130], [/fine bulle/, 170], [/ga[ïi]a/, 190], [/folie 20/, 189], [/moon/, 198], [/private room 28/, 199], [/spalace/, 220], [/quart d.?heure/, 420]],
};

// Map curée : [regex sur nom normalisé, nom d'affichage propre, description factuelle (rédigée depuis les avis)]
const CURATED = {
  lyon: [
    [/la parenthese/, 'La Parenthèse', "Maison d'hôtes familiale tenue par Maxime et son équipe, saluée pour son accueil chaleureux et son souci du détail. Chambre romantique avec jacuzzi et sauna, massages en option et petit déjeuner soigné, pour une parenthèse à deux au calme."],
    [/experience love room/, "L'Expérience Love Room", "Love rooms à thème (Amazonie, Bali, jungle) à la décoration immersive très travaillée : fleurs suspendues au-dessus du lit, guirlandes lumineuses et bain à remous. Chaque chambre a sa terrasse privative ; packs décoration en option pour une nuit spectaculaire."],
    [/sweet\s*dream/, 'Sweet Dreams Jacuzzi', "Chambre soignée avec balnéo digne d'un spa, jeux de lumière d'ambiance et décoration très réussie, dans un cadre calme. Hôtes disponibles, petit déjeuner et options gourmandes pour un moment cocooning à deux."],
    [/oriental et bali/, 'Oriental & Bali Spa', "Appartement dépaysant aux ambiances orientale et balinaise, avec jacuzzi et hammam privatifs. Propreté irréprochable et atmosphère raffinée pour une détente absolue, à 25 minutes de Lyon."],
    [/lyon campagne/, 'Lyon Campagne', "Maison d'hôtes rurale haut de gamme : suites avec terrasse, cheminée et bain à remous, table d'hôtes et petit déjeuner de niveau, massages en duo. Un coin de paradis au calme à 20 minutes de Lyon."],
    [/bulle de reves/, 'Bulle de Rêves', "Adresse chaleureuse tenue par Anthony et Sandrine, à l'accueil familial très apprécié. Spa privatif jusqu'à 4 places, ambiance cocooning, planches apéritives et massages en option, à 10 minutes du Village des Marques."],
    [/la terre et l/, "La Terre et l'Air", "Chambres à thème à la décoration soignée, avec jacuzzi et home cinéma pour une soirée cosy et intime. Nombreuses options personnalisables (mignardises, déco) pour un moment hors du temps."],
    [/boat spa/, 'Le Boat Spa', "Chambre sur le thème nautique au cœur de Lyon, ambiance intimiste et jacuzzi privatif. Idéale pour une escapade romantique en ville, sans voiture."],
  ],
  paris: [
    [/clos des vignes/, 'Le Clos des Vignes', "Domaine haut de gamme avec suites à thème, restaurant, jacuzzi, piscine intérieure chauffée, sauna et hammam. Cadre exceptionnel et massages en option pour un week-end en amoureux à 45 minutes de Paris."],
    [/villa yucat/, 'Villa Yucatán', "Spa privatif très bien noté aux portes de Paris : jacuzzi, piscine et sauna impeccablement entretenus. Accueil souriant et professionnel pour une parenthèse détente d'exception à 20 minutes de la capitale."],
    [/bulles de paris/, 'Les Bulles de Paris', "Hôtel de charme du Quartier Latin avec chambres élégantes, espace spa (sauna, hammam, massages) et bar à champagne. Accueil chaleureux et emplacement central très calme, à deux pas du métro."],
    [/maison et detente/, 'Maison & Détente', "Espace détente cocooning avec grand jacuzzi et terrasse, au calme à la campagne briarde. Idéal pour une soirée à deux loin de l'agitation, à environ 50 minutes de Paris."],
    [/bubble home/, 'Bubble Home Paris', "Appartement lumineux avec jacuzzi privatif et décoration soignée, option déco romantique pour les occasions. Hôte sérieux et réactif, parfait pour un anniversaire ou une nuit à deux dans l'Essonne."],
    [/colibri/, "Domaine l'Instant du Colibri", "Domaine avec suites de charme à jacuzzi ou hammam privatifs, table soignée et propriétaires aux petits soins. Cadre calme et dépaysant pour un week-end romantique dans l'Oise."],
    [/spa de la lune/, 'Spa de la Lune', "Suite spa privative avec jacuzzi extérieur, sauna et vue dégagée sans vis-à-vis pour profiter du ciel étoilé. Équipement complet (boissons, enceinte, en-cas) et accueil attentionné aux portes de Paris."],
    [/parenthese love/, 'Parenthèse Love', "Love room avec balnéo et ambiance Bali, à la décoration très soignée. Arrivée autonome fluide, calme et intimité garantis pour un moment à deux, au sud de Paris."],
  ],
  lille: [
    [/tropical spa/, 'Tropical Spa', "Love room avec spa privatif et sauna, à la décoration intérieure et extérieure très soignée, en journée, soirée ou nuit. Accueil chaleureux avec explications, propreté irréprochable, options déco et planches gourmandes."],
    [/suite & spa lille/, 'Suite & Spa Lille', "Espaces spa privatifs à thème (Bora Bora…) en plein Lille, pour deux ou en petit groupe. Lieu beau et bien entretenu, personnel accueillant, massages disponibles sur place."],
    [/effet spa/, "Hôtel L'Effet Spa", "Chambres et suites avec jacuzzi (et sauna) privatifs, en nuitée ou en day-use. Véritable cocon de bien-être impeccable, massages en duo et petit déjeuner soigné, accueil très professionnel."],
    [/cottages du parc/, 'Les Cottages du Parc', "Cottages privatisables (scandinave…) avec spa, à l'ambiance cosy et à la déco soignée, à 10 minutes de Lille. Accueil chaleureux d'Antoine et petit déjeuner complet."],
    [/casa suite/, 'Casā Suite & Spa', "Suites à thème (Cabaña, Palma) au design léché (béton ciré), avec jacuzzi et sauna privatifs. Literie confortable, lieu calme et spacieux, équipe réactive et explications détaillées avant l'arrivée."],
    [/spalace/, 'Spalace', "Chambres d'hôtes de luxe avec sauna et jacuzzi privatifs, très spacieuses et impeccables. Cocktail de bienvenue, petit déjeuner au top et décoration magnifique pour un moment inoubliable."],
    [/diable des plaisirs/, 'Ô Diable des Plaisirs', "Suite avec spa privatif pensée pour sortir de la routine : espace lumineux, coin cuisine pour un huis clos total, déco de goût. Calme et propre, idéal pour un week-end à deux à Tourcoing."],
    [/quart d.?heure/, "Le Quart d'Heure Américain", "Loft de charme à thème avec jacuzzi privatif et parc privé, pensé dans les moindres détails. Propriétaires Céline et Olivier aux petits soins pour une expérience romantique haut de gamme."],
  ],
};

const LODGING = /lodging|bed_and_breakfast|hotel|guest_house|resort_hotel|cottage|inn|motel|farm_stay|hostel|campground/;
// Nom indiquant une NUITÉE (le mot "spa" seul ne suffit pas → exclut les day-spas qui squattent par volume d'avis)
const NAME_LODGING = /love\s?room|suite|chambre|nuit|g[îi]te|maison|villa|loft|cabane|appart|h[ôo]tel|b ?& ?b|boudoir|domaine|cottage|lodge|évasion|evasion|parenthèse|parenthese/i;
const JUNK = /^tarif\b|^love\s?room in paris$|^la suite$|^spa center|^private room$|spa jacuzzi$|^love room spa/i;

// ⚠️ RÈGLE DURE : que des love rooms — exclut hôtels, restaurants, vie nocturne et day-spas/instituts.
const SLEEP_TYPES = ['lodging', 'bed_and_breakfast', 'guest_house', 'cottage', 'inn', 'farm_stay', 'campground'];
// NB: le type `hotel` seul ne suffit PAS à exclure (Google tague souvent les petits B&B love rooms 'hotel').
// Un vrai hôtel-complexe a resto / bar / night-club, ou « Hôtel/Hostellerie » dans le nom (NAME_BAD).
const COMPLEX_TYPES = /night_club|restaurant|casino|\bbar\b|lounge_bar/i;
const DAYSPA_TYPES = /massage|public_bath|beauty_salon|wellness|physiotherap|hair_care|nail_salon|gym/i; // institut / day-spa
const NAME_BAD = /h[ôo]tel|hostellerie|restaurant|brasserie|camping|r[ée]sidence/i;
const OVERNIGHT_NAME = /love\s?room|loveroom|chambre|suite|nuit|g[îi]te|villa|appart|loft|maison|nid|cocon|domaine|bulle|escale|parenth|boudoir|s[ée]jour|insolite/i;
const OVERNIGHT_REVIEW = /\bnuit|s[ée]jour|week.?end|dormi|petit.?d[ée]jeuner|nuit[ée]e|chambre|cocon|escapade/i;
function isLoveRoom(c) {
  const types = c.types || [];
  if (NAME_BAD.test(c.name)) return false; // nom = hôtel / resto → out
  if (types.some((t) => COMPLEX_TYPES.test(t))) return false; // resto / bar / night-club = hôtel-complexe → out
  const hasSleep = types.some((t) => SLEEP_TYPES.includes(t));
  if (types.some((t) => DAYSPA_TYPES.test(t)) && !hasSleep) return false; // day-spa / institut sans couchage → out
  // garder seulement si une NUITÉE est évoquée (type couchage, nom évocateur, ou avis parlant de nuit/séjour)
  const reviewText = (c.recentReviews || []).map((r) => r.text).join(' ');
  return hasSleep || OVERNIGHT_NAME.test(c.name) || OVERNIGHT_REVIEW.test(reviewText);
}

const FOUND = {}; // nb de love rooms recensées (candidates plausibles) par ville

// Nettoie un nom SEO-bourré → garde la marque en tête (UX titre).
function cleanName(n) {
  let s = n.replace(/\s*[-|/–]\s*(by\s+nuit.*|booking.*|airbnb.*|abritel.*|reserv\w*.*|réserv\w*.*|site officiel.*)$/i, '').trim();
  s = s.split(/\s*[:|]\s*|\s[-–]\s|\s\/\s|,/)[0].trim();
  if (s.length > 48) s = s.slice(0, 48).replace(/\s+\S*$/, '').trim() + '…';
  if (s.length < 3) s = n.split(/[,:|]/)[0].trim().slice(0, 48);
  return s;
}

function featuresOf(text) {
  const f = ['Spa ou jacuzzi privatif'];
  if (/sauna/i.test(text)) f.push('Sauna');
  if (/hammam/i.test(text)) f.push('Hammam');
  if (/piscine|pool/i.test(text)) f.push('Piscine');
  if (/baln[ée]o/i.test(text)) f.push('Balnéo');
  if (/terrasse/i.test(text)) f.push('Terrasse');
  if (/cin[ée]ma|home cinema/i.test(text)) f.push('Cinéma privé');
  return [...new Set(f)].slice(0, 5);
}
function priceOf(slug, name) {
  const n = norm(name);
  for (const [re, p] of (DIR_PRICES[slug] || [])) if (re.test(n)) return p;
  return undefined;
}
function curatedOf(slug, name) {
  const n = norm(name);
  for (const [re, disp, desc] of (CURATED[slug] || [])) if (re.test(n)) return { disp, desc };
  return null;
}

function curate(slug) {
  const file = path.join(CACHE, `loveroom-source-${slug}.json`);
  if (!fs.existsSync(file)) { console.warn(`⚠️ ${slug}: pas de source (${file}) — skip`); return []; }
  const cands = JSON.parse(fs.readFileSync(file, 'utf8'));
  FOUND[slug] = cands.filter((c) => c.confidence !== 'low').length;
  const aiFile = path.join(CACHE, `ai-${slug}.json`);
  const ai = fs.existsSync(aiFile) ? JSON.parse(fs.readFileSync(aiFile, 'utf8')) : {};
  const kept = cands.filter(
    (c) => c.confidence === 'high' && c.rating != null && c.rating >= 4.0 && (c.reviews || 0) >= 10 &&
      !JUNK.test(c.name.trim()) && isLoveRoom(c) && ai[c.name]?.love_room !== false // ← gate IA : vire hôtels/day-spas
  );
  const seen = new Set();
  const seenUrl = new Set();
  const dedup = [];
  for (const c of kept.sort((a, b) => score(b) - score(a))) {
    const key = norm(c.name).replace(/love room|loveroom|spa|jacuzzi|privatif|prive|lyon|paris|lille|by|le |la |les /g, '').replace(/[^a-z0-9]/g, '').slice(0, 10);
    const host = c.url ? (c.url.match(/\/\/([^/]+)/)?.[1] || '').replace(/^www\./, '') : '';
    if (seen.has(key) || (host && seenUrl.has(host))) continue;
    seen.add(key);
    if (host) seenUrl.add(host);
    dedup.push(c);
  }
  // Rayon ADAPTATIF : on élargit base → 100 → 150 km jusqu'à atteindre 8 rooms (essentiel petites villes).
  const baseR = CITY_RADIUS[slug] || 50;
  let effR = baseR;
  for (const r of [baseR, 100, 150]) { effR = r; if (dedup.filter((c) => c.distanceKm <= r).length >= TARGET_ROOMS) break; }
  persistRadius(slug, effR);
  return dedup.filter((c) => c.distanceKm <= effR).slice(0, TARGET_ROOMS).map((c) => {
    const cur = curatedOf(slug, c.name);
    const allText = `${c.name} ${c.summary || ''} ${(c.recentReviews || []).map((r) => r.text).join(' ')}`;
    const room = {
      name: cur ? cur.disp : cleanName(c.name),
      area: c.area || '',
      distanceKm: c.distanceKm,
      features: featuresOf(allText),
      vibe: `Love room avec spa ou jacuzzi privatif${c.area ? ' à ' + c.area : ''}`,
      rating: c.rating,
      reviews: c.reviews,
      source: 'Google Places',
    };
    const price = priceOf(slug, c.name);
    if (price) room.priceFrom = price;
    room.description = ai[c.name]?.description || (cur ? cur.desc : c.summary) || room.vibe; // ← desc rédigée par l'IA en priorité
    if (c.url && !DIRECTORY_HOSTS.test(c.url)) room.url = c.url;
    const revs = (c.recentReviews || []).filter((r) => r.text && r.text.length > 40 && (r.rating ?? 5) >= 4).slice(0, 5)
      .map((r) => ({ author: r.author || null, rating: r.rating ?? null, when: r.when || null, text: r.text.replace(/\s+/g, ' ').trim().slice(0, 320) }));
    if (revs.length) room.recentReviews = revs;
    return room;
  });
}

// Merge INCRÉMENTAL : on repart du loveRoomListings.ts existant (préserve les villes non re-sourcées —
// ex. quand le cron du Mac mini n'a en cache que les villes du run) puis on override celles du cache.
let listings = {};
try {
  const prev = fs.readFileSync(path.join(ROOT, 'src/data/loveRoomListings.ts'), 'utf8');
  const eq = prev.indexOf('=', prev.search(/export const/));
  listings = JSON.parse(prev.slice(eq + 1).trim().replace(/;\s*$/, ''));
} catch { listings = {}; }
for (const slug of SLUGS) {
  listings[slug] = curate(slug);
  const l = listings[slug];
  console.log(`${slug.padEnd(6)} : ${l.length} rooms · ${l.filter((r) => r.priceFrom).length} prix · ${l.filter((r) => r.url).length} lien direct · ${l.filter((r) => r.recentReviews).length} avis · ${l.filter((r) => r.description !== r.vibe).length} desc rédigée`);
}
const header = `import type { LoveRoom } from './loveRooms';
// ⚙️ AUTO-GÉNÉRÉ par scripts/loveroom-build-data.mjs — ne pas éditer à la main.
// Note/avis/lien direct = Google Places (attribution). Descriptions = rédigées depuis les avis. Prix = grille annuaire.
export const loveRoomListings: Record<string, LoveRoom[]> = `;
fs.writeFileSync(path.join(ROOT, 'src/data/loveRoomListings.ts'), header + JSON.stringify(listings, null, 2) + ';\n');
console.log(`\n✅ src/data/loveRoomListings.ts régénéré (${SLUGS.reduce((s, k) => s + listings[k].length, 0)} rooms).`);

// Émet la liste des villes (source unique = scripts/loveroom-cities.json) pour le site (pages générées).
const citiesMeta = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/loveroom-cities.json'), 'utf8'))
  .filter((c) => (listings[c.slug] || []).length > 0) // n'expose que les villes avec ≥1 room
  .map((c) => ({ ...c, found: FOUND[c.slug] || c.found || (listings[c.slug] || []).length }));
fs.writeFileSync(
  path.join(ROOT, 'src/data/loveRoomCities.ts'),
  `// ⚙️ AUTO-GÉNÉRÉ par scripts/loveroom-build-data.mjs — source: scripts/loveroom-cities.json\nexport const loveRoomCitiesMeta = ${JSON.stringify(citiesMeta, null, 2)};\n`
);
console.log(`✅ src/data/loveRoomCities.ts (${citiesMeta.length} villes avec rooms).`);
