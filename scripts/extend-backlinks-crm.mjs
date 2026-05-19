#!/usr/bin/env node
/**
 * Phase 1 du plan D — étend le schéma CRM `.claude/backlinks-data.json`
 * pour supporter le pipeline complet (envoi, tracking réponses, relances,
 * backlinks obtenus).
 *
 * Cf `global/plan_backlinks_full_pipeline.md` (memory enomia-memory).
 *
 * Choix de nommage (hybride pragmatique validé Marc 2026-05-19) :
 * - Garde `email` (déjà rempli pour quelques prospects, déjà écrit par la routine)
 * - Renomme `date_relance` → `date_relance_1` (vide partout, sans risque)
 * - Garde `reponse` (vide partout) avec convention enum {null|positive|negative|spam}
 * - Ajoute les champs réellement manquants
 *
 * Idempotent : rejouable sans casser quoi que ce soit.
 *
 * Usage : node scripts/extend-backlinks-crm.mjs [--dry]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CRM_PATH = path.join(ROOT, '.claude', 'backlinks-data.json');

const DRY = process.argv.includes('--dry');

const NEW_FIELDS = [
  'url_formulaire',
  'date_relance_1',
  'date_relance_2',
  'date_reponse',
  'backlink_url',
  'backlink_date_obtention',
  'dernier_contact',
];

const TODAY = new Date().toISOString().slice(0, 10);

function main() {
  if (!fs.existsSync(CRM_PATH)) {
    console.error(`❌ CRM introuvable : ${CRM_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(CRM_PATH, 'utf-8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data.prospects)) {
    console.error('❌ data.prospects n\'est pas un array');
    process.exit(1);
  }

  const stats = {
    total: data.prospects.length,
    renamed_date_relance: 0,
    added_field: Object.fromEntries(NEW_FIELDS.map(f => [f, 0])),
    already_migrated: 0,
  };

  for (const p of data.prospects) {
    let touched = false;

    // 1. Rename date_relance → date_relance_1 (idempotent)
    if (Object.prototype.hasOwnProperty.call(p, 'date_relance')) {
      if (!Object.prototype.hasOwnProperty.call(p, 'date_relance_1')) {
        p.date_relance_1 = p.date_relance;
        stats.renamed_date_relance++;
        touched = true;
      }
      delete p.date_relance;
    }

    // 2. Add missing new fields (null par défaut)
    for (const field of NEW_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(p, field)) {
        p[field] = null;
        stats.added_field[field]++;
        touched = true;
      }
    }

    if (!touched) stats.already_migrated++;
  }

  data.lastUpdate = TODAY;

  if (DRY) {
    console.log('🟡 DRY RUN — aucune écriture');
  } else {
    const backupPath = CRM_PATH + '.bak-pre-phase1';
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, raw, 'utf-8');
      console.log(`📦 Backup créé : ${path.relative(ROOT, backupPath)}`);
    } else {
      console.log(`📦 Backup déjà présent (préservé) : ${path.relative(ROOT, backupPath)}`);
    }
    fs.writeFileSync(CRM_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`✅ CRM mis à jour : ${path.relative(ROOT, CRM_PATH)}`);
  }

  console.log('\n— Récap —');
  console.log(`Prospects total           : ${stats.total}`);
  console.log(`date_relance → _1 renommé : ${stats.renamed_date_relance}`);
  for (const f of NEW_FIELDS) {
    console.log(`+ ${f.padEnd(24)}: ${stats.added_field[f]}`);
  }
  console.log(`Déjà migrés (no-op)       : ${stats.already_migrated}`);
  console.log(`lastUpdate                : ${data.lastUpdate}`);
}

main();
