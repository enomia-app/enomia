#!/usr/bin/env node
/**
 * Sourcing mensuel SEMrush — pipeline backlinks v2.
 *
 * Pour chaque outil (simulateur, contrat, facture) :
 *   - Query SEMrush phrase_organic sur ~25 KW
 *   - Récupère le top 30 SERP par KW
 *   - Dedup par domaine, blacklist filter
 *   - Visit chaque page candidate, vérifie qu'il n'y a PAS d'outil concurrent
 *   - Tente d'extraire email + url_formulaire
 *   - Output data/backlinks-YYYY-MM.json
 *
 * Usage :
 *   node scripts/backlinks-source-monthly/source-monthly.mjs                 (run réel)
 *   node scripts/backlinks-source-monthly/source-monthly.mjs --dry           (sans appel API)
 *   node scripts/backlinks-source-monthly/source-monthly.mjs --kw-limit=3    (test sur 3 KW par outil)
 *   node scripts/backlinks-source-monthly/source-monthly.mjs --skip-fetch    (skip visite des pages)
 *
 * Coût SEMrush : ~75 KW × phrase_organic display_limit=30 = ~750 units. Négligeable.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isBlacklisted,
  extractDomain,
  hasCompetingTool,
  extractContact,
} from './filters.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const KW_LIST_PATH = path.join(__dirname, 'kw-list.json');

// ─── CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const SKIP_FETCH = args.includes('--skip-fetch');
const KW_LIMIT = parseInt(args.find(a => a.startsWith('--kw-limit='))?.split('=')[1] || '999', 10);

// ─── Env ────────────────────────────────────────────────────────────────
function readEnvKey(key) {
  if (process.env[key]) return process.env[key].trim();
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf-8');
    const m = env.match(new RegExp(`^${key}=(.+)$`, 'm'));
    if (m) return m[1].trim();
  }
  return null;
}
const SEMRUSH_KEY = readEnvKey('SEMRUSH_API_KEY');
if (!SEMRUSH_KEY && !DRY) {
  console.error('❌ SEMRUSH_API_KEY introuvable (env var ou .env)');
  process.exit(1);
}

// ─── Helpers ────────────────────────────────────────────────────────────
const MONTH = new Date().toISOString().slice(0, 7); // YYYY-MM
const OUTPUT_PATH = path.join(ROOT, 'data', `backlinks-${MONTH}.json`);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function log(...args) {
  console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...args);
}

/**
 * Query SEMrush phrase_organic pour récupérer le top SERP d'un KW.
 * Retourne un array de { url, position, domain }.
 */
async function querySerp(kw, displayLimit = 30) {
  if (DRY) {
    log(`  [DRY] would query SEMrush for "${kw}"`);
    return [];
  }
  const url = `https://api.semrush.com/?type=phrase_organic&key=${SEMRUSH_KEY}&phrase=${encodeURIComponent(kw)}&database=fr&display_limit=${displayLimit}&export_columns=Po,Ur,Tr`;
  const r = await fetch(url);
  if (!r.ok) {
    log(`  ❌ SEMrush HTTP ${r.status} pour "${kw}"`);
    return [];
  }
  const text = await r.text();
  if (text.includes('ERROR')) {
    log(`  ❌ SEMrush ${text.trim()} pour "${kw}"`);
    return [];
  }
  // CSV : Po;Ur;Tr (Position;Url;Trafic)
  const lines = text.trim().split('\n').slice(1); // skip header
  return lines.map(line => {
    const [position, url, traffic] = line.split(';');
    return {
      position: parseInt(position, 10),
      url,
      traffic: parseInt(traffic, 10) || 0,
      domain: extractDomain(url),
    };
  }).filter(r => r.domain);
}

// ─── Main ───────────────────────────────────────────────────────────────
async function main() {
  log(`🚀 Sourcing backlinks ${MONTH} ${DRY ? '(DRY RUN)' : ''}`);

  const kwsByOutil = JSON.parse(fs.readFileSync(KW_LIST_PATH, 'utf-8'));
  delete kwsByOutil._comment;

  // Étape 1 — Query SEMrush
  const allCandidates = new Map(); // key = domain, value = best entry
  let totalSerps = 0;

  for (const [outil, kws] of Object.entries(kwsByOutil)) {
    const limited = kws.slice(0, KW_LIMIT);
    log(`\n=== Outil: ${outil} (${limited.length} KW) ===`);

    for (const kw of limited) {
      log(`  → "${kw}"`);
      const results = await querySerp(kw);
      totalSerps += results.length;

      for (const r of results) {
        if (isBlacklisted(r.domain)) continue;
        const existing = allCandidates.get(r.domain);
        if (!existing || r.position < existing.rank_serp) {
          allCandidates.set(r.domain, {
            site: r.domain,
            page_cible: r.url,
            outil_cible: outil,
            kw_origin: kw,
            rank_serp: r.position,
            serp_traffic: r.traffic,
          });
        }
      }
      await sleep(200); // anti rate-limit
    }
  }

  log(`\n📊 Après dedup + blacklist : ${allCandidates.size} domaines uniques (sur ${totalSerps} SERP results)`);

  // Étape 2 — Pour chaque candidat, visit la page et check si outil concurrent
  const candidates = Array.from(allCandidates.values());
  const final = [];

  if (!SKIP_FETCH && !DRY) {
    log(`\n🔍 Visite des pages pour détecter outils concurrents...`);
    let checked = 0;
    for (const c of candidates) {
      checked++;
      if (checked % 20 === 0) log(`  ${checked}/${candidates.length}`);

      const hasComp = await hasCompetingTool(c.page_cible, c.outil_cible);
      if (hasComp === true) {
        c.skip_reason = 'has_competing_tool';
        continue;
      }
      if (hasComp === null) {
        c.skip_reason = 'fetch_failed';
        continue;
      }

      // Tente d'extraire un contact
      const contact = await extractContact(c.page_cible);
      c.email = contact.email;
      c.url_formulaire = contact.url_formulaire;
      c.status = 'pending';
      c.created_at = new Date().toISOString();
      final.push(c);

      await sleep(500); // poli avec les serveurs
    }
  } else {
    log(`\n⏭ Skip fetch (--skip-fetch ou --dry)`);
    for (const c of candidates) {
      c.email = null;
      c.url_formulaire = null;
      c.status = 'pending_fetch';
      c.created_at = new Date().toISOString();
      final.push(c);
    }
  }

  // Étape 3 — Output
  const output = {
    month: MONTH,
    generated_at: new Date().toISOString(),
    total_serps_scanned: totalSerps,
    total_domains_after_dedup: allCandidates.size,
    total_candidates_qualified: final.length,
    by_outil: {
      simulateur: final.filter(c => c.outil_cible === 'simulateur').length,
      contrat: final.filter(c => c.outil_cible === 'contrat').length,
      facture: final.filter(c => c.outil_cible === 'facture').length,
    },
    candidates: final,
  };

  // Append au fichier mensuel si existe (cas où on relance dans le mois)
  let existing = null;
  if (fs.existsSync(OUTPUT_PATH)) {
    existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
    const existingDomains = new Set(existing.candidates.map(c => c.site));
    const newOnes = final.filter(c => !existingDomains.has(c.site));
    log(`\n📝 Fichier existant trouvé. Ajout de ${newOnes.length} nouveaux (${final.length - newOnes.length} déjà présents).`);
    output.candidates = [...existing.candidates, ...newOnes];
    output.total_candidates_qualified = output.candidates.length;
    output.by_outil = {
      simulateur: output.candidates.filter(c => c.outil_cible === 'simulateur').length,
      contrat: output.candidates.filter(c => c.outil_cible === 'contrat').length,
      facture: output.candidates.filter(c => c.outil_cible === 'facture').length,
    };
  }

  if (!DRY) {
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    log(`\n✅ Écrit : ${OUTPUT_PATH}`);
  }

  log(`\n📈 Bilan :`);
  log(`  SERP scanned          : ${totalSerps}`);
  log(`  Domaines uniques      : ${allCandidates.size}`);
  log(`  Candidats qualifiés   : ${final.length}`);
  log(`    - simulateur        : ${output.by_outil.simulateur}`);
  log(`    - contrat           : ${output.by_outil.contrat}`);
  log(`    - facture           : ${output.by_outil.facture}`);

  return output;
}

main().catch(e => {
  console.error('❌ Fatal:', e);
  process.exit(1);
});
