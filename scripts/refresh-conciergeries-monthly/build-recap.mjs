#!/usr/bin/env node
/**
 * Construit un récap texte des changements du refresh mensuel, à partir de
 * scripts/places-corrections-changelog.json (produit par apply-places-corrections.mjs).
 * Sortie sur stdout, destinée au corps de l'email Resend.
 *
 * Format voulu (Marc, 2026-06-30) :
 *   - DÉTAIL des conciergeries passées de 0 à des avis (= nouvelles étoiles SERP),
 *     groupées par ville, non tronqué.
 *   - Simple COMPTEUR pour les autres mises à jour (dérive de note de routine).
 *
 * Usage : node build-recap.mjs [chemin-changelog.json]   (défaut = fichier canonique)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const CHANGELOG = process.argv[2] || path.join(ROOT, 'scripts/places-corrections-changelog.json');

let log = [];
try {
  log = JSON.parse(fs.readFileSync(CHANGELOG, 'utf8'));
} catch {
  console.log('Changelog illisible.');
  process.exit(0);
}

const prettyCity = (slug) => slug.charAt(0).toUpperCase() + slug.slice(1);

const updated = log.filter((e) => e.type === 'updated');
// Nouvelle étoile = conciergerie passée de 0 avis à des avis réels → active les étoiles dans Google.
const newStars = updated.filter(
  (e) => e.from && (e.from.reviews || 0) === 0 && e.to && (e.to.reviews || 0) > 0
);
const drift = updated.length - newStars.length;

const lines = [];
lines.push(`Conciergeries auditées : ${log.length}`);
lines.push('');

if (newStars.length === 0) {
  lines.push('⭐ Nouvelles étoiles : aucune ce mois-ci.');
} else {
  const cities = [...new Set(newStars.map((e) => e.slug))].sort();
  lines.push(`⭐ Nouvelles étoiles — ${newStars.length} conciergerie(s) dans ${cities.length} ville(s) :`);
  for (const slug of cities) {
    lines.push('');
    lines.push(`  ${prettyCity(slug)} :`);
    const items = newStars
      .filter((e) => e.slug === slug)
      .sort((a, b) => (b.to.reviews || 0) - (a.to.reviews || 0));
    for (const e of items) {
      lines.push(`    • ${e.conciergerie} : ${e.to.rating ?? '?'}★ / ${e.to.reviews ?? '?'} avis`);
    }
  }
}

lines.push('');
lines.push(`Autres conciergeries mises à jour (dérive de note) : ${drift}`);

console.log(lines.join('\n'));
