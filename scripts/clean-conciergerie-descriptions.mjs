#!/usr/bin/env node
/**
 * Supprime les chiffres figés (notes Google, nombres d'avis, mentions Trustpilot) des descriptions
 * de conciergeries dans `src/data/cities.ts`.
 *
 * Pourquoi : `description` est du texte libre. Si une phrase y cite "4,5/5 sur 195 avis", elle peut
 * devenir désynchronisée des champs structurés `rating`/`reviews` après un refresh Places API.
 * → règle : la description ne parle QUE de qualité, services, positionnement. Les chiffres restent
 *   dans les champs structurés rating/reviews/biensGeres.
 *
 * Approche : split chaque description en phrases (`.`, `!`, `?`) et supprime TOUTE phrase contenant
 * un des patterns chiffrés ci-dessous. C'est radical mais propre.
 *
 * Usage :
 *   node scripts/clean-conciergerie-descriptions.mjs --dry-run    # affiche before/after
 *   node scripts/clean-conciergerie-descriptions.mjs              # applique
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');
const TARGET = path.join(ROOT, 'src/data/cities.ts');

// Patterns qui flaggent une phrase à supprimer (= elle parle de notes/avis chiffrés)
const BAN_PATTERNS = [
  /\b\d+[,.]\d+\s*\/\s*5\b/i,                // 4,5/5 ou 4.5/5
  /\bsur\s+~?\s*[\d\s ]+\s*avis\b/i,         // sur 195 avis / sur ~150 avis / sur 2 146 avis
  /\bnote\s+Google\b/i,
  /\bnote\s+Trustpilot\b/i,
  /\bTrustpilot\s+(?:national|mondial|France)/i,
  /\bfiche\s+Google\s+(?:Business|Lyon|locale|national|Paris)/i,
  /\b\d+\s+avis\s+(?:Google|Trustpilot)\b/i,
];

function shouldDrop(sentence) {
  return BAN_PATTERNS.some((re) => re.test(sentence));
}

// Split prudent qui préserve les abréviations (24h/24, 7j/7) et ne casse pas sur les ".com"
function splitSentences(text) {
  // Split sur ".", "!", "?" suivi d'un espace + majuscule ou de fin de string.
  // Garde le séparateur attaché à la phrase précédente.
  const parts = [];
  let buf = '';
  for (let i = 0; i < text.length; i++) {
    buf += text[i];
    const next = text[i + 1];
    if (
      (text[i] === '.' || text[i] === '!' || text[i] === '?') &&
      (next === ' ' || next === '\n' || next === undefined) &&
      // Ne pas casser sur les abréviations ".com", "ex.", "M.", "etc."
      !buf.endsWith('etc.') &&
      !/\b[A-Z]\.$/.test(buf) &&
      !/\.com$|\.fr$|\.app$/.test(buf)
    ) {
      parts.push(buf.trim());
      buf = '';
    }
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

function cleanDescription(desc) {
  const sentences = splitSentences(desc);
  const kept = sentences.filter((s) => !shouldDrop(s));
  let result = kept.join(' ');
  // Nettoyage : doubles espaces, virgules orphelines, parenthèses vides, etc.
  result = result
    .replace(/\(\s*[—-]\s*\)/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+,/g, ',')
    .replace(/,\s*\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,])/g, '$1')           // pas d'espace avant . , (FR)
    // En revanche, espace avant : ; ! ? reste obligatoire en français → on ne touche pas
    .trim();
  return result;
}

// Charge cities.ts
let content = fs.readFileSync(TARGET, 'utf8');

// Trouve tous les blocs conciergerie et extrait leur description
// Pattern : `{ name: 'X', ..., description:\n  "TEXTE",\n  }` ou `description: "TEXTE",`
// Astuce : on capture la description entière entre les guillemets doubles qui suivent `description:`.
// La description peut contenir des `\n`, des apostrophes échappées, mais PAS de `"` non échappé.
const DESC_RE = /(name:\s*["']([^"']+)["'][\s\S]*?description:\s*\n\s*)("(?:\\.|[^"\\])*")/g;

let changes = 0;
const sample = [];

content = content.replace(DESC_RE, (full, prefix, name, descLiteral) => {
  // Décoder la string JSON-like (le contenu utilise des escape JS standards)
  let descText;
  try {
    descText = JSON.parse(descLiteral);
  } catch {
    return full; // skip si non parseable
  }
  const cleaned = cleanDescription(descText);
  if (cleaned === descText) return full;
  changes++;
  if (sample.length < 5) sample.push({ name, before: descText, after: cleaned });
  const newLiteral = JSON.stringify(cleaned);
  return prefix + newLiteral;
});

if (dryRun) {
  console.log(`\n📝 Mode --dry-run\n`);
  console.log(`   ${changes} descriptions seraient nettoyées sur ${(content.match(/description:/g) || []).length} totales.\n`);
  console.log('=== Échantillon (5 premières) ===\n');
  for (const s of sample) {
    console.log(`▸ ${s.name}`);
    console.log(`  AVANT : ${s.before.slice(0, 200)}${s.before.length > 200 ? '...' : ''}`);
    console.log(`  APRÈS : ${s.after.slice(0, 200)}${s.after.length > 200 ? '...' : ''}`);
    console.log('');
  }
} else {
  fs.writeFileSync(TARGET, content);
  console.log(`✅ ${changes} descriptions nettoyées dans src/data/cities.ts`);
}
