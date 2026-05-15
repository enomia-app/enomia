#!/usr/bin/env node
/**
 * Soumet une ou plusieurs URLs à l'API Google Indexing (sans Chrome MCP).
 *
 * Quota officiel : 200 URLs/jour par projet GCP.
 * Note : l'API est officiellement pour JobPosting / BroadcastEvent, mais
 * fonctionne en pratique pour tout type de contenu. Google peut throttler.
 *
 * Usage :
 *   node scripts/gsc-indexing-submit.mjs <url1> [<url2>...]
 *   echo -e "url1\nurl2" | node scripts/gsc-indexing-submit.mjs
 *
 * Pré-requis : avoir lancé `node scripts/gsc-oauth-bootstrap.mjs` avec le scope
 * `https://www.googleapis.com/auth/indexing` (ajouté en plus de webmasters.readonly).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getGscAuthClient } from './lib/gsc-auth.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
try { process.loadEnvFile(path.join(ROOT, '.env')); } catch {}

const INDEXING_API = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

async function readUrlsFromStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => {
      resolve(data.split('\n').map(s => s.trim()).filter(Boolean));
    });
  });
}

async function getAccessToken() {
  const auth = getGscAuthClient();
  const { token } = await auth.getAccessToken();
  if (!token) throw new Error('Pas de access_token obtenu (refresh_token expiré ?)');
  return token;
}

async function submitUrl(accessToken, url) {
  const res = await fetch(INDEXING_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, type: 'URL_UPDATED' }),
  });

  const body = await res.json().catch(() => ({}));

  return {
    url,
    status: res.status,
    ok: res.ok,
    body,
  };
}

async function main() {
  let urls = process.argv.slice(2);
  if (urls.length === 0) {
    urls = await readUrlsFromStdin();
  }
  if (urls.length === 0) {
    console.error('Usage: node scripts/gsc-indexing-submit.mjs <url1> [<url2>...]');
    console.error('   or: echo -e "url1\\nurl2" | node scripts/gsc-indexing-submit.mjs');
    process.exit(1);
  }

  console.log(`🔐 Auth OAuth (scope indexing)...`);
  const accessToken = await getAccessToken();

  console.log(`📨 Soumission de ${urls.length} URL(s) à l'Indexing API...\n`);

  const results = [];
  for (const url of urls) {
    const result = await submitUrl(accessToken, url);
    results.push(result);

    if (result.ok) {
      const notifyTime = result.body?.urlNotificationMetadata?.latestUpdate?.notifyTime || '';
      console.log(`✅ ${url}  (HTTP ${result.status}, notified ${notifyTime})`);
    } else {
      const msg = result.body?.error?.message || JSON.stringify(result.body);
      console.log(`❌ ${url}  (HTTP ${result.status}) — ${msg}`);
    }

    // Petit délai entre requêtes pour éviter rate-limit
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n📊 Bilan : ${results.filter(r => r.ok).length}/${results.length} soumissions réussies`);
  process.exit(results.every(r => r.ok) ? 0 : 2);
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
