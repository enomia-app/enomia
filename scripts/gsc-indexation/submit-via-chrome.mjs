/**
 * submit-via-chrome.mjs — Soumet les top N URLs via URL Inspection Tool GSC.
 *
 * Architecture (depuis 2026-05-23) :
 *   - Chrome stable lancé en background sur Mac mini avec
 *     --remote-debugging-port=9222 et --user-data-dir=~/.playwright-gsc-indexation
 *   - Ce script se connecte au Chrome via CDP (Chrome DevTools Protocol)
 *   - Pas de Playwright qui lance Chrome → pas de détection automation Google
 *   - Le profil reste loggué entre les runs (Chrome tourne en permanence)
 *
 * SETUP (une fois sur Mac mini, via VNC) :
 *   node scripts/gsc-indexation/submit-via-chrome.mjs --setup
 *   → Lance Chrome avec CDP + ouvre GSC, attends que Marc se logue.
 *
 * RUNS QUOTIDIENS (cron) :
 *   node scripts/gsc-indexation/compute-candidates.mjs
 *   node scripts/gsc-indexation/submit-via-chrome.mjs
 *
 * Exit codes :
 *   0 : tout OK
 *   1 : erreur fatale
 *   2 : candidates manquantes
 *   3 : Chrome CDP pas accessible (pas lancé / pas le bon port)
 *   4 : stoppé en cours (quota Google ou CAPTCHA)
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const USER_DATA_DIR = join(homedir(), '.playwright-gsc-indexation');
const CANDIDATES_FILE = join(__dirname, 'candidates-today.json');
const TRACKING_FILE = join(ROOT, '.claude/gsc-tracking/urls.json');
const PROPERTY = 'sc-domain:enomia.app';
const GSC_INSPECT_BASE = `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(PROPERTY)}`;
const GSC_DASHBOARD = `https://search.google.com/search-console?resource_id=${encodeURIComponent(PROPERTY)}`;
const CDP_URL = 'http://localhost:9222';
const TODAY = new Date().toISOString().slice(0, 10);
const SETUP_MODE = process.argv.includes('--setup');

async function isChromeRunning() {
  try {
    const res = await fetch(`${CDP_URL}/json/version`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

function launchChromeBackground() {
  console.log('Démarrage de Chrome en background avec CDP port 9222...');
  spawn('open', ['-na', 'Google Chrome', '--args',
    '--remote-debugging-port=9222',
    `--user-data-dir=${USER_DATA_DIR}`,
  ], { detached: true, stdio: 'ignore' }).unref();
}

async function waitForChrome(maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 1000));
    if (await isChromeRunning()) return true;
  }
  return false;
}

async function isLoggedIn(page) {
  await page.goto(GSC_DASHBOARD, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  const url = page.url();
  if (url.includes('accounts.google.com')) return false;
  if (url.includes('/ServiceLogin')) return false;
  if (url.includes('/signin/')) return false;
  return true;
}

async function inspectAndRequest(page, targetUrl) {
  const inspectUrl = `${GSC_INSPECT_BASE}&id=${encodeURIComponent(targetUrl)}`;
  await page.goto(inspectUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(12000);

  if (page.url().includes('accounts.google.com')) {
    return { status: 'auth_lost', reason: 'Redirigé vers login en cours de run — session expirée' };
  }

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
    '[aria-label*="ndexation" i]',
    '[aria-label*="ndexing" i]',
  ];

  let clicked = false;
  for (const sel of buttonSelectors) {
    try {
      const btn = await page.waitForSelector(sel, { timeout: 4000, state: 'visible' });
      if (btn) {
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click();
        clicked = true;
        break;
      }
    } catch { /* try next */ }
  }

  if (!clicked) {
    const debugDir = join(__dirname, 'logs');
    mkdirSync(debugDir, { recursive: true });
    const safe = targetUrl.replace(/[^a-z0-9]+/gi, '_').slice(0, 80);
    await page.screenshot({ path: join(debugDir, `debug-${TODAY}-${safe}.png`) }).catch(() => {});
    return { status: 'failed', reason: 'Bouton "Demander une indexation" introuvable (screenshot sauvé)' };
  }

  await page.waitForTimeout(45000);

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
    return { status: 'requested', reason: 'Demandée via Playwright CDP (URL Inspection Tool)' };
  }

  return { status: 'unknown', reason: 'État indéterminé après click' };
}

async function getBrowserContext() {
  let chromeReady = await isChromeRunning();
  if (!chromeReady) {
    launchChromeBackground();
    chromeReady = await waitForChrome();
    if (!chromeReady) {
      throw new Error('Chrome CDP introuvable après 15s. Vérifier que Chrome est lancé et accessible.');
    }
  }

  const browser = await chromium.connectOverCDP(CDP_URL);
  const contexts = browser.contexts();
  const context = contexts[0] || await browser.newContext({ locale: 'fr-FR' });
  return { browser, context };
}

async function runSetup() {
  console.log('🛠️  Mode setup\n');

  if (await isChromeRunning()) {
    console.log('✓ Chrome déjà lancé avec CDP. Va dans cette fenêtre, vérifie que tu vois');
    console.log('  le dashboard GSC enomia.app. Si pas loggué, connecte-toi.\n');
  } else {
    launchChromeBackground();
    console.log('Lancement de Chrome avec CDP...');
    if (!(await waitForChrome())) {
      console.error('Échec : Chrome n\'a pas démarré sur le port 9222.');
      process.exit(1);
    }
    console.log('✓ Chrome lancé. Va dans la fenêtre Chrome, logge-toi à GSC avec un');
    console.log('  compte Owner de la propriété enomia.app (marchenut@gmail.com ou');
    console.log('  marc@enomia.app), puis confirme que tu vois le dashboard.\n');
  }

  // Ouvre GSC dans un onglet via CDP
  const { browser, context } = await getBrowserContext();
  const page = await context.newPage();
  await page.goto(GSC_DASHBOARD);

  console.log('Chrome reste ouvert. Quand tu confirmes que le dashboard GSC est');
  console.log('accessible, tu peux fermer ce terminal (Ctrl+C). Chrome continuera de');
  console.log('tourner en background avec son profil loggué — c\'est ce que cron va');
  console.log('utiliser.\n');

  await browser.close();
  process.exit(0);
}

async function runNormal() {
  if (!existsSync(CANDIDATES_FILE)) {
    console.error(`ERREUR: ${CANDIDATES_FILE} introuvable.`);
    console.error('Lance d\'abord : node scripts/gsc-indexation/compute-candidates.mjs');
    process.exit(2);
  }

  const candidatesData = JSON.parse(readFileSync(CANDIDATES_FILE, 'utf8'));
  const tracking = JSON.parse(readFileSync(TRACKING_FILE, 'utf8'));

  if (candidatesData.candidates.length === 0) {
    console.log('Aucune candidate à soumettre aujourd\'hui (pool épuisé / tout déjà demandé < 14j).');
    tracking.last_run = TODAY;
    writeFileSync(TRACKING_FILE, JSON.stringify(tracking, null, 2));
    console.log(`GSC_INDEXATION_DONE submitted=0 indexed=0 failed=0 total_candidates=0`);
    process.exit(0);
  }

  console.log(`📨 Soumission de ${candidatesData.candidates.length} URL(s) via Chrome CDP...\n`);

  let browser;
  try {
    const result = await getBrowserContext();
    browser = result.browser;
    const { context } = result;
    const page = await context.newPage();

    if (!(await isLoggedIn(page))) {
      console.error('ERREUR: Chrome connecté via CDP mais pas loggué à GSC.');
      console.error('Lance --setup pour te logger dans la fenêtre Chrome.');
      await browser.close();
      process.exit(3);
    }
    console.log('✓ Connecté à GSC via Chrome CDP\n');

    const results = [];
    let stopReason = null;

    for (const c of candidatesData.candidates) {
      console.log(`→ ${c.url}  [vol=${c.vol}]`);
      let r;
      try {
        r = await inspectAndRequest(page, c.url);
      } catch (e) {
        r = { status: 'failed', reason: `Exception : ${e.message}` };
      }
      console.log(`   ${r.status} — ${r.reason}`);
      results.push({ ...c, ...r, submittedAt: new Date().toISOString() });

      const t = tracking.urls[c.url] || { request_count: 0 };
      if (r.status === 'requested') {
        t.status = 'requested';
        t.last_requested = TODAY;
        t.request_count = (t.request_count || 0) + 1;
        t.reason = 'Demandée via Playwright CDP (URL Inspection Tool)';
        tracking.urls[c.url] = t;
      } else if (r.status === 'indexed') {
        t.status = 'indexed';
        t.reason = 'Confirmée indexée via URL Inspection';
        tracking.urls[c.url] = t;
      } else if (r.status === 'failed') {
        t.status = 'pending';
        t.last_attempt = TODAY;
        t.last_attempt_reason = r.reason;
        tracking.urls[c.url] = t;
      }

      if (r.status === 'quota_exceeded' || r.status === 'captcha' || r.status === 'auth_lost') {
        stopReason = r;
        break;
      }

      await page.waitForTimeout(5000 + Math.floor(Math.random() * 3000));
    }

    await page.close();
    await browser.close(); // Ferme la connexion CDP, Chrome reste ouvert

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
  } catch (e) {
    if (browser) await browser.close().catch(() => {});
    throw e;
  }
}

async function main() {
  if (SETUP_MODE) {
    await runSetup();
  } else {
    await runNormal();
  }
}

main().catch(e => {
  console.error('FATAL:', e.message);
  console.error(e.stack);
  process.exit(1);
});
