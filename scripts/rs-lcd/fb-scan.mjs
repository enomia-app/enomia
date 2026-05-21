/**
 * fb-scan.mjs — Scan des groupes Facebook LCD
 *
 * Usage :
 *   node scripts/rs-lcd/fb-scan.mjs
 *
 * Premier run : une fenêtre Chrome s'ouvre, connecte-toi à Facebook manuellement.
 * Runs suivants : complètement automatique (session persistée sur disque).
 *
 * Output : data/rs-lcd/fb-scan-candidates.json
 */

import { chromium } from 'playwright';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const USER_DATA_DIR = join(homedir(), '.playwright-fb-scan');
const COOKIES_FILE = join(__dirname, 'fb-cookies.json');
const OUTPUT_FILE = join(__dirname, '../../data/rs-lcd/fb-scan-candidates.json');

// Convertit le format Cookie-Editor → format Playwright
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

const GROUPS = [
  { id: 'g1', name: 'Airbnb Propriétaires France',           url: 'https://www.facebook.com/groups/1820983154865197' },
  { id: 'g2', name: 'Airbnb Entraide pour Hôte',             url: 'https://www.facebook.com/groups/airbnbentraidepourhote/' },
  { id: 'g3', name: 'Le Cercle de la Location Courte Durée', url: 'https://www.facebook.com/groups/359389397873531/' },
  { id: 'g4', name: 'Entraide Airbnb & Booking',             url: 'https://www.facebook.com/groups/940614047868754/' },
  { id: 'g5', name: 'Groupe LCD 5',                          url: 'https://www.facebook.com/groups/1731441584115261/' },
  { id: 'g6', name: 'Groupe LCD 6',                          url: 'https://www.facebook.com/groups/478050167400075/' },
  { id: 'g7', name: 'Location directe',                      url: 'https://www.facebook.com/groups/locationdirect/' },
  { id: 'g8', name: 'Groupe LCD 8',                          url: 'https://www.facebook.com/groups/222964592277509/' },
];

async function extractPosts(page, groupId, groupName) {
  return page.evaluate(({ groupId, groupName }) => {
    const out = [];
    const seen = new Set();

    // Stratégie 1 : enfants directs du feed
    document.querySelectorAll('div[role="feed"] > div').forEach(item => {
      const links = item.querySelectorAll('a[href*="/posts/"]');
      for (const l of links) {
        const url = l.href.split('?')[0];
        if (!url.match(/\/groups\/[^/]+\/posts\/[0-9]+/) || seen.has(url)) continue;
        seen.add(url);

        const authorLink = item.querySelector('strong a, h2 a, h3 a');
        const author = authorLink ? authorLink.textContent.trim() : 'Inconnu';

        const raw = (item.textContent || '')
          .replace(/Facebook\s*/g, '')
          .replace(/\s{3,}/g, '\n')
          .slice(0, 3000)
          .trim();

        if (raw.length < 60) continue;
        out.push({ groupId, groupName, url, author, text: raw });
        break;
      }
    });

    // Stratégie 2 (fallback) : liens directs sur la page
    if (out.length === 0) {
      document.querySelectorAll('a[href*="/posts/"]').forEach(l => {
        const url = l.href.split('?')[0];
        if (!url.match(/\/groups\/[^/]+\/posts\/[0-9]+/) || seen.has(url)) return;
        seen.add(url);
        out.push({ groupId, groupName, url, author: '', text: '' });
      });
    }

    return out;
  }, { groupId, groupName });
}

async function scrollFeed(page, steps = 6) {
  for (let i = 0; i < steps; i++) {
    await page.evaluate(() => window.scrollBy(0, 2800));
    await page.waitForTimeout(1800 + Math.floor(Math.random() * 1200));
  }
}

async function scanGroup(page, group) {
  console.log(`→ ${group.name}`);
  try {
    await page.goto(group.url, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await page.waitForTimeout(4000);
    await scrollFeed(page, 6);
    const posts = await extractPosts(page, group.id, group.name);
    console.log(`   ${posts.length} posts`);
    return posts;
  } catch (e) {
    console.error(`   ERREUR: ${e.message}`);
    return [];
  }
}

async function isLoggedIn(page) {
  await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  return page.evaluate(() =>
    !!document.querySelector('[aria-label="Votre profil"], [aria-label="Your profile"], [data-testid="blue_bar_profile_link"]')
  );
}

async function main() {
  if (!existsSync(COOKIES_FILE)) {
    console.error(`\nERREUR: ${COOKIES_FILE} introuvable.`);
    console.error('Exporte les cookies Facebook via Cookie-Editor (voir README.md).\n');
    process.exit(1);
  }

  const rawCookies = JSON.parse(readFileSync(COOKIES_FILE, 'utf8'));
  const cookies = convertCookies(rawCookies);

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: true,
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'fr-FR',
  });

  await context.addCookies(cookies);
  const page = await context.newPage();

  const loggedIn = await isLoggedIn(page);
  if (!loggedIn) {
    console.error('\nERREUR: Cookies invalides ou expirés.');
    console.error('Refais l\'export Cookie-Editor depuis Chrome où tu es connecté à FB.\n');
    await context.close();
    process.exit(1);
  }

  console.log('✓ Connecté à Facebook\n');

  const allPosts = [];
  for (const group of GROUPS) {
    const posts = await scanGroup(page, group);
    allPosts.push(...posts);
    await page.waitForTimeout(2000 + Math.floor(Math.random() * 3000));
  }

  await context.close();

  const output = {
    date: new Date().toISOString().slice(0, 10),
    totalPosts: allPosts.length,
    posts: allPosts,
  };

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\n✓ ${allPosts.length} posts → ${OUTPUT_FILE}`);
}

main().catch(e => { console.error(e); process.exit(1); });
