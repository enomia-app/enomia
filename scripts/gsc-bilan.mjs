#!/usr/bin/env node
/**
 * Bilan GSC quotidien : lit .claude/gsc-tracking/index-status.json (généré par gsc-fetch-index-status),
 * ventile l'indexation par section (conciergerie / rentabilité / love-room / cabane / blog), et :
 *   - imprime un résumé (récupéré par gsc-indexation-claude/run.sh → ajouté à l'email du jour)
 *   - ENRICHIT .claude/gsc-tracking/state.json (le fichier que l'agent GSC tient déjà) avec un
 *     historique `bilans` daté, lu chaque lundi par gsc-cadence-weekly pour ajuster la cadence.
 *
 * Aucun appel réseau / IA : pur node. Read-modify-write de state.json (préserve last_run + urls).
 * Usage : node scripts/gsc-bilan.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATUS = path.join(ROOT, '.claude/gsc-tracking/index-status.json');
const STATE = path.join(ROOT, '.claude/gsc-tracking/state.json');
const KEEP_DAYS = 40; // on ne garde que les ~40 derniers bilans dans state.json

if (!fs.existsSync(STATUS)) { console.error('⚠️ index-status.json absent — pas de bilan (lancer gsc-fetch-index-status.mjs)'); process.exit(0); }
const data = JSON.parse(fs.readFileSync(STATUS, 'utf8'));
const byUrl = data.byUrl || data.urls || {};

const SECTIONS = [
  ['conciergerie', /\/conciergerie-airbnb\//],
  ['rentabilite', /\/rentabilite-airbnb\//],
  ['love-room', /\/love-room\//],
  ['cabane', /\/cabane\//],
  ['blog', /\/blog\//],
];
const sectionOf = (u) => (SECTIONS.find(([, re]) => re.test(u)) || ['autres'])[0];
const isIndexed = (s) => /\bindexed\b/i.test(s) && !/not indexed/i.test(s);
const isBlocked = (s) => /noindex|redirect|404|not found|duplicate|excluded|soft 404/i.test(s);

const acc = {};
for (const [url, d] of Object.entries(byUrl)) {
  const sec = sectionOf(url);
  const cs = (d.coverageState || d.state || '') + '';
  acc[sec] ||= { total: 0, indexed: 0, pending: 0, blocked: 0 };
  acc[sec].total++;
  // Ordre IMPORTANT : bloqué (noindex/redirect/404) d'abord, sinon une page noindex à verdict PASS
  // serait comptée « indexée » à tort.
  if (isBlocked(cs)) acc[sec].blocked++;
  else if (d.verdict === 'PASS' || isIndexed(cs)) acc[sec].indexed++;
  else acc[sec].pending++;
}

const order = ['conciergerie', 'rentabilite', 'love-room', 'cabane', 'blog', 'autres'];
const secs = order.filter((s) => acc[s]);
const rate = (a) => { const base = a.indexed + a.pending; return base ? Math.round((a.indexed / base) * 100) : 0; };
const tot = Object.values(acc).reduce((t, a) => ({ total: t.total + a.total, indexed: t.indexed + a.indexed, pending: t.pending + a.pending, blocked: t.blocked + a.blocked }), { total: 0, indexed: 0, pending: 0, blocked: 0 });
const date = new Date().toISOString().slice(0, 10);

// ── Enrichit state.json (read-modify-write, préserve last_run + urls) ──
let state = {};
try { state = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { state = {}; }
state.bilans ||= {};
state.bilans[date] = { perSection: acc, total: tot, rate: rate(tot) };
// purge : ne garder que les KEEP_DAYS dates les plus récentes
const dates = Object.keys(state.bilans).sort();
for (const d of dates.slice(0, Math.max(0, dates.length - KEEP_DAYS))) delete state.bilans[d];
fs.writeFileSync(STATE, JSON.stringify(state, null, 2));

// ── Résumé console (repris dans l'email gsc-indexation du jour) ──
const fmt = (a) => `${a.indexed}/${a.indexed + a.pending} indexées (${rate(a)}%)${a.pending ? `, ${a.pending} en attente` : ''}${a.blocked ? `, ${a.blocked} hors-scope` : ''}`;
console.log(`📊 Bilan GSC ${date} — ${tot.indexed}/${tot.indexed + tot.pending} pages indexées (${rate(tot)}%), ${tot.pending} en attente`);
for (const s of secs) console.log(`   • ${s.padEnd(13)} : ${fmt(acc[s])}`);
console.log(`→ historisé dans state.json (bilans), lu par gsc-cadence-weekly`);
