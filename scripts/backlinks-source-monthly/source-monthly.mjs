#!/usr/bin/env node
/**
 * Sourcing mensuel SEMrush — pipeline backlinks v2.1.
 *
 * Pour chaque bucket de KW (simulateur, contrat, facture, generic_lcd) :
 *   - Query SEMrush phrase_organic top 30 SERP par KW
 *   - Dedup par domaine, blacklist filter
 *   - Pour chaque candidat survivant, visit la page cible :
 *       * Détecte la liste des outils Enomia déjà présents (array)
 *       * Détecte si c'est une conciergerie (bool)
 *       * Extrait email/formulaire de contact
 *   - On garde TOUS les candidats (le choix d'outil à pitcher se fait au send-daily)
 *   - Output : data/backlinks-YYYY-MM.json
 *
 * Usage :
 *   node scripts/backlinks-source-monthly/source-monthly.mjs                 (run réel complet)
 *   node scripts/backlinks-source-monthly/source-monthly.mjs --dry           (sans appel API)
 *   node scripts/backlinks-source-monthly/source-monthly.mjs --kw-limit=3    (test sur 3 KW par bucket)
 *   node scripts/backlinks-source-monthly/source-monthly.mjs --skip-fetch    (skip visite des pages)
 *   node scripts/backlinks-source-monthly/source-monthly.mjs --fetch-concurrency=5 (par défaut 5)
 *
 * Coût SEMrush : ~2500 units pour ~250 KW. Négligeable sur quota Neocamino.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isBlacklisted,
  extractDomain,
  detectAll,
  extractContact,
} from './filters.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const KW_LIST_PATH = path.join(__dirname, 'kw-list.json');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const SKIP_FETCH = args.includes('--skip-fetch');
const SKIP_TRAFFIC = args.includes('--skip-traffic');
const KW_LIMIT = parseInt(args.find(a => a.startsWith('--kw-limit='))?.split('=')[1] || '999', 10);
const FETCH_CONCURRENCY = parseInt(args.find(a => a.startsWith('--fetch-concurrency='))?.split('=')[1] || '5', 10);
// Seuil organic traffic au-delà duquel on rejette le domaine (proxy "trop gros").
// 50k visites/mois ≈ Authority Score ~50, exclut les gros groupes (Vinci, presse, etc.)
// sans tuer les blogs niche LCD pertinents qui font 5-30k visites/mois.
// SEMrush n'expose pas l'AS direct via domain_ranks (besoin pack Backlinks séparé).
const MAX_TRAFFIC = parseInt(args.find(a => a.startsWith('--max-traffic='))?.split('=')[1] || '50000', 10);

function readEnvKey(key) {
  if (process.env[key]) return process.env[key].trim();
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const m = fs.readFileSync(envPath, 'utf-8').match(new RegExp(`^${key}=(.+)$`, 'm'));
    if (m) return m[1].trim();
  }
  return null;
}
const SEMRUSH_KEY = readEnvKey('SEMRUSH_API_KEY');
if (!SEMRUSH_KEY && !DRY) {
  console.error('❌ SEMRUSH_API_KEY introuvable');
  process.exit(1);
}

const MONTH = new Date().toISOString().slice(0, 7);
const OUTPUT_PATH = path.join(ROOT, 'data', `backlinks-${MONTH}.json`);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

async function queryDomainTraffic(domain) {
  if (DRY) return { organic_traffic: 0, organic_kw: 0, rank: 0, notFound: false };
  const url = `https://api.semrush.com/?type=domain_ranks&key=${SEMRUSH_KEY}&export_columns=Dn,Rk,Or,Ot&domain=${encodeURIComponent(domain)}&database=fr`;
  try {
    const r = await fetch(url);
    const text = await r.text();
    if (text.includes('ERROR 50')) return { organic_traffic: 0, organic_kw: 0, rank: 0, notFound: true };
    if (text.includes('ERROR')) return { error: text.trim().slice(0, 60) };
    const lines = text.trim().split('\n');
    if (lines.length < 2) return { organic_traffic: 0, organic_kw: 0, rank: 0, notFound: true };
    const cols = lines[1].split(';');
    return {
      rank: parseInt(cols[1], 10) || 0,
      organic_kw: parseInt(cols[2], 10) || 0,
      organic_traffic: parseInt(cols[3], 10) || 0,
    };
  } catch (e) {
    return { error: e.message?.slice(0, 60) || 'fetch error' };
  }
}

async function querySerp(kw, displayLimit = 30) {
  if (DRY) {
    log(`  [DRY] would query SEMrush for "${kw}"`);
    return [];
  }
  const url = `https://api.semrush.com/?type=phrase_organic&key=${SEMRUSH_KEY}&phrase=${encodeURIComponent(kw)}&database=fr&display_limit=${displayLimit}&export_columns=Po,Ur,Tr`;
  const r = await fetch(url);
  if (!r.ok) { log(`  ❌ HTTP ${r.status} pour "${kw}"`); return []; }
  const text = await r.text();
  if (text.includes('ERROR')) { log(`  ⚠️ ${text.trim().slice(0, 60)} pour "${kw}"`); return []; }
  const lines = text.trim().split('\n').slice(1);
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

// Parallel fetch helper avec limit de concurrence
async function fetchAllInParallel(items, fn, concurrency = 5, progressCb) {
  const results = new Array(items.length);
  let inFlight = 0;
  let nextIndex = 0;
  let done = 0;

  return new Promise((resolve) => {
    const launchNext = () => {
      while (inFlight < concurrency && nextIndex < items.length) {
        const idx = nextIndex++;
        inFlight++;
        fn(items[idx], idx).then(res => {
          results[idx] = res;
          inFlight--;
          done++;
          if (progressCb) progressCb(done, items.length);
          if (done === items.length) resolve(results);
          else launchNext();
        });
      }
    };
    if (items.length === 0) resolve([]);
    else launchNext();
  });
}

async function main() {
  log(`🚀 Sourcing backlinks ${MONTH} ${DRY ? '(DRY)' : ''} ${SKIP_FETCH ? '(NO-FETCH)' : ''}`);

  const buckets = JSON.parse(fs.readFileSync(KW_LIST_PATH, 'utf-8'));
  delete buckets._comment;

  // ─── ÉTAPE 1 — Query SEMrush ──────────────────────────────────────────
  const allCandidates = new Map();
  let totalSerps = 0;
  let totalKwQueried = 0;

  for (const [bucket, kws] of Object.entries(buckets)) {
    const limited = kws.slice(0, KW_LIMIT);
    log(`\n=== Bucket: ${bucket} (${limited.length} KW) ===`);

    for (const kw of limited) {
      totalKwQueried++;
      const results = await querySerp(kw);
      totalSerps += results.length;

      for (const r of results) {
        if (isBlacklisted(r.domain)) continue;
        const existing = allCandidates.get(r.domain);
        if (!existing || r.position < existing.rank_serp) {
          allCandidates.set(r.domain, {
            site: r.domain,
            page_cible: r.url,
            kw_origin_bucket: bucket,
            kw_origin_phrase: kw,
            rank_serp: r.position,
            serp_traffic: r.traffic,
          });
        }
      }
      await sleep(200); // anti rate-limit
    }
  }

  log(`\n📊 Query terminé : ${totalKwQueried} KW queried, ${totalSerps} SERP results, ${allCandidates.size} domaines uniques après dedup+blacklist`);

  let candidates = Array.from(allCandidates.values());

  // ─── ÉTAPE 1bis — Filtre organic_traffic (proxy AS) ───────────────────
  let rejectedTooBig = 0;
  if (!SKIP_TRAFFIC && !DRY) {
    log(`\n🏋️  Filtre taille via SEMrush domain_ranks (seuil ${MAX_TRAFFIC.toLocaleString()} visites/mois)...`);
    const trafficResults = await fetchAllInParallel(candidates, async (c) => {
      const r = await queryDomainTraffic(c.site);
      if (!r.error) {
        c.organic_traffic = r.organic_traffic || 0;
        c.organic_kw = r.organic_kw || 0;
        c.semrush_rank = r.rank || 0;
      } else {
        c.organic_traffic = null;
        c.semrush_traffic_error = r.error;
      }
      return c;
    }, FETCH_CONCURRENCY, (done, total) => {
      if (done % 50 === 0 || done === total) log(`  ${done}/${total} domain_ranks queried`);
    });

    candidates = trafficResults.filter(c => {
      if (c.organic_traffic !== null && c.organic_traffic >= MAX_TRAFFIC) {
        rejectedTooBig++;
        return false;
      }
      return true;
    });
    log(`  → ${rejectedTooBig} domaines rejetés (traffic ≥ ${MAX_TRAFFIC.toLocaleString()}), ${candidates.length} restants`);
  } else if (SKIP_TRAFFIC) {
    log(`\n⏭ Skip filtre traffic (--skip-traffic)`);
  }

  // ─── ÉTAPE 2 — Pour chaque candidat, fetch + détecte outils + conciergerie ─
  let processed = candidates;
  if (!SKIP_FETCH && !DRY) {
    log(`\n🔍 Fetch + détection (${candidates.length} candidats, concurrency=${FETCH_CONCURRENCY})...`);

    processed = await fetchAllInParallel(candidates, async (c) => {
      const detection = await detectAll(c.page_cible, c.site);
      if (!detection) {
        c.outils_presents = [];
        c.is_conciergerie = false;
        c.fetch_status = 'fail';
        return c;
      }
      c.outils_presents = detection.tools;
      c.is_conciergerie = detection.is_conciergerie;
      c.is_blog = detection.is_blog;
      c.fetch_status = 'ok';

      // Tente d'extraire contact en même temps
      const contact = await extractContact(c.page_cible);
      c.email = contact.email;
      c.url_formulaire = contact.url_formulaire;
      return c;
    }, FETCH_CONCURRENCY, (done, total) => {
      if (done % 50 === 0 || done === total) log(`  ${done}/${total} fetched`);
    });
  } else {
    log(`\n⏭ Skip fetch`);
    for (const c of candidates) {
      c.outils_presents = [];
      c.is_conciergerie = false;
      c.fetch_status = 'skipped';
      c.email = null;
      c.url_formulaire = null;
    }
  }

  // ─── ÉTAPE 3 — Format final + ajout status pending ────────────────────
  const final = processed.map(c => ({
    ...c,
    status: 'pending',
    created_at: new Date().toISOString(),
  }));

  // Stats
  const fetchOk = final.filter(c => c.fetch_status === 'ok').length;
  const conciergeries = final.filter(c => c.is_conciergerie).length;
  const withEmail = final.filter(c => c.email).length;
  const withForm = final.filter(c => !c.email && c.url_formulaire).length;
  const byBucket = {};
  for (const c of final) byBucket[c.kw_origin_bucket] = (byBucket[c.kw_origin_bucket] || 0) + 1;
  const distribOutils = {};
  for (const c of final) {
    for (const t of c.outils_presents) {
      distribOutils[t] = (distribOutils[t] || 0) + 1;
    }
  }

  const output = {
    month: MONTH,
    generated_at: new Date().toISOString(),
    stats: {
      total_kw_queried: totalKwQueried,
      total_serps_scanned: totalSerps,
      total_domains_after_dedup_blacklist: allCandidates.size,
      rejected_too_big_traffic: rejectedTooBig,
      max_traffic_threshold: MAX_TRAFFIC,
      total_candidates: final.length,
      fetch_ok: fetchOk,
      fetch_fail: final.length - fetchOk,
      conciergeries: conciergeries,
      with_email: withEmail,
      with_form_only: withForm,
      no_contact: final.length - withEmail - withForm,
      by_bucket: byBucket,
      outils_presents_distrib: distribOutils,
    },
    candidates: final,
  };

  // Append si fichier existe déjà — avec dédup contre le mois PRÉCÉDENT :
  // le top 30 SERP bouge peu d'un mois à l'autre ; sans ce filtre ~75 % des
  // domaines re-sourcés sont des doublons du mois N-1 (constat mai→juin 2026).
  let existingCount = 0;
  const knownDomains = new Set();
  const prevMonth = new Date(Date.now() - 31 * 86400000).toISOString().slice(0, 7);
  const prevPath = path.join(ROOT, 'data', `backlinks-${prevMonth}.json`);
  if (fs.existsSync(prevPath)) {
    JSON.parse(fs.readFileSync(prevPath, 'utf-8')).candidates.forEach(c => knownDomains.add(c.site));
  }
  let existing = null;
  if (fs.existsSync(OUTPUT_PATH)) {
    existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
    existing.candidates.forEach(c => knownDomains.add(c.site));
    existingCount = existing.candidates.length;
  }
  const newOnes = final.filter(c => !knownDomains.has(c.site));
  const droppedKnown = final.length - newOnes.length;
  if (existing) {
    log(`\n📝 Fichier existant : ${existingCount} candidats. Dédup (mois courant + précédent) : ${droppedKnown} retirés. Ajout : ${newOnes.length}.`);
    output.candidates = [...existing.candidates, ...newOnes];
    output.stats.total_candidates = output.candidates.length;
    output.stats.appended_this_run = newOnes.length;
    output.stats.dedup_known_domains = droppedKnown;
  } else {
    if (droppedKnown) log(`\n📝 Dédup mois précédent : ${droppedKnown} domaines déjà connus retirés.`);
    output.candidates = newOnes;
    output.stats.total_candidates = newOnes.length;
    output.stats.dedup_known_domains = droppedKnown;
  }

  if (!DRY) {
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    log(`\n✅ Écrit : ${OUTPUT_PATH}`);
  }

  log(`\n📈 Bilan :`);
  log(`  KW queried       : ${totalKwQueried}`);
  log(`  SERP scanned     : ${totalSerps}`);
  log(`  Rejetés trop gros: ${rejectedTooBig} (traffic ≥ ${MAX_TRAFFIC.toLocaleString()})`);
  log(`  Candidats finaux : ${output.candidates.length} ${existingCount ? `(${existingCount} déjà + ${output.candidates.length - existingCount} nouveaux)` : ''}`);
  log(`  Fetch OK         : ${fetchOk}/${final.length}`);
  log(`  Conciergeries    : ${conciergeries}`);
  log(`  Avec email       : ${withEmail}`);
  log(`  Avec formulaire  : ${withForm}`);
  log(`  Par bucket KW    : ${JSON.stringify(byBucket)}`);
  log(`  Outils présents (sur les candidats fetched) : ${JSON.stringify(distribOutils)}`);
}

main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });
