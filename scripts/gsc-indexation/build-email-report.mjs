/**
 * build-email-report.mjs — construit un récap propre pour l'email quotidien.
 *
 * Sortie : markdown propre sur stdout, à envoyer via send-report.sh.
 *
 * Lit :
 *   - .claude/gsc-tracking/index-status.json
 *   - .claude/gsc-tracking/urls.json
 *   - scripts/gsc-indexation/candidates-today.json
 *   - scripts/gsc-indexation/logs/YYYY-MM-DD.json (résultats du run)
 *   - + volumes SEMrush pour le "top N pas encore soumises"
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const TODAY = new Date().toISOString().slice(0, 10);

const SKIP_STATES = [
  'Page with redirect',
  "Excluded by 'noindex' tag",
  'Soft 404',
  'Not found (404)',
  'Duplicate without user-selected canonical',
];

function readJson(path, fallback = null) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; }
}

function loadVolumes() {
  const cities = readJson(join(ROOT, 'scripts/city-backlog.json'), []);
  const extra = readJson(join(ROOT, 'scripts/city-backlog-extra.json'), []);
  const tools = readJson(join(ROOT, 'scripts/tools-volumes.json'), {});
  const blog = readJson(join(ROOT, 'scripts/blog-volumes-en-ligne.json'), {});
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

function isRequestedRecently(track, days = 14) {
  if (!track?.last_requested) return false;
  const ageDays = (Date.now() - new Date(track.last_requested).getTime()) / 86400000;
  if (ageDays >= days) return false;
  const reason = (track.reason || '').toLowerCase();
  return reason.includes('chrome mcp') || reason.includes('url inspection') || reason.includes('playwright');
}

function main() {
  const indexStatus = readJson(join(ROOT, '.claude/gsc-tracking/index-status.json'));
  const tracking = readJson(join(ROOT, '.claude/gsc-tracking/urls.json'));
  const candidates = readJson(join(__dirname, 'candidates-today.json'), { candidates: [] });
  const runLog = readJson(join(__dirname, 'logs', `${TODAY}.json`), { results: [] });
  const volumes = loadVolumes();

  if (!indexStatus || !tracking) {
    console.log('Pas de data GSC disponible pour le récap.');
    process.exit(0);
  }

  // Compte par état
  const all = Object.entries(indexStatus.byUrl);
  const total = all.length;
  const indexed = all.filter(([, d]) => d.verdict === 'PASS').length;
  const skip = all.filter(([, d]) => SKIP_STATES.includes(d.coverageState)).length;
  const pending = total - indexed - skip;

  // Soumises aujourd'hui
  const submittedToday = runLog.results.filter(r => r.status === 'requested');

  // Top 10 prioritaires PAS encore soumises (par volume)
  const topNotSubmitted = all
    .filter(([, d]) => d.verdict !== 'PASS')
    .filter(([, d]) => !SKIP_STATES.includes(d.coverageState))
    .filter(([url]) => {
      const t = tracking.urls[url];
      if (!t) return true;
      if (t.status === 'indexed') return false;
      if (t.status === 'failed') return false;
      return !isRequestedRecently(t, 14);
    })
    .map(([url, d]) => ({ url, vol: getVolume(url, volumes), coverage: d.coverageState }))
    .sort((a, b) => b.vol - a.vol)
    .slice(0, 10);

  // Soumises mais pas encore indexées (en attente Google) — last_requested dans les 14j ET status === requested
  const inWait = Object.entries(tracking.urls)
    .filter(([, t]) => t.status === 'requested' && isRequestedRecently(t, 14))
    .map(([url, t]) => ({ url, when: t.last_requested }))
    .sort((a, b) => b.when.localeCompare(a.when));

  const now = new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

  let out = '';
  out += `Run du ${now} (Mac mini, Playwright autonome)\n\n`;
  out += `📊 État du site sur GSC\n`;
  out += `- Total pages : ${total}\n`;
  out += `- ✅ Indexées : ${indexed}\n`;
  out += `- ⏳ En attente d'indexation : ${pending}\n`;
  out += `- ❌ Skip (404, redirect, noindex, etc.) : ${skip}\n\n`;

  out += `🚀 Soumises aujourd'hui (${submittedToday.length}) :\n`;
  if (submittedToday.length === 0) {
    out += `(aucune — pool épuisé ou run échoué, voir log)\n`;
  } else {
    submittedToday.forEach((r, i) => {
      out += `${i + 1}. ${r.url}  (vol: ${r.vol || 0})\n`;
    });
  }
  out += `\n`;

  out += `⏳ Top 10 URLs prioritaires PAS ENCORE soumises (par volume SEMrush) :\n`;
  if (topNotSubmitted.length === 0) {
    out += `(aucune — toutes les URLs prioritaires sont en attente Google)\n`;
  } else {
    topNotSubmitted.forEach((c, i) => {
      out += `${i + 1}. ${c.url}  (vol: ${c.vol}) — coverage: ${c.coverage}\n`;
    });
  }
  out += `\n`;

  out += `📅 Soumises mais pas encore indexées (en attente Google, demande dans les 14j) :\n`;
  if (inWait.length === 0) {
    out += `(aucune)\n`;
  } else {
    inWait.slice(0, 20).forEach(w => {
      out += `- ${w.url}  (demandée ${w.when})\n`;
    });
    if (inWait.length > 20) out += `... (+${inWait.length - 20} autres)\n`;
  }
  out += `\n`;

  // Échecs du jour s'il y en a
  const failed = runLog.results.filter(r => ['failed', 'unknown', 'auth_lost'].includes(r.status));
  if (failed.length > 0) {
    out += `⚠️ Échecs du jour (${failed.length}) :\n`;
    failed.forEach(r => {
      out += `- ${r.url} — ${r.reason}\n`;
    });
    out += `\n`;
  }

  out += `Log complet : scripts/gsc-indexation/logs/run-${TODAY}.log\n`;

  process.stdout.write(out);
}

main();
