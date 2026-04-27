#!/usr/bin/env node
/**
 * Audit des liens des articles de blog.
 *
 * Lit src/content/blog/*.mdoc et vérifie :
 *   - Liens INTERNES (toujours) : cibles valides dans le repo
 *   - Liens EXTERNES (mode --external) : URLs HTTP qui répondent
 *
 * Liens internes — flag en 3 catégories :
 *   - 404         : article inexistant
 *   - DRAFT       : article existe mais en status: brouillon (404 public)
 *   - WRONG_PATH  : lien sans /blog/ vers un article (oubli de préfixe)
 *
 * Liens externes (mode --external) :
 *   - DEAD        : 404 / 410 → bloque
 *   - WARN        : timeout / 5xx → ne bloque pas
 *
 * Usage :
 *   node scripts/audit-blog-links.mjs                 # internes only
 *   node scripts/audit-blog-links.mjs --fix           # corrige WRONG_PATH auto
 *   node scripts/audit-blog-links.mjs --external      # internes + externes
 *
 * Exit code :
 *   0 = OK (warnings DRAFT/WARN tolérés)
 *   1 = bloquant (404, WRONG_PATH, DEAD)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const BLOG_DIR = 'src/content/blog';
const PAGES_DIR = 'src/pages';
const FIX = process.argv.includes('--fix');
const CHECK_EXTERNAL = process.argv.includes('--external');

// ─── 1. Articles + status ─────────────────────────────────────────
const articles = {};
for (const file of readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdoc'))) {
  const slug = file.replace('.mdoc', '');
  const content = readFileSync(join(BLOG_DIR, file), 'utf-8');
  const statusMatch = content.match(/^status:\s*(\S+)/m);
  articles[slug] = statusMatch ? statusMatch[1].replace(/['"]/g, '') : 'unknown';
}

// ─── 2. Pages outils ──────────────────────────────────────────────
const toolPages = new Set();
for (const entry of readdirSync(PAGES_DIR, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.astro') && entry.name !== 'index.astro') {
    toolPages.add(entry.name.replace('.astro', ''));
  } else if (entry.isDirectory() && existsSync(join(PAGES_DIR, entry.name, 'index.astro'))) {
    toolPages.add(entry.name);
  }
}

// ─── 3. Auditer chaque article ────────────────────────────────────
const issues = [];
const externalLinks = []; // { file, url }

for (const file of readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdoc'))) {
  const path = join(BLOG_DIR, file);
  const content = readFileSync(path, 'utf-8');

  // Liens markdown : [texte](url)  — sans capturer les images ![alt](url)
  const linkRegex = /(?<!!)\[[^\]]*\]\(([^)\s]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[1];

    // Liens externes (http/https)
    if (/^https?:\/\//i.test(url)) {
      externalLinks.push({ file, url });
      continue;
    }

    // Skip mailto, tel, ancres pures
    if (/^(mailto:|tel:|#)/i.test(url)) continue;

    // Liens internes — strip leading slash, strip anchors/query
    if (!url.startsWith('/')) continue;
    const link = url.slice(1);
    const slug = link.split(/[#?]/)[0];

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
    if (toolPages.has(slug)) continue;
    if (slug in articles) {
      issues.push({ file, link: `/${link}`, type: 'WRONG_PATH', detail: `manque /blog/`, fix: `/blog/${link}` });
    } else if (!slug.startsWith('api/') && !slug.startsWith('preview/') && !slug.startsWith('conciergerie-airbnb/')) {
      issues.push({ file, link: `/${link}`, type: '404', detail: `cible inconnue` });
    }
  }
}

// ─── 4. Auto-fix WRONG_PATH si --fix ──────────────────────────────
if (FIX && issues.some((i) => i.type === 'WRONG_PATH')) {
  const byFile = {};
  for (const i of issues.filter((i) => i.type === 'WRONG_PATH' && i.fix)) {
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

// ─── 5. Audit externe (mode --external) ───────────────────────────
const externalIssues = []; // { file, url, type, detail }
const TIMEOUT_MS = 7000;
const UA = 'Mozilla/5.0 (compatible; EnomiaLinkAudit/1.0; +https://www.enomia.app)';

async function checkExternal(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // HEAD d'abord (rapide)
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', headers: { 'User-Agent': UA }, signal: controller.signal });
    // Certains serveurs refusent HEAD → retry avec GET
    if (res.status === 405 || res.status === 403 || res.status === 400) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': UA }, signal: controller.signal });
    }
    clearTimeout(timeout);
    return { ok: res.ok || (res.status >= 200 && res.status < 400), status: res.status };
  } catch (err) {
    clearTimeout(timeout);
    return { ok: false, status: 0, error: err.name === 'AbortError' ? 'timeout' : err.message };
  }
}

if (CHECK_EXTERNAL && externalLinks.length > 0) {
  // Dédupliquer pour économiser les requêtes
  const uniqueUrls = [...new Set(externalLinks.map((l) => l.url))];
  console.log(`\n🌐 Audit ${uniqueUrls.length} URL(s) externe(s) unique(s) (peut prendre 30-60s)...\n`);

  // Parallélisme limité (8 max)
  const results = new Map();
  const queue = [...uniqueUrls];
  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const url = queue.shift();
      results.set(url, await checkExternal(url));
    }
  });
  await Promise.all(workers);

  for (const { file, url } of externalLinks) {
    const r = results.get(url);
    if (r.ok) continue;
    if (r.status === 404 || r.status === 410) {
      externalIssues.push({ file, url, type: 'DEAD', detail: `HTTP ${r.status}` });
    } else if (r.error === 'timeout' || r.status === 0 || (r.status >= 500 && r.status < 600)) {
      externalIssues.push({ file, url, type: 'WARN', detail: r.error || `HTTP ${r.status}` });
    } else {
      externalIssues.push({ file, url, type: 'WARN', detail: `HTTP ${r.status}` });
    }
  }
}

// ─── 6. Rapport ───────────────────────────────────────────────────
const byType = { 404: [], DRAFT: [], WRONG_PATH: [] };
for (const i of issues) byType[i.type]?.push(i);

console.log(`\n📊 État du blog`);
console.log(`  Articles : ${Object.keys(articles).length} total`);
console.log(`    en-ligne  : ${Object.values(articles).filter((s) => s === 'en-ligne').length}`);
console.log(`    brouillon : ${Object.values(articles).filter((s) => s === 'brouillon').length}`);
console.log(`  Pages outils : ${toolPages.size}`);
if (CHECK_EXTERNAL) console.log(`  Liens externes : ${externalLinks.length} (${new Set(externalLinks.map((l) => l.url)).size} uniques)`);

console.log(`\n🔍 Liens internes audités\n`);

if (byType.WRONG_PATH.length > 0) {
  console.log(`❌ ${byType.WRONG_PATH.length} lien(s) sans préfixe /blog/ (à corriger)`);
  if (!FIX) {
    for (const i of byType.WRONG_PATH) console.log(`   ${i.file} : ${i.link} → ${i.fix}`);
    console.log(`   → relancer avec --fix pour corriger automatiquement\n`);
  }
}

if (byType[404].length > 0) {
  console.log(`❌ ${byType[404].length} lien(s) 404 (cible inexistante)`);
  for (const i of byType[404]) console.log(`   ${i.file} : ${i.link} (${i.detail})`);
  console.log();
}

if (byType.DRAFT.length > 0) {
  console.log(`⚠️  ${byType.DRAFT.length} lien(s) vers articles en brouillon (404 public tant que non publiés)`);
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

if (issues.length === 0) console.log(`✅ Aucun lien interne cassé.`);

if (CHECK_EXTERNAL) {
  console.log(`\n🌐 Liens externes audités\n`);
  const dead = externalIssues.filter((i) => i.type === 'DEAD');
  const warn = externalIssues.filter((i) => i.type === 'WARN');
  if (dead.length > 0) {
    console.log(`❌ ${dead.length} lien(s) externe(s) mort(s) (404/410) — bloquant`);
    for (const i of dead) console.log(`   ${i.file} : ${i.url} (${i.detail})`);
    console.log();
  }
  if (warn.length > 0) {
    console.log(`⚠️  ${warn.length} lien(s) externe(s) douteux (timeout / 5xx / autre)`);
    for (const i of warn) console.log(`   ${i.file} : ${i.url} (${i.detail})`);
    console.log(`   → souvent temporaire, à relancer plus tard\n`);
  }
  if (externalIssues.length === 0) console.log(`✅ Tous les liens externes répondent.`);
}

// Exit code : 1 si bloquant (404 interne, WRONG_PATH, DEAD externe)
const blocking = issues.filter((i) => i.type !== 'DRAFT').length + externalIssues.filter((i) => i.type === 'DEAD').length;
process.exit(blocking > 0 ? 1 : 0);
