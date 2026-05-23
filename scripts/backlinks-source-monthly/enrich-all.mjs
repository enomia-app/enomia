#!/usr/bin/env node
/**
 * One-shot enrichment script : re-fetch tous les candidats du backlog
 * qui n'ont pas encore une qualification complète (is_blog défini).
 *
 * Pour chaque candidat :
 *   - Re-fetch la page cible
 *   - Détecte outils_presents, is_conciergerie, is_blog (detectAll)
 *   - Extrait email + url_formulaire (extractContact)
 *
 * Le send-daily quotidien n'a plus qu'à piocher : tout est qualifié à l'avance.
 *
 * Usage :
 *   node scripts/backlinks-source-monthly/enrich-all.mjs
 *   node scripts/backlinks-source-monthly/enrich-all.mjs --concurrency=5  (default 5)
 *   node scripts/backlinks-source-monthly/enrich-all.mjs --force            (re-fetch même si déjà ok)
 *   node scripts/backlinks-source-monthly/enrich-all.mjs --month=2026-05    (default = mois courant)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectAll, extractContact } from './filters.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const args = process.argv.slice(2);
const CONCURRENCY = parseInt(args.find(a => a.startsWith('--concurrency='))?.split('=')[1] || '5', 10);
const FORCE = args.includes('--force');
const MONTH = args.find(a => a.startsWith('--month='))?.split('=')[1] || new Date().toISOString().slice(0, 7);
const BACKLOG_PATH = path.join(ROOT, 'data', `backlinks-${MONTH}.json`);

const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (!fs.existsSync(BACKLOG_PATH)) {
  console.error(`❌ ${BACKLOG_PATH} introuvable`);
  process.exit(1);
}

async function fetchAllInParallel(items, fn, concurrency, onProgress) {
  const results = new Array(items.length);
  let inFlight = 0, nextIdx = 0, done = 0;
  return new Promise(resolve => {
    const launch = () => {
      while (inFlight < concurrency && nextIdx < items.length) {
        const idx = nextIdx++;
        inFlight++;
        fn(items[idx], idx).then(r => {
          results[idx] = r;
          inFlight--;
          done++;
          if (onProgress) onProgress(done, items.length);
          if (done === items.length) resolve(results);
          else launch();
        });
      }
    };
    if (items.length === 0) resolve([]);
    else launch();
  });
}

async function main() {
  log(`🚀 Enrich-all ${MONTH} (concurrency=${CONCURRENCY}${FORCE ? ', FORCE' : ''})`);

  const backlog = JSON.parse(fs.readFileSync(BACKLOG_PATH, 'utf-8'));
  const total = backlog.candidates.length;

  // Sélectionne ceux à enrichir
  // SKIP les déjà status='sent' / 'bounced' / 'manual_form' etc. (déjà traités)
  const toEnrich = backlog.candidates.filter(c => {
    if (['sent', 'bounced', 'manual_form', 'repondu_positif', 'repondu_negatif', 'repondu_spam', 'repondu_neutre', 'pas_de_reponse', 'relance_1', 'relance_2'].includes(c.status)) return false;
    if (FORCE) return true;
    // Re-fetch si is_blog n'est pas défini OU fetch_status pas 'ok'
    return c.is_blog === undefined || c.fetch_status !== 'ok';
  });

  log(`📋 ${toEnrich.length}/${total} candidats à enrichir (${total - toEnrich.length} skippés : déjà traités ou déjà enrichis)`);

  if (toEnrich.length === 0) {
    log('Rien à faire.');
    return;
  }

  // Enrichissement parallèle
  await fetchAllInParallel(toEnrich, async (c) => {
    const det = await detectAll(c.page_cible, c.site);
    if (det) {
      c.outils_presents = det.tools;
      c.is_conciergerie = det.is_conciergerie;
      c.is_blog = det.is_blog;
      c.fetch_status = 'ok';
      // Extract contact uniquement si pas déjà connu
      if (!c.email && !c.url_formulaire) {
        const contact = await extractContact(c.page_cible);
        c.email = contact.email;
        c.url_formulaire = contact.url_formulaire;
      }
    } else {
      c.fetch_status = 'fail';
      c.outils_presents = c.outils_presents || [];
      c.is_blog = c.is_blog ?? false;
      c.is_conciergerie = c.is_conciergerie ?? false;
    }
    c.enriched_at = new Date().toISOString();
    return c;
  }, CONCURRENCY, (done, total) => {
    if (done % 50 === 0 || done === total) log(`  ${done}/${total} enrichis`);
  });

  // Sauvegarde
  fs.writeFileSync(BACKLOG_PATH, JSON.stringify(backlog, null, 2));
  log(`✅ Sauvegardé : ${BACKLOG_PATH}`);

  // ─── Stats finales ─────────────────────────────────────────────────────
  const all = backlog.candidates;
  const blogs = all.filter(c => c.is_blog === true);
  const services = all.filter(c => c.is_blog === false);
  const fetchOk = all.filter(c => c.fetch_status === 'ok');
  const fetchFail = all.filter(c => c.fetch_status === 'fail');
  const blogsWithEmail = blogs.filter(c => c.email);
  const blogsWithForm = blogs.filter(c => !c.email && c.url_formulaire);
  const blogsNoContact = blogs.filter(c => !c.email && !c.url_formulaire);
  const conciergeries = all.filter(c => c.is_conciergerie);
  const blogsConciergeries = blogs.filter(c => c.is_conciergerie);

  log(`\n📊 Bilan final backlog ${MONTH} :`);
  log(`  Total candidats        : ${all.length}`);
  log(`  Fetch OK               : ${fetchOk.length}`);
  log(`  Fetch fail             : ${fetchFail.length}`);
  log(`  Conciergeries (toutes) : ${conciergeries.length}`);
  log(``);
  log(`  ✅ Blogs               : ${blogs.length}  (cibles pitchables)`);
  log(`     dont avec email     : ${blogsWithEmail.length}  (envoi auto Gmail)`);
  log(`     dont avec formulaire: ${blogsWithForm.length}  (Marc remplit manuel)`);
  log(`     dont conciergeries  : ${blogsConciergeries.length}  (pitch simulateur uniquement)`);
  log(`     dont no_contact     : ${blogsNoContact.length}  (perdus)`);
  log(``);
  log(`  ❌ Sites service       : ${services.length}  (skippés au send)`);
  log(`  ❓ Non qualifiés       : ${all.length - blogs.length - services.length}  (fetch_fail ou autres)`);
  log(``);
  log(`  Runway envois auto sur les blogs avec email :`);
  log(`    ${blogsWithEmail.length} envois disponibles × ramp-up 5→30/j`);
  log(`    Sem 1-2 (5-8/j) = ${blogsWithEmail.length / 7 | 0} sem environ`);
}

main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });
