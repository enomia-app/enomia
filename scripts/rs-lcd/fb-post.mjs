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
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const USER_DATA_DIR = join(homedir(), '.playwright-fb-scan');
const COOKIES_FILE = join(__dirname, 'fb-cookies.json');
const HISTORY_FILE = join(__dirname, '../../data/rs-lcd/fb-history.json');
const ARCHIVE_FILE = join(__dirname, '../../data/rs-lcd/fb-archive.json');
const HISTORY_MAX_AGE_DAYS = 30;

function loadJsonArray(p) {
  if (!existsSync(p)) return [];
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return []; }
}

function appendHistory(entry) {
  mkdirSync(dirname(HISTORY_FILE), { recursive: true });
  // History : 30 jours glissants
  const cutoff = Date.now() - HISTORY_MAX_AGE_DAYS * 24 * 3600 * 1000;
  const history = loadJsonArray(HISTORY_FILE).filter(h => new Date(h.postedAt).getTime() > cutoff);
  history.push(entry);
  writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  // Archive : append-only (long terme pour analyse SEO/produit)
  const archive = loadJsonArray(ARCHIVE_FILE);
  archive.push(entry);
  writeFileSync(ARCHIVE_FILE, JSON.stringify(archive, null, 2));
}

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

async function clickButton(page, ariaLabel) {
  // Récupère les coordonnées du bouton visible (1er match) et clique via mouse (event trusted)
  const coords = await page.evaluate((label) => {
    const btns = document.querySelectorAll(`[aria-label="${label}"][role="button"]`);
    for (const b of btns) {
      if (b.offsetParent !== null) {
        const r = b.getBoundingClientRect();
        return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
      }
    }
    return null;
  }, ariaLabel);
  if (!coords) throw new Error(`Bouton "${ariaLabel}" introuvable`);
  await page.mouse.move(coords.x, coords.y);
  await page.waitForTimeout(150);
  await page.mouse.click(coords.x, coords.y);
}

async function postComment(page, url, text) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(3000 + randomBetween(0, 1500));

  // Scroll au bas pour révéler le composer de commentaire
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);

  // Vraie souris sur "Laissez un commentaire" pour ouvrir le composer
  await clickButton(page, 'Laissez un commentaire');
  await page.waitForTimeout(1800 + randomBetween(0, 500));

  // Inject text via execCommand (déclenche les events que Lexical écoute, contrairement à keyboard.type)
  const injected = await page.evaluate((t) => {
    const editors = [...document.querySelectorAll('[contenteditable="true"][role="textbox"]')]
      .filter(e => e.offsetParent !== null);
    if (editors.length === 0) return { ok: false, reason: 'aucun composer visible' };
    const editor = editors[0];
    editor.focus();
    document.execCommand('insertText', false, t);
    return { ok: true, count: editors.length, label: editor.getAttribute('aria-label') };
  }, text);
  if (!injected.ok) throw new Error('Composer : ' + injected.reason);
  await page.waitForTimeout(1500 + randomBetween(0, 800));

  // Vérifier que le bouton "Publier" est bien actif maintenant
  const ready = await page.evaluate(() => {
    const b = [...document.querySelectorAll('[aria-label="Publier le commentaire"][role="button"]')]
      .find(x => x.offsetParent !== null);
    return b && b.getAttribute('aria-disabled') !== 'true';
  });
  if (!ready) throw new Error('Bouton "Publier" reste désactivé — Lexical n\'a pas enregistré le texte');

  // Vraie souris sur "Publier le commentaire" pour envoyer
  await clickButton(page, 'Publier le commentaire');
  await page.waitForTimeout(4000);
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
      appendHistory({
        postId,
        postUrl: url,
        commentText: text,
        postedAt: new Date().toISOString(),
      });
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
