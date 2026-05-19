/**
 * fb-post.mjs — Poster les commentaires validés sur les groupes Facebook LCD
 *
 * Usage :
 *   node scripts/rs-lcd/fb-post.mjs data/rs-lcd/fb-validated.json
 *
 * Format de fb-validated.json :
 *   [
 *     { "postId": "1.1", "url": "https://www.facebook.com/groups/.../posts/123/", "text": "..." },
 *     ...
 *   ]
 *
 * Réutilise la session persistée par fb-scan.mjs (~/.playwright-fb-scan/).
 * Si la session a expiré, une fenêtre s'ouvre pour se reconnecter.
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
    const out = {
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path || '/',
      secure: !!c.secure,
      httpOnly: !!c.httpOnly,
    };
    if (c.expirationDate) out.expires = Math.floor(c.expirationDate);
    if (c.sameSite === 'no_restriction') out.sameSite = 'None';
    else if (c.sameSite === 'lax') out.sameSite = 'Lax';
    else if (c.sameSite === 'strict') out.sameSite = 'Strict';
    return out;
  });
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function postComment(page, url, text) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(3000 + randomBetween(0, 1500));

  // Scroll au bas pour révéler le composer de commentaire
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);

  // Clic JS direct sur le bouton "Laissez un commentaire" (bypass overlays FB)
  const clicked = await page.evaluate(() => {
    const btns = document.querySelectorAll('[aria-label="Laissez un commentaire"][role="button"]');
    for (const b of btns) {
      if (b.offsetParent !== null) { b.click(); return true; }
    }
    return false;
  });
  if (!clicked) throw new Error('Bouton "Laissez un commentaire" introuvable');
  await page.waitForTimeout(1800 + randomBetween(0, 500));

  // Focus dans le composer après le clic, on tape directement
  await page.keyboard.type(text, { delay: randomBetween(20, 60) });
  await page.waitForTimeout(1200 + randomBetween(0, 800));

  // Envoi avec Ctrl+Enter
  await page.keyboard.press('Control+Enter');
  await page.waitForTimeout(3500);
}

async function isLoggedIn(page) {
  await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  return page.evaluate(() =>
    !!document.querySelector('[aria-label="Votre profil"], [aria-label="Your profile"], [data-testid="blue_bar_profile_link"]')
  );
}

async function main() {
  const inputFile = process.argv[2];
  if (!inputFile || !existsSync(inputFile)) {
    console.error('\nUsage: node scripts/rs-lcd/fb-post.mjs data/rs-lcd/fb-validated.json\n');
    process.exit(1);
  }

  if (!existsSync(COOKIES_FILE)) {
    console.error(`\nERREUR: ${COOKIES_FILE} introuvable.\n`);
    process.exit(1);
  }

  const validations = JSON.parse(readFileSync(inputFile, 'utf8'));
  const cookies = convertCookies(JSON.parse(readFileSync(COOKIES_FILE, 'utf8')));
  console.log(`\n${validations.length} commentaires à poster\n`);

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: true,
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'fr-FR',
  });

  await context.addCookies(cookies);
  const page = await context.newPage();

  if (!await isLoggedIn(page)) {
    console.error('Cookies invalides — refais l\'export Cookie-Editor.');
    await context.close();
    process.exit(1);
  }

  let posted = 0;
  let failed = 0;

  for (let i = 0; i < validations.length; i++) {
    const { url, text, postId } = validations[i];
    console.log(`[${i + 1}/${validations.length}] ${postId || ''} — ${url}`);

    try {
      await postComment(page, url, text);
      console.log(`   ✓ Posté`);
      posted++;
    } catch (e) {
      console.error(`   ✗ Échec: ${e.message}`);
      failed++;
    }

    if (i < validations.length - 1) {
      const delaySec = randomBetween(60, 180);
      console.log(`   ↻ Pause ${delaySec}s...\n`);
      await sleep(delaySec * 1000);
    }
  }

  await context.close();

  console.log(`\n─────────────────────`);
  console.log(`✓ Postés : ${posted}/${validations.length}`);
  if (failed > 0) { console.log(`✗ Échecs : ${failed}`); process.exit(1); }
}

main().catch(e => { console.error(e); process.exit(1); });
