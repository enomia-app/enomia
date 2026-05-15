#!/usr/bin/env node
/**
 * Scrape SEMrush phrase_organic sur les KW prioritaires du cocon Enomia.
 * Pour chaque KW : top 30 SERP → catégorise (conciergerie/blog/outil/annuaire/media/autre)
 * → filtre liste noire (gros) → ajoute à .claude/backlinks-data.json.
 *
 * Usage : node scripts/prospection-backlinks-scrape-serp.mjs [--kw-limit=N] [--max-prospects=N]
 * Coût SEMrush : ~30 KW × phrase_organic display_limit=30 = ~90-150 unités. Négligeable.
 *
 * Workflow :
 *   1. Pour chaque KW prioritaire, query SEMrush phrase_organic display_limit=30
 *   2. Extract domain + URL + position de chaque résultat
 *   3. Filter liste noire (HostnFly, presse nationale, agrégateurs, etc.)
 *   4. Catégoriser par domaine ou pattern (conciergerie/blog/etc.)
 *   5. Dédupliquer par domain (1 prospect par site, pas par URL)
 *   6. Skip si déjà dans backlinks-data.json
 *   7. Ajouter avec status='a_qualifier' (à enrichir manuel ou via skill séparé)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

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

const KW_LIMIT = parseInt(process.argv.find(a => a.startsWith('--kw-limit='))?.replace('--kw-limit=', '') || '999', 10);
const MAX_PROSPECTS = parseInt(process.argv.find(a => a.startsWith('--max-prospects='))?.replace('--max-prospects=', '') || '999', 10);

// ─── KW prioritaires du cocon Enomia ──────────────────────────────────
const PRIORITY_KWS = [
  // Cluster Rentabilité
  'rentabilité airbnb',
  'louer airbnb rentable',
  'combien rapporte airbnb',
  'investir airbnb',
  'simulateur rentabilité airbnb',
  'estimation airbnb',
  'commissions airbnb',
  'commission booking',
  'superhost airbnb',

  // Cluster Fiscalité
  'fiscalité airbnb',
  'lmnp airbnb',
  'lmnp 2026',
  'amortissement lmnp',
  'location meublée',
  'loi le meur airbnb',
  'loi airbnb 2025',
  'taxe de séjour airbnb',
  'taxe habitation airbnb',
  'numero enregistrement airbnb',
  'difference location saisonniere meuble tourisme',

  // Cluster Outils
  'tarification dynamique airbnb',
  'pricing airbnb',
  'channel manager',
  'channel manager gratuit',
  'automatiser airbnb',
  'serrure connectée airbnb',
  'pms location saisonnière',

  // Cluster Conciergerie
  'conciergerie airbnb',
  'tarif conciergerie airbnb',
  'conciergerie digitale',

  // Outils Enomia (mentions non liées)
  'facture airbnb',
  'facture booking',
  'facture location saisonnière',
  'contrat location saisonnière',
  'contrat airbnb',
];

// ─── Liste noire : domains à exclure (trop gros, agrégateurs, presse) ───
const BLACKLIST_DOMAINS = new Set([
  // Plateformes
  'airbnb.com', 'airbnb.fr', 'booking.com', 'abritel.fr', 'vrbo.com', 'gite-de-france.com',
  'pap.fr', 'pap.com', 'seloger.com', 'logic-immo.com', 'bienici.com', 'meilleursagents.com',
  'leboncoin.fr', 'jinka.fr', 'figaro-immobilier.com',
  // Gouvernement
  'legifrance.gouv.fr', 'service-public.fr', 'impots.gouv.fr', 'urssaf.fr',
  'ameli.fr', 'cnav.fr', 'cpam.fr', 'ants.gouv.fr', 'gouv.fr',
  // Social
  'wikipedia.org', 'wikimedia.org', 'youtube.com', 'vimeo.com',
  'linkedin.com', 'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
  'tiktok.com', 'pinterest.com', 'reddit.com', 'quora.com',
  // Google
  'google.com', 'google.fr',
  // Presse nationale (trop gros)
  'lemonde.fr', 'lefigaro.fr', 'lesechos.fr', 'capital.fr', 'latribune.fr',
  'challenges.fr', 'leparisien.fr', 'liberation.fr', 'lefaire.fr',
  'francebleu.fr', 'franceinfo.fr', 'francetvinfo.fr', 'lci.fr',
  'tf1info.fr', 'bfmtv.com', 'rmc.bfmtv.com',
  // Conciergeries trop grosses (exclu)
  'hostnfly.com', 'smoobu.com', 'smoobu.fr', 'guestready.com',
  // Magazines généralistes
  'cosmopolitan.fr', 'femmeactuelle.fr', 'auchezvous.com',
  // Agrégateurs SEO
  'journaldunet.com', 'journaldunet.fr',
  // E-commerce / amazon
  'amazon.fr', 'amazon.com', 'cdiscount.com', 'fnac.com', 'darty.com',
]);

// ─── Catégorisation heuristique ──────────────────────────────────────
function categorize(domain, url, kw) {
  // Conciergerie
  if (/conciergerie|conciergerie-airbnb|conciergerie-bnb/i.test(domain) ||
      /conciergerie/i.test(url)) return 'conciergerie';
  // Outils SaaS (channel managers, pms, pricing tools)
  if (/lodgify|smoobu|amenitiz|eviivo|superhote|pricelabs|beyond|wheelhouse|wynd|fairbnb|hostfully|guesty|hostaway|igms/i.test(domain)) return 'outil';
  // Annuaires identifiés
  if (/annuaire|listing/i.test(domain)) return 'annuaire';
  // Médias / blogs immo / LCD
  if (/blog|magazine|conseil|guide|investir|immobilier|loueur|hote|locataire/i.test(domain)) return 'blog';
  // Default
  return 'autre';
}

// ─── SEMrush API ─────────────────────────────────────────────────────
async function phraseOrganic(phrase) {
  const url = `https://api.semrush.com/?type=phrase_organic&key=${KEY}&phrase=${encodeURIComponent(phrase)}&database=fr&export_columns=Dn,Ur,Po&display_limit=30`;
  const res = await fetch(url);
  const text = await res.text();
  if (text.includes('ERROR')) return { error: text.trim() };
  const lines = text.trim().split('\n').slice(1);
  return lines.map(l => {
    const [domain, urlStr, pos] = l.split(';');
    return { domain: (domain || '').toLowerCase(), url: urlStr, position: parseInt(pos, 10) || 0 };
  }).filter(r => r.url);
}

function extractDomain(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log(`🔎 Scraping SERP SEMrush sur ${Math.min(KW_LIMIT, PRIORITY_KWS.length)} KW prioritaires`);
  console.log(`💰 Coût estimé : ~${Math.min(KW_LIMIT, PRIORITY_KWS.length) * 3} unités SEMrush\n`);

  // Charger CRM existant (anti-doublon)
  const crmPath = path.join(ROOT, '.claude/backlinks-data.json');
  let crm = { lastUpdate: new Date().toISOString().slice(0, 10), prospects: [] };
  if (fs.existsSync(crmPath)) {
    crm = JSON.parse(fs.readFileSync(crmPath, 'utf8'));
  }
  const existingDomains = new Set(crm.prospects.map(p => extractDomain(p.site)));

  const newProspects = new Map();  // domain → prospect

  for (let i = 0; i < PRIORITY_KWS.length && i < KW_LIMIT; i++) {
    const kw = PRIORITY_KWS[i];
    process.stdout.write(`[${i + 1}/${PRIORITY_KWS.length}] "${kw}"... `);
    const results = await phraseOrganic(kw);
    if (results.error) {
      console.log(`❌ ${results.error}`);
      continue;
    }

    let added = 0;
    for (const r of results) {
      const domain = extractDomain(r.url);
      if (BLACKLIST_DOMAINS.has(domain)) continue;
      if (existingDomains.has(domain)) continue;
      if (newProspects.has(domain)) {
        // Déjà vu via un autre KW : ajouter ce KW à la liste
        newProspects.get(domain).kws_match.push({ kw, position: r.position, url: r.url });
        continue;
      }
      const category = categorize(domain, r.url, kw);
      newProspects.set(domain, {
        id: domain.replace(/\./g, '-'),
        site: `https://${domain}/`,
        nom_entreprise: domain,
        tag: category,
        status: 'a_qualifier',
        email: null,
        prenom_contact: null,
        nom_contact: null,
        blog_url: null,
        article_cible: null,
        ressource_enomia_proposee: null,
        pitch_angle: null,
        type_pitch: 'echange_croise',
        kws_match: [{ kw, position: r.position, url: r.url }],
        date_added: new Date().toISOString().slice(0, 10),
        date_envoi: null,
        date_relance: null,
        reponse: null,
        notes: `Identifié via SEMrush phrase_organic. À enrichir (scan site, contact, opportunité).`,
      });
      added++;
    }
    console.log(`+${added} nouveaux prospects (total ${newProspects.size} uniques)`);
    await new Promise(r => setTimeout(r, 200)); // throttle
  }

  // Limit max prospects pour ce run
  const newList = [...newProspects.values()].slice(0, MAX_PROSPECTS);
  console.log(`\n📊 ${newList.length} nouveaux prospects ajoutés au CRM`);

  // Stats par catégorie
  const byCategory = {};
  for (const p of newList) byCategory[p.tag] = (byCategory[p.tag] || 0) + 1;
  console.log('\nRépartition par tag :');
  Object.entries(byCategory).sort(([, a], [, b]) => b - a).forEach(([cat, count]) => {
    console.log(`  ${cat.padEnd(15)} ${count}`);
  });

  // Append au CRM
  crm.prospects.push(...newList);
  crm.lastUpdate = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(crmPath, JSON.stringify(crm, null, 2));
  console.log(`\n💾 Sauvegardé : ${path.relative(ROOT, crmPath)} (${crm.prospects.length} prospects total)`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
