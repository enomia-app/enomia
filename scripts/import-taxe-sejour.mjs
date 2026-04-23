#!/usr/bin/env node
// Import annuel du fichier DELTA/OCSITAN (data.gouv.fr) dans Supabase.
// Usage : node scripts/import-taxe-sejour.mjs [--csv=path] [--dry-run]
//
// Sans --csv : télécharge le CSV courant depuis data.gouv.fr.
// Filtre : garde pour chaque (commune, hébergement, période) la délibération
// la plus récente dont la DATE FIN n'est pas passée.

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { createClient } from '@supabase/supabase-js';

const DATASET_CSV_URL =
  'https://www.data.gouv.fr/api/1/datasets/r/4a9b526c-bd7f-4634-89d2-76f0fe7fa536';
const DEFAULT_CSV_PATH = path.resolve(
  process.cwd(),
  'data/taxe-sejour/delta-latest.csv'
);
const BATCH = 1000;

function parseArgs(argv) {
  const out = { csv: null, dryRun: false };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--csv=')) out.csv = a.slice(6);
    else if (a === '--dry-run') out.dryRun = true;
  }
  return out;
}

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
}

async function downloadCsv(dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  console.log(`[download] ${DATASET_CSV_URL} → ${dest}`);
  const res = await fetch(DATASET_CSV_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log(`[download] ${(buf.length / 1024 / 1024).toFixed(1)} MB`);
  return dest;
}

function toInsee(dept, commune) {
  const d = (dept ?? '').trim();
  const c = (commune ?? '').trim();
  if (!d || !c) return null;
  if (d.length === 3) return d + c.padStart(2, '0');
  return d + c.padStart(3, '0');
}

function slugifyHebergement(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function parseNumber(s) {
  if (s == null || s === '') return null;
  const n = parseFloat(String(s).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

async function readCsvRows(csvPath, onRow) {
  const stream = fs.createReadStream(csvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let header = null;
  let count = 0;
  for await (let line of rl) {
    if (!line) continue;
    if (line.charCodeAt(0) === 0xfeff) line = line.slice(1); // strip BOM
    const cols = line.split(';');
    if (!header) {
      header = cols;
      continue;
    }
    if (cols.length < 30) continue;
    onRow(cols);
    count++;
    if (count % 50000 === 0) process.stdout.write(`\r[parse] ${count} rows…`);
  }
  process.stdout.write(`\r[parse] ${count} rows total          \n`);
  return count;
}

async function main() {
  loadEnv();
  const { csv, dryRun } = parseArgs(process.argv);
  const SUPA_URL = process.env.SUPABASE_URL;
  const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dryRun && (!SUPA_URL || !SUPA_KEY)) {
    throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env');
  }

  const supabase = dryRun ? null : createClient(SUPA_URL, SUPA_KEY, {
    auth: { persistSession: false }
  });

  const csvPath = csv || (fs.existsSync(DEFAULT_CSV_PATH)
    ? DEFAULT_CSV_PATH
    : await downloadCsv(DEFAULT_CSV_PATH));

  const currentYear = new Date().getFullYear();
  // key: code_insee|hebergement_slug|periode → best row (max annee, not expired)
  const best = new Map();
  const communes = new Map(); // code_insee → {libelle, departement}

  let totalRows = 0;
  let maxAnnee = 0;

  const parsedCount = await readCsvRows(csvPath, (cols) => {
    totalRows++;
    const dept = cols[7];
    const commune = cols[8];
    const libCommune = cols[9];
    const hebergement = cols[13];
    const regime = cols[14];
    const tarif = parseNumber(cols[15]);
    const unite = cols[16] || '€';
    const taxeDep = parseNumber(cols[17]);
    const tarifTotal = parseNumber(cols[23]) ?? tarif;
    const periode = cols[24] || '01-01 - 31-12';
    const dateEffet = parseInt(cols[4], 10);
    const dateFin = cols[5] ? parseInt(cols[5], 10) : null;

    if (!dept || !commune || !libCommune || !hebergement || tarif == null) return;
    if (dateFin && dateFin < currentYear - 1) return; // tarif périmé

    const codeInsee = toInsee(dept, commune);
    if (!codeInsee) return;

    if (dateEffet > maxAnnee) maxAnnee = dateEffet;

    if (!communes.has(codeInsee)) {
      communes.set(codeInsee, { libelle: libCommune.trim(), departement: dept.trim() });
    }

    const slug = slugifyHebergement(hebergement);
    const key = `${codeInsee}|${slug}|${periode}`;
    const existing = best.get(key);
    if (!existing || dateEffet > existing.annee) {
      best.set(key, {
        code_insee: codeInsee,
        annee: dateEffet,
        hebergement: hebergement.trim(),
        hebergement_slug: slug,
        regime: (regime || 'Réel').trim(),
        tarif,
        tarif_total: tarifTotal,
        unite: unite.trim(),
        periode: periode.trim(),
        taxe_dep_pct: taxeDep,
        taxe_region_pct: null
      });
    }
  });

  console.log(`[dedup] ${best.size} tarifs actifs pour ${communes.size} communes (source: ${totalRows} lignes, dernière année ${maxAnnee})`);

  if (dryRun) {
    console.log('[dry-run] aucun écrit en BDD');
    console.log('[sample communes]', [...communes.entries()].slice(0, 3));
    console.log('[sample tarifs]', [...best.values()].slice(0, 3));
    return;
  }

  // Log start of import run
  const { data: runRow, error: runErr } = await supabase
    .from('ts_import_runs')
    .insert({
      source_url: DATASET_CSV_URL,
      annee_source: maxAnnee,
      status: 'running'
    })
    .select('id')
    .single();
  if (runErr) throw runErr;
  const runId = runRow.id;

  try {
    // Upsert communes
    const communeRows = [...communes.entries()].map(([code_insee, v]) => ({
      code_insee,
      libelle: v.libelle,
      departement: v.departement,
      has_tarif: true,
      updated_at: new Date().toISOString()
    }));

    for (let i = 0; i < communeRows.length; i += BATCH) {
      const batch = communeRows.slice(i, i + BATCH);
      const { error } = await supabase
        .from('ts_communes')
        .upsert(batch, { onConflict: 'code_insee' });
      if (error) throw error;
      process.stdout.write(`\r[upsert communes] ${i + batch.length}/${communeRows.length}`);
    }
    process.stdout.write('\n');

    // Wipe tarifs existants pour ne pas accumuler vieux millésimes puis réinsertion batch
    const { error: delErr } = await supabase.from('ts_tarifs').delete().gte('id', 0);
    if (delErr) throw delErr;

    const tarifRows = [...best.values()];
    for (let i = 0; i < tarifRows.length; i += BATCH) {
      const batch = tarifRows.slice(i, i + BATCH);
      const { error } = await supabase.from('ts_tarifs').insert(batch);
      if (error) throw error;
      process.stdout.write(`\r[insert tarifs]   ${i + batch.length}/${tarifRows.length}`);
    }
    process.stdout.write('\n');

    await supabase
      .from('ts_import_runs')
      .update({
        status: 'ok',
        rows_imported: tarifRows.length,
        communes_count: communeRows.length,
        finished_at: new Date().toISOString()
      })
      .eq('id', runId);

    console.log(`[done] ${tarifRows.length} tarifs, ${communeRows.length} communes — import #${runId} OK`);
  } catch (err) {
    await supabase
      .from('ts_import_runs')
      .update({
        status: 'error',
        error_message: String(err?.message || err),
        finished_at: new Date().toISOString()
      })
      .eq('id', runId);
    throw err;
  }
}

main().catch((e) => {
  console.error('[fatal]', e);
  process.exit(1);
});
