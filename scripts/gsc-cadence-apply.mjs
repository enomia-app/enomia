#!/usr/bin/env node
/**
 * Applique la décision de cadence proposée par l'agent (gsc-cadence-weekly) avec GARDE-FOUS DURS :
 *   - chaque niche clampée à [bornesParRun.min, bornesParRun.max]
 *   - total hebdo plafonné à maxPagesPerWeek (sinon on décrémente la niche à plus grosse contribution)
 * Écrit scripts/publication-cadence.json + imprime le diff (repris dans l'email).
 *
 * L'IA propose, ce script DISPOSE : Claude ne peut jamais faire déraper la cadence.
 * Usage : node scripts/gsc-cadence-apply.mjs '<json>'   (ou JSON via stdin)
 *   json attendu : {"conciergerie":N,"love-room":N,"cabane":N,"reason":"..."}
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'scripts/publication-cadence.json');
const NICHES = ['conciergerie', 'love-room', 'cabane'];

const raw = process.argv[2] || fs.readFileSync(0, 'utf8');
let prop;
try { prop = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]); } catch { console.error('❌ proposition JSON invalide :', raw.slice(0, 200)); process.exit(1); }

const cfg = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const { min, max } = cfg.bornesParRun || { min: 1, max: 6 };
const rpw = cfg.runsPerWeek || { conciergerie: 3, 'love-room': 2, cabane: 2 };
const MAXW = cfg.maxPagesPerWeek || 20;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const weekly = (o) => NICHES.reduce((s, n) => s + (rpw[n] || 0) * o[n], 0);

const before = Object.fromEntries(NICHES.map((n) => [n, cfg[n].villesParRun]));
const next = Object.fromEntries(NICHES.map((n) => {
  const v = Number.isFinite(+prop[n]) ? Math.round(+prop[n]) : cfg[n].villesParRun;
  return [n, clamp(v, min, max)];
}));
// Plafond hebdo : tant que > MAXW, décrémenter la niche à plus grosse contribution (et > min).
let guardHit = false;
while (weekly(next) > MAXW) {
  const cand = NICHES.filter((n) => next[n] > min).sort((a, b) => (rpw[b] * next[b]) - (rpw[a] * next[a]))[0];
  if (!cand) break;
  next[cand]--; guardHit = true;
}

NICHES.forEach((n) => { cfg[n].villesParRun = next[n]; });
cfg.lastDecision = { date: new Date().toISOString().slice(0, 10), by: 'gsc-cadence-weekly', weeklyTotal: weekly(next), guardHit, reason: (prop.reason || '').slice(0, 500) };
fs.writeFileSync(FILE, JSON.stringify(cfg, null, 2) + '\n');

console.log('Cadence mise à jour (villes/zones par run) :');
NICHES.forEach((n) => console.log(`  ${n.padEnd(13)} ${before[n]} → ${next[n]}${before[n] !== next[n] ? '  ✱' : ''}`));
console.log(`Total : ${weekly(next)}/${MAXW} pages par semaine${guardHit ? ' — plafond 20/sem appliqué' : ''}`);
console.log(`Raison IA : ${(prop.reason || '(aucune)').slice(0, 400)}`);
