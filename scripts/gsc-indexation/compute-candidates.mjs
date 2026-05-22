/**
 * compute-candidates.mjs — Calcule les top N URLs à soumettre via URL Inspection GSC.
 *
 * Lit :
 *   - .claude/gsc-tracking/index-status.json  (statut indexation par URL)
 *   - .claude/gsc-tracking/urls.json          (tracking historique demandes)
 *   - scripts/city-backlog.json + city-backlog-extra.json (volumes conciergerie)
 *   - scripts/blog-volumes-en-ligne.json     (volumes blog)
 *   - scripts/tools-volumes.json             (volumes pages outils)
 *
 * Écrit :
 *   - scripts/gsc-indexation/candidates-today.json
 *
 * Logique :
 *   - Filtre URLs non-PASS (donc pas déjà indexées)
 *   - Skip coverage states bloquants (redirect, noindex, 404, canonical, soft 404)
 *   - Skip URLs déjà demandées < 14 jours (anti-doublon)
 *   - Skip URLs marquées indexed ou failed
 *   - Trie par volume SEMrush desc, prend top `daily_quota` (défaut 10)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const SKIP_STATES = [
  'Page with redirect',
  "Excluded by 'noindex' tag",
  'Soft 404',
  'Not found (404)',
  'Duplicate without user-selected canonical',
];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadVolumes() {
  const cities = readJson(join(ROOT, 'scripts/city-backlog.json'));
  let extra = [];
  const extraPath = join(ROOT, 'scripts/city-backlog-extra.json');
  if (existsSync(extraPath)) extra = readJson(extraPath);
  const tools = readJson(join(ROOT, 'scripts/tools-volumes.json'));
  const blog = readJson(join(ROOT, 'scripts/blog-volumes-en-ligne.json'));
  return { cities: [...cities, ...extra], tools, blog };
}

function getVolume(url, { cities, tools, blog }) {
  const city = cities.find(c => `https://www.enomia.app${c.newUrl}` === url);
  if (city) return city.vol || 0;

  const blogSlug = url.match(/\/blog\/([^/?#]+)/)?.[1];
  if (blogSlug && blog[blogSlug]) return blog[blogSlug].vol || 0;

  if (tools[url]) return tools[url].vol || 0;
  return 0;
}

// Une URL est "vraiment soumise récemment" SEULEMENT si la dernière demande
// est passée par Chrome MCP / URL Inspection Tool / Playwright. Les demandes
// faites uniquement via l'Indexing API ne comptent pas (Google les ignore
// pour le contenu web standard). Voir project_gsc_enomia.md.
function isRequestedRecently(track, days = 14) {
  if (!track?.last_requested) return false;
  const ageDays = (Date.now() - new Date(track.last_requested).getTime()) / 86400000;
  if (ageDays >= days) return false;

  const reason = (track.reason || '').toLowerCase();
  const isRealSubmission =
    reason.includes('chrome mcp') ||
    reason.includes('url inspection') ||
    reason.includes('playwright');

  return isRealSubmission;
}

function main() {
  const indexStatus = readJson(join(ROOT, '.claude/gsc-tracking/index-status.json'));
  const tracking = readJson(join(ROOT, '.claude/gsc-tracking/urls.json'));
  const volumes = loadVolumes();
  const quota = tracking.daily_quota || 10;

  const candidates = Object.entries(indexStatus.byUrl)
    .filter(([, d]) => d.verdict !== 'PASS')
    .filter(([, d]) => !SKIP_STATES.includes(d.coverageState))
    .filter(([url]) => {
      const t = tracking.urls[url];
      if (!t) return true;
      if (t.status === 'indexed') return false;
      if (t.status === 'failed') return false;
      return !isRequestedRecently(t, 14);
    })
    .map(([url, d]) => ({
      url,
      coverageState: d.coverageState,
      vol: getVolume(url, volumes),
    }))
    .sort((a, b) => b.vol - a.vol)
    .slice(0, quota);

  const out = {
    computedAt: new Date().toISOString(),
    quota,
    candidates,
  };

  const outFile = join(__dirname, 'candidates-today.json');
  writeFileSync(outFile, JSON.stringify(out, null, 2));

  console.log(`Top ${candidates.length} candidates (quota=${quota}) → ${outFile}`);
  candidates.forEach((c, i) => {
    console.log(`  ${String(i + 1).padStart(2)}. ${c.url}  [vol=${c.vol}, ${c.coverageState}]`);
  });
}

main();
