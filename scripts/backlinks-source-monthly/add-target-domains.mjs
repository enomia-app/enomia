#!/usr/bin/env node
// scripts/backlinks-source-monthly/add-target-domains.mjs
//
// Injecte une LISTE de domaines CIBLÉS (curés à la main) dans le CRM backlinks,
// enrichis comme le sourcing auto : AS (SEMrush backlinks_overview, analytics/v1),
// trafic (domain_ranks), contact (email/formulaire), détection outils/blog,
// validation email (isPitchable + MX + SMTP RCPT). status='pending'.
//
// Cas d'usage : cibles stratégiques (ex. formations LCD = pistes partenariat 2027,
// cf memory plan_distribution_formations_2027) à amorcer en échange de liens.
//
// ⚠️ send-daily ne pitche QUE les is_blog=true + email valide. Les sites de vente
//    sans blog sont ajoutés mais marqués "manuel" (à contacter à la main par Marc).
//
// Usage :
//   node add-target-domains.mjs           → DRY (enrichit + rapport, rien écrit)
//   node add-target-domains.mjs --write    → ajoute au CRM les domaines non-dupliqués

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectAll, extractContact, isPitchableEmail, hasValidMX, verifyMailbox } from './filters.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const WRITE = process.argv.includes('--write');
const MONTH = new Date().toISOString().slice(0, 7);
const CRM = path.join(ROOT, 'data', `backlinks-${MONTH}.json`);
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

function readEnvKey(key) {
  if (process.env[key]) return process.env[key].trim();
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const m = fs.readFileSync(envPath, 'utf-8').match(new RegExp(`^${key}=(.+)$`, 'm'));
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}
const SEMRUSH_KEY = readEnvKey('SEMRUSH_API_KEY');
if (!SEMRUSH_KEY) { console.error('❌ SEMRUSH_API_KEY introuvable'); process.exit(1); }

const normDomain = (s) => (s || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').trim();

// ─── Cibles : formations LCD/conciergerie (recherche 2026-06-15) ───
// hosting-academy.fr (déjà en contact) et digital-bnb.com (déjà traité, Mike) exclus.
const TARGETS = [
  { domain: 'locationcourteduree.fr', note: 'Le Sous-Loueur (Sebastien More), 3018+ diplomes, Qualiopi+CPF, pas d incumbent — TOP piste 2027' },
  { domain: 'caroleanneconciergerie.com', semrush: 'conciergeriefrenchy.com', note: 'Carole Anne/Frenchy, 1500+ accompagnes, pas d outil nomme (301 vers conciergeriefrenchy.com)' },
  { domain: 'eldorado-immobilier.com', note: 'Pierre Tellep, 6500 proprios, presse Capital/Le Monde — incumbent Beds24+Hospitable (backlink only)' },
  { domain: 'moyaconciergerie.com', note: 'Julie Moya Pichaud, Qualiopi+CPF — outil maison Moya Sync (backlink only)' },
  { domain: 'thomasdardour.com', note: 'Thomas Dardour — incumbent Beds24 (backlink only)' },
  { domain: 'romaingiacalone.com', note: 'Romain Giacalone, petit volume, pas CPF, pas d incumbent' },
  { domain: 'hostnfly.com', note: 'HostnFly, franchise stack interne — backlink only, pas canal distrib' },
  { domain: 'leconsultantbnb.fr', note: 'Le Consultant BNB (Biarritz), serieux moyen a confirmer, pas d outil nomme' },
  { domain: 'hote-academy.com', note: 'Hote Academy, 690e/30h, Qualiopi (source tierce a verifier)' },
];

async function queryTraffic(domain) {
  const url = `https://api.semrush.com/?type=domain_ranks&key=${SEMRUSH_KEY}&export_columns=Dn,Rk,Or,Ot&domain=${encodeURIComponent(domain)}&database=fr`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const t = await r.text();
    if (t.includes('ERROR')) return { traffic: 0, kw: 0 };
    const lines = t.trim().split('\n');
    if (lines.length < 2) return { traffic: 0, kw: 0 };
    const c = lines[1].split(';');
    return { kw: parseInt(c[2], 10) || 0, traffic: parseInt(c[3], 10) || 0 };
  } catch { return { traffic: 0, kw: 0 }; }
}

async function queryAscore(domain) {
  const url = `https://api.semrush.com/analytics/v1/?key=${SEMRUSH_KEY}&type=backlinks_overview&target=${encodeURIComponent(domain)}&target_type=root_domain&export_columns=ascore,total,domains_num`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const t = await r.text();
    if (t.includes('ERROR')) return { ascore: null };
    const lines = t.trim().split('\n');
    if (lines.length < 2) return { ascore: null };
    const c = lines[1].split(';');
    return { ascore: parseInt(c[0], 10) || 0, ref_domains: parseInt(c[2], 10) || 0 };
  } catch { return { ascore: null }; }
}

const backlog = JSON.parse(fs.readFileSync(CRM, 'utf-8'));
const existing = new Set(backlog.candidates.map(c => normDomain(c.site)));
log(`📋 ${TARGETS.length} cibles à enrichir — mode ${WRITE ? 'WRITE ✍️' : 'DRY 👀'}`);

const results = [];
for (const tgt of TARGETS) {
  const dom = normDomain(tgt.domain);
  const dup = existing.has(dom);
  const page = `https://${dom}/`;
  const [traf, as] = await Promise.all([queryTraffic(tgt.semrush || dom), queryAscore(tgt.semrush || dom)]);
  let det = null, contact = { email: null, url_formulaire: null };
  try { det = await detectAll(page, dom); } catch { /* fetch fail */ }
  try { contact = await extractContact(page); } catch { /* fetch fail */ }

  let email = contact.email;
  let emailStatus = 'aucun';
  if (email) {
    let ok = isPitchableEmail(email, dom);
    if (ok) ok = await hasValidMX(email.split('@')[1]);
    if (!ok) { email = null; emailStatus = 'rejeté (format/MX)'; }
    else { const v = await verifyMailbox(email); emailStatus = v.status; if (v.status === 'invalid') email = null; }
  }

  const rec = {
    site: dom, page_cible: page, semrush_target: tgt.semrush || dom,
    ascore: as.ascore, ref_domains: as.ref_domains ?? null, organic_traffic: traf.traffic, serp_traffic: traf.traffic,
    email, url_formulaire: contact.url_formulaire,
    outils_presents: det?.tools || [], is_conciergerie: det?.is_conciergerie ?? null,
    is_blog: det?.is_blog ?? null, fetch_status: det ? 'ok' : 'fail',
    source: 'manual_strategic_formation', note: tgt.note,
    status: 'pending', created_at: new Date().toISOString(),
    _dup: dup, _emailStatus: emailStatus,
  };
  results.push(rec);
  const autoPitch = !dup && rec.is_blog && email;
  log(`${dup ? '⏭ DEJA ' : '＋ NEW '} ${dom.padEnd(28)} AS=${String(as.ascore ?? '?').padStart(3)} tr=${String(traf.traffic).padStart(6)} blog=${String(rec.is_blog).padEnd(5)} email=${(email || '—').padEnd(32)} ${emailStatus.padEnd(8)} ${dup ? '' : autoPitch ? '→ AUTO-PITCH' : '→ MANUEL'}`);
}

log('\n=== BILAN ===');
const toAdd = results.filter(r => !r._dup);
const autoPitchable = toAdd.filter(r => r.is_blog && r.email);
log(`  cibles ${results.length} | déjà CRM ${results.length - toAdd.length} | nouvelles ${toAdd.length}`);
log(`  → auto-pitchables (blog + email valide) : ${autoPitchable.length}`);
log(`  → à contacter MANUELLEMENT (pas blog ou pas d email) : ${toAdd.length - autoPitchable.length}`);

if (WRITE && toAdd.length) {
  // Backup nommé pour matcher .gitignore `data/backlinks-*.json` → ne salit jamais
  // le working tree du Mac mini (sinon la sync launchd git-pull se bloque).
  const bak = path.join(ROOT, 'data', `backlinks-${MONTH}-bak-${new Date().toISOString().slice(0, 19).replace(/[:T-]/g, '')}.json`);
  fs.copyFileSync(CRM, bak);
  for (const r of toAdd) { const { _dup, _emailStatus, ...clean } = r; backlog.candidates.push(clean); }
  fs.writeFileSync(CRM, JSON.stringify(backlog, null, 2));
  log(`\n💾 ${toAdd.length} domaines ajoutés au CRM (backup: ${path.basename(bak)}). send-daily pitchera les blog+email ; les autres = manuel.`);
} else if (!WRITE) {
  log(`\n👀 DRY — rien écrit. --write pour ajouter au CRM.`);
}
process.exit(0);
