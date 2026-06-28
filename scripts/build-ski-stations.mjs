#!/usr/bin/env node
/**
 * build-ski-stations.mjs
 * ----------------------------------------------------------------------------
 * Produit la liste { code_insee -> station de ski oui/non } des communes
 * françaises support d'une station de sports d'hiver (ski).
 *
 * SOURCE : Recensement des Équipements Sportifs (RES / "Data ES"), Ministère
 * des Sports — open data, licence ODbL, mis à jour quotidiennement.
 * Dataset data.gouv.fr :
 *   https://www.data.gouv.fr/datasets/recensement-des-equipements-sportifs-espaces-et-sites-de-pratiques
 * API Opendatasoft Explore v2.1 (pas besoin de télécharger les 330 MB) :
 *   https://equipements.sports.gouv.fr/api/explore/v2.1/catalog/datasets/data-es-equipement/records
 *
 * MÉTHODE :
 *   1. On interroge le dataset "data-es-equipement" en filtrant sur les TYPES
 *      d'équipement de ski (champ `type`). Voir SKI_TYPES ci-dessous.
 *   2. Chaque équipement porte des coordonnées (coordonnees_x = lon,
 *      coordonnees_y = lat) + le nom de commune (champ `commune`).
 *      ⚠️ Le champ commune = NOM, pas code INSEE. Et le dataset frère
 *      "data-es-installation" (qui, lui, a un champ `insee`) est INCOMPLET
 *      (~50 % des installations ski manquantes) → on NE PEUT PAS faire le join.
 *   3. On reverse-géocode les coordonnées -> code INSEE via l'API officielle
 *      geo.api.gouv.fr/communes?lat=&lon= (gratuit, sans clé).
 *      Fallback si pas de coords : recherche par nom geo.api.gouv.fr/communes?nom=
 *   4. On déduplique les codes INSEE -> set des communes "station de ski".
 *
 * USAGE :
 *   node scripts/build-ski-stations.mjs              # def. alpine (downhill)
 *   node scripts/build-ski-stations.mjs --broad      # + nordique/luge/tremplin
 *   node scripts/build-ski-stations.mjs --out path   # JSON de sortie
 *
 * SORTIE (par défaut scripts/rentabilite-dataset/ski-stations.json) :
 *   { "generated_at": "...", "definition": "alpine", "count": N,
 *     "insee": ["73304", "74160", ...],
 *     "communes": [{ "insee":"73304","nom":"Val-d'Isère","types":[...] }, ...] }
 * ----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RES_BASE =
  'https://equipements.sports.gouv.fr/api/explore/v2.1/catalog/datasets/data-es-equipement/records';
const GEO_BASE = 'https://geo.api.gouv.fr/communes';

// --- Types d'équipement RES considérés comme "station de ski" ---------------
// Vérifiés via la facette `type` du dataset (compte au 2026-06) :
//   Domaine de ski alpin : 396   | Piste de descente : 217
//   Domaine nordique : 236       | Piste de luge : 37
//   Tremplin à ski : 31          | Piste de ski indoor : 1
//
// ⚠️ "Piste de descente" est AMBIGU : il contient aussi des pistes de
//    DESCENTE VTT (ex. "Descente VTT" à Le Mans). NE PAS l'utiliser pour
//    classer une station de ski — il pollue le set avec du VTT.
//    Signal propre = "Domaine de ski alpin" (downhill) (+ "Domaine nordique"
//    en mode --broad pour le ski de fond).
const SKI_TYPES_ALPINE = ['Domaine de ski alpin'];
const SKI_TYPES_BROAD = [
  ...SKI_TYPES_ALPINE,
  'Domaine nordique',
  'Tremplin à ski',
  'Piste de ski indoor',
  // 'Piste de luge' et 'Piste de descente' volontairement exclus (bruit VTT/loisir).
];

const args = process.argv.slice(2);
const BROAD = args.includes('--broad');
const outIdx = args.indexOf('--out');
const OUT =
  outIdx !== -1 && args[outIdx + 1]
    ? path.resolve(args[outIdx + 1])
    : path.join(__dirname, 'rentabilite-dataset', 'ski-stations.json');
const TYPES = BROAD ? SKI_TYPES_BROAD : SKI_TYPES_ALPINE;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, tries = 4) {
  for (let a = 0; a < tries; a++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'enomia-ski-builder' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (a === tries - 1) throw e;
      await sleep(1500 * (a + 1));
    }
  }
}

// 1. Récupère tous les équipements ski (pagination 100/page)
async function fetchSkiEquipment(types) {
  const where = types.map((t) => `type="${t}"`).join(' OR ');
  const select = 'nom,type,commune,coordonnees_x,coordonnees_y';
  const rows = [];
  let offset = 0;
  for (;;) {
    const url = `${RES_BASE}?where=${encodeURIComponent(where)}&select=${encodeURIComponent(
      select
    )}&limit=100&offset=${offset}`;
    const d = await getJSON(url);
    const res = d.results || [];
    rows.push(...res);
    const total = d.total_count || 0;
    offset += 100;
    if (offset >= total || res.length === 0) break;
    await sleep(150);
  }
  return rows;
}

// 2. Reverse-géocode coord -> INSEE (fallback par nom)
async function coordToInsee(lon, lat) {
  const url = `${GEO_BASE}?lat=${lat}&lon=${lon}&fields=code,nom&format=json`;
  const d = await getJSON(url, 3);
  return Array.isArray(d) && d.length ? { insee: d[0].code, nom: d[0].nom } : null;
}
async function nameToInsee(nom) {
  const url = `${GEO_BASE}?nom=${encodeURIComponent(nom)}&fields=code,nom&boost=population&limit=1&format=json`;
  const d = await getJSON(url, 3);
  return Array.isArray(d) && d.length ? { insee: d[0].code, nom: d[0].nom } : null;
}

async function main() {
  console.error(`[ski] definition=${BROAD ? 'broad' : 'alpine'} types=${TYPES.join(', ')}`);
  const equip = await fetchSkiEquipment(TYPES);
  console.error(`[ski] equipment rows: ${equip.length}`);

  const byInsee = new Map(); // insee -> { insee, nom, types:Set }
  let geoFail = 0;
  for (const r of equip) {
    let hit = null;
    if (r.coordonnees_x != null && r.coordonnees_y != null) {
      hit = await coordToInsee(r.coordonnees_x, r.coordonnees_y);
      await sleep(120);
    }
    if (!hit && r.commune) {
      hit = await nameToInsee(r.commune);
      await sleep(120);
    }
    if (!hit) {
      geoFail++;
      continue;
    }
    if (!byInsee.has(hit.insee))
      byInsee.set(hit.insee, { insee: hit.insee, nom: hit.nom, types: new Set() });
    byInsee.get(hit.insee).types.add(r.type);
  }

  const communes = [...byInsee.values()]
    .map((c) => ({ insee: c.insee, nom: c.nom, types: [...c.types].sort() }))
    .sort((a, b) => a.insee.localeCompare(b.insee));

  const out = {
    generated_at: new Date().toISOString(),
    source: 'RES / Data ES (Ministère des Sports) — ODbL, via equipements.sports.gouv.fr + geo.api.gouv.fr',
    definition: BROAD ? 'broad' : 'alpine',
    types: TYPES,
    count: communes.length,
    geocode_failures: geoFail,
    insee: communes.map((c) => c.insee),
    communes,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.error(
    `[ski] DISTINCT communes: ${communes.length} | geocode failures: ${geoFail} | -> ${OUT}`
  );
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
