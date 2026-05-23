/**
 * submit-via-chrome.mjs — Soumet les top N URLs via URL Inspection Tool GSC.
 *
 * Utilise Playwright + un profil Chrome dédié (user-data-dir persisté) où Marc
 * s'est logué manuellement la première fois. Plus de cookies JSON volatiles —
 * Google considère le profil comme un "vrai navigateur" et ne révoque pas la
 * session.
 *
 * SETUP (une fois sur Mac mini, via VNC pour avoir l'écran) :
 *   node scripts/gsc-indexation/submit-via-chrome.mjs --setup
 *   → Chrome s'ouvre. Logge-toi avec un compte Owner de la propriété
 *     (marchenut@gmail.com ou marc@enomia.app), navigue jusqu'au dashboard
 *     GSC enomia.app, puis ferme la fenêtre. Le profil est sauvé.
 *
 * RUNS QUOTIDIENS (cron) :
 *   node scripts/gsc-indexation/compute-candidates.mjs
 *   node scripts/gsc-indexation/submit-via-chrome.mjs
 *
 * Exit codes :
 *   0 : tout OK
 *   1 : erreur fatale
 *   2 : fichiers manquants (candidates)
 *   3 : pas loggué (lancer en --setup)
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
const CANDIDATES_FILE = join(__dirname, 'candidates-today.json');
const TRACKING_FILE = join(ROOT, '.claude/gsc-tracking/urls.json');
const PROPERTY = 'sc-domain:enomia.app';
const GSC_INSPECT_BASE = `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(PROPERTY)}`;
const GSC_DASHBOARD = `https://search.google.com/search-console?resource_id=${encodeURIComponent(PROPERTY)}`;
const TODAY = new Date().toISOString().slice(0, 10);
const SETUP_MODE = process.argv.includes('--setup');

async function isLoggedIn(page) {
  // Test sur une page qui EXIGE auth : le dashboard de la propriété.
  // Si pas loggué, Google redirige vers accounts.google.com.
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

  // Détection redirection vers login (cookies expirés au milieu du run)
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
    } catch { /* try next selector */ }
  }

  if (!clicked) {
    // Screenshot pour debug futur
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
    return { status: 'requested', reason: 'Demandée via Playwright (URL Inspection Tool)' };
  }

  return { status: 'unknown', reason: 'État indéterminé après click' };
}

async function runSetup() {
  console.log('🛠️  Mode setup : ouvre Chrome avec profil persistant.\n');
  console.log('Logge-toi avec un compte Owner de la propriété GSC enomia.app');
  console.log('(marchenut@gmail.com ou marc@enomia.app), confirme que tu vois le');
  console.log('dashboard, puis FERME LA FENÊTRE Chrome quand c\'est fait.\n');

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    channel: 'chrome', // Vrai Chrome (pas Chromium) — Google bloque le login dans Chromium
    viewport: { width: 1400, height: 900 },
    locale: 'fr-FR',
  });
  const page = await context.newPage();
  await page.goto(GSC_DASHBOARD);

  // Attendre que l'utilisateur ferme manuellement la fenêtre
  await new Promise(resolve => {
    context.on('close', resolve);
  });

  console.log('✓ Fenêtre fermée. Profil sauvegardé dans :', USER_DATA_DIR);
  console.log('Tu peux maintenant lancer la routine normale.');
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

  console.log(`📨 Soumission de ${candidatesData.candidates.length} URL(s) via Playwright (profil dédié)...\n`);

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: true,
    channel: 'chrome', // Vrai Chrome (pas Chromium) — pour matcher le profil créé en --setup
    viewport: { width: 1400, height: 900 },
    locale: 'fr-FR',
  });
  const page = await context.newPage();

  if (!(await isLoggedIn(page))) {
    console.error('ERREUR: Profil pas loggué à GSC.');
    console.error('Lance d\'abord : node scripts/gsc-indexation/submit-via-chrome.mjs --setup');
    await context.close();
    process.exit(3);
  }
  console.log('✓ Connecté à GSC (profil dédié)\n');

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
      t.reason = 'Demandée via Playwright (URL Inspection Tool)';
      tracking.urls[c.url] = t;
    } else if (result.status === 'indexed') {
      t.status = 'indexed';
      t.reason = 'Confirmée indexée via URL Inspection';
      tracking.urls[c.url] = t;
    } else if (result.status === 'failed') {
      // Ne PAS marquer status='failed' (sinon l'URL est skip définitivement
      // par compute-candidates). Garder en 'pending' pour ré-essayer demain.
      t.status = 'pending';
      t.last_attempt = TODAY;
      t.last_attempt_reason = result.reason;
      tracking.urls[c.url] = t;
    }

    if (result.status === 'quota_exceeded' || result.status === 'captcha' || result.status === 'auth_lost') {
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
