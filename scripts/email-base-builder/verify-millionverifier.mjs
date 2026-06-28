// scripts/email-base-builder/verify-millionverifier.mjs
//
// Vérifie tous les emails de base_complete.json via l'API MillionVerifier et
// met à jour les statuts (zéro-bounce : on ne gardera "verifie" QUE les `ok`).
//
// Clé : env MILLIONVERIFIER_API_KEY, sinon ~/Desktop/eunomia/.env, sinon ROOT/.env
// Usage : node verify-millionverifier.mjs [--dry]
//
// Mapping result → statut :
//   ok                  → verifie     (envoyable)
//   catch_all           → catch_all   (domaine accepte tout : risqué, on n'envoie pas sur domaine neuf)
//   unknown/unverified  → incertain   (non tranché : on n'envoie pas)
//   invalid/disposable  → faux_email  (ne pas envoyer)

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const dir = path.join(ROOT, 'data', 'email-base');
const DRY = process.argv.includes('--dry');

// ─── Clé ─────────────────────────────────────────────────────────────────
let KEY = process.env.MILLIONVERIFIER_API_KEY;
if (!KEY) {
  for (const p of [path.join(os.homedir(), 'Desktop/eunomia/.env'), path.join(ROOT, '.env')]) {
    try { KEY = fs.readFileSync(p, 'utf8').match(/^MILLIONVERIFIER_API_KEY=(.+)$/m)?.[1]?.trim(); if (KEY) break; } catch { /* */ }
  }
}
if (!KEY) { console.error('❌ MILLIONVERIFIER_API_KEY manquante (env ou ~/Desktop/eunomia/.env)'); process.exit(1); }

const all = JSON.parse(fs.readFileSync(path.join(dir, 'base_complete.json'), 'utf8'));
// --priority : ne vérifie que blogs + conciergeries dont la page ville est en
// ligne (haute valeur, pour tenir dans un budget de crédits limité).
const PRIORITY = process.argv.includes('--priority');
const SEG = (process.argv.find(a => a.startsWith('--segment=')) || '').split('=')[1];
const isPriority = r => r.segment === 'blog_lcd' || r.segment === 'blog_simulateur' || (r.segment === 'conciergerie' && r.page_en_ligne === 'oui');
let pool = all;
if (PRIORITY) pool = all.filter(isPriority);
else if (SEG) pool = all.filter(r => r.segment === SEG && !r.mv); // incrémental : seulement les non encore vérifiés
const emails = [...new Set(pool.filter(r => r.email).map(r => r.email.toLowerCase()))];
const scope = PRIORITY ? ' (prioritaire)' : SEG ? ` (segment ${SEG}, non encore vérifiés)` : ' (tous)';
console.log(`🔎 MillionVerifier : ${emails.length} emails uniques${scope}${DRY ? ' (DRY)' : ''}`);

const MAP = { ok: 'verifie', catch_all: 'catch_all', invalid: 'faux_email', disposable: 'faux_email', unknown: 'incertain', unverified: 'incertain' };

async function verify(email) {
  const u = `https://api.millionverifier.com/api/v3/?api=${KEY}&email=${encodeURIComponent(email)}&timeout=20`;
  const r = await fetch(u, { signal: AbortSignal.timeout(35000) });
  return r.json();
}

const resultByEmail = new Map();
let done = 0, credits = null, errors = 0, next = 0, creditsOut = false;
const CONC = 8;
async function worker() {
  while (next < emails.length && !creditsOut) {
    const e = emails[next++];
    try {
      const j = await verify(e);
      if (j.error) { errors++; if (/credit/i.test(j.error)) { creditsOut = true; break; } }
      else { resultByEmail.set(e, j.result || 'unknown'); if (typeof j.credits === 'number') credits = j.credits; }
    } catch { errors++; }
    if (++done % 50 === 0) console.log(`  … ${done}/${emails.length}`);
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
if (creditsOut) console.warn(`⚠️ Crédits épuisés — ${resultByEmail.size}/${emails.length} vérifiés, le reste reste 'a_tester'.`);
if (!DRY && resultByEmail.size === 0) { console.log('Rien de nouveau à écrire.'); process.exit(0); }

// Applique aux lignes
const counts = {};
for (const r of all) {
  if (!r.email) continue;
  const res = resultByEmail.get(r.email.toLowerCase());
  if (!res) continue;
  counts[res] = (counts[res] || 0) + 1;
  r.mv = res;
  r.statut = MAP[res] || r.statut;
  r.note = ((r.note || '').replace(/\s*\|?\s*MV:\w+/g, '').trim());
  r.note = (r.note ? r.note + ' | ' : '') + 'MV:' + res;
}

console.log('\n📊 Résultats MillionVerifier :', JSON.stringify(counts));
console.log(`   erreurs API : ${errors}${credits !== null ? ` | crédits restants : ${credits}` : ''}`);
const sendable = all.filter(r => r.statut === 'verifie').length;
console.log(`   → ${sendable} emails "verifie" (ok) = envoyables sans risque de bounce`);

if (DRY) { console.log('(DRY — rien écrit)'); process.exit(0); }

const rank = { verifie: 0, a_tester: 1, formulaire: 2, catch_all: 3, incertain: 4, faux_email: 5, ecarte: 6, erreur: 7 };
all.sort((a, b) => (a.campagne - b.campagne) || ((rank[a.statut] ?? 9) - (rank[b.statut] ?? 9)));
fs.writeFileSync(path.join(dir, 'base_complete.json'), JSON.stringify(all, null, 2));
const COLS = ['segment', 'campagne', 'nom_boite', 'site', 'email', 'prenom', 'statut', 'phone', 'page_en_ligne', 'ville', 'rcpt_code', 'url_formulaire', 'page_url', 'note'];
const cell = v => { v = v == null ? '' : String(v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
fs.writeFileSync(path.join(dir, 'base_complete.csv'), '﻿' + COLS.join(';') + '\n' + all.map(r => COLS.map(c => cell(r[c])).join(';')).join('\n') + '\n');
try { execSync(`python3 "${path.join(__dirname, 'to_xlsx.py')}"`, { stdio: 'inherit', cwd: ROOT }); } catch (e) { console.log('⚠️ xlsx:', e.message); }
