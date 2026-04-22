import { test, expect } from '@playwright/test';
import { loginAsTestUser, deleteTestUser } from './helpers/auth';

// A unique suffix per test run so concurrent runs and leftovers never collide.
const STAMP = `${Date.now().toString(36)}`;
const EMAIL = `marchenut+e2e-${STAMP}@gmail.com`;
const PRENOM = `E2E ${STAMP}`;

let userId = '';

test.afterAll(async () => {
  await deleteTestUser(userId);
});

test.describe('Enomia outils — parcours end-to-end', () => {
  test('1. Simulateur — save + share', async ({ page }) => {
    await page.goto('/simulateur-lcd');
    const login = await loginAsTestUser(page, EMAIL, PRENOM);
    userId = login.userId;

    await page.goto('/simulateur-lcd');
    await expect(page.locator(`text=${EMAIL}`)).toBeVisible({ timeout: 10_000 });

    // Start a new simulation from the default values, save it
    await page.getByRole('button', { name: /Nouvelle simulation/i }).click();
    await page.evaluate(() => {
      const input = document.getElementById('sim-name-input') as HTMLInputElement;
      input.value = 'E2E Test Sim';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const saveResp = page.waitForResponse(r => r.url().includes('/api/simulations') && r.request().method() === 'POST');
    await page.evaluate(() => (window as any).saveSimulation());
    const resp = await saveResp;
    expect(resp.status()).toBe(200);

    // Dashboard shows the saved sim
    await page.getByRole('button', { name: /Mes simulations/i }).click();
    await expect(page.locator('text=E2E Test Sim')).toBeVisible();
  });

  test('2. Contrat — bailleur + bien + contrat end-to-end', async ({ page, request }) => {
    await page.goto('/contrat-lcd-dashboard');
    await loginAsTestUser(page, EMAIL, PRENOM);
    await page.goto('/contrat-lcd-dashboard');

    const token = await page.evaluate(() => {
      const k = Object.keys(localStorage).find(x => x.startsWith('sb-') && x.endsWith('-auth-token'))!;
      return JSON.parse(localStorage.getItem(k)!).access_token;
    });

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const apiUrl = `${new URL(page.url()).origin}/api/contrats`;

    const bailleur = await request.post(apiUrl, { headers, data: { action: 'bailleur-upsert', bailleur: {
      type: 'particulier', prenom: 'E2E', nom: 'User', email: EMAIL, adresse: '1 rue Test', lang_defaut: 'fr',
    } } });
    expect(bailleur.ok()).toBeTruthy();

    const bien = await request.post(apiUrl, { headers, data: { action: 'bien-upsert', bien: {
      nom_interne: 'E2E Studio', type_bien: 'studio', adresse: '1 rue Test', ville: 'Nantes',
      surface: 25, nb_couchages: 2, capacite_max: 2, caution_defaut: 500,
    } } });
    expect(bien.ok()).toBeTruthy();
    const bienId = (await bien.json()).bien.id;

    const contrat = await request.post(apiUrl, { headers, data: { action: 'contrat-upsert', contrat: {
      bien_id: bienId, locataire_nom: 'TestLocataire', locataire_prenom: 'Jean',
      locataire_email: 'locataire@test.fr', date_arrivee: '2026-07-01', date_depart: '2026-07-08',
      nb_adultes: 2, nb_enfants: 0, prix_total: 490, acompte_montant: 147, caution: 500,
    } } });
    expect(contrat.ok()).toBeTruthy();

    await page.reload();
    await expect(page.locator('text=TestLocataire')).toBeVisible();
  });

  test('3. Facture — create via API, renders in dashboard', async ({ page, request }) => {
    await page.goto('/facturation-lcd');
    await loginAsTestUser(page, EMAIL, PRENOM);
    await page.goto('/facturation-lcd');

    const token = await page.evaluate(() => {
      const k = Object.keys(localStorage).find(x => x.startsWith('sb-') && x.endsWith('-auth-token'))!;
      return JSON.parse(localStorage.getItem(k)!).access_token;
    });

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const apiUrl = `${new URL(page.url()).origin}/api/invoices`;

    await request.post(apiUrl, { headers, data: { action: 'settings-save', settings: {
      nom: 'E2E User', adresse: '1 rue Test', prefix: '2026-', next_num: 1,
    } } });

    const bien = await request.post(apiUrl, { headers, data: { action: 'biens-save', bien: {
      nom: 'E2E Studio', adresse: '1 rue Test', ville: 'Nantes', categorie: 'studio', capacite: 2,
    } } });
    const bienId = (await bien.json()).bien.id;

    const inv = await request.post(apiUrl, { headers, data: { action: 'invoices-save', invoice: {
      bien_id: bienId, statut: 'Payée', total_ttc: 504,
      data: {
        id: '(BROUILLON)', client: 'Jean Dupont', email: 'jean@test.fr', clientAddr: '',
        bien: 'E2E Studio — Nantes', bienId,
        arrivee: '2026-07-01', depart: '2026-07-08',
        prixNuit: 70, menage: 0, caution: 500, extra: '', extraMontant: 0,
        personnes: 2, taxeSejour: 14, paiement: 'Virement bancaire', statut: 'Payée',
        loueur: 'E2E User', loueurAddr: '1 rue Test', siret: '',
      },
    } } });
    expect(inv.ok()).toBeTruthy();
    const invoice = (await inv.json()).invoice;
    expect(invoice.invoice_number).toMatch(/^2026-\d{3}$/);
    expect(Number(invoice.total_ttc)).toBe(504);

    await page.reload();
    // Bug 3 fix: pill label must have the accent
    await expect(page.locator('text=Payée')).toBeVisible();
  });

  test('4. Cross-user isolation — test2 cannot see test1 data', async ({ page, request }) => {
    const altEmail = `marchenut+e2e2-${STAMP}@gmail.com`;
    const { userId: altId } = await loginAsTestUser(page, altEmail, 'Alt User');

    const token = await page.evaluate(() => {
      const k = Object.keys(localStorage).find(x => x.startsWith('sb-') && x.endsWith('-auth-token'))!;
      return JSON.parse(localStorage.getItem(k)!).access_token;
    });

    const sims = await request.post(`${new URL(page.url()).origin}/api/simulations`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      data: { action: 'fetch' },
    });
    expect(sims.ok()).toBeTruthy();
    // The new user should see no simulations (empty or only their own)
    const { simulations } = await sims.json();
    expect(Array.isArray(simulations)).toBe(true);
    for (const s of simulations) {
      expect(s.name).not.toBe('E2E Test Sim'); // test1's sim from test #1
    }

    await deleteTestUser(altId);
  });
});
