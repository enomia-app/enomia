#!/usr/bin/env node
/**
 * Liste déterministe des URLs soumises à GSC un jour donné, lue depuis state.json.
 * Indépendant du rapport libre de l'agent → garantit que l'email quotidien
 * (gsc-indexation-claude/run.sh) contient toujours les URLs effectivement poussées.
 *
 * Pur node, lecture seule. Usage : node scripts/gsc-soumissions-jour.mjs [YYYY-MM-DD]
 * (défaut = aujourd'hui ; run.sh passe son DATE_TAG pour coller à la même date).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATE = path.join(ROOT, '.claude/gsc-tracking/state.json');
const day = process.argv[2] || new Date().toISOString().slice(0, 10);
const short = (u) => u.replace('https://www.enomia.app', '');

if (!fs.existsSync(STATE)) { console.log('(state.json absent)'); process.exit(0); }
const s = JSON.parse(fs.readFileSync(STATE, 'utf8'));
const today = Object.entries(s.urls || {}).filter(([, x]) => x.last_requested === day);

if (!today.length) { console.log(`Aucune URL soumise le ${day}.`); process.exit(0); }

const requested = today.filter(([, x]) => x.status === 'requested')
  .sort((a, b) => (b[1].vol_at_request || 0) - (a[1].vol_at_request || 0));
const failed = today.filter(([, x]) => x.status === 'failed');

console.log(`${requested.length} URL(s) soumise(s) le ${day} :`);
requested.forEach(([u, x], i) => {
  console.log(`  ${String(i + 1).padStart(2)}. vol ${String(x.vol_at_request ?? '?').padStart(5)} — ${short(u)}`);
});

if (failed.length) {
  console.log(`\n${failed.length} échec(s) ce jour (à retenter) :`);
  failed.forEach(([u, x]) => console.log(`   ✗ ${short(u)} — ${x.reason || x.status}`));
}
