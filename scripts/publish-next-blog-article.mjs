#!/usr/bin/env node
/**
 * Publication progressive des articles blog (1 par exécution).
 *
 * Logique :
 *   - Lit scripts/blog-publish-queue.json (ordre de priorité : piliers + volume)
 *   - Parcourt la queue, trouve le 1er article encore en status: brouillon
 *   - Le passe en status: en-ligne + met à jour publishedAt + updatedAt à today
 *   - Un slug déjà en-ligne ou introuvable est sauté
 *
 * Lancement automatique via GitHub Actions (cron 1 fois/2 jours).
 * Le commit + push est fait par l'Action elle-même après ce script.
 *
 * Usage :
 *   node scripts/publish-next-blog-article.mjs            # publie le prochain
 *   node scripts/publish-next-blog-article.mjs --dry-run  # affiche sans modifier
 */

import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs';

// Extrait le titre lisible du frontmatter (gère 'title: xxx' et title: >- multiligne)
function extractTitle(content, slug) {
  const single = content.match(/^title:\s*['"]?(.+?)['"]?\s*$/m);
  if (single && single[1] && single[1] !== '>-' && single[1] !== '>') return single[1].trim();
  // format multiligne (title: >- puis ligne(s) indentée(s))
  const multi = content.match(/^title:\s*>-?\s*\n\s+(.+)$/m);
  if (multi) return multi[1].trim();
  return slug;
}

const QUEUE_FILE = 'scripts/blog-publish-queue.json';
const BLOG_DIR = 'src/content/blog';
const DRY_RUN = process.argv.includes('--dry-run');
const today = new Date().toISOString().slice(0, 10);

if (!existsSync(QUEUE_FILE)) {
  console.error(`❌ Queue introuvable : ${QUEUE_FILE}`);
  process.exit(1);
}

const queue = JSON.parse(readFileSync(QUEUE_FILE, 'utf-8')).queue || [];
if (queue.length === 0) {
  console.error('❌ Queue vide');
  process.exit(1);
}

console.log(`📅 ${today} — queue de ${queue.length} articles`);

let publishedSlug = null;

for (const slug of queue) {
  const file = `${BLOG_DIR}/${slug}.mdoc`;

  if (!existsSync(file)) {
    console.log(`   ⚠ ${slug}.mdoc introuvable, skip`);
    continue;
  }

  const content = readFileSync(file, 'utf-8');
  const statusMatch = content.match(/^status:\s*(brouillon|en-ligne)\s*$/m);

  if (!statusMatch) {
    console.log(`   ⚠ ${slug} : champ status introuvable, skip`);
    continue;
  }

  if (statusMatch[1] === 'en-ligne') {
    console.log(`   ✓ ${slug} déjà en-ligne, skip`);
    continue;
  }

  // Premier brouillon trouvé → on le publie
  const newContent = content
    .replace(/^status:\s*brouillon\s*$/m, 'status: en-ligne')
    .replace(/^publishedAt:.*$/m, `publishedAt: ${today}`)
    .replace(/^updatedAt:.*$/m, `updatedAt: ${today}`);

  const title = extractTitle(content, slug);

  if (DRY_RUN) {
    console.log(`\n[DRY-RUN] Publierait : ${slug}`);
    console.log(`          titre : ${title}`);
    console.log(`          status → en-ligne, publishedAt + updatedAt → ${today}`);
  } else {
    writeFileSync(file, newContent);
    console.log(`\n✅ Publié : ${slug}`);
    console.log(`   titre : ${title}`);
    console.log(`   status → en-ligne, publishedAt + updatedAt → ${today}`);
    console.log(`   URL : https://www.enomia.app/blog/${slug}`);

    // Expose le slug + titre à GitHub Actions (étape email récap)
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `published_slug=${slug}\n`);
      appendFileSync(process.env.GITHUB_OUTPUT, `published_title=${title}\n`);
    }
  }

  publishedSlug = slug;
  break;
}

if (!publishedSlug) {
  console.log('\n✓ Aucun article en brouillon dans la queue. Rien à publier aujourd\'hui.');
}
