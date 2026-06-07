#!/usr/bin/env node
/**
 * Configure Brevo pour l'architecture de capture email Enomia.
 * Idempotent : ne recrée rien qui existe déjà.
 *
 * Crée :
 *   - 2 listes waitlist : "Waitlist - Site de réservation" et "Waitlist - Channel Manager"
 *   - 3 attributs contacts : OUTIL_TYPE (texte), SOURCES (texte), MULTI_INSCRIPTION (booléen)
 * Inspecte aussi l'existant (listes, dossiers, attributs) — utile pour clarifier la liste "Channel".
 *
 * Ce que le script NE fait PAS (impossible/risqué via API) :
 *   - les automations / workflows (le tag MULTI auto) → à faire dans l'UI Brevo
 *   - régler les env vars Vercel (BREVO_LIST_WAITLIST_SITE…) → à coller à la main (le script affiche les IDs)
 *
 * Usage (la clé reste chez toi) :
 *   BREVO_API_KEY=xxxxx node scripts/brevo-setup.mjs            # DRY-RUN (lecture seule)
 *   BREVO_API_KEY=xxxxx node scripts/brevo-setup.mjs --apply    # crée ce qui manque
 *
 * Récupère la clé : Vercel → Project → Settings → Environment Variables → BREVO_API_KEY.
 */

const API = 'https://api.brevo.com/v3';
const KEY = process.env.BREVO_API_KEY;
const APPLY = process.argv.includes('--apply');

if (!KEY) {
  console.error('❌ BREVO_API_KEY manquante.');
  console.error('   Lance : BREVO_API_KEY=xxxxx node scripts/brevo-setup.mjs [--apply]');
  process.exit(1);
}

const FOLDER_NAME = 'Enomia';
const LISTS = [
  { name: 'Waitlist - Site de réservation', env: 'BREVO_LIST_WAITLIST_SITE' },
  { name: 'Waitlist - Channel Manager', env: 'BREVO_LIST_WAITLIST_CM' },
];
const ATTRIBUTES = [
  { name: 'OUTIL_TYPE', type: 'text' },        // simulateur / facture / contrat
  { name: 'SOURCES', type: 'text' },           // historique des points d'entrée (CSV)
  { name: 'MULTI_INSCRIPTION', type: 'boolean' }, // inscrit à plusieurs endroits
];

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: { 'api-key': KEY, 'Content-Type': 'application/json', accept: 'application/json', ...(opts.headers || {}) },
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const msg = body && body.message ? body.message : text;
    const err = new Error(`${res.status} ${msg}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

async function paged(path, key) {
  let out = [], offset = 0;
  for (;;) {
    const r = await api(`${path}?limit=50&offset=${offset}`);
    const arr = (r && r[key]) || [];
    out = out.concat(arr);
    if (arr.length < 50) break;
    offset += 50;
  }
  return out;
}

(async () => {
  console.log(`\n🔎 Brevo — ${APPLY ? 'MODE APPLY (création activée)' : 'DRY-RUN (lecture seule — ajoute --apply pour créer)'}\n`);

  const [lists, folders, attrs] = await Promise.all([
    paged('/contacts/lists', 'lists'),
    paged('/contacts/folders', 'folders'),
    api('/contacts/attributes').then(r => r.attributes || []),
  ]);

  console.log(`Listes existantes (${lists.length}) :`);
  for (const l of lists) console.log(`  • [${l.id}] ${l.name}  (folder ${l.folderId}, ${l.uniqueSubscribers ?? '?'} contacts)`);
  console.log(`\nAttributs contacts : ${attrs.map(a => a.name).join(', ') || '(aucun)'}`);

  const attrNames = new Set(attrs.map(a => a.name));
  let folder = folders.find(f => f.name === FOLDER_NAME) || (lists[0] ? { id: lists[0].folderId } : null);
  const envOut = {};

  console.log('\n📋 Listes waitlist :');
  for (const spec of LISTS) {
    const existing = lists.find(l => l.name === spec.name);
    if (existing) {
      console.log(`  ✓ déjà là : "${spec.name}" → id ${existing.id}`);
      envOut[spec.env] = existing.id;
      continue;
    }
    if (!APPLY) { console.log(`  + à créer : "${spec.name}"  → ${spec.env}`); continue; }
    if (!folder) {
      const f = await api('/contacts/folders', { method: 'POST', body: JSON.stringify({ name: FOLDER_NAME }) });
      folder = { id: f.id };
      console.log(`  ↳ dossier "${FOLDER_NAME}" créé (id ${f.id})`);
    }
    const created = await api('/contacts/lists', { method: 'POST', body: JSON.stringify({ name: spec.name, folderId: folder.id }) });
    console.log(`  ✅ créée : "${spec.name}" → id ${created.id}  → ${spec.env}`);
    envOut[spec.env] = created.id;
  }

  console.log('\n🏷️  Attributs de segmentation :');
  for (const a of ATTRIBUTES) {
    if (attrNames.has(a.name)) { console.log(`  ✓ déjà là : ${a.name}`); continue; }
    if (!APPLY) { console.log(`  + à créer : ${a.name} (${a.type})`); continue; }
    try {
      await api(`/contacts/attributes/normal/${encodeURIComponent(a.name)}`, { method: 'POST', body: JSON.stringify({ type: a.type }) });
      console.log(`  ✅ créé : ${a.name} (${a.type})`);
    } catch (e) { console.log(`  ⚠️  ${a.name} : ${e.message}`); }
  }

  console.log('\n🔧 À coller dans Vercel (Settings → Environment Variables) :');
  for (const spec of LISTS) {
    console.log(`  ${spec.env}=${envOut[spec.env] != null ? envOut[spec.env] : '(relance avec --apply pour créer la liste)'}`);
  }

  console.log(APPLY
    ? '\n✅ Terminé. Colle les IDs dans Vercel + redéploie. Reste l\'automation "tag MULTI" à faire dans l\'UI Brevo.'
    : '\nℹ️  DRY-RUN : rien créé. Relance avec --apply pour exécuter.');
})().catch(e => { console.error('\n❌ Erreur :', e.message); process.exit(1); });
