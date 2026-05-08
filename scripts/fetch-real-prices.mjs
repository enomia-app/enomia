#!/usr/bin/env node
/**
 * Récupère les vrais prix au m² pour les villes de cities-rentabilite.ts.
 *
 * Sources :
 *   1. DVF (Demandes de Valeurs Foncières) — data.gouv.fr — base officielle
 *      des transactions immobilières (5 dernières années).
 *      Endpoint : https://app.dvf.etalab.gouv.fr/api/mutations3/{code_insee}
 *      Alternative : https://api.cquest.org/dvf?code_postal=XXX (proxy non-officiel)
 *
 *   2. Geo API gouv (gratuit, pas d'auth) pour récupérer le code INSEE
 *      Endpoint : https://geo.api.gouv.fr/communes?nom={ville}
 *
 * Méthodologie :
 *   - Pour chaque ville, on récupère le code INSEE
 *   - On fetch les mutations DVF "Appartement" 25-50m² des 24 derniers mois
 *   - On calcule la médiane €/m² (plus robuste que la moyenne)
 *   - On compare à priceM2 actuel et on flag si écart > 25%
 *   - Si --update, on remplace dans cities-rentabilite.ts
 *
 * Usage :
 *   node scripts/fetch-real-prices.mjs              # dry-run, CSV output
 *   node scripts/fetch-real-prices.mjs --update     # modifie le fichier BDD
 *   node scripts/fetch-real-prices.mjs --villes=marseille,lyon  # subset
 *
 * Note : ce script est OPT-IN (à lancer manuellement). Il ne tourne PAS
 * automatiquement via cron pour éviter les modifications inattendues de la BDD.
 */

import { readFileSync, writeFileSync } from 'fs';

const PATH = 'src/data/cities-rentabilite.ts';
const UPDATE = process.argv.includes('--update');
const customVilles = process.argv.find((a) => a.startsWith('--villes='));

// ─── Helpers ────────────────────────────────────────────────────────
async function fetchInseeCode(name) {
  // Normalise "Aix-en-Provence" → "Aix-en-Provence" (espaces ok pour l'API)
  const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(name)}&fields=code,nom,codesPostaux&limit=5`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    // Match exact d'abord
    const exact = data.find((c) => c.nom.toLowerCase() === name.toLowerCase());
    return (exact || data[0]).code;
  } catch (e) {
    return null;
  }
}

async function fetchDvfMutations(codeInsee) {
  // L'API officielle DVF Etalab demande la section cadastrale, ce qui est lourd.
  // Alternative pratique : api.cquest.org/dvf qui agrège DVF par code_postal.
  // On va plutôt utiliser geo+DVF combiné.
  const url = `https://api.cquest.org/dvf?code_commune=${codeInsee}&type_local=Appartement`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.resultats || [];
  } catch (e) {
    return [];
  }
}

function median(values) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function quartile(values, q) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined ? sorted[base] + rest * (sorted[base + 1] - sorted[base]) : sorted[base];
}

// ─── Parse BDD ──────────────────────────────────────────────────────
const content = readFileSync(PATH, 'utf-8');
const cityBlockRegex = /\{\s*slug: '([^']+)',\s*name: '([^']+)',[\s\S]*?priceM2: \{ min: (\d+), max: (\d+) \}/g;
const cities = [];
let m;
while ((m = cityBlockRegex.exec(content)) !== null) {
  cities.push({
    slug: m[1],
    name: m[2],
    priceM2Min: parseInt(m[3]),
    priceM2Max: parseInt(m[4]),
  });
}

const filteredCities = customVilles
  ? cities.filter((c) => customVilles.replace('--villes=', '').split(',').includes(c.slug))
  : cities;

console.error(`📊 ${filteredCities.length} villes à analyser via DVF (sur ${cities.length} en BDD)\n`);

// ─── Main loop ──────────────────────────────────────────────────────
const results = [];
const updates = [];

for (let i = 0; i < filteredCities.length; i++) {
  const city = filteredCities[i];
  process.stderr.write(`[${i + 1}/${filteredCities.length}] ${city.name}…`);

  const insee = await fetchInseeCode(city.name);
  if (!insee) {
    console.error(` ❌ INSEE introuvable`);
    results.push({ ...city, status: 'INSEE_NOT_FOUND' });
    continue;
  }

  const mutations = await fetchDvfMutations(insee);
  if (!mutations.length) {
    console.error(` ⚠️ DVF vide (insee=${insee})`);
    results.push({ ...city, insee, status: 'DVF_EMPTY' });
    continue;
  }

  // Filtrer T2 25-50m² des 24 derniers mois (date_mutation depuis 2024)
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 24);
  const t2Mutations = mutations.filter((mut) => {
    const surface = mut.surface_reelle_bati || mut.surface || 0;
    const date = new Date(mut.date_mutation || 0);
    const valeur = mut.valeur_fonciere || 0;
    return surface >= 25 && surface <= 50 && date >= cutoff && valeur >= 30000 && valeur <= 1500000;
  });

  if (t2Mutations.length < 5) {
    console.error(` ⚠️ Trop peu de transactions T2 (${t2Mutations.length}, insee=${insee})`);
    results.push({ ...city, insee, status: 'TOO_FEW_TRANSACTIONS', count: t2Mutations.length });
    continue;
  }

  const pricesM2 = t2Mutations.map((mut) => (mut.valeur_fonciere / mut.surface_reelle_bati) | 0).filter((p) => p >= 800 && p <= 25000);
  const med = Math.round(median(pricesM2));
  const q1 = Math.round(quartile(pricesM2, 0.25));
  const q3 = Math.round(quartile(pricesM2, 0.75));

  // Écart par rapport à la BDD actuelle
  const currentMid = (city.priceM2Min + city.priceM2Max) / 2;
  const deltaPct = Math.round(((med - currentMid) / currentMid) * 100);

  const flag = Math.abs(deltaPct) > 25 ? '🔴' : Math.abs(deltaPct) > 10 ? '🟡' : '🟢';
  console.error(` ${flag} médiane DVF=${med} €/m² (vs BDD ${currentMid}, écart ${deltaPct > 0 ? '+' : ''}${deltaPct}%, n=${t2Mutations.length})`);

  results.push({
    ...city,
    insee,
    status: 'OK',
    count: t2Mutations.length,
    dvfMin: q1,
    dvfMed: med,
    dvfMax: q3,
    deltaPct,
  });

  // Si écart significatif (>10%), on prépare une mise à jour
  if (Math.abs(deltaPct) > 10) {
    updates.push({ slug: city.slug, oldMin: city.priceM2Min, oldMax: city.priceM2Max, newMin: q1, newMax: q3 });
  }

  // Rate limit pour ne pas spammer les APIs publiques
  await new Promise((r) => setTimeout(r, 600));
}

// ─── CSV output ─────────────────────────────────────────────────────
console.log('slug,name,status,count,priceM2_old_min,priceM2_old_max,dvf_q1,dvf_med,dvf_q3,delta_pct');
for (const r of results) {
  console.log(
    [
      r.slug,
      r.name,
      r.status,
      r.count || '',
      r.priceM2Min,
      r.priceM2Max,
      r.dvfMin || '',
      r.dvfMed || '',
      r.dvfMax || '',
      r.deltaPct ?? '',
    ].join(',')
  );
}

console.error(`\n✓ ${results.filter((r) => r.status === 'OK').length}/${results.length} villes avec data DVF`);
console.error(`  ${updates.length} villes avec écart > 10% (à reviewer)`);

// ─── Update BDD si --update ─────────────────────────────────────────
if (UPDATE && updates.length) {
  console.error(`\n📝 Mise à jour BDD...`);
  let newContent = content;
  for (const u of updates) {
    const regex = new RegExp(
      `(slug: '${u.slug}',[\\s\\S]*?priceM2: \\{ min: )${u.oldMin}(, max: )${u.oldMax}(\\s*\\})`
    );
    if (regex.test(newContent)) {
      newContent = newContent.replace(regex, `$1${u.newMin}$2${u.newMax}$3`);
      console.error(`  ✓ ${u.slug}: ${u.oldMin}-${u.oldMax} → ${u.newMin}-${u.newMax}`);
    } else {
      console.error(`  ❌ ${u.slug}: regex no match`);
    }
  }
  writeFileSync(PATH, newContent);
  console.error(`\n✓ ${PATH} mis à jour. Sources : DVF (data.gouv.fr).`);
} else if (updates.length) {
  console.error(`\n→ Pour appliquer les mises à jour, relancer avec --update`);
}
