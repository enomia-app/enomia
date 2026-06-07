#!/usr/bin/env node
/**
 * Passe IA (gate final) sur les candidats cabane : pour chaque adresse, Claude lit les avis et renvoie
 *   { cabane: true|false, description: "2 phrases factuelles" }
 *   - cabane=false vire les hôtels classiques / campings classiques / restos / constructeurs de cabanes
 *   - description = rédigée depuis les avis (factuelle, sans chiffre d'avis ni citation ni invention)
 *
 * ⚠️ COÛT (cf incident mai 2026) : modèle HAIKU + ANTHROPIC_API_KEY retiré → OAuth Max (pas de $ au token).
 *    Résultats CACHÉS dans .cabane-cache/ai-{slug}.json (idempotent, réessaie les erreurs).
 *
 * Usage : node scripts/cabane-ai-pass.mjs --zone=bretagne,vosges   |   --force
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, '.cabane-cache');
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const FORCE = process.argv.includes('--force');
const only = arg('zone')?.split(',');
const limit = arg('limit') ? parseInt(arg('limit')) : Infinity;
const CONCURRENCY = 4;
let runTotal = 0, runErr = 0;

const ZONES = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/cabane-zones.json'), 'utf8'));
const score = (c) => (c.rating || 0) * Math.log10((c.reviews || 0) + 1);

function buildPrompt(c, zoneName) {
  const reviews = (c.recentReviews || []).filter((r) => r.text).slice(0, 4).map((r) => '- ' + r.text.replace(/\s+/g, ' ').slice(0, 220)).join('\n');
  return `Tu classes un hébergement français. Réponds UNIQUEMENT par un objet JSON, rien d'autre :
{"cabane": true|false, "description": "..."}

"cabane" = true SI c'est une cabane, cabane perchée, cabane dans les arbres, cabane dans les bois, lodge nature ou hébergement insolite PRIVÉ qu'on loue pour la nuit (couple ou famille), en pleine nature.
"cabane" = false si c'est : un HÔTEL classique, un CAMPING classique (mobil-homes, emplacements tente), un RESTAURANT, un magasin/constructeur/vendeur de cabanes (on n'y dort pas), un parc accrobranche sans hébergement, ou une location à la journée.

"description" = 2 phrases factuelles en français décrivant le lieu (cadre nature, équipements, points forts) À PARTIR DES AVIS. Interdit : chiffres d'avis, citations entre guillemets, informations inventées.

Nom : ${c.name}
Types Google : ${(c.types || []).join(', ')}
Lieu : ${c.area} (zone ${zoneName})
Avis clients :
${reviews || '(aucun avis)'}`;
}

function callClaude(prompt) {
  return new Promise((resolve) => {
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY; // → OAuth Max
    const child = spawn('claude', ['-p', '--model', 'haiku', '--dangerously-skip-permissions', '--output-format', 'text'], { env, stdio: ['pipe', 'pipe', 'pipe'] });
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

async function processZone(cfg) {
  const srcFile = path.join(CACHE, `cabane-source-${cfg.slug}.json`);
  if (!fs.existsSync(srcFile)) { console.log(`${cfg.slug}: pas de source`); return; }
  const cands = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
  const pool = cands
    .filter((c) => c.confidence === 'high' && c.rating >= 4 && (c.reviews || 0) >= 10)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 16)
    .slice(0, limit);

  const aiFile = path.join(CACHE, `ai-${cfg.slug}.json`);
  const aiCache = !FORCE && fs.existsSync(aiFile) ? JSON.parse(fs.readFileSync(aiFile, 'utf8')) : {};
  const todo = pool.filter((c) => !aiCache[c.name] || aiCache[c.name].error);
  let done = 0;
  const queue = [...todo];
  async function worker() {
    while (queue.length) {
      const c = queue.shift();
      const res = await callClaude(buildPrompt(c, cfg.displayName));
      aiCache[c.name] = res.error ? { error: res.error, raw: res.raw } : { cabane: !!res.cabane, description: (res.description || '').trim() };
      runTotal++; if (res.error) runErr++;
      done++;
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  fs.writeFileSync(aiFile, JSON.stringify(aiCache, null, 2));
  const kept = Object.values(aiCache).filter((v) => v.cabane).length;
  const rej = Object.values(aiCache).filter((v) => v.cabane === false).length;
  const errs = Object.values(aiCache).filter((v) => v.error).length;
  console.log(`${cfg.slug.padEnd(18)} : ${pool.length} pool · +${done} traités · cabane ${kept} / rejetés ${rej}${errs ? ` / erreurs ${errs}` : ''}`);
}

const targets = only ? ZONES.filter((c) => only.includes(c.slug)) : ZONES;
console.error(`🤖 Passe IA (Haiku, OAuth) sur ${targets.length} zone(s)…`);
for (const cfg of targets) await processZone(cfg);
if (runTotal > 0 && runErr / runTotal > 0.5) {
  console.error(`🚫 ai-pass: ${runErr}/${runTotal} appels en échec — auth claude probable (relancer \`claude\` sur le Mac mini). Code 1.`);
  process.exit(1);
}
console.log('✅ terminé');
