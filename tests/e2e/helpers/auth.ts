import { Page } from '@playwright/test';

const SUPABASE_URL = 'https://pesoidoedtjpihjvrnnc.supabase.co';

/**
 * Calls Supabase's admin API via Node's native fetch (NOT Playwright's request context).
 *
 * Supabase rejects the new `sb_secret_*` keys when requests come from a browser-like
 * context (Playwright's APIRequestContext includes browser-ish headers that trip the
 * server-side "don't use secret keys in a browser" guard). A plain Node fetch with a
 * neutral User-Agent bypasses that check, which is the correct posture since these
 * tests run on a trusted CI runner, not in a real browser.
 */
async function supabaseAdminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'enomia-e2e-tests/1.0 (+node-runner)',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...(init.headers || {}),
    },
  });
}

/**
 * Generates a fresh magic-link via the Supabase admin API and injects the
 * resulting session directly into localStorage so no email round-trip is needed.
 */
export async function loginAsTestUser(
  page: Page,
  email: string,
  prenom: string
): Promise<{ userId: string }> {
  const linkRes = await supabaseAdminFetch('/auth/v1/admin/generate_link', {
    method: 'POST',
    body: JSON.stringify({ type: 'magiclink', email, data: { prenom } }),
  });
  if (!linkRes.ok) throw new Error(`generate_link failed: ${await linkRes.text()}`);
  const { action_link } = await linkRes.json() as { action_link: string };

  // Follow the magic-link redirect to get the access_token in the URL hash
  await page.goto(action_link);
  await page.waitForURL(/access_token=/, { timeout: 15_000 });

  // Install the session into localStorage the same way the app does
  const userId = await page.evaluate(() => {
    const hash = window.location.hash.slice(1);
    const params = Object.fromEntries(new URLSearchParams(hash));
    const payload = JSON.parse(atob(params.access_token.split('.')[1]));
    const session = {
      access_token: params.access_token,
      token_type: params.token_type,
      expires_in: parseInt(params.expires_in),
      expires_at: parseInt(params.expires_at),
      refresh_token: params.refresh_token,
      user: {
        id: payload.sub, aud: payload.aud, role: payload.role, email: payload.email,
        email_confirmed_at: new Date().toISOString(), phone: '',
        app_metadata: payload.app_metadata, user_metadata: payload.user_metadata, identities: [],
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      },
    };
    localStorage.setItem('sb-pesoidoedtjpihjvrnnc-auth-token', JSON.stringify(session));
    return payload.sub;
  });

  return { userId };
}

export async function deleteTestUser(userId: string): Promise<void> {
  if (!userId) return;
  await supabaseAdminFetch(`/auth/v1/admin/users/${userId}`, { method: 'DELETE' }).catch(() => {
    /* best effort */
  });
}
