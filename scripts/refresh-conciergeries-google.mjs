#!/usr/bin/env node
/**
 * Audit des conciergeries de src/data/cities.ts contre Google Places API (New).
 *
 * Pour chaque conciergerie :
 *   - Text Search "<nom> <ville>" pour trouver la fiche Google Business
 *   - Récupère rating + userRatingCount + place_id + adresse
 *   - Compare avec les valeurs actuelles de cities.ts
 *   - Génère un rapport diff
 *
 * Mode dry-run uniquement (n'écrit pas dans cities.ts) — Marc valide le diff puis on édite manuellement.
 *
 * Usage :
 *   node scripts/refresh-conciergeries-google.mjs --ville=lyon          # 1 ville
 *   node scripts/refresh-conciergeries-google.mjs                       # toutes les villes
 *   node scripts/refresh-conciergeries-google.mjs --json > report.json  # output JSON
 *
 * Coût : ~$0.034/conciergerie (Text Search + Place Details combinés, masque champs minimal).
 * Crédit gratuit Maps Platform : $200/mois → ~5800 lookups gratuits.
 *
 * Auth : clé Places API dans /Users/marc/Desktop/Neocamino/.env → GOOGLE_PLACES_API_KEY
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// --- Charger la clé API depuis Neocamino/.env (hors repo Enomia) ---
const ENV_PATH = '/Users/marc/Desktop/Neocamino/.env';
let API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  const envContent = fs.readFileSync(ENV_PATH, 'utf8');
  const match = envContent.match(/^GOOGLE_PLACES_API_KEY=(.+)$/m);
  API_KEY = match?.[1]?.trim();
}
if (!API_KEY) {
  console.error('❌ GOOGLE_PLACES_API_KEY introuvable. Vérifier Neocamino/.env');
  process.exit(1);
}

// --- Args ---
const args = process.argv.slice(2);
const filterVille = args.find((a) => a.startsWith('--ville='))?.slice('--ville='.length);
const outputJson = args.includes('--json');

// --- Parse cities.ts ---
const citiesContent = fs.readFileSync(path.join(ROOT, 'src/data/cities.ts'), 'utf8');

function parseCities() {
  // Parse robuste : on splitte le tableau `cities` sur chaque début de ville (indent 2 + `{`),
  // puis on borne chaque bloc à sa propre fermeture en comptant les accolades.
  const cities = [];

  // Trouve toutes les positions où commence un objet ville (indent 2 + slug + ' qui suit immédiatement displayName ou autre)
  const slugIter = citiesContent.matchAll(/^  \{\s*\n\s+slug:\s*'([^']+)',/gm);

  for (const match of slugIter) {
    const slug = match[1];
    const startIdx = match.index;

    // Compteur d'accolades pour trouver la fermeture exacte du bloc ville
    let depth = 0;
    let endIdx = startIdx;
    for (let i = startIdx; i < citiesContent.length; i++) {
      const ch = citiesContent[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }

    const block = citiesContent.slice(startIdx, endIdx);
    const displayName = block.match(/displayName:\s*["']([^"']+)["']/)?.[1];
    if (!displayName) continue;

    const conciergeriesBlock = block.match(/conciergeries:\s*\[([\s\S]+?)\],\s*\n\s+neighborhoods/)?.[1] || '';
    const conciergeries = [];

    const concBlocks = conciergeriesBlock.match(/\{\s*name:[\s\S]*?\},/g) || [];
    for (const c of concBlocks) {
      // Gère les apostrophes échappées (ex. 'La Clé d\'Émeraude') puis déséchappe pour la requête
      const nameRaw = (c.match(/name:\s*"((?:\\.|[^"\\])*)"/) || c.match(/name:\s*'((?:\\.|[^'\\])*)'/))?.[1];
      const name = nameRaw?.replace(/\\(['"])/g, '$1');
      const url = c.match(/url:\s*["']([^"']+)["']/)?.[1];
      const rating = parseFloat(c.match(/rating:\s*([\d.]+)/)?.[1] || '0');
      const reviews = parseInt(c.match(/reviews:\s*(\d+)/)?.[1] || '0', 10);
      const biensGeres = parseInt(c.match(/biensGeres:\s*(\d+)/)?.[1] || '0', 10);
      if (name) conciergeries.push({ name, url, rating, reviews, biensGeres });
    }

    cities.push({ slug, displayName, conciergeries });
  }

  return cities;
}

// Termes qui indiquent un vrai match conciergerie Airbnb / location courte durée
const CONCIERGE_TERMS = /concierge|airbnb|location|gestion locative|courte dur|rental|short.?term|property\s*management|gîte|gite|holiday\s*let/i;

// --- Appel Places API (New) Text Search ---
async function placesSearch(query) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.googleMapsUri,places.types',
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'fr', regionCode: 'FR', pageSize: 5 }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Places API ${res.status} on "${query}": ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const places = data.places || [];
  // On préfère le premier résultat dont le NOM ou les TYPES suggèrent une conciergerie/LCD.
  // Sinon, on retourne le 1er résultat mais on le marque comme suspect.
  for (const p of places) {
    const name = p.displayName?.text || '';
    const types = (p.types || []).join(' ');
    if (CONCIERGE_TERMS.test(name) || /real_estate_agency|lodging|property_management/i.test(types)) {
      return { ...p, _matchQuality: 'strong' };
    }
  }
  return places[0] ? { ...places[0], _matchQuality: 'weak' } : null;
}

// --- Audit principal ---
async function audit() {
  const cities = parseCities();
  const targets = filterVille ? cities.filter((c) => c.slug === filterVille) : cities;

  if (filterVille && targets.length === 0) {
    console.error(`❌ Ville inconnue : "${filterVille}". Disponibles : ${cities.map((c) => c.slug).join(', ')}`);
    process.exit(1);
  }

  const report = [];

  for (const city of targets) {
    if (!outputJson) console.log(`\n=== ${city.displayName} (${city.conciergeries.length} conciergeries) ===\n`);

    for (const conc of city.conciergeries) {
      // Query enrichie : on ajoute "conciergerie" sauf si déjà dans le nom — oriente Places vers le bon métier
      const hasConcInName = /concierge|airbnb/i.test(conc.name);
      const query = hasConcInName ? `${conc.name} ${city.displayName}` : `${conc.name} ${city.displayName} conciergerie`;
      let result, error;
      try {
        result = await placesSearch(query);
      } catch (e) {
        error = e.message;
      }

      const entry = {
        ville: city.displayName,
        slug: city.slug,
        conciergerie: conc.name,
        actuel: { rating: conc.rating, reviews: conc.reviews, biensGeres: conc.biensGeres, url: conc.url },
        google: result
          ? {
              displayName: result.displayName?.text,
              rating: result.rating ?? null,
              userRatingCount: result.userRatingCount ?? null,
              address: result.formattedAddress,
              website: result.websiteUri,
              place_id: result.id,
              maps_url: result.googleMapsUri,
              types: result.types,
              matchQuality: result._matchQuality, // 'strong' | 'weak'
            }
          : null,
        error,
      };
      report.push(entry);

      if (!outputJson) {
        const a = entry.actuel;
        const g = entry.google;
        if (!g) {
          console.log(`  ${conc.name}`);
          console.log(`    Actuel : ${a.rating} ★ / ${a.reviews} avis / ~${a.biensGeres} biens`);
          console.log(`    Google : ❌ pas de résultat${error ? ` (${error})` : ''}\n`);
          continue;
        }
        const deltaR = (g.rating ?? 0) - a.rating;
        const deltaN = (g.userRatingCount ?? 0) - a.reviews;
        const warn =
          (a.reviews > 0 && Math.abs(deltaN) > Math.max(20, a.reviews * 0.3)) || Math.abs(deltaR) > 0.3
            ? ' ⚠️'
            : '';
        console.log(`  ${conc.name}${warn}`);
        console.log(`    Actuel : ${a.rating} ★ / ${a.reviews} avis / ~${a.biensGeres} biens`);
        console.log(
          `    Google : ${g.rating ?? 'n/a'} ★ / ${g.userRatingCount ?? 'n/a'} avis  ` +
            `(Δ ${deltaR >= 0 ? '+' : ''}${deltaR.toFixed(1)} ★, ${deltaN >= 0 ? '+' : ''}${deltaN} avis)`,
        );
        console.log(`    Fiche  : ${g.displayName} — ${g.address}`);
        console.log(`    URL    : ${g.maps_url}\n`);
      }

      // Light rate-limit safety (Places API New = 100 req/s, on est très loin)
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  if (outputJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    // Save full JSON next to script for re-use
    const outPath = path.join(ROOT, 'scripts', 'places-audit-output.json');
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Rapport JSON complet → ${path.relative(ROOT, outPath)}`);
    console.log(`📊 Total : ${report.length} conciergeries auditées sur ${targets.length} ville(s)`);
    const matched = report.filter((r) => r.google).length;
    console.log(`   Match Google : ${matched}/${report.length}`);
  }
}

audit().catch((e) => {
  console.error('❌ Crash :', e);
  process.exit(1);
});
