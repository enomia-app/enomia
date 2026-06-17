import { test, expect, request } from '@playwright/test';

/**
 * Smoke-test « toutes les pages » — filet de sécurité couvrant l'intégralité du
 * site sans avoir à cliquer chaque page à la main.
 *
 * Source des URLs : le sitemap (donc suit automatiquement les nouvelles pages,
 * villes, articles… dès qu'elles y sont).
 *
 * Pour chaque page, on échoue si :
 *   - le statut HTTP de la navigation est >= 400 (page cassée / 404 / 500)
 *   - une exception JS non rattrapée est levée (`pageerror` = le JS plante)
 *   - une ressource SAME-ORIGIN (enomia.app) renvoie un statut >= 400 (asset 404/500)
 *   - une ressource SAME-ORIGIN échoue au niveau réseau (DNS, connexion refusée…)
 *
 * On IGNORE volontairement `net::ERR_ABORTED` / `ERR_BLOCKED` : ce sont des
 * requêtes annulées (images lazy-loadées dont le chargement est interrompu quand
 * on quitte la page) — pas une vraie casse. Le bruit tiers (GA, etc.) est ignoré.
 *
 * Cible : `baseURL` (défaut https://www.enomia.app, surchargé par E2E_BASE_URL).
 *   - en local avant déploiement : E2E_BASE_URL=http://localhost:PORT
 *   - en surveillance hebdo (watchdog) : la prod par défaut.
 */

// Domaines tiers dont on ignore les échecs réseau (ne reflètent pas une casse du site).
const THIRD_PARTY_IGNORE = [
  'google-analytics.com',
  'googletagmanager.com',
  'google.com',
  'doubleclick.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

function isSameOrigin(url: string, baseURL: string): boolean {
  try {
    return new URL(url).host === new URL(baseURL).host;
  } catch {
    return false;
  }
}

test.describe('Smoke — toutes les pages du sitemap', () => {
  // Le crawl complet peut durer quelques minutes selon le nombre de pages.
  test.setTimeout(15 * 60 * 1000);

  test('chaque page répond 200, sans crash JS ni asset same-origin cassé', async ({ page, baseURL }) => {
    expect(baseURL, 'baseURL doit être défini (playwright.config / E2E_BASE_URL)').toBeTruthy();
    const base = baseURL!;

    // 1) Récupérer la liste des URLs depuis le sitemap.
    const ctx = await request.newContext();
    const smRes = await ctx.get(`${base}/sitemap.xml`);
    expect(smRes.ok(), `sitemap.xml introuvable (${smRes.status()})`).toBeTruthy();
    const xml = await smRes.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    expect(urls.length, 'le sitemap ne contient aucune URL').toBeGreaterThan(0);
    await ctx.dispose();

    console.log(`\n[smoke] ${urls.length} pages à vérifier sur ${base}\n`);

    // 2) Visiter chaque page et collecter les problèmes.
    const failures: string[] = [];
    let pageErrors: string[] = [];
    let badAssets: string[] = [];

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });
    // Vraie casse d'asset = réponse same-origin avec un statut >= 400 (404/500).
    page.on('response', (resp) => {
      const url = resp.url();
      if (resp.status() >= 400 && isSameOrigin(url, base) && !THIRD_PARTY_IGNORE.some((d) => url.includes(d))) {
        badAssets.push(`${url} → ${resp.status()}`);
      }
    });
    // Échec réseau réel (DNS, connexion) — on exclut les annulations (lazy-load).
    page.on('requestfailed', (req) => {
      const url = req.url();
      const err = req.failure()?.errorText ?? 'failed';
      if (err.includes('ERR_ABORTED') || err.includes('ERR_BLOCKED')) return;
      if (isSameOrigin(url, base) && !THIRD_PARTY_IGNORE.some((d) => url.includes(d))) {
        badAssets.push(`${req.resourceType()} ${url} (${err})`);
      }
    });

    for (const url of urls) {
      pageErrors = [];
      badAssets = [];
      let status = 0;
      try {
        const resp = await page.goto(url, { waitUntil: 'load', timeout: 30_000 });
        status = resp?.status() ?? 0;
      } catch (e) {
        failures.push(`${url} → navigation impossible (${(e as Error).message})`);
        continue;
      }

      const problems: string[] = [];
      if (status >= 400 || status === 0) problems.push(`statut ${status}`);
      if (pageErrors.length) problems.push(`JS: ${pageErrors.join(' | ')}`);
      if (badAssets.length) problems.push(`asset(s): ${badAssets.join(' ; ')}`);

      if (problems.length) {
        failures.push(`${url} → ${problems.join(' ; ')}`);
        console.log(`  ✗ ${url} — ${problems.join(' ; ')}`);
      }
    }

    // 3) Rapport final lisible (toutes les pages cassées d'un coup).
    if (failures.length) {
      console.log(`\n[smoke] ${failures.length}/${urls.length} page(s) en échec :\n${failures.map((f) => '  - ' + f).join('\n')}\n`);
    } else {
      console.log(`\n[smoke] ✓ ${urls.length} pages OK\n`);
    }

    expect(failures, `Pages en échec :\n${failures.join('\n')}`).toEqual([]);
  });
});
