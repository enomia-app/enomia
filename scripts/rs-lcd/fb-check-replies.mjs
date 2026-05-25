#!/usr/bin/env node
/**
 * fb-check-replies.mjs — Détecte les nouvelles réponses aux commentaires Marc
 *
 * Pipeline :
 *   1. Lit data/rs-lcd/fb-history.json (commentaires Marc des 30 derniers jours)
 *   2. Pour chaque entrée : navigate sur le post FB, trouve le commentaire Marc,
 *      lit les sous-réponses, compare avec l'état précédent
 *   3. Drafte une réponse pour chaque nouvelle réponse (via Claude API)
 *   4. Sauvegarde fb-reply-drafts.json
 *   5. Envoie email récap à Marc au format "[FB replies] ..."
 *
 * Cron : quotidien 9h via launchd Mac mini
 */

import { chromium } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { homedir } from 'os';
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

const USER_DATA_DIR = join(homedir(), '.playwright-fb-scan');
const COOKIES_FILE = join(__dirname, 'fb-cookies.json');
const HISTORY_FILE = join(ROOT, 'data/rs-lcd/fb-history.json');
const REPLY_DRAFTS = join(ROOT, 'data/rs-lcd/fb-reply-drafts.json');

function convertCookies(raw) {
  return raw.map(c => {
    const o = { name: c.name, value: c.value, domain: c.domain, path: c.path || '/', secure: !!c.secure, httpOnly: !!c.httpOnly };
    if (c.expirationDate) o.expires = Math.floor(c.expirationDate);
    if (c.sameSite === 'no_restriction') o.sameSite = 'None';
    else if (c.sameSite === 'lax') o.sameSite = 'Lax';
    else if (c.sameSite === 'strict') o.sameSite = 'Strict';
    return o;
  });
}

// Extrait les sous-réponses sous le commentaire Marc.
// Identifie le commentaire Marc par match du texte (signature unique).
async function fetchRepliesUnderMarcComment(page, postUrl, marcCommentText) {
  await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(3500);

  // Scroll plusieurs fois pour charger tous les commentaires
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1800);
  }

  // Clic sur "Voir les X réponses" si présent sous le commentaire Marc
  const marcSnippet = marcCommentText.slice(0, 60);
  await page.evaluate((snippet) => {
    const articles = document.querySelectorAll('div[role="article"][aria-label*="Commentaire"]');
    for (const a of articles) {
      if (a.textContent.includes(snippet)) {
        // Cherche un bouton "Voir X réponses" à proximité (frère ou enfant)
        const showBtns = a.querySelectorAll('[role="button"]');
        for (const b of showBtns) {
          const t = (b.textContent || '').toLowerCase();
          if (t.includes('voir') && (t.includes('réponse') || t.includes('réponses'))) {
            b.click();
            return;
          }
        }
      }
    }
  }, marcSnippet);
  await page.waitForTimeout(2500);

  // Extrait toutes les "Réponse au commentaire" qui sont sous le commentaire Marc
  const replies = await page.evaluate((snippet) => {
    const out = [];
    // Cherche les sous-réponses : aria-label commence par "Réponse de X au commentaire de Y"
    const allReplies = document.querySelectorAll('div[role="article"][aria-label*="Réponse de"]');
    for (const r of allReplies) {
      const label = r.getAttribute('aria-label') || '';
      // Filtre : réponses dont le label cible Marc Chenut
      if (!label.includes('au commentaire de Marc Chenut')) continue;
      const author = (label.match(/Réponse de (.+?) au commentaire/) || [])[1] || 'Inconnu';
      // Texte de la réponse (sans le header user)
      const text = (r.textContent || '').slice(0, 1500).trim();
      out.push({ author, text, ariaLabel: label });
    }
    return out;
  }, marcSnippet);

  // Dédup : FB remount les articles dans le DOM après le scroll (lazy load + version
  // compacte/étendue), une même réponse peut donc apparaître plusieurs fois. On dédup
  // par (author, premiers 200 chars du text) avant de renvoyer.
  const seen = new Set();
  const deduped = [];
  for (const r of replies) {
    const key = `${r.author}::${r.text.slice(0, 200)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(r);
  }
  return deduped;
}

async function draftReplyViaClaude(originalPostContext, marcComment, newReply, drafts) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompt = `Tu es Marc Chenut, expert location courte durée (LCD), tu réponds à un commentaire sur Facebook dans un groupe de propriétaires Airbnb.

CONTEXTE :
- Tu avais commenté un post FB : "${marcComment}"
- Quelqu'un (${newReply.author}) répond à TON commentaire : "${newReply.text}"

TON DE MARC (CRITIQUE) :
- Tutoiement (Facebook, communauté décontractée)
- Phrases courtes, direct, pair-à-pair
- Pas d'emojis, pas de tirets longs, pas de signature
- Pas de "j'utilise" (parler en général : "beaucoup de proprios...")
- Boîte à code mécanique, pas serrure connectée
- Méthode 97% (97% occupation moyenne, <1h/mois/bien, 9 biens en 5 ans, sans conciergerie)

RÉPONSE :
- 1-3 phrases max (tu réponds à une réplique, pas à une question initiale)
- Si elle apporte un complément → reconnais + ajoute une nuance utile
- Si elle te contredit → reste pair-à-pair, factuel, pas d'attaque
- Si elle pose une nouvelle question → réponse concise + invite à creuser

QUAND SKIP (ne PAS répondre) :
- Spam, troll évident, off-topic → skip
- Ack/remerciement de fin de conversation SANS question ni relance (ex. "Merci pour ta réponse", "Bonne journée", "Ok parfait", "Top merci", "Cool merci") → skip. Sur FB, on ne répond pas à un merci, ça brise la fluidité et fait artificiel ("De rien"). Laisse la conversation se terminer naturellement.
- Réponse vide ou quasi vide (1-2 mots non-question) → skip

Quand tu skipes, mets "reason" précis (ex. "ack de fin de conv : merci + bonne journée, pas de question").

Réponds UNIQUEMENT en JSON :
{
  "text": "ta réponse complète (vide si skip)",
  "skip": false,
  "reason": "explication si skip"
}`;

  const resp = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = resp.content[0].text.trim();
  const cleaned = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned);
}

async function main() {
  if (!existsSync(HISTORY_FILE)) {
    console.log('fb-history.json absent — rien à checker');
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY absent dans .env');
    process.exit(1);
  }

  const history = JSON.parse(readFileSync(HISTORY_FILE, 'utf8'));
  if (history.length === 0) {
    console.log('Historique vide — rien à checker');
    return;
  }

  console.log(`${history.length} commentaires à checker pour nouvelles réponses\n`);

  const cookies = convertCookies(JSON.parse(readFileSync(COOKIES_FILE, 'utf8')));
  const ctx = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: true,
    viewport: { width: 1280, height: 900 },
    locale: 'fr-FR',
  });
  await ctx.addCookies(cookies);
  const page = await ctx.newPage();

  const draftsToReview = [];
  let replyCounter = 1;

  for (const entry of history) {
    console.log(`Check ${entry.postId} : ${entry.postUrl}`);

    let currentReplies = [];
    try {
      currentReplies = await fetchRepliesUnderMarcComment(page, entry.postUrl, entry.commentText);
    } catch (e) {
      console.error(`  ERREUR : ${e.message}`);
      continue;
    }

    const knownTexts = new Set((entry.knownReplyTexts || []).map(t => t.slice(0, 100)));
    const newReplies = currentReplies.filter(r => !knownTexts.has(r.text.slice(0, 100)));

    if (newReplies.length === 0) {
      console.log(`  pas de nouvelle réponse`);
    } else {
      console.log(`  ${newReplies.length} nouvelle(s) réponse(s)`);
      for (const reply of newReplies) {
        try {
          const draft = await draftReplyViaClaude(entry.postUrl, entry.commentText, reply, null);
          if (draft.skip) {
            console.log(`  → ${reply.author} : SKIP (${draft.reason})`);
          } else {
            const replyId = `R${replyCounter++}`;
            draftsToReview.push({
              replyId,
              postId: entry.postId,
              postUrl: entry.postUrl,
              marcComment: entry.commentText,
              replyAuthor: reply.author,
              replyText: reply.text,
              draftResponse: draft.text,
            });
            console.log(`  → ${replyId} (${reply.author}) drafted`);
          }
        } catch (e) {
          console.error(`  ERREUR draft : ${e.message}`);
        }
      }
    }

    // MAJ knownReplyTexts pour la prochaine fois
    entry.knownReplyTexts = currentReplies.map(r => r.text.slice(0, 100));
  }

  // Sauvegarde history mis à jour
  writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

  await ctx.close();

  if (draftsToReview.length === 0) {
    console.log('\nAucune nouvelle réponse à traiter aujourd\'hui');
    return;
  }

  // Sauvegarde drafts pour fb-reply.mjs
  mkdirSync(dirname(REPLY_DRAFTS), { recursive: true });
  const draftsMap = Object.fromEntries(
    draftsToReview.map(d => [d.replyId, { url: d.postUrl, text: d.draftResponse, marcComment: d.marcComment, replyAuthor: d.replyAuthor }])
  );
  writeFileSync(REPLY_DRAFTS, JSON.stringify(draftsMap, null, 2));

  // Email récap
  const date = new Date().toISOString().slice(0, 10);
  const body = `Scan des réponses aux commentaires Marc — ${date}

${draftsToReview.length} nouvelle(s) réponse(s) détectée(s).

` + draftsToReview.map(d => `════════════════════════════════════════
RÉPONSE ${d.replyId} — Post ${d.postId}
URL : ${d.postUrl}
Auteur : ${d.replyAuthor}

TON COMMENTAIRE INITIAL :
${d.marcComment}

LEUR RÉPONSE :
${d.replyText}

PROPOSITION DE TA RÉPLIQUE :
${d.draftResponse}
`).join('\n') + `
════════════════════════════════════════

TON ACTION (réponds à cet email) :

OK: R1, R2, R3
SKIP: R4
EDIT R5: ma version reformulée

Format strict ou langage naturel — je gère.`;

  execSync(
    `./scripts/tech-watchdog/send-report.sh "[FB replies] ${date} — ${draftsToReview.length} propositions"`,
    { cwd: ROOT, input: body, encoding: 'utf8', stdio: ['pipe', 'inherit', 'inherit'] }
  );
  console.log(`\n✓ Email envoyé avec ${draftsToReview.length} propositions`);
}

main().catch(e => { console.error(e); process.exit(1); });
