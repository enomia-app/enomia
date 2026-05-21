#!/usr/bin/env node
/**
 * fb-daily-scan.mjs — Scan quotidien complet (cron 7h matin)
 *
 * Pipeline :
 *   1. Lance fb-scan.mjs (scan des 8 groupes FB → fb-scan-candidates.json)
 *   2. Lit les 27 posts captés
 *   3. Appelle Claude API : drafte les réponses Marc + filtre les non-pertinents
 *   4. Génère fb-drafts.json
 *   5. Envoie email "[FB scan] N propositions à valider" à marc@enomia.app
 *
 * Marc valide depuis son tel → fb-watch (15 min) détecte → fb-post poste tout.
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
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

const SCAN_CANDIDATES = join(ROOT, 'data/rs-lcd/fb-scan-candidates.json');
const DRAFTS_OUT = join(ROOT, 'data/rs-lcd/fb-drafts.json');

function listEnomiaArticles() {
  const dir = join(ROOT, 'src/content/blog');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith('.mdoc')).map(f => f.replace(/\.mdoc$/, ''));
}

function listEnomiaTools() {
  const dir = join(ROOT, 'src/pages');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.astro') && !f.startsWith('_'))
    .map(f => f.replace(/\.astro$/, ''))
    .filter(s => !['index', 'auteur', 'preview', 'mentions-legales', 'confidentialite'].some(x => s.includes(x)));
}

async function draftAllViaClaude(posts) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const articles = listEnomiaArticles();
  const tools = listEnomiaTools();

  // Compacte les posts pour le prompt (texte tronqué à 1500 chars pour limiter le coût)
  const compactPosts = posts.map(p => ({
    postId: `${p.groupId}.${posts.filter(q => q.groupId === p.groupId).indexOf(p) + 1}`,
    group: p.groupName,
    url: p.url,
    author: p.author,
    text: (p.text || '').slice(0, 1500),
  }));

  const prompt = `Tu es Marc Chenut, expert location courte durée français (LCD/Airbnb). Tu commentes des posts dans des groupes Facebook de propriétaires.

# TON IDENTITÉ ET TON
- Marc Chenut, 9 biens LCD, méthode 97% (97% taux occupation, <1h gestion/bien/mois, sans conciergerie)
- Tutoiement TOUJOURS (Facebook = communauté décontractée)
- Direct, pair-à-pair, phrases courtes
- ZÉRO emoji, ZÉRO tiret long (—), ZÉRO signature
- Pas de "j'utilise" pour parler d'outils → "beaucoup de proprios utilisent..."
- Boîte à code mécanique, pas serrure connectée (cf article enomia)
- Pas d'auto-promo aveugle, max 1 lien Enomia par commentaire, jamais 2

# RESSOURCES ENOMIA DISPONIBLES POUR LIENS

## Articles blog (slug → URL https://www.enomia.app/blog/{slug})
${articles.join(', ')}

## Outils / landings (slug → URL https://www.enomia.app/{slug})
${tools.join(', ')}

# TÂCHE
Pour chaque post FB ci-dessous, décide :
1. **RELEVANCE** : est-ce un post où Marc devrait commenter ?
   - SKIP : spam, recrutement commercial, demande de message privé, hors-LCD, post sans question/pain point clair
   - GO : question d'hôte, retour d'expérience qui invite au dialogue, débat utile
2. Si GO : drafte une réponse dans le ton Marc (3-6 phrases généralement)
3. Décide si un lien Enomia est PILE-POIL pertinent (la question correspond exactement au contenu d'un article/outil) → max ~20% des drafts avec lien (sur 10 drafts, 1-2 avec lien max).

# POSTS À TRAITER
${JSON.stringify(compactPosts, null, 2)}

# FORMAT DE SORTIE — JSON STRICT, RIEN D'AUTRE

{
  "drafts": {
    "<postId>": {
      "url": "<url originale>",
      "text": "<ta réponse Marc complète>",
      "withEnomiaLink": <true|false>,
      "enomiaUrl": "<URL https://www.enomia.app/... si lien, sinon null>"
    }
  },
  "skipped": [
    { "postId": "<id>", "reason": "<courte raison>" }
  ]
}

Pas de markdown, pas de \`\`\`, juste le JSON pur.`;

  console.log(`Appel Claude (sonnet, ${compactPosts.length} posts)...`);
  const resp = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = resp.content[0].text.trim();
  const cleaned = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned);
}

function buildEmailBody(result, posts) {
  const date = new Date().toISOString().slice(0, 10);
  const drafts = result.drafts || {};
  const skipped = result.skipped || [];
  const ids = Object.keys(drafts);
  const withLinks = ids.filter(id => drafts[id].withEnomiaLink);

  // Reconstruire le mapping postId → post original (même logique que draftAllViaClaude)
  const postById = {};
  for (const p of posts) {
    const sameGroup = posts.filter(q => q.groupId === p.groupId);
    const postId = `${p.groupId}.${sameGroup.indexOf(p) + 1}`;
    postById[postId] = p;
  }

  const head = `Scan du ${date} — ${posts.length} posts captés, ${ids.length} retenus.

${withLinks.length > 0
    ? `Liens Enomia inclus : ${withLinks.length} (${withLinks.join(', ')}) — ratio ${withLinks.length}/${ids.length}.`
    : 'Aucun lien Enomia ce coup-ci.'}

${skipped.length > 0
    ? `Skippés (${skipped.length}) : ${skipped.slice(0, 5).map(s => `${s.postId} (${s.reason})`).join(', ')}${skipped.length > 5 ? '...' : ''}`
    : ''}
`;

  const blocks = ids.map(id => {
    const d = drafts[id];
    const post = postById[id];
    const author = post?.author || 'inconnu';
    const group = post?.groupName || 'inconnu';
    const originalText = post?.text
      ? post.text.length > 1200 ? post.text.slice(0, 1200) + '\n[...tronqué]' : post.text
      : '(post original introuvable)';

    return `════════════════════════════════════════
POST ${id} — ${group} — par ${author}
URL : ${d.url}

POST ORIGINAL :
${originalText}

────────────────────────────────────────
PROPOSITION DE RÉPONSE :
${d.text}

Lien Enomia : ${d.withEnomiaLink ? 'OUI — ' + (d.enomiaUrl || '') : 'NON'}`;
  }).join('\n');

  const footer = `
════════════════════════════════════════

TON ACTION (réponds à cet email en langage naturel) :

Exemples :
- "ok pour tout"
- "ok sauf 1.4 et 2.1"
- "vire les 1.x, garde le reste"
- "ok pour tout, edit 3.1 : ma version"

Une fois reçu, le posting tourne dans les 15 min via fb-watch.`;

  return head + '\n' + blocks + footer;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY absent');
    process.exit(1);
  }

  // 1. Lance le scan FB (peut prendre 2-3 min)
  console.log('Lancement fb-scan.mjs...');
  execSync('node scripts/rs-lcd/fb-scan.mjs', { cwd: ROOT, stdio: 'inherit' });

  if (!existsSync(SCAN_CANDIDATES)) {
    console.error('fb-scan-candidates.json absent — scan échoué ?');
    process.exit(1);
  }
  const scanData = JSON.parse(readFileSync(SCAN_CANDIDATES, 'utf8'));
  const posts = (scanData.posts || []).filter(p => (p.text || '').length > 80);
  console.log(`${posts.length} posts utiles dans le scan\n`);

  if (posts.length === 0) {
    console.log('Aucun post à traiter aujourd\'hui');
    return;
  }

  // 2. Drafte via Claude API
  const result = await draftAllViaClaude(posts);

  // 3. Sauvegarde fb-drafts.json (format simple pour fb-build-validated)
  const draftsSimple = {};
  for (const [id, d] of Object.entries(result.drafts || {})) {
    draftsSimple[id] = { url: d.url, text: d.text };
  }
  mkdirSync(dirname(DRAFTS_OUT), { recursive: true });
  writeFileSync(DRAFTS_OUT, JSON.stringify(draftsSimple, null, 2));
  console.log(`${Object.keys(draftsSimple).length} drafts → ${DRAFTS_OUT}`);

  // 4. Email récap
  const date = new Date().toISOString().slice(0, 10);
  const body = buildEmailBody(result, posts);
  const subject = `[FB scan] ${date} — ${Object.keys(draftsSimple).length} propositions à valider`;

  execSync(
    `./scripts/tech-watchdog/send-report.sh "${subject}"`,
    { cwd: ROOT, input: body, encoding: 'utf8', stdio: ['pipe', 'inherit', 'inherit'] }
  );
  console.log(`\n✓ Email envoyé : ${subject}`);
}

main().catch(e => { console.error(e); process.exit(1); });
