import fs from 'node:fs';
import path from 'node:path';
import { google } from 'googleapis';

export function getGscAuthClient() {
  const tokenPath = process.env.GSC_OAUTH_TOKEN || path.join(process.env.HOME, '.config/gcloud/enomia-gsc-token.json');
  if (!fs.existsSync(tokenPath)) {
    throw new Error(`Token OAuth introuvable (${tokenPath}). Lance d'abord : node scripts/gsc-oauth-bootstrap.mjs`);
  }
  const { client_id, client_secret, refresh_token } = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const oauth2 = new google.auth.OAuth2(client_id, client_secret);
  oauth2.setCredentials({ refresh_token });
  return oauth2;
}
