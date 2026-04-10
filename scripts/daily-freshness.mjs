#!/usr/bin/env node
/**
 * Daily Freshness Script — Enomia Blog
 * Picks ONE article per day (round-robin), updates its `updatedAt` date,
 * and adds/refreshes a "Dernière vérification" line.
 *
 * Called by .github/workflows/daily-freshness.yml
 * Can also be run manually: node scripts/daily-freshness.mjs
 */

import { readdir, readFile, writeFile, access } from 'fs/promises';
import { join } from 'path';

const BLOG_DIR = 'src/content/blog';
const STATE_FILE = 'scripts/.freshness-state.json';

// Load state (which article index we're at)
let state = { index: 0 };
try {
  await access(STATE_FILE);
  state = JSON.parse(await readFile(STATE_FILE, 'utf-8'));
} catch { /* first run */ }

// Get all published (non-draft) articles, sorted alphabetically for consistency
const allFiles = (await readdir(BLOG_DIR))
  .filter(f => f.endsWith('.mdoc'))
  .sort();

// Filter to non-draft articles only (we don't refresh drafts)
const publishedFiles = [];
for (const file of allFiles) {
  const content = await readFile(join(BLOG_DIR, file), 'utf-8');
  if (content.includes('draft: false')) {
    publishedFiles.push(file);
  }
}

if (publishedFiles.length === 0) {
  console.log('⏭️ No published articles to refresh. Skipping.');
  process.exit(0);
}

// Pick today's article (round-robin)
const idx = state.index % publishedFiles.length;
const targetFile = publishedFiles[idx];
const targetPath = join(BLOG_DIR, targetFile);

console.log(`📄 Refreshing article ${idx + 1}/${publishedFiles.length}: ${targetFile}`);

// Read and update
let content = await readFile(targetPath, 'utf-8');
const today = new Date();
const isoDate = today.toISOString().split('T')[0];
const frDate = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

// 1. Update updatedAt in frontmatter
content = content.replace(
  /^updatedAt: .+$/m,
  `updatedAt: ${isoDate}T09:00:00.000Z`
);

// 2. Add or update "Dernière vérification" line after the first H1
// Look for pattern: after the first # heading line, add/update the verification line
const verificationLine = `*Dernière vérification : ${frDate}*`;
const verificationRegex = /^\*Dernière vérification : .+\*$/m;

if (verificationRegex.test(content)) {
  // Update existing line
  content = content.replace(verificationRegex, verificationLine);
} else {
  // Add after first H1 (# **Title**)
  const h1Match = content.match(/^# .+$/m);
  if (h1Match) {
    const h1End = content.indexOf(h1Match[0]) + h1Match[0].length;
    content = content.slice(0, h1End) + '\n\n' + verificationLine + content.slice(h1End);
  }
}

// Write back
await writeFile(targetPath, content, 'utf-8');

// Save state for next run
state.index = idx + 1;
await writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');

console.log(`✅ Updated: ${targetFile}`);
console.log(`   updatedAt → ${isoDate}`);
console.log(`   Dernière vérification → ${frDate}`);
console.log(`   Next run will refresh: ${publishedFiles[(idx + 1) % publishedFiles.length]}`);
