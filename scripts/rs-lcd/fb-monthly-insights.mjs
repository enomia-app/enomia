#!/usr/bin/env node
/**
 * fb-monthly-insights.mjs — Analyse mensuelle des questions FB pour SEO + produit
 *
 * Cron : 1er du mois à 9h (via launchd)
 *
 * Lit fb-archive.json (questions/commentaires des 30 derniers jours)
 * Cross-référence avec :
 *   - src/content/blog/ (articles existants)
 *   - src/pages/*.astro (outils existants)
 *   - SEMrush data (volumes mots-clés)
 *
 * Produit un rapport markdown en 3 sections :
 *   A. Articles de blog manquants
 *   B. Pain points → features Enomia
 *   C. Outils gratuits à créer (lead gen)
 *
 * Envoie le rapport par email.
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv(path.join(ROOT, '.env'));

const ARCHIVE = join(ROOT, 'data/rs-lcd/fb-archive.json');
const SCAN_CANDIDATES = join(ROOT, 'data/rs-lcd/fb-scan-candidates.json');

function listExistingArticles() {
  const dir = join(ROOT, 'src/content/blog');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith('.mdoc')).map(f => f.replace(/\.mdoc$/, ''));
}

function listExistingTools() {
  const dir = join(ROOT, 'src/pages');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith('.astro')).map(f => f.replace(/\.astro$/, ''));
}

function loadArchive() {
  if (!existsSync(ARCHIVE)) return [];
  const arr = JSON.parse(readFileSync(ARCHIVE, 'utf8'));
  // Filtre 30 derniers jours
  const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
  return arr.filter(e => new Date(e.postedAt).getTime() > cutoff);
}

// Source supplémentaire : les questions originales scannées (pas juste celles où Marc a commenté)
function loadScanCandidates() {
  if (!existsSync(SCAN_CANDIDATES)) return [];
  const data = JSON.parse(readFileSync(SCAN_CANDIDATES, 'utf8'));
  return data.posts || [];
}

async function analyzeViaClaude(archive, scanCandidates, articles, tools) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Compile les questions/textes des derniers 30 jours
  const archiveCorpus = archive.map(e =>
    `[${e.postId}] Réponse Marc : ${e.commentText}`
  ).join('\n\n');

  const scanCorpus = scanCandidates.slice(0, 80).map((p, i) =>
    `[${p.groupId}#${i}] (${p.groupName}) ${p.text.slice(0, 600)}`
  ).join('\n\n');

  const prompt = `Tu es analyste growth/SEO pour Enomia.app (outils + blog pour propriétaires Airbnb / LCD français).

DONNÉES (questions et discussions captées dans des groupes Facebook LCD) :

=== Questions des 30 derniers jours ===
${scanCorpus.slice(0, 12000)}

=== Réponses Marc postées ===
${archiveCorpus.slice(0, 3000)}

=== Articles de blog Enomia existants (slug) ===
${articles.join(', ')}

=== Pages outils/landing Enomia existantes (slug) ===
${tools.join(', ')}

OBJECTIF : produire un rapport ACTIONNABLE en 3 sections.

### A. Articles de blog à créer (top 5)
Pour chaque : question fréquente captée, slug d'article suggéré, mot-clé principal probable (sans valider SEMrush, juste l'intuition), justification (combien de fois la question revient dans le corpus). Ne propose QUE des articles dont le slug n'existe pas déjà.

### B. Features Enomia à développer (top 3)
Pour chaque : pain point récurrent, nom de la feature proposée, en quoi elle résout. Idéalement quelque chose qui s'intègre à l'app existante.

### C. Outils gratuits à créer pour lead gen (top 3)
Pour chaque : besoin concret captée, nom de l'outil, slug d'URL proposé (ne pas dupliquer un existant), pourquoi ça génère du trafic SEO + capture lead.

CONTRAINTES :
- Format MARKDOWN propre, prêt à recevoir par email.
- Sois CONCRET : pas d'analyse abstraite. Cite les éléments du corpus quand pertinent.
- Si un sujet revient peu (1 occurrence isolée), ne le propose pas.
- Évite de proposer du contenu déjà couvert par les articles ou outils existants.

Réponds uniquement avec le rapport markdown (pas de préambule).`;

  const resp = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  return resp.content[0].text;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY absent');
    process.exit(1);
  }

  const archive = loadArchive();
  const scanCandidates = loadScanCandidates();
  const articles = listExistingArticles();
  const tools = listExistingTools();

  console.log(`Archive 30j : ${archive.length} entrées`);
  console.log(`Scan candidates : ${scanCandidates.length} posts`);
  console.log(`Articles existants : ${articles.length}`);
  console.log(`Outils existants : ${tools.length}\n`);

  if (archive.length === 0 && scanCandidates.length === 0) {
    console.log('Pas assez de données — pas de rapport ce mois-ci');
    return;
  }

  console.log('Analyse via Claude (opus, max 8k tokens)...');
  const report = await analyzeViaClaude(archive, scanCandidates, articles, tools);

  const date = new Date().toISOString().slice(0, 7);
  const subject = `[FB insights] ${date} — opportunités SEO + produit`;
  const body = `Rapport mensuel d'analyse des questions FB groupes LCD.

Données analysées :
- ${archive.length} commentaires Marc postés (30j)
- ${scanCandidates.length} questions scannées
- ${articles.length} articles existants Enomia
- ${tools.length} outils existants Enomia

═══════════════════════════════════════════════
${report}
═══════════════════════════════════════════════

Source : ~/projects/eunomia/data/rs-lcd/fb-archive.json
Articles : src/content/blog/
Outils : src/pages/`;

  execSync(
    `./scripts/tech-watchdog/send-report.sh "${subject}"`,
    { cwd: ROOT, input: body, encoding: 'utf8', stdio: ['pipe', 'inherit', 'inherit'] }
  );
  console.log(`\n✓ Rapport envoyé : ${subject}`);
}

main().catch(e => { console.error(e); process.exit(1); });
