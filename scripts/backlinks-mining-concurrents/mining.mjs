#!/usr/bin/env node
/**
 * Backlink mining — pipeline backlinks v2.1.
 *
 * Identifie les concurrents directs (sites qui ont déjà UN de nos outils détecté
 * via outils_presents dans le backlog du mois) et mine leurs backlinks via SEMrush.
 * Les sites qui linkent vers ces concurrents sont des cibles parfaites : ils citent
 * des outils similaires aux nôtres, ils accepteront probablement de citer Enomia aussi.
 *
 * Workflow :
 *   1. Lit data/backlinks-YYYY-MM.json
 *   2. Identifie les sites avec outils_presents.length > 0
 *   3. Prend les top N par trafic SERP (par outil détecté)
 *   4. Pour chaque concurrent : SEMrush backlinks API, top 100 backlinks
 *   5. Filter blacklist + dedup avec backlog existant
 *   6. Append au backlog en `status: pending`, marqué `source: 'mining_concurrent_X'`
 *
 * Usage :
 *   node scripts/backlinks-mining-concurrents/mining.mjs
 *   node scripts/backlinks-mining-concurrents/mining.mjs --dry
 *   node scripts/backlinks-mining-concurrents/mining.mjs --top-per-outil=10  (default 10)
 *   node scripts/backlinks-mining-concurrents/mining.mjs --backlinks-per-site=100  (default 100)
 *
 * Coût SEMrush : top-per-outil × 4 outils × backlinks-per-site × ~0.4 units/backlink
 *   = 10 × 4 × 100 × 0.4 = ~1600 units. Négligeable.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isBlacklisted, extractDomain } from '../backlinks-source-monthly/filters.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const TOP_PER_OUTIL = parseInt(args.find(a => a.startsWith('--top-per-outil='))?.split('=')[1] || '10', 10);
const BACKLINKS_PER_SITE = parseInt(args.find(a => a.startsWith('--backlinks-per-site='))?.split('=')[1] || '100', 10);

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
const BACKLOG_PATH = path.join(ROOT, 'data', `backlinks-${MONTH}.json`);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

if (!fs.existsSync(BACKLOG_PATH)) {
  console.error(`❌ Backlog introuvable : ${BACKLOG_PATH}. Lance d'abord source-monthly.mjs.`);
  process.exit(1);
}

/**
 * Query SEMrush backlinks API pour un domaine cible.
 * Retourne array de { source_url, source_domain, target_url, anchor }.
 */
async function queryBacklinks(targetDomain, limit = 100) {
  if (DRY) {
    log(`  [DRY] would query backlinks for ${targetDomain}`);
    return [];
  }
  const url = `https://api.semrush.com/analytics/v1/?key=${SEMRUSH_KEY}&type=backlinks&target=${encodeURIComponent(targetDomain)}&target_type=domain&display_limit=${limit}&export_columns=source_url,source_title,target_url,anchor`;
  const r = await fetch(url);
  if (!r.ok) {
    log(`  ❌ HTTP ${r.status} pour ${targetDomain}`);
    return [];
  }
  const text = await r.text();
  if (text.includes('ERROR') || !text.trim()) {
    log(`  ⚠️ ${text.trim().slice(0, 80) || 'empty'} pour ${targetDomain}`);
    return [];
  }
  const lines = text.trim().split('\n').slice(1); // skip header
  return lines.map(line => {
    const [source_url, source_title, target_url, anchor] = line.split(';');
    return {
      source_url,
      source_title: source_title || '',
      target_url,
      anchor: anchor || '',
      source_domain: extractDomain(source_url),
    };
  }).filter(b => b.source_domain);
}

async function main() {
  log(`🔍 Backlink mining ${MONTH} ${DRY ? '(DRY)' : ''}`);

  const backlog = JSON.parse(fs.readFileSync(BACKLOG_PATH, 'utf-8'));
  const candidates = backlog.candidates;
  const existingDomains = new Set(candidates.map(c => c.site));

  // ─── Identifier les concurrents par outil ─────────────────────────────
  const concurrents_by_outil = { simulateur: [], facture: [], contrat: [], taxe_sejour: [] };
  for (const c of candidates) {
    if (!c.outils_presents || c.outils_presents.length === 0) continue;
    for (const outil of c.outils_presents) {
      if (!concurrents_by_outil[outil]) continue;
      concurrents_by_outil[outil].push(c);
    }
  }

  log(`\n🎯 Concurrents identifiés depuis le backlog :`);
  for (const [outil, list] of Object.entries(concurrents_by_outil)) {
    log(`  ${outil}: ${list.length} sites`);
  }

  // Top N par outil (par trafic SERP desc)
  const toMine = new Map(); // key = domain, value = { domain, outils: [], serp_traffic }
  for (const [outil, list] of Object.entries(concurrents_by_outil)) {
    const top = list
      .sort((a, b) => (b.serp_traffic || 0) - (a.serp_traffic || 0))
      .slice(0, TOP_PER_OUTIL);
    for (const c of top) {
      if (!toMine.has(c.site)) {
        toMine.set(c.site, { domain: c.site, outils: [], serp_traffic: c.serp_traffic || 0 });
      }
      toMine.get(c.site).outils.push(outil);
    }
  }

  log(`\n📊 ${toMine.size} concurrents uniques à miner (top ${TOP_PER_OUTIL} par outil)`);

  // ─── Mine each concurrent ─────────────────────────────────────────────
  const newCandidates = new Map();
  let totalBacklinks = 0;
  let totalAfterFilter = 0;
  let mined = 0;

  for (const c of toMine.values()) {
    mined++;
    log(`\n→ [${mined}/${toMine.size}] ${c.domain} (outils: ${c.outils.join(',')}, traffic ${c.serp_traffic})`);

    const backlinks = await queryBacklinks(c.domain, BACKLINKS_PER_SITE);
    totalBacklinks += backlinks.length;
    log(`  ${backlinks.length} backlinks bruts`);

    let added = 0;
    for (const bl of backlinks) {
      if (isBlacklisted(bl.source_domain)) continue;
      if (existingDomains.has(bl.source_domain)) continue;
      if (newCandidates.has(bl.source_domain)) {
        // Marque aussi cet outil comme cible potentielle pour ce candidat
        const existing = newCandidates.get(bl.source_domain);
        if (!existing.mined_from_outils.includes(c.outils[0])) {
          existing.mined_from_outils.push(...c.outils);
        }
        continue;
      }
      newCandidates.set(bl.source_domain, {
        site: bl.source_domain,
        page_cible: bl.source_url,
        kw_origin_bucket: 'mining',
        mined_from_concurrent: c.domain,
        mined_from_outils: [...c.outils],
        anchor_to_concurrent: bl.anchor,
        rank_serp: 0,
        serp_traffic: 0,
        outils_presents: [], // sera détecté au send-daily via re-fetch
        is_conciergerie: false, // idem
        email: null,
        url_formulaire: null,
        fetch_status: 'pending',
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      added++;
    }
    totalAfterFilter += added;
    log(`  ${added} nouveaux candidats ajoutés (après blacklist + dedup)`);
    await sleep(200); // anti rate-limit
  }

  // ─── Append au backlog ────────────────────────────────────────────────
  const newList = Array.from(newCandidates.values());
  backlog.candidates = [...candidates, ...newList];

  // Mise à jour stats
  if (!backlog.stats) backlog.stats = {};
  backlog.stats.mining_done_at = new Date().toISOString();
  backlog.stats.mining_concurrents_queried = toMine.size;
  backlog.stats.mining_backlinks_scanned = totalBacklinks;
  backlog.stats.mining_new_candidates = newList.length;
  backlog.stats.total_candidates = backlog.candidates.length;

  if (!DRY) {
    fs.writeFileSync(BACKLOG_PATH, JSON.stringify(backlog, null, 2));
    log(`\n✅ Backlog mis à jour : ${BACKLOG_PATH}`);
  }

  log(`\n📈 Bilan mining :`);
  log(`  Concurrents minés      : ${toMine.size}`);
  log(`  Backlinks scannés      : ${totalBacklinks}`);
  log(`  Nouveaux candidats     : ${newList.length}`);
  log(`  Total backlog après    : ${backlog.candidates.length}`);
}

main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });
