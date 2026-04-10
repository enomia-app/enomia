#!/usr/bin/env node
/**
 * Year Swap Script — Enomia Blog
 * Replaces year references in all blog articles and updates dates.
 *
 * Usage: node scripts/year-swap.mjs 2026 2027
 * Dry run: node scripts/year-swap.mjs 2026 2027 --dry-run
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const BLOG_DIR = 'src/content/blog';

const [,, oldYear, newYear, ...flags] = process.argv;
const dryRun = flags.includes('--dry-run');

if (!oldYear || !newYear) {
  console.error('Usage: node scripts/year-swap.mjs <old-year> <new-year> [--dry-run]');
  console.error('Example: node scripts/year-swap.mjs 2026 2027');
  process.exit(1);
}

console.log(`\n🔄 Year swap: ${oldYear} → ${newYear}${dryRun ? ' (DRY RUN)' : ''}\n`);

const files = (await readdir(BLOG_DIR)).filter(f => f.endsWith('.mdoc'));
let totalFiles = 0;
let totalReplacements = 0;

for (const file of files) {
  const path = join(BLOG_DIR, file);
  const content = await readFile(path, 'utf-8');

  // Count occurrences
  const matches = (content.match(new RegExp(oldYear, 'g')) || []).length;
  if (matches === 0) continue;

  // Replace year in content
  let updated = content.replaceAll(oldYear, newYear);

  // Update updatedAt to today
  const today = new Date().toISOString().split('T')[0];
  updated = updated.replace(
    /^updatedAt: .+$/m,
    `updatedAt: ${today}T09:00:00.000Z`
  );

  totalFiles++;
  totalReplacements += matches;

  if (dryRun) {
    console.log(`  📄 ${file} — ${matches} replacements`);
  } else {
    await writeFile(path, updated, 'utf-8');
    console.log(`  ✅ ${file} — ${matches} replacements`);
  }
}

console.log(`\n📊 Summary: ${totalReplacements} replacements across ${totalFiles} files`);
if (dryRun) console.log('💡 Run without --dry-run to apply changes');
else console.log('✅ Done! Run git diff to review, then commit.');
