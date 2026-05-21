#!/usr/bin/env node
/**
 * fb-reply.mjs — Poster des réponses sous les commentaires Marc déjà postés
 *
 * Différence avec fb-post.mjs : on ne crée pas un nouveau commentaire en bas du post,
 * on RÉPOND à un commentaire spécifique de Marc en cliquant "Répondre" sous lui.
 *
 * Usage : node scripts/rs-lcd/fb-reply.mjs data/rs-lcd/fb-reply-validated.json
 *
 * Format attendu : [{ replyId, url (post URL), text (réponse à poster), marcComment (texte du commentaire Marc pour le retrouver) }]
 */

import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const USER_DATA_DIR = join(homedir(), '.playwright-fb-scan');
const COOKIES_FILE = join(__dirname, 'fb-cookies.json');

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

const randomBetween = (a, b) => Math.floor(Math.random() * (b - a + 1) + a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function clickAt(page, x, y) {
  await page.mouse.move(x, y);
  await page.waitForTimeout(150);
  await page.mouse.click(x, y);
}

async function isLoggedIn(page) {
  await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  return page.evaluate(() =>
    !!document.querySelector('[aria-label="Votre profil"], [aria-label="Your profile"], [data-testid="blue_bar_profile_link"]')
  );
}

async function postReply(page, postUrl, marcComment, replyText) {
  await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(3000 + randomBetween(0, 1500));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);

  // Trouve le bouton "Répondre" sous le commentaire Marc (matché par snippet de texte)
  const snippet = marcComment.slice(0, 60);
  const replyBtnCoords = await page.evaluate((snippet) => {
    const articles = document.querySelectorAll('div[role="article"][aria-label*="Commentaire"]');
    for (const a of articles) {
      if (!a.textContent.includes(snippet)) continue;
      // Cherche dans CE commentaire (et ses descendants directs, pas les enfants articles) le bouton Répondre
      const btns = a.querySelectorAll('[role="button"]');
      for (const b of btns) {
        const t = (b.textContent || '').trim().toLowerCase();
        // FB français : "Répondre" exact
        if (t === 'répondre' && b.offsetParent !== null) {
          const r = b.getBoundingClientRect();
          return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
        }
      }
    }
    return null;
  }, snippet);

  if (!replyBtnCoords) {
    throw new Error(`Bouton "Répondre" sous commentaire Marc introuvable (snippet : "${snippet.slice(0, 30)}...")`);
  }

  await clickAt(page, replyBtnCoords.x, replyBtnCoords.y);
  await page.waitForTimeout(1500 + randomBetween(0, 500));

  // Inject texte via execCommand (notifie Lexical)
  const injected = await page.evaluate((t) => {
    const editors = [...document.querySelectorAll('[contenteditable="true"][role="textbox"]')]
      .filter(e => e.offsetParent !== null);
    if (editors.length === 0) return false;
    // Le composer "Répondre à ..." devient le 1er visible après le clic
    const editor = editors[0];
    editor.focus();
    document.execCommand('insertText', false, t);
    return true;
  }, replyText);
  if (!injected) throw new Error('Composer de réponse introuvable');
  await page.waitForTimeout(1500 + randomBetween(0, 800));

  // Vérifier que le bouton Publier est actif
  const sendCoords = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('[aria-label="Publier le commentaire"][role="button"]')]
      .filter(b => b.offsetParent !== null && b.getAttribute('aria-disabled') !== 'true');
    if (btns.length === 0) return null;
    const b = btns[0];
    const r = b.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  });
  if (!sendCoords) throw new Error('Bouton Publier désactivé ou introuvable');

  await clickAt(page, sendCoords.x, sendCoords.y);
  await page.waitForTimeout(4000);
}

async function main() {
  const inputFile = process.argv[2];
  if (!inputFile || !existsSync(inputFile)) {
    console.error('\nUsage: node scripts/rs-lcd/fb-reply.mjs data/rs-lcd/fb-reply-validated.json\n');
    process.exit(1);
  }
  if (!existsSync(COOKIES_FILE)) {
    console.error(`\nERREUR: ${COOKIES_FILE} introuvable.\n`);
    process.exit(1);
  }

  const replies = JSON.parse(readFileSync(inputFile, 'utf8'));
  const cookies = convertCookies(JSON.parse(readFileSync(COOKIES_FILE, 'utf8')));

  console.log(`\n${replies.length} réponses à poster\n`);

  const ctx = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: true,
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'fr-FR',
  });
  await ctx.addCookies(cookies);
  const page = await ctx.newPage();

  if (!await isLoggedIn(page)) {
    console.error('Cookies invalides — refais l\'export Cookie-Editor.');
    await ctx.close();
    process.exit(1);
  }

  let posted = 0;
  let failed = 0;

  for (let i = 0; i < replies.length; i++) {
    const { replyId, url, marcComment, text } = replies[i];
    console.log(`[${i + 1}/${replies.length}] ${replyId || '#' + (i + 1)} — ${url}`);

    try {
      await postReply(page, url, marcComment, text);
      console.log(`   ✓ Répondu`);
      posted++;
    } catch (e) {
      console.error(`   ✗ Échec: ${e.message}`);
      failed++;
    }

    if (i < replies.length - 1) {
      const delaySec = randomBetween(60, 180);
      console.log(`   ↻ Pause ${delaySec}s...\n`);
      await sleep(delaySec * 1000);
    }
  }

  await ctx.close();

  console.log(`\n─────────────────────`);
  console.log(`✓ Réponses postées : ${posted}/${replies.length}`);
  if (failed > 0) { console.log(`✗ Échecs : ${failed}`); process.exit(1); }
}

main().catch(e => { console.error(e); process.exit(1); });
