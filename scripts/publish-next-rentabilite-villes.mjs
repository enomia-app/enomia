#!/usr/bin/env node
/**
 * Publication progressive des villes rentabilité (3 par exécution, PAR RÉGION).
 *
 * Ordre de publication :
 *   - régions par nombre de villes classables (desc) → on traite les grosses régions d'abord
 *   - dans chaque région, villes par rendement (ratio desc) → les meilleures d'abord
 *   → effet : on « finit » une région avant la suivante, et le haut du classement se remplit vite.
 *
 * Passe `published: false → true` pour les 3 prochaines villes non publiées, réécrit le dataset,
 * et écrit un récap dans GITHUB_OUTPUT (lu par run.sh pour le commit + l'email).
 *
 * AUCUN coût API (git + node pur). Le commit + push + email sont faits par run.sh.
 *
 * Usage :
 *   node scripts/publish-next-rentabilite-villes.mjs            # publie les 3 prochaines
 *   node scripts/publish-next-rentabilite-villes.mjs --dry-run  # affiche sans rien modifier
 */
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';

const DATA = 'src/data/rentabilite-villes.json';
const N = 3; // villes par exécution
const SITE = 'https://www.enomia.app';
const DRY = process.argv.includes('--dry-run');

const data = JSON.parse(readFileSync(DATA, 'utf8'));

// Ordre : régions (classables desc) puis ratio desc dans chaque région.
const regionsOrder = [...data.regions].filter((r) => r.classables > 0).sort((a, b) => b.classables - a.classables);
const flat = [];
for (const r of regionsOrder) {
  const rv = data.villes.filter((v) => v.classable && v.region_slug === r.slug).sort((a, b) => b.ratio - a.ratio);
  flat.push(...rv);
}

const remaining = flat.filter((v) => !v.published);
const next = remaining.slice(0, N);
console.log(`classables: ${flat.length} | publiées: ${flat.length - remaining.length} | restantes: ${remaining.length}`);

if (next.length === 0) {
  console.log('✅ Toutes les villes sont déjà publiées — rien à faire.');
  process.exit(0);
}

for (const v of next) {
  console.log(`  + ${v.ville} (${v.region}) — ${v.ratio}%`);
  if (!DRY) v.published = true;
}

if (DRY) { console.log('(dry-run : aucune écriture)'); process.exit(0); }

writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');

const remAfter = remaining.length - next.length;
const lines = next.map((v) => `- ${v.ville} (${v.region}) — ${v.ratio}% de rendement brut\n  ${SITE}/rentabilite-airbnb/${v.region_slug}/${v.slug}`);
const subject = `🏘️ ${next.length} villes rentabilité publiées : ${next.map((v) => v.ville).join(', ')}`;
const body = `${next.length} nouvelles villes viennent d'être publiées sur le classement rentabilité Airbnb :

${lines.join('\n')}

Reste à publier : ${remAfter} villes.
Déploiement Vercel déclenché (en ligne dans quelques minutes).

— cron rentabilite-publish (3 villes, mardi + samedi)`;

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `published_count=${next.length}\n`);
  appendFileSync(process.env.GITHUB_OUTPUT, `published_slugs=${next.map((v) => v.slug).join(',')}\n`);
  appendFileSync(process.env.GITHUB_OUTPUT, `published_subject=${subject}\n`);
}
// Corps de l'email (multiligne) écrit dans un fichier — évite tout échappement dans GITHUB_OUTPUT.
if (process.env.EMAIL_BODY_OUT) writeFileSync(process.env.EMAIL_BODY_OUT, body);
console.log(`\nPublié ${next.length}. Reste ${remAfter}.`);
