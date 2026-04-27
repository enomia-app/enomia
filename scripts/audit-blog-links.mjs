#!/usr/bin/env node
/**
 * Audit des liens internes des articles de blog.
 *
 * Lit src/content/blog/*.mdoc et vérifie que tous les liens internes
 * pointent vers des cibles valides :
 *   - Pages outils (src/pages/*.astro)
 *   - Articles de blog publiés (status: en-ligne)
 *
 * Flag les liens cassés en 3 catégories :
 *   - 404 : article inexistant
 *   - DRAFT : article existe mais en status: brouillon (404 public)
 *   - WRONG_PATH : lien sans /blog/ vers un article (oubli de préfixe)
 *
 * Usage : node scripts/audit-blog-links.mjs
 *         node scripts/audit-blog-links.mjs --fix   (corrige WRONG_PATH automatiquement)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

const BLOG_DIR = 'src/content/blog';
const PAGES_DIR = 'src/pages';
const FIX = process.argv.includes('--fix');

// 1. Liste des articles de blog avec leur status
const articles = {};
for (const file of readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdoc'))) {
  const slug = file.replace('.mdoc', '');
  const content = readFileSync(join(BLOG_DIR, file), 'utf-8');
  const statusMatch = content.match(/^status:\s*(\S+)/m);
  articles[slug] = statusMatch ? statusMatch[1].replace(/['"]/g, '') : 'unknown';
}

// 2. Liste des pages outils (top-level + folders avec index.astro)
const toolPages = new Set();
for (const entry of readdirSync(PAGES_DIR, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.astro') && entry.name !== 'index.astro') {
    toolPages.add(entry.name.replace('.astro', ''));
  } else if (entry.isDirectory() && existsSync(join(PAGES_DIR, entry.name, 'index.astro'))) {
    toolPages.add(entry.name);
  }
}

// 3. Auditer chaque article
const issues = [];
for (const file of readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdoc'))) {
  const path = join(BLOG_DIR, file);
  let content = readFileSync(path, 'utf-8');
  const linkRegex = /\(\/([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const link = match[1];
    const slug = link.split(/[#?]/)[0]; // strip anchors/query

    // Skip external (already filtered by leading /)
    if (slug.startsWith('http')) continue;

    // Pattern: /blog/SLUG
    if (slug.startsWith('blog/')) {
      const articleSlug = slug.replace('blog/', '');
      if (!(articleSlug in articles)) {
        issues.push({ file, link: `/${link}`, type: '404', detail: `article "${articleSlug}" inexistant` });
      } else if (articles[articleSlug] !== 'en-ligne') {
        issues.push({ file, link: `/${link}`, type: 'DRAFT', detail: `article "${articleSlug}" en status: ${articles[articleSlug]}` });
      }
      continue;
    }

    // Pattern: /SLUG (top-level — page outil OU oubli /blog/)
    if (toolPages.has(slug)) continue; // page outil OK

    if (slug in articles) {
      // Lien vers article SANS préfixe /blog/ → erreur classique
      issues.push({ file, link: `/${link}`, type: 'WRONG_PATH', detail: `manque /blog/`, fix: `/blog/${link}` });
    } else if (!slug.startsWith('api/') && !slug.startsWith('preview/')) {
      issues.push({ file, link: `/${link}`, type: '404', detail: `cible inconnue` });
    }
  }
}

// 4. Auto-fix WRONG_PATH si --fix
if (FIX && issues.some(i => i.type === 'WRONG_PATH')) {
  const byFile = {};
  for (const i of issues.filter(i => i.type === 'WRONG_PATH' && i.fix)) {
    (byFile[i.file] ||= []).push(i);
  }
  for (const [file, fileIssues] of Object.entries(byFile)) {
    const path = join(BLOG_DIR, file);
    let content = readFileSync(path, 'utf-8');
    for (const i of fileIssues) {
      content = content.split(`(${i.link})`).join(`(${i.fix})`);
    }
    writeFileSync(path, content);
    console.log(`✓ Fixed ${fileIssues.length} link(s) in ${file}`);
  }
}

// 5. Rapport
const byType = { 404: [], DRAFT: [], WRONG_PATH: [] };
for (const i of issues) byType[i.type]?.push(i);

console.log(`\n📊 État du blog`);
console.log(`  Articles : ${Object.keys(articles).length} total`);
console.log(`    en-ligne : ${Object.values(articles).filter(s => s === 'en-ligne').length}`);
console.log(`    brouillon : ${Object.values(articles).filter(s => s === 'brouillon').length}`);
console.log(`  Pages outils : ${toolPages.size}`);

console.log(`\n🔍 Liens internes audités\n`);

if (byType.WRONG_PATH.length > 0) {
  console.log(`❌ ${byType.WRONG_PATH.length} lien(s) sans préfixe /blog/ (à corriger)`);
  if (!FIX) {
    for (const i of byType.WRONG_PATH) {
      console.log(`   ${i.file} : ${i.link} → ${i.fix}`);
    }
    console.log(`   → relancer avec --fix pour corriger automatiquement\n`);
  }
}

if (byType[404].length > 0) {
  console.log(`❌ ${byType[404].length} lien(s) 404 (cible inexistante)`);
  for (const i of byType[404]) {
    console.log(`   ${i.file} : ${i.link} (${i.detail})`);
  }
  console.log();
}

if (byType.DRAFT.length > 0) {
  console.log(`⚠️  ${byType.DRAFT.length} lien(s) vers articles en brouillon (404 public tant que non publiés)`);
  // Group by target
  const byTarget = {};
  for (const i of byType.DRAFT) {
    const target = i.link.replace('/blog/', '').split(/[#?]/)[0];
    (byTarget[target] ||= []).push(i.file);
  }
  for (const [target, files] of Object.entries(byTarget)) {
    console.log(`   /blog/${target} (cité dans ${files.length} article(s))`);
  }
  console.log(`   → publier ces articles (status: en-ligne) pour activer les liens\n`);
}

if (issues.length === 0) {
  console.log(`✅ Aucun lien cassé détecté.`);
}

process.exit(issues.filter(i => i.type !== 'DRAFT').length > 0 ? 1 : 0);
