/**
 * fb-build-validated.mjs — Construit fb-validated.json depuis un texte de validation
 *
 * Usage :
 *   echo "OK: 1.1, 4.3 / SKIP: 1.4 / EDIT 2.1: ma nouvelle version" | node scripts/rs-lcd/fb-build-validated.mjs
 *   node scripts/rs-lcd/fb-build-validated.mjs < validation.txt
 *
 * Lit fb-scan-candidates.json + fb-drafts.json (les propositions du jour) et produit
 * data/rs-lcd/fb-validated.json prêt pour fb-post.mjs.
 *
 * Le mapping postId (1.1, 1.3, 4.3...) suit l'ordre des propositions dans l'email récap.
 * Pour que ce script fonctionne, il doit y avoir un fb-drafts.json qui mappe postId → {url, text}.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Permet --drafts=path et --output=path en argv (par défaut : scan/post)
const args = Object.fromEntries(process.argv.slice(2)
  .filter(a => a.startsWith('--'))
  .map(a => a.replace(/^--/, '').split('=')));

const DRAFTS_FILE = args.drafts
  ? (args.drafts.startsWith('/') ? args.drafts : join(__dirname, '../../', args.drafts))
  : join(__dirname, '../../data/rs-lcd/fb-drafts.json');
const OUTPUT_FILE = args.output
  ? (args.output.startsWith('/') ? args.output : join(__dirname, '../../', args.output))
  : join(__dirname, '../../data/rs-lcd/fb-validated.json');

function parseValidation(text) {
  const result = { ok: [], skip: [], edits: {} };

  // OK: 1.1, 1.3, 4.3
  const okMatch = text.match(/OK\s*:\s*([0-9., ()v]+)/i);
  if (okMatch) {
    result.ok = okMatch[1]
      .split(',')
      .map(s => s.replace(/\(v\d+\)/gi, '').trim())
      .filter(Boolean);
  }

  // SKIP: 1.2, 4.1
  const skipMatch = text.match(/SKIP\s*:\s*([0-9., ()v]+)/i);
  if (skipMatch) {
    result.skip = skipMatch[1]
      .split(',')
      .map(s => s.replace(/\(v\d+\)/gi, '').trim())
      .filter(Boolean);
  }

  // EDIT X.X: nouveau texte (jusqu'au prochain EDIT/OK/SKIP ou fin)
  const editRegex = /EDIT\s+([0-9.]+)\s*:\s*([\s\S]+?)(?=\n\s*(?:EDIT|OK|SKIP)\s*[: ]|\n\s*$|$)/gi;
  let m;
  while ((m = editRegex.exec(text)) !== null) {
    result.edits[m[1].trim()] = m[2].trim();
  }

  return result;
}

function main() {
  if (!existsSync(DRAFTS_FILE)) {
    console.error(`\nERREUR: ${DRAFTS_FILE} introuvable.`);
    console.error('Génère fb-drafts.json avant de valider (mapping postId → {url, text}).\n');
    process.exit(1);
  }

  const drafts = JSON.parse(readFileSync(DRAFTS_FILE, 'utf8'));
  const validationText = readFileSync(0, 'utf8'); // stdin

  if (!validationText.trim()) {
    console.error('Aucun texte de validation reçu sur stdin.');
    process.exit(1);
  }

  const v = parseValidation(validationText);
  console.log('Validation parsée :');
  console.log('  OK   :', v.ok.join(', ') || '(aucun)');
  console.log('  SKIP :', v.skip.join(', ') || '(aucun)');
  console.log('  EDIT :', Object.keys(v.edits).join(', ') || '(aucun)');

  const validated = [];
  const okIds = new Set([...v.ok, ...Object.keys(v.edits)]);

  for (const postId of okIds) {
    const draft = drafts[postId];
    if (!draft) {
      console.warn(`  ⚠ postId ${postId} introuvable dans fb-drafts.json — ignoré`);
      continue;
    }
    if (v.skip.includes(postId)) {
      console.warn(`  ⚠ postId ${postId} est dans OK ET SKIP — on skip`);
      continue;
    }
    // Propage tous les champs du draft (marcComment, etc.) + override text si EDIT
    validated.push({
      ...draft,
      postId,
      text: v.edits[postId] || draft.text,
      edited: !!v.edits[postId],
    });
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(validated, null, 2));
  console.log(`\n✓ ${validated.length} commentaires validés → ${OUTPUT_FILE}`);
}

main();
