#!/usr/bin/env node
/**
 * Récupère le KD pour les villes conciergerie de city-backlog.json où kd=null.
 * Met à jour city-backlog.json en place.
 *
 * Usage : node scripts/semrush-fill-conciergerie-kd.mjs
 * Coût : ~85 unités SEMrush (villes sans kd)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function getApiKey() {
  if (process.env.SEMRUSH_API_KEY) return process.env.SEMRUSH_API_KEY.trim();
  const envPath = '/Users/marc/Desktop/Neocamino/.env';
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf-8');
    const m = env.match(/SEMRUSH_API_KEY=(.+)/);
    if (m) return m[1].trim();
  }
  process.exit(1);
}
const KEY = getApiKey();

async function semrushPhrase(phrase) {
  const url = `https://api.semrush.com/?type=phrase_this&key=${KEY}&phrase=${encodeURIComponent(phrase)}&database=fr&export_columns=Ph,Nq,Kd`;
  const res = await fetch(url);
  const text = await res.text();
  if (text.includes('ERROR')) return { error: text.trim() };
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { vol: 0, kd: 0 };
  const [_p, nq, kd] = lines[1].split(';');
  return { vol: parseInt(nq, 10) || 0, kd: parseInt(kd, 10) || 0 };
}

async function main() {
  const backlogPath = path.join(ROOT, 'scripts/city-backlog.json');
  const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));

  // Filtrer celles sans kd
  const toFix = backlog.filter(c => c.kd === null || c.kd === undefined);
  console.log(`📋 ${toFix.length} villes sans KD\n`);

  for (let i = 0; i < toFix.length; i++) {
    const c = toFix[i];
    // KW principal = "conciergerie airbnb [ville]" (ou tel quel si déjà spécifique)
    const kw = `conciergerie airbnb ${c.ville.toLowerCase().replace(/[''']/g, ' ').replace(/\s+/g, ' ').trim()}`;
    const r = await semrushPhrase(kw);
    if (r.error) {
      console.log(`[${i + 1}/${toFix.length}] ❌ ${c.ville} → ${r.error}`);
      continue;
    }
    // Update directly in backlog
    const idx = backlog.findIndex(b => b.num === c.num);
    if (idx !== -1) {
      backlog[idx].kd = r.kd;
      // Don't override vol (déjà mesuré avec d'autres patterns probablement)
    }
    console.log(`[${i + 1}/${toFix.length}] ✅ ${c.ville.padEnd(30)} kd=${r.kd}`);

    // Save every 20
    if ((i + 1) % 20 === 0) {
      fs.writeFileSync(backlogPath, JSON.stringify(backlog, null, 2));
      console.log(`   💾 Sauvegarde intermédiaire`);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  fs.writeFileSync(backlogPath, JSON.stringify(backlog, null, 2));
  console.log(`\n✅ city-backlog.json mis à jour avec KD`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
