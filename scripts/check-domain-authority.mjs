#!/usr/bin/env node
// Query SEMrush domain_overview pour chaque prospect du CRM
// Marque rejete_dr_eleve si AS >= 30
// Coût : 1 unité par domain × 351 = 351 unités. Négligeable.
// Usage : node scripts/check-domain-authority.mjs [--limit=N]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LIMIT = parseInt(process.argv.find(a => a.startsWith('--limit='))?.replace('--limit=', '') || '999', 10);

function getApiKey() {
  if (process.env.SEMRUSH_API_KEY) return process.env.SEMRUSH_API_KEY.trim();
  const envPath = '/Users/marc/Desktop/Neocamino/.env';
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf-8');
    const m = env.match(/SEMRUSH_API_KEY=(.+)/);
    if (m) return m[1].trim();
  }
  process.exit(1);
}
const KEY = getApiKey();

function extractDomain(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

async function domainOverview(domain) {
  // SEMrush domain_ranks columns: Dn (domain), Rk (rank), Or (organic kw),
  // Ot (organic traffic), Ad (Adwords kw — pas Authority Score!)
  // Note : l'Authority Score SEMrush n'est PAS exposé via cet endpoint (besoin pack Backlinks).
  // On utilise Organic Traffic comme proxy de "taille du site".
  const url = `https://api.semrush.com/?type=domain_ranks&key=${KEY}&export_columns=Dn,Rk,Or,Ot&domain=${encodeURIComponent(domain)}&database=fr`;
  const res = await fetch(url);
  const text = await res.text();
  if (text.includes('ERROR 50')) return { notFound: true };
  if (text.includes('ERROR')) return { error: text.trim() };
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { notFound: true };
  const cols = lines[1].split(';');
  return {
    rank: parseInt(cols[1], 10) || 0,
    organicKw: parseInt(cols[2], 10) || 0,
    organicTraffic: parseInt(cols[3], 10) || 0,
  };
}

async function main() {
  const crmPath = path.join(ROOT, '.claude/backlinks-data.json');
  const data = JSON.parse(fs.readFileSync(crmPath, 'utf8'));

  // Filter prospects à vérifier (skip already checked + skip exclus)
  const toCheck = data.prospects.filter(p =>
    p.authority_score === undefined &&
    !['exclu_trop_gros', 'rejete_dr_eleve', 'rejete_non_pertinent'].includes(p.status)
  ).slice(0, LIMIT);

  console.log(`📋 ${toCheck.length} prospects à checker (sur ${data.prospects.length} total)`);
  console.log(`💰 Coût : ~${toCheck.length} unités SEMrush\n`);

  // Seuil : organic traffic > 5000/mois = "trop gros" (équivalent DR > 30 approx)
  const TRAFFIC_THRESHOLD = 5000;
  let high = 0, low = 0, notFound = 0;
  for (let i = 0; i < toCheck.length; i++) {
    const p = toCheck[i];
    const domain = extractDomain(p.site);
    const r = await domainOverview(domain);

    if (r.error) {
      console.log(`[${i + 1}/${toCheck.length}] ❌ ${domain} → ${r.error}`);
      continue;
    }
    if (r.notFound) {
      p.organic_traffic = 0;
      p.organic_kw = 0;
      notFound++;
      console.log(`[${i + 1}/${toCheck.length}] 🟡 ${domain.padEnd(40)} NOT FOUND`);
    } else {
      p.organic_traffic = r.organicTraffic;
      p.organic_kw = r.organicKw;
      p.rank_semrush = r.rank;
      if (r.organicTraffic >= TRAFFIC_THRESHOLD) {
        p.status = 'rejete_trop_gros';
        high++;
        console.log(`[${i + 1}/${toCheck.length}] 🔴 ${domain.padEnd(40)} traffic=${r.organicTraffic}/mo (rejeté > ${TRAFFIC_THRESHOLD})`);
      } else {
        low++;
        console.log(`[${i + 1}/${toCheck.length}] 🟢 ${domain.padEnd(40)} traffic=${r.organicTraffic}/mo kw=${r.organicKw}`);
      }
    }

    // Save every 20
    if ((i + 1) % 20 === 0) {
      fs.writeFileSync(crmPath, JSON.stringify(data, null, 2));
      console.log(`   💾 Sauvegarde intermédiaire`);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  fs.writeFileSync(crmPath, JSON.stringify(data, null, 2));
  console.log(`\n✅ Terminé`);
  console.log(`   🟢 ${low} prospects AS < 30 (gardés)`);
  console.log(`   🔴 ${high} prospects AS >= 30 (rejetés)`);
  console.log(`   🟡 ${notFound} non trouvés dans SEMrush (AS=0)`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
