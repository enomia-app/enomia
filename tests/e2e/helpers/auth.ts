import { Page, APIRequestContext } from '@playwright/test';

const SUPABASE_URL = 'https://pesoidoedtjpihjvrnnc.supabase.co';

/**
 * Generates a fresh magic-link via the Supabase admin API and injects the
 * resulting session directly into localStorage so no email round-trip is needed.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in the environment.
 */
export async function loginAsTestUser(
  page: Page,
  request: APIRequestContext,
  email: string,
  prenom: string
): Promise<{ userId: string }> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

  const linkRes = await request.post(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    data: { type: 'magiclink', email, data: { prenom } },
  });
  if (!linkRes.ok()) throw new Error(`generate_link failed: ${await linkRes.text()}`);
  const { action_link } = await linkRes.json();

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

export async function deleteTestUser(request: APIRequestContext, userId: string): Promise<void> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || !userId) return;
  await request.delete(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  }).catch(() => { /* best effort */ });
}
