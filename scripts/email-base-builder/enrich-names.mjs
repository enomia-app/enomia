#!/usr/bin/env node
// scripts/email-base-builder/enrich-names.mjs
//
// Enrichit prenom / nom_gerant des prospects de la base (base_complete.json)
// pour personnaliser l'accroche ("Bonjour Prénom," / "Bonjour M. Nom,").
// Source : mentions-légales / à-propos / contact (le gérant y est une obligation
// légale FR). Extraction par Haiku (Claude Max, OAuth gratuit — jamais l'API
// payante, cf. memory/incident_api_spike_2026-05).
//
// HAUTE CONFIANCE (règle Marc : un nom faux > pas de nom) :
//   - garde-fous déterministes (validateName : blacklist mots non-noms, format,
//     cross-check handle de domaine) ;
//   - on n'accepte que la confiance "haute" renvoyée par le modèle ;
//   - sinon on ne touche à rien (le greeting reste "Bonjour,").
//
// Idempotent : cache data/email-base/.names-cache/<domain>.json. Resumable.
//
// Usage :
//   node scripts/email-base-builder/enrich-names.mjs [--segment=conciergerie]
//        [--limit=N] [--concurrency=5] [--force] [--dry]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { extractDomain } from '../backlinks-source-monthly/filters.mjs';
import { callClaudeMaxJson } from '../lib/claude-cli.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const DIR = path.join(ROOT, 'data', 'email-base');
const BASE_PATH = path.join(DIR, 'base_complete.json');
const CSV_PATH = path.join(DIR, 'base_complete.csv');
const CACHE_DIR = path.join(DIR, '.names-cache');

const MODEL = 'haiku'; // alias (comme loveroom-ai-pass/cabane-ai-pass) — id complet pas reconnu par le claude CLI du mini

const COLS = ['segment', 'campagne', 'nom_boite', 'site', 'email', 'prenom', 'nom_gerant', 'statut', 'phone', 'page_en_ligne', 'ville', 'rcpt_code', 'url_formulaire', 'page_url', 'rating', 'reviews', 'note'];
const SENDABLE = new Set(['verifie', 'a_tester']);
const CONTACT_PATHS = ['mentions-legales', 'mentions-legales.html', 'a-propos', 'qui-sommes-nous', 'contact'];

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)=?(.*)$/); return m ? [m[1], m[2] === '' ? true : m[2]] : [a, true];
}));
const DRY = !!args.dry;
const FORCE = !!args.force;
const LIMIT = args.limit ? parseInt(args.limit, 10) : Infinity;
const CONCURRENCY = parseInt(args.concurrency || '5', 10);
const SEGMENT = args.segment || null;

// Mots qui ne sont jamais un prénom/nom de gérant (génériques, fonctions, marque).
const BAD_WORDS = new Set([
  'contact', 'service', 'support', 'info', 'infos', 'admin', 'equipe', 'team',
  'societe', 'sarl', 'sas', 'sasu', 'eurl', 'sci', 'agence', 'conciergerie',
  'direction', 'gerant', 'gerante', 'monsieur', 'madame', 'directeur', 'directrice',
  'responsable', 'accueil', 'reservation', 'booking', 'commercial', 'bonjour',
  'hello', 'cabane', 'love', 'room', 'spa', 'gite', 'gites', 'location', 'locations',
]);

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const cleanWord = s => String(s || '').trim().replace(/[.,;:]+$/, '');

/**
 * Valide un prénom OU un nom plausible. Pur + exporté (testé).
 * Renvoie le mot nettoyé, ou null si non plausible / risqué.
 */
export function validateName(word, { siteDomain } = {}) {
  const w = cleanWord(word);
  if (!w) return null;
  if (w.length < 2 || w.length > 30) return null;
  if (/\d/.test(w)) return null;
  if (!/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]+$/.test(w)) return null;     // lettres/accents/tiret/apostrophe
  if (w === w.toUpperCase() && w.length > 3) return null;        // tout majuscule = pas un nom propre
  const nw = norm(w);
  if (BAD_WORDS.has(nw)) return null;
  if (nw.split(/[\s'-]/).some(p => p && BAD_WORDS.has(p))) return null; // composé avec un mot interdit
  // Cross-check handle de domaine : le "nom" ne doit pas être un segment du domaine
  // (= on a récupéré la marque, pas une personne).
  if (siteDomain) {
    const segs = norm(siteDomain).split('.').filter(s => s.length >= 4);
    if (segs.some(s => s.includes(nw) || nw.includes(s))) return null;
  }
  return w;
}

/**
 * Applique le verdict LLM aux champs prenom/nom_gerant (haute confiance only).
 * Pur + exporté (testé). Renvoie { prenom, nom_gerant } (chaînes, '' si rien).
 */
export function resolveName(llm, { siteDomain } = {}) {
  if (!llm || llm.confiance !== 'haute') return { prenom: '', nom_gerant: '' };
  const prenom = validateName(llm.prenom, { siteDomain });
  const nom = validateName(llm.nom, { siteDomain });
  if (prenom) return { prenom, nom_gerant: '' };       // prénom = zéro risque de genre
  if (nom) return { prenom: '', nom_gerant: nom };     // sinon "Bonjour M. Nom,"
  return { prenom: '', nom_gerant: '' };
}

async function fetchText(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return null;
    const html = await r.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 4000);
  } catch { return null; }
}

// Cherche la page qui contient des marqueurs de mentions légales (gérant obligatoire).
async function findLegalText(domain) {
  for (const p of CONTACT_PATHS) {
    const t = await fetchText(`https://${domain}/${p}`);
    if (t && t.length > 150 && /(g[ée]rant|responsable|publication|SIREN|SIRET|RCS|repr[ée]sent)/i.test(t)) return t;
  }
  return null;
}

async function extractNameLLM(text, nomBoite) {
  const prompt = `Voici le texte des mentions légales (ou page à-propos) d'un site d'entreprise française. Trouve le NOM de la PERSONNE PHYSIQUE qui dirige (gérant, président, directeur de la publication, responsable légal). PAS la raison sociale, PAS un nom d'agence ou de marque.

Réponds en JSON strict : {"prenom": "...", "nom": "...", "confiance": "haute|moyenne|basse"}.
- "prenom"/"nom" = "" si tu n'es pas sûr.
- "confiance" = "haute" UNIQUEMENT si le texte nomme explicitement la personne (ex. "Gérant : Jean Dupont", "représentée par M. Jean Dupont", "Directeur de la publication : Marie Martin"). Sinon "moyenne" ou "basse".
- N'invente JAMAIS. Dans le doute : confiance "basse", champs vides.

Entreprise : "${nomBoite || ''}"

Texte :
${text}`;
  try {
    const obj = await callClaudeMaxJson(prompt, { model: MODEL });
    return (obj && typeof obj === 'object') ? obj : null;
  } catch { return null; }
}

// ─── I/O base ────────────────────────────────────────────────────────────
function loadBase() {
  if (!fs.existsSync(BASE_PATH)) { console.error(`❌ base absente: ${BASE_PATH}`); process.exit(1); }
  return JSON.parse(fs.readFileSync(BASE_PATH, 'utf-8'));
}
const csvCell = v => { v = v == null ? '' : String(v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
function writeBase(rows) {
  fs.writeFileSync(BASE_PATH, JSON.stringify(rows, null, 2));
  const csv = '﻿' + COLS.join(';') + '\n' + rows.map(r => COLS.map(c => csvCell(r[c])).join(';')).join('\n') + '\n';
  fs.writeFileSync(CSV_PATH, csv);
}

function cachePath(domain) { return path.join(CACHE_DIR, domain.replace(/[^a-z0-9.-]/gi, '_') + '.json'); }
function readCache(domain) { try { return JSON.parse(fs.readFileSync(cachePath(domain), 'utf-8')); } catch { return null; } }
function writeCache(domain, v) { fs.mkdirSync(CACHE_DIR, { recursive: true }); fs.writeFileSync(cachePath(domain), JSON.stringify(v)); }

async function pool(items, fn, concurrency) {
  let next = 0;
  async function worker() { while (next < items.length) { const i = next++; await fn(items[i], i); } }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
}

async function main() {
  const rows = loadBase();
  // Candidats : envoyables, avec site, sans identité encore connue.
  const candidates = rows.filter(r =>
    SENDABLE.has(r.statut) && r.site && !r.prenom && !r.nom_gerant && (!SEGMENT || r.segment === SEGMENT),
  ).slice(0, LIMIT);

  console.log(`👤 enrich-names : ${candidates.length} candidats (segment=${SEGMENT || 'tous'}, model=${MODEL}, dry=${DRY})`);
  let found = 0, done = 0;
  const diag = { noLegal: 0, llmFail: 0, lowConf: 0, rejected: 0, fromCache: 0 };

  await pool(candidates, async (r) => {
    const domain = extractDomain(/^https?:/.test(r.site) ? r.site : 'https://' + r.site);
    if (!domain) return;

    let resolved = (!FORCE && readCache(domain)) || null;
    if (resolved) {
      diag.fromCache++;
    } else {
      const text = await findLegalText(domain);
      if (!text) { diag.noLegal++; resolved = { prenom: '', nom_gerant: '' }; }
      else {
        const llm = await extractNameLLM(text, r.nom_boite);
        if (!llm) { diag.llmFail++; resolved = { prenom: '', nom_gerant: '' }; }
        else if (llm.confiance !== 'haute') { diag.lowConf++; resolved = { prenom: '', nom_gerant: '' }; }
        else {
          resolved = resolveName(llm, { siteDomain: domain });
          if (!resolved.prenom && !resolved.nom_gerant) diag.rejected++;
        }
      }
      writeCache(domain, resolved);
    }
    if (resolved.prenom || resolved.nom_gerant) {
      found++;
      if (resolved.prenom) r.prenom = resolved.prenom;
      if (resolved.nom_gerant) r.nom_gerant = resolved.nom_gerant;
      console.log(`  ✓ ${domain} → ${resolved.prenom ? 'Bonjour ' + resolved.prenom : 'Bonjour M. ' + resolved.nom_gerant}`);
    }
    if (++done % 20 === 0) console.log(`  … ${done}/${candidates.length} (${found} noms)`);
  }, CONCURRENCY);

  console.log(`\n✅ ${found}/${candidates.length} identités trouvées (haute confiance).`);
  console.log(`   diag : pas de mentions légales=${diag.noLegal} · LLM échec=${diag.llmFail} · confiance basse=${diag.lowConf} · rejeté garde-fou=${diag.rejected} · depuis cache=${diag.fromCache}`);
  if (!DRY) { writeBase(rows); console.log(`📄 ${BASE_PATH} mis à jour`); }
  else console.log('(dry : base non modifiée)');
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });
