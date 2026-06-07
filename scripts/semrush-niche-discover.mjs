#!/usr/bin/env node
/**
 * Découverte générique d'une niche SEO programmatique (réutilisable : love room, cabane, etc.).
 * fullsearch SEMrush sur des seeds → classe les localisations VILLE / RÉGION / DÉPT / ÉTRANGER / BRUIT.
 *
 * Usage :
 *   node scripts/semrush-niche-discover.mjs --label=cabane --seeds="cabane dans les arbres,cabane insolite,cabane jacuzzi,cabane dans les bois"
 *
 * Sorties : /tmp/{label}-keywords.csv + /tmp/{label}-villes.json
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';

function getApiKey() {
  if (process.env.SEMRUSH_API_KEY) return process.env.SEMRUSH_API_KEY.trim();
  const p = '/Users/marc/Desktop/Neocamino/.env';
  if (existsSync(p)) { const m = readFileSync(p, 'utf-8').match(/SEMRUSH_API_KEY=(.+)/); if (m) return m[1].trim(); }
  console.error('❌ SEMRUSH_API_KEY introuvable'); process.exit(1);
}
const KEY = getApiKey();
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.split('=').slice(1).join('=') : d; };
const LABEL = arg('label', 'niche');
const SEEDS = arg('seeds', '').split(',').map((s) => s.trim()).filter(Boolean);
if (!SEEDS.length) { console.error('❌ --seeds="a,b,c" requis'); process.exit(1); }

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, ' ').replace(/[-\s]+/g, ' ').trim();

async function fullsearch(seed) {
  const url = `https://api.semrush.com/?type=phrase_fullsearch&key=${KEY}&phrase=${encodeURIComponent(seed)}&database=fr&export_columns=Ph,Nq,Kd,Cp&display_limit=1000&display_sort=nq_desc`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const t = await res.text();
  if (t.startsWith('ERROR')) {
    if (t.includes('NOTHING FOUND') || t.includes('::50')) return [];
    if (t.includes('::132')) { console.error('❌ API units épuisés'); process.exit(1); }
    console.error(`⚠️ ${seed}: ${t.trim().slice(0, 60)}`); return [];
  }
  const lines = t.trim().split('\n'); lines.shift();
  return lines.map((l) => { const [ph, nq, kd, cp] = l.split(';'); return { phrase: ph, vol: +nq || 0, kd: parseFloat(kd) || 0, cpc: parseFloat(cp) || 0 }; });
}

// Régions / départements / étranger / bruit (réutilisé du chantier love room)
const REGIONS = new Set(['normandie','basse normandie','haute normandie','bretagne','alsace','paca','provence alpes cote dazur','occitanie','aquitaine','nouvelle aquitaine','ile france','ile de france','idf','pays loire','pays de la loire','haut france','hauts france','haut de france','hauts de france','grand est','bourgogne','franche comte','bourgogne franche comte','centre val loire','centre val de loire','auvergne','rhone alpes','auvergne rhone alpes','corse','lorraine','picardie','champagne','champagne ardennes','languedoc roussillon','limousin','poitou charente','midi pyrenees','nord pas de calais','nord pas calais','provence','cote azur','cote d azur','camargue','luberon','beaujolais','pays basque','artois','val loire','bord mer','baie somme','mont blanc','montagne','vosges','jura','alpes','ardennes','perigord','sologne','morvan']);
const DEPTS = new Set(['var','vendee','herault','gard','morbihan','finistere','dordogne','calvados','savoie','haute savoie','moselle','ille vilaine','gironde','oise','vaucluse','cotes armor','drome','sarthe','alpes maritimes','essonne','ardeche','manche','loiret','landes','maine loire','seine marne','seine maritime','bouches rhone','loire atlantique','charente maritime','charente','tarn','puy dome','ain','lot garonne','meurthe moselle','aude','yvelines','aisne','aveyron','cote or','haute garonne','eure','mayenne','orne','yonne','somme','ariege','allier','lot','doubs','cantal','gers','eure loir','tarn garonne','vienne','indre loire','indre','haute vienne','hautes alpes','deux sevres','haute marne','rhone','isere','marne','aube','haute loire','haute saone','correze','meuse','creuse','hautes pyrenees','pyrenees orientales','pyrenees atlantiques','alpes haute provence','loire','nievre','val oise']);
const FOREIGN = new Set(['belgique','espagne','barcelone','amsterdam','geneve','luxembourg','andorre','bruxelles','suisse','allemagne','italie','londres','madrid','milan','lisbonne','rome','portugal','japon','monaco','lausanne','liege','quebec','canada','maroc','marrakech','bali','thailande','norvege','suede','finlande','canada']);
const NOISE = new Set(['moi','quoi','toi','my','the','and','for','chez moi','pres moi','location','louer','site','photo','photos','box','deco','decoration','definition','def','experience','idee','prix','pas cher','construire','construction','plan','permis','fabriquer','enfant','jardin','interieur','occasion','vente','acheter','kit','bricolage','jeu','minecraft','roman','livre','film','chanson','parole','restaurant','the voice']);

// strip = stopwords + modificateurs + TOUS les mots des seeds (généralise à n'importe quelle niche)
const BASE_STRIP = new Set(['avec','sans','et','ou','de','du','des','le','la','les','l','d','a','au','aux','en','pour','un','une','dans','sur','pres','proche','autour','alentour','jacuzzi','spa','privatif','prive','privee','sauna','hammam','bain','nordique','nuit','nuits','insolite','sejour','week','end','weekend','hotel','gite','gites','hebergement','hebergements','location','romantique','prix','pas','cher','reservation','booking','airbnb','couple','amoureux','centre','ville','region','2','deux','nature','perchee','perche','perches','perchees']);
const SEED_TOKENS = new Set(SEEDS.flatMap((s) => norm(s).split(' ')));
const STRIP = new Set([...BASE_STRIP, ...SEED_TOKENS]);

const extractLoc = (phrase) => norm(phrase).split(' ').filter((t) => !STRIP.has(t) && t.length > 1 && !/^\d+$/.test(t)).join(' ').trim();
const classify = (loc) => !loc ? 'NATIONAL' : REGIONS.has(loc) ? 'REGION' : DEPTS.has(loc) ? 'DEPT' : FOREIGN.has(loc) ? 'FOREIGN' : NOISE.has(loc) ? 'NOISE' : 'CITY';

// ─── Run ─────────────────────────────────────────────────────────────
console.error(`🔍 [${LABEL}] fullsearch sur ${SEEDS.length} seeds…`);
const all = [];
for (const s of SEEDS) { const r = await fullsearch(s); console.error(`   "${s}": ${r.length} KW`); all.push(...r); }
const byPhrase = new Map();
for (const r of all) { const p = byPhrase.get(r.phrase); if (!p || r.vol > p.vol) byPhrase.set(r.phrase, r); }
const KW = [...byPhrase.values()].sort((a, b) => b.vol - a.vol);

writeFileSync(`/tmp/${LABEL}-keywords.csv`, ['phrase;vol;kd;cpc', ...KW.map((k) => `${k.phrase};${k.vol};${k.kd};${k.cpc}`)].join('\n'));

const cities = new Map(); const regions = new Map(); const depts = new Map();
let national = 0;
for (const k of KW) {
  const loc = extractLoc(k.phrase); const cls = classify(loc);
  if (cls === 'NATIONAL') { national += k.vol; continue; }
  if (cls === 'NOISE' || cls === 'FOREIGN') continue;
  const m = cls === 'CITY' ? cities : cls === 'REGION' ? regions : depts;
  if (!m.has(loc)) m.set(loc, { loc, vol: 0, kw: 0, kds: [] });
  const e = m.get(loc); e.vol += k.vol; e.kw++; if (k.kd > 0) e.kds.push(k.kd);
}
const fin = (m) => [...m.values()].map((e) => ({ loc: e.loc, vol: e.vol, kw: e.kw, kd: e.kds.length ? Math.round(e.kds.reduce((s, d) => s + d, 0) / e.kds.length) : null })).sort((a, b) => b.vol - a.vol);
const C = fin(cities), R = fin(regions), D = fin(depts);
writeFileSync(`/tmp/${LABEL}-villes.json`, JSON.stringify(C, null, 2));

const tot = KW.reduce((s, k) => s + k.vol, 0);
console.log(`\n═══ NICHE "${LABEL}" — POTENTIEL FRANCE ═══`);
console.log(`KW uniques : ${KW.length} · volume cumulé total : ${tot.toLocaleString('fr')}/mois`);
console.log(`Volume national (sans lieu) : ${national.toLocaleString('fr')}/mois`);
console.log(`Villes : ${C.length} (≥100 : ${C.filter((c) => c.vol >= 100).length}, ≥50 : ${C.filter((c) => c.vol >= 50).length}) · cumulé ${C.reduce((s, c) => s + c.vol, 0).toLocaleString('fr')}/mo`);
console.log(`\n━━━ TOP 30 VILLES ━━━\n vol | KD | ville`);
for (const c of C.slice(0, 30)) console.log(`${String(c.vol).padStart(5)} | ${String(c.kd ?? '-').padStart(2)} | ${c.loc}`);
console.log(`\n━━━ TOP 12 RÉGIONS ━━━\n vol | région`);
for (const r of R.slice(0, 12)) console.log(`${String(r.vol).padStart(5)} | ${r.loc}`);
console.log(`\n━━━ TOP 10 DÉPARTEMENTS ━━━\n vol | département`);
for (const d of D.slice(0, 10)) console.log(`${String(d.vol).padStart(5)} | ${d.loc}`);
