#!/usr/bin/env node
/**
 * Passe IA (gate final) sur les candidats love room : pour chaque adresse, Claude lit les avis et renvoie
 *   { love_room: true|false, description: "2 phrases factuelles" }
 *   - love_room=false vire les hôtels classiques / day-spas / restos que les types Places ratent (ex. Les Bulles de Paris)
 *   - description = rédigée depuis les avis (factuelle, sans chiffre d'avis ni citation ni invention)
 *
 * ⚠️ COÛT (cf incident mai 2026) : modèle HAIKU + `ANTHROPIC_API_KEY` retiré de l'env enfant → OAuth Max (pas de $ au token).
 *    Contexte mini (nom + types + 4 avis tronqués). Résultats CACHÉS dans .loveroom-cache/ai-{slug}.json (idempotent).
 *
 * Usage :
 *   node scripts/loveroom-ai-pass.mjs --ville=toulouse --limit=3   # test
 *   node scripts/loveroom-ai-pass.mjs                               # toutes les villes
 *   node scripts/loveroom-ai-pass.mjs --force                       # recalcule (ignore le cache)
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, '.loveroom-cache');
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const FORCE = process.argv.includes('--force');
const only = arg('ville')?.split(',');
const limit = arg('limit') ? parseInt(arg('limit')) : Infinity;
const CONCURRENCY = 4;

const CITIES = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/loveroom-cities.json'), 'utf8'));
const score = (c) => (c.rating || 0) * Math.log10((c.reviews || 0) + 1);

function buildPrompt(c, cityName) {
  const reviews = (c.recentReviews || []).filter((r) => r.text).slice(0, 4).map((r) => '- ' + r.text.replace(/\s+/g, ' ').slice(0, 220)).join('\n');
  return `Tu classes un hébergement français. Réponds UNIQUEMENT par un objet JSON, rien d'autre :
{"love_room": true|false, "description": "..."}

"love_room" = true SI c'est une chambre / suite / gîte / loft / villa PRIVÉE qu'un couple loue pour une nuit romantique, avec jacuzzi ou spa à usage exclusif.
"love_room" = false si c'est : un HÔTEL classique (réception, nombreuses chambres, restaurant), un DAY-SPA / institut de massage (on n'y dort pas, prestations à l'heure), un restaurant, ou un camping.

"description" = 2 phrases factuelles en français décrivant le lieu (ambiance, équipements privatifs, points forts) À PARTIR DES AVIS. Interdit : chiffres d'avis, citations entre guillemets, informations inventées.

Nom : ${c.name}
Types Google : ${(c.types || []).join(', ')}
Commune : ${c.area} (près de ${cityName})
Avis clients :
${reviews || '(aucun avis)'}`;
}

function callClaude(prompt) {
  return new Promise((resolve) => {
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY; // → OAuth Max, pas de facturation au token
    const child = spawn('claude', ['-p', '--model', 'haiku'], { env, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', erro = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); resolve({ error: 'timeout' }); }, 60000);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (erro += d));
    child.on('close', () => {
      clearTimeout(timer);
      const m = out.match(/\{[\s\S]*\}/);
      if (!m) return resolve({ error: 'no-json', raw: (out || erro).slice(0, 120) });
      try { resolve(JSON.parse(m[0])); } catch { resolve({ error: 'bad-json', raw: m[0].slice(0, 120) }); }
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

async function processCity(cfg) {
  const srcFile = path.join(CACHE, `loveroom-source-${cfg.slug}.json`);
  if (!fs.existsSync(srcFile)) { console.log(`${cfg.slug}: pas de source`); return; }
  const cands = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
  // pool = candidats plausibles (high + note), top 12 par score → l'IA tranche + décrit
  const pool = cands
    .filter((c) => c.confidence === 'high' && c.rating >= 4 && (c.reviews || 0) >= 10)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 16)
    .slice(0, limit);

  const aiFile = path.join(CACHE, `ai-${cfg.slug}.json`);
  const aiCache = !FORCE && fs.existsSync(aiFile) ? JSON.parse(fs.readFileSync(aiFile, 'utf8')) : {};
  const todo = pool.filter((c) => !aiCache[c.name]);
  let done = 0;
  const queue = [...todo];
  async function worker() {
    while (queue.length) {
      const c = queue.shift();
      const res = await callClaude(buildPrompt(c, cfg.displayName));
      aiCache[c.name] = res.error ? { error: res.error, raw: res.raw } : { love_room: !!res.love_room, description: (res.description || '').trim() };
      done++;
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  fs.writeFileSync(aiFile, JSON.stringify(aiCache, null, 2));
  const kept = Object.values(aiCache).filter((v) => v.love_room).length;
  const rej = Object.values(aiCache).filter((v) => v.love_room === false).length;
  const errs = Object.values(aiCache).filter((v) => v.error).length;
  console.log(`${cfg.slug.padEnd(12)} : ${pool.length} pool · +${done} traités · love_room ${kept} / rejetés ${rej}${errs ? ` / erreurs ${errs}` : ''}`);
}

const targets = only ? CITIES.filter((c) => only.includes(c.slug)) : CITIES;
console.error(`🤖 Passe IA (Haiku, OAuth) sur ${targets.length} ville(s)…`);
for (const cfg of targets) await processCity(cfg);
console.log('✅ terminé');
