#!/usr/bin/env node
/**
 * Construit un récap texte des changements du refresh mensuel, à partir de
 * scripts/places-corrections-changelog.json (produit par apply-places-corrections.mjs).
 * Sortie sur stdout, destinée au corps de l'email Resend.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let log = [];
try {
  log = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/places-corrections-changelog.json'), 'utf8'));
} catch {
  console.log('Changelog illisible.');
  process.exit(0);
}

const byType = {};
for (const e of log) byType[e.type] = (byType[e.type] || 0) + 1;

const lines = [];
lines.push(`Conciergeries auditées : ${log.length}`);
lines.push('Répartition : ' + Object.entries(byType).map(([t, n]) => `${t}=${n}`).join(', '));
lines.push('');

// Changements réels (tout sauf no_change)
const changed = log.filter((e) => e.type && e.type !== 'no_change');
if (changed.length === 0) {
  lines.push('Aucune note modifiée ce mois-ci (toutes stables).');
} else {
  lines.push(`Notes modifiées (${changed.length}) :`);
  for (const e of changed.slice(0, 60)) {
    const r = e.target ? `${e.target.rating ?? '?'}★/${e.target.reviews ?? '?'}` : '';
    const from = e.from ? ` (avant ${e.from.rating ?? '?'}★/${e.from.reviews ?? '?'})` : '';
    lines.push(`  • ${e.slug} — ${e.conciergerie} : ${e.type} ${r}${from}`);
  }
  if (changed.length > 60) lines.push(`  … +${changed.length - 60} autres`);
}

console.log(lines.join('\n'));
