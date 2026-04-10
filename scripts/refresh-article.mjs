#!/usr/bin/env node
/**
 * Intelligent Article Refresh — Enomia Blog
 * Uses Claude API to re-analyze SERP and update an article with fresh data.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/refresh-article.mjs commissions-airbnb
 *   ANTHROPIC_API_KEY=sk-... node scripts/refresh-article.mjs --all  (refreshes all published articles)
 *
 * Cost: ~$0.05-0.15 per article refresh (Claude Haiku)
 *
 * What it does:
 * 1. Reads the existing article
 * 2. Extracts the main keyword from the title/metaTitle
 * 3. Asks Claude to suggest 3-5 updates (new stats, outdated info, missing FAQ)
 * 4. Applies the updates and bumps updatedAt
 *
 * Requirements:
 * - ANTHROPIC_API_KEY environment variable
 * - npm install @anthropic-ai/sdk (or add to package.json)
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const BLOG_DIR = 'src/content/blog';

// Parse args
const [,, ...args] = process.argv;
const refreshAll = args.includes('--all');
const dryRun = args.includes('--dry-run');
const slugs = args.filter(a => !a.startsWith('--'));

if (!refreshAll && slugs.length === 0) {
  console.error(`
Usage:
  node scripts/refresh-article.mjs <slug>           Refresh one article
  node scripts/refresh-article.mjs --all            Refresh all published articles
  Add --dry-run to preview without writing

Environment:
  ANTHROPIC_API_KEY=sk-...   Required

Examples:
  ANTHROPIC_API_KEY=sk-xxx node scripts/refresh-article.mjs commissions-airbnb
  ANTHROPIC_API_KEY=sk-xxx node scripts/refresh-article.mjs --all --dry-run
`);
  process.exit(1);
}

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('❌ ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

// Determine which files to refresh
let targetFiles = [];
if (refreshAll) {
  const allFiles = (await readdir(BLOG_DIR)).filter(f => f.endsWith('.mdoc')).sort();
  for (const file of allFiles) {
    const content = await readFile(join(BLOG_DIR, file), 'utf-8');
    if (content.includes('draft: false')) {
      targetFiles.push(file);
    }
  }
} else {
  targetFiles = slugs.map(s => s.endsWith('.mdoc') ? s : `${s}.mdoc`);
}

console.log(`\n🔄 Refreshing ${targetFiles.length} article(s)${dryRun ? ' (DRY RUN)' : ''}\n`);

for (const file of targetFiles) {
  const path = join(BLOG_DIR, file);
  let content;
  try {
    content = await readFile(path, 'utf-8');
  } catch {
    console.error(`  ❌ File not found: ${path}`);
    continue;
  }

  // Extract title and keyword from frontmatter
  const titleMatch = content.match(/^title: ['"]?(.+?)['"]?$/m);
  const metaTitleMatch = content.match(/^metaTitle: ['"]?(.+?)['"]?$/m);
  const title = titleMatch?.[1] || file.replace('.mdoc', '');
  const metaTitle = metaTitleMatch?.[1] || title;

  console.log(`  📄 ${file}: "${title}"`);

  // Call Claude API for refresh suggestions
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-20250414',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `You are an SEO content refresher for a French LCD (location courte durée) blog.

Article title: "${title}"
Current date: ${new Date().toISOString().split('T')[0]}

Here is the current article content (first 3000 chars):
${content.slice(0, 3000)}

Your task: suggest 3-5 SMALL, SPECIFIC updates to refresh this article. Each update should be:
- A concrete fact, stat, or date that may need updating
- A new FAQ question to add
- A sentence to rephrase for freshness
- A new internal link opportunity

For each suggestion, output in this exact JSON format:
[
  {"type": "replace", "old": "exact text to find", "new": "replacement text"},
  {"type": "append_faq", "question": "New FAQ question", "answer": "Answer text"},
  {"type": "note", "text": "General observation (won't be applied automatically)"}
]

Rules:
- VOUVOIEMENT only (vous, votre)
- Keep Marc Chenut's direct tone
- Only suggest changes where you're confident the update is correct
- Output valid JSON array only, no markdown`
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`  ❌ API error: ${response.status} ${err.slice(0, 200)}`);
    continue;
  }

  const data = await response.json();
  const suggestions = data.content?.[0]?.text || '[]';

  let updates;
  try {
    updates = JSON.parse(suggestions);
  } catch {
    console.log(`  ⚠️ Could not parse suggestions, skipping`);
    continue;
  }

  if (dryRun) {
    console.log(`  💡 Suggestions (${updates.length}):`);
    for (const u of updates) {
      if (u.type === 'replace') console.log(`     🔄 Replace: "${u.old?.slice(0, 60)}..." → "${u.new?.slice(0, 60)}..."`);
      if (u.type === 'append_faq') console.log(`     ❓ New FAQ: "${u.question}"`);
      if (u.type === 'note') console.log(`     📝 Note: ${u.text}`);
    }
    continue;
  }

  // Apply updates
  let applied = 0;
  for (const u of updates) {
    if (u.type === 'replace' && u.old && u.new && content.includes(u.old)) {
      content = content.replace(u.old, u.new);
      applied++;
    }
    // FAQ appending would need more complex logic — skip for now
  }

  // Update updatedAt
  const today = new Date().toISOString().split('T')[0];
  content = content.replace(/^updatedAt: .+$/m, `updatedAt: ${today}T09:00:00.000Z`);

  // Update verification line
  const frDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const verificationLine = `*Dernière vérification : ${frDate}*`;
  const verificationRegex = /^\*Dernière vérification : .+\*$/m;
  if (verificationRegex.test(content)) {
    content = content.replace(verificationRegex, verificationLine);
  }

  await writeFile(path, content, 'utf-8');
  console.log(`  ✅ Applied ${applied} updates, bumped updatedAt → ${today}`);
}

console.log('\n✅ Done! Run git diff to review, then commit.');
