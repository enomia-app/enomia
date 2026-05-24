#!/usr/bin/env node
/**
 * fb-weekly-recap.mjs — Récap hebdo des commentaires FB postés
 *
 * Cron : vendredi 17h via launchd (com.enomia.fb-weekly-recap.plist)
 *
 * Sources :
 *   - data/rs-lcd/fb-archive.json (tous les commentaires postés, append-only)
 *
 * Métriques (phase 1, locales) :
 *   - Volume : nombre de commentaires postés cette semaine + comparaison S-1
 *   - Liens Enomia : combien, lesquels (URL + utm_content)
 *   - Répartition par groupe FB
 *
 * Métriques (phase 2, GA4) : sessions, bounce rate, engagement par utm_content
 *   → activé quand getGa4Stats() retourne des données (cf fb-ga4-fetch.mjs).
 *
 * Envoie le rapport par email via send-report.sh.
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';
import { fetchGa4WeeklyStats, fetchGa4FacebookTotal } from './fb-ga4-fetch.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv(path.join(ROOT, '.env'));

const ARCHIVE_FILE = join(ROOT, 'data/rs-lcd/fb-archive.json');

const GROUPS_LABEL = {
  g1: 'Airbnb Propriétaires France',
  g2: 'Airbnb Entraide pour Hôte',
  g3: 'Le Cercle de la LCD',
  g4: 'Entraide Airbnb & Booking',
  g5: 'Groupe LCD 5',
  g6: 'Groupe LCD 6',
  g7: 'Location directe',
  g8: 'Groupe LCD 8',
};

function loadArchive() {
  if (!existsSync(ARCHIVE_FILE)) return [];
  try { return JSON.parse(readFileSync(ARCHIVE_FILE, 'utf8')); } catch { return []; }
}

function withinWindow(entry, startMs, endMs) {
  const t = new Date(entry.postedAt).getTime();
  return t >= startMs && t < endMs;
}

/**
 * Extrait toutes les URLs enomia.app du texte avec leurs paramètres UTM.
 * Retourne [{ rawUrl, basePath, utmContent }]
 */
function extractEnomiaLinks(text) {
  const links = [];
  const re = /https?:\/\/(?:www\.)?enomia\.app\/([^\s)\]>,;]*)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const rawUrl = m[0];
    const pathAndQuery = m[1] || '';
    const [basePath, query] = pathAndQuery.split('?');
    let utmContent = null;
    if (query) {
      const params = new URLSearchParams(query);
      utmContent = params.get('utm_content');
    }
    links.push({ rawUrl, basePath: '/' + basePath, utmContent });
  }
  return links;
}

function computeStats(entries) {
  const total = entries.length;
  const linkEntries = entries.filter(e => /enomia\.app/i.test(e.commentText || ''));

  // Comptage par lien (basePath)
  const linkCounts = {};
  for (const e of linkEntries) {
    for (const l of extractEnomiaLinks(e.commentText || '')) {
      const key = l.basePath;
      if (!linkCounts[key]) linkCounts[key] = { count: 0, utmContents: new Set() };
      linkCounts[key].count++;
      if (l.utmContent) linkCounts[key].utmContents.add(l.utmContent);
    }
  }

  // Comptage par groupe FB (postId = "gX.Y" → groupId = "gX")
  const groupCounts = {};
  for (const e of entries) {
    const groupId = (e.postId || '').split('.')[0];
    if (!groupId) continue;
    groupCounts[groupId] = (groupCounts[groupId] || 0) + 1;
  }

  return { total, withLink: linkEntries.length, linkCounts, groupCounts };
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function buildBody(thisWeek, lastWeek, weekStart, weekEnd, ga4, ga4Error) {
  const lines = [];

  lines.push(`Récap semaine du ${fmtDate(weekStart)} au ${fmtDate(new Date(weekEnd - 86400000))}.`);
  lines.push('');

  // === Volume ===
  lines.push('═══ VOLUME ═══');
  const delta = thisWeek.total - lastWeek.total;
  const sign = delta > 0 ? '+' : (delta === 0 ? '' : '');
  lines.push(`Cette semaine : ${thisWeek.total} commentaires postés (semaine précédente : ${lastWeek.total}, delta ${sign}${delta}).`);
  const ratio = thisWeek.total > 0 ? Math.round(100 * thisWeek.withLink / thisWeek.total) : 0;
  lines.push(`Dont avec lien Enomia : ${thisWeek.withLink}/${thisWeek.total} (${ratio}%).`);
  lines.push('');

  // === Liens Enomia partagés ===
  lines.push('═══ LIENS ENOMIA PARTAGÉS ═══');
  const linkEntries = Object.entries(thisWeek.linkCounts).sort((a, b) => b[1].count - a[1].count);
  if (linkEntries.length === 0) {
    lines.push('(aucun lien Enomia partagé cette semaine)');
  } else {
    for (const [basePath, data] of linkEntries) {
      const utmList = [...data.utmContents];
      const utmStr = utmList.length ? ` — utm_content: ${utmList.join(', ')}` : ' — pas d\'UTM (commentaires antérieurs au tagging)';
      lines.push(`  ${data.count}× ${basePath}${utmStr}`);
    }
  }
  lines.push('');

  // === Répartition par groupe ===
  lines.push('═══ RÉPARTITION PAR GROUPE FB ═══');
  const groupEntries = Object.entries(thisWeek.groupCounts).sort((a, b) => b[1] - a[1]);
  if (groupEntries.length === 0) {
    lines.push('(aucun commentaire cette semaine)');
  } else {
    for (const [gid, count] of groupEntries) {
      const label = GROUPS_LABEL[gid] || gid;
      lines.push(`  ${count}× ${label} (${gid})`);
    }
  }
  lines.push('');

  // === GA4 ===
  lines.push('═══ GA4 — TRAFIC & ENGAGEMENT ═══');
  if (ga4) {
    if (ga4.facebookTotal) {
      lines.push(`Total trafic Facebook (toutes campagnes) : ${ga4.facebookTotal.sessions} sessions, dont ${ga4.facebookTotal.engagedSessions} engagées.`);
    }
    if (ga4.byUtmContent && ga4.byUtmContent.length > 0) {
      lines.push(`Détail par commentaire (utm_campaign=lcd-veille) :`);
      for (const r of ga4.byUtmContent) {
        const br = (r.bounceRate * 100).toFixed(0);
        const dur = r.avgDurationSec.toFixed(0);
        lines.push(`  ${r.utmContent} : ${r.sessions} sessions, bounce ${br}%, durée ${dur}s, engagées ${r.engagedSessions}${r.conversions > 0 ? `, conv ${r.conversions}` : ''}`);
      }
    } else {
      lines.push(`Aucune session attribuée à utm_campaign=lcd-veille cette semaine.`);
      lines.push(`(Normal si les UTM ont été ajoutés récemment — attendre 7 jours de data complète.)`);
    }
    if (ga4.error) {
      lines.push('');
      lines.push(`⚠️ Erreur partielle GA4 : ${ga4.error}`);
    }
  } else {
    lines.push(`(GA4 non disponible : ${ga4Error || 'OAuth scope analytics.readonly absent'}.`);
    lines.push(` Relance scripts/gsc-oauth-bootstrap.mjs pour étendre le scope.)`);
  }
  lines.push('');

  // === Note ===
  lines.push('---');
  lines.push('Apprentissages des retours Marc : voir scripts/rs-lcd/feedback-marc.md');
  lines.push('Pipeline complet : fb-daily-scan (7h17) → email valid → fb-watch → fb-post → ce récap (vendredi 17h)');

  return lines.join('\n');
}

function sendReport(subject, body) {
  execSync(
    `./scripts/tech-watchdog/send-report.sh "${subject.replace(/"/g, '\\"')}"`,
    { cwd: ROOT, input: body, encoding: 'utf8', stdio: ['pipe', 'inherit', 'inherit'] }
  );
}

async function main() {
  const archive = loadArchive();
  console.log(`Archive : ${archive.length} entrées`);

  // Cette semaine : derniers 7 jours
  const now = Date.now();
  const weekEnd = now;
  const weekStart = new Date(now - 7 * 86400000);
  // Semaine précédente : J-14 à J-7
  const lastWeekEnd = weekStart.getTime();
  const lastWeekStart = new Date(lastWeekEnd - 7 * 86400000);

  const thisWeekEntries = archive.filter(e => withinWindow(e, weekStart.getTime(), weekEnd));
  const lastWeekEntries = archive.filter(e => withinWindow(e, lastWeekStart.getTime(), lastWeekEnd));

  const thisWeek = computeStats(thisWeekEntries);
  const lastWeek = computeStats(lastWeekEntries);

  // GA4 stats (peut échouer si scope OAuth pas encore élargi)
  let ga4 = null;
  let ga4Error = null;
  try {
    const [byUtmContent, facebookTotal] = await Promise.all([
      fetchGa4WeeklyStats({ days: 7 }),
      fetchGa4FacebookTotal({ days: 7 }),
    ]);
    ga4 = { byUtmContent, facebookTotal };
  } catch (e) {
    ga4Error = e.message;
    console.warn(`GA4 indisponible : ${e.message}`);
  }

  const subject = `[FB veille hebdo] ${thisWeek.total} commentaires — semaine du ${fmtDate(weekStart)}`;
  const body = buildBody(thisWeek, lastWeek, weekStart, weekEnd, ga4, ga4Error);

  console.log(body);
  console.log('---');
  sendReport(subject, body);
  console.log(`✓ Récap envoyé : ${subject}`);
}

main().catch(e => { console.error(e); process.exit(1); });
