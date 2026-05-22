/**
 * submit-via-chrome.mjs — Soumet les top N URLs via URL Inspection Tool GSC.
 *
 * Utilise Playwright + Chrome headless avec cookies GSC persistés (pas de
 * dépendance à Claude Code / Chrome MCP).
 *
 * Premier run : Cookie-Editor → exporte les cookies du domaine
 * search.google.com et google.com → enregistre en
 * scripts/gsc-indexation/gsc-cookies.json (format JSON).
 *
 * Usage :
 *   node scripts/gsc-indexation/compute-candidates.mjs  # 1. calcule top N
 *   node scripts/gsc-indexation/submit-via-chrome.mjs   # 2. soumet
 *
 * Exit codes :
 *   0 : tout OK
 *   1 : erreur fatale
 *   2 : fichiers manquants (cookies ou candidates)
 *   3 : cookies invalides / pas loggué
 *   4 : stoppé en cours (quota Google ou CAPTCHA)
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const USER_DATA_DIR = join(homedir(), '.playwright-gsc-indexation');
const COOKIES_FILE = join(__dirname, 'gsc-cookies.json');
const CANDIDATES_FILE = join(__dirname, 'candidates-today.json');
const TRACKING_FILE = join(ROOT, '.claude/gsc-tracking/urls.json');
const PROPERTY = 'sc-domain:enomia.app';
const GSC_INSPECT_BASE = `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(PROPERTY)}`;
const TODAY = new Date().toISOString().slice(0, 10);

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

async function isLoggedIn(page) {
  await page.goto('https://search.google.com/search-console/about', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  const url = page.url();
  if (url.includes('accounts.google.com') || url.includes('ServiceLogin')) return false;
  const text = (await page.textContent('body').catch(() => '')).toLowerCase();
  return !text.includes('se connecter à google') && !text.includes('sign in to google');
}

async function inspectAndRequest(page, targetUrl) {
  const inspectUrl = `${GSC_INSPECT_BASE}&id=${encodeURIComponent(targetUrl)}`;
  await page.goto(inspectUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(10000);

  const bodyText = (await page.textContent('body').catch(() => '')).toLowerCase();

  if (bodyText.includes('captcha') || bodyText.includes('vérifiez que vous êtes humain')) {
    return { status: 'captcha', reason: 'CAPTCHA détecté sur la page' };
  }

  if (
    bodyText.includes("l'url est sur google") ||
    bodyText.includes('url is on google') ||
    bodyText.includes('url disponible pour google')
  ) {
    return { status: 'indexed', reason: 'GSC indique URL déjà indexée (URL is on Google)' };
  }

  const buttonSelectors = [
    'button:has-text("Demander une indexation")',
    'button:has-text("Request indexing")',
    'div[role="button"]:has-text("Demander une indexation")',
    'div[role="button"]:has-text("Request indexing")',
  ];

  let clicked = false;
  for (const sel of buttonSelectors) {
    try {
      const btn = await page.waitForSelector(sel, { timeout: 4000, state: 'visible' });
      if (btn) {
        await btn.click();
        clicked = true;
        break;
      }
    } catch { /* try next */ }
  }

  if (!clicked) {
    return { status: 'failed', reason: 'Bouton "Demander une indexation" introuvable' };
  }

  await page.waitForTimeout(40000);

  const afterText = (await page.textContent('body').catch(() => '')).toLowerCase();

  if (afterText.includes('quota') && (afterText.includes('atteint') || afterText.includes('dépassé') || afterText.includes('exceed'))) {
    return { status: 'quota_exceeded', reason: 'Quota Google atteint' };
  }
  if (afterText.includes('captcha')) {
    return { status: 'captcha', reason: 'CAPTCHA détecté après click' };
  }
  if (
    afterText.includes('indexation demandée') ||
    afterText.includes('indexing requested') ||
    afterText.includes('demande envoyée') ||
    afterText.includes('request submitted')
  ) {
    return { status: 'requested', reason: 'Demande envoyée à Google via URL Inspection' };
  }

  return { status: 'unknown', reason: 'État indéterminé après click (à investiguer)' };
}

async function main() {
  if (!existsSync(COOKIES_FILE)) {
    console.error(`ERREUR: ${COOKIES_FILE} introuvable.`);
    console.error('Exporte les cookies GSC via Cookie-Editor (domaine google.com + search.google.com).');
    console.error('Sauve le JSON ici : scripts/gsc-indexation/gsc-cookies.json');
    process.exit(2);
  }
  if (!existsSync(CANDIDATES_FILE)) {
    console.error(`ERREUR: ${CANDIDATES_FILE} introuvable.`);
    console.error('Lance d\'abord : node scripts/gsc-indexation/compute-candidates.mjs');
    process.exit(2);
  }

  const candidatesData = JSON.parse(readFileSync(CANDIDATES_FILE, 'utf8'));
  const cookies = convertCookies(JSON.parse(readFileSync(COOKIES_FILE, 'utf8')));
  const tracking = JSON.parse(readFileSync(TRACKING_FILE, 'utf8'));

  if (candidatesData.candidates.length === 0) {
    console.log('Aucune candidate à soumettre aujourd\'hui (pool épuisé / tout déjà demandé < 14j).');
    tracking.last_run = TODAY;
    writeFileSync(TRACKING_FILE, JSON.stringify(tracking, null, 2));
    console.log(`GSC_INDEXATION_DONE submitted=0 indexed=0 failed=0 total_candidates=0`);
    process.exit(0);
  }

  console.log(`📨 Soumission de ${candidatesData.candidates.length} URL(s) via Playwright...\n`);

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: true,
    viewport: { width: 1400, height: 900 },
    locale: 'fr-FR',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  });
  await context.addCookies(cookies);
  const page = await context.newPage();

  if (!(await isLoggedIn(page))) {
    console.error('ERREUR: Cookies invalides ou expirés (pas loggué à GSC).');
    console.error('Refais l\'export Cookie-Editor depuis Chrome où tu es loggué à marc@enomia.app.');
    await context.close();
    process.exit(3);
  }
  console.log('✓ Connecté à GSC\n');

  const results = [];
  let stopReason = null;

  for (const c of candidatesData.candidates) {
    console.log(`→ ${c.url}  [vol=${c.vol}]`);
    let result;
    try {
      result = await inspectAndRequest(page, c.url);
    } catch (e) {
      result = { status: 'failed', reason: `Exception : ${e.message}` };
    }
    console.log(`   ${result.status} — ${result.reason}`);
    results.push({ ...c, ...result, submittedAt: new Date().toISOString() });

    const t = tracking.urls[c.url] || { request_count: 0 };
    if (result.status === 'requested') {
      t.status = 'requested';
      t.last_requested = TODAY;
      t.request_count = (t.request_count || 0) + 1;
      t.reason = 'Demandée via Chrome MCP (Playwright autonome)';
      tracking.urls[c.url] = t;
    } else if (result.status === 'indexed') {
      t.status = 'indexed';
      t.reason = 'Confirmée indexée via URL Inspection';
      tracking.urls[c.url] = t;
    } else if (result.status === 'failed') {
      t.status = 'failed';
      t.reason = result.reason;
      tracking.urls[c.url] = t;
    }

    if (result.status === 'quota_exceeded' || result.status === 'captcha') {
      stopReason = result;
      break;
    }

    await page.waitForTimeout(5000 + Math.floor(Math.random() * 3000));
  }

  await context.close();

  tracking.last_run = TODAY;
  writeFileSync(TRACKING_FILE, JSON.stringify(tracking, null, 2));

  const logDir = join(__dirname, 'logs');
  mkdirSync(logDir, { recursive: true });
  writeFileSync(
    join(logDir, `${TODAY}.json`),
    JSON.stringify({ date: TODAY, total: candidatesData.candidates.length, results, stopReason }, null, 2)
  );

  const submitted = results.filter(r => r.status === 'requested').length;
  const indexed = results.filter(r => r.status === 'indexed').length;
  const failed = results.filter(r => ['failed', 'unknown'].includes(r.status)).length;

  console.log(`\n📊 Bilan : ${submitted} soumises, ${indexed} déjà indexées, ${failed} échec(s)`);
  if (stopReason) console.log(`⚠️ STOP : ${stopReason.status} — ${stopReason.reason}`);

  console.log(`\nGSC_INDEXATION_DONE submitted=${submitted} indexed=${indexed} failed=${failed}${stopReason ? ` stop=${stopReason.status}` : ''}`);
  process.exit(stopReason ? 4 : 0);
}

main().catch(e => {
  console.error('FATAL:', e.message);
  console.error(e.stack);
  process.exit(1);
});
