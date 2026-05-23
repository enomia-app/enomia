#!/usr/bin/env node
/**
 * Export batch de tous les formulaires à remplir par Marc.
 *
 * Pour chaque prospect avec is_blog=true + url_formulaire + status=pending :
 *   - Scan page + Haiku → 1 phrase d'observation
 *   - Choisit outil via chooseOutilToPitch (règle conciergerie + cross-outils)
 *   - Build pitch via template
 *   - QA pré-pitch
 *   - Stocke pitch_body + pitch_subject + outil_pitche dans le backlog
 *   - Status → manual_form_batched (pour que send-daily quotidien skip)
 *
 * Envoie ENSUITE 1 mail récap à Marc avec :
 *   - Tous les formulaires prêts (URL + pitch intégral copier-coller)
 *   - Numérotés 1 à N pour suivi
 *
 * Usage :
 *   node scripts/backlinks-send-daily/export-all-forms.mjs
 *   node scripts/backlinks-send-daily/export-all-forms.mjs --max=20  (test)
 *   node scripts/backlinks-send-daily/export-all-forms.mjs --dry
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';
import { buildPitch, qaPitch, chooseOutilToPitch } from './pitch-templates.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const MAX = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] || '999', 10);

function readEnvKey(key) {
  if (process.env[key]) return process.env[key].trim();
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const m = fs.readFileSync(envPath, 'utf-8').match(new RegExp(`^${key}=(.+)$`, 'm'));
    if (m) return m[1].trim();
  }
  return null;
}
const ANTHROPIC_KEY = readEnvKey('ANTHROPIC_API_KEY');

const TODAY = new Date().toISOString().slice(0, 10);
const MONTH = TODAY.slice(0, 7);
const BACKLOG_PATH = path.join(ROOT, 'data', `backlinks-${MONTH}.json`);

const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Helpers fetch/scan (copy from send-daily) ───────────────────────────
async function fetchHtmlDecoded(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36', 'Accept': 'text/html' } });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    const ct = r.headers.get('content-type') || '';
    let charset = ct.match(/charset=([^;\s]+)/i)?.[1]?.toLowerCase() || null;
    if (!charset) {
      const head = buf.slice(0, 4000).toString('utf-8');
      charset = head.match(/<meta[^>]*charset=["']?([^"'>\s]+)/i)?.[1]?.toLowerCase()
        || head.match(/<meta[^>]*content=["'][^"']*charset=([^"';\s]+)/i)?.[1]?.toLowerCase()
        || null;
    }
    if (charset && charset !== 'utf-8' && charset !== 'utf8') {
      try { return new TextDecoder(charset).decode(buf); } catch {}
    }
    return buf.toString('utf-8');
  } catch { return null; }
}

function validatePrenom(raw, siteDomain = null) {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').split(/\s+/)[0];
  if (cleaned.length < 2 || cleaned.length > 20) return null;
  if (/\d/.test(cleaned)) return null;
  if (!/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'-]+$/.test(cleaned)) return null;
  if (cleaned === cleaned.toUpperCase()) return null;
  if (!/^[A-ZÀ-Ý][a-zà-ÿ]/.test(cleaned)) return null;
  if (cleaned.length > 12 && !/['-]/.test(cleaned)) return null;
  const lower = cleaned.toLowerCase();
  const normalize = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const normPrenom = normalize(cleaned);
  if (siteDomain) {
    const SKIP = new Set(['www', 'blog', 'news', 'shop', 'store', 'app', 'mail', 'le-blog', 'magazine', 'journal', 'com', 'fr', 'net', 'org', 'co', 'io', 'eu', 'be', 'ch', 'ca']);
    const segments = normalize(siteDomain).split('.').filter(s => s.length >= 4 && !SKIP.has(s));
    for (const seg of segments) {
      if (normPrenom.includes(seg) || seg.includes(normPrenom)) return null;
    }
  }
  const brandSuffixes = ['bnb', 'airbnb', 'host', 'stay', 'rental', 'rentals', 'casa', 'loca', 'rent', 'immo', 'pro', 'app', 'tech', 'fr', 'paris'];
  for (const s of brandSuffixes) {
    if (lower.endsWith(s) && lower.length > s.length + 2) return null;
  }
  const blacklist = ['admin', 'administrator', 'administrateur', 'contact', 'service', 'support', 'team', 'équipe', 'equipe', 'webmaster', 'noreply', 'no-reply', 'editor', 'éditeur', 'editeur', 'rédaction', 'redaction', 'newsletter', 'info', 'hello', 'salut', 'bonjour', 'auteur', 'author', 'rédacteur', 'redacteur', 'journaliste', 'staff', 'membre', 'invité', 'utilisateur', 'user', 'visiteur', 'google', 'github', 'wordpress', 'wpbakery', 'finsweet', 'webflow', 'elementor', 'divi', 'gutenberg', 'yoast', 'shopify', 'wix', 'category', 'tag', 'archive', 'post', 'page', 'going', 'enomia', 'site', 'article', 'blog', 'partager', 'mentions', 'légales', 'legales', 'département', 'departements', 'départements', 'departement', 'région', 'conditions', 'minut', 'société', 'societe', 'groupe', 'marque', 'entreprise', 'association', 'agence', 'agency', 'office', 'cabinet', 'studio'];
  if (blacklist.some(b => lower === b)) return null;
  return cleaned;
}

async function scanPage(url) {
  const html = await fetchHtmlDecoded(url);
  if (!html) return null;
  let siteDomain = null;
  try { siteDomain = new URL(url).hostname.replace(/^www\./, ''); } catch {}

  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const og = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const rawTitle = (h1 || og || t || '').replace(/<[^>]+>/g, '').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').trim();

  const textOnly = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);

  const candidates = [
    html.match(/"author"\s*:\s*{[^}]*"name"\s*:\s*"([^"]+?)"/i)?.[1],
    html.match(/(?:écrit|posté|publié|rédigé)\s+par\s+<[^>]*>\s*([A-ZÀ-Ý][a-zà-ÿ'-]+)/i)?.[1],
    html.match(/(?:écrit|posté|publié|rédigé)\s+par\s+([A-ZÀ-Ý][a-zà-ÿ'-]+)\b/i)?.[1],
    html.match(/<(?:span|a|div|p)[^>]+(?:class|itemprop)=["'][^"']*\b(?:author|byline)\b[^"']*["'][^>]*>\s*([A-ZÀ-Ý][a-zà-ÿ'-]+)/i)?.[1],
  ];
  let prenom = null;
  for (const c of candidates) {
    const v = validatePrenom(c, siteDomain);
    if (v) { prenom = v; break; }
  }
  return { title: rawTitle, text: textOnly, prenom };
}

async function generateObservation({ title, text, outil }) {
  if (!ANTHROPIC_KEY) return 'L\'angle abordé est intéressant.';
  const outilContext = { simulateur: 'simulateur de rentabilité gratuit', contrat: 'modèle de contrat de location saisonnière gratuit', facture: 'générateur de factures gratuit', taxe_sejour: 'calculateur de taxe de séjour gratuit' }[outil] || 'outil';
  const prompt = `Tu lis un article de blog sur la location courte durée / Airbnb. Tu dois écrire UNE SEULE phrase d'observation courte (8-15 mots) sur le contenu, qui sera utilisée dans un email de prospection.

Règles STRICTES :
- 1 seule phrase, 8-15 mots
- En français, vouvoiement implicite
- Observation honnête sur 1 point précis
- PAS de superlatif, PAS de tirets cadratins (—), pas de flèches (→), pas d'emoji
- Ton humain, comme un confrère qui commente
- Doit pouvoir s'enchaîner après : J'ai lu votre article "[titre]". <TA_PHRASE> Nous avons développé...

Titre : "${title}"

Contenu (extrait) :
${text.slice(0, 2000)}

Outil pitché : ${outilContext}.

Réponds UNIQUEMENT par la phrase, sans guillemets, sans intro.`;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: 'claude-haiku-4-5', max_tokens: 80, messages: [{ role: 'user', content: prompt }] }) });
    if (!r.ok) return 'L\'angle abordé est intéressant.';
    const d = await r.json();
    return d.content?.[0]?.text?.trim().replace(/^["']|["']$/g, '') || 'L\'angle abordé est intéressant.';
  } catch { return 'L\'angle abordé est intéressant.'; }
}

// ─── Main ───────────────────────────────────────────────────────────────
async function main() {
  log(`🚀 Export batch formulaires ${TODAY} ${DRY ? '(DRY)' : ''}`);

  const backlog = JSON.parse(fs.readFileSync(BACKLOG_PATH, 'utf-8'));
  const forms = backlog.candidates.filter(c =>
    c.status === 'pending'
    && c.is_blog === true
    && c.url_formulaire
    && !c.email  // ceux avec email sont gérés par send-daily quotidien
  ).slice(0, MAX);

  log(`📋 ${forms.length} formulaires à préparer`);
  if (forms.length === 0) {
    log('rien à faire.');
    return;
  }

  const prepared = [];
  const skipped = [];

  for (let i = 0; i < forms.length; i++) {
    const c = forms[i];
    log(`\n[${i + 1}/${forms.length}] ${c.site}`);

    const outil = chooseOutilToPitch({
      outils_presents: c.outils_presents || [],
      is_conciergerie: c.is_conciergerie || false,
      kw_origin_bucket: c.kw_origin_bucket,
    });
    if (!outil) {
      c.status = 'skip_all_tools_present';
      skipped.push({ ...c, reason: 'tous_outils_presents_ou_conciergerie_simulateur' });
      log(`  ⏭ skip (no outil dispo)`);
      continue;
    }

    const page = await scanPage(c.url_formulaire || c.page_cible);
    // Note: on scan plutôt la page_cible (article) que le formulaire, pour avoir le bon titre
    const article = await scanPage(c.page_cible);
    const titre = article?.title || page?.title;
    if (!titre) {
      c.status = 'page_unreadable';
      skipped.push({ ...c, reason: 'page_unreadable' });
      log(`  ⏭ page unreadable`);
      continue;
    }
    log(`  📄 titre: "${titre.slice(0, 60)}..."`);

    const observation = await generateObservation({ title: titre, text: article?.text || '', outil });
    log(`  💬 obs: "${observation.slice(0, 80)}..."`);

    const pitch = buildPitch({ outil, prenom: article?.prenom, titre, observation });
    const qa = qaPitch(pitch);
    if (!qa.ok) {
      c.status = 'qa_fail';
      skipped.push({ ...c, reason: 'qa_fail', qa_reasons: qa.reasons });
      log(`  ⏭ qa_fail: ${qa.reasons.join(', ')}`);
      continue;
    }

    c.outil_pitche = outil;
    c.pitch_subject = pitch.subject;
    c.pitch_body = pitch.body;
    c.status = 'manual_form_batched';
    c.batched_at = new Date().toISOString();
    prepared.push({ ...c });
    log(`  ✓ pitch prêt (outil=${outil})`);
  }

  // Sauvegarde backlog
  if (!DRY) fs.writeFileSync(BACKLOG_PATH, JSON.stringify(backlog, null, 2));

  // Envoi mail batch
  if (!DRY && prepared.length > 0) {
    await sendBatchMail(prepared, skipped);
  }

  log(`\n✅ Done. ${prepared.length} pitches prêts, ${skipped.length} skippés.`);
}

async function sendBatchMail(prepared, skipped) {
  const TOKEN_PATH = path.join(process.env.HOME, '.config/gcloud/enomia-gsc-token.json');
  const t = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  const oauth2 = new google.auth.OAuth2(t.client_id, t.client_secret);
  oauth2.setCredentials({ refresh_token: t.refresh_token });
  const gm = google.gmail({ version: 'v1', auth: oauth2 });

  const subject = `[backlinks BATCH] ${prepared.length} formulaires prêts à remplir (~${Math.round(prepared.length * 1.2)} min)`;

  const body = `Salut Marc,

Voici les ${prepared.length} formulaires prêts à remplir d'un coup quand tu veux.

Estimation : ~1 min par formulaire bien rythmé = ~${Math.round(prepared.length)}-${Math.round(prepared.length * 1.5)} min.
Conseil : 2 onglets ouverts, copier-coller du Subject + Body, submit, suivant.

⚠ Pas de risque domaine email — les formulaires ne passent pas par ton Gmail.

═══════════════════════════════════════════════════════════════
${prepared.map((c, i) => `
${i + 1}/${prepared.length}. ${c.site}  [outil: ${c.outil_pitche}]
   Formulaire : ${c.url_formulaire}
   Article    : ${c.page_cible}
   Subject    : ${c.pitch_subject}
   Pitch :
${c.pitch_body.split('\n').map(l => '   ' + l).join('\n')}
───────────────────────────────────────────────────────────────`).join('')}

${skipped.length ? `\n\n⏭ Skippés (${skipped.length}) :\n${skipped.map(c => `  • ${c.site} : ${c.reason}`).join('\n')}` : ''}

Les ${prepared.length} prospects sont marqués 'manual_form_batched' dans le backlog → le pipeline quotidien ne les repropose pas.
Quand tu en as envoyé un, pas besoin de mettre à jour le backlog, on suit la réponse via Gmail si le destinataire répond.
`;

  const subjectEncoded = '=?UTF-8?B?' + Buffer.from(subject, 'utf8').toString('base64') + '?=';
  const raw = [
    'From: Marc Chenut <marc@enomia.app>',
    'To: marc@enomia.app',
    'Subject: ' + subjectEncoded,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    body,
  ].join('\r\n');
  const encoded = Buffer.from(raw, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const res = await gm.users.messages.send({ userId: 'me', requestBody: { raw: encoded } });
  log(`📧 Mail batch envoyé (gmail ${res.data.id})`);
}

main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });
