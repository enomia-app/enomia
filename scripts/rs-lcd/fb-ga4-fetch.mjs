/**
 * fb-ga4-fetch.mjs — Module : interroge GA4 Data API pour les stats des commentaires FB
 *
 * Utilise les UTM injectés par fb-utils.mjs (utm_source=facebook, utm_campaign=lcd-veille)
 * pour filtrer le trafic et grouper par utm_content (postId : gX-Y).
 *
 * Property ID GA4 : 538537095 (enomia.app)
 * Scope OAuth requis : https://www.googleapis.com/auth/analytics.readonly
 *
 * Caveat : GA4 n'est déclenché qu'après consentement cookie banner.
 * ~30-50% du trafic non-tracké. Les chiffres montrent la tendance relative,
 * pas les volumes absolus.
 */

import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const GA4_PROPERTY_ID = '538537095';
const GA4_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

function getOAuthClient() {
  const HOME = process.env.HOME;
  const CLIENT_PATH = process.env.GSC_OAUTH_CLIENT || path.join(HOME, '.config/gcloud/enomia-oauth-client.json');
  const TOKEN_PATH = process.env.GSC_OAUTH_TOKEN || path.join(HOME, '.config/gcloud/enomia-gsc-token.json');

  if (!existsSync(CLIENT_PATH) || !existsSync(TOKEN_PATH)) {
    throw new Error(`OAuth files manquants : ${CLIENT_PATH} ou ${TOKEN_PATH}`);
  }

  const client = JSON.parse(readFileSync(CLIENT_PATH, 'utf8'));
  const token = JSON.parse(readFileSync(TOKEN_PATH, 'utf8'));

  const { client_id, client_secret } = client.installed || client.web;
  const oauth2 = new google.auth.OAuth2(client_id, client_secret);
  oauth2.setCredentials(token);

  // Check si le scope analytics est présent dans le token
  const scopes = token.scopes || [];
  if (!scopes.includes(GA4_SCOPE)) {
    throw new Error(`Scope ${GA4_SCOPE} absent du token. Relance scripts/gsc-oauth-bootstrap.mjs.`);
  }

  return oauth2;
}

/**
 * Récupère les stats GA4 des 7 derniers jours, groupées par utm_content,
 * filtrées sur utm_source=facebook et utm_campaign=lcd-veille.
 *
 * Retourne un array de { utmContent, sessions, bounceRate, avgDurationSec, engagedSessions, conversions }
 *
 * Si l'API n'est pas accessible (scope manquant, OAuth raté) : throw.
 */
export async function fetchGa4WeeklyStats({ days = 7 } = {}) {
  const auth = getOAuthClient();
  const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

  const response = await analyticsData.properties.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [
        { name: 'sessionManualAdContent' }, // utm_content
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'engagedSessions' },
        { name: 'conversions' },
      ],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'sessionSource',
                stringFilter: { matchType: 'EXACT', value: 'facebook' },
              },
            },
            {
              filter: {
                fieldName: 'sessionCampaignName',
                stringFilter: { matchType: 'EXACT', value: 'lcd-veille' },
              },
            },
          ],
        },
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 50,
    },
  });

  const rows = response.data.rows || [];
  return rows.map((r) => ({
    utmContent: r.dimensionValues?.[0]?.value || '(non renseigné)',
    sessions: parseInt(r.metricValues?.[0]?.value || '0', 10),
    bounceRate: parseFloat(r.metricValues?.[1]?.value || '0'),
    avgDurationSec: parseFloat(r.metricValues?.[2]?.value || '0'),
    engagedSessions: parseInt(r.metricValues?.[3]?.value || '0', 10),
    conversions: parseFloat(r.metricValues?.[4]?.value || '0'),
  }));
}

/**
 * Récupère le total trafic Facebook (toutes sources confondues, sans filtre campaign)
 * pour comparaison. Utile pour montrer la part lcd-veille vs autre.
 */
export async function fetchGa4FacebookTotal({ days = 7 } = {}) {
  const auth = getOAuthClient();
  const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

  const response = await analyticsData.properties.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      metrics: [{ name: 'sessions' }, { name: 'engagedSessions' }],
      dimensionFilter: {
        filter: {
          fieldName: 'sessionSource',
          stringFilter: { matchType: 'EXACT', value: 'facebook' },
        },
      },
    },
  });

  const r = response.data.rows?.[0];
  if (!r) return { sessions: 0, engagedSessions: 0 };
  return {
    sessions: parseInt(r.metricValues?.[0]?.value || '0', 10),
    engagedSessions: parseInt(r.metricValues?.[1]?.value || '0', 10),
  };
}

// Mode CLI : lance un test rapide en standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      console.log('=== GA4 lcd-veille (7 derniers jours) ===');
      const rows = await fetchGa4WeeklyStats();
      if (rows.length === 0) {
        console.log('(aucune session attribuée à utm_campaign=lcd-veille — normal si pas encore de trafic FB)');
      } else {
        for (const r of rows) {
          console.log(`  ${r.utmContent.padEnd(12)} sessions=${r.sessions} bounceRate=${(r.bounceRate * 100).toFixed(1)}% avgDur=${r.avgDurationSec.toFixed(0)}s engaged=${r.engagedSessions} conv=${r.conversions}`);
        }
      }
      console.log('');
      console.log('=== GA4 Facebook total ===');
      const total = await fetchGa4FacebookTotal();
      console.log(`  sessions=${total.sessions} engagedSessions=${total.engagedSessions}`);
    } catch (e) {
      console.error('Erreur GA4 :', e.message);
      process.exit(1);
    }
  })();
}
