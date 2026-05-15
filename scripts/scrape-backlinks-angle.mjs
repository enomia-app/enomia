#!/usr/bin/env node
/**
 * Scrape SEMrush par ANGLE — approche méthodique vs batch large.
 * Pour chaque angle Enomia : 2-3 KW précis × top 50 SERP → filtre immédiat (blacklist + DR + compete).
 *
 * Usage : node scripts/scrape-backlinks-angle.mjs [--angle=ID] [--dry-run]
 *
 * Coût SEMrush : ~5 angles × 2-3 KW (phrase_organic) + ~250 domain_overview = ~270 unités.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectCompetingTopics } from './lib/competing-topics.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const TARGET_ANGLE = process.argv.find(a => a.startsWith('--angle='))?.replace('--angle=', '') || null;
const DRY_RUN = process.argv.includes('--dry-run');
const SERP_LIMIT = 50; // top 50 SERP = pages 1-5
const TRAFFIC_THRESHOLD = 5000; // organic_traffic/mo max

function getApiKey() {
  if (process.env.SEMRUSH_API_KEY) return process.env.SEMRUSH_API_KEY.trim();
  const envPath = '/Users/marc/Desktop/Neocamino/.env';
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf-8');
    const m = env.match(/SEMRUSH_API_KEY=(.+)/);
    if (m) return m[1].trim();
  }
  console.error('❌ SEMRUSH_API_KEY introuvable');
  process.exit(1);
}
const KEY = getApiKey();

// ─── Config 5 angles ─────────────────────────────────────────────────
const ANGLES = [
  {
    id: 'loi-le-meur',
    name: 'Loi Le Meur 2025',
    kws: ['loi le meur airbnb', 'loi airbnb 2025'],
    enomia_url: 'https://www.enomia.app/blog/loi-le-meur-airbnb',
    competing_topic: 'loi',
    only_tag: null,
    description: "Cible blogs immo/legal qui mentionnent la loi sans l'avoir couverte en détail",
  },
  {
    id: 'facture-airbnb',
    name: 'Générateur factures Airbnb/Booking',
    kws: ['facture booking', 'facture airbnb', 'facture location saisonnière'],
    enomia_url: 'https://www.enomia.app/facture-airbnb',
    competing_topic: 'facture',
    only_tag: null,
    description: "Cible blogs comptable/immo qui parlent de facturation sans proposer de générateur",
  },
  {
    id: 'contrat-lcd',
    name: 'Générateur contrats location saisonnière',
    kws: ['contrat location saisonnière', 'contrat airbnb', 'modèle contrat location courte durée'],
    enomia_url: 'https://www.enomia.app/contrat-airbnb',
    competing_topic: 'contrat',
    only_tag: null,
    description: "Cible blogs legal/immo qui parlent de contrat sans modèle gratuit",
  },
  {
    id: 'taux-occupation',
    name: 'Taux occupation par ville',
    kws: ['taux occupation airbnb', 'taux occupation moyen airbnb', 'occupation airbnb par ville'],
    enomia_url: 'https://www.enomia.app/blog/taux-occupation-par-ville',
    competing_topic: 'occupation',
    only_tag: null,
    description: "Cible blogs investissement qui parlent d'occupation sans data précise par ville",
  },
  {
    id: 'conciergerie-ville',
    name: 'Lien dans fiche conciergerie ville (Option B)',
    kws: ['conciergerie airbnb', 'conciergerie location saisonnière', 'tarif conciergerie airbnb'],
    enomia_url: 'https://www.enomia.app/conciergerie-airbnb',
    competing_topic: null, // pas d'exclusion : on cible les conciergeries
    only_tag: 'conciergerie',
    description: "Cible conciergeries listées sur Enomia (échange : lien dans fiche ↔ lien depuis leur blog)",
  },
];

// ─── Blacklist (gros sites, presse, agrégateurs) ─────────────────────
const BLACKLIST_DOMAINS = new Set([
  'airbnb.com', 'airbnb.fr', 'booking.com', 'abritel.fr', 'vrbo.com', 'gite-de-france.com',
  'pap.fr', 'pap.com', 'seloger.com', 'logic-immo.com', 'bienici.com', 'meilleursagents.com',
  'leboncoin.fr', 'jinka.fr', 'figaro-immobilier.com',
  'legifrance.gouv.fr', 'service-public.fr', 'impots.gouv.fr', 'urssaf.fr',
  'ameli.fr', 'cnav.fr', 'cpam.fr', 'ants.gouv.fr', 'gouv.fr',
  'wikipedia.org', 'wikimedia.org', 'youtube.com', 'vimeo.com',
  'linkedin.com', 'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
  'tiktok.com', 'pinterest.com', 'reddit.com', 'quora.com',
  'google.com', 'google.fr',
  'lemonde.fr', 'lefigaro.fr', 'lesechos.fr', 'capital.fr', 'latribune.fr',
  'challenges.fr', 'leparisien.fr', 'liberation.fr',
  'francebleu.fr', 'franceinfo.fr', 'francetvinfo.fr', 'lci.fr',
  'tf1info.fr', 'bfmtv.com', 'rmc.bfmtv.com',
  'hostnfly.com', 'smoobu.com', 'smoobu.fr', 'guestready.com',
  'cosmopolitan.fr', 'femmeactuelle.fr',
  'journaldunet.com', 'journaldunet.fr',
  'amazon.fr', 'amazon.com', 'cdiscount.com', 'fnac.com', 'darty.com',
]);

function extractDomain(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return u.hostname.replace(/^www\./, '');
  } catch { return url; }
}

function categorize(domain, url) {
  if (/conciergerie/i.test(domain) || /conciergerie/i.test(url)) return 'conciergerie';
  if (/lodgify|smoobu|amenitiz|eviivo|superhote|pricelabs|beyond|wheelhouse|hostfully|guesty|hostaway|igms/i.test(domain)) return 'outil';
  if (/annuaire|listing/i.test(domain)) return 'annuaire';
  if (/blog|magazine|conseil|guide|investir|immobilier|loueur|hote/i.test(domain)) return 'blog';
  return 'autre';
}

// ─── SEMrush API ─────────────────────────────────────────────────────
async function phraseOrganic(phrase, displayLimit = SERP_LIMIT) {
  const url = `https://api.semrush.com/?type=phrase_organic&key=${KEY}&phrase=${encodeURIComponent(phrase)}&database=fr&export_columns=Dn,Ur,Po&display_limit=${displayLimit}`;
  const res = await fetch(url);
  const text = await res.text();
  if (text.includes('ERROR')) return { error: text.trim() };
  const lines = text.trim().split('\n').slice(1);
  return lines.map(l => {
    const [domain, urlStr, pos] = l.split(';');
    return { domain: (domain || '').toLowerCase(), url: urlStr, position: parseInt(pos, 10) || 0 };
  }).filter(r => r.url);
}

async function domainOverview(domain) {
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

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  const crmPath = path.join(ROOT, '.claude/backlinks-data.json');
  let crm = { lastUpdate: new Date().toISOString().slice(0, 10), prospects: [] };
  if (fs.existsSync(crmPath)) crm = JSON.parse(fs.readFileSync(crmPath, 'utf8'));
  const existingDomains = new Set(crm.prospects.map(p => extractDomain(p.site)));

  const anglesToRun = TARGET_ANGLE ? ANGLES.filter(a => a.id === TARGET_ANGLE) : ANGLES;
  console.log(`🎯 Scraping ${anglesToRun.length} angle(s) — top ${SERP_LIMIT} SERP`);
  console.log(`💰 Coût estimé : ~${anglesToRun.length * 3 + anglesToRun.length * 50} unités SEMrush\n`);

  const newProspectsByAngle = {};
  const allNewProspects = [];

  for (const angle of anglesToRun) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📌 Angle "${angle.name}" (${angle.id})`);
    console.log(`   Resource : ${angle.enomia_url}`);
    console.log(`   Exclude si compete : ${angle.competing_topic || 'aucun'}`);
    console.log(`   Only tag : ${angle.only_tag || 'tous'}`);

    const byDomain = new Map();
    for (const kw of angle.kws) {
      process.stdout.write(`   [KW] "${kw}"... `);
      const results = await phraseOrganic(kw, SERP_LIMIT);
      if (results.error) { console.log(`❌ ${results.error}`); continue; }
      let added = 0, skipped = 0;
      for (const r of results) {
        const domain = extractDomain(r.url);
        if (BLACKLIST_DOMAINS.has(domain)) { skipped++; continue; }
        if (existingDomains.has(domain)) { skipped++; continue; }
        const tag = categorize(domain, r.url);
        if (angle.only_tag && tag !== angle.only_tag) { skipped++; continue; }
        // Detect competing topic
        const competing = detectCompetingTopics({ kws_match: [{ kw, url: r.url }] });
        if (angle.competing_topic && competing.has(angle.competing_topic)) { skipped++; continue; }
        if (byDomain.has(domain)) {
          byDomain.get(domain).kws_match.push({ kw, position: r.position, url: r.url });
          continue;
        }
        byDomain.set(domain, {
          id: domain.replace(/\./g, '-'),
          site: `https://${domain}/`,
          nom_entreprise: domain,
          tag,
          status: 'a_qualifier',
          angle: angle.id,
          email: null,
          prenom_contact: null,
          nom_contact: null,
          blog_url: null,
          article_cible: null,
          ressource_enomia_proposee: angle.enomia_url,
          pitch_angle: angle.name,
          type_pitch: 'echange_croise',
          kws_match: [{ kw, position: r.position, url: r.url }],
          competing_topics: [...competing],
          date_added: new Date().toISOString().slice(0, 10),
          date_envoi: null,
          date_relance: null,
          reponse: null,
          notes: `Angle "${angle.name}" via SEMrush phrase_organic`,
        });
        added++;
      }
      console.log(`+${added} (skip ${skipped})`);
      await new Promise(r => setTimeout(r, 200));
    }

    const candidates = [...byDomain.values()];
    console.log(`   → ${candidates.length} candidats avant filtre traffic`);

    // DR check (organic_traffic threshold)
    let kept = 0, rejected = 0, notFound = 0;
    for (let i = 0; i < candidates.length; i++) {
      const p = candidates[i];
      const overview = await domainOverview(extractDomain(p.site));
      if (overview.error) continue;
      if (overview.notFound) {
        p.organic_traffic = 0;
        p.organic_kw = 0;
        notFound++;
        kept++;
      } else {
        p.organic_traffic = overview.organicTraffic;
        p.organic_kw = overview.organicKw;
        p.rank_semrush = overview.rank;
        if (overview.organicTraffic >= TRAFFIC_THRESHOLD) {
          p.status = 'rejete_trop_gros';
          rejected++;
        } else {
          kept++;
        }
      }
      await new Promise(r => setTimeout(r, 150));
    }

    console.log(`   ✅ ${kept} qualifiés | 🔴 ${rejected} rejetés (traffic > ${TRAFFIC_THRESHOLD}) | 🟡 ${notFound} non trouvés (=0)`);
    newProspectsByAngle[angle.id] = candidates;
    allNewProspects.push(...candidates);
  }

  // Stats finales
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📊 RÉSUMÉ`);
  for (const angle of anglesToRun) {
    const list = newProspectsByAngle[angle.id] || [];
    const active = list.filter(p => p.status !== 'rejete_trop_gros').length;
    const rejected = list.filter(p => p.status === 'rejete_trop_gros').length;
    console.log(`   ${angle.id.padEnd(20)} ${String(active).padStart(3)} actifs | ${rejected} rejetés`);
  }

  if (DRY_RUN) {
    console.log(`\n🛑 DRY-RUN — pas de sauvegarde`);
    return;
  }

  // Append au CRM
  crm.prospects.push(...allNewProspects);
  crm.lastUpdate = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(crmPath, JSON.stringify(crm, null, 2));
  const totalActive = allNewProspects.filter(p => p.status !== 'rejete_trop_gros').length;
  console.log(`\n💾 Sauvegardé : ${totalActive} nouveaux prospects qualifiés ajoutés (CRM total : ${crm.prospects.length})`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
