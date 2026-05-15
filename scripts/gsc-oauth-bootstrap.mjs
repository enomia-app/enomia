#!/usr/bin/env node
/**
 * Bootstrap OAuth pour l'API GSC.
 *
 * À lancer UNE FOIS pour obtenir un refresh_token long-lived stocké localement.
 * Ensuite les scripts gsc-fetch-* utilisent ce token automatiquement.
 *
 * Flow : Desktop app OAuth2 loopback (port local éphémère).
 *
 * Usage : node scripts/gsc-oauth-bootstrap.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
try { process.loadEnvFile(path.join(ROOT, '.env')); } catch {}

const HOME = process.env.HOME;
const CLIENT_PATH = process.env.GSC_OAUTH_CLIENT || path.join(HOME, '.config/gcloud/enomia-oauth-client.json');
const TOKEN_PATH = process.env.GSC_OAUTH_TOKEN || path.join(HOME, '.config/gcloud/enomia-gsc-token.json');
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

async function main() {
  const client = JSON.parse(fs.readFileSync(CLIENT_PATH, 'utf8'));
  const { client_id, client_secret } = client.installed || client.web;

  const server = http.createServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const redirectUri = `http://127.0.0.1:${port}`;

  const oauth2 = new google.auth.OAuth2(client_id, client_secret, redirectUri);
  const state = crypto.randomBytes(16).toString('hex');
  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state,
  });

  console.log('🔐 Ouverture du navigateur pour autorisation...');
  console.log('   Connecte-toi avec marc@enomia.app et accepte.');
  console.log('   Si rien ne s\'ouvre, copie cette URL :');
  console.log('   ' + authUrl);
  exec(`open "${authUrl}"`);

  const code = await new Promise((resolve, reject) => {
    server.on('request', (req, res) => {
      try {
        const url = new URL(req.url, redirectUri);
        if (url.searchParams.get('state') !== state) {
          res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('State mismatch.');
          reject(new Error('State mismatch'));
          return;
        }
        const err = url.searchParams.get('error');
        if (err) {
          res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Erreur OAuth : ' + err);
          reject(new Error(err));
          return;
        }
        const c = url.searchParams.get('code');
        if (!c) {
          res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Code manquant.');
          reject(new Error('No code'));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<html><body style="font-family:system-ui;padding:40px"><h2>✅ Auth OK</h2><p>Tu peux fermer cet onglet.</p></body></html>');
        resolve(c);
      } catch (e) {
        reject(e);
      }
    });
  });

  server.close();

  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    console.error('⚠️  Pas de refresh_token. Va sur https://myaccount.google.com/permissions, révoque "Enomia GSC Indexation", puis relance.');
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
  fs.writeFileSync(
    TOKEN_PATH,
    JSON.stringify(
      { refresh_token: tokens.refresh_token, client_id, client_secret, obtained_at: new Date().toISOString() },
      null,
      2,
    ),
    { mode: 0o600 },
  );

  console.log(`✅ Refresh token sauvegardé : ${TOKEN_PATH}`);
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
